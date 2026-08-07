/**
 * AquaShield AI — Module 5: Multi-Signal Data Fusion Engine JS
 * Client-side rendering, live backend API integration, and SVG dynamic particle stream flows.
 */

(function () {
  'use strict';

  const DATA = {
    fusionScore: 75.0,
    domains: [
      { label: 'Environmental', value: 71.8, color: '#10b981' },
      { label: 'Water Contamination', value: 71.9, color: '#00f2fe' },
      { label: 'Health Stress', value: 83.2, color: '#f59e0b' },
      { label: 'Community Exposure', value: 73.9, color: '#a855f7' }
    ]
  };

  // 1. RADIAL RISK GAUGE ANIMATION
  function initRiskGauge(score) {
    const ring = document.getElementById('gauge-ring');
    const valueEl = document.getElementById('gauge-risk-value');
    if (!ring || !valueEl) return;

    const radius = 110;
    const circumference = 2 * Math.PI * radius;

    ring.style.strokeDasharray = `${circumference}`;
    ring.style.strokeDashoffset = `${circumference}`;

    setTimeout(() => {
      const offset = circumference - (score / 100) * circumference;
      ring.style.strokeDashoffset = `${offset}`;
    }, 300);

    let current = 0;
    const duration = 1800;
    const startTime = performance.now();

    function update(time) {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      current = score * eased;
      valueEl.textContent = current.toFixed(1);

      if (progress < 1) {
        requestAnimationFrame(update);
      }
    }
    requestAnimationFrame(update);
  }

  // 2. ANIMATED DYNAMIC DATA STREAMS (SVG Particle Flow Paths)
  function renderDataStreams() {
    const svg = document.getElementById('particles-svg');
    if (!svg) return;

    const pathsData = [
      { d: 'M -50 40 C 200 40, 250 140, 480 140', color: '#10b981', delay: '0s' },
      { d: 'M -50 100 C 150 100, 200 140, 480 140', color: '#00f2fe', delay: '0.5s' },
      { d: 'M -50 220 C 180 220, 220 140, 480 140', color: '#10b981', delay: '1s' },
      { d: 'M 1600 50 C 1300 50, 1200 140, 1050 140', color: '#f59e0b', delay: '0.2s' },
      { d: 'M 1600 110 C 1350 110, 1220 140, 1050 140', color: '#a855f7', delay: '0.8s' },
      { d: 'M 1600 240 C 1280 240, 1180 140, 1050 140', color: '#f59e0b', delay: '1.4s' }
    ];

    svg.innerHTML = '';

    pathsData.forEach(p => {
      const baseLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      baseLine.setAttribute('d', p.d);
      baseLine.setAttribute('fill', 'none');
      baseLine.setAttribute('stroke', p.color);
      baseLine.setAttribute('stroke-width', '1.5');
      baseLine.setAttribute('opacity', '0.08');
      svg.appendChild(baseLine);

      const flowLine = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      flowLine.setAttribute('d', p.d);
      flowLine.setAttribute('fill', 'none');
      flowLine.setAttribute('stroke', `url(#streamGlow-${p.color.replace('#','')})`);
      flowLine.setAttribute('stroke-width', '2.5');
      flowLine.setAttribute('stroke-linecap', 'round');
      
      flowLine.style.strokeDasharray = '40 200';
      flowLine.style.strokeDashoffset = '240';
      flowLine.style.animation = `flow-animation 3s linear infinite`;
      flowLine.style.animationDelay = p.delay;
      
      svg.appendChild(flowLine);
    });

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

    const style = document.createElement('style');
    style.textContent = `
      @keyframes flow-animation {
        0% { stroke-dashoffset: 240; }
        100% { stroke-dashoffset: -240; }
      }
    `;
    document.head.appendChild(style);
  }

  // 3. FETCH LIVE FUSION DATA FROM BACKEND API
  async function fetchLiveFusionData() {
    try {
      const payload = {
        village_name: 'Kuttanad, Kerala',
        latitude: 9.3500,
        longitude: 76.4300,
        rain_7d_mm: 180.0,
        humidity_pct: 91.0,
        flood_water_pct: 34.0,
        hospital_cases_7d: 120,
        case_surge_pct: 70.0,
        citizen_reports_count: 18
      };

      const res = await fetch('/api/fusion/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (data.unified_fusion_score !== undefined) {
        DATA.fusionScore = data.unified_fusion_score;
      }
      if (data.semantic_domains) {
        DATA.domains[0].value = data.semantic_domains.environmental_risk;
        DATA.domains[1].value = data.semantic_domains.water_contamination_risk;
        DATA.domains[2].value = data.semantic_domains.health_stress_risk;
        DATA.domains[3].value = data.semantic_domains.community_exposure_risk;
      }

      // Save to localStorage session
      try {
        const session = JSON.parse(localStorage.getItem('aquashield_session') || '{}');
        session.unified_fusion_score = DATA.fusionScore;
        session.fusion_domains = data.semantic_domains;
        localStorage.setItem('aquashield_session', JSON.stringify(session));
      } catch (e) {}

    } catch (err) {
      console.warn('Live Fusion API call fallback to default parameters:', err);
    }
  }

  // 4. INITIALIZE PAGE COMPONENTS
  function init() {
    if (window.AquaShield) {
      if (typeof window.AquaShield.renderSidebar === 'function') {
        window.AquaShield.renderSidebar('/fusion.html');
      }
      if (typeof window.AquaShield.renderHeader === 'function') {
        window.AquaShield.renderHeader({
          title: 'AI Multi-Signal Data Fusion Engine',
          subtitle: 'The Brain — Multi-domain semantic risk synthesis',
          stepCurrent: '5',
          stepTotal: '7',
          alertCount: 12
        });
      }
    }

    const loader = document.getElementById('loading-overlay');

    fetchLiveFusionData().then(() => {
      if (loader) {
        setTimeout(() => {
          loader.classList.add('hidden');
        }, 400);
      }
      initRiskGauge(DATA.fusionScore);
      renderDataStreams();
    });

    window.addEventListener('resize', renderDataStreams);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
