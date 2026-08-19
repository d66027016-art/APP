import { h } from '../lib/preact.module.js';
import { useState, useMemo } from '../lib/hooks.module.js';
import htm from '../lib/htm.module.js';
import { Card, Button, Input, Select, Icon, StatusBadge } from '../components.js';
import { getLoanSummary } from '../calculations.js';
import { generateDueStatementPDF } from '../pdf-generator.js';

const html = htm.bind(h);

export default function Dashboard({ loans = [], setView, currencySymbol = '₹', currentDateStr }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // all, active, partially_paid, paid, overdue, today, upcoming
  const [upcomingFilter, setUpcomingFilter] = useState('all'); // all, today, tomorrow, week, month, custom
  const [customStartDate, setCustomStartDate] = useState(currentDateStr);
  const [customEndDate, setCustomEndDate] = useState(() => {
    const d = new Date(currentDateStr);
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [activeTab, setActiveTab] = useState('overview'); // overview, collections, all-loans

  // Compute reference relative dates
  const tomorrowDateStr = useMemo(() => {
    const d = new Date(currentDateStr);
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  }, [currentDateStr]);

  const next7DaysStr = useMemo(() => {
    const d = new Date(currentDateStr);
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  }, [currentDateStr]);

  const next30DaysStr = useMemo(() => {
    const d = new Date(currentDateStr);
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  }, [currentDateStr]);

  // Enrich loans with calculation details
  const enrichedLoans = useMemo(() => {
    return loans.map(loan => getLoanSummary(loan, loan.payments, currentDateStr));
  }, [loans, currentDateStr]);

  // Aggregate stats
  const stats = useMemo(() => {
    let totalGiven = 0;
    let totalReceived = 0;
    let totalInterest = 0;
    let totalPending = 0;
    let todayDue = 0;
    let overdueVal = 0;
    let upcomingVal = 0;

    enrichedLoans.forEach(l => {
      totalGiven += l.principalAmount;
      totalReceived += l.totalPaid;
      totalInterest += l.interestAmount;
      totalPending += l.remainingAmount;

      if (l.remainingAmount > 0) {
        if (l.dueDate === currentDateStr) {
          todayDue += l.remainingAmount;
        } else if (l.dueDate < currentDateStr) {
          overdueVal += l.remainingAmount;
        } else {
          upcomingVal += l.remainingAmount;
        }
      }
    });

    return {
      totalGiven,
      totalReceived,
      totalInterest,
      totalPending,
      todayDue,
      overdueVal,
      upcomingVal
    };
  }, [enrichedLoans, currentDateStr]);

  // Filtered lists for specific sections
  const todayDueLoans = useMemo(() => {
    return enrichedLoans.filter(l => l.remainingAmount > 0 && l.dueDate === currentDateStr);
  }, [enrichedLoans, currentDateStr]);

  const overdueLoans = useMemo(() => {
    return enrichedLoans.filter(l => l.remainingAmount > 0 && l.dueDate < currentDateStr);
  }, [enrichedLoans, currentDateStr]);

  // Filtered Upcoming Loans based on upcomingFilter criteria
  const upcomingLoans = useMemo(() => {
    return enrichedLoans.filter(l => {
      if (l.remainingAmount <= 0) return false;
      
      switch (upcomingFilter) {
        case 'today':
          return l.dueDate === currentDateStr;
        case 'tomorrow':
          return l.dueDate === tomorrowDateStr;
        case 'week':
          return l.dueDate >= currentDateStr && l.dueDate <= next7DaysStr;
        case 'month':
          return l.dueDate >= currentDateStr && l.dueDate <= next30DaysStr;
        case 'custom':
          return l.dueDate >= customStartDate && l.dueDate <= customEndDate;
        case 'all':
        default:
          return l.dueDate > currentDateStr;
      }
    });
  }, [enrichedLoans, upcomingFilter, currentDateStr, tomorrowDateStr, next7DaysStr, next30DaysStr, customStartDate, customEndDate]);

  // Filtered loans based on Search and Status Filter
  const filteredLoans = useMemo(() => {
    return enrichedLoans.filter(l => {
      // 1. Search Query Match
      const nameMatch = l.person.name.toLowerCase().includes(searchQuery.toLowerCase());
      const mobileMatch = l.person.mobile.includes(searchQuery);
      const matchesSearch = nameMatch || mobileMatch;

      if (!matchesSearch) return false;

      // 2. Status Filter Match
      if (statusFilter === 'all') return true;
      if (statusFilter === 'today') return l.remainingAmount > 0 && l.dueDate === currentDateStr;
      if (statusFilter === 'upcoming') return l.remainingAmount > 0 && l.dueDate > currentDateStr;
      return l.status === statusFilter;
    });
  }, [enrichedLoans, searchQuery, statusFilter, currentDateStr]);

  const formatCurrency = (val) => {
    return `${currencySymbol}${val.toLocaleString('en-IN')}`;
  };

  return html`
    <div class="page-transition flex flex-col gap-6">
      
      <!-- Top Overview Dashboard Stats -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <${Card} className="border-l-4 border-l-emerald-500">
          <p class="text-[10px] font-extrabold text-[#64748B] dark:text-slate-400 uppercase tracking-wider">Total Given</p>
          <h2 class="text-xl md:text-2xl font-black text-[#0F172A] dark:text-slate-100 mt-1">${formatCurrency(stats.totalGiven)}</h2>
        <//>
        <${Card} className="border-l-4 border-l-[#10B981]">
          <p class="text-[10px] font-extrabold text-[#64748B] dark:text-slate-400 uppercase tracking-wider">Total Received</p>
          <h2 class="text-xl md:text-2xl font-black text-[#0F172A] dark:text-slate-100 mt-1">${formatCurrency(stats.totalReceived)}</h2>
        <//>
        <${Card} className="border-l-4 border-l-sky-500">
          <p class="text-[10px] font-extrabold text-[#64748B] dark:text-slate-400 uppercase tracking-wider">Total Pending</p>
          <h2 class="text-xl md:text-2xl font-black text-[#0F172A] dark:text-slate-100 mt-1">${formatCurrency(stats.totalPending)}</h2>
        <//>
        <${Card} className="border-l-4 border-l-amber-500">
          <p class="text-[10px] font-extrabold text-[#64748B] dark:text-slate-400 uppercase tracking-wider">Total Interest</p>
          <h2 class="text-xl md:text-2xl font-black text-[#0F172A] dark:text-slate-100 mt-1">${formatCurrency(stats.totalInterest)}</h2>
        <//>
      </div>

      <!-- Quick Action Navigation Tabs -->
      <div class="flex border-b border-[#E2E8F0] dark:border-slate-800">
        <button 
          onClick=${() => setActiveTab('overview')} 
          class="px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${activeTab === 'overview' ? 'border-[#0F172A] text-[#0F172A] dark:border-slate-100 dark:text-slate-100' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}"
        >
          Summary Dashboard
        </button>
        <button 
          onClick=${() => setActiveTab('collections')} 
          class="px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 ${activeTab === 'collections' ? 'border-[#0F172A] text-[#0F172A] dark:border-slate-100 dark:text-slate-100' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}"
        >
          Collections Center
          ${(todayDueLoans.length > 0 || overdueLoans.length > 0) && html`
            <span class="inline-flex h-2 w-2 rounded-full bg-rose-500 animate-pulse"></span>
          `}
        </button>
        <button 
          onClick=${() => setActiveTab('all-loans')} 
          class="px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${activeTab === 'all-loans' ? 'border-[#0F172A] text-[#0F172A] dark:border-slate-100 dark:text-slate-100' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'}"
        >
          All Loans
        </button>
      </div>

      <!-- Tab Content: Summary Dashboard -->
      ${activeTab === 'overview' && html`
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <!-- Callout: Today's Collection Alert -->
          <div class="lg:col-span-2 flex flex-col gap-5">
            <${Card} className="relative overflow-hidden bg-[#0F172A] text-white border-none flex flex-col justify-between min-h-[140px] shadow-sm">
              <div class="z-10">
                <p class="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider">Today's Collection Due</p>
                <h1 class="text-3xl font-black text-white mt-2">${formatCurrency(stats.todayDue)}</h1>
                <p class="text-xs text-slate-400 mt-1">${todayDueLoans.length} payments due today (${currentDateStr})</p>
              </div>
              <div class="mt-4 flex flex-wrap gap-3 z-10">
                <${Button} variant="success" onClick=${() => setActiveTab('collections')}>
                  View Due Payments
                <//>
                <${Button} variant="secondary" className="bg-slate-800 text-white border-slate-700 hover:bg-slate-700 text-xs" onClick=${() => generateDueStatementPDF({ loans: enrichedLoans.filter(l => l.remainingAmount > 0), title: 'All Outstanding & Due Payments Statement', currentDateStr, currencySymbol })}>
                  <${Icon} name="download" className="w-4 h-4 text-emerald-400" /> Export PDF Statement
                <//>
                <${Button} variant="secondary" className="bg-slate-800 text-white border-slate-700 hover:bg-slate-700 text-xs" onClick=${() => setView({ name: 'add-loan' })}>
                  <${Icon} name="plus" className="w-4 h-4" /> Add Loan
                <//>
              </div>
              <!-- Backing watermark icon -->
              <div class="absolute right-4 bottom-4 opacity-5 text-white pointer-events-none">
                <${Icon} name="dollar" className="w-32 h-32" />
              </div>
            <//>

            <!-- Quick glance at upcoming/overdue lists -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <${Card} className="flex flex-col gap-3">
                <div class="flex justify-between items-center">
                  <span class="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <span class="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Overdue Dues
                  </span>
                  <span class="text-[10px] font-extrabold text-slate-450 dark:text-slate-400">${overdueLoans.length} loans</span>
                </div>
                <h3 class="text-xl font-black text-rose-600 dark:text-rose-400">${formatCurrency(stats.overdueVal)}</h3>
                <${Button} variant="ghost" className="w-full text-xs text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800" onClick=${() => setActiveTab('collections')}>
                  Review Overdues
                <//>
              <//>
              <${Card} className="flex flex-col gap-3">
                <div class="flex justify-between items-center">
                  <span class="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <span class="w-2.5 h-2.5 rounded-full bg-sky-500"></span> Upcoming Dues
                  </span>
                  <span class="text-[10px] font-extrabold text-slate-450 dark:text-slate-400">${upcomingLoans.length} loans</span>
                </div>
                <h3 class="text-xl font-black text-sky-600 dark:text-sky-400">${formatCurrency(stats.upcomingVal)}</h3>
                <${Button} variant="ghost" className="w-full text-xs text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800" onClick=${() => setActiveTab('collections')}>
                  Show Schedule
                <//>
              <//>
            </div>
          </div>

          <!-- Quick Action panel: Add new loan directly -->
          <div class="flex flex-col gap-4">
            <${Card} className="flex flex-col gap-4">
              <h3 class="text-xs font-extrabold text-[#0F172A] dark:text-slate-100 uppercase tracking-wider flex items-center gap-2 border-b border-[#E2E8F0] dark:border-slate-800 pb-2">
                <${Icon} name="notes" className="w-4 h-4 text-[#10B981]" /> Useful Actions
              </h3>
              <p class="text-xs text-slate-500 dark:text-slate-400">Perform quick ledger tasks without digging through pages.</p>
              
              <div class="flex flex-col gap-2.5 mt-1">
                <button 
                  onClick=${() => setView({ name: 'add-loan' })} 
                  class="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-[#E2E8F0] dark:border-slate-850 hover:border-[#0F172A] dark:hover:border-slate-100 transition-all text-left group"
                >
                  <div>
                    <p class="text-xs font-bold text-slate-900 dark:text-slate-200">New Loan / Borrowing</p>
                    <p class="text-[10px] text-slate-500 mt-0.5">Add a person and calculate byaj</p>
                  </div>
                  <${Icon} name="plus" className="w-4 h-4 text-slate-400 group-hover:text-[#0F172A]" />
                </button>
                <button 
                  onClick=${() => setView({ name: 'reports' })} 
                  class="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-[#E2E8F0] dark:border-slate-850 hover:border-[#0F172A] dark:hover:border-slate-100 transition-all text-left group"
                >
                  <div>
                    <p class="text-xs font-bold text-slate-900 dark:text-slate-200">Ledger Report & Charts</p>
                    <p class="text-[10px] text-slate-500 mt-0.5">View analytics and collection graphs</p>
                  </div>
                  <${Icon} name="chart" className="w-4 h-4 text-slate-400 group-hover:text-[#0F172A]" />
                </button>
                <button 
                  onClick=${() => setView({ name: 'settings' })} 
                  class="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-[#E2E8F0] dark:border-slate-850 hover:border-[#0F172A] dark:hover:border-slate-100 transition-all text-left group"
                >
                  <div>
                    <p class="text-xs font-bold text-slate-900 dark:text-slate-200">Backup & Restore</p>
                    <p class="text-[10px] text-slate-500 mt-0.5">Export database as JSON to your clipboard</p>
                  </div>
                  <${Icon} name="settings" className="w-4 h-4 text-slate-400 group-hover:text-[#0F172A]" />
                </button>
              </div>
            <//>
          </div>

        </div>
      `}

      <!-- Tab Content: Collections Center with Upcoming Payment Filters -->
      ${activeTab === 'collections' && html`
        <div class="flex flex-col gap-6">
          
          <!-- Category 1: Today's Dues -->
          <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between">
              <h3 class="text-xs font-extrabold tracking-wider uppercase text-emerald-700 dark:text-emerald-450 flex items-center gap-2">
                <span class="relative flex h-2.5 w-2.5">
                  <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span class="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </span>
                Today's Collection due (${currentDateStr})
              </h3>
              <span class="text-[10px] bg-slate-100 border border-[#E2E8F0] dark:bg-slate-800 dark:border-transparent text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded font-bold">${todayDueLoans.length} Loans</span>
            </div>

            ${todayDueLoans.length === 0 ? html`
              <p class="text-xs text-slate-500 italic p-4 bg-white border border-[#E2E8F0] dark:bg-slate-900 dark:border-slate-850 rounded-xl">No payments are scheduled for today.</p>
            ` : html`
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                ${todayDueLoans.map(l => html`
                  <${Card} key=${l.id} className="flex flex-col gap-3 justify-between border-emerald-250 dark:border-emerald-900/50 hover:border-emerald-500 shadow-sm">
                    <div class="flex justify-between items-start">
                      <div>
                        <h4 class="text-sm font-bold text-slate-900 dark:text-slate-100">${l.person.name}</h4>
                        <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">${l.person.mobile}</p>
                      </div>
                      <${StatusBadge} status=${l.status} />
                    </div>
                    <div class="flex justify-between items-baseline mt-2">
                      <span class="text-xs text-slate-500 dark:text-slate-400">Collection Due:</span>
                      <span class="text-lg font-black text-slate-900 dark:text-slate-100">${formatCurrency(l.remainingAmount)}</span>
                    </div>
                    <div class="flex gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-850">
                      <${Button} variant="secondary" className="flex-1 text-xs" onClick=${() => setView({ name: 'person-details', id: l.personId })}>
                        Details
                      <//>
                      <${Button} variant="success" className="flex-1 text-xs" onClick=${() => setView({ name: 'person-details', id: l.personId, action: 'pay' })}>
                        Receive Payment
                      <//>
                    </div>
                  <//>`
                )}
              </div>
            `}
          </div>

          <!-- Category 2: Overdue Loans -->
          <div class="flex flex-col gap-3">
            <div class="flex items-center justify-between">
              <h3 class="text-xs font-extrabold tracking-wider uppercase text-rose-700 dark:text-rose-455 flex items-center gap-2">
                <span class="h-2.5 w-2.5 rounded-full bg-rose-500 animate-pulse"></span>
                🔴 Overdue Payments
              </h3>
              <span class="text-[10px] bg-slate-100 border border-[#E2E8F0] dark:bg-slate-800 dark:border-transparent text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded font-bold">${overdueLoans.length} Loans</span>
            </div>

            ${overdueLoans.length === 0 ? html`
              <p class="text-xs text-slate-500 italic p-4 bg-white border border-[#E2E8F0] dark:bg-slate-900 dark:border-slate-850 rounded-xl">No overdue payments. Excellent work!</p>
            ` : html`
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                ${overdueLoans.map(l => html`
                  <${Card} key=${l.id} className="flex flex-col gap-3 justify-between border-rose-200 dark:border-rose-950 hover:border-rose-600/60 shadow-sm">
                    <div class="flex justify-between items-start">
                      <div>
                        <h4 class="text-sm font-bold text-slate-900 dark:text-slate-100">${l.person.name}</h4>
                        <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">${l.person.mobile}</p>
                      </div>
                      <div class="flex flex-col items-end gap-1">
                        <${StatusBadge} status=${l.status} />
                        <span class="text-[10px] text-rose-600 dark:text-rose-400 font-bold">Overdue by ${l.overdueDays} Days</span>
                      </div>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-2 text-xs border-y border-slate-100 dark:border-slate-850 my-1 py-2">
                      <div>
                        <p class="text-slate-500">Original Due:</p>
                        <p class="font-semibold text-slate-800 dark:text-slate-300">${l.dueDate}</p>
                      </div>
                      <div class="text-right">
                        <p class="text-slate-500">Total Return:</p>
                        <p class="font-semibold text-slate-800 dark:text-slate-300">${formatCurrency(l.totalAmount)}</p>
                      </div>
                    </div>

                    <div class="flex justify-between items-baseline mt-1">
                      <span class="text-xs text-slate-500 dark:text-slate-400">Amount Due:</span>
                      <span class="text-lg font-black text-rose-600 dark:text-rose-400">${formatCurrency(l.remainingAmount)}</span>
                    </div>
                    <div class="flex gap-2 mt-3">
                      <${Button} variant="secondary" className="flex-1 text-xs" onClick=${() => setView({ name: 'person-details', id: l.personId })}>
                        Details
                      <//>
                      <${Button} variant="danger" className="flex-1 text-xs" onClick=${() => setView({ name: 'person-details', id: l.personId, action: 'pay' })}>
                        Receive Payment
                      <//>
                    </div>
                  <//>`
                )}
              </div>
            `}
          </div>

          <!-- Category 3: Upcoming Payments WITH FILTERS -->
          <div class="flex flex-col gap-3">
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 border border-[#E2E8F0] rounded-xl dark:bg-slate-900 dark:border-slate-800">
              <div>
                <h3 class="text-xs font-extrabold tracking-wider uppercase text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <span class="h-2.5 w-2.5 rounded-full bg-sky-500"></span>
                  Upcoming Payments Schedule
                </h3>
                <p class="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Filter upcoming payments by target date range</p>
              </div>

              <!-- Upcoming Filters Pill Buttons -->
              <div class="flex flex-wrap items-center gap-1.5">
                ${[
                  { id: 'all', label: 'All' },
                  { id: 'today', label: 'Today' },
                  { id: 'tomorrow', label: 'Tomorrow' },
                  { id: 'week', label: 'Next 7 Days' },
                  { id: 'month', label: 'Next 30 Days' },
                  { id: 'custom', label: 'Custom' }
                ].map(tab => html`
                  <button 
                    key=${tab.id} 
                    onClick=${() => setUpcomingFilter(tab.id)} 
                    class="px-2.5 py-1 rounded text-[11px] font-semibold transition-all ${upcomingFilter === tab.id ? 'bg-[#0F172A] text-white dark:bg-slate-100 dark:text-slate-900' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'}"
                  >
                    ${tab.label}
                  </button>
                `)}
              </div>
            </div>

            ${upcomingFilter === 'custom' && html`
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 border border-[#E2E8F0] dark:bg-slate-950 dark:border-slate-850 rounded-xl">
                <${Input} 
                  label="From Date" 
                  type="date" 
                  value=${customStartDate} 
                  onChange=${e => setCustomStartDate(e.target.value)} 
                />
                <${Input} 
                  label="To Date" 
                  type="date" 
                  value=${customEndDate} 
                  onChange=${e => setCustomEndDate(e.target.value)} 
                />
              </div>
            `}

            ${upcomingLoans.length === 0 ? html`
              <p class="text-xs text-slate-500 italic p-4 bg-white border border-[#E2E8F0] dark:bg-slate-900 dark:border-slate-850 rounded-xl">No upcoming loans match the selected filter criteria (${upcomingFilter}).</p>
            ` : html`
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                ${upcomingLoans.map(l => html`
                  <${Card} key=${l.id} className="flex flex-col gap-3 justify-between hover:border-slate-400 transition-colors shadow-sm">
                    <div class="flex justify-between items-start">
                      <div>
                        <h4 class="text-sm font-bold text-slate-900 dark:text-slate-100">${l.person.name}</h4>
                        <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">${l.person.mobile}</p>
                      </div>
                      <${StatusBadge} status=${l.status} />
                    </div>

                    <div class="grid grid-cols-2 gap-2 text-xs border-y border-slate-100 dark:border-slate-850 my-1 py-2">
                      <div>
                        <p class="text-slate-500">Due Date:</p>
                        <p class="font-bold text-slate-800 dark:text-slate-300">${l.dueDate}</p>
                      </div>
                      <div class="text-right">
                        <p class="text-slate-500">Interest Type:</p>
                        <p class="font-semibold text-slate-800 dark:text-slate-300 capitalize">${l.interestType}</p>
                      </div>
                    </div>

                    <div class="flex justify-between items-baseline mt-1">
                      <span class="text-xs text-slate-500 dark:text-slate-400">Amount Due:</span>
                      <span class="text-lg font-black text-slate-900 dark:text-slate-100">${formatCurrency(l.remainingAmount)}</span>
                    </div>
                    <div class="flex gap-2 mt-3">
                      <${Button} variant="secondary" className="flex-grow text-xs" onClick=${() => setView({ name: 'person-details', id: l.personId })}>
                        Details
                      <//>
                    </div>
                  <//>`
                )}
              </div>
            `}
          </div>

        </div>
      `}

      <!-- Tab Content: All Loans list with filters -->
      ${activeTab === 'all-loans' && html`
        <div class="flex flex-col gap-5">
          <!-- Filters & Search Controls -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <${Input} 
              placeholder="Search by name, phone..." 
              value=${searchQuery} 
              onChange=${e => setSearchQuery(e.target.value)} 
              icon=${html`<${Icon} name="search" className="w-4 h-4 text-slate-400 dark:text-slate-500" />`}
              className="sm:col-span-2"
            />
            
            <${Select} 
              value=${statusFilter} 
              onChange=${e => setStatusFilter(e.target.value)} 
              options=${[
                { value: 'all', label: 'All Statuses' },
                { value: 'active', label: 'Active Loans' },
                { value: 'partially_paid', label: 'Partially Paid' },
                { value: 'paid', label: 'Fully Paid' },
                { value: 'overdue', label: 'Overdue Dues' },
                { value: 'today', label: 'Due Today' },
                { value: 'upcoming', label: 'Upcoming Dues' }
              ]}
            />
          </div>

          <!-- Filtered Loans Listing -->
          ${filteredLoans.length === 0 ? html`
            <div class="text-center p-8 bg-white border border-[#E2E8F0] dark:bg-slate-900 dark:border-slate-800 rounded-xl">
              <${Icon} name="info" className="w-10 h-10 text-slate-400 dark:text-slate-600 mx-auto mb-2" />
              <p class="text-sm text-slate-500 dark:text-slate-400 font-medium">No matches found for search queries or filter selections.</p>
            </div>
          ` : html`
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              ${filteredLoans.map(l => html`
                <${Card} key=${l.id} className="flex flex-col gap-3 justify-between shadow-sm cursor-pointer hover:border-slate-350 dark:hover:border-slate-700" onClick=${() => setView({ name: 'person-details', id: l.personId })}>
                  <div class="flex justify-between items-start">
                    <div>
                      <h4 class="text-sm font-bold text-slate-900 dark:text-slate-100">${l.person.name}</h4>
                      <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">${l.person.mobile}</p>
                    </div>
                    <${StatusBadge} status=${l.status} />
                  </div>

                  <div class="grid grid-cols-3 gap-2 text-[11px] border-t border-b border-slate-100 dark:border-slate-850/60 my-1 py-2 text-slate-500 dark:text-slate-400">
                    <div>
                      <p>Given Amt</p>
                      <p class="font-bold text-slate-900 dark:text-slate-200 text-xs mt-0.5">${formatCurrency(l.principalAmount)}</p>
                    </div>
                    <div>
                      <p>Accrued Byaj</p>
                      <p class="font-bold text-slate-900 dark:text-slate-200 text-xs mt-0.5">${formatCurrency(l.interestAmount)}</p>
                    </div>
                    <div class="text-right">
                      <p>Remaining</p>
                      <p class="font-black text-[#10B981] text-xs mt-0.5">${formatCurrency(l.remainingAmount)}</p>
                    </div>
                  </div>

                  <div class="flex justify-between items-center text-xs mt-1">
                    <span class="text-slate-500">Due: <span class="font-bold text-slate-800 dark:text-slate-300">${l.dueDate}</span></span>
                    <span class="text-[#0F172A] dark:text-brand-400 font-extrabold flex items-center gap-1 group-hover:underline">
                      Ledger Detail <${Icon} name="arrowLeft" className="w-3.5 h-3.5 rotate-180" />
                    </span>
                  </div>
                <//>
              `)}
            </div>
          `}
        </div>
      `}

    </div>
  `;
}

