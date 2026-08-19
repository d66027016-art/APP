import { h } from './lib/preact.module.js';
import htm from './lib/htm.module.js';

const html = htm.bind(h);

// Reusable SVG Icon Component
export function Icon({ name, className = "w-5 h-5", strokeWidth = 2 }) {
  const paths = {
    plus: 'M12 5v14M5 12h14',
    minus: 'M5 12h14',
    settings: 'M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
    user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
    calendar: 'M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z M16 2v4 M8 2v4 M3 10h18',
    dollar: 'M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',
    search: 'M21 21l-6-6m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0z',
    filter: 'M22 3H2l8 9.46V19l4 2v-8.54L22 3z',
    arrowLeft: 'M19 12H5M12 19l-7-7 7-7',
    check: 'M20 6L9 17l-5-5',
    trash: 'M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2',
    phone: 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z',
    bell: 'M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 0 1-3.46 0',
    info: 'M12 16v-4M12 8h.01 M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2z',
    chart: 'M18 20V10M12 20V4M6 20v-6',
    alertTriangle: 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z M12 9v4 M12 17h.01',
    download: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3',
    upload: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12',
    edit: 'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7 M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z',
    x: 'M18 6L6 18M6 6l12 12',
    notes: 'M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z',
    mapPin: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z'
  };

  const path = paths[name];
  if (!path) return null;

  return html`
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      stroke-width=${strokeWidth} 
      stroke-linecap="round" 
      stroke-linejoin="round" 
      class=${className}
    >
      <path d=${path} />
    </svg>
  `;
}

