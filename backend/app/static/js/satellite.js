/**
 * AquaShield AI — Module 2: Satellite Flood Inundation Engine JS
 * Client-side interface linked to live backend NDWI compare API.
 */

(function () {
  'use strict';

  // Village coordinate registry
  const VILLAGE_COORDS = {
    'West Kainakary': { lat: 9.4981, lon: 76.3388 },
    'Kuttanad':       { lat: 9.5124, lon: 76.3532 },
    'Alappuzha':      { lat: 9.4981, lon: 76.3388 },
    'Kottayam':       { lat: 9.5916, lon: 76.5221 }
  };

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
      imageUrl:    '/api/ndwi/mask/20260715_143721_PSScene',
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

    // Timeline hero comparative section elements
    const fromEl = document.querySelector('.expansion-from .ex-value');
    if (fromEl) fromEl.textContent = DATA.baseline.waterPct.toFixed(1) + '%';
    const toEl = document.querySelector('.expansion-to .ex-value');
    if (toEl) toEl.textContent = DATA.postFlood.waterPct.toFixed(1) + '%';

    // Summary Table Updates
    const tbody = document.querySelector('#summary-table tbody');
    if (tbody) {
      tbody.innerHTML = `
        <tr>
          <td class="td-metric">Baseline water coverage</td>
          <td class="td-value text-green">${DATA.baseline.waterPct.toFixed(1)}%</td>
          <td class="td-detail">${DATA.baseline.areaSqKm.toFixed(1)} sq km</td>
        </tr>
        <tr>
          <td class="td-metric">Post-flood water coverage</td>
          <td class="td-value text-red">${DATA.postFlood.waterPct.toFixed(1)}%</td>
          <td class="td-detail">${DATA.postFlood.areaSqKm.toFixed(1)} sq km</td>
        </tr>
        <tr>
          <td class="td-metric">Water expansion rate</td>
          <td class="td-value text-red">+${DATA.analysis.waterExpansionRatePct.toFixed(1)}%</td>
          <td class="td-detail">${DATA.analysis.severityDescription}</td>
        </tr>
        <tr>
          <td class="td-metric">Severity level</td>
          <td class="td-value">
            <span class="badge badge-very-high">${DATA.analysis.severityLevel}</span>
          </td>
          <td class="td-detail">Epidemic alert threshold</td>
        </tr>
        <tr>
          <td class="td-metric">Detection confidence</td>
          <td class="td-value text-cyan">${DATA.analysis.detectionConfidence.toFixed(2)}%</td>
          <td class="td-detail">Cloud: ${DATA.analysis.cloudCoverPct}% · GSD: 3.0 m/pixel</td>
        </tr>
      `;
    }
  }

  function initFactorBars() {
    const d = DATA.analysis;
    const cloudBar = document.getElementById('factor-cloud-bar');
    if (cloudBar) {
      cloudBar.style.width = (100 - d.cloudCoverPct) + '%';
    }
    const gsdBar = document.getElementById('factor-gsd-bar');
    if (gsdBar) {
      gsdBar.style.width = '85%';
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
      village_name:        document.getElementById('input-village').value,
      latitude:            parseFloat(document.getElementById('input-lat').value),
      longitude:           parseFloat(document.getElementById('input-lon').value),
      flood_water_pct:     DATA.postFlood.waterPct,
      flood_increase_pct:  DATA.analysis.waterExpansionRatePct,
      flood_baseline_pct:  DATA.baseline.waterPct,
      flood_severity:      DATA.analysis.severityLevel,
      flood_confidence:    DATA.analysis.detectionConfidence,
      stagnant_pockets:    DATA.analysis.stagnantPockets,
    });
  }

  // ─── Fetch Compare Metrics from Backend API ────────────────────────────────
  async function runSatelliteEngine() {
    showLoading();

    const village = document.getElementById('input-village').value;
    const lat = parseFloat(document.getElementById('input-lat').value);
    const lon = parseFloat(document.getElementById('input-lon').value);
    const radius = parseFloat(document.getElementById('input-radius').value);

    try {
      // 1. Search matching scenes for the given coordinates
      const searchRes = await fetch(`/api/satellite/search?latitude=${lat}&longitude=${lon}&radius_km=${radius}`);
      if (!searchRes.ok) throw new Error("Search API failed");
      const searchData = await searchRes.json();

      let baselineId = "20260626_143522_PSScene";
      let floodId = "20260715_143721_PSScene";

      // If we find scenes from Planet Labs, map baseline and flood scenes
      if (searchData.scenes && searchData.scenes.length >= 2) {
        floodId = searchData.scenes[0].id;
        baselineId = searchData.scenes[1].id;
      }

      // 2. Perform NDWI Compare
      const compareRes = await fetch(`/api/ndwi/compare?baseline_image_id=${baselineId}&flood_image_id=${floodId}&radius_km=${radius}`);
      if (!compareRes.ok) throw new Error("Compare API failed");
      const apiData = await compareRes.json();

      // 3. Update local state
      DATA.baseline.waterPct = apiData.baseline_water_pct;
      DATA.baseline.areaSqKm = (apiData.baseline_water_pct / 100.0) * Math.PI * (radius ** 2);
      DATA.baseline.imageUrl = `/api/ndwi/mask/${baselineId}`;
      DATA.baseline.dateDisplay = baselineId.substring(0, 4) + '-' + baselineId.substring(4, 6) + '-' + baselineId.substring(6, 8);

      DATA.postFlood.waterPct = apiData.flood_water_pct;
      DATA.postFlood.areaSqKm = (apiData.flood_water_pct / 100.0) * Math.PI * (radius ** 2);
      DATA.postFlood.imageUrl = `/api/ndwi/mask/${floodId}`;
      DATA.postFlood.dateDisplay = floodId.substring(0, 4) + '-' + floodId.substring(4, 6) + '-' + floodId.substring(6, 8);

      DATA.analysis.waterExpansionRatePct = apiData.water_expansion_rate_pct;
      DATA.analysis.expandedAreaSqKm = apiData.expanded_area_sq_km;
      DATA.analysis.severityLevel = apiData.severity_level;
      DATA.analysis.severityDescription = apiData.severity_description;
      DATA.analysis.detectionConfidence = apiData.detection_confidence_pct;
      DATA.analysis.stagnantPockets = apiData.stagnant_water_pockets;

      // 4. Update elements in UI
      document.querySelector('#panel-baseline img').src = DATA.baseline.imageUrl;
      document.querySelector('#panel-postflood img').src = DATA.postFlood.imageUrl;
      document.querySelector('#panel-baseline .panel-date-badge').innerHTML = `
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/></svg>
        ${DATA.baseline.dateDisplay}
      `;
      document.querySelector('#panel-postflood .panel-date-badge').innerHTML = `
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4"/><path d="M8 2v4"/><path d="M3 10h18"/></svg>
        ${DATA.postFlood.dateDisplay}
      `;

      // Update baseline & post water area values in bottom bars
      document.querySelector('#panel-baseline .panel-info-bar .info-value').textContent = `${DATA.baseline.areaSqKm.toFixed(1)} sq km`;
      document.querySelector('#panel-postflood .panel-info-bar .info-value').textContent = `${DATA.postFlood.areaSqKm.toFixed(1)} sq km`;

      // Update active risk tag details
      const badge = document.querySelector('#severity-card .badge');
      if (badge) {
        badge.className = `badge badge-${apiData.severity_level.toLowerCase().replace(' ', '-')}`;
        badge.textContent = `${apiData.severity_level} SEVERITY`;
      }
      const sevLevelText = document.querySelector('.severity-level-text');
      if (sevLevelText) sevLevelText.textContent = apiData.severity_level;
      const sevDesc = document.querySelector('.severity-description');
      if (sevDesc) sevDesc.textContent = apiData.severity_description;

      // Update stagnant pocket text badge
      const stagnantTag = document.querySelector('.vector-alert-tags .vector-tag:nth-child(3)');
      if (stagnantTag) stagnantTag.textContent = `${apiData.stagnant_water_pockets} Stagnant Pockets`;

      // Re-init visuals
      initMetricCounters();
      initConfidenceGauge(DATA.analysis.detectionConfidence);
      initFactorBars();
      persistSatelliteSession();

      const statusBadge = document.getElementById('api-status-badge');
      if (statusBadge) {
        statusBadge.innerHTML = `
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
          Planet API Engine Live (Lat: ${lat.toFixed(4)}, Lon: ${lon.toFixed(4)})
        `;
      }
    } catch (err) {
      console.error("Satellite search execution failed:", err);
    } finally {
      hideLoading();
    }
  }

  // Restore coordinates based on village selection dropdown
  function onVillageChange() {
    const dropdown = document.getElementById('input-village');
    const coords = VILLAGE_COORDS[dropdown.value];
    if (coords) {
      document.getElementById('input-lat').value = coords.lat;
      document.getElementById('input-lon').value = coords.lon;
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

    // Set up form change listeners
    const dropdown = document.getElementById('input-village');
    if (dropdown) {
      dropdown.addEventListener('change', onVillageChange);
    }

    const runBtn = document.getElementById('run-satellite-btn');
    if (runBtn) {
      runBtn.addEventListener('click', runSatelliteEngine);
    }

    // Restore any existing session coordinates if present
    const session = loadSession();
    if (session.village_name) {
      if (dropdown) dropdown.value = session.village_name;
      if (session.latitude) document.getElementById('input-lat').value = session.latitude;
      if (session.longitude) document.getElementById('input-lon').value = session.longitude;
    }

    // Initial run to load default K Kainkary values
    runSatelliteEngine();
  });

})();
