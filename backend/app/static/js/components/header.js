/**
 * AquaShield AI — Global Header Component
 * Renders the top header bar with page title, live indicator, sync time,
 * alerts badge, step progress, and profile avatar.
 */

/**
 * @param {Object} options
 * @param {string} options.title       - Page title text
 * @param {string} options.subtitle    - Page subtitle text
 * @param {string} options.stepCurrent - Current step number (e.g. '2')
 * @param {string} options.stepTotal   - Total steps (e.g. '7')
 * @param {number} [options.alertCount=12] - Number of active alerts
 */
function renderHeader({ title, subtitle, stepCurrent, stepTotal, alertCount = 12 }) {
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
      <h1 class="header-title">${title}</h1>
    </div>
    <div class="header-right">
      <div class="live-indicator" aria-label="System status: live">
        <span class="live-dot"></span>
        LIVE
      </div>
<<<<<<< HEAD
      <span class="header-sync" aria-label="Current date and time" id="header-current-clock">${syncTime}</span>
=======
      <span class="header-sync" aria-label="Last sync time">Last Sync: ${syncTime}</span>
      <button class="header-alerts-badge" aria-label="${alertCount} active alerts" id="header-alerts-btn">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        ALERTS ${alertCount}
      </button>
      <button class="header-reset-btn" id="header-reset-run-btn" title="Reset Session / Start New Assessment" style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); color: #f87171; padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; cursor: pointer; display: flex; align-items: center; gap: 4px; font-family: Inter, sans-serif; font-weight: 500;">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
        Reset Run
      </button>
      <span class="header-step-badge">Step ${stepCurrent} of ${stepTotal}</span>
      <div class="header-profile" title="User Profile" aria-label="User profile">
        DP
      </div>
>>>>>>> 39e2e8c0f242d544bb272b71bd28545be9ad1df2
    </div>
  `;

  // Bind click listener to Reset Run button
  setTimeout(() => {
    const btn = document.getElementById('header-reset-run-btn');
    if (btn) {
      btn.addEventListener('click', () => {
        if (confirm('Start a new assessment run? This will clear all data from current Modules 1–7 run.')) {
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
  }, 100);

  // Insert after sidebar, before main content
  const mainContent = document.querySelector('.main-content');
  if (mainContent) {
    mainContent.prepend(header);
  } else {
    document.body.appendChild(header);
  }

  // Inject theme toggle button if component is loaded
  if (window.AquaShield && typeof window.AquaShield.renderThemeToggle === 'function') {
    window.AquaShield.renderThemeToggle();
  }

  // Live ticking clock updating the current date/time every second
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
