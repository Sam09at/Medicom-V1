import { useState, useEffect, useRef } from 'react';
import { useMedicomStore } from '../store';
import { Consultation, Drug, ToothData } from '../types';
import {
  createConsultation,
  updateConsultation,
  getConsultation,
  getConsultationByAppointmentId,
  createPrescription,
} from '../lib/api/consultations';

interface UseConsultationLogicProps {
  appointmentId?: string;
  patientId: string;
}

export const useConsultationLogic = ({ appointmentId, patientId }: UseConsultationLogicProps) => {
  const currentUser = useMedicomStore((s) => s.currentUser);
  const currentTenant = useMedicomStore((s) => s.currentTenant);

  // UI State
  const [activeTab, setActiveTab] = useState('vitals');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [consultationId, setConsultationId] = useState<string | null>(null);

  // Clinical Data
  const [vitals, setVitals] = useState({
    bpSystolic: '',
    bpDiastolic: '',
    weight: '',
    temp: '',
    heartRate: '',
  });
  const [notes, setNotes] = useState('');
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [examination, setExamination] = useState('');
  const [diagnosis, setDiagnosis] = useState('');
  const [treatmentPlan, setTreatmentPlan] = useState('');
  const [toothStatus, setToothStatus] = useState<Record<number, ToothData>>({});
  const [selectedProcedures, setSelectedProcedures] = useState<any[]>([]);
  const [prescriptionDrugs, setPrescriptionDrugs] = useState<Drug[]>([]);

  const isDirty = useRef(false);
  const autosaveTimerRef = useRef<any>(null);

  const fetchData = async () => {
    if (!appointmentId && !patientId) return;
    setIsLoading(true);
    try {
      // Check if consultation exists for this appointment
      let existingId = null;

      if (appointmentId) {
        const existing = await getConsultationByAppointmentId(appointmentId);
        existingId = existing?.id;
      }

      if (existingId) {
        const consultation = await getConsultation(existingId);
        setConsultationId(consultation.id);
        setVitals({
          bpSystolic: consultation.vitals?.bpSystolic?.toString() || '',
          bpDiastolic: consultation.vitals?.bpDiastolic?.toString() || '',
          weight: consultation.vitals?.weight?.toString() || '',
          temp: consultation.vitals?.temp?.toString() || '',
          heartRate: consultation.vitals?.heartRate?.toString() || '',
        });
        setNotes(consultation.notes || '');
        setChiefComplaint(consultation.chiefComplaint || '');
        setExamination(consultation.examination || '');
        setDiagnosis(consultation.diagnosis || '');
        setTreatmentPlan(consultation.treatmentPlan || '');
      } else {
        // Create Draft
        const newConsult = await createConsultation({
          patientId,
          appointmentId,
          status: 'draft',
          tenantId: currentTenant?.id,
          doctorId: currentUser?.id,
        });
        if (newConsult) setConsultationId(newConsult.id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
  }, [appointmentId, patientId]);

  const saveData = async () => {
    if (!isDirty.current || !consultationId) return;

    setIsSaving(true);
    try {
      await updateConsultation(consultationId, {
        vitals: {
          bpSystolic: Number(vitals.bpSystolic),
          bpDiastolic: Number(vitals.bpDiastolic),
          weight: Number(vitals.weight),
          temp: Number(vitals.temp),
          heartRate: Number(vitals.heartRate),
        },
        notes,
        chiefComplaint,
        examination,
        diagnosis,
        treatmentPlan,
        updatedAt: new Date().toISOString(),
      });
      setLastSaved(new Date());
      isDirty.current = false;
    } catch (err) {
      console.error('Autosave failed', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Autosave Trigger
  useEffect(() => {
    if (isLoading) return;
    isDirty.current = true;

    if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);

    autosaveTimerRef.current = setTimeout(() => {
      saveData();
    }, 2000); // 2 seconds delay

    return () => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
    };
  }, [vitals, notes, chiefComplaint, examination, diagnosis, treatmentPlan]);

  const finalizeConsultation = async () => {
    if (!consultationId) return;
    setIsSaving(true);
    try {
      // 1. Save Prescription if exists
      if (prescriptionDrugs.length > 0) {
        await createPrescription({
          tenantId: currentTenant?.id,
          patientId,
          doctorId: currentUser?.id,
          consultationId,
          drugs: prescriptionDrugs,
          issuedAt: new Date().toISOString(),
        });
      }

      // 2. Mark Consultation as Completed
      await updateConsultation(consultationId, {
        status: 'completed',
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Finalize failed', err);
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    isLoading,
    isSaving,
    lastSaved,
    activeTab,
    setActiveTab,
    vitals,
    setVitals,
    notes,
    setNotes,
    chiefComplaint,
    setChiefComplaint,
    examination,
    setExamination,
    diagnosis,
    setDiagnosis,
    treatmentPlan,
    setTreatmentPlan,
    toothStatus,
    setToothStatus,
    selectedProcedures,
    setSelectedProcedures,
    prescriptionDrugs,
    setPrescriptionDrugs,
    finalizeConsultation,
    saveData,
  };
};
