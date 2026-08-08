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
      <span class="header-sync" aria-label="Current date and time" id="header-current-clock">${syncTime}</span>
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
