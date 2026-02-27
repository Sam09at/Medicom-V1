import React, { useState, useRef } from 'react';
import { Patient } from '../types';
import {
    IconSearch,
    IconCalendar,
    IconPhone,
    IconMessage,
    IconFileText,
    IconAlertOctagon,
    IconPlus,
    IconUserPlus,
    IconCreditCard,
    IconFolder,
    IconX,
    IconMoreHorizontal,
    IconFilter,
    IconClock,
    IconTooth,
    IconDownload,
    IconEye,
    IconTrash,
    IconUsers
} from '../components/Icons';
import { SlideOver } from '../components/SlideOver';
import { cn } from '../lib/utils';
import { MOCK_APPOINTMENTS, MOCK_DOCUMENTS } from '../constants';
import { useNavigate } from 'react-router-dom';
import { usePatients } from '../hooks/usePatients';

interface PatientListProps {
    patients: Patient[];
}

const MOCK_PATIENT_INVOICES = [
    { id: 'F-101', date: '2024-01-24', amount: 450, status: 'Paid', items: 'Consultation' },
    { id: 'F-102', date: '2023-12-15', amount: 1200, status: 'Pending', items: 'Soins Carie' },
    { id: 'F-103', date: '2023-11-20', amount: 300, status: 'Paid', items: 'Contrôle' },
];

