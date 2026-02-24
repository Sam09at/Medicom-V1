import React, { useState, useEffect } from 'react';
import {
  IconSearch,
  IconFilter,
  IconCloudUpload,
  IconFolder,
  IconImage,
  IconFileText,
  IconEye,
  IconDownload,
  IconTrash,
  IconX,
  IconCheck,
  IconPlus,
  IconWand,
} from '../components/Icons';
import { useMedicomStore } from '../store';
import { usePatients } from '../hooks/usePatients';
import { getDocuments, uploadDocument, deleteDocument, getSignedUrl } from '../lib/api/documents';
import { Document } from '../types';
import { SlideOver } from '../components/SlideOver';

// Keeping local TEMPLATES for now - generator logic is mostly UI-side for this MVP
const TEMPLATES = {
  'Certificat Médical':
    "Je soussigné, Dr. Amina, certifie que l'état de santé de {PATIENT} nécessite un repos de 3 jours à compter du {DATE}.",
  "Lettre d'orientation":
    'Cher Confrère,\n\nJe vous adresse {PATIENT} pour une évaluation spécialisée concernant une pathologie parodontale.\n\nCordialement,\nDr. Amina',
  'Justificatif de Présence':
    'Je soussigné, Dr. Amina, certifie que {PATIENT} était présent(e) en consultation le {DATE} de 10h à 11h.',
};

const CATEGORY_MAP: Record<string, Document['category']> = {
  Radio: 'xray',
  Ordonnance: 'prescription',
  Analyse: 'scan',
  Certificat: 'report',
  Autre: 'other',
};

const REVERSE_CATEGORY_MAP: Record<string, string> = {
  xray: 'Radio',
  prescription: 'Ordonnance',
  scan: 'Analyse',
  report: 'Certificat',
  id: 'ID',
  insurance: 'Assurance',
  other: 'Autre',
};

