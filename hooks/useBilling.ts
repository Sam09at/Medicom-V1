import { useState, useEffect, useCallback } from 'react';
import { Invoice, Payment, Expense } from '../types';
import { useMedicomStore } from '../store';
import * as api from '../lib/api/billing';

export const useBilling = () => {
  const currentTenant = useMedicomStore((s) => s.currentTenant);
  const tenantId = currentTenant?.id ?? '';

  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    if (!tenantId) { setLoading(false); return; }
    setLoading(true);
    try {
      const [fetchedInvoices, fetchedExpenses, fetchedAnalytics] = await Promise.all([
        api.getInvoices(tenantId),
        api.getExpenses(tenantId),
        api.getBillingAnalytics(tenantId),
      ]);
      setInvoices(fetchedInvoices);
      setExpenses(fetchedExpenses);
      setAnalytics(fetchedAnalytics);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const createInvoice = async (invoice: Partial<Invoice>, items: any[]) => {
    try {
      const newInvoice = await api.createInvoice(invoice, items);
      await fetchAll();
      return newInvoice;
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const recordPayment = async (payment: Partial<Payment>) => {
    try {
      await api.recordPayment({ ...payment, tenantId } as any);
      await fetchAll();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  const addExpense = async (expense: Partial<Expense>) => {
    try {
      await api.createExpense(expense);
      await fetchAll();
    } catch (err: any) {
      setError(err.message);
      throw err;
    }
  };

  return {
    invoices,
    expenses,
    analytics,
    loading,
    error,
    createInvoice,
    recordPayment,
    addExpense,
    refresh: fetchAll,
    tenantId,
  };
};