// Visual badge indicating status of a loan
export function StatusBadge({ status }) {
  const configs = {
    active: { text: 'Active', bg: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-750' },
    partially_paid: { text: 'Partially Paid', bg: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900' },
    paid: { text: 'Paid', bg: 'bg-emerald-50 text-emerald-700 border-emerald-250 dark:bg-emerald-950/30 dark:text-emerald-450 dark:border-emerald-900' },
    overdue: { text: 'Overdue', bg: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-455 dark:border-rose-900' }
  };

  const config = configs[status] || configs.active;

  return html`
    <span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${config.bg}">
      ${config.text}
    </span>
  `;
}

// Button Component (8px–12px radius = rounded-lg)
export function Button({ 
  children, 
  onClick, 
  variant = 'primary', 
  className = '', 
  disabled = false, 
  type = 'button' 
}) {
  const baseStyle = "px-4 py-2 rounded-lg font-semibold text-xs tracking-wide transition-all duration-150 focus:outline-none flex items-center justify-center gap-2 select-none disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]";
  
  const variants = {
    primary: "bg-[#0F172A] hover:bg-slate-800 text-white shadow-sm border border-[#0F172A] dark:bg-slate-100 dark:hover:bg-slate-200 dark:text-slate-900",
    secondary: "bg-white hover:bg-slate-50 text-slate-700 border border-[#E2E8F0] dark:bg-slate-900 dark:hover:bg-slate-850 dark:text-slate-100 dark:border-slate-800",
    success: "bg-[#10B981] hover:bg-[#059669] text-white shadow-sm dark:bg-emerald-600 dark:hover:bg-emerald-500",
    danger: "bg-[#DC2626] hover:bg-rose-700 text-white shadow-sm",
    ghost: "bg-transparent hover:bg-slate-100 text-slate-600 dark:hover:bg-slate-850 dark:text-slate-300"
  };

  const style = `${baseStyle} ${variants[variant]} ${className}`;

  return html`
    <button type=${type} onClick=${onClick} class=${style} disabled=${disabled}>
      ${children}
    </button>
  `;
}

// Card Wrapper (White bg, thin border #E2E8F0, very subtle shadow, 10px–12px radius = rounded-xl)
export function Card({ children, className = "", onClick }) {
  const pointerClass = onClick ? 'cursor-pointer hover:border-slate-350 hover:bg-slate-50/50 dark:hover:border-slate-700 dark:hover:bg-slate-850 active:scale-[0.99] transition-all' : '';
  return html`
    <div 
      onClick=${onClick} 
      class="bg-white border border-[#E2E8F0] dark:bg-slate-900 dark:border-slate-800 rounded-xl p-5 shadow-[0_1px_3px_0_rgba(15,23,42,0.03)] ${pointerClass} ${className}"
    >
      ${children}
    </div>
  `;
}

// Text Input Component
export function Input({ 
  label, 
  type = "text", 
  value, 
  onChange, 
  placeholder = "", 
  required = false, 
  className = "",
  min = "",
  step = "",
  icon = null
}) {
  return html`
    <div class="flex flex-col gap-1.5 ${className}">
      ${label && html`<label class="text-[10px] font-extrabold text-[#64748B] dark:text-slate-400 select-none uppercase tracking-wider">${label} ${required && html`<span class="text-rose-500">*</span>`}</label>`}
      <div class="relative flex items-center">
        ${icon && html`<div class="absolute left-3 text-slate-450 dark:text-slate-500">${icon}</div>`}
        <input 
          type=${type} 
          value=${value} 
          onInput=${onChange} 
          placeholder=${placeholder} 
          required=${required} 
          min=${min}
          step=${step}
          class="w-full bg-white border border-[#E2E8F0] dark:bg-slate-950 dark:border-slate-800 focus:border-[#0F172A] dark:focus:border-slate-100 text-[#0F172A] dark:text-slate-100 rounded-lg py-2 ${icon ? 'pl-9' : 'px-3'} pr-3 focus:outline-none transition-colors duration-150 text-xs font-semibold shadow-sm"
        />
      </div>
    </div>
  `;
}

// Dropdown Select Component
export function Select({ 
  label, 
  value, 
  onChange, 
  options = [], 
  required = false, 
  className = "" 
}) {
  return html`
    <div class="flex flex-col gap-1.5 ${className}">
      ${label && html`<label class="text-[10px] font-extrabold text-[#64748B] dark:text-slate-400 select-none uppercase tracking-wider">${label} ${required && html`<span class="text-rose-500">*</span>`}</label>`}
      <select 
        value=${value} 
        onChange=${onChange} 
        required=${required} 
        class="w-full bg-white border border-[#E2E8F0] dark:bg-slate-950 dark:border-slate-800 focus:border-[#0F172A] dark:focus:border-slate-100 text-[#0F172A] dark:text-slate-100 rounded-lg px-3 py-2 focus:outline-none transition-colors duration-150 text-xs font-semibold appearance-none cursor-pointer shadow-sm"
        style="background-image: url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 fill=%22none%22 viewBox=%220 0 20 20%22%3E%3Cpath stroke=%22%2394a3b8%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22 stroke-width=%221.5%22 d=%22m6 8 4 4 4-4%22/%3E%3C/svg%3E'); background-position: right 0.75rem center; background-repeat: no-repeat; background-size: 1.25rem auto;"
      >
        ${options.map(opt => html`
          <option value=${opt.value} class="bg-white text-slate-900 dark:bg-slate-900 dark:text-slate-100">${opt.label}</option>
        `)}
      </select>
    </div>
  `;
}

// Overlay Modal
export function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return html`
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <!-- Backdrop -->
      <div class="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/70 backdrop-blur-xs transition-opacity" onClick=${onClose}></div>
      
      <!-- Content Panel -->
      <div class="bg-white border border-[#E2E8F0] dark:bg-slate-900 dark:border-slate-800 rounded-xl max-w-lg w-full z-10 shadow-xl overflow-hidden flex flex-col max-h-[90vh] animate-[fadeIn_0.15s_ease-out]">
        <!-- Modal Header -->
        <div class="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800">
          <h3 class="text-sm font-bold text-[#0F172A] dark:text-slate-100 uppercase tracking-wider">${title}</h3>
          <button onClick=${onClose} class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800">
            <${Icon} name="x" className="w-4.5 h-4.5" />
          </button>
        </div>
        
        <!-- Modal Scrollable Content -->
        <div class="p-5 overflow-y-auto flex-1 text-xs text-slate-700 dark:text-slate-200">
          ${children}
        </div>
      </div>
    </div>
  `;
}

// Toast Alert
export function Toast({ message, type = 'success', onClose }) {
  return html`
    <div class="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-white border border-[#E2E8F0] text-slate-800 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-100 px-4 py-3 rounded-lg shadow-lg animate-[fadeIn_0.12s_ease-out] w-[90%] max-w-md">
      <div class="p-1 rounded ${type === 'success' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' : 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-455'}">
        <${Icon} name=${type === 'success' ? 'check' : 'alertTriangle'} className="w-4 h-4" />
      </div>
      <p class="text-xs font-semibold flex-1 text-slate-700 dark:text-slate-200">${message}</p>
      <button onClick=${onClose} class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-0.5 rounded hover:bg-slate-50 dark:hover:bg-slate-850">
        <${Icon} name="x" className="w-3.5 h-3.5" />
      </button>
    </div>
  `;
}

