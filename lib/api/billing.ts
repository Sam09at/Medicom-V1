import { supabase } from '../supabase';
import { Invoice, InvoiceItem, Payment, Expense, Quote } from '../../types';

// --- INVOICES ---

export const getInvoices = async (tenantId: string) => {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('invoices')
    .select(
      `
            *,
            patient:patients(first_name, last_name),
            items:invoice_items(*),
            payments:payments(*)
        `
    )
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data.map((inv: any) => ({
    ...inv,
    patientName: inv.patient ? `${inv.patient.first_name} ${inv.patient.last_name}` : 'Unknown',
    number: inv.invoice_number,
    totalAmount: inv.total_amount,
    paidAmount: inv.paid_amount,
    issuedAt: inv.issued_at,
    dueDate: inv.due_date,
    taxAmount: inv.tax_amount,
    discountAmount: inv.discount_amount,
  })) as Invoice[];
};

export const createInvoice = async (invoice: Partial<Invoice>, items: Partial<InvoiceItem>[]) => {
  if (!supabase) throw new Error('Supabase not initialized');

  // 1. Create Invoice
  const { data: invData, error: invError } = await supabase
    .from('invoices')
    .insert([
      {
        tenant_id: invoice.tenantId,
        patient_id: invoice.patientId,
        invoice_number: invoice.number,
        status: invoice.status || 'Draft',
        type: invoice.type,
        subtotal: invoice.subtotal,
        tax_amount: invoice.taxAmount,
        discount_amount: invoice.discountAmount,
        total_amount: invoice.totalAmount,
        paid_amount: 0,
        issued_at: invoice.issuedAt,
        due_date: invoice.dueDate,
        notes: (invoice as any).notes,
      },
    ])
    .select()
    .single();

  if (invError) throw invError;

  // 2. Create Items
  if (items.length > 0) {
    const itemsToInsert = items.map((item) => ({
      invoice_id: invData.id,
      tenant_id: invoice.tenantId,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      total_price: item.totalPrice,
      tooth_number: item.toothNumber,
      service_id: (item as any).serviceId,
    }));

    const { error: itemsError } = await supabase.from('invoice_items').insert(itemsToInsert);

    if (itemsError) throw itemsError;
  }

  return invData;
};

export const getNextInvoiceNumber = async (tenantId: string) => {
  if (!supabase) return `INV-${new Date().getFullYear()}-0001`;

  const currentYear = new Date().getFullYear();
  const prefix = `INV-${currentYear}-`;

  const { data, error } = await supabase
    .from('invoices')
    .select('invoice_number')
    .eq('tenant_id', tenantId)
    .ilike('invoice_number', `${prefix}%`)
    .order('invoice_number', { ascending: false })
    .limit(1);

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching max invoice number', error);
  }

  if (!data || data.length === 0) {
    return `${prefix}0001`;
  }

  const lastNumber = data[0].invoice_number; // INV-2024-0005
  const sequence = parseInt(lastNumber.split('-').pop() || '0', 10);
  const nextSequence = sequence + 1;

  return `${prefix}${nextSequence.toString().padStart(4, '0')}`;
};

// --- PAYMENTS ---

export const getPayments = async (invoiceId?: string) => {
  if (!supabase) return [];

  let query = supabase.from('payments').select('*').order('created_at', { ascending: false });

  if (invoiceId) {
    query = query.eq('invoice_id', invoiceId);
  }

  const { data, error } = await query;
  if (error) throw error;

  return data.map((p: any) => ({
    id: p.id,
    invoiceId: p.invoice_id,
    patientId: p.patient_id,
    amount: p.amount,
    method: p.method,
    date: p.payment_date,
    reference: p.reference,
    notes: p.notes,
  })) as Payment[];
};

