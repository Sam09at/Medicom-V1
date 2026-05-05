import { useState, useEffect, useCallback } from 'react';
import { useMedicomStore } from '../store';
import { getServices, getAllServices, upsertService, toggleServiceActive } from '../lib/api/services';
import type { MedicalService } from '../types';

export function useServices(includeInactive = false) {
  const { currentTenant, showToast } = useMedicomStore();
  const [services, setServices] = useState<MedicalService[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = useCallback(async () => {
    if (!currentTenant) return;
    setLoading(true);
    const data = includeInactive
      ? await getAllServices(currentTenant.id)
      : await getServices(currentTenant.id);
    setServices(data);
    setLoading(false);
  }, [currentTenant, includeInactive]);

  useEffect(() => { fetch(); }, [fetch]);

  const save = async (service: Omit<MedicalService, 'tenantId' | 'id'> & { id?: string }) => {
    if (!currentTenant) return null;
    const result = await upsertService(currentTenant.id, service);
    if (result) {
      await fetch();
      showToast({ type: 'success', message: 'Service enregistré.' });
    } else {
      showToast({ type: 'error', message: 'Impossible d\'enregistrer le service.' });
    }
    return result;
  };

  const toggle = async (id: string, isActive: boolean) => {
    const ok = await toggleServiceActive(id, isActive);
    if (ok) {
      setServices((prev) => prev.map((s) => s.id === id ? { ...s, isActive } : s));
    } else {
      showToast({ type: 'error', message: 'Impossible de modifier le service.' });
    }
  };

  return { services, loading, save, toggle, refetch: fetch };
}
