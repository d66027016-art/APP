import { h } from 'https://esm.sh/preact';
import { useMemo, useState } from 'https://esm.sh/preact/hooks';
import htm from 'https://esm.sh/htm';
import { Card, Button, Icon } from '../components.js';
import { getLoanSummary } from '../calculations.js';

const html = htm.bind(h);

export default function Reports({ loans = [], setView, currentDateStr, currencySymbol = '₹' }) {
  const [activeChartTab, setActiveChartTab] = useState('monthly'); // monthly, distribution, efficiency

  // Enrich loans
  const enrichedLoans = useMemo(() => {
    return loans.map(loan => getLoanSummary(loan, loan.payments, currentDateStr));
  }, [loans, currentDateStr]);

  // Aggregate stats
  const stats = useMemo(() => {
    let totalGiven = 0;
    let totalReceived = 0;
    let totalInterest = 0;
    let totalPending = 0;
    
    let activeCount = 0;
    let overdueCount = 0;
    let completedCount = 0;

    enrichedLoans.forEach(l => {
      totalGiven += l.principalAmount;
      totalReceived += l.totalPaid;
      totalInterest += l.interestAmount;
      totalPending += l.remainingAmount;

      if (l.status === 'paid') {
        completedCount++;
      } else if (l.status === 'overdue') {
        overdueCount++;
      } else {
        activeCount++;
      }
    });

    const totalReturnAmount = totalGiven + totalInterest;
    const receivedPercent = totalReturnAmount > 0 ? (totalReceived / totalReturnAmount) * 100 : 0;
    const pendingPercent = totalReturnAmount > 0 ? (totalPending / totalReturnAmount) * 100 : 0;

    return {
      totalGiven,
      totalReceived,
      totalInterest,
      totalPending,
      totalReturnAmount,
      receivedPercent,
      pendingPercent,
      activeCount,
      overdueCount,
      completedCount,
      totalCount: loans.length
    };
  }, [enrichedLoans]);

  // Monthly breakdown analysis for Graph Analytics
  const monthlyAnalytics = useMemo(() => {
    const monthsMap = new Map();

    enrichedLoans.forEach(l => {
      // Month key from givenDate: YYYY-MM
      const givenMonth = l.givenDate ? l.givenDate.substring(0, 7) : '2026-08';
      if (!monthsMap.has(givenMonth)) {
        monthsMap.set(givenMonth, { month: givenMonth, given: 0, received: 0 });
      }
      const item = monthsMap.get(givenMonth);
      item.given += l.principalAmount;
      item.received += l.totalPaid;
    });

    // Sort by month string
    const sorted = Array.from(monthsMap.values()).sort((a, b) => a.month.localeCompare(b.month));

    // Provide default fallback months if data is small so charts render gracefully
    if (sorted.length === 0) {
      return [
        { month: '2026-06', given: 50000, received: 35000 },
        { month: '2026-07', given: 80000, received: 60000 },
        { month: '2026-08', given: 120000, received: 75000 }
      ];
    }
    return sorted;
  }, [enrichedLoans]);

  const maxValInMonthly = useMemo(() => {
    return Math.max(...monthlyAnalytics.map(m => Math.max(m.given, m.received)), 10000);
  }, [monthlyAnalytics]);

  const formatCurrency = (val) => {
    return `${currencySymbol}${val.toLocaleString('en-IN')}`;
  };

  return html`
    <div class="page-transition max-w-4xl mx-auto flex flex-col gap-6">
      
      <!-- Header -->
      <div class="flex items-center gap-4">
        <${Button} variant="ghost" onClick=${() => setView({ name: 'dashboard' })} className="p-2 rounded-lg">
          <${Icon} name="arrowLeft" className="w-5 h-5 text-slate-600 dark:text-slate-300" />
        <//>
        <div>
          <h2 class="text-xl font-bold text-slate-900 dark:text-slate-100">Ledger Reports & Graph Analytics</h2>
          <p class="text-xs text-slate-500 dark:text-slate-400">Visual overview of lending trends, recovery graphs, and interest accrual metrics</p>
        </div>
      </div>

      <!-- Grid of Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-5">
        
        <${Card} className="flex flex-col gap-1">
          <p class="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">Total Ledger Value (Given + Byaj)</p>
          <p class="text-2xl font-black text-slate-900 dark:text-slate-100">${formatCurrency(stats.totalReturnAmount)}</p>
          <div class="text-[10px] text-slate-500 dark:text-slate-400 mt-2 flex justify-between">
            <span>Given: ${formatCurrency(stats.totalGiven)}</span>
            <span>Byaj: ${formatCurrency(stats.totalInterest)}</span>
          </div>
        <//>

        <${Card} className="flex flex-col gap-1">
          <p class="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">Total Received (Recovered)</p>
          <p class="text-2xl font-black text-emerald-600 dark:text-emerald-400">${formatCurrency(stats.totalReceived)}</p>
          <p class="text-[10px] text-emerald-600 dark:text-emerald-500 font-bold mt-2 flex items-center gap-1">
            <span class="inline-block h-2 w-2 rounded-full bg-emerald-500"></span>
            ${stats.receivedPercent.toFixed(1)}% recovery rate achieved
          </p>
        <//>

        <${Card} className="flex flex-col gap-1">
          <p class="text-[10px] text-slate-500 font-extrabold uppercase tracking-wider">Total Pending Collection</p>
          <p class="text-2xl font-black text-[#0F172A] dark:text-brand-400">${formatCurrency(stats.totalPending)}</p>
          <p class="text-[10px] text-slate-600 dark:text-brand-500 font-bold mt-2 flex items-center gap-1">
            <span class="inline-block h-2 w-2 rounded-full bg-slate-800 dark:bg-brand-500"></span>
            ${stats.pendingPercent.toFixed(1)}% collection outstanding
          </p>
        <//>

      </div>

      <!-- SECTION 2: Interactive Graph Analytics Charts -->
      <${Card} className="flex flex-col gap-5">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#E2E8F0] dark:border-slate-800 pb-3">
          <div>
            <h3 class="text-sm font-extrabold text-[#0F172A] dark:text-slate-100 uppercase tracking-wider flex items-center gap-2">
              <${Icon} name="chart" className="w-4.5 h-4.5 text-[#10B981]" /> Financial Analytics Charts
            </h3>
            <p class="text-xs text-slate-500 dark:text-slate-400">Interactive visual charts for loan disbursements and collections</p>
          </div>

          <!-- Chart Type Selector Pills -->
          <div class="flex items-center gap-1.5">
            <button 
              onClick=${() => setActiveChartTab('monthly')} 
              class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeChartTab === 'monthly' ? 'bg-[#0F172A] text-white dark:bg-slate-100 dark:text-slate-900' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'}"
            >
              Disbursement vs Collection
            </button>
            <button 
              onClick=${() => setActiveChartTab('distribution')} 
              class="px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeChartTab === 'distribution' ? 'bg-[#0F172A] text-white dark:bg-slate-100 dark:text-slate-900' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400'}"
            >
              Loan Breakdown
            </button>
          </div>
        </div>

        <!-- CHART 1: Monthly Disbursement vs Collection SVG Bar Chart -->
        ${activeChartTab === 'monthly' && html`
          <div class="flex flex-col gap-3">
            <!-- Chart Legend -->
            <div class="flex items-center gap-5 text-xs font-bold">
              <span class="flex items-center gap-1.5">
                <span class="w-3 h-3 rounded-xs bg-[#0F172A] dark:bg-slate-100"></span> Given Amount
              </span>
              <span class="flex items-center gap-1.5">
                <span class="w-3 h-3 rounded-xs bg-[#10B981]"></span> Recovered Amount
              </span>
            </div>

            <!-- SVG Bar Chart Canvas -->
            <div class="w-full h-64 bg-slate-50 border border-[#E2E8F0] dark:bg-slate-950 dark:border-slate-850 rounded-xl p-4 flex items-end justify-around gap-2 relative">
              
              <!-- Background grid lines -->
              <div class="absolute inset-x-4 top-4 border-b border-slate-200 dark:border-slate-850 border-dashed"></div>
              <div class="absolute inset-x-4 top-1/2 border-b border-slate-200 dark:border-slate-850 border-dashed"></div>
              
              ${monthlyAnalytics.map((item) => {
                const givenHeightPct = (item.given / maxValInMonthly) * 80;
                const receivedHeightPct = (item.received / maxValInMonthly) * 80;
                return html`
                  <div key=${item.month} class="flex flex-col items-center gap-2 h-full justify-end z-10 group">
                    
                    <!-- Bars Container -->
                    <div class="flex items-end gap-1.5 h-full">
                      <!-- Given Bar -->
                      <div 
                        style=${{ height: `${Math.max(givenHeightPct, 6)}%` }} 
                        class="w-6 md:w-10 bg-[#0F172A] dark:bg-slate-200 rounded-t transition-all group-hover:bg-slate-700 relative"
                        title=${`Given: ${formatCurrency(item.given)}`}
                      >
                        <span class="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-7 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[9px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap z-20 pointer-events-none">
                          ${formatCurrency(item.given)}
                        </span>
                      </div>

                      <!-- Received Bar -->
                      <div 
                        style=${{ height: `${Math.max(receivedHeightPct, 6)}%` }} 
                        class="w-6 md:w-10 bg-[#10B981] rounded-t transition-all hover:bg-emerald-600 relative"
                        title=${`Recovered: ${formatCurrency(item.received)}`}
                      >
                        <span class="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-7 left-1/2 -translate-x-1/2 bg-emerald-950 text-emerald-300 text-[9px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap z-20 pointer-events-none">
                          ${formatCurrency(item.received)}
                        </span>
                      </div>
                    </div>

                    <!-- Month Label -->
                    <span class="text-[10px] font-bold text-slate-600 dark:text-slate-400 mt-1">${item.month}</span>
                  </div>
                `;
              })}
            </div>
          </div>
        `}

        <!-- CHART 2: Loan Breakdown Donut Analytics -->
        ${activeChartTab === 'distribution' && html`
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
            
            <!-- SVG Donut Chart -->
            <div class="relative flex items-center justify-center h-56">
              <svg viewBox="0 0 100 100" class="w-48 h-48 transform -rotate-90">
                <!-- Background track -->
                <circle cx="50" cy="50" r="38" stroke="#E2E8F0" stroke-width="12" fill="none" class="dark:stroke-slate-800" />
                
                <!-- Principal Segment (Navy) -->
                <circle 
                  cx="50" 
                  cy="50" 
                  r="38" 
                  stroke="#0F172A" 
                  stroke-width="12" 
                  fill="none" 
                  stroke-dasharray=${`${stats.totalGiven > 0 ? (stats.totalGiven / (stats.totalGiven + stats.totalInterest)) * 238 : 120} 238`}
                  class="transition-all duration-300 dark:stroke-slate-100"
                />

                <!-- Interest Segment (Emerald) -->
                <circle 
                  cx="50" 
                  cy="50" 
                  r="38" 
                  stroke="#10B981" 
                  stroke-width="12" 
                  fill="none" 
                  stroke-dasharray=${`${stats.totalInterest > 0 ? (stats.totalInterest / (stats.totalGiven + stats.totalInterest)) * 238 : 60} 238`}
                  stroke-dashoffset=${`-${stats.totalGiven > 0 ? (stats.totalGiven / (stats.totalGiven + stats.totalInterest)) * 238 : 120}`}
                  class="transition-all duration-300"
                />
              </svg>

              <!-- Center Stat Value -->
              <div class="absolute text-center">
                <p class="text-[10px] font-extrabold text-slate-400 uppercase">Recovery</p>
                <p class="text-xl font-black text-slate-900 dark:text-slate-100">${stats.receivedPercent.toFixed(0)}%</p>
              </div>
            </div>

            <!-- Legend Details -->
            <div class="flex flex-col gap-3 text-xs">
              <div class="p-3 bg-slate-50 border border-[#E2E8F0] dark:bg-slate-950 dark:border-slate-850 rounded-lg flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="w-3 h-3 rounded bg-[#0F172A] dark:bg-slate-100"></span>
                  <span class="font-bold text-slate-700 dark:text-slate-200">Principal Amount Given</span>
                </div>
                <span class="font-black text-slate-900 dark:text-slate-100">${formatCurrency(stats.totalGiven)}</span>
              </div>

              <div class="p-3 bg-slate-50 border border-[#E2E8F0] dark:bg-slate-950 dark:border-slate-850 rounded-lg flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="w-3 h-3 rounded bg-[#10B981]"></span>
                  <span class="font-bold text-slate-700 dark:text-slate-200">Accrued Interest (Byaj)</span>
                </div>
                <span class="font-black text-emerald-600 dark:text-emerald-400">${formatCurrency(stats.totalInterest)}</span>
              </div>

              <div class="p-3 bg-slate-50 border border-[#E2E8F0] dark:bg-slate-950 dark:border-slate-850 rounded-lg flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="w-3 h-3 rounded bg-amber-500"></span>
                  <span class="font-bold text-slate-700 dark:text-slate-200">Total Pending Balance</span>
                </div>
                <span class="font-black text-amber-600 dark:text-amber-400">${formatCurrency(stats.totalPending)}</span>
              </div>
            </div>

          </div>
        `}

      <//>

      <!-- Account / Loan Status Distribution Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        <!-- Loan Count distribution -->
        <${Card} className="flex flex-col gap-4">
          <h3 class="text-xs font-extrabold text-slate-900 dark:text-slate-200 uppercase tracking-wider">Loan Status Distribution</h3>
          
          <div class="flex flex-col gap-3 mt-1 text-xs">
            
            <!-- Active Loans -->
            <div class="flex flex-col gap-1">
              <div class="flex justify-between items-center text-slate-550 dark:text-slate-400">
                <span class="flex items-center gap-2"><span class="h-2 w-2 rounded-full bg-emerald-500"></span> Active (Not due)</span>
                <span class="font-bold text-slate-800 dark:text-slate-200">${stats.activeCount} loans</span>
              </div>
              <div class="w-full h-2 rounded bg-slate-100 dark:bg-slate-950 overflow-hidden">
                <div 
                  class="h-full bg-emerald-500" 
                  style=${{ width: `${stats.totalCount > 0 ? (stats.activeCount / stats.totalCount) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            <!-- Overdue Loans -->
            <div class="flex flex-col gap-1">
              <div class="flex justify-between items-center text-slate-550 dark:text-slate-400">
                <span class="flex items-center gap-2"><span class="h-2 w-2 rounded-full bg-rose-500 animate-pulse"></span> Overdue</span>
                <span class="font-bold text-slate-800 dark:text-slate-200">${stats.overdueCount} loans</span>
              </div>
              <div class="w-full h-2 rounded bg-slate-100 dark:bg-slate-950 overflow-hidden">
                <div 
                  class="h-full bg-rose-500" 
                  style=${{ width: `${stats.totalCount > 0 ? (stats.overdueCount / stats.totalCount) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

            <!-- Completed Loans -->
            <div class="flex flex-col gap-1">
              <div class="flex justify-between items-center text-slate-555 dark:text-slate-400">
                <span class="flex items-center gap-2"><span class="h-2 w-2 rounded-full bg-slate-400 dark:bg-slate-600"></span> Completed (Paid)</span>
                <span class="font-bold text-slate-800 dark:text-slate-200">${stats.completedCount} loans</span>
              </div>
              <div class="w-full h-2 rounded bg-slate-100 dark:bg-slate-950 overflow-hidden">
                <div 
                  class="h-full bg-slate-400 dark:bg-slate-600" 
                  style=${{ width: `${stats.totalCount > 0 ? (stats.completedCount / stats.totalCount) * 100 : 0}%` }}
                ></div>
              </div>
            </div>

          </div>
        <//>

        <!-- Dynamic Collection Overview panel -->
        <${Card} className="flex flex-col gap-3 justify-center text-slate-700 dark:text-slate-300">
          <h3 class="text-xs font-extrabold text-slate-900 dark:text-slate-200 uppercase tracking-wider mb-1">Collection Highlights</h3>
          <div class="flex items-start gap-3 text-xs border-b border-slate-100 dark:border-slate-850 pb-2">
            <div class="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 mt-0.5">
              <${Icon} name="check" className="w-4 h-4" />
            </div>
            <div>
              <p class="font-bold text-slate-900 dark:text-slate-200">Recovery Metrics</p>
              <p class="text-slate-550 dark:text-slate-400 mt-0.5">You have collected ${formatCurrency(stats.totalReceived)} out of ${formatCurrency(stats.totalReturnAmount)} expected repayments.</p>
            </div>
          </div>

          <div class="flex items-start gap-3 text-xs mt-1">
            <div class="p-1.5 rounded-lg ${stats.overdueCount > 0 ? 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-400' : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'} mt-0.5">
              <${Icon} name="alertTriangle" className="w-4 h-4" />
            </div>
            <div>
              <p class="font-bold text-slate-900 dark:text-slate-200">${stats.overdueCount > 0 ? 'Overdue Alerts Active' : 'All loans in good standing'}</p>
              <p class="text-slate-550 dark:text-slate-400 mt-0.5">
                ${stats.overdueCount > 0 
                  ? `You have ${stats.overdueCount} loans that are currently past their due dates. Review these under the Collections tab on your Dashboard.` 
                  : 'Great! There are currently no loans flagged as overdue.'}
              </p>
            </div>
          </div>
        <//>

      </div>

    </div>
  `;
}