export const recordPayment = async (payment: Partial<Payment>) => {
  if (!supabase) throw new Error('Supabase not initialized');

  // Insert Payment
  const { data, error } = await supabase
    .from('payments')
    .insert([
      {
        invoice_id: payment.invoiceId,
        tenant_id: (payment as any).tenantId,
        patient_id: payment.patientId,
        amount: payment.amount,
        method: payment.method,
        reference: payment.reference,
        notes: payment.notes,
        payment_date: payment.date || new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (error) throw error;

  // Trigger automatically updates invoice status/paid_amount in DB
  return data;
};

// --- EXPENSES ---

export const getExpenses = async (tenantId: string) => {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('date', { ascending: false });

  if (error) throw error;

  return data.map((e: any) => ({
    id: e.id,
    tenantId: e.tenant_id,
    description: e.description,
    category: e.category,
    amount: e.amount,
    date: e.date,
    status: e.status,
    receiptUrl: e.receipt_url,
  })) as Expense[];
};

export const createExpense = async (expense: Partial<Expense>) => {
  if (!supabase) throw new Error('Supabase not initialized');

  const { data, error } = await supabase
    .from('expenses')
    .insert([
      {
        tenant_id: expense.tenantId,
        description: expense.description,
        category: expense.category,
        amount: expense.amount,
        date: expense.date,
        status: expense.status || 'Paid',
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// --- ANALYTICS ---

export const getBillingAnalytics = async (tenantId: string) => {
  if (!supabase || !tenantId) {
    return {
      totalRevenue: 0, outstandingBalance: 0, revenueGrowth: 0,
      expensesTotal: 0, recoveryRate: 0, targetRevenue: 0,
      revenueByMonth: [], expenseByCategory: [],
    };
  }

  const now = new Date();
  const months: { month: string; start: string; end: string }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
    months.push({
      month: d.toLocaleDateString('fr-FR', { month: 'short' }),
      start: d.toISOString(),
      end: end.toISOString(),
    });
  }

  const [paymentsRes, invoicesRes, expensesRes] = await Promise.all([
    supabase.from('payments').select('amount, payment_date').eq('tenant_id', tenantId),
    supabase.from('invoices').select('total_amount, paid_amount, status').eq('tenant_id', tenantId),
    supabase.from('expenses').select('amount, category').eq('tenant_id', tenantId),
  ]);

  const payments: { amount: number; payment_date: string }[] = paymentsRes.data ?? [];
  const invoices: { total_amount: number; paid_amount: number; status: string }[] = invoicesRes.data ?? [];
  const expenses: { amount: number; category: string }[] = expensesRes.data ?? [];

  const totalRevenue = payments.reduce((s, p) => s + (p.amount ?? 0), 0);
  const outstandingBalance = invoices
    .filter((inv) => inv.status !== 'Paid' && inv.status !== 'Cancelled')
    .reduce((s, inv) => s + Math.max(0, (inv.total_amount ?? 0) - (inv.paid_amount ?? 0)), 0);
  const expensesTotal = expenses.reduce((s, e) => s + (e.amount ?? 0), 0);
  const totalBilled = invoices.reduce((s, inv) => s + (inv.total_amount ?? 0), 0);
  const recoveryRate = totalBilled > 0 ? Math.round((totalRevenue / totalBilled) * 100) : 0;

  const revenueByMonth = months.map(({ month, start, end }) => ({
    month,
    revenue: payments
      .filter((p) => p.payment_date >= start && p.payment_date <= end)
      .reduce((s, p) => s + (p.amount ?? 0), 0),
    target: 0,
  }));

  const expenseByCategory = Object.entries(
    expenses.reduce((acc: Record<string, number>, e) => {
      acc[e.category] = (acc[e.category] ?? 0) + (e.amount ?? 0);
      return acc;
    }, {})
  ).map(([category, amount]) => ({ category, amount }));

  const prevMonthRevenue = revenueByMonth[revenueByMonth.length - 2]?.revenue ?? 0;
  const curMonthRevenue = revenueByMonth[revenueByMonth.length - 1]?.revenue ?? 0;
  const revenueGrowth = prevMonthRevenue > 0
    ? Math.round(((curMonthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100)
    : 0;

  return {
    totalRevenue, outstandingBalance, revenueGrowth,
    expensesTotal, recoveryRate, targetRevenue: 0,
    revenueByMonth, expenseByCategory,
  };
};
