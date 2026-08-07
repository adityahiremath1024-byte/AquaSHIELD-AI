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
  const syncTime = now.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false
  }) + ' IST';

  const header = document.createElement('header');
  header.className = 'global-header';
  header.id = 'app-header';
  header.setAttribute('role', 'banner');

  header.innerHTML = `
    <div class="header-left">
      <h1 class="header-title">${title}</h1>
      <p class="header-subtitle">${subtitle}</p>
    </div>
    <div class="header-right">
      <div class="live-indicator" aria-label="System status: live">
        <span class="live-dot"></span>
        LIVE
      </div>
      <span class="header-sync" aria-label="Last sync time">Last Sync: ${syncTime}</span>
      <button class="header-alerts-badge" aria-label="${alertCount} active alerts" id="header-alerts-btn">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        ALERTS ${alertCount}
      </button>
      <span class="header-step-badge">Step ${stepCurrent} of ${stepTotal}</span>
      <div class="header-profile" title="User Profile" aria-label="User profile">
        DP
      </div>
    </div>
  `;

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
}

// Export
window.AquaShield = window.AquaShield || {};
window.AquaShield.renderHeader = renderHeader;
