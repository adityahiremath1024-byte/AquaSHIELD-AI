/**
 * AquaShield AI — Shared Fetch & Error Utilities
 * Provides timeout-wrapped fetch and standardized error UI across all modules.
 */
(function () {
  'use strict';

  const DEFAULT_TIMEOUT_MS = 15000; // 15 seconds

  /**
   * Fetch wrapper with automatic timeout via AbortSignal.
   * @param {string} url
   * @param {RequestInit} [options={}]
   * @param {number} [timeoutMs=15000]
   * @returns {Promise<Response>}
   */
  async function safeFetch(url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      return response;
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new Error(`Request timed out after ${timeoutMs / 1000}s: ${url}`);
      }
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Show an error banner inside a container element with a retry button.
   * @param {string} containerId - ID of the DOM element to show error in (or null for a global toast)
   * @param {string} message - Error message to display
   * @param {Function} [retryFn] - Optional retry callback
   */
  function showErrorBanner(containerId, message, retryFn) {
    // Try container-specific first
    let container = containerId ? document.getElementById(containerId) : null;

    if (container) {
      container.innerHTML = `
        <div class="error-banner" style="
          background: rgba(239, 68, 68, 0.08);
          border: 1px solid rgba(239, 68, 68, 0.25);
          border-radius: 12px;
          padding: 20px 24px;
          display: flex;
          align-items: center;
          gap: 14px;
          flex-wrap: wrap;
        ">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2">
            <circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/>
          </svg>
          <span style="color: #f87171; font-size: 0.88rem; flex: 1; min-width: 200px;">${message}</span>
          ${retryFn ? `<button class="error-retry-btn" style="
            background: linear-gradient(135deg, #00f2fe, #10b981);
            color: #06080f;
            border: none;
            border-radius: 8px;
            padding: 8px 20px;
            font-weight: 600;
            font-size: 0.82rem;
            cursor: pointer;
            font-family: 'Inter', sans-serif;
            transition: transform 0.15s;
          ">⟳ Retry</button>` : ''}
        </div>
      `;

      if (retryFn) {
        const retryBtn = container.querySelector('.error-retry-btn');
        if (retryBtn) {
          retryBtn.addEventListener('click', () => {
            container.innerHTML = '';
            retryFn();
          });
        }
      }
      return;
    }

    // Fallback: global toast notification
    showErrorToast(message);
  }

  /**
   * Show a temporary toast notification at the top of the page.
   * @param {string} message
   * @param {'error'|'warn'|'info'} [type='error']
   */
  function showErrorToast(message, type = 'error') {
    const colors = {
      error: { bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.3)', text: '#f87171' },
      warn:  { bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.3)', text: '#fbbf24' },
      info:  { bg: 'rgba(0, 242, 254, 0.08)', border: 'rgba(0, 242, 254, 0.2)', text: '#00f2fe' },
    };
    const c = colors[type] || colors.error;

    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
      z-index: 10000; padding: 12px 24px; border-radius: 10px;
      background: ${c.bg}; border: 1px solid ${c.border};
      backdrop-filter: blur(12px); color: ${c.text};
      font-size: 0.85rem; font-family: 'Inter', sans-serif; font-weight: 500;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      animation: toastSlideIn 0.3s ease;
      max-width: 600px; text-align: center;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);

    // Add animation keyframes if not already present
    if (!document.getElementById('toast-keyframes')) {
      const style = document.createElement('style');
      style.id = 'toast-keyframes';
      style.textContent = `
        @keyframes toastSlideIn {
          from { opacity: 0; transform: translateX(-50%) translateY(-20px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
      `;
      document.head.appendChild(style);
    }

    setTimeout(() => {
      toast.style.transition = 'opacity 0.4s';
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 400);
    }, 5000);
  }

  // Expose globally
  window.AquaShieldUtils = {
    safeFetch,
    showErrorBanner,
    showErrorToast,
  };
})();
