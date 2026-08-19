import { h } from '../lib/preact.module.js';
import { useState, useEffect, useMemo } from '../lib/hooks.module.js';
import htm from '../lib/htm.module.js';
import { Card, Button, Input, Select, Icon } from '../components.js';
import { calculateInterest } from '../calculations.js';

const html = htm.bind(h);

export default function AddLoan({ setView, onSave, currentDateStr, currencySymbol = '₹' }) {
  // Person state
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [address, setAddress] = useState('');
  const [personNotes, setPersonNotes] = useState('');

  // Loan state
  const [principalAmount, setPrincipalAmount] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [interestType, setInterestType] = useState('monthly');
  const [givenDate, setGivenDate] = useState(currentDateStr);
  
  // Set default due date to 1 month from today
  const defaultDueDate = useMemo(() => {
    const today = new Date(currentDateStr);
    today.setMonth(today.getMonth() + 1);
    return today.toISOString().split('T')[0];
  }, [currentDateStr]);
  const [dueDate, setDueDate] = useState(defaultDueDate);
  const [loanNotes, setLoanNotes] = useState('');

  // Real-time calculation preview
  const preview = useMemo(() => {
    return calculateInterest(principalAmount, interestRate, interestType, givenDate, dueDate);
  }, [principalAmount, interestRate, interestType, givenDate, dueDate]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !mobile || !principalAmount || !interestRate || !givenDate || !dueDate) {
      alert("Please fill in all required fields.");
      return;
    }

    if (dueDate < givenDate) {
      alert("Due date cannot be before the given date.");
      return;
    }

    const personData = {
      name,
      mobile,
      address,
      notes: personNotes
    };

    const loanData = {
      principalAmount: parseFloat(principalAmount),
      interestRate: parseFloat(interestRate),
      interestType,
      givenDate,
      dueDate,
      notes: loanNotes
    };

    onSave(personData, loanData);
  };

  return html`
    <div class="page-transition max-w-2xl mx-auto flex flex-col gap-6">
      
      <!-- Back button and title -->
      <div class="flex items-center gap-4">
        <${Button} variant="ghost" onClick=${() => setView({ name: 'dashboard' })} className="p-2 rounded-lg">
          <${Icon} name="arrowLeft" className="w-5 h-5 text-slate-650 dark:text-slate-300" />
        <//>
        <div>
          <h2 class="text-xl font-bold text-slate-800 dark:text-slate-100">Add Person & Loan</h2>
          <p class="text-xs text-slate-500 dark:text-slate-400">Record a new lending transaction and calculate interest</p>
        </div>
      </div>

      <form onSubmit=${handleSubmit} class="flex flex-col gap-5">
        
        <!-- SECTION 1: Person Details -->
        <${Card} className="flex flex-col gap-4">
          <h3 class="text-sm font-bold tracking-wider uppercase text-brand-600 dark:text-brand-400 border-b border-slate-100 dark:border-slate-800 pb-2">
            1. Borrower Details
          </h3>
          
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <${Input} 
              label="Full Name" 
              placeholder="e.g. Rahul Sharma" 
              required=${true} 
              value=${name} 
              onChange=${e => setName(e.target.value)} 
              icon=${html`<${Icon} name="user" className="w-4 h-4 text-slate-400 dark:text-slate-500" />`}
            />
            <${Input} 
              label="Mobile Number" 
              placeholder="10-digit number" 
              required=${true} 
              type="tel"
              value=${mobile} 
              onChange=${e => setMobile(e.target.value.replace(/\D/g, ''))} 
              icon=${html`<${Icon} name="phone" className="w-4 h-4 text-slate-400 dark:text-slate-500" />`}
            />
          </div>

          <${Input} 
            label="Address" 
            placeholder="Home or business address" 
            value=${address} 
            onChange=${e => setAddress(e.target.value)} 
            icon=${html`<${Icon} name="mapPin" className="w-4 h-4 text-slate-400 dark:text-slate-500" />`}
          />

          <${Input} 
            label="Borrower Notes" 
            placeholder="Special notes about the borrower..." 
            value=${personNotes} 
            onChange=${e => setPersonNotes(e.target.value)} 
            icon=${html`<${Icon} name="notes" className="w-4 h-4 text-slate-400 dark:text-slate-500" />`}
          />
        <//>

        <!-- SECTION 2: Loan Details -->
        <${Card} className="flex flex-col gap-4">
          <h3 class="text-sm font-bold tracking-wider uppercase text-brand-600 dark:text-brand-400 border-b border-slate-100 dark:border-slate-800 pb-2">
            2. Loan & Interest Terms
          </h3>

          <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <${Input} 
              label="Loan Amount Given" 
              type="number"
              placeholder="e.g. 50000" 
              required=${true} 
              value=${principalAmount} 
              onChange=${e => setPrincipalAmount(e.target.value)} 
              icon=${html`<span class="text-xs font-bold text-slate-450 dark:text-slate-500">${currencySymbol}</span>`}
            />
            <${Input} 
              label="Interest Rate" 
              type="number"
              step="0.01"
              placeholder="e.g. 2" 
              required=${true} 
              value=${interestRate} 
              onChange=${e => setInterestRate(e.target.value)} 
              icon=${html`<span class="text-xs font-bold text-slate-450 dark:text-slate-500">%</span>`}
            />
            <${Select} 
              label="Interest Type"
              value=${interestType} 
              onChange=${e => setInterestType(e.target.value)} 
              options=${[
                { value: 'flat', label: 'Flat One-time' },
                { value: 'monthly', label: 'Monthly' },
                { value: 'yearly', label: 'Yearly' }
              ]}
            />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <${Input} 
              label="Given Date" 
              type="date"
              required=${true} 
              value=${givenDate} 
              onChange=${e => setGivenDate(e.target.value)} 
            />
            <${Input} 
              label="Return/Due Date" 
              type="date"
              required=${true} 
              value=${dueDate} 
              onChange=${e => setDueDate(e.target.value)} 
            />
          </div>

          <${Input} 
            label="Loan Notes" 
            placeholder="e.g. given for wedding expenses" 
            value=${loanNotes} 
            onChange=${e => setLoanNotes(e.target.value)} 
            icon=${html`<${Icon} name="notes" className="w-4 h-4 text-slate-400 dark:text-slate-500" />`}
          />
        <//>

        <!-- SECTION 3: Dynamic Calculation Preview -->
        <${Card} className="bg-slate-100/50 dark:bg-slate-950 border border-slate-200 dark:border-brand-500/20 text-slate-700 dark:text-slate-300">
          <h4 class="text-xs font-bold uppercase tracking-wider text-brand-700 dark:text-brand-400 mb-3">Live Interest Calculation</h4>
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <p class="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">Duration</p>
              <p class="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-0.5">${preview.durationText}</p>
            </div>
            <div>
              <p class="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">Interest Accrued</p>
              <p class="text-sm font-bold text-amber-600 dark:text-amber-400 mt-0.5">${currencySymbol}${preview.interestAmount.toLocaleString('en-IN')}</p>
            </div>
            <div class="col-span-2 sm:col-span-1">
              <p class="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase">Total Repayment Amount</p>
              <p class="text-base font-extrabold text-brand-600 dark:text-brand-400 mt-0.5">${currencySymbol}${preview.totalAmount.toLocaleString('en-IN')}</p>
            </div>
          </div>
        <//>

        <!-- Action buttons -->
        <div class="flex gap-3 justify-end mt-2">
          <${Button} variant="secondary" onClick=${() => setView({ name: 'dashboard' })} type="button">
            Cancel
          <//>
          <${Button} variant="primary" type="submit">
            Save Record
          <//>
        </div>

      </form>
    </div>
  `;
}


