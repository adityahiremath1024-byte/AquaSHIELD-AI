/**
 * AquaShield AI — Theme Toggle Component
 * Persistent dark/light theme with localStorage.
 * Default: dark. Transition: 300ms.
 */

(function () {
  'use strict';

  const STORAGE_KEY = 'aquashield-theme';
  const DEFAULT_THEME = 'dark';

  /**
   * Apply the theme to the document root immediately.
   * Called before DOM render to prevent FOUC.
   */
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
  }

  /**
   * Get stored theme or default.
   */
  function getStoredTheme() {
    try {
      return localStorage.getItem(STORAGE_KEY) || DEFAULT_THEME;
    } catch {
      return DEFAULT_THEME;
    }
  }

  /**
   * Save theme preference.
   */
  function saveTheme(theme) {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // localStorage unavailable, fail silently
    }
  }

  /**
   * Toggle between dark and light.
   */
  function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || DEFAULT_THEME;
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    saveTheme(next);
  }

  /**
   * Render the theme toggle button into the header's .header-right container.
   * Should be called after the header has been rendered.
   */
  function renderThemeToggle() {
    const headerRight = document.querySelector('.header-right');
    if (!headerRight) return;

    const btn = document.createElement('button');
    btn.className = 'theme-toggle';
    btn.id = 'theme-toggle-btn';
    btn.setAttribute('aria-label', 'Toggle dark/light theme');
    btn.setAttribute('title', 'Toggle theme');

    btn.innerHTML = `
      <div class="theme-toggle-icons">
        <span class="theme-icon-sun">
          <svg viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="5"/>
            <line x1="12" y1="1" x2="12" y2="3"/>
            <line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/>
            <line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </svg>
        </span>
        <span class="theme-icon-moon">
          <svg viewBox="0 0 24 24">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        </span>
      </div>
    `;

    btn.addEventListener('click', toggleTheme);

    headerRight.appendChild(btn);
  }

  // ── Apply theme immediately (before DOM paint) ──
  applyTheme(getStoredTheme());

  // ── Export ──
  window.AquaShield = window.AquaShield || {};
  window.AquaShield.renderThemeToggle = renderThemeToggle;
  window.AquaShield.toggleTheme = toggleTheme;
})();
