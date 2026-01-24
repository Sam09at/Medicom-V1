
import React, { useState } from 'react';
import { IconSearch, IconPlus, IconDownload, IconCheck, IconCreditCard, IconTrash, IconFileText, IconX, IconTrendingDown, IconDollarSign, IconArchive, IconLock, IconPrinter } from '../components/Icons';
import { SlideOver } from '../components/SlideOver';
import { MOCK_PATIENTS, MOCK_EXPENSES } from '../constants';
import { Expense, Quote } from '../types';

const INITIAL_INVOICES = [
  { id: 'FAC-2024-001', patient: 'Karim Benali', date: '24 Jan 2024', amount: 450, paidAmount: 450, status: 'Paid', type: 'Consultation' },
  { id: 'FAC-2024-002', patient: 'Fatima Zahra', date: '24 Jan 2024', amount: 1200, paidAmount: 0, status: 'Pending', type: 'Soins Dentaires' },
  { id: 'FAC-2024-003', patient: 'Youssef Idrissi', date: '23 Jan 2024', amount: 300, paidAmount: 300, status: 'Paid', type: 'Contrôle' },
  { id: 'FAC-2024-004', patient: 'Layla Amrani', date: '22 Jan 2024', amount: 2500, paidAmount: 2500, status: 'Paid', type: 'Implant' },
  { id: 'FAC-2024-005', patient: 'Omar Tazi', date: '20 Jan 2024', amount: 450, paidAmount: 0, status: 'Overdue', type: 'Consultation' },
];

const MOCK_QUOTES: Quote[] = [
    { id: 'DEV-2024-001', patient: 'Karim Benali', date: '20 Jan 2024', amount: 15000, status: 'Sent', items: 'Implants x2', validUntil: '20 Fev 2024' },
    { id: 'DEV-2024-002', patient: 'Layla Amrani', date: '15 Jan 2024', amount: 3500, status: 'Accepted', items: 'Couronne Céramique', validUntil: '15 Fev 2024' },
];

const SERVICES = [
    { id: 's1', label: 'Consultation Standard', price: 300 },
    { id: 's2', label: 'Détartrage (Haut & Bas)', price: 500 },
    { id: 's3', label: 'Composite 1 Face', price: 400 },
    { id: 's4', label: 'Extraction Simple', price: 350 },
    { id: 's5', label: 'Blanchiment Dentaire', price: 2500 },
];

const StatCard = ({ title, value, subtitle, type = 'default' }: { title: string, value: string, subtitle: string, type?: 'primary' | 'warning' | 'default' }) => (
    <div className="bg-white p-5 rounded-md border border-slate-200 shadow-sm flex flex-col justify-between h-32">
        <div className="flex justify-between items-start">
            <h3 className="text-xs font-medium uppercase tracking-wide text-slate-500">{title}</h3>
            {type === 'primary' && <div className="p-1.5 bg-blue-50 text-blue-600 rounded"><IconCreditCard className="w-4 h-4" /></div>}
        </div>
        <div>
            <div className="text-2xl font-semibold text-slate-900">{value}</div>
            <div className={`text-xs mt-1 font-medium ${
                type === 'warning' ? 'text-red-600' : 'text-slate-500'
            }`}>{subtitle}</div>
        </div>
    </div>
);

