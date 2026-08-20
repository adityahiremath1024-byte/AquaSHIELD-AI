/**
 * AquaShield AI — Sidebar Navigation Component v2.0
 * Responsive drawer with mobile hamburger toggle and backdrop.
 */

const SIDEBAR_NAV_ITEMS = [
  { label: 'Overview',        icon: 'grid',      href: '/index.html' },
  { label: 'Weather',         icon: 'cloud',     href: '/weather.html' },
  { label: 'Satellite',       icon: 'satellite', href: '/satellite.html' },
  { label: 'Hospital',        icon: 'hospital',  href: '/hospital.html' },
  { label: 'Citizen',         icon: 'citizen',   href: '/citizen.html' },
  { label: 'Fusion',          icon: 'brain',     href: '/fusion.html' },
  { label: 'Prediction',      icon: 'chart',     href: '/prediction.html' },
  { label: 'Decision Engine', icon: 'gear',      href: '/dioe.html' },
];

const SIDEBAR_ICONS = {
  grid: `<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>`,
  cloud: `<svg viewBox="0 0 24 24"><path d="M20 17.58A5 5 0 0 0 18 8h-1.26A8 8 0 1 0 4 16.25"/><path d="M8 16h.01"/><path d="M8 20h.01"/><path d="M12 18h.01"/><path d="M12 22h.01"/><path d="M16 16h.01"/><path d="M16 20h.01"/></svg>`,
  satellite: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="2"/><path d="M4.93 4.93l4.24 4.24"/><path d="M14.83 14.83l4.24 4.24"/><path d="M14.83 9.17l4.24-4.24"/><path d="M4.93 19.07l4.24-4.24"/><path d="M12 2v4"/><path d="M12 18v4"/><path d="M2 12h4"/><path d="M18 12h4"/></svg>`,
  hospital: `<svg viewBox="0 0 24 24"><path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M9 21v-4h6v4"/><path d="M10 10h4"/><path d="M12 8v4"/></svg>`,
  citizen: `<svg viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  brain: `<svg viewBox="0 0 24 24"><path d="M12 2a4 4 0 0 1 4 4c0 1.95-1.4 3.58-3.25 3.93"/><path d="M8 6a4 4 0 0 1 7.54-1.83"/><path d="M18.2 9.8a3 3 0 0 1-.2 5.42"/><path d="M6 10a3 3 0 0 0 .2 5.22"/><path d="M12 22v-8"/><path d="M8 18h8"/><circle cx="12" cy="12" r="3"/></svg>`,
  chart: `<svg viewBox="0 0 24 24"><path d="M3 3v18h18"/><path d="M7 16l4-8 4 4 4-8"/></svg>`,
  gear: `<svg viewBox="0 0 24 24"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>`,
};

const SHIELD_SVG = `<svg class="shield-icon" viewBox="0 0 24 24"><path d="M12 2l7 4v5c0 5.25-3.5 9.74-7 11-3.5-1.26-7-5.75-7-11V6l7-4z"/><path d="M12 8v4"/><circle cx="12" cy="15" r="0.5" fill="currentColor"/></svg>`;

/**
 * Renders the responsive sidebar into the DOM.
 * @param {string} activePage - The href fragment (e.g. '/satellite.html') to mark as active.
 */
function renderSidebar(activePage) {
  // Prevent duplicate rendering
  if (document.getElementById('app-sidebar')) return;

  const sidebar = document.createElement('aside');
  sidebar.className = 'sidebar';
  sidebar.id = 'app-sidebar';
  sidebar.setAttribute('role', 'navigation');
  sidebar.setAttribute('aria-label', 'Main navigation');

  // Backdrop overlay for mobile drawer
  let backdrop = document.getElementById('sidebar-backdrop');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.id = 'sidebar-backdrop';
    backdrop.className = 'sidebar-backdrop';
    document.body.appendChild(backdrop);
    backdrop.addEventListener('click', () => {
      sidebar.classList.remove('mobile-open');
      backdrop.classList.remove('active');
    });
  }

  // Logo
  const logoDiv = document.createElement('a');
  logoDiv.className = 'sidebar-logo';
  logoDiv.href = '/index.html';
  logoDiv.title = 'AquaShield AI — Overview';
  logoDiv.innerHTML = SHIELD_SVG;
  sidebar.appendChild(logoDiv);

  // Nav items
  const nav = document.createElement('nav');
  nav.className = 'sidebar-nav';

  SIDEBAR_NAV_ITEMS.forEach(item => {
    const a = document.createElement('a');
    a.className = 'nav-item';
    a.href = item.href;
    a.setAttribute('aria-label', item.label);

    if (item.href === activePage) {
      a.classList.add('active');
      a.setAttribute('aria-current', 'page');
    }

    a.innerHTML = `
      ${SIDEBAR_ICONS[item.icon]}
      <span class="tooltip">${item.label}</span>
    `;

    a.addEventListener('click', () => {
      sidebar.classList.remove('mobile-open');
      backdrop.classList.remove('active');
    });

    nav.appendChild(a);
  });

  sidebar.appendChild(nav);
  document.body.prepend(sidebar);
}

// Toggle drawer for mobile viewports
function toggleMobileSidebar() {
  const sidebar = document.getElementById('app-sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');
  if (sidebar && backdrop) {
    const isOpen = sidebar.classList.toggle('mobile-open');
    backdrop.classList.toggle('active', isOpen);
  }
}

// Export for use in pages
window.AquaShield = window.AquaShield || {};
window.AquaShield.renderSidebar = renderSidebar;
window.AquaShield.toggleMobileSidebar = toggleMobileSidebar;
