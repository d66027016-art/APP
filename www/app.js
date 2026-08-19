import { h, render } from './lib/preact.module.js';
import { useState, useEffect, useCallback, useMemo } from './lib/hooks.module.js';
import htm from './lib/htm.module.js';

// Database and Calculations
import { 
  db, 
  getAllLoansWithDetails, 
  getPersonDetails, 
  addPersonWithLoan, 
  addLoan, 
  addPayment, 
  deletePayment, 
  deleteLoan, 
  deletePerson,
  exportAllData,
  importAllData
} from './database.js';
import { getLoanSummary } from './calculations.js';
import { checkAndNotifyDuePayments } from './notification-service.js';

// Reusable Components
import { Icon, Toast } from './components.js';

// Views
import Dashboard from './views/dashboard.js';
import AddLoan from './views/add-loan.js';
import PersonDetails from './views/person-details.js';
import Reports from './views/reports.js';
import Settings from './views/settings.js';

const html = htm.bind(h);

// Hardcoded system local date for 2026-08-19 as requested
const SYSTEM_DATE = '2026-08-19';

function App() {
  const [loans, setLoans] = useState([]);
  const [currentView, setCurrentView] = useState({ name: 'dashboard' });
  const [currencySymbol, setCurrencySymbol] = useState(localStorage.getItem('currencySymbol') || '₹');
  const [toast, setToast] = useState(null);
  
  // Specific person state for detail views
  const [selectedPersonDetails, setSelectedPersonDetails] = useState(null);

  // Load all loans and enrich them
  const loadData = useCallback(async () => {
    try {
      const allLoans = await getAllLoansWithDetails();
      setLoans(allLoans);

      // If we are currently viewing person details, refresh that data as well
      if (currentView.name === 'person-details' && currentView.id) {
        const details = await getPersonDetails(currentView.id);
        setSelectedPersonDetails(details);
      }
    } catch (err) {
      console.error("Failed to load records from IndexedDB:", err);
      showToast("Failed to load ledger records.", "error");
    }
  }, [currentView]);

  // Load data on start and whenever view changes
  useEffect(() => {
    loadData();
  }, [currentView.name, currentView.id]);

  // Save currency preference
  useEffect(() => {
    localStorage.setItem('currencySymbol', currencySymbol);
  }, [currencySymbol]);

  // Daily Notifications scan
  useEffect(() => {
    if (loans.length > 0) {
      const enriched = loans.map(l => getLoanSummary(l, l.payments, SYSTEM_DATE));
      checkAndNotifyDuePayments(enriched, SYSTEM_DATE);
    }
  }, [loans]);

  // Handle toast timers
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  // View Navigation helper
  const navigateTo = (viewObj) => {
    setCurrentView(viewObj);
  };

  // 1. SAVE NEW PERSON & LOAN
  const handleSavePersonAndLoan = async (personData, loanData) => {
    try {
      await addPersonWithLoan(personData, loanData);
      showToast("Person and Loan successfully recorded!");
      navigateTo({ name: 'dashboard' });
      loadData();
    } catch (err) {
      console.error(err);
      showToast("Failed to save loan record.", "error");
    }
  };

  // 2. RECEIVE LOAN PAYMENT
  const handleAddPayment = async (paymentData) => {
    try {
      await addPayment(paymentData);
      showToast("Payment recorded successfully!");
      loadData();
    } catch (err) {
      console.error(err);
      showToast("Failed to record payment.", "error");
    }
  };

  // 3. DELETE PAYMENT RECORD
  const handleDeletePayment = async (paymentId) => {
    try {
      await deletePayment(paymentId);
      showToast("Payment record deleted.");
      loadData();
    } catch (err) {
      console.error(err);
      showToast("Failed to delete payment.", "error");
    }
  };

  // 4. ADD ADDITIONAL LOAN
  const handleAddAdditionalLoan = async (loanData) => {
    try {
      await addLoan(loanData);
      showToast("Additional loan successfully recorded!");
      loadData();
    } catch (err) {
      console.error(err);
      showToast("Failed to add loan.", "error");
    }
  };

  // 5. DELETE ENTIRE LOAN
  const handleDeleteLoan = async (loanId) => {
    try {
      await deleteLoan(loanId);
      showToast("Loan and payments deleted.");
      loadData();
    } catch (err) {
      console.error(err);
      showToast("Failed to delete loan.", "error");
    }
  };

  // 6. DELETE PERSON
  const handleDeletePerson = async (personId) => {
    try {
      await deletePerson(personId);
      showToast("Borrower profile deleted.");
      navigateTo({ name: 'dashboard' });
      loadData();
    } catch (err) {
      console.error(err);
      showToast("Failed to delete person.", "error");
    }
  };

  // 7. MOCK TRIGGER NOTIFICATION
  const triggerNotification = (messageText) => {
    if (!('Notification' in window)) {
      showToast("Notifications not supported on this browser.", "error");
      return;
    }
    if (Notification.permission === 'granted') {
      new Notification("Finance by Pooja", {
        body: messageText,
        icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%2310b981" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>'
      });
    } else {
      showToast("Please grant Notification permission in Settings.", "error");
    }
  };

  // Trigger browser alerts
  function checkAndTriggerNotifications(enrichedLoans, currentDateStr) {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    
    // Check if we already alerted today
    const lastNotify = localStorage.getItem('lastNotificationDate');
    if (lastNotify === currentDateStr) return;

    let dueCount = 0;
    let overdueCount = 0;
    let totalAmt = 0;

    enrichedLoans.forEach(l => {
      if (l.remainingAmount > 0) {
        if (l.dueDate === currentDateStr) {
          dueCount++;
          totalAmt += l.remainingAmount;
        } else if (l.dueDate < currentDateStr) {
          overdueCount++;
        }
      }
    });

    if (dueCount > 0 || overdueCount > 0) {
      let msg = '';
      if (dueCount > 0 && overdueCount > 0) {
        msg = `${dueCount} payments due today (${currencySymbol}${totalAmt.toLocaleString('en-IN')}) and ${overdueCount} overdue collections outstanding!`;
      } else if (dueCount > 0) {
        msg = `${dueCount} payments due today (${currencySymbol}${totalAmt.toLocaleString('en-IN')}).`;
      } else {
        msg = `${overdueCount} overdue payments need action.`;
      }

      new Notification("Pooja Finance Ledger Alert", {
        body: msg,
        icon: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="%2310b981" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>'
      });

      localStorage.setItem('lastNotificationDate', currentDateStr);
    }
  }

  // Render view router
  const renderView = () => {
    switch (currentView.name) {
      case 'add-loan':
        return html`<${AddLoan} 
          setView=${navigateTo} 
          onSave=${handleSavePersonAndLoan} 
          currentDateStr=${SYSTEM_DATE} 
          currencySymbol=${currencySymbol} 
        />`;
      case 'person-details':
        return html`<${PersonDetails} 
          personId=${currentView.id} 
          initialAction=${currentView.action}
          personDetails=${selectedPersonDetails} 
          setView=${navigateTo} 
          onAddPayment=${handleAddPayment} 
          onDeletePayment=${handleDeletePayment} 
          onDeletePerson=${handleDeletePerson} 
          onDeleteLoan=${handleDeleteLoan} 
          onAddAdditionalLoan=${handleAddAdditionalLoan}
          currentDateStr=${SYSTEM_DATE} 
          currencySymbol=${currencySymbol} 
        />`;
      case 'reports':
        return html`<${Reports} 
          loans=${loans} 
          setView=${navigateTo} 
          currentDateStr=${SYSTEM_DATE} 
          currencySymbol=${currencySymbol} 
        />`;
      case 'settings':
        return html`<${Settings} 
          currencySymbol=${currencySymbol} 
          setCurrencySymbol=${setCurrencySymbol} 
          setView=${navigateTo} 
          onBackupExport=${exportAllData} 
          onBackupImport=${importAllData}
          onTriggerTestNotification=${triggerNotification} 
        />`;
      case 'dashboard':
      default:
        return html`<${Dashboard} 
          loans=${loans} 
          setView=${navigateTo} 
          currencySymbol=${currencySymbol} 
          currentDateStr=${SYSTEM_DATE} 
        />`;
    }
  };

  return html`
    <div class="flex h-screen bg-[#F8FAFC] dark:bg-slate-950 text-[#0F172A] dark:text-slate-100 font-sans overflow-hidden">
      
      <!-- Clean Left Sidebar Navigation (Desktop Only) -->
      <aside class="hidden md:flex flex-col w-64 bg-[#0F172A] text-white border-r border-[#0f172a] flex-shrink-0">
        <!-- Logo Header -->
        <div class="h-16 flex items-center gap-3 px-6 border-b border-slate-800">
          <div class="bg-[#10B981] text-white p-1.5 rounded-lg shadow-sm">
            <${Icon} name="dollar" className="w-5 h-5" strokeWidth="2.5" />
          </div>
          <span class="font-extrabold text-sm uppercase tracking-wider text-slate-100 select-none">Finance by Pooja</span>
        </div>

        <!-- Menu items -->
        <nav class="flex-1 px-4 py-6 space-y-1.5">
          <button 
            onClick=${() => navigateTo({ name: 'dashboard' })} 
            class="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${currentView.name === 'dashboard' ? 'bg-slate-800 text-white border-l-4 border-[#10B981]' : 'text-slate-400 hover:bg-slate-800/40 hover:text-white'}"
          >
            <${Icon} name="user" className="w-4.5 h-4.5" />
            <span>Dashboard</span>
          </button>
          <button 
            onClick=${() => navigateTo({ name: 'reports' })} 
            class="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${currentView.name === 'reports' ? 'bg-slate-800 text-white border-l-4 border-[#10B981]' : 'text-slate-400 hover:bg-slate-800/40 hover:text-white'}"
          >
            <${Icon} name="chart" className="w-4.5 h-4.5" />
            <span>Ledger Reports</span>
          </button>
          <button 
            onClick=${() => navigateTo({ name: 'settings' })} 
            class="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${currentView.name === 'settings' ? 'bg-slate-800 text-white border-l-4 border-[#10B981]' : 'text-slate-400 hover:bg-slate-800/40 hover:text-white'}"
          >
            <${Icon} name="settings" className="w-4.5 h-4.5" />
            <span>Settings</span>
          </button>
        </nav>

        <!-- Sidebar footer -->
        <div class="p-6 border-t border-slate-800 text-[10px] text-slate-500 font-bold uppercase tracking-wider select-none">
          <p class="text-slate-400">Pooja Finance Ltd</p>
          <p class="mt-1 text-slate-600 font-medium">Local Ledger v1.2.0</p>
        </div>
      </aside>

      <!-- Main Content Panel Area -->
      <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
        
        <!-- Compact Top Navigation Header -->
        <header class="h-16 bg-white dark:bg-slate-900 border-b border-[#E2E8F0] dark:border-slate-800 px-6 flex items-center justify-between flex-shrink-0 z-10 shadow-sm">
          <div class="flex items-center gap-4 md:hidden">
            <!-- Mobile logo in Header -->
            <div class="flex items-center gap-2 cursor-pointer select-none" onClick=${() => navigateTo({ name: 'dashboard' })}>
              <div class="bg-[#0F172A] text-white p-1 rounded-lg">
                <${Icon} name="dollar" className="w-4.5 h-4.5" />
              </div>
              <span class="font-extrabold text-xs uppercase tracking-wider text-slate-800 dark:text-slate-100">Finance by Pooja</span>
            </div>
          </div>

          <div class="flex items-center gap-4 ml-auto">
            <span class="text-[10px] bg-slate-100 dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 px-3 py-1.5 rounded-lg font-bold text-slate-600 dark:text-slate-400 select-none flex items-center gap-1.5">
              📅 Ledger Date: ${SYSTEM_DATE}
            </span>
          </div>
        </header>

        <!-- Page View Main Body -->
        <main class="flex-grow overflow-y-auto p-6 md:p-8 bg-[#F8FAFC] dark:bg-slate-950 pb-24 md:pb-8">
          ${renderView()}
        </main>
      </div>

      <!-- Bottom Navigation bar for Mobile Devices -->
      <nav class="fixed bottom-0 left-0 right-0 bg-white border-t border-[#E2E8F0] dark:bg-slate-900 dark:border-slate-800 px-4 py-2 z-40 md:hidden flex justify-around items-center shadow-lg">
        <button onClick=${() => navigateTo({ name: 'dashboard' })} class="flex flex-col items-center gap-1 select-none ${currentView.name === 'dashboard' ? 'text-[#0F172A] dark:text-brand-400 font-bold' : 'text-slate-500 dark:text-slate-400'}">
          <${Icon} name="user" className="w-4.5 h-4.5" />
          <span class="text-[9px] uppercase tracking-wider font-bold">Ledger</span>
        </button>
        <button onClick=${() => navigateTo({ name: 'add-loan' })} class="flex flex-col items-center gap-1 select-none ${currentView.name === 'add-loan' ? 'text-[#0F172A] dark:text-brand-400 font-bold' : 'text-slate-500 dark:text-slate-400'}">
          <div class="-mt-6 bg-[#0F172A] text-white dark:bg-slate-100 dark:text-slate-900 p-2.5 rounded-full shadow border-4 border-slate-50 dark:border-slate-950 transition-all">
            <${Icon} name="plus" className="w-4.5 h-4.5" strokeWidth="2.5" />
          </div>
          <span class="text-[9px] uppercase tracking-wider font-bold mt-0.5">New Loan</span>
        </button>
        <button onClick=${() => navigateTo({ name: 'reports' })} class="flex flex-col items-center gap-1 select-none ${currentView.name === 'reports' ? 'text-[#0F172A] dark:text-brand-400 font-bold' : 'text-slate-500 dark:text-slate-400'}">
          <${Icon} name="chart" className="w-4.5 h-4.5" />
          <span class="text-[9px] uppercase tracking-wider font-bold">Reports</span>
        </button>
        <button onClick=${() => navigateTo({ name: 'settings' })} class="flex flex-col items-center gap-1 select-none ${currentView.name === 'settings' ? 'text-[#0F172A] dark:text-brand-400 font-bold' : 'text-slate-500 dark:text-slate-400'}">
          <${Icon} name="settings" className="w-4.5 h-4.5" />
          <span class="text-[9px] uppercase tracking-wider font-bold">Settings</span>
        </button>
      </nav>

      <!-- Global Toast Alert Portal -->
      ${toast && html`
        <${Toast} message=${toast.message} type=${toast.type} onClose=${() => setToast(null)} />
      `}

    </div>
  `;
}

// Check saved theme from local storage (defaults to light mode)
const theme = localStorage.getItem('theme') || 'light';
if (theme === 'dark') {
  document.documentElement.classList.add('dark');
} else {
  document.documentElement.classList.remove('dark');
}

// Render root Preact component
render(html`<${App} />`, document.getElementById('app'));


