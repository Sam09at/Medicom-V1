import { useState, useEffect, useCallback } from 'react';
import {
  getLeads,
  updateLeadStatus,
  getLeadActivities,
  addActivity,
  type Lead,
  type LeadActivity,
  createLead,
} from '../lib/api/saas/crm';
import { Prospect } from '../types';

// Map DB status (code) to UI status (Language/Label mapping handled by component usually, but keeping logic consistent)
export const DB_TO_UI_STATUS: Record<string, string> = {
  new: 'New',
  contacted: 'Contacted',
  demo: 'Demo',
  proposal: 'Demo',
  won: 'Converted',
  lost: 'Lost',
};
export const UI_TO_DB_STATUS: Record<string, string> = {
  New: 'new',
  Contacted: 'contacted',
  Demo: 'demo',
  Converted: 'won',
  Lost: 'lost',
};

// Fallback mock data when Supabase is not configured
export const FALLBACK_PROSPECTS: Prospect[] = [
  {
    id: '1',
    clinicName: 'Cabinet Dentaire Targa',
    contactName: 'Dr. Tazi',
    city: 'Marrakech',
    status: 'New',
    source: 'LinkedIn',
    date: '25 Jan 2024',
    leadScore: 85,
    priority: 'High',
    email: 'contact@targa.ma',
    phone: '+212600112233',
  },
  {
    id: '2',
    clinicName: 'Clinique Al Azhar',
    contactName: 'Mme. Bennani',
    city: 'Rabat',
    status: 'Demo',
    source: 'Referral',
    date: '22 Jan 2024',
    leadScore: 60,
    priority: 'Medium',
    email: 'bennani@cliniquealazhar.ma',
    phone: '+212600223344',
  },
  {
    id: '3',
    clinicName: 'Orthodontie Fes',
    contactName: 'Dr. Lahlou',
    city: 'Fes',
    status: 'Contacted',
    source: 'Website',
    date: '20 Jan 2024',
    leadScore: 45,
    priority: 'Low',
    email: 'contact@orthofes.ma',
    phone: '+212600334455',
  },
  {
    id: '4',
    clinicName: 'Cabinet Dr. Karim',
    contactName: 'Dr. Karim',
    city: 'Casablanca',
    status: 'Converted',
    source: 'Direct',
    date: '15 Jan 2024',
    leadScore: 95,
    priority: 'High',
    email: 'drkarim@cabinet.ma',
    phone: '+212600445566',
  },
  {
    id: '5',
    clinicName: 'Centre Médical Nord',
    contactName: 'Dr. Berrada',
    city: 'Tanger',
    status: 'Lost',
    source: 'Cold Call',
    date: '10 Jan 2024',
    leadScore: 20,
    priority: 'Low',
    email: 'nord@centremed.ma',
    phone: '+212600556677',
  },
];

export const useCRM = () => {
  const [prospects, setProspects] = useState<Prospect[]>(FALLBACK_PROSPECTS);
  const [activities, setActivities] = useState<LeadActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadLeads = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getLeads();
      if (data.length > 0) {
        const mapped: Prospect[] = data.map((l: Lead) => ({
          id: l.id,
          clinicName: l.name,
          contactName: l.contactPerson || 'N/A',
          city: l.city || '',
          status: (DB_TO_UI_STATUS[l.status] || 'New') as Prospect['status'],
          source: l.source || 'Organic',
          date: new Date(l.createdAt).toLocaleDateString('fr-FR'),
          leadScore: Math.min(100, Math.round((l.estValue || 0) / 100)),
          priority: l.estValue > 5000 ? 'High' : l.estValue > 2000 ? 'Medium' : 'Low',
          email: l.email,
          phone: l.phone,
          notes: l.notes,
        }));
        setProspects(mapped);
      }
    } catch (err: any) {
      console.warn('[CRM] Using fallback mock data:', err);
      setProspects(FALLBACK_PROSPECTS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  const loadActivities = async (leadId: string) => {
    try {
      const data = await getLeadActivities(leadId);
      setActivities(data);
    } catch {
      setActivities([]);
    }
  };

  const moveLead = async (leadId: string, newStatus: string) => {
    // Optimistic UI update
    const previousProspects = [...prospects];

    setProspects((prev) =>
      prev.map((p) => (p.id === leadId ? { ...p, status: newStatus as any } : p))
    );

    // Persist to Supabase
    try {
      const dbStatus = UI_TO_DB_STATUS[newStatus] || newStatus.toLowerCase();
      await updateLeadStatus(leadId, dbStatus);

      // Automation: Log state transition
      await addActivity({
        leadId,
        type: 'status_change',
        description: `Statut mis à jour vers ${newStatus}`,
      });

      // Reload activities if a lead is actively selected in UI
      // This needs to be coordinated in the component usually, but we expose the loader.
    } catch (err: any) {
      console.error('[CRM] Failed to update lead status:', err);
      setProspects(previousProspects); // Rollback
      setError(err.message);
    }
  };

  const logActivity = async (
    leadId: string,
    type: 'call' | 'email' | 'meeting' | 'note',
    description: string
  ) => {
    try {
      await addActivity({
        leadId,
        type,
        description,
      });
      await loadActivities(leadId); // Refresh local activities for this lead
    } catch (err: any) {
      console.error('[CRM] Failed to log activity:', err);
      setError(err.message);
    }
  };

  const scheduleDemo = async (leadId: string) => {
    try {
      // Log demo meeting setup
      await addActivity({
        leadId,
        type: 'meeting',
        description: `Démo programmée pour la semaine prochaine.`,
      });

      // Also progress the pipeline automatically to 'Demo' if not already
      const lead = prospects.find((p) => p.id === leadId);
      if (lead && lead.status !== 'Demo') {
        await moveLead(leadId, 'Demo');
      } else {
        await loadActivities(leadId);
      }
    } catch (err: any) {
      console.error('[CRM] Failed to schedule demo:', err);
    }
  };

  const addLead = async (leadData: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      setLoading(true);
      await createLead(leadData);
      await loadLeads(); // Refresh leads
    } catch (err: any) {
      console.error('[CRM] Failed to add lead:', err);
      setError(err.message);

      // Fallback: Add locally
      const mockLead: Prospect = {
        id: `mock-${Date.now()}`,
        clinicName: leadData.name,
        contactName: leadData.contactPerson,
        email: leadData.email,
        phone: leadData.phone,
        city: leadData.city,
        source: leadData.source,
        status: (DB_TO_UI_STATUS[leadData.status] || 'New') as any,
        leadScore: Math.min(100, Math.round((leadData.estValue || 0) / 100)),
        priority: leadData.estValue > 5000 ? 'High' : leadData.estValue > 2000 ? 'Medium' : 'Low',
        date: new Date().toLocaleDateString('fr-FR'),
      };
      setProspects(prev => [mockLead, ...prev]);
    } finally {
      setLoading(false);
    }
  };

  return {
    prospects,
    activities,
    loading,
    error,
    recordCount: prospects.length,
    loadActivities,
    moveLead,
    logActivity,
    scheduleDemo,
    addLead,
    refresh: loadLeads,
  };
};