export const Billing = () => {
  const [activeTab, setActiveTab] = useState<'invoices' | 'quotes' | 'expenses' | 'closing'>('invoices');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [invoices, setInvoices] = useState(INITIAL_INVOICES);
  const [quotes, setQuotes] = useState<Quote[]>(MOCK_QUOTES);
  const [expenses, setExpenses] = useState<Expense[]>(MOCK_EXPENSES);
  
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [invoiceItems, setInvoiceItems] = useState<{id: string, label: string, price: number}[]>([SERVICES[0]]);
  
  // Payment Form
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Espèces');

  // Expense Form
  const [newExpense, setNewExpense] = useState({
      description: '',
      category: 'Supplies',
      amount: '',
      date: new Date().toISOString().split('T')[0]
  });

  const handleAddItem = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const service = SERVICES.find(s => s.id === e.target.value);
      if (service) {
          setInvoiceItems([...invoiceItems, { ...service, id: Math.random().toString() }]);
      }
      e.target.value = ""; // Reset select
  };

  const handleRemoveItem = (id: string) => {
      setInvoiceItems(invoiceItems.filter(i => i.id !== id));
  };

  const openPayment = (invoice: any) => {
      setSelectedInvoice(invoice);
      const remaining = invoice.amount - (invoice.paidAmount || 0);
      setPaymentAmount(remaining.toString());
      setIsPaymentModalOpen(true);
  };

  const openPrint = (invoice: any) => {
      setSelectedInvoice(invoice);
      setIsPrintModalOpen(true);
  };

  const submitPayment = () => {
      if(!selectedInvoice) return;
      const amount = parseFloat(paymentAmount);
      const newPaidAmount = (selectedInvoice.paidAmount || 0) + amount;
      const isFull = newPaidAmount >= selectedInvoice.amount;
      
      setInvoices(invoices.map(inv => inv.id === selectedInvoice.id ? { 
          ...inv, 
          paidAmount: newPaidAmount, 
          status: isFull ? 'Paid' : 'Partial' 
      } : inv));
      
      alert(`Paiement de ${amount} MAD enregistré pour ${selectedInvoice.id} via ${paymentMethod}. Statut: ${isFull ? 'Payé' : 'Partiel'}`);
      setIsPaymentModalOpen(false);
  };

  const handleCreateDocument = (type: 'Invoice' | 'Quote') => {
      const patient = MOCK_PATIENTS.find(p => p.id === selectedPatientId);
      if (!patient) return alert("Sélectionnez un patient");

      const total = invoiceItems.reduce((sum, item) => sum + item.price, 0);
      const todayStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

      if (type === 'Invoice') {
          const newInv = {
              id: `FAC-2024-${Math.floor(Math.random() * 1000)}`,
              patient: `${patient.firstName} ${patient.lastName}`,
              date: todayStr,
              amount: total,
              paidAmount: 0,
              status: 'Pending',
              type: invoiceItems[0]?.label || 'Consultation'
          };
          setInvoices([newInv, ...invoices]);
          setActiveTab('invoices');
      } else {
          const newQuote: Quote = {
              id: `DEV-2024-${Math.floor(Math.random() * 1000)}`,
              patient: `${patient.firstName} ${patient.lastName}`,
              date: todayStr,
              amount: total,
              status: 'Draft',
              items: invoiceItems.map(i => i.label).join(', '),
              validUntil: '30 days'
          };
          setQuotes([newQuote, ...quotes]);
          setActiveTab('quotes');
      }
      setIsCreateOpen(false);
      setInvoiceItems([SERVICES[0]]); // Reset
      setSelectedPatientId('');
  };

  const handleAddExpense = (e: React.FormEvent) => {
      e.preventDefault();
      const expense: Expense = {
          id: `EXP-${Date.now()}`,
          description: newExpense.description,
          category: newExpense.category as any,
          amount: parseFloat(newExpense.amount),
          date: new Date(newExpense.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
          status: 'Paid'
      };
      setExpenses([expense, ...expenses]);
      setIsExpenseModalOpen(false);
      setNewExpense({ description: '', category: 'Supplies', amount: '', date: new Date().toISOString().split('T')[0] });
  };

  const convertQuote = (quoteId: string) => {
      if(confirm('Convertir ce devis en facture ?')) {
          const quote = quotes.find(q => q.id === quoteId);
          if(!quote) return;
          
          setQuotes(quotes.map(q => q.id === quoteId ? { ...q, status: 'Accepted' } : q));
          const newInv = {
              id: `FAC-${Math.floor(Math.random() * 1000)}`,
              patient: quote.patient,
              date: new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
              amount: quote.amount,
              paidAmount: 0,
              status: 'Pending',
              type: 'Suite Devis ' + quote.id
          };
          setInvoices([newInv, ...invoices]);
          setActiveTab('invoices');
      }
  };

  const totalAmount = invoiceItems.reduce((sum, item) => sum + item.price, 0);
  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  // Closing Data (Mock)
  const todayClosing = {
      cash: 4500,
      check: 2000,
      card: 1500,
      total: 8000,
      count: 12,
      expenses: 300
  };

  return (
    <div className="space-y-6 relative font-sans">
       {/* Payment Modal */}
       {isPaymentModalOpen && (
           <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
               <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsPaymentModalOpen(false)}></div>
               <div className="bg-white rounded-lg shadow-xl w-full max-w-md relative z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                   <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                       <h3 className="font-semibold text-slate-900">Enregistrer un paiement</h3>
                       <button onClick={() => setIsPaymentModalOpen(false)} className="text-slate-400 hover:text-slate-600"><IconX className="w-5 h-5" /></button>
                   </div>
                   <div className="p-6 space-y-6">
                       <div className="bg-blue-50 p-4 rounded-md border border-blue-100">
                           <div className="text-xs text-blue-600 uppercase font-bold tracking-wide">Reste à payer</div>
                           <div className="text-2xl font-bold text-blue-900">{(selectedInvoice?.amount - (selectedInvoice?.paidAmount || 0)).toLocaleString()} MAD</div>
                           <div className="text-xs text-blue-500 mt-1">Facture {selectedInvoice?.id} • Total: {selectedInvoice?.amount} MAD</div>
                       </div>
                       
                       <div>
                           <label className="block text-sm font-medium text-slate-700 mb-2">Montant perçu</label>
                           <input 
                                type="number" 
                                value={paymentAmount}
                                onChange={(e) => setPaymentAmount(e.target.value)}
                                className="block w-full text-lg p-3 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                           />
                       </div>

                       <div>
                           <label className="block text-sm font-medium text-slate-700 mb-2">Mode de règlement</label>
                           <div className="grid grid-cols-3 gap-3">
                               {['Espèces', 'Chèque', 'Carte'].map(method => (
                                   <button 
                                        key={method}
                                        onClick={() => setPaymentMethod(method)}
                                        className={`py-2 text-sm font-medium rounded border ${
                                            paymentMethod === method 
                                            ? 'bg-blue-600 text-white border-blue-600' 
                                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                                        }`}
                                   >
                                       {method}
                                   </button>
                               ))}
                           </div>
                       </div>
                   </div>
                   <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                       <button onClick={() => setIsPaymentModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-md">Annuler</button>
                       <button onClick={submitPayment} className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md shadow-sm">Valider</button>
                   </div>
               </div>
           </div>
       )}

       {/* Print Modal */}
       {isPrintModalOpen && selectedInvoice && (
           <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
               <div className="bg-white w-full max-w-2xl h-[85vh] flex flex-col rounded-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                   <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
                       <h3 className="font-bold text-slate-900">Aperçu Facture {selectedInvoice.id}</h3>
                       <div className="flex gap-2">
                           <button onClick={() => window.print()} className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                               <IconPrinter className="w-4 h-4" /> Imprimer
                           </button>
                           <button onClick={() => setIsPrintModalOpen(false)} className="p-1.5 text-slate-500 hover:bg-slate-200 rounded">
                               <IconX className="w-5 h-5" />
                           </button>
                       </div>
                   </div>
                   <div className="flex-1 overflow-y-auto p-12 bg-slate-100">
                       <div className="bg-white shadow-lg p-10 min-h-[600px] mx-auto max-w-[21cm] text-slate-900 font-sans relative">
                           {/* Invoice Layout */}
                           <div className="flex justify-between mb-12">
                               <div>
                                   <h2 className="text-2xl font-bold text-blue-900 mb-1">Cabinet Dentaire Dr. Amina</h2>
                                   <div className="text-sm text-slate-500">
                                       123 Bd Zerktouni<br />
                                       Casablanca, Maroc<br />
                                       +212 522 123 456
                                   </div>
                               </div>
                               <div className="text-right">
                                   <h1 className="text-4xl font-bold text-slate-100">FACTURE</h1>
                                   <div className="mt-2 text-sm text-slate-600">N° {selectedInvoice.id}</div>
                                   <div className="text-sm text-slate-600">Date: {selectedInvoice.date}</div>
                               </div>
                           </div>

                           <div className="border-t-2 border-blue-600 mb-8 pt-4">
                               <div className="text-xs text-slate-400 uppercase tracking-wide mb-1">Facturé à</div>
                               <div className="text-lg font-bold text-slate-900">{selectedInvoice.patient}</div>
                           </div>

                           <table className="w-full mb-12">
                               <thead>
                                   <tr className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wide">
                                       <th className="py-3 px-4 text-left">Description</th>
                                       <th className="py-3 px-4 text-right">Montant</th>
                                   </tr>
                               </thead>
                               <tbody>
                                   <tr>
                                       <td className="py-4 px-4 border-b border-slate-100">
                                           <div className="font-medium text-slate-900">{selectedInvoice.type}</div>
                                           <div className="text-xs text-slate-500">Acte dentaire</div>
                                       </td>
                                       <td className="py-4 px-4 border-b border-slate-100 text-right font-medium">
                                           {selectedInvoice.amount.toFixed(2)} MAD
                                       </td>
                                   </tr>
                               </tbody>
                           </table>

                           <div className="flex justify-end">
                               <div className="w-64 space-y-3">
                                   <div className="flex justify-between text-sm">
                                       <span className="text-slate-500">Total HT</span>
                                       <span className="font-medium">{selectedInvoice.amount.toFixed(2)} MAD</span>
                                   </div>
                                   <div className="flex justify-between text-sm">
                                       <span className="text-slate-500">TVA (0%)</span>
                                       <span className="font-medium">0.00 MAD</span>
                                   </div>
                                   <div className="flex justify-between text-lg font-bold text-blue-900 border-t border-slate-200 pt-3">
                                       <span>Total TTC</span>
                                       <span>{selectedInvoice.amount.toFixed(2)} MAD</span>
                                   </div>
                                   <div className="flex justify-between text-sm text-green-600 pt-1">
                                       <span>Déjà payé</span>
                                       <span>- {selectedInvoice.paidAmount.toFixed(2)} MAD</span>
                                   </div>
                                   <div className="flex justify-between text-sm font-bold text-slate-900 pt-1">
                                       <span>Reste à payer</span>
                                       <span>{(selectedInvoice.amount - selectedInvoice.paidAmount).toFixed(2)} MAD</span>
                                   </div>
                               </div>
                           </div>

                           <div className="absolute bottom-10 left-10 right-10 text-center text-xs text-slate-400">
                               Merci de votre confiance. ICE: 001122334455667
                           </div>
                       </div>
                   </div>
               </div>
           </div>
       )}

       {/* Expense Modal */}
       {isExpenseModalOpen && (
           <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
               <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsExpenseModalOpen(false)}></div>
               <div className="bg-white rounded-lg shadow-xl w-full max-w-sm relative z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                   <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                       <h3 className="font-semibold text-slate-900">Ajouter une dépense</h3>
                       <button onClick={() => setIsExpenseModalOpen(false)} className="text-slate-400 hover:text-slate-600"><IconX className="w-5 h-5" /></button>
                   </div>
                   <form onSubmit={handleAddExpense}>
                       <div className="p-6 space-y-4">
                           <div>
                               <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                               <input 
                                    type="text" 
                                    required
                                    className="w-full border border-slate-300 rounded-md p-2 text-sm outline-none focus:ring-2 focus:ring-red-500"
                                    placeholder="Ex: Facture d'électricité"
                                    value={newExpense.description}
                                    onChange={e => setNewExpense({...newExpense, description: e.target.value})}
                               />
                           </div>
                           <div>
                               <label className="block text-sm font-medium text-slate-700 mb-1">Catégorie</label>
                               <select 
                                    className="w-full border border-slate-300 rounded-md p-2 text-sm outline-none focus:ring-2 focus:ring-red-500 bg-white"
                                    value={newExpense.category}
                                    onChange={e => setNewExpense({...newExpense, category: e.target.value})}
                                >
                                   <option value="Rent">Loyer</option>
                                   <option value="Utilities">Charges (Eau/Elec)</option>
                                   <option value="Supplies">Fournitures</option>
                                   <option value="Salaries">Salaires</option>
                                   <option value="Other">Autre</option>
                               </select>
                           </div>
                           <div>
                               <label className="block text-sm font-medium text-slate-700 mb-1">Montant (MAD)</label>
                               <input 
                                    type="number" 
                                    required
                                    className="w-full border border-slate-300 rounded-md p-2 text-sm outline-none focus:ring-2 focus:ring-red-500"
                                    value={newExpense.amount}
                                    onChange={e => setNewExpense({...newExpense, amount: e.target.value})}
                               />
                           </div>
                           <div>
                               <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                               <input 
                                    type="date" 
                                    required
                                    className="w-full border border-slate-300 rounded-md p-2 text-sm outline-none focus:ring-2 focus:ring-red-500"
                                    value={newExpense.date}
                                    onChange={e => setNewExpense({...newExpense, date: e.target.value})}
                               />
                           </div>
                       </div>
                       <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                           <button type="button" onClick={() => setIsExpenseModalOpen(false)} className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-md">Annuler</button>
                           <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md shadow-sm">Enregistrer</button>
                       </div>
                   </form>
               </div>
           </div>
       )}

       {/* Financial Overview */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           <StatCard title="Chiffre d'Affaires (Jan)" value="45 200 MAD" subtitle="+12% vs Décembre" type="primary" />
           <StatCard title="En Attente de Paiement" value="3 400 MAD" subtitle="5 factures en cours" />
           <StatCard title="Total Dépenses (Jan)" value={`${totalExpenses.toLocaleString()} MAD`} subtitle="Cumul mensuel" type="warning" />
       </div>

      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4">
        <div className="flex gap-4 items-center">
            <h2 className="text-lg font-semibold text-slate-900">Finance</h2>
            <div className="flex bg-slate-100 p-1 rounded-md">
                <button 
                    onClick={() => setActiveTab('invoices')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-sm transition-all ${activeTab === 'invoices' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500'}`}
                >
                    Factures
                </button>
                <button 
                    onClick={() => setActiveTab('quotes')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-sm transition-all ${activeTab === 'quotes' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500'}`}
                >
                    Devis
                </button>
                <button 
                    onClick={() => setActiveTab('expenses')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-sm transition-all ${activeTab === 'expenses' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500'}`}
                >
                    Dépenses
                </button>
                <button 
                    onClick={() => setActiveTab('closing')}
                    className={`px-3 py-1.5 text-xs font-medium rounded-sm transition-all ${activeTab === 'closing' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500'}`}
                >
                    Caisse
                </button>
            </div>
        </div>
        <div className="flex gap-3">
             <button className="inline-flex items-center gap-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm">
                <IconDownload className="w-4 h-4" />
                Exporter
            </button>
            {activeTab !== 'expenses' && activeTab !== 'closing' ? (
                <button 
                    onClick={() => setIsCreateOpen(true)}
                    className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm"
                >
                    <IconPlus className="w-4 h-4" />
                    Créer {activeTab === 'invoices' ? 'Facture' : 'Devis'}
                </button>
            ) : activeTab === 'expenses' ? (
                <button 
                    onClick={() => setIsExpenseModalOpen(true)}
                    className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm"
                >
                    <IconTrendingDown className="w-4 h-4" />
                    Ajouter Dépense
                </button>
            ) : null}
        </div>
      </div>

      {activeTab === 'invoices' && (
        /* Invoice List */
        <div className="bg-white rounded-md border border-slate-200 shadow-sm flex flex-col">
            <div className="px-4 py-3 border-b border-slate-200 flex items-center gap-4">
            <div className="relative flex-1 max-w-xs">
                <IconSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <input type="text" placeholder="Rechercher facture..." className="w-full pl-9 pr-3 py-1.5 text-sm border border-slate-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            </div>

            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50/50">
                    <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">N° Facture</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Patient</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Prestation</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Montant</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Payé</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Statut</th>
                    <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                    {invoices.map((invoice) => (
                    <tr key={invoice.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{invoice.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-medium">{invoice.patient}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{invoice.date}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{invoice.type}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">{invoice.amount} MAD</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{invoice.paidAmount || 0} MAD</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                invoice.status === 'Paid' ? 'bg-green-50 text-green-700 border-green-100' :
                                invoice.status === 'Overdue' ? 'bg-red-50 text-red-700 border-red-100' :
                                invoice.status === 'Partial' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                'bg-yellow-50 text-yellow-700 border-yellow-100'
                            }`}>
                                {invoice.status === 'Paid' && <IconCheck className="w-3 h-3" />}
                                {invoice.status === 'Paid' ? 'Payé' : invoice.status === 'Overdue' ? 'En retard' : invoice.status === 'Partial' ? 'Partiel' : 'En attente'}
                            </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {invoice.status !== 'Paid' && (
                                <button onClick={() => openPayment(invoice)} className="text-green-600 hover:text-green-800 transition-colors mr-3">Payer</button>
                            )}
                            <button onClick={() => openPrint(invoice)} className="text-blue-600 hover:text-blue-800 transition-colors">Détails</button>
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
        </div>
      )}

      {activeTab === 'quotes' && (
        <div className="bg-white rounded-md border border-slate-200 shadow-sm flex flex-col">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50/50">
                    <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Référence</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Patient</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Détails</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Montant</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Statut</th>
                    <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                    {quotes.map((quote) => (
                    <tr key={quote.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{quote.id}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 font-medium">{quote.patient}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{quote.date}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 truncate max-w-xs">{quote.items}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-900">{quote.amount} MAD</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                                quote.status === 'Accepted' ? 'bg-green-50 text-green-700 border-green-100' :
                                quote.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-100' :
                                'bg-slate-100 text-slate-700 border-slate-200'
                            }`}>
                                {quote.status === 'Accepted' ? 'Accepté' : quote.status === 'Rejected' ? 'Refusé' : 'Brouillon'}
                            </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button onClick={() => convertQuote(quote.id)} className="text-blue-600 hover:text-blue-800 transition-colors mr-3">Convertir</button>
                            <button className="text-slate-400 hover:text-slate-600 transition-colors"><IconFileText className="w-4 h-4" /></button>
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
        </div>
      )}

      {activeTab === 'expenses' && (
        /* Expenses List */
        <div className="bg-white rounded-md border border-slate-200 shadow-sm flex flex-col">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50/50">
                    <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Catégorie</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Montant</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Statut</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                    {expenses.map((expense) => (
                    <tr key={expense.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900">{expense.description}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{expense.category}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{expense.date}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600">- {expense.amount} MAD</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200">{expense.status}</span>
                        </td>
                    </tr>
                    ))}
                </tbody>
                </table>
            </div>
        </div>
      )}

      {activeTab === 'closing' && (
          <div className="max-w-4xl mx-auto space-y-6">
              <div className="bg-gradient-to-br from-indigo-900 to-slate-800 rounded-lg p-8 text-white shadow-lg">
                  <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-bold">Clôture de Caisse</h2>
                      <div className="text-sm bg-white/10 px-3 py-1 rounded-full border border-white/20">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
                  </div>
                  <div className="grid grid-cols-4 gap-8 text-center">
                      <div>
                          <div className="text-xs text-slate-300 uppercase tracking-widest font-semibold mb-1">Total Journalier</div>
                          <div className="text-3xl font-bold">{todayClosing.total.toLocaleString()} <span className="text-sm font-normal text-slate-400">MAD</span></div>
                      </div>
                      <div className="border-l border-white/10 pl-8">
                          <div className="text-xs text-slate-300 uppercase tracking-widest font-semibold mb-1">Espèces</div>
                          <div className="text-xl font-medium">{todayClosing.cash.toLocaleString()}</div>
                      </div>
                      <div className="border-l border-white/10 pl-8">
                          <div className="text-xs text-slate-300 uppercase tracking-widest font-semibold mb-1">Chèques</div>
                          <div className="text-xl font-medium">{todayClosing.check.toLocaleString()}</div>
                      </div>
                      <div className="border-l border-white/10 pl-8">
                          <div className="text-xs text-slate-300 uppercase tracking-widest font-semibold mb-1">Carte Bancaire</div>
                          <div className="text-xl font-medium">{todayClosing.card.toLocaleString()}</div>
                      </div>
                  </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm">
                      <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                          <IconCheck className="w-4 h-4 text-green-500" /> Validation des Encaissements
                      </h3>
                      <div className="space-y-3">
                          <div className="flex justify-between text-sm p-2 bg-slate-50 rounded">
                              <span>Total Théorique (Système)</span>
                              <span className="font-bold">{todayClosing.total} MAD</span>
                          </div>
                          <div className="flex justify-between text-sm p-2 bg-slate-50 rounded">
                              <span>Nombre de transactions</span>
                              <span className="font-bold">{todayClosing.count}</span>
                          </div>
                          <div className="flex justify-between text-sm p-2 bg-red-50 rounded text-red-700">
                              <span>Dépenses (Petite caisse)</span>
                              <span className="font-bold">- {todayClosing.expenses} MAD</span>
                          </div>
                          <div className="pt-2 border-t border-slate-100 flex justify-between font-bold text-base">
                              <span>Solde Net Caisse</span>
                              <span>{(todayClosing.cash - todayClosing.expenses).toLocaleString()} MAD</span>
                          </div>
                      </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex flex-col justify-between">
                      <div>
                          <h3 className="font-bold text-slate-900 mb-2">Actions de Clôture</h3>
                          <p className="text-xs text-slate-500 mb-4">Une fois la caisse clôturée, aucune modification ne sera possible pour cette date.</p>
                          <div className="flex items-center gap-2 text-sm text-yellow-600 bg-yellow-50 p-3 rounded border border-yellow-100 mb-4">
                              <IconLock className="w-4 h-4" />
                              Clôture non effectuée pour aujourd'hui
                          </div>
                      </div>
                      <button 
                        onClick={() => alert("Journée clôturée avec succès. Rapport envoyé par email.")}
                        className="w-full py-3 bg-green-600 text-white font-bold rounded-md hover:bg-green-700 shadow-sm flex items-center justify-center gap-2"
                      >
                          <IconCheck className="w-5 h-5" /> Valider et Clôturer
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* New Invoice/Quote SlideOver */}
      <SlideOver
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title={activeTab === 'quotes' ? 'Nouveau Devis' : 'Nouvelle Facture'}
        subtitle={`Créer ${activeTab === 'quotes' ? 'un devis' : 'une facture'} pour un patient`}
        width="lg"
      >
          <div className="p-6 space-y-8">
              {/* Patient Selection */}
              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Patient</label>
                  <select 
                    value={selectedPatientId}
                    onChange={(e) => setSelectedPatientId(e.target.value)}
                    className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2.5 border"
                  >
                      <option value="">Sélectionner un patient...</option>
                      {MOCK_PATIENTS.map(p => (
                          <option key={p.id} value={p.id}>{p.firstName} {p.lastName}</option>
                      ))}
                  </select>
              </div>

              {/* Items */}
              <div>
                  <div className="flex justify-between items-center mb-3">
                      <label className="block text-sm font-medium text-slate-700">Actes & Services</label>
                      <div className="relative">
                          <select 
                            className="text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded px-2 py-1 pr-8 cursor-pointer focus:ring-2 focus:ring-blue-500 outline-none"
                            onChange={handleAddItem}
                            value=""
                          >
                              <option value="" disabled>+ Ajouter Acte</option>
                              {SERVICES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                          </select>
                      </div>
                  </div>
                  
                  <div className="bg-slate-50 border border-slate-200 rounded-md overflow-hidden">
                      {invoiceItems.length === 0 ? (
                          <div className="p-8 text-center text-sm text-slate-400 italic">Aucun acte ajouté.</div>
                      ) : (
                          <div className="divide-y divide-slate-200">
                              {invoiceItems.map((item, idx) => (
                                  <div key={item.id} className="p-3 flex justify-between items-center bg-white group">
                                      <div>
                                          <div className="text-sm font-medium text-slate-900">{item.label}</div>
                                          <div className="text-xs text-slate-500">Code: {idx + 100}</div>
                                      </div>
                                      <div className="flex items-center gap-4">
                                          <div className="text-sm font-semibold text-slate-900">{item.price} MAD</div>
                                          <button onClick={() => handleRemoveItem(item.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                                              <IconTrash className="w-4 h-4" />
                                          </button>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      )}
                      
                      {invoiceItems.length > 0 && (
                          <div className="p-4 bg-slate-100 flex justify-between items-center border-t border-slate-200">
                              <span className="font-semibold text-slate-700">Total à payer</span>
                              <span className="text-lg font-bold text-blue-700">{totalAmount} MAD</span>
                          </div>
                      )}
                  </div>
              </div>

              {/* Payment Info */}
              <div className="grid grid-cols-2 gap-6">
                  <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Date d'émission</label>
                      <input type="date" className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border" defaultValue={new Date().toISOString().split('T')[0]} />
                  </div>
                  <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">{activeTab === 'quotes' ? 'Validité' : 'Échéance'}</label>
                      <select className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border">
                          <option>15 jours</option>
                          <option>30 jours</option>
                          <option>60 jours</option>
                      </select>
                  </div>
              </div>

              {/* Actions */}
              <div className="pt-6 flex gap-3 border-t border-slate-100">
                  <button onClick={() => setIsCreateOpen(false)} className="flex-1 py-2.5 border border-slate-300 rounded-md text-slate-700 font-medium hover:bg-slate-50 transition-colors">Annuler</button>
                  <button onClick={() => handleCreateDocument(activeTab === 'quotes' ? 'Quote' : 'Invoice')} className="flex-1 py-2.5 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 shadow-sm transition-colors flex justify-center items-center gap-2">
                      <IconCheck className="w-4 h-4" /> Enregistrer {activeTab === 'quotes' ? 'le devis' : 'la facture'}
                  </button>
              </div>
          </div>
      </SlideOver>
    </div>
  );
};