export const PatientList: React.FC = () => {
    const navigate = useNavigate();
    const { patients, isLoading, totalCount, filters, setSearch: setSearchQuery, create, update } = usePatients();
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const searchQuery = filters.search;
    const [activeTab, setActiveTab] = useState('overview');

    // Create Patient State
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newPatient, setNewPatient] = useState({
        firstName: '', lastName: '', phone: '', email: '', dateOfBirth: '', gender: 'M' as 'M' | 'F', insuranceType: 'None', city: '', address: '', allergies: [] as string[], pathologies: [] as string[], notes: ''
    });

    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<typeof newPatient | null>(null);

    const [csvPreview, setCsvPreview] = useState<string[][]>([]);
    const [csvFile, setCsvFile] = useState<File | null>(null);
    const [isImportOpen, setIsImportOpen] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const filteredPatients = patients.filter(p =>
        p.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.phone.includes(searchQuery)
    );

    const handleCreatePatient = async (e: React.FormEvent) => {
        e.preventDefault();
        await create({
            firstName: newPatient.firstName,
            lastName: newPatient.lastName,
            phone: newPatient.phone || undefined,
            email: newPatient.email || undefined,
            dateOfBirth: newPatient.dateOfBirth || undefined,
            gender: newPatient.gender as "M" | "F",
            insuranceType: newPatient.insuranceType as 'CNOPS' | 'CNSS' | 'Private' | 'None',
            city: newPatient.city || undefined,
            address: newPatient.address || undefined,
            allergies: newPatient.allergies,
            pathologies: newPatient.pathologies,
            notes: newPatient.notes || undefined,
        });

        setIsCreateOpen(false);
        setNewPatient({ firstName: '', lastName: '', phone: '', email: '', dateOfBirth: '', gender: 'M', insuranceType: 'None', city: '', address: '', allergies: [], pathologies: [], notes: '' });
    };

    const handleSaveEdit = async () => {
        if (!selectedPatient || !editData) return;
        const updated = await update(selectedPatient.id, {
            ...editData,
            gender: editData.gender as "M" | "F",
            insuranceType: editData.insuranceType as 'CNOPS' | 'CNSS' | 'Private' | 'None',
            phone: editData.phone || undefined,
            email: editData.email || undefined,
            dateOfBirth: editData.dateOfBirth || undefined,
        });
        if (updated) {
            setSelectedPatient(updated);
            setIsEditing(false);
        }
    };

    const getPatientAppointments = (patientId: string) => {
        return MOCK_APPOINTMENTS.filter(a => a.patientId === patientId).sort((a, b) => new Date(b.start).getTime() - new Date(a.start).getTime());
    };

    const getPatientDocuments = (patientName: string) => {
        return MOCK_DOCUMENTS.filter(d => d.patientName.includes(patientName.split(' ')[1] || ''));
    };

    // --- Render ---
    return (
        <div className="flex flex-col h-full bg-[#FAFAFA] p-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex flex-col">
                    <h2 className="text-[32px] font-normal tracking-[-0.02em] leading-tight text-slate-900" style={{ fontFamily: 'var(--font-heading)' }}>
                        Patients
                    </h2>
                    <span className="text-[14px] font-medium text-slate-500 mt-1">
                        Gérez vos dossiers patients et leur historique ici.
                    </span>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                    <button
                        onClick={() => setIsImportOpen(true)}
                        className="btn-secondary h-10 px-4 text-[13px] font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-[8px] flex items-center justify-center gap-2"
                    >
                        <IconDownload className="w-4 h-4" /> Import CSV
                    </button>
                    <button
                        onClick={() => setIsCreateOpen(true)}
                        className="h-10 px-5 text-[13px] font-medium rounded-[30px] bg-[#0F0F0F] text-white hover:bg-black transition-all flex items-center justify-center gap-2"
                    >
                        <IconUserPlus className="w-4 h-4" /> Nouveau Patient
                    </button>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 mb-6 justify-between items-center">
                <div className="relative w-full sm:max-w-md">
                    <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Rechercher par nom, téléphone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full text-[14px] font-medium rounded-[8px] pl-9 pr-4 py-2.5 bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-100 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
                    />
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-[8px] border border-slate-100 shadow-[0_2px_8px_-2px_rgba(0,0,0,0.04)] flex-1 overflow-hidden flex flex-col">
                <div className="overflow-auto flex-1 scrollbar-hide">
                    <table className="min-w-full text-left">
                        <thead className="bg-[#FAFAFA] sticky top-0 z-10 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                    Patient
                                </th>
                                <th className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                    Contact
                                </th>
                                <th className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                    Assurance
                                </th>
                                <th className="px-6 py-3 text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                    Dernière Visite
                                </th>
                                <th className="px-6 py-3 text-right text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {filteredPatients.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center opacity-40">
                                            <IconUsers className="w-10 h-10 text-slate-300 mb-3" />
                                            <p className="text-[13px] text-slate-500 font-semibold tracking-tight">Aucun patient trouvé.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredPatients.map((patient) => (
                                    <tr
                                        key={patient.id}
                                        onClick={() => {
                                            setSelectedPatient(patient);
                                            setIsEditing(false);
                                            setActiveTab('overview');
                                        }}
                                        className="hover:bg-slate-50/50 hover:shadow-[0_1px_3px_0_rgba(0,0,0,0.02)] transition-all cursor-pointer group"
                                    >
                                        <td className="px-6 py-3 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 rounded-full bg-slate-50 text-slate-600 flex items-center justify-center font-bold text-[12px] border border-slate-100 shrink-0">
                                                    {patient.firstName[0]}
                                                    {patient.lastName[0]}
                                                </div>
                                                <div>
                                                    <div className="text-[14px] font-semibold text-slate-900 tracking-tight leading-tight">
                                                        {patient.firstName} {patient.lastName}
                                                    </div>
                                                    <div className="text-[12px] text-slate-500 font-medium mt-0.5">
                                                        {patient.age || 0} ans • {patient.gender === 'M' ? 'H' : 'F'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-3 whitespace-nowrap">
                                            <div className="text-[13px] font-medium text-slate-700 leading-tight">{patient.phone}</div>
                                            <div className="text-[12px] text-slate-400 font-medium mt-0.5">{patient.email || '—'}</div>
                                        </td>
                                        <td className="px-6 py-3 whitespace-nowrap">
                                            <span className={`rounded-[30px] px-2.5 py-1 text-[11px] font-semibold border ${patient.insuranceType === 'CNOPS' ? 'bg-purple-50 text-purple-700 border-purple-200/50 mix-blend-multiply' :
                                                patient.insuranceType === 'CNSS' ? 'bg-green-50 text-green-700 border-green-200/50' :
                                                    patient.insuranceType === 'Private' ? 'bg-orange-50 text-orange-700 border-orange-200/50' :
                                                        'bg-slate-50 text-slate-700 border-slate-200/50'
                                                }`}>
                                                {patient.insuranceType}
                                            </span>
                                        </td>
                                        <td className="px-6 py-3 whitespace-nowrap text-[13px] font-medium text-slate-500">
                                            {patient.lastVisit || '—'}
                                        </td>
                                        <td className="px-6 py-3 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/app/patients/${patient.id}`);
                                                }}
                                                className="text-slate-400 hover:text-slate-900 transition-colors p-2 rounded-[8px] hover:bg-slate-100"
                                                title="Voir dossier complet"
                                            >
                                                <IconEye className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="px-6 py-4 border-t border-slate-100 bg-white flex justify-between items-center text-[12px] text-slate-500 font-semibold tracking-tight">
                    <span>
                        Affichage de 1 à {filteredPatients.length} patients
                    </span>
                    <div className="flex gap-2">
                        <button disabled className="px-3 py-1.5 bg-white border border-slate-200 rounded-[30px] hover:bg-slate-50 disabled:opacity-50 text-[13px]">Précédent</button>
                        <button className="px-3 py-1.5 bg-white border border-slate-200 rounded-[30px] hover:bg-slate-50 text-[13px]">Suivant</button>
                    </div>
                </div>
            </div>

            {/* ── Patient Detail SlideOver ── */}
            <SlideOver
                isOpen={!!selectedPatient}
                onClose={() => setSelectedPatient(null)}
                title={selectedPatient ? `${selectedPatient.firstName} ${selectedPatient.lastName}` : ''}
                subtitle="Informations du dossier patient"
                width="xl"
            >
                {selectedPatient && (
                    <div className="flex flex-col h-full bg-slate-50/50">
                        {/* Tabs Navigation */}
                        <div className="flex border-b border-slate-100 px-8 bg-white overflow-x-auto scrollbar-hide">
                            {[
                                { id: 'overview', label: 'Général', icon: IconUserPlus },
                                { id: 'medical', label: 'Médical', icon: IconAlertOctagon },
                                { id: 'history', label: 'Rendez-vous', icon: IconCalendar },
                                { id: 'finance', label: 'Finance', icon: IconCreditCard },
                                { id: 'docs', label: 'Documents', icon: IconFolder },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={cn(
                                        'flex items-center gap-2 px-4 py-5 text-[11px] font-bold border-b-2 transition-all shrink-0 uppercase tracking-widest',
                                        activeTab === tab.id
                                            ? 'border-[#0F0F0F] text-[#0F0F0F]'
                                            : 'border-transparent text-slate-400 hover:text-slate-600'
                                    )}
                                >
                                    <tab.icon className="w-4 h-4" />
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        <div className="p-8 space-y-8 flex-1 overflow-y-auto scrollbar-hide">
                            {/* Tab: Overview */}
                            {activeTab === 'overview' && (
                                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <div className="flex justify-between items-center">
                                        <h4 className="text-[20px] font-bold text-slate-900 tracking-tight">
                                            Fiche Patient
                                        </h4>
                                        <div className="flex gap-4">
                                            {!isEditing ? (
                                                <>
                                                    <button
                                                        onClick={() => {
                                                            setEditData({
                                                                firstName: selectedPatient.firstName,
                                                                lastName: selectedPatient.lastName,
                                                                phone: selectedPatient.phone,
                                                                email: selectedPatient.email || '',
                                                                dateOfBirth: '', // Need proper dob extraction
                                                                gender: selectedPatient.gender as 'M' | 'F',
                                                                insuranceType: selectedPatient.insuranceType || 'None',
                                                                city: '',
                                                                address: '',
                                                                allergies: [],
                                                                pathologies: [],
                                                                notes: ''
                                                            });
                                                            setIsEditing(true);
                                                        }}
                                                        className="text-[12px] font-bold text-blue-600 hover:text-blue-800 transition-colors uppercase tracking-widest"
                                                    >
                                                        Modifier
                                                    </button>
                                                    <div className="w-px h-3 bg-slate-200" />
                                                    <button
                                                        onClick={() => navigate(`/app/patients/${selectedPatient.id}`)}
                                                        className="text-[12px] font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest"
                                                    >
                                                        Dossier Complet
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        onClick={() => setIsEditing(false)}
                                                        className="text-[12px] font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase tracking-widest"
                                                    >
                                                        Annuler
                                                    </button>
                                                    <div className="w-px h-3 bg-slate-200" />
                                                    <button
                                                        onClick={handleSaveEdit}
                                                        className="text-[12px] font-bold text-blue-600 hover:text-blue-800 transition-colors uppercase tracking-widest"
                                                    >
                                                        Enregistrer
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                    <div className="bg-white rounded-[8px] border border-slate-200 shadow-sm p-8">
                                        {!isEditing ? (
                                            <>
                                                <div className="flex items-center gap-6 mb-8">
                                                    <div className="w-20 h-20 bg-slate-50 border border-slate-200 rounded-[8px] flex items-center justify-center text-3xl font-bold text-slate-400">
                                                        {selectedPatient.firstName[0]}
                                                        {selectedPatient.lastName[0]}
                                                    </div>
                                                    <div>
                                                        <h3 className="text-[24px] font-bold text-slate-900 leading-tight">
                                                            {selectedPatient.firstName} {selectedPatient.lastName}
                                                        </h3>
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <span className="rounded-[30px] px-2 py-0.5 bg-slate-100 text-slate-700 text-[11px] font-bold">{selectedPatient.age || 0} ans</span>
                                                            <span className="rounded-[30px] px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200/50 text-[11px] font-bold">
                                                                {selectedPatient.gender === 'M' ? 'Homme' : 'Femme'}
                                                            </span>
                                                        </div>
                                                        <div className="flex gap-2 mt-4">
                                                            <button className="h-8 px-3 text-[12px] font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-[30px] flex items-center gap-1.5 transition-colors">
                                                                <IconMessage className="w-3.5 h-3.5" /> SMS
                                                            </button>
                                                            <button className="h-8 px-3 text-[12px] font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-[30px] flex items-center gap-1.5 transition-colors">
                                                                <IconPhone className="w-3.5 h-3.5" /> Appeler
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-y-6 gap-x-12 pt-6 border-t border-slate-100">
                                                    {[
                                                        ['Téléphone', selectedPatient.phone],
                                                        ['Email', selectedPatient.email || '—'],
                                                        ['Assurance', selectedPatient.insuranceType],
                                                        ['N° Assurance', '—'],
                                                        ['Ville', '—'],
                                                        ['Adresse', 'Non renseignée']
                                                    ].map(([lbl, val]) => (
                                                        <div key={lbl as string}>
                                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                                                                {lbl}
                                                            </label>
                                                            <div className="text-[14px] font-semibold text-slate-900 tracking-tight">
                                                                {val}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </>
                                        ) : (
                                            editData && (
                                                <div className="space-y-4">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="text-[13px] font-semibold text-slate-700 mb-1 block">
                                                                Prénom *
                                                            </label>
                                                            <input
                                                                type="text"
                                                                required
                                                                value={editData.firstName}
                                                                onChange={(e) => setEditData({ ...editData, firstName: e.target.value })}
                                                                className="w-full h-9 rounded-[8px] border border-slate-200 bg-white px-3 text-[13px] font-medium focus:ring-2 focus:ring-slate-100 focus:border-slate-500 transition-all outline-none"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-[13px] font-semibold text-slate-700 mb-1 block">
                                                                Nom *
                                                            </label>
                                                            <input
                                                                type="text"
                                                                required
                                                                value={editData.lastName}
                                                                onChange={(e) => setEditData({ ...editData, lastName: e.target.value })}
                                                                className="w-full h-9 rounded-[8px] border border-slate-200 bg-white px-3 text-[13px] font-medium focus:ring-2 focus:ring-slate-100 focus:border-slate-500 transition-all outline-none"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div>
                                                            <label className="text-[13px] font-semibold text-slate-700 mb-1 block">
                                                                Téléphone
                                                            </label>
                                                            <input
                                                                type="tel"
                                                                value={editData.phone}
                                                                onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                                                                className="w-full h-9 rounded-[8px] border border-slate-200 bg-white px-3 text-[13px] font-medium focus:ring-2 focus:ring-slate-100 focus:border-slate-500 transition-all outline-none"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-[13px] font-semibold text-slate-700 mb-1 block">
                                                                Email
                                                            </label>
                                                            <input
                                                                type="email"
                                                                value={editData.email}
                                                                onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                                                                className="w-full h-9 rounded-[8px] border border-slate-200 bg-white px-3 text-[13px] font-medium focus:ring-2 focus:ring-slate-100 focus:border-slate-500 transition-all outline-none"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Tab: Medical */}
                            {activeTab === 'medical' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <div className="bg-red-50 border border-red-200 rounded-[8px] p-5 shadow-sm">
                                        <h4 className="text-[13px] font-bold text-red-700 flex items-center gap-2 mb-4 uppercase tracking-wide">
                                            <IconAlertOctagon className="w-4 h-4" /> Allergies
                                        </h4>
                                        {/* Simplified for recreation */}
                                        <p className="text-[13px] text-slate-600 italic">Gérez les allergies depuis le dossier Patient détaillé.</p>
                                    </div>
                                    <div className="bg-orange-50 border border-orange-200 rounded-[8px] p-5 shadow-sm">
                                        <h4 className="text-[13px] font-bold text-orange-700 flex items-center gap-2 mb-4 uppercase tracking-wide">
                                            <IconFileText className="w-4 h-4" /> Pathologies
                                        </h4>
                                        <p className="text-[13px] text-slate-600 italic">Gérez les antécédents depuis le dossier Patient détaillé.</p>
                                    </div>
                                </div>
                            )}

                            {/* Tab: History */}
                            {activeTab === 'history' && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    <div className="flex justify-between items-center mb-2">
                                        <h4 className="text-[16px] font-bold text-slate-900 tracking-tight">
                                            Historique RDV
                                        </h4>
                                        <button className="text-[13px] font-semibold text-blue-600">
                                            + Nouveau RDV
                                        </button>
                                    </div>
                                    {getPatientAppointments(selectedPatient.id).length > 0 ? (
                                        <div className="space-y-3">
                                            {getPatientAppointments(selectedPatient.id).map((apt) => (
                                                <div key={apt.id} className="bg-white p-4 rounded-[8px] border border-slate-200 shadow-sm flex justify-between items-center group">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-[8px] flex items-center justify-center shrink-0 border border-blue-100">
                                                            <IconCalendar className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <div className="text-[14px] font-bold text-slate-900 tracking-tight">
                                                                {apt.type}
                                                            </div>
                                                            <div className="text-[12px] text-slate-500 flex items-center gap-1.5 mt-1 font-medium">
                                                                <IconClock className="w-3.5 h-3.5" />
                                                                {new Date(apt.start).toLocaleDateString('fr-FR')} • {new Date(apt.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className={cn('text-[11px] font-bold px-2.5 py-1 rounded-[30px] border tracking-wide uppercase', apt.status === 'Terminé' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-blue-50 text-blue-700 border-blue-200')}>
                                                        {apt.status}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="py-20 flex flex-col items-center justify-center bg-white rounded-[8px] border-2 border-dashed border-slate-100 opacity-60">
                                            <IconCalendar className="w-10 h-10 text-slate-300 mb-3" />
                                            <p className="text-[13px] text-slate-500 font-medium">Aucun rendez-vous enregistré.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Tab: Finance & Docs Placeholder */}
                            {['finance', 'docs'].includes(activeTab) && (
                                <div className="py-20 flex flex-col items-center justify-center bg-white rounded-[8px] border-2 border-dashed border-slate-100 opacity-60 animate-in fade-in duration-300">
                                    {activeTab === 'finance' ? <IconCreditCard className="w-10 h-10 text-slate-300 mb-4" /> : <IconFolder className="w-10 h-10 text-slate-300 mb-4" />}
                                    <h5 className="text-[16px] font-bold text-slate-900 tracking-tight">Prochainement</h5>
                                    <p className="text-[13px] text-slate-500 mt-1 font-medium">Le module est en cours de développement.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </SlideOver>

            {/* ── Create Patient SlideOver ── */}
            <SlideOver
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                title="Nouveau Patient"
                subtitle="Démarrer la création du dossier patient"
            >
                <form onSubmit={handleCreatePatient} className="p-8 space-y-8 bg-slate-50/50 h-full overflow-y-auto scrollbar-hide">
                    <div className="bg-white rounded-[8px] border border-slate-200 shadow-sm p-8 space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-[13px] font-semibold text-slate-700 mb-1 block">Prénom *</label>
                                <input
                                    type="text"
                                    required
                                    value={newPatient.firstName}
                                    onChange={e => setNewPatient({ ...newPatient, firstName: e.target.value })}
                                    className="w-full h-9 rounded-[8px] border border-slate-200 bg-white px-3 text-[13px] focus:ring-2 focus:ring-slate-100 focus:border-slate-500 outline-none"
                                />
                            </div>
                            <div>
                                <label className="text-[13px] font-semibold text-slate-700 mb-1 block">Nom *</label>
                                <input
                                    type="text"
                                    required
                                    value={newPatient.lastName}
                                    onChange={e => setNewPatient({ ...newPatient, lastName: e.target.value })}
                                    className="w-full h-9 rounded-[8px] border border-slate-200 bg-white px-3 text-[13px] focus:ring-2 focus:ring-slate-100 focus:border-slate-500 outline-none"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="text-[13px] font-semibold text-slate-700 mb-1 block">Téléphone</label>
                            <input
                                type="tel"
                                value={newPatient.phone}
                                onChange={e => setNewPatient({ ...newPatient, phone: e.target.value })}
                                className="w-full h-9 rounded-[8px] border border-slate-200 bg-white px-3 text-[13px] focus:ring-2 focus:ring-slate-100 focus:border-slate-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-[13px] font-semibold text-slate-700 mb-1 block">Email</label>
                            <input
                                type="email"
                                value={newPatient.email}
                                onChange={e => setNewPatient({ ...newPatient, email: e.target.value })}
                                className="w-full h-9 rounded-[8px] border border-slate-200 bg-white px-3 text-[13px] focus:ring-2 focus:ring-slate-100 focus:border-slate-500 outline-none"
                            />
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <button type="button" onClick={() => setIsCreateOpen(false)} className="h-10 px-4 text-[13px] font-bold text-slate-700 border border-slate-200 bg-white hover:bg-slate-50 rounded-[30px] flex-1">
                            Annuler
                        </button>
                        <button type="submit" className="h-10 px-4 text-[13px] font-bold text-white bg-[#0F0F0F] hover:bg-black rounded-[30px] flex-1">
                            Créer Dossier
                        </button>
                    </div>
                </form>
            </SlideOver>

            {/* ── Import CSV Placeholder ── */}
            {isImportOpen && (
                <SlideOver isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} title="Import CSV" subtitle="Importer des patients en masse">
                    <div className="p-8"><p className="text-[13px] text-slate-600">L'importation de fichiers CSV sera disponible prochainement.</p></div>
                </SlideOver>
            )}

        </div>
    );
};
