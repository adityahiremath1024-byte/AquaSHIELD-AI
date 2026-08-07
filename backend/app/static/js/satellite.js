/**
 * AquaShield AI — Module 2: Satellite Flood Inundation Engine
 * Client-side logic: mock data, confidence gauge, counters, session state.
 */

(function () {
  'use strict';

  /* ================================================================
     MOCK DATA — matches PDF "Current Assessment Result" exactly
     ================================================================ */
  const MOCK_SATELLITE_DATA = {
    baseline: {
      date:        '2026-06-26',
      dateDisplay: 'June 26, 2026',
      waterPct:    18.0,
      areaSqKm:    127.2,
      label:       'Baseline Pre-Flood',
      imageUrl:    'assets/images/satellite/baseline_preflood.png',
    },
    postFlood: {
      date:        '2026-07-15',
      dateDisplay: 'July 15, 2026',
      waterPct:    36.0,
      areaSqKm:    254.4,
      label:       'Post-Flood Scene',
      imageUrl:    'assets/images/satellite/postflood_scene.png',
    },
    analysis: {
      waterExpansionRatePct: 100.0,
      expandedAreaSqKm:     127.2,
      severityLevel:        'VERY HIGH',
      severityDescription:  'Catastrophic flood inundation & epidemic alert',
      detectionConfidence:  95.25,
      cloudCoverPct:        5.0,
      resolutionGSD:        3.0,
      stagnantPockets:      28,
      vectorRisk:           'HIGH',
      vectorRiskTitle:      'High disease vector risk',
      vectorRiskDesc:       'Standing water detected. Mosquito/pathogen breeding conditions present.',
    },
    metadata: {
      sensor:     'PlanetScope',
      resolution: '3m/pixel',
      itemType:   'PSScene',
      imageId:    '20260715_143721_PSScene',
    },
  };

  /* ================================================================
     SESSION STATE — restore / persist via localStorage
     ================================================================ */
  function loadSession() {
    try {
      return JSON.parse(localStorage.getItem('aquashield_session') || '{}');
    } catch { return {}; }
  }

  function saveSession(partial) {
    const session = { ...loadSession(), ...partial };
    localStorage.setItem('aquashield_session', JSON.stringify(session));
  }

  /* ================================================================
     ANIMATED NUMBER COUNTER
     ================================================================ */
  function animateValue(element, start, end, duration, suffix = '', decimals = 1) {
    const startTime = performance.now();
    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + (end - start) * eased;
      element.textContent = current.toFixed(decimals) + suffix;
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }

  /* ================================================================
     CONFIDENCE GAUGE — SVG ring
     ================================================================ */
  function initConfidenceGauge(confidencePct) {
    const gauge = document.getElementById('confidence-gauge-svg');
    if (!gauge) return;

    const circle = gauge.querySelector('.gauge-fill');
    const radius = parseFloat(circle.getAttribute('r'));
    const circumference = 2 * Math.PI * radius;

    circle.style.strokeDasharray = circumference;
    circle.style.strokeDashoffset = circumference;

    // Animate after a brief delay
    setTimeout(() => {
      const offset = circumference - (confidencePct / 100) * circumference;
      circle.style.strokeDashoffset = offset;
    }, 300);

    // Animate number
    const pctEl = document.getElementById('gauge-pct-value');
    if (pctEl) animateValue(pctEl, 0, confidencePct, 1500, '%', 2);
  }

  /* ================================================================
     RENDER METRIC COUNTERS
     ================================================================ */
  function initMetricCounters() {
    const d = MOCK_SATELLITE_DATA;

    // Baseline water %
    const baselinePct = document.getElementById('metric-baseline-pct');
    if (baselinePct) animateValue(baselinePct, 0, d.baseline.waterPct, 1200, '%', 1);

    const baselineArea = document.getElementById('metric-baseline-area');
    if (baselineArea) animateValue(baselineArea, 0, d.baseline.areaSqKm, 1200, '', 1);

    // Post-flood water %
    const postPct = document.getElementById('metric-postflood-pct');
    if (postPct) animateValue(postPct, 0, d.postFlood.waterPct, 1200, '%', 1);

    const postArea = document.getElementById('metric-postflood-area');
    if (postArea) animateValue(postArea, 0, d.postFlood.areaSqKm, 1200, '', 1);

    // Expanded area
    const expandedArea = document.getElementById('metric-expanded-area');
    if (expandedArea) animateValue(expandedArea, 0, d.analysis.expandedAreaSqKm, 1200, '', 1);

    // Expansion rate (hero)
    const expansionRate = document.getElementById('expansion-rate');
    if (expansionRate) animateValue(expansionRate, 0, d.analysis.waterExpansionRatePct, 1800, '%', 1);

    // Stagnant pockets
    const stagnant = document.getElementById('metric-stagnant');
    if (stagnant) animateValue(stagnant, 0, d.analysis.stagnantPockets, 1000, '', 0);

    // Panel overlays
    const baselineOverlay = document.getElementById('overlay-baseline-pct');
    if (baselineOverlay) animateValue(baselineOverlay, 0, d.baseline.waterPct, 1200, '%', 1);

    const postOverlay = document.getElementById('overlay-postflood-pct');
    if (postOverlay) animateValue(postOverlay, 0, d.postFlood.waterPct, 1200, '%', 1);
  }

  /* ================================================================
     FACTOR PROGRESS BARS
     ================================================================ */
  function initFactorBars() {
    const d = MOCK_SATELLITE_DATA.analysis;

    // Cloud cover: lower is better, so invert for "goodness"
    const cloudBar = document.getElementById('factor-cloud-bar');
    if (cloudBar) {
      setTimeout(() => { cloudBar.style.width = (100 - d.cloudCoverPct) + '%'; }, 400);
    }

    // GSD: 3m is good for PlanetScope, show as ~85% quality
    const gsdBar = document.getElementById('factor-gsd-bar');
    if (gsdBar) {
      setTimeout(() => { gsdBar.style.width = '85%'; }, 500);
    }
  }

  /* ================================================================
     LOADING STATE
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
     INTERSECTION OBSERVER — animate on scroll
     ================================================================ */
  function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    document.querySelectorAll('.glass-card, .comparison-panel, .expansion-hero, .timeline-card').forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(16px)';
      el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      observer.observe(el);
    });
  }

  // CSS class for revealed state
  const style = document.createElement('style');
  style.textContent = `.animate-in { opacity: 1 !important; transform: translateY(0) !important; }`;
  document.head.appendChild(style);

  /* ================================================================
     PERSIST SESSION FOR DOWNSTREAM MODULES
     ================================================================ */
  function persistSatelliteSession() {
    const d = MOCK_SATELLITE_DATA;
    saveSession({
      flood_water_pct:     d.postFlood.waterPct,
      flood_increase_pct:  d.analysis.waterExpansionRatePct,
      flood_baseline_pct:  d.baseline.waterPct,
      flood_severity:      d.analysis.severityLevel,
      flood_confidence:    d.analysis.detectionConfidence,
      stagnant_pockets:    d.analysis.stagnantPockets,
    });
  }

  /* ================================================================
     INIT
     ================================================================ */
  window.addEventListener('DOMContentLoaded', () => {
    // Render shared shell components
    if (window.AquaShield) {
      window.AquaShield.renderSidebar('/satellite.html');
      window.AquaShield.renderHeader({
        title:       'Satellite Flood Inundation Analysis',
        subtitle:    'PlanetScope 3m Resolution Assessment',
        stepCurrent: '2',
        stepTotal:   '7',
      });
    }

    // Simulate loading
    showLoading();
    setTimeout(() => {
      hideLoading();
      initMetricCounters();
      initConfidenceGauge(MOCK_SATELLITE_DATA.analysis.detectionConfidence);
      initFactorBars();
      initScrollAnimations();
      persistSatelliteSession();
    }, 1400);
  });

})();
