import { supabase } from '../supabase';
import { Document } from '../../types';

const BUCKET_NAME = 'medicom-documents';

export const getDocuments = async (tenantId: string, patientId?: string) => {
  if (!supabase) return [];

  let query = supabase
    .from('documents')
    .select(
      `
            *,
            patient:patients(first_name, last_name)
        `
    )
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (patientId) {
    query = query.eq('patient_id', patientId);
  }

  const { data, error } = await query;

  if (error) throw error;

  // Enhance with signed URLs for immediate display if needed
  // For large lists, we might want to do this on demand or in batches
  // For now, let's just return the metadata, and have a helper for the URL

  return data.map((doc: any) => ({
    id: doc.id,
    tenantId: doc.tenant_id,
    patientId: doc.patient_id,
    patientName: doc.patient ? `${doc.patient.first_name} ${doc.patient.last_name}` : 'Inconnu',
    uploadedBy: doc.uploaded_by,
    name: doc.name,
    filePath: doc.file_path,
    fileType: doc.file_type,
    fileSize: doc.file_size,
    category: doc.category,
    isGenerated: doc.is_generated,
    createdAt: doc.created_at,
  })) as Document[];
};

export const getSignedUrl = async (filePath: string) => {
  if (!supabase) return null;
  const { data, error } = await supabase.storage.from(BUCKET_NAME).createSignedUrl(filePath, 3600); // 1 hour expiry

  if (error) {
    console.error('Error getting signed URL', error);
    return null;
  }
  return data.signedUrl;
};

export const uploadDocument = async (
  file: File,
  metadata: {
    tenantId: string;
    patientId: string;
    category: string;
    isGenerated?: boolean;
  }
) => {
  if (!supabase) throw new Error('Supabase not initialized');

  // 1. Upload to Storage
  // Path: {tenantId}/{patientId}/{uuid}/{filename}
  const fileExt = file.name.split('.').pop();
  const fileName = `${file.name.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.${fileExt}`;
  const filePath = `${metadata.tenantId}/${metadata.patientId}/${crypto.randomUUID()}/${fileName}`;

  const { error: uploadError } = await supabase.storage.from(BUCKET_NAME).upload(filePath, file);

  if (uploadError) throw uploadError;

  // 2. Insert into DB
  const { data, error: dbError } = await supabase
    .from('documents')
    .insert([
      {
        tenant_id: metadata.tenantId,
        patient_id: metadata.patientId,
        name: file.name,
        file_path: filePath,
        file_type: file.type,
        file_size: file.size,
        category: metadata.category,
        is_generated: metadata.isGenerated || false,
        uploaded_by: (await supabase.auth.getUser()).data.user?.id,
      },
    ])
    .select()
    .single();

  if (dbError) {
    // Cleanup storage if DB insert fails
    await supabase.storage.from(BUCKET_NAME).remove([filePath]);
    throw dbError;
  }

  return data;
};

export const deleteDocument = async (id: string, filePath: string) => {
  if (!supabase) throw new Error('Supabase not initialized');

  // 1. Delete from DB
  const { error: dbError } = await supabase.from('documents').delete().eq('id', id);

  if (dbError) throw dbError;

  // 2. Delete from Storage
  // We do this after DB to ensure UI updates. Orphaned files can be cleaned up later if needed.
  const { error: storageError } = await supabase.storage.from(BUCKET_NAME).remove([filePath]);

  if (storageError) {
    console.warn('Failed to delete file from storage', storageError);
  }
};
