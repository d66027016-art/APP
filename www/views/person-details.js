import { h } from '../lib/preact.module.js';
import { useState, useEffect, useMemo } from '../lib/hooks.module.js';
import htm from '../lib/htm.module.js';
import { Card, Button, Input, Select, Modal, Icon, StatusBadge } from '../components.js';
import { getLoanSummary } from '../calculations.js';
import { generatePaymentReceiptPDF, generateDueStatementPDF } from '../pdf-generator.js';

const html = htm.bind(h);

export default function PersonDetails({ 
  personId, 
  initialAction,
  personDetails, 
  setView, 
  onAddPayment, 
  onDeletePayment, 
  onDeletePerson, 
  onDeleteLoan, 
  onAddAdditionalLoan,
  currentDateStr, 
  currencySymbol = '₹' 
}) {
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedLoanId, setSelectedLoanId] = useState(null);
  
  // Add payment form states
  const [payAmount, setPayAmount] = useState('');
  const [payDate, setPayDate] = useState(currentDateStr);
  const [payMethod, setPayMethod] = useState('upi');
  const [payNotes, setPayNotes] = useState('');

  // Add additional loan modal states
  const [isAddLoanModalOpen, setIsAddLoanModalOpen] = useState(false);
  const [newPrincipal, setNewPrincipal] = useState('');
  const [newRate, setNewRate] = useState('');
  const [newType, setNewType] = useState('monthly');
  const [newGivenDate, setNewGivenDate] = useState(currentDateStr);
  const [newDueDate, setNewDueDate] = useState('');
  const [newNotes, setNewNotes] = useState('');

  // Summarize all loans
  const summarizedLoans = useMemo(() => {
    if (!personDetails || !personDetails.loans) return [];
    return personDetails.loans.map(loan => getLoanSummary(loan, loan.payments, currentDateStr));
  }, [personDetails, currentDateStr]);

  // Open pay modal automatically if requested by routing action
  useEffect(() => {
    if (initialAction === 'pay' && summarizedLoans.length > 0) {
      const activeLoan = summarizedLoans.find(l => l.remainingAmount > 0) || summarizedLoans[0];
      if (activeLoan) {
        openPayModal(activeLoan.id, activeLoan.remainingAmount);
      }
    }
  }, [initialAction, summarizedLoans]);

  if (!personDetails) {
    return html`
      <div class="text-center p-8 bg-white border border-slate-150 dark:bg-slate-900 dark:border-slate-800 rounded-xl max-w-xl mx-auto shadow-sm">
        <${Icon} name="alertTriangle" className="w-10 h-10 text-rose-500 mx-auto mb-2" />
        <h3 class="text-lg font-bold text-slate-800 dark:text-slate-100">Borrower not found</h3>
        <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">This record might have been deleted or corrupted.</p>
        <${Button} variant="secondary" className="mt-4 mx-auto" onClick=${() => setView({ name: 'dashboard' })}>
          Back to Dashboard
        <//>
      </div>
    `;
  }

  const openPayModal = (loanId, remainingAmount) => {
    setSelectedLoanId(loanId);
    setPayAmount(remainingAmount.toString());
    setPayDate(currentDateStr);
    setPayMethod('upi');
    setPayNotes('');
    setIsPayModalOpen(true);
  };

  const handlePaySubmit = (e) => {
    e.preventDefault();
    if (!payAmount || parseFloat(payAmount) <= 0 || !payDate) {
      alert("Please enter a valid amount and date.");
      return;
    }
    onAddPayment({
      loanId: selectedLoanId,
      amount: parseFloat(payAmount),
      paymentDate: payDate,
      paymentMethod: payMethod,
      notes: payNotes
    });
    setIsPayModalOpen(false);
  };

  const handleAddLoanSubmit = (e) => {
    e.preventDefault();
    if (!newPrincipal || !newRate || !newGivenDate || !newDueDate) {
      alert("Please fill in all required loan fields.");
      return;
    }
    if (newDueDate < newGivenDate) {
      alert("Due date cannot be before the given date.");
      return;
    }
    onAddAdditionalLoan({
      personId: personDetails.id,
      principalAmount: parseFloat(newPrincipal),
      interestRate: parseFloat(newRate),
      interestType: newType,
      givenDate: newGivenDate,
      dueDate: newDueDate,
      notes: newNotes
    });
    setIsAddLoanModalOpen(false);
    // Reset inputs
    setNewPrincipal('');
    setNewRate('');
    setNewGivenDate(currentDateStr);
    setNewDueDate('');
    setNewNotes('');
  };

  const handleDeletePersonClick = () => {
    if (confirm(`Are you absolutely sure you want to delete ${personDetails.name} and ALL their loans and payments? This action CANNOT be undone.`)) {
      onDeletePerson(personDetails.id);
    }
  };

  const handleDeleteLoanClick = (loanId) => {
    if (confirm(`Are you sure you want to delete this loan and its payments?`)) {
      onDeleteLoan(loanId);
    }
  };

  const formatCurrency = (val) => {
    return `${currencySymbol}${val.toLocaleString('en-IN')}`;
  };

  return html`
    <div class="page-transition max-w-4xl mx-auto flex flex-col gap-6">
      
      <!-- Back button and Header Actions -->
      <div class="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div class="flex items-center gap-3">
          <${Button} variant="ghost" onClick=${() => setView({ name: 'dashboard' })} className="p-2 rounded-lg">
            <${Icon} name="arrowLeft" className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          <//>
          <div>
            <h2 class="text-xl font-bold text-slate-800 dark:text-slate-100">${personDetails.name}</h2>
            <p class="text-xs text-slate-500 dark:text-slate-400">Borrower profile and loans ledger</p>
          </div>
        </div>
        
        <div class="flex flex-wrap gap-2">
          <${Button} variant="secondary" className="text-xs" onClick=${() => generateDueStatementPDF({ loans: summarizedLoans, title: `Statement for ${personDetails.name}`, currentDateStr, currencySymbol })}>
            <${Icon} name="download" className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Statement PDF
          <//>
          <${Button} variant="secondary" className="text-xs" onClick=${() => setIsAddLoanModalOpen(true)}>
            <${Icon} name="plus" className="w-4 h-4 text-brand-600 dark:text-brand-400" /> Add Loan
          <//>
          <${Button} variant="danger" className="text-xs bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 hover:dark:bg-rose-900/40 shadow-none" onClick=${handleDeletePersonClick}>
            <${Icon} name="trash" className="w-4 h-4" /> Delete Person
          <//>
        </div>
      </div>

      <!-- Grid: Person Info and Loans List -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        <!-- Left Column: Person Summary Cards -->
        <div class="lg:col-span-1 flex flex-col gap-4">
          <${Card} className="flex flex-col gap-4">
            <h3 class="text-sm font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2 flex items-center gap-2">
              <${Icon} name="user" className="w-4.5 h-4.5 text-brand-600 dark:text-brand-500" /> Contact Info
            </h3>
            
            <div class="flex flex-col gap-3 text-xs">
              <div>
                <p class="text-slate-450 dark:text-slate-500 font-bold">Mobile Number</p>
                <p class="text-sm font-bold text-slate-700 dark:text-slate-200 mt-0.5 flex items-center gap-1.5">
                  <${Icon} name="phone" className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" /> ${personDetails.mobile}
                </p>
              </div>
              
              <div>
                <p class="text-slate-450 dark:text-slate-500 font-bold">Address</p>
                <p class="text-slate-700 dark:text-slate-300 mt-0.5">${personDetails.address || html`<span class="text-slate-400 dark:text-slate-600 italic">No address provided</span>`}</p>
              </div>
              
              <div>
                <p class="text-slate-450 dark:text-slate-500 font-bold">Profile Notes</p>
                <p class="text-slate-700 dark:text-slate-300 mt-0.5 italic">${personDetails.notes || html`<span class="text-slate-400 dark:text-slate-600">No profile notes</span>`}</p>
              </div>
            </div>
          <//>
        </div>

        <!-- Right Column: Loans Ledger -->
        <div class="lg:col-span-2 flex flex-col gap-6">
          
          <h3 class="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
            Loans Ledger (${summarizedLoans.length})
          </h3>

          ${summarizedLoans.length === 0 ? html`
            <div class="text-center p-8 bg-white border border-slate-150 dark:bg-slate-900 dark:border-slate-800 rounded-xl shadow-sm">
              <${Icon} name="info" className="w-10 h-10 text-slate-400 dark:text-slate-600 mx-auto mb-2" />
              <p class="text-sm text-slate-500 dark:text-slate-400">No loans registered for this person.</p>
              <${Button} variant="primary" className="mt-4 mx-auto text-xs" onClick=${() => setIsAddLoanModalOpen(true)}>
                Add First Loan
              <//>
            </div>
          ` : summarizedLoans.map(loan => html`
            <${Card} key=${loan.id} className="flex flex-col gap-4">
              
              <!-- Loan Header -->
              <div class="flex justify-between items-start border-b border-slate-100 dark:border-slate-850 pb-3">
                <div>
                  <span class="text-[10px] text-slate-450 dark:text-slate-500 font-bold uppercase tracking-wider">Loan ID: #${loan.id}</span>
                  <h4 class="text-base font-bold text-slate-800 dark:text-slate-100 mt-0.5">Given Amount: ${formatCurrency(loan.principalAmount)}</h4>
                </div>
                <div class="flex items-center gap-2">
                  <${StatusBadge} status=${loan.status} />
                  <button onClick=${() => handleDeleteLoanClick(loan.id)} class="text-slate-400 hover:text-rose-500 p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-850 transition-colors">
                    <${Icon} name="trash" className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <!-- Loan Details Metrics -->
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <p class="text-slate-500">Interest Terms</p>
                  <p class="font-bold text-slate-705 dark:text-slate-200 mt-0.5 capitalize">${loan.interestRate}% (${loan.interestType})</p>
                </div>
                <div>
                  <p class="text-slate-500">Given Date</p>
                  <p class="font-medium text-slate-705 dark:text-slate-200 mt-0.5">${loan.givenDate}</p>
                </div>
                <div>
                  <p class="text-slate-500">Return Date</p>
                  <p class="font-medium text-slate-705 dark:text-slate-200 mt-0.5">${loan.dueDate}</p>
                </div>
                <div>
                  <p class="text-slate-500">Duration</p>
                  <p class="font-medium text-slate-600 dark:text-slate-305 mt-0.5 truncate">${loan.durationText}</p>
                </div>
              </div>

              <!-- Real calculations & Payment Ledger Stats -->
              <div class="grid grid-cols-3 gap-2 bg-slate-50 dark:bg-slate-950/70 rounded-xl p-3.5 border border-slate-100 dark:border-slate-850 text-xs">
                <div>
                  <p class="text-slate-500">Total Return</p>
                  <p class="font-bold text-slate-800 dark:text-slate-200 text-sm mt-0.5">${formatCurrency(loan.totalAmount)}</p>
                </div>
                <div>
                  <p class="text-slate-500">Total Received</p>
                  <p class="font-bold text-emerald-600 dark:text-emerald-400 text-sm mt-0.5">${formatCurrency(loan.totalPaid)}</p>
                </div>
                <div class="text-right">
                  <p class="text-slate-500">Total Remaining</p>
                  <p class="font-extrabold text-brand-600 dark:text-brand-400 text-sm mt-0.5">${formatCurrency(loan.remainingAmount)}</p>
                </div>
              </div>

              ${loan.notes && html`
                <div class="text-xs bg-slate-50 dark:bg-slate-950/40 p-2.5 rounded-lg border border-slate-100 dark:border-slate-850/60 text-slate-500 dark:text-slate-400">
                  <span class="font-bold text-slate-400 dark:text-slate-500">Loan Notes: </span> ${loan.notes}
                </div>
              `}

              <!-- Payments Ledger -->
              <div class="flex flex-col gap-2 mt-2">
                <div class="flex justify-between items-center">
                  <h5 class="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Payments History (${loan.payments.length})</h5>
                  ${loan.remainingAmount > 0 && html`
                    <${Button} variant="primary" className="text-xs px-2.5 py-1.5" onClick=${() => openPayModal(loan.id, loan.remainingAmount)}>
                      Receive Payment
                    <//>
                  `}
                </div>

                ${loan.payments.length === 0 ? html`
                  <p class="text-[11px] text-slate-500 dark:text-slate-650 italic py-2">No payments received for this loan yet.</p>
                ` : html`
                  <div class="flex flex-col gap-1.5 mt-1 max-h-48 overflow-y-auto pr-1">
                    ${loan.payments.map(payment => html`
                      <div key=${payment.id} class="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-150 dark:border-slate-850/60 text-xs">
                        <div class="flex flex-col gap-0.5">
                          <p class="font-bold text-slate-800 dark:text-slate-200">${formatCurrency(payment.amount)}</p>
                          <p class="text-[10px] text-slate-500 dark:text-slate-400">${payment.paymentDate} • <span class="capitalize font-medium text-slate-600 dark:text-slate-300">${payment.paymentMethod.replace('_', ' ')}</span></p>
                          ${payment.notes && html`<p class="text-[10px] text-slate-400 dark:text-slate-555 italic mt-0.5">"${payment.notes}"</p>`}
                        </div>
                        <div class="flex items-center gap-1">
                          <button onClick=${() => generatePaymentReceiptPDF({ person: personDetails, loan, payment, currencySymbol })} title="Download Receipt PDF" class="text-emerald-600 hover:text-emerald-700 p-1.5 rounded hover:bg-emerald-50 dark:hover:bg-emerald-950/50 transition-colors">
                            <${Icon} name="download" className="w-3.5 h-3.5" />
                          </button>
                          <button onClick=${() => onDeletePayment(payment.id)} title="Delete Payment" class="text-slate-400 hover:text-rose-500 p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors">
                            <${Icon} name="x" className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    `)}
                  </div>
                `}
              </div>

            <//>
          `)}

        </div>

      </div>

      <!-- MODAL 1: Receive Payment Modal -->
      <${Modal} isOpen=${isPayModalOpen} onClose=${() => setIsPayModalOpen(false)} title="Record Payment Received">
        <form onSubmit=${handlePaySubmit} class="flex flex-col gap-4">
          <${Input} 
            label="Payment Amount" 
            type="number" 
            required=${true} 
            value=${payAmount} 
            onChange=${e => setPayAmount(e.target.value)} 
            icon=${html`<span class="text-xs font-bold text-slate-550 dark:text-slate-500">${currencySymbol}</span>`}
          />
          <${Input} 
            label="Payment Date" 
            type="date" 
            required=${true} 
            value=${payDate} 
            onChange=${e => setPayDate(e.target.value)} 
          />
          <${Select} 
            label="Payment Method" 
            value=${payMethod} 
            onChange=${e => setPayMethod(e.target.value)} 
            options=${[
              { value: 'upi', label: 'UPI / PhonePe / Paytm / GPay' },
              { value: 'cash', label: 'Cash' },
              { value: 'bank_transfer', label: 'Bank Transfer (IMPS/NEFT/RTGS)' },
              { value: 'other', label: 'Other Method' }
            ]}
          />
          <${Input} 
            label="Payment Notes" 
            placeholder="e.g. Received partial cash" 
            value=${payNotes} 
            onChange=${e => setPayNotes(e.target.value)} 
            icon=${html`<${Icon} name="notes" className="w-4 h-4 text-slate-400 dark:text-slate-500" />`}
          />
          <div class="flex gap-2 justify-end mt-4">
            <${Button} variant="secondary" onClick=${() => setIsPayModalOpen(false)}>
              Cancel
            <//>
            <${Button} variant="primary" type="submit">
              Save Payment
            <//>
          </div>
        </form>
      <//>

      <!-- MODAL 2: Add Additional Loan Modal -->
      <${Modal} isOpen=${isAddLoanModalOpen} onClose=${() => setIsAddLoanModalOpen(false)} title="Add Additional Loan to Borrower">
        <form onSubmit=${handleAddLoanSubmit} class="flex flex-col gap-4">
          <div class="grid grid-cols-2 gap-4">
            <${Input} 
              label="Loan Amount" 
              type="number" 
              placeholder="e.g. 20000" 
              required=${true} 
              value=${newPrincipal} 
              onChange=${e => setNewPrincipal(e.target.value)} 
              icon=${html`<span class="text-xs font-bold text-slate-550 dark:text-slate-500">${currencySymbol}</span>`}
            />
            <${Input} 
              label="Interest Rate (%)" 
              type="number" 
              step="0.01" 
              placeholder="e.g. 3" 
              required=${true} 
              value=${newRate} 
              onChange=${e => setNewRate(e.target.value)} 
              icon=${html`<span class="text-xs font-bold text-slate-555 dark:text-slate-500">%</span>`}
            />
          </div>
          <${Select} 
            label="Interest Calculation Type" 
            value=${newType} 
            onChange=${e => setNewType(e.target.value)} 
            options=${[
              { value: 'flat', label: 'Flat One-time' },
              { value: 'monthly', label: 'Monthly' },
              { value: 'yearly', label: 'Yearly' }
            ]}
          />
          <div class="grid grid-cols-2 gap-4">
            <${Input} 
              label="Given Date" 
              type="date" 
              required=${true} 
              value=${newGivenDate} 
              onChange=${e => setNewGivenDate(e.target.value)} 
            />
            <${Input} 
              label="Due Date" 
              type="date" 
              required=${true} 
              value=${newDueDate} 
              onChange=${e => setNewDueDate(e.target.value)} 
            />
          </div>
          <${Input} 
            label="Loan Notes" 
            placeholder="Reason or notes..." 
            value=${newNotes} 
            onChange=${e => setNewNotes(e.target.value)} 
            icon=${html`<${Icon} name="notes" className="w-4 h-4 text-slate-400 dark:text-slate-500" />`}
          />
          <div class="flex gap-2 justify-end mt-4">
            <${Button} variant="secondary" onClick=${() => setIsAddLoanModalOpen(false)}>
              Cancel
            <//>
            <${Button} variant="primary" type="submit">
              Save Loan
            <//>
          </div>
        </form>
      <//>

    </div>
  `;
}

