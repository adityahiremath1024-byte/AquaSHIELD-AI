/**
 * AquaShield AI — Module 6: AI Outbreak Prediction Engine JS
 * Client-side logic: mock data, SHAP chart renderer, SVG risk gauge, 
 * Gemini 6-section action plan accordion, session state management.
 * Ref: Module_6.pdf & aquashield_ui_ux_blueprint.md
 */

(function () {
  'use strict';

  /* ================================================================
     MOCK DATA — matches Module_6.pdf "Current Assessment Result"
     ================================================================ */
  const MOCK_PREDICTION_DATA = {
    input: {
      villageName: 'West Kainakary',
      latitude: 9.4981,
      longitude: 76.3388,
    },
    prediction: {
      riskScore: 81.7,
      riskLevel: 'CRITICAL',
      confidenceR2: 0.9412,
      confidenceR2Pct: 94.1,
      mae: 2.15,
      ciLower: 79.5,
      ciUpper: 83.9,
      trainingSamples: 800,
      predictionHorizon: '7-Day Forward Forecast',
      modelType: 'XGBoost Regressor',
    },
    shapValues: [
      { feature: 'Rainfall Anomaly', contribution: 28.4, color: 'blue' },
      { feature: 'Flood Expansion Rate', contribution: 22.1, color: 'cyan' },
      { feature: 'Hospital Surge Rate', contribution: 18.7, color: 'violet' },
      { feature: 'Temperature Index', contribution: 10.3, color: 'red' },
      { feature: 'Humidity Factor', contribution: 7.2, color: 'amber' },
      { feature: 'Population Density', contribution: 5.6, color: 'green' },
    ],
    actionPlan: {
      source: 'gemini', // 'gemini' or 'fallback'
      sections: [
        {
          title: 'SITUATION ASSESSMENT',
          content: 'High outbreak risk detected in Kuttanad region due to extreme rainfall anomaly (28.4% above seasonal baseline), severe flood expansion (+42.0%), and rapidly rising hospital admissions (+70.0% surge rate). The confluence of environmental, hydrological, and clinical indicators places this region at CRITICAL risk for cholera and acute diarrheal disease outbreak within 7 days.',
          type: 'text',
        },
        {
          title: 'IMMEDIATE ACTIONS (24–48 Hours)',
          content: [
            'Deploy emergency water chlorination teams to all water sources within 5km of flood zones',
            'Issue boil-water advisory through all local communication channels',
            'Activate rapid response teams at Kuttanad PHC and Alappuzha District Hospital',
            'Pre-position ORS packets and IV fluids at forward distribution points',
          ],
          type: 'list',
        },
        {
          title: 'MEDICAL PREPAREDNESS (3–7 Days)',
          content: [
            'Stock 5,000 ORS packets at PHC supply chain',
            'Ensure IV fluid reserves for projected 1,299 patients',
            'Pre-position Doxycycline and Azithromycin for cholera prophylaxis',
            'Coordinate with State Drug Controller for emergency procurement authorization',
          ],
          type: 'list',
        },
        {
          title: 'COMMUNITY INTERVENTIONS',
          content: [
            'Deploy ASHA and Anganwadi workers for door-to-door hygiene education',
            'Establish community water purification stations at 12 identified contamination clusters',
            'Activate community health volunteers for daily surveillance sweeps',
            'Distribute hygiene kits targeting families within 200m of confirmed contamination reports',
          ],
          type: 'list',
        },
        {
          title: 'RESOURCE REQUIREMENTS',
          content: [
            '5,000 ORS packets, 20,000 Chlorine tablets, 500 IV fluid units',
            '17 doctors, 35 nursing staff, 50 ASHA workers',
            '8 mobile medical units for remote area coverage',
            'Emergency water tankers: 15 units for potable water distribution',
          ],
          type: 'list',
        },
        {
          title: 'MONITORING INDICATORS',
          content: [
            'Daily diarrheal case count tracking (target: <15 new cases/day by Day 7)',
            'Water quality testing at 24 sampling points every 12 hours',
            'Hospital bed occupancy monitoring (threshold alert: >85%)',
            'Community reporting cluster density (target: zero new clusters by Day 14)',
          ],
          type: 'list',
        },
      ],
    },
  };

  /* ================================================================
     SESSION STATE MANAGEMENT
     ================================================================ */
  function loadSession() {
    try {
      return JSON.parse(localStorage.getItem('aquashield_session') || '{}');
    } catch {
      return {};
    }
  }

  function saveSession(partial) {
    const session = { ...loadSession(), ...partial };
    localStorage.setItem('aquashield_session', JSON.stringify(session));
  }

  function restoreInputs() {
    const session = loadSession();
    const params = new URLSearchParams(window.location.search);

    const village = params.get('village_name') || session.city || MOCK_PREDICTION_DATA.input.villageName;
    const lat = params.get('latitude') || params.get('lat') || session.lat || MOCK_PREDICTION_DATA.input.latitude;
    const lon = params.get('longitude') || params.get('lon') || session.lon || MOCK_PREDICTION_DATA.input.longitude;

    const elVillage = document.getElementById('input-village');
    const elLat = document.getElementById('input-lat');
    const elLon = document.getElementById('input-lon');

    if (elVillage) elVillage.value = village;
    if (elLat) elLat.value = lat;
    if (elLon) elLon.value = lon;
  }

  function persistPredictionSession() {
    const d = MOCK_PREDICTION_DATA.prediction;
    saveSession({
      prediction_raw_response: {
        risk_score: d.riskScore,
        risk_level: d.riskLevel,
        confidence_r2: d.confidenceR2,
        ci_lower: d.ciLower,
        ci_upper: d.ciUpper,
        mae: d.mae,
      },
    });
  }

  /* ================================================================
     ANIMATED VALUE COUNTER
     ================================================================ */
  function animateValue(element, start, end, duration, suffix = '', decimals = 1) {
    if (!element) return;
    const startTime = performance.now();
    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // cubic ease-out
      const current = start + (end - start) * eased;
      element.textContent = current.toFixed(decimals) + suffix;
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }

  /* ================================================================
     SHAP FEATURE IMPORTANCE CHART RENDERER
     ================================================================ */
  function renderSHAPChart() {
    const container = document.getElementById('shap-chart');
    if (!container) return;

    container.innerHTML = '';
    const shapData = MOCK_PREDICTION_DATA.shapValues;
    const maxContribution = Math.max(...shapData.map(item => item.contribution));

    shapData.forEach((item, index) => {
      const barItem = document.createElement('div');
      barItem.className = 'shap-bar-item';

      const relWidth = (item.contribution / maxContribution) * 100;

      barItem.innerHTML = `
        <span class="shap-bar-label">${item.feature}</span>
        <div class="shap-bar-track">
          <div class="shap-bar-fill" data-color="${item.color}" style="width: 0%;"></div>
        </div>
        <span class="shap-bar-pct">${item.contribution.toFixed(1)}%</span>
      `;

      container.appendChild(barItem);

      // Animate width after DOM insertion
      setTimeout(() => {
        const fill = barItem.querySelector('.shap-bar-fill');
        if (fill) fill.style.width = `${relWidth}%`;
      }, 300 + index * 100);
    });
  }

  /* ================================================================
     RISK GAUGE SVG ANIMATION
     ================================================================ */
  function initRiskGauge(riskScore) {
    const ring = document.getElementById('gauge-ring');
    const valueEl = document.getElementById('gauge-risk-value');
    if (!ring || !valueEl) return;

    const radius = 110;
    const circumference = 2 * Math.PI * radius;

    ring.style.strokeDasharray = `${circumference}`;
    ring.style.strokeDashoffset = `${circumference}`;

    setTimeout(() => {
      const offset = circumference - (riskScore / 100) * circumference;
      ring.style.strokeDashoffset = `${offset}`;
    }, 400);

    animateValue(valueEl, 0, riskScore, 1800, '', 1);
  }

  /* ================================================================
     GEMINI ACTION PLAN ACCORDION RENDERER
     ================================================================ */
  function renderActionPlan() {
    const container = document.getElementById('plan-accordion');
    if (!container) return;

    container.innerHTML = '';
    const sections = MOCK_PREDICTION_DATA.actionPlan.sections;

    sections.forEach((section, index) => {
      const item = document.createElement('div');
      item.className = `plan-accordion-item${index === 0 ? ' active' : ''}`;

      let contentHtml = '';
      if (section.type === 'text') {
        contentHtml = `<p class="plan-content-text">${section.content}</p>`;
      } else if (section.type === 'list' && Array.isArray(section.content)) {
        const listItems = section.content.map(li => `<li>${li}</li>`).join('');
        contentHtml = `<ul class="plan-content-list">${listItems}</ul>`;
      }

      item.innerHTML = `
        <button class="plan-accordion-trigger" aria-expanded="${index === 0}">
          <span class="plan-step-number">${index + 1}</span>
          <span class="plan-accordion-title-text">${section.title}</span>
          <svg class="plan-accordion-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>
        <div class="plan-accordion-content">
          <div class="plan-accordion-content-inner">
            ${contentHtml}
          </div>
        </div>
      `;

      // Accordion click listener
      const trigger = item.querySelector('.plan-accordion-trigger');
      trigger.addEventListener('click', () => {
        const isActive = item.classList.contains('active');

        // Close all items
        document.querySelectorAll('.plan-accordion-item').forEach(el => {
          el.classList.remove('active');
          const btn = el.querySelector('.plan-accordion-trigger');
          if (btn) btn.setAttribute('aria-expanded', 'false');
        });

        // Toggle clicked item
        if (!isActive) {
          item.classList.add('active');
          trigger.setAttribute('aria-expanded', 'true');
        }
      });

      container.appendChild(item);
    });
  }

  /* ================================================================
     SCROLL ANIMATION OBSERVER
     ================================================================ */
  function initScrollAnimations() {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );

    document.querySelectorAll('.glass-card').forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(16px)';
      el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      observer.observe(el);
    });
  }

  // Inject helper style for scroll animation
  const style = document.createElement('style');
  style.textContent = `.animate-in { opacity: 1 !important; transform: translateY(0) !important; }`;
  document.head.appendChild(style);

  /* ================================================================
     LOADING OVERLAY HANDLERS
     ================================================================ */
  function showLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.classList.remove('hidden');
  }

  function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.classList.add('hidden');
  }

  /* ================================================================
     RUN ENGINE BUTTON EVENT HANDLER
     ================================================================ */
  function setupRunButton() {
    const btn = document.getElementById('run-prediction-btn');
    if (!btn) return;

    btn.addEventListener('click', () => {
      const villageSelect = document.getElementById('input-village');
      const latInput = document.getElementById('input-lat');
      const lonInput = document.getElementById('input-lon');

      saveSession({
        city: villageSelect ? villageSelect.value : MOCK_PREDICTION_DATA.input.villageName,
        lat: latInput ? parseFloat(latInput.value) : MOCK_PREDICTION_DATA.input.latitude,
        lon: lonInput ? parseFloat(lonInput.value) : MOCK_PREDICTION_DATA.input.longitude,
      });

      showLoading();
      setTimeout(() => {
        hideLoading();
        renderSHAPChart();
        initRiskGauge(MOCK_PREDICTION_DATA.prediction.riskScore);
        renderActionPlan();
        persistPredictionSession();
      }, 1500);
    });
  }

  /* ================================================================
     INITIALIZATION ON DOMContentLoaded
     ================================================================ */
  window.addEventListener('DOMContentLoaded', () => {
    // Render shared layout components
    if (window.AquaShield) {
      window.AquaShield.renderSidebar('/prediction.html');
      window.AquaShield.renderHeader({
        title: 'AI Outbreak Prediction Engine',
        subtitle: 'Module 6 — XGBoost + SHAP + Gemini AI Technical Architecture',
        stepCurrent: '6',
        stepTotal: '7',
      });
    }

    restoreInputs();
    setupRunButton();

    // Simulate initial pipeline load
    showLoading();
    setTimeout(() => {
      hideLoading();
      renderSHAPChart();
      initRiskGauge(MOCK_PREDICTION_DATA.prediction.riskScore);
      renderActionPlan();
      initScrollAnimations();
      persistPredictionSession();
    }, 1200);
  });
})();
