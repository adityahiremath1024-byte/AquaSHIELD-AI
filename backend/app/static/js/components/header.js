/**
 * AquaShield AI — Global Header Component v2.0
 * Decluttered topbar with title, status, IST clock, step badge, reset action,
 * theme toggle, and mobile menu button.
 */

function renderHeader({ title, subtitle, stepCurrent, stepTotal, alertCount = 12 }) {
  if (document.getElementById('app-header')) return;

  const now = new Date();
  const formatTime = (d) => {
    return d.toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false
    }) + ' IST';
  };
  const syncTime = formatTime(now);

  const header = document.createElement('header');
  header.className = 'global-header';
  header.id = 'app-header';
  header.setAttribute('role', 'banner');

  header.innerHTML = `
    <div class="header-left">
      <button class="mobile-menu-toggle" id="mobile-menu-btn" aria-label="Toggle navigation menu">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="3" y1="12" x2="21" y2="12"></line>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
      </button>
      <h1 class="header-title">${title}</h1>
    </div>
    <div class="header-right">
      <div class="live-indicator" aria-label="System status: live">
        <span class="live-dot"></span>
        LIVE
      </div>
      <span class="header-sync" aria-label="Current date and time" id="header-current-clock">${syncTime}</span>
      <button class="header-alerts-badge" aria-label="${alertCount} active alerts" id="header-alerts-btn">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        ALERTS ${alertCount}
      </button>
      <button class="header-reset-btn" id="header-reset-run-btn" title="Reset Session / Start New Assessment" style="background: rgba(239, 68, 68, 0.12); border: 1px solid rgba(239, 68, 68, 0.3); color: #f87171; padding: 6px 12px; border-radius: 6px; font-size: 0.8rem; cursor: pointer; display: flex; align-items: center; gap: 6px; font-weight: 600;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
        Reset Run
      </button>
      <span class="header-step-badge">Step ${stepCurrent} of ${stepTotal}</span>
      <div class="header-profile" title="User Profile" aria-label="User profile">
        AS
      </div>
    </div>
  `;

  // Bind mobile menu toggle
  setTimeout(() => {
    const menuBtn = document.getElementById('mobile-menu-btn');
    if (menuBtn) {
      menuBtn.addEventListener('click', () => {
        if (window.AquaShield && typeof window.AquaShield.toggleMobileSidebar === 'function') {
          window.AquaShield.toggleMobileSidebar();
        }
      });
    }

    const resetBtn = document.getElementById('header-reset-run-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        if (confirm('Start a new assessment run? This will reset all current session inputs across Modules 1–7.')) {
          if (window.AquaShieldSession) {
            window.AquaShieldSession.resetRun();
          } else {
            localStorage.removeItem('aquashield_run');
            localStorage.removeItem('aquashield_session');
          }
          window.location.href = '/weather.html';
        }
      });
    }
  }, 50);

  // Prepend to main content
  const mainContent = document.querySelector('.main-content');
  if (mainContent) {
    mainContent.prepend(header);
  } else {
    document.body.appendChild(header);
  }

  // Inject theme toggle button
  if (window.AquaShield && typeof window.AquaShield.renderThemeToggle === 'function') {
    window.AquaShield.renderThemeToggle();
  }

  // Live ticking clock updating every second
  setInterval(() => {
    const clockEl = document.getElementById('header-current-clock');
    if (clockEl) {
      clockEl.textContent = formatTime(new Date());
    }
  }, 1000);
}

// Export
window.AquaShield = window.AquaShield || {};
window.AquaShield.renderHeader = renderHeader;
