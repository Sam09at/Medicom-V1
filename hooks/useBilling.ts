import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Invoice, Payment, Expense } from '../types';
import * as api from '../lib/api/billing';

export const useBilling = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [fetchedInvoices, fetchedExpenses, fetchedAnalytics] = await Promise.all([
        api.getInvoices(),
        api.getExpenses(),
        api.getBillingAnalytics(),
      ]);
      setInvoices(fetchedInvoices);
      setExpenses(fetchedExpenses);
      setAnalytics(fetchedAnalytics);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

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
      await api.recordPayment(payment);
      await fetchAll(); // Refresh to update invoice status
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
  };
};
