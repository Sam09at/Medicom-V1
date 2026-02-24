import { supabase } from '../supabase';
import { LabOrder, LabContact } from '../../types';

// --- LAB CONTACTS ---

export const getLabContacts = async (tenantId: string) => {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('lab_contacts')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .order('name');

  if (error) throw error;

  return data.map((c: any) => ({
    id: c.id,
    tenantId: c.tenant_id,
    name: c.name,
    contactPerson: c.contact_person,
    phone: c.phone,
    email: c.email,
    address: c.address,
    notes: c.notes,
    isActive: c.is_active,
  })) as LabContact[];
};

export const createLabContact = async (contact: Partial<LabContact>) => {
  if (!supabase) throw new Error('Supabase not initialized');

  const { data, error } = await supabase
    .from('lab_contacts')
    .insert([
      {
        tenant_id: contact.tenantId,
        name: contact.name,
        contact_person: contact.contactPerson,
        phone: contact.phone,
        email: contact.email,
        address: contact.address,
        notes: contact.notes,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// --- LAB ORDERS ---

export const getLabOrders = async (tenantId: string) => {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('lab_orders')
    .select(
      `
            *,
            patient:patients(first_name, last_name),
            lab:lab_contacts(name)
        `
    )
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data.map((o: any) => ({
    id: o.id,
    tenantId: o.tenant_id,
    patientId: o.patient_id,
    patientName: o.patient ? `${o.patient.first_name} ${o.patient.last_name}` : 'Inconnu',
    labContactId: o.lab_contact_id,
    labName: o.lab ? o.lab.name : 'Inconnu',
    doctorId: o.doctor_id,
    orderDate: o.order_date,
    dueDate: o.due_date,
    status: o.status,
    type: o.type,
    toothNumbers: o.tooth_numbers || [],
    shade: o.shade,
    description: o.description,
    cost: o.cost,
    createdAt: o.created_at,
    updatedAt: o.updated_at,
  })) as LabOrder[];
};

export const createLabOrder = async (order: Partial<LabOrder>) => {
  if (!supabase) throw new Error('Supabase not initialized');

  const { data, error } = await supabase
    .from('lab_orders')
    .insert([
      {
        tenant_id: order.tenantId,
        patient_id: order.patientId,
        lab_contact_id: order.labContactId,
        doctor_id: (await supabase.auth.getUser()).data.user?.id,
        order_date: order.orderDate || new Date().toISOString(),
        due_date: order.dueDate,
        status: 'Sent',
        type: order.type,
        tooth_numbers: order.toothNumbers,
        shade: order.shade,
        description: order.description,
        cost: order.cost || 0,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateLabOrderStatus = async (id: string, status: string) => {
  if (!supabase) throw new Error('Supabase not initialized');

  const { data, error } = await supabase
    .from('lab_orders')
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};
