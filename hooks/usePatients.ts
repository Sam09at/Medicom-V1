import { useState, useEffect, useCallback, useRef } from 'react';
import { getPatients, createPatient, updatePatient, softDeletePatient } from '../lib/api/patients';
import { useMedicomStore } from '../store';
import { supabase } from '../lib/supabase';
import type { Patient } from '../types';

// ── Types ──

export interface PatientFilters {
  search: string;
  insuranceType: string;
  isActive: boolean | undefined;
}

export interface PatientPagination {
  page: number;
  pageSize: number;
}

export interface UsePatientsReturn {
  patients: Patient[];
  isLoading: boolean;
  error: string | null;
  totalCount: number;
  filters: PatientFilters;
  pagination: PatientPagination;
  setSearch: (search: string) => void;
  setInsuranceType: (type: string) => void;
  setIsActive: (active: boolean | undefined) => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  create: (data: Parameters<typeof createPatient>[0]) => Promise<Patient | null>;
  update: (id: string, data: Parameters<typeof updatePatient>[1]) => Promise<Patient | null>;
  remove: (id: string) => Promise<boolean>;
  refetch: () => void;
}

// ── Hook ──

export function usePatients(defaultPageSize = 25): UsePatientsReturn {
  const currentUser = useMedicomStore((s) => s.currentUser);
  const currentTenant = useMedicomStore((s) => s.currentTenant);
  const tenantId = currentTenant?.id ?? '';
  const userId = currentUser?.id ?? '';

  // State
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  // Filters
  const [filters, setFilters] = useState<PatientFilters>({
    search: '',
    insuranceType: '',
    isActive: undefined,
  });

  // Pagination
  const [pagination, setPagination] = useState<PatientPagination>({
    page: 1,
    pageSize: defaultPageSize,
  });

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setDebouncedSearch(filters.search);
      setPagination((p) => ({ ...p, page: 1 }));
    }, 300);
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [filters.search]);

  // ── Fetch ──

  const fetchKey = useRef(0);

  const fetchPatients = useCallback(async () => {
    const key = ++fetchKey.current;
    setIsLoading(true);
    setError(null);

    try {
      const result = await getPatients(
        tenantId,
        {
          search: debouncedSearch || undefined,
          insuranceType: filters.insuranceType || undefined,
          isActive: filters.isActive,
        },
        pagination
      );

      // Only apply if this is still the latest fetch
      if (key === fetchKey.current) {
        setPatients(result.data);
        setTotalCount(result.count);
      }
    } catch (err) {
      if (key === fetchKey.current) {
        setError(err instanceof Error ? err.message : 'Erreur de chargement');
      }
    } finally {
      if (key === fetchKey.current) {
        setIsLoading(false);
      }
    }
  }, [tenantId, debouncedSearch, filters.insuranceType, filters.isActive, pagination]);

  const fetchPatientsRef = useRef(fetchPatients);
  useEffect(() => { fetchPatientsRef.current = fetchPatients; }, [fetchPatients]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  // ── Realtime subscription ──
  useEffect(() => {
    const client = supabase;
    if (!client || !tenantId) return;

    const channel = client
      .channel(`patients:${tenantId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'patients', filter: `tenant_id=eq.${tenantId}` },
        () => { fetchPatientsRef.current(); }
      )
      .subscribe();

    return () => { client.removeChannel(channel); };
  }, [tenantId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Setters ──

  const setSearch = useCallback((search: string) => {
    setFilters((f) => ({ ...f, search }));
  }, []);

  const setInsuranceType = useCallback((insuranceType: string) => {
    setFilters((f) => ({ ...f, insuranceType }));
    setPagination((p) => ({ ...p, page: 1 }));
  }, []);

  const setIsActive = useCallback((isActive: boolean | undefined) => {
    setFilters((f) => ({ ...f, isActive }));
    setPagination((p) => ({ ...p, page: 1 }));
  }, []);

  const setPage = useCallback((page: number) => {
    setPagination((p) => ({ ...p, page }));
  }, []);

  const setPageSize = useCallback((pageSize: number) => {
    setPagination((p) => ({ ...p, page: 1, pageSize }));
  }, []);

  // ── Mutations ──

  const create = useCallback(
    async (data: Parameters<typeof createPatient>[0]): Promise<Patient | null> => {
      try {
        const created = await createPatient(data, tenantId, userId);
        await fetchPatients();
        return created;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur de création');
        return null;
      }
    },
    [tenantId, userId, fetchPatients]
  );

  const update = useCallback(
    async (id: string, data: Parameters<typeof updatePatient>[1]): Promise<Patient | null> => {
      try {
        const updated = await updatePatient(id, data, tenantId, userId);
        await fetchPatients();
        return updated;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur de mise à jour');
        return null;
      }
    },
    [tenantId, userId, fetchPatients]
  );

  const remove = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        await softDeletePatient(id, tenantId, userId);
        await fetchPatients();
        return true;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Erreur de suppression');
        return false;
      }
    },
    [tenantId, userId, fetchPatients]
  );

  return {
    patients,
    isLoading,
    error,
    totalCount,
    filters,
    pagination,
    setSearch,
    setInsuranceType,
    setIsActive,
    setPage,
    setPageSize,
    create,
    update,
    remove,
    refetch: fetchPatients,
  };
}
