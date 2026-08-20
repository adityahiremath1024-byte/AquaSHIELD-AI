/**
 * AquaShield AI — Module 5: Multi-Signal Data Fusion Engine JS
 * Client-side integration with /api/fusion/process and dynamic visualization rendering.
 */

(function () {
  'use strict';

  // 1. Session & API Integration
  let sessionData = {};
  try {
    const stored = localStorage.getItem('aquashield_session');
    if (stored) {
      sessionData = JSON.parse(stored);
    }
  } catch (e) {
    console.warn("Session load error", e);
  }

  // 2. RADIAL RISK GAUGE ANIMATION
  function initRiskGauge(score) {
    const ring = document.getElementById('gauge-ring');
    const valueEl = document.getElementById('gauge-risk-value');
    if (!ring || !valueEl) return;

    const radius = 110;
    const circumference = 2 * Math.PI * radius;

    ring.style.strokeDasharray = `${circumference}`;
    ring.style.strokeDashoffset = `${circumference}`;

    // Animate stroke dashoffset
    setTimeout(() => {
      const offset = circumference - (score / 100) * circumference;
      ring.style.strokeDashoffset = `${offset}`;
    }, 300);

    // Number counting animation
    let current = 0;
    const duration = 1800;
    const startTime = performance.now();

    function update(time) {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      current = score * eased;
      valueEl.textContent = current.toFixed(1);

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }
    requestAnimationFrame(update);
  }

  // 3. ANIMATED DYNAMIC DATA STREAMS (SVG Particle Flow Paths)
  function renderDataStreams() {
    const svg = document.getElementById('particles-svg');
    if (!svg) return;

    // Create paths streaming from left and right side of viewport into the central circle
    const pathsData = [
      // Left streams (Weather, Satellite)
      { d: 'M -50 40 C 200 40, 250 140, 480 140', color: '#10b981', delay: '0s' },
      { d: 'M -50 100 C 150 100, 200 140, 480 140', color: '#00f2fe', delay: '0.5s' },
      { d: 'M -50 220 C 180 220, 220 140, 480 140', color: '#10b981', delay: '1s' },

      // Right streams (Hospital, Citizen)
      { d: 'M 1600 50 C 1300 50, 1200 140, 1050 140', color: '#f59e0b', delay: '0.2s' },
      { d: 'M 1600 110 C 1350 110, 1220 140, 1050 140', color: '#a855f7', delay: '0.8s' },
      { d: 'M 1600 240 C 1280 240, 1180 140, 1050 140', color: '#f59e0b', delay: '1.4s' }
    ];

    svg.innerHTML = '';

    // Render paths with glowing dash animations
    pathsData.forEach(p => {
      // Base trace line (low opacity)
      const baseLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      baseLine.setAttribute('d', p.d);
      baseLine.setAttribute('fill', 'none');
      baseLine.setAttribute('stroke', p.color);
      baseLine.setAttribute('stroke-width', '1.5');
      baseLine.setAttribute('opacity', '0.08');
      svg.appendChild(baseLine);

      // Flowing glow line
      const flowLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      flowLine.setAttribute('d', p.d);
      flowLine.setAttribute('fill', 'none');
      flowLine.setAttribute('stroke', `url(#streamGlow-${p.color.replace('#','')})`);
      flowLine.setAttribute('stroke-width', '2.5');
      flowLine.setAttribute('stroke-linecap', 'round');
      
      // Inject CSS properties for animation directly
      flowLine.style.strokeDasharray = '40 200';
      flowLine.style.strokeDashoffset = '240';
      flowLine.style.animation = `flow-animation 3s linear infinite`;
      flowLine.style.animationDelay = p.delay;
      
      svg.appendChild(flowLine);
    });

    // Create linear gradients for paths dynamically
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const colors = ['#10b981', '#00f2fe', '#f59e0b', '#a855f7'];
    
    colors.forEach(col => {
      const grad = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
      grad.setAttribute('id', `streamGlow-${col.replace('#','')}`);
      grad.innerHTML = `
        <stop offset="0%" stop-color="${col}" stop-opacity="0" />
        <stop offset="50%" stop-color="${col}" stop-opacity="1" />
        <stop offset="100%" stop-color="${col}" stop-opacity="0" />
      `;
      defs.appendChild(grad);
    });

    svg.appendChild(defs);

    // Append keyframes dynamic animation tag
    const style = document.createElement('style');
    style.textContent = `
      @keyframes flow-animation {
        0% { stroke-dashoffset: 240; }
        100% { stroke-dashoffset: -240; }
      }
    `;
    document.head.appendChild(style);
  }

  // 4. UPDATE UI FROM RESPONSE DATA
  function updateUI(data, payload) {
    const score = data.unified_fusion_score;
    initRiskGauge(score);

    // Update risk level badge text & colors
    const badge = document.getElementById('fusion-badge');
    if (badge) {
      badge.textContent = score >= 75 ? 'HIGH RISK' : (score >= 50 ? 'MODERATE RISK' : 'WATCH');
      badge.className = 'badge ' + (score >= 75 ? 'badge-critical' : (score >= 50 ? 'badge-watch' : 'badge-normal'));
    }

    // Update Input Signal Display values
    const satelliteDisplay = document.getElementById('satellite-val-display');
    if (satelliteDisplay) {
      satelliteDisplay.textContent = `+${payload.flood_water_pct.toFixed(0)}%`;
    }
    const hospitalDisplay = document.getElementById('hospital-val-display');
    if (hospitalDisplay) {
      hospitalDisplay.textContent = `+${payload.case_surge_pct.toFixed(0)}%`;
    }
    const citizenDisplay = document.getElementById('citizen-val-display');
    if (citizenDisplay) {
      citizenDisplay.textContent = payload.citizen_reports_count >= 15 ? 'HIGH' : (payload.citizen_reports_count >= 8 ? 'MEDIUM' : 'LOW');
    }

    // Update bottom domain cards values and progress bars
    const envVal = document.getElementById('env-val');
    if (envVal) envVal.textContent = data.semantic_domains.environmental_risk.toFixed(0);
    const envFill = document.querySelector('.progress-env');
    if (envFill) envFill.style.width = `${data.semantic_domains.environmental_risk}%`;

    const waterVal = document.getElementById('water-val');
    if (waterVal) waterVal.textContent = data.semantic_domains.water_contamination_risk.toFixed(0);
    const waterFill = document.querySelector('.progress-water');
    if (waterFill) waterFill.style.width = `${data.semantic_domains.water_contamination_risk}%`;

    const healthVal = document.getElementById('health-val');
    if (healthVal) healthVal.textContent = data.semantic_domains?.health_stress_risk?.toFixed(0) || '70';
    const healthFill = document.querySelector('.progress-health');
    if (healthFill) healthFill.style.width = `${data.semantic_domains?.health_stress_risk || 70}%`;

    const commVal = document.getElementById('comm-val');
    if (commVal) commVal.textContent = data.semantic_domains?.community_exposure_risk?.toFixed(0) || '85';
    const commFill = document.querySelector('.progress-comm');
    if (commFill) commFill.style.width = `${data.semantic_domains?.community_exposure_risk || 85}%`;

    // Update stream metric bars
    const streams = [
      { id: 'stream-meteo', val: data.normalized_metrics?.rainfall_score || 80 },
      { id: 'stream-sat', val: data.normalized_metrics?.flood_score || 85 },
      { id: 'stream-hosp', val: data.normalized_metrics?.hospital_score || 70 },
      { id: 'stream-cit', val: data.normalized_metrics?.citizen_score || 75 }
    ];

    streams.forEach(s => {
      const el = document.getElementById(s.id);
      if (el) {
        const fill = el.querySelector('.stream-bar-fill');
        const valText = el.querySelector('.stream-val-num');
        if (fill) fill.style.width = `${Math.min(100, Math.max(0, s.val))}%`;
        if (valText) valText.textContent = `${Math.round(s.val)}%`;
      }
    });

    // Update domain scores
    if (data.semantic_domains) {
      const setDomain = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.textContent = `${Math.round(val)}%`;
      };
      setDomain('domain-env', data.semantic_domains.environmental_risk || 80);
      setDomain('domain-water', data.semantic_domains.water_contamination_risk || 75);
      setDomain('domain-health', data.semantic_domains.health_stress_risk || 70);
      setDomain('domain-community', data.semantic_domains.community_exposure_risk || 85);
    }
  }

  // 5. FETCH AND PROCESS FUSION SIGNAL
  async function processFusionSignal() {
    const loader = document.getElementById('loading-overlay');
    if (loader) loader.classList.remove('hidden');

    let village_name = 'Alappuzha, Kerala, India';
    let lat = 9.4981;
    let lon = 76.3388;
    let rain_7d = 180.0;
    let flood_pct = 34.0;
    let hosp_cases = 120;
    let surge_pct = 47.0;
    let citizen_count = 18;

    let payload;

    try {
      if (window.AquaShieldSession) {
        const run = window.AquaShieldSession.getRun();
        if (run && run.location) {
          village_name = run.location.village_name || village_name;
          lat = run.location.latitude || lat;
          lon = run.location.longitude || lon;
        }
        const m1 = window.AquaShieldSession.getModuleResult('module1_weather');
        if (m1 && m1.result && m1.result.precipitation) {
          rain_7d = m1.result.precipitation.past7_mm || rain_7d;
        }
        const m2 = window.AquaShieldSession.getModuleResult('module2_satellite');
        if (m2 && m2.result) {
          flood_pct = m2.result.flood_water_pct || m2.result.surface_water_pct || flood_pct;
        }
        const m3 = window.AquaShieldSession.getModuleResult('module3_hospital');
        if (m3 && m3.result && m3.result.summary) {
          hosp_cases = m3.result.summary.total_cases || hosp_cases;
          surge_pct = m3.result.summary.growth_rate_pct || surge_pct;
        }
        const m4 = window.AquaShieldSession.getModuleResult('module4_citizen');
        if (m4 && m4.result) {
          citizen_count = m4.result.total_reports || citizen_count;
        }
      }

      payload = {
        village_name: village_name,
        latitude: lat,
        longitude: lon,
        rain_7d_mm: rain_7d,
        flood_water_pct: flood_pct,
        hospital_cases_7d: hosp_cases,
        case_surge_pct: surge_pct,
        citizen_reports_count: citizen_count
      };

      const fetchFn = window.AquaShieldUtils ? window.AquaShieldUtils.safeFetch : fetch;
      const res = await fetchFn('/api/fusion/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error(`Fusion API error: ${res.status}`);
      const data = await res.json();

      if (window.AquaShieldSession) {
        window.AquaShieldSession.saveModuleResult('module5_fusion', payload, data);
      }

      updateUI(data, payload);

    } catch (err) {
      console.error("Fusion processing error:", err);
      if (window.AquaShieldUtils) {
        window.AquaShieldUtils.showErrorToast("Fusion API fallback active: " + err.message, "warn");
      }
      const fallback = {
        village_name: payload ? payload.village_name : village_name,
        normalized_metrics: {
          rainfall_score: 92.0,
          flood_score: 100.0,
          hospital_score: 71.0,
          citizen_score: 84.0
        },
        engineered_features: {
          stagnation_index: 80.0,
          exposure_risk: 82.0
        },
        semantic_domains: {
          environmental_risk: 82.0,
          water_contamination_risk: 76.0,
          health_stress_risk: 71.0,
          community_exposure_risk: 84.0
        },
        unified_fusion_score: 78.4
      };
      if (window.AquaShieldSession && payload) {
        window.AquaShieldSession.saveModuleResult('module5_fusion', payload, fallback);
      }
      updateUI(fallback, payload || {});
    } finally {
      if (loader) loader.classList.add('hidden');
    }
  }

  // 6. INITIALIZE PAGE COMPONENTS
  function init() {
    // Render App Shell Components
    if (window.AquaShield) {
      if (typeof window.AquaShield.renderSidebar === 'function') {
        window.AquaShield.renderSidebar('/fusion.html');
      }
      if (typeof window.AquaShield.renderHeader === 'function') {
        window.AquaShield.renderHeader({
          title: 'AI Multi-Signal Data Fusion Engine',
          subtitle: 'The Brain',
          stepCurrent: '5',
          stepTotal: '7',
          alertCount: 12
        });
      }
    }

    // Process Signal Ingestion and Fusion
    processFusionSignal();
    renderDataStreams();

    // Recalculate stream positions on window resize
    window.addEventListener('resize', renderDataStreams);
  }

  // Run on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
