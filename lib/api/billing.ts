import { supabase } from '../supabase';
import { Invoice, InvoiceItem, Payment, Expense, Quote } from '../../types';

// --- INVOICES ---

export const getInvoices = async () => {
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

export const getExpenses = async () => {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('expenses')
    .select('*')
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

export const getBillingAnalytics = async (tenantId?: string) => {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  // Return mock data for the billing intelligence dashboard
  return {
    totalRevenue: 45200,
    outstandingBalance: 12400,
    revenueGrowth: 15,
    expensesTotal: 8500,
    recoveryRate: 85,
    targetRevenue: 50000,
    revenueByMonth: [
      { month: 'Aôut', revenue: 32000, target: 30000 },
      { month: 'Sep', revenue: 36000, target: 32000 },
      { month: 'Oct', revenue: 35000, target: 35000 },
      { month: 'Nov', revenue: 38000, target: 38000 },
      { month: 'Déc', revenue: 41000, target: 40000 },
      { month: 'Jan', revenue: 45200, target: 50000 },
    ],
    expenseByCategory: [
      { category: 'Loyer', amount: 4000 },
      { category: 'Fournitures', amount: 2500 },
      { category: 'Charges', amount: 1500 },
      { category: 'Marketing', amount: 500 },
    ],
  };
};