export const Documents = () => {
  const { currentTenant, showToast } = useMedicomStore();
  const { patients } = usePatients(100); // Helper to get patients for dropdown
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('All');

  // Upload State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadData, setUploadData] = useState({
    file: null as File | null,
    patientId: '',
    type: 'Radio',
  });

  // Generator State
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [genData, setGenData] = useState({
    patientId: '',
    template: 'Certificat Médical',
    content: '',
  });

  const loadDocuments = async () => {
    if (!currentTenant) return;
    setLoading(true);
    try {
      const docs = await getDocuments(currentTenant.id);
      setDocuments(docs);
    } catch (error) {
      console.error('Error loading documents:', error);
      showToast({ type: 'error', message: 'Erreur lors du chargement des documents' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [currentTenant]);

  const handleTemplateChange = (template: string, patientId: string) => {
    const patient = patients.find((p) => p.id === patientId);
    let text = TEMPLATES[template as keyof typeof TEMPLATES] || '';
    if (patient) {
      text = text.replace('{PATIENT}', `${patient.firstName} ${patient.lastName}`);
    }
    text = text.replace('{DATE}', new Date().toLocaleDateString('fr-FR'));
    setGenData({ ...genData, template, content: text, patientId });
  };

  const handleGenerate = async () => {
    if (!genData.patientId || !genData.content) return;

    try {
      // Create a text file from content
      const blob = new Blob([genData.content], { type: 'text/plain' });
      const file = new File([blob], `${genData.template.replace(/\s+/g, '_')}_${Date.now()}.txt`, {
        type: 'text/plain',
      });

      await uploadDocument(file, {
        tenantId: currentTenant!.id,
        patientId: genData.patientId,
        category: 'report',
        isGenerated: true,
      });

      showToast({ type: 'success', message: 'Document généré avec succès' });
      setIsGeneratorOpen(false);
      loadDocuments();
    } catch (error) {
      console.error('Generate error', error);
      showToast({ type: 'error', message: 'Erreur lors de la génération' });
    }
  };

  const handleDelete = async (id: string, filePath: string) => {
    if (confirm('Voulez-vous vraiment supprimer ce document ?')) {
      try {
        await deleteDocument(id, filePath);
        setDocuments((prev) => prev.filter((d) => d.id !== id));
        showToast({ type: 'success', message: 'Document supprimé' });
      } catch (error) {
        console.error('Delete error', error);
        showToast({ type: 'error', message: 'Erreur lors de la suppression' });
      }
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setUploadData({ ...uploadData, file: e.dataTransfer.files[0] });
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadData.file || !uploadData.patientId || !currentTenant) return;

    try {
      const category = CATEGORY_MAP[uploadData.type] || 'other';
      await uploadDocument(uploadData.file, {
        tenantId: currentTenant.id,
        patientId: uploadData.patientId,
        category: category,
      });

      showToast({ type: 'success', message: 'Document importé avec succès' });
      setIsUploadModalOpen(false);
      setUploadData({ file: null, patientId: '', type: 'Radio' });
      loadDocuments();
    } catch (error) {
      console.error('Upload error', error);
      showToast({ type: 'error', message: "Erreur lors de l'import" });
    }
  };

  const handleView = async (doc: Document) => {
    try {
      const url = await getSignedUrl(doc.filePath);
      if (url) window.open(url, '_blank');
      else showToast({ type: 'error', message: "Impossible de récupérer l'URL du document" });
    } catch (e) {
      console.error(e);
    }
  };

  // Filtering logic
  const filteredDocs = documents.filter((doc) => {
    const docTypeLabel = REVERSE_CATEGORY_MAP[doc.category] || 'Autre';
    const matchesSearch =
      (doc.patientName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'All' || docTypeLabel === filterType;
    // Also allow matching raw category if needed, but UI uses Labels
    return matchesSearch && matchesType;
  });

  const getIconForCategory = (category: string) => {
    switch (category) {
      case 'xray':
        return <IconImage className="w-8 h-8 text-purple-500" />;
      case 'prescription':
        return <IconFileText className="w-8 h-8 text-blue-500" />;
      case 'scan':
        return <IconImage className="w-8 h-8 text-indigo-500" />;
      case 'report':
        return <IconFileText className="w-8 h-8 text-green-500" />;
      default:
        return <IconFileText className="w-8 h-8 text-slate-500" />;
    }
  };

  if (loading && documents.length === 0) {
    return <div className="p-8 text-center text-slate-500">Chargement des documents...</div>;
  }

  return (
    <div className="space-y-6 font-sans relative">
      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setIsUploadModalOpen(false)}
          ></div>
          <div className="bg-white rounded-[8px] shadow-xl w-full max-w-md relative z-10 p-6 space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900">Importer un document</h3>
              <button onClick={() => setIsUploadModalOpen(false)}>
                <IconX className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4">
              {/* Drag Drop Area */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
                className={`border-2 border-dashed rounded-[30px] p-8 text-center transition-colors ${uploadData.file ? 'border-green-300 bg-green-50' : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'}`}
              >
                {uploadData.file ? (
                  <div>
                    <IconCheck className="w-10 h-10 text-green-500 mx-auto mb-2" />
                    <p className="text-sm font-medium text-slate-900">{uploadData.file.name}</p>
                    <button
                      type="button"
                      onClick={() => setUploadData({ ...uploadData, file: null })}
                      className="text-xs text-red-500 mt-2 hover:underline"
                    >
                      Changer
                    </button>
                  </div>
                ) : (
                  <div>
                    <IconCloudUpload className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm font-medium text-slate-700">Glissez un fichier ici</p>
                    <p className="text-xs text-slate-400 mt-1">ou cliquez pour parcourir</p>
                    <input
                      type="file"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={(e) =>
                        e.target.files && setUploadData({ ...uploadData, file: e.target.files[0] })
                      }
                    />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Patient concerné
                </label>
                <select
                  required
                  className="w-full border-slate-300 rounded-[8px] p-2.5 text-sm border focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  value={uploadData.patientId}
                  onChange={(e) => setUploadData({ ...uploadData, patientId: e.target.value })}
                >
                  <option value="">Sélectionner...</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Type de document
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['Radio', 'Ordonnance', 'Analyse', 'Certificat', 'Autre'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setUploadData({ ...uploadData, type })}
                      className={`py-1.5 text-xs font-medium rounded border ${uploadData.type === type ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                disabled={!uploadData.file}
                className="w-full py-2.5 bg-blue-600 text-white rounded-[8px] font-medium hover:bg-blue-700 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Importer le fichier
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Generator SlideOver */}
      <SlideOver
        isOpen={isGeneratorOpen}
        onClose={() => setIsGeneratorOpen(false)}
        title="Générateur de Documents"
        subtitle="Créer un document depuis un modèle"
      >
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Patient</label>
            <select
              className="w-full border-slate-300 rounded-[8px] p-2 text-sm border bg-white"
              value={genData.patientId}
              onChange={(e) => handleTemplateChange(genData.template, e.target.value)}
            >
              <option value="">Choisir un patient...</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.firstName} {p.lastName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Modèle</label>
            <div className="grid grid-cols-1 gap-2">
              {Object.keys(TEMPLATES).map((tmpl) => (
                <button
                  key={tmpl}
                  onClick={() => handleTemplateChange(tmpl, genData.patientId)}
                  className={`text-left px-3 py-2 rounded-[30px] text-sm border transition-colors ${genData.template === tmpl ? 'bg-blue-50 border-blue-200 text-blue-700 font-medium' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  {tmpl}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Aperçu & Édition</label>
            <textarea
              rows={8}
              className="w-full border-slate-300 rounded-[8px] p-3 text-sm border font-mono bg-slate-50 focus:bg-white transition-colors"
              value={genData.content}
              onChange={(e) => setGenData({ ...genData, content: e.target.value })}
            />
          </div>

          <div className="pt-4 flex gap-3">
            <button
              onClick={() => setIsGeneratorOpen(false)}
              className="flex-1 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-[30px] hover:bg-slate-50"
            >
              Annuler
            </button>
            <button
              onClick={handleGenerate}
              className="flex-1 py-2 text-sm font-medium text-white bg-blue-600 rounded-[8px] hover:bg-blue-700 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] flex justify-center items-center gap-2"
            >
              <IconCheck className="w-4 h-4" /> Générer & Enregistrer
            </button>
          </div>
        </div>
      </SlideOver>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Documents Médicaux (GED)</h2>
          <p className="text-sm text-slate-500 mt-1">
            Gérez et centralisez tous les fichiers de vos patients.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsGeneratorOpen(true)}
            className="inline-flex items-center gap-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-[30px] text-sm font-medium transition-colors shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)]"
          >
            <IconWand className="w-4 h-4" />
            Nouveau Document
          </button>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-[8px] text-sm font-medium transition-colors shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)]"
          >
            <IconCloudUpload className="w-4 h-4" />
            Uploader
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-3 rounded-[8px] border border-slate-200 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full sm:max-w-md">
          <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par nom de patient ou fichier..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-[8px] focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {['All', 'Radio', 'Ordonnance', 'Analyse', 'Certificat'].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors whitespace-nowrap ${
                filterType === type
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {type === 'All' ? 'Tous' : type}
            </button>
          ))}
        </div>
      </div>

      {/* Documents Grid */}
      {filteredDocs.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[8px]">
          <IconFolder className="w-12 h-12 text-slate-300 mb-3" />
          <p className="text-slate-500 font-medium">Aucun document trouvé</p>
          <p className="text-xs text-slate-400">
            Essayez de modifier vos filtres ou d'importer un fichier.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredDocs.map((doc) => {
            const label = REVERSE_CATEGORY_MAP[doc.category] || 'Autre';
            return (
              <div
                key={doc.id}
                className="group bg-white rounded-[8px] border border-slate-200 hover:border-blue-300 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] hover:shadow-md transition-all flex flex-col overflow-hidden"
              >
                <div className="aspect-[4/3] bg-slate-50 flex items-center justify-center border-b border-slate-100 relative">
                  {getIconForCategory(doc.category)}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 gap-2">
                    <button
                      onClick={() => handleView(doc)}
                      className="p-2 bg-white rounded-full shadow text-slate-700 hover:text-blue-600"
                      title="Voir"
                    >
                      <IconEye className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleView(doc)}
                      className="p-2 bg-white rounded-full shadow text-slate-700 hover:text-green-600"
                      title="Télécharger"
                    >
                      <IconDownload className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-1">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded border ${
                        doc.category === 'xray'
                          ? 'bg-purple-50 text-purple-700 border-purple-100'
                          : doc.category === 'prescription'
                            ? 'bg-blue-50 text-blue-700 border-blue-100'
                            : 'bg-slate-50 text-slate-700 border-slate-100'
                      }`}
                    >
                      {label}
                    </span>
                    <button
                      onClick={() => handleDelete(doc.id, doc.filePath)}
                      className="text-slate-300 hover:text-red-500 transition-colors"
                    >
                      <IconTrash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <h3 className="text-sm font-medium text-slate-900 truncate" title={doc.name}>
                    {doc.name}
                  </h3>
                  <p className="text-xs text-slate-500 mb-3">{doc.patientName}</p>

                  <div className="mt-auto flex justify-between items-center text-[10px] text-slate-400">
                    <span>{new Date(doc.createdAt).toLocaleDateString('fr-FR')}</span>
                    <span>{(doc.fileSize / 1024).toFixed(0)} KB</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
