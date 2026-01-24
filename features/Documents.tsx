
import React, { useState } from 'react';
import { IconSearch, IconFilter, IconCloudUpload, IconFolder, IconImage, IconFileText, IconEye, IconDownload, IconTrash, IconX, IconCheck, IconPlus, IconWand } from '../components/Icons';
import { MOCK_DOCUMENTS, MOCK_PATIENTS } from '../constants';
import { MedicalDocument } from '../types';
import { SlideOver } from '../components/SlideOver';

export const Documents = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('All');
  const [documents, setDocuments] = useState<MedicalDocument[]>(MOCK_DOCUMENTS);
  
  // Upload State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadData, setUploadData] = useState({
      file: null as File | null,
      patientId: '',
      type: 'Radio'
  });

  // Generator State
  const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);
  const [genData, setGenData] = useState({
      patientId: '',
      template: 'Certificat Médical',
      content: ''
  });

  const TEMPLATES = {
      'Certificat Médical': "Je soussigné, Dr. Amina, certifie que l'état de santé de {PATIENT} nécessite un repos de 3 jours à compter du {DATE}.",
      'Lettre d\'orientation': "Cher Confrère,\n\nJe vous adresse {PATIENT} pour une évaluation spécialisée concernant une pathologie parodontale.\n\nCordialement,\nDr. Amina",
      'Justificatif de Présence': "Je soussigné, Dr. Amina, certifie que {PATIENT} était présent(e) en consultation le {DATE} de 10h à 11h."
  };

  const handleTemplateChange = (template: string, patientId: string) => {
      const patient = MOCK_PATIENTS.find(p => p.id === patientId);
      let text = TEMPLATES[template as keyof typeof TEMPLATES] || '';
      if(patient) {
          text = text.replace('{PATIENT}', `${patient.firstName} ${patient.lastName}`);
      }
      text = text.replace('{DATE}', new Date().toLocaleDateString('fr-FR'));
      setGenData({ ...genData, template, content: text, patientId });
  };

  const handleGenerate = () => {
      const patient = MOCK_PATIENTS.find(p => p.id === genData.patientId);
      const newDoc: MedicalDocument = {
          id: `doc-gen-${Date.now()}`,
          fileName: `${genData.template}.pdf`,
          patientName: patient ? `${patient.firstName} ${patient.lastName}` : 'Inconnu',
          type: 'Certificat',
          date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
          size: '12 KB'
      };
      setDocuments([newDoc, ...documents]);
      setIsGeneratorOpen(false);
  };

  const filteredDocs = documents.filter(doc => {
    const matchesSearch = doc.patientName.toLowerCase().includes(searchQuery.toLowerCase()) || doc.fileName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'All' || doc.type === filterType;
    return matchesSearch && matchesType;
  });

  const handleDelete = (id: string) => {
    if (confirm('Voulez-vous vraiment supprimer ce document ?')) {
      setDocuments(documents.filter(d => d.id !== id));
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          setUploadData({ ...uploadData, file: e.dataTransfer.files[0] });
      }
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!uploadData.file) return;
      
      const patient = MOCK_PATIENTS.find(p => p.id === uploadData.patientId);
      const newDoc: MedicalDocument = {
          id: `doc-${Date.now()}`,
          fileName: uploadData.file.name,
          patientName: patient ? `${patient.firstName} ${patient.lastName}` : 'Inconnu',
          type: uploadData.type as any,
          date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
          size: `${(uploadData.file.size / 1024 / 1024).toFixed(1)} MB`
      };
      
      setDocuments([newDoc, ...documents]);
      setIsUploadModalOpen(false);
      setUploadData({ file: null, patientId: '', type: 'Radio' });
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'Radio': return <IconImage className="w-8 h-8 text-purple-500" />;
      case 'Ordonnance': return <IconFileText className="w-8 h-8 text-blue-500" />;
      default: return <IconFileText className="w-8 h-8 text-slate-500" />;
    }
  };

  return (
    <div className="space-y-6 font-sans relative">
      {/* Upload Modal */}
      {isUploadModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsUploadModalOpen(false)}></div>
              <div className="bg-white rounded-lg shadow-xl w-full max-w-md relative z-10 p-6 space-y-6 animate-in fade-in zoom-in-95 duration-200">
                  <div className="flex justify-between items-center">
                      <h3 className="text-lg font-bold text-slate-900">Importer un document</h3>
                      <button onClick={() => setIsUploadModalOpen(false)}><IconX className="w-5 h-5 text-slate-400" /></button>
                  </div>
                  
                  <form onSubmit={handleUploadSubmit} className="space-y-4">
                      {/* Drag Drop Area */}
                      <div 
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={handleFileDrop}
                        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${uploadData.file ? 'border-green-300 bg-green-50' : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'}`}
                      >
                          {uploadData.file ? (
                              <div>
                                  <IconCheck className="w-10 h-10 text-green-500 mx-auto mb-2" />
                                  <p className="text-sm font-medium text-slate-900">{uploadData.file.name}</p>
                                  <button type="button" onClick={() => setUploadData({...uploadData, file: null})} className="text-xs text-red-500 mt-2 hover:underline">Changer</button>
                              </div>
                          ) : (
                              <div>
                                  <IconCloudUpload className="w-10 h-10 text-slate-400 mx-auto mb-2" />
                                  <p className="text-sm font-medium text-slate-700">Glissez un fichier ici</p>
                                  <p className="text-xs text-slate-400 mt-1">ou cliquez pour parcourir</p>
                                  <input 
                                    type="file" 
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    onChange={(e) => e.target.files && setUploadData({...uploadData, file: e.target.files[0]})}
                                  />
                              </div>
                          )}
                      </div>

                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Patient concerné</label>
                          <select 
                            required
                            className="w-full border-slate-300 rounded-md p-2.5 text-sm border focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                            value={uploadData.patientId}
                            onChange={e => setUploadData({...uploadData, patientId: e.target.value})}
                          >
                              <option value="">Sélectionner...</option>
                              {MOCK_PATIENTS.map(p => (
                                  <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                              ))}
                          </select>
                      </div>

                      <div>
                          <label className="block text-sm font-medium text-slate-700 mb-1">Type de document</label>
                          <div className="grid grid-cols-3 gap-2">
                              {['Radio', 'Ordonnance', 'Analyse', 'Certificat', 'Autre'].map(type => (
                                  <button 
                                    key={type}
                                    type="button"
                                    onClick={() => setUploadData({...uploadData, type})}
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
                        className="w-full py-2.5 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                    className="w-full border-slate-300 rounded-md p-2 text-sm border bg-white"
                    value={genData.patientId}
                    onChange={(e) => handleTemplateChange(genData.template, e.target.value)}
                  >
                      <option value="">Choisir un patient...</option>
                      {MOCK_PATIENTS.map(p => (
                          <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                      ))}
                  </select>
              </div>

              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Modèle</label>
                  <div className="grid grid-cols-1 gap-2">
                      {Object.keys(TEMPLATES).map(tmpl => (
                          <button 
                            key={tmpl}
                            onClick={() => handleTemplateChange(tmpl, genData.patientId)}
                            className={`text-left px-3 py-2 rounded-md text-sm border transition-colors ${genData.template === tmpl ? 'bg-blue-50 border-blue-200 text-blue-700 font-medium' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
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
                    className="w-full border-slate-300 rounded-md p-3 text-sm border font-mono bg-slate-50 focus:bg-white transition-colors"
                    value={genData.content}
                    onChange={(e) => setGenData({...genData, content: e.target.value})}
                  />
              </div>

              <div className="pt-4 flex gap-3">
                  <button onClick={() => setIsGeneratorOpen(false)} className="flex-1 py-2 text-sm font-medium text-slate-700 border border-slate-300 rounded-md hover:bg-slate-50">Annuler</button>
                  <button onClick={handleGenerate} className="flex-1 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 shadow-sm flex justify-center items-center gap-2">
                      <IconCheck className="w-4 h-4" /> Générer & Enregistrer
                  </button>
              </div>
          </div>
      </SlideOver>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Documents Médicaux (GED)</h2>
          <p className="text-sm text-slate-500 mt-1">Gérez et centralisez tous les fichiers de vos patients.</p>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={() => setIsGeneratorOpen(true)}
                className="inline-flex items-center gap-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm"
            >
            <IconWand className="w-4 h-4" />
            Nouveau Document
            </button>
            <button 
                onClick={() => setIsUploadModalOpen(true)}
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm"
            >
            <IconCloudUpload className="w-4 h-4" />
            Uploader
            </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-3 rounded-md border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
         <div className="relative flex-1 w-full sm:max-w-md">
            <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Rechercher par nom de patient ou fichier..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
         </div>
         <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
            {['All', 'Radio', 'Ordonnance', 'Analyse', 'Certificat'].map(type => (
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
        <div className="flex flex-col items-center justify-center h-64 bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg">
           <IconFolder className="w-12 h-12 text-slate-300 mb-3" />
           <p className="text-slate-500 font-medium">Aucun document trouvé</p>
           <p className="text-xs text-slate-400">Essayez de modifier vos filtres</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredDocs.map(doc => (
            <div key={doc.id} className="group bg-white rounded-lg border border-slate-200 hover:border-blue-300 shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden">
               <div className="aspect-[4/3] bg-slate-50 flex items-center justify-center border-b border-slate-100 relative">
                  {getIconForType(doc.type)}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 gap-2">
                     <button className="p-2 bg-white rounded-full shadow text-slate-700 hover:text-blue-600"><IconEye className="w-4 h-4" /></button>
                     <button className="p-2 bg-white rounded-full shadow text-slate-700 hover:text-green-600"><IconDownload className="w-4 h-4" /></button>
                  </div>
               </div>
               <div className="p-4 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-1">
                     <span className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded border ${
                       doc.type === 'Radio' ? 'bg-purple-50 text-purple-700 border-purple-100' : 
                       'bg-blue-50 text-blue-700 border-blue-100'
                     }`}>{doc.type}</span>
                     <button onClick={() => handleDelete(doc.id)} className="text-slate-300 hover:text-red-500 transition-colors"><IconTrash className="w-3.5 h-3.5" /></button>
                  </div>
                  <h3 className="text-sm font-medium text-slate-900 truncate" title={doc.fileName}>{doc.fileName}</h3>
                  <p className="text-xs text-slate-500 mb-3">{doc.patientName}</p>
                  
                  <div className="mt-auto flex justify-between items-center text-[10px] text-slate-400">
                     <span>{doc.date}</span>
                     <span>{doc.size}</span>
                  </div>
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
