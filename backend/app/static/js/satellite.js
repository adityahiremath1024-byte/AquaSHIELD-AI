/**
 * AquaShield AI — Module 2: Satellite Flood Inundation Engine JS
 * Client-side interface linked to live backend NDWI compare API.
 */

(function () {
  'use strict';

  const DATA = {
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

  function loadSession() {
    try {
      return JSON.parse(localStorage.getItem('aquashield_session') || '{}');
    } catch { return {}; }
  }

  function saveSession(partial) {
    const session = { ...loadSession(), ...partial };
    localStorage.setItem('aquashield_session', JSON.stringify(session));
  }

  function animateValue(element, start, end, duration, suffix = '', decimals = 1) {
    if (!element) return;
    const startTime = performance.now();
    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + (end - start) * eased;
      element.textContent = current.toFixed(decimals) + suffix;
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  }

  function initConfidenceGauge(confidencePct) {
    const gauge = document.getElementById('confidence-gauge-svg');
    if (!gauge) return;

    const circle = gauge.querySelector('.gauge-fill');
    const radius = parseFloat(circle.getAttribute('r'));
    const circumference = 2 * Math.PI * radius;

    circle.style.strokeDasharray = circumference;
    circle.style.strokeDashoffset = circumference;

    setTimeout(() => {
      const offset = circumference - (confidencePct / 100) * circumference;
      circle.style.strokeDashoffset = offset;
    }, 300);

    const pctEl = document.getElementById('gauge-pct-value');
    if (pctEl) animateValue(pctEl, 0, confidencePct, 1500, '%', 2);
  }

  function initMetricCounters() {
    // Baseline water %
    const baselinePct = document.getElementById('metric-baseline-pct');
    if (baselinePct) animateValue(baselinePct, 0, DATA.baseline.waterPct, 1200, '%', 1);

    const baselineArea = document.getElementById('metric-baseline-area');
    if (baselineArea) animateValue(baselineArea, 0, DATA.baseline.areaSqKm, 1200, '', 1);

    // Post-flood water %
    const postPct = document.getElementById('metric-postflood-pct');
    if (postPct) animateValue(postPct, 0, DATA.postFlood.waterPct, 1200, '%', 1);

    const postArea = document.getElementById('metric-postflood-area');
    if (postArea) animateValue(postArea, 0, DATA.postFlood.areaSqKm, 1200, '', 1);

    // Expanded area
    const expandedArea = document.getElementById('metric-expanded-area');
    if (expandedArea) animateValue(expandedArea, 0, DATA.analysis.expandedAreaSqKm, 1200, '', 1);

    // Expansion rate (hero)
    const expansionRate = document.getElementById('expansion-rate');
    if (expansionRate) animateValue(expansionRate, 0, DATA.analysis.waterExpansionRatePct, 1800, '%', 1);

    // Stagnant pockets
    const stagnant = document.getElementById('metric-stagnant');
    if (stagnant) animateValue(stagnant, 0, DATA.analysis.stagnantPockets, 1000, '', 0);

    // Panel overlays
    const baselineOverlay = document.getElementById('overlay-baseline-pct');
    if (baselineOverlay) animateValue(baselineOverlay, 0, DATA.baseline.waterPct, 1200, '%', 1);

    const postOverlay = document.getElementById('overlay-postflood-pct');
    if (postOverlay) animateValue(postOverlay, 0, DATA.postFlood.waterPct, 1200, '%', 1);
  }

  function initFactorBars() {
    const d = DATA.analysis;
    const cloudBar = document.getElementById('factor-cloud-bar');
    if (cloudBar) {
      setTimeout(() => { cloudBar.style.width = (100 - d.cloudCoverPct) + '%'; }, 400);
    }
    const gsdBar = document.getElementById('factor-gsd-bar');
    if (gsdBar) {
      setTimeout(() => { gsdBar.style.width = '85%'; }, 500);
    }
  }

  function showLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.classList.remove('hidden');
  }

  function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.classList.add('hidden');
  }

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

  const style = document.createElement('style');
  style.textContent = `.animate-in { opacity: 1 !important; transform: translateY(0) !important; }`;
  document.head.appendChild(style);

  function persistSatelliteSession() {
    saveSession({
      flood_water_pct:     DATA.postFlood.waterPct,
      flood_increase_pct:  DATA.analysis.waterExpansionRatePct,
      flood_baseline_pct:  DATA.baseline.waterPct,
      flood_severity:      DATA.analysis.severityLevel,
      flood_confidence:    DATA.analysis.detectionConfidence,
      stagnant_pockets:    DATA.analysis.stagnantPockets,
    });
  }

  // ─── Fetch Compare Metrics from Backend API ────────────────────────────────
  async function fetchCompareData() {
    try {
      const res = await fetch(`/api/ndwi/compare?baseline_image_id=20260626_143522_PSScene&flood_image_id=20260715_143721_PSScene`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const apiData = await res.json();
      
      DATA.baseline.waterPct = apiData.baseline_water_pct;
      DATA.postFlood.waterPct = apiData.flood_water_pct;
      DATA.analysis.waterExpansionRatePct = apiData.water_expansion_rate_pct;
      DATA.analysis.expandedAreaSqKm = apiData.expanded_area_sq_km;
      DATA.analysis.severityLevel = apiData.severity_level;
      DATA.analysis.severityDescription = apiData.severity_description;
      DATA.analysis.detectionConfidence = apiData.detection_confidence_pct;
      DATA.analysis.stagnantPockets = apiData.stagnant_water_pockets;

      // Update source indicators
      const statusBadge = document.getElementById('api-status-badge');
      if (statusBadge) {
        statusBadge.innerHTML = `
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
          Planet API Engine Live
        `;
      }
    } catch (err) {
      console.warn("Backend satellite compare offline. Reverting to local fallback data.", err);
    }
  }

  window.addEventListener('DOMContentLoaded', () => {
    if (window.AquaShield) {
      window.AquaShield.renderSidebar('/satellite.html');
      window.AquaShield.renderHeader({
        title:       'Satellite Flood Inundation Analysis',
        subtitle:    'Module 2 — PlanetScope 3m Resolution Assessment',
        stepCurrent: '2',
        stepTotal:   '7',
      });
    }

    showLoading();
    
    fetchCompareData().then(() => {
      setTimeout(() => {
        hideLoading();
        initMetricCounters();
        initConfidenceGauge(DATA.analysis.detectionConfidence);
        initFactorBars();
        initScrollAnimations();
        persistSatelliteSession();
      }, 800);
    });
  });

})();
