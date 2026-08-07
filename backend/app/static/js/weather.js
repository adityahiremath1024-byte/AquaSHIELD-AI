/**
 * AquaShield AI — Module 1: Meteorological Intelligence JS
 * Ref: Module_1.pdf & aquashield_ui_ux_blueprint.md
 */

(function () {
  'use strict';

  let precipChartInstance = null;
  let accumChartInstance = null;

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
    const data = window.MOCK_WEATHER_DATA.input;

    const village = params.get('village_name') || session.city || data.villageName;
    const lat = params.get('latitude') || params.get('lat') || session.lat || data.latitude;
    const lon = params.get('longitude') || params.get('lon') || session.lon || data.longitude;

    const elVillage = document.getElementById('input-village');
    const elLat = document.getElementById('input-lat');
    const elLon = document.getElementById('input-lon');

    if (elVillage) elVillage.value = village;
    if (elLat) elLat.value = lat;
    if (elLon) elLon.value = lon;
  }

  /* ================================================================
     HERO WAVE CANVAS ANIMATION
     ================================================================ */
  function initWaveCanvas() {
    const canvas = document.getElementById('hero-wave-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let time = 0;

    function resize() {
      const rect = canvas.parentElement.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    }
    resize();
    window.addEventListener('resize', resize);

    const waves = [
      { amplitude: 18, wavelength: 140, speed: 0.03, color: 'rgba(0, 242, 254, 0.65)', lineWidth: 1.5 },
      { amplitude: 12, wavelength: 100, speed: 0.02, color: 'rgba(0, 242, 254, 0.35)', lineWidth: 1.0 },
      { amplitude: 22, wavelength: 180, speed: 0.025, color: 'rgba(59, 130, 246, 0.45)', lineWidth: 1.2 },
      { amplitude: 10, wavelength: 80, speed: 0.035, color: 'rgba(168, 85, 247, 0.35)', lineWidth: 1.0 }
    ];

    function draw() {
      const w = canvas.width / (window.devicePixelRatio || 1);
      const h = canvas.height / (window.devicePixelRatio || 1);
      ctx.clearRect(0, 0, w, h);

      waves.forEach(wave => {
        ctx.beginPath();
        for (let x = 0; x <= w; x += 2) {
          const y = h * 0.5 + Math.sin(x / wave.wavelength * 2 * Math.PI + time * wave.speed * 60) * wave.amplitude;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = wave.color;
        ctx.lineWidth = wave.lineWidth;
        ctx.stroke();
      });

      time += 0.016;
      requestAnimationFrame(draw);
    }
    draw();
  }

  /* ================================================================
     CHARTS (CHART.JS) RENDERERS
     ================================================================ */
  function renderDailyPrecipChart() {
    const canvas = document.getElementById('chart-daily-precip');
    if (!canvas || !window.Chart) return;

    if (precipChartInstance) precipChartInstance.destroy();

    const daily = window.MOCK_WEATHER_DATA.precipitation.daily;
    const labels = daily.map((_, i) => `Day ${i + 1}`);

    const barColors = daily.map(v => {
      if (v > 15) return '#00f2fe';
      if (v > 8) return 'rgba(0, 242, 254, 0.65)';
      if (v > 2) return 'rgba(0, 242, 254, 0.4)';
      return 'rgba(0, 242, 254, 0.15)';
    });

    precipChartInstance = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Daily Rain (mm)',
          data: daily,
          backgroundColor: barColors,
          borderRadius: 4,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#0e1628',
            borderColor: 'rgba(0, 242, 254, 0.3)',
            borderWidth: 1,
            titleFont: { family: "'Inter', sans-serif", size: 12 },
            bodyFont: { family: "'JetBrains Mono', monospace", size: 12 },
            callbacks: { label: item => `Precipitation: ${item.raw.toFixed(1)} mm` }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              color: '#7a8ba8',
              font: { family: "'Inter', sans-serif", size: 9 },
              callback: function(val, idx) { return idx % 5 === 0 ? this.getLabelForValue(val) : ''; }
            }
          },
          y: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: {
              color: '#7a8ba8',
              font: { family: "'JetBrains Mono', monospace", size: 10 },
              callback: v => `${v}mm`
            },
            beginAtZero: true
          }
        }
      }
    });
  }

  function renderAccumulatedChart() {
    const canvas = document.getElementById('chart-accumulated');
    if (!canvas || !window.Chart) return;

    if (accumChartInstance) accumChartInstance.destroy();

    const precip = window.MOCK_WEATHER_DATA.precipitation;
    const labels = ['Past 7d', 'Prev 7d', 'Past 15d', 'Past 30d'];
    const values = [precip.past7_mm, precip.previous7_mm, precip.past15_mm, precip.past30_mm];
    const colors = ['#00f2fe', '#06b6d4', '#3b82f6', '#8b5cf6'];

    accumChartInstance = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          data: values,
          backgroundColor: colors.map(c => c + '40'),
          borderColor: colors,
          borderWidth: 2,
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#0e1628',
            borderColor: 'rgba(0, 242, 254, 0.3)',
            borderWidth: 1,
            callbacks: { label: item => `${item.raw.toFixed(1)} mm` }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255, 255, 255, 0.05)' },
            ticks: { color: '#7a8ba8', font: { family: "'JetBrains Mono', monospace", size: 10 } },
            beginAtZero: true
          },
          y: {
            grid: { display: false },
            ticks: { color: '#f0f4f8', font: { family: "'Inter', sans-serif", size: 11 } }
          }
        }
      }
    });
  }

  /* ================================================================
     CANVAS SEMI-GAUGE DRAWING
     ================================================================ */
  function drawSemiGauge(canvasId, value, min, max, zones) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const rect = canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = rect.width + 'px';
    canvas.style.height = rect.height + 'px';
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const cx = w / 2;
    const cy = h - 10;
    const radius = Math.min(cx - 15, cy - 10);
    const lineWidth = 14;

    const startAngle = Math.PI;
    const endAngle = 2 * Math.PI;

    // Track
    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Active Arc
    const valAngle = startAngle + ((Math.min(value, max) - min) / (max - min)) * Math.PI;
    const activeZone = zones.find(z => value >= z.min && value <= z.max) || zones[zones.length - 1];

    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, valAngle);
    ctx.strokeStyle = activeZone.color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.stroke();

    // Glow
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, valAngle);
    ctx.strokeStyle = activeZone.color;
    ctx.lineWidth = lineWidth + 4;
    ctx.globalAlpha = 0.2;
    ctx.stroke();
    ctx.restore();
  }

  /* ================================================================
     DYNAMIC MATRIX & RISK TIERS
     ================================================================ */
  function renderScoreMatrix() {
    const tbody = document.getElementById('matrix-tbody');
    const tfoot = document.getElementById('matrix-tfoot');
    const barContainer = document.getElementById('stacked-bar-container');
    if (!tbody) return;

    const matrix = window.MOCK_WEATHER_DATA.scoreMatrix;
    const totalBGI = window.MOCK_WEATHER_DATA.assessment.bacteriaGrowthIndex;

    tbody.innerHTML = '';
    matrix.forEach(item => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <div class="matrix-var-cell">
            <span class="matrix-dot" style="background:${item.color}"></span>
            ${item.variable}
          </div>
        </td>
        <td class="mono fw-500">${item.rawValue}</td>
        <td class="text-muted">${item.condition}</td>
        <td class="mono fw-600" style="color:${item.color}">${item.score}</td>
        <td class="mono text-muted">${item.weightPct}</td>
        <td class="mono fw-700" style="color:${item.color}">${item.contribution.toFixed(1)}</td>
      `;
      tbody.appendChild(tr);
    });

    if (tfoot) {
      tfoot.innerHTML = `
        <tr>
          <td colspan="5" style="text-align: right; color: var(--text-muted);">FINAL BACTERIA GROWTH INDEX</td>
          <td class="mono fw-800 text-red" style="font-size: 1.1rem; color: #ef4444;">${totalBGI.toFixed(1)}%</td>
        </tr>
      `;
    }

    if (barContainer) {
      barContainer.innerHTML = '';
      matrix.forEach(item => {
        const pct = (item.contribution / totalBGI) * 100;
        const seg = document.createElement('div');
        seg.className = 'stacked-segment';
        seg.style.width = `${pct}%`;
        seg.style.background = item.color;
        seg.title = `${item.variable}: ${item.contribution.toFixed(1)}`;
        barContainer.appendChild(seg);
      });
    }
  }

  let currentBGIVal = 64.0;
  let animFrameId = null;

  function animateBGIVal(targetVal) {
    if (animFrameId) cancelAnimationFrame(animFrameId);
    
    const duration = 500; // ms
    const startTime = performance.now();
    const startVal = currentBGIVal;
    
    const zones = [
      { min: 0, max: 30, color: '#10b981' },
      { min: 30, max: 60, color: '#f59e0b' },
      { min: 60, max: 80, color: '#f97316' },
      { min: 80, max: 100, color: '#ef4444' }
    ];

    function step(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease-out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      currentBGIVal = startVal + (targetVal - startVal) * ease;
      
      // Re-draw canvas gauge
      drawSemiGauge('bgi-gauge-canvas', currentBGIVal, 0, 100, zones);
      
      // Update BGI gauge text
      const valEl = document.querySelector('.bgi-gauge-val');
      if (valEl) valEl.textContent = `${currentBGIVal.toFixed(1)}%`;
      
      if (progress < 1) {
        animFrameId = requestAnimationFrame(step);
      }
    }
    
    animFrameId = requestAnimationFrame(step);
  }

  function renderRiskTiers() {
    const container = document.getElementById('risk-tiers-list');
    if (!container) return;

    container.innerHTML = '';
    const tiers = window.MOCK_WEATHER_DATA.riskTiers;
    const currentLevel = window.MOCK_WEATHER_DATA.assessment.riskLevel;

    tiers.forEach(tier => {
      const isActive = tier.level === currentLevel;
      const card = document.createElement('div');
      card.className = `tier-item-card${isActive ? ' active' : ''}`;
      
      // Setup dynamic coloring for active card on initial render
      if (isActive) {
        setTimeout(() => {
          const badge = card.querySelector('.badge');
          if (badge) {
            const badgeColor = window.getComputedStyle(badge).color;
            card.style.borderColor = badgeColor;
            card.style.background = badgeColor.replace('rgb', 'rgba').replace(')', ', 0.1)');
            card.style.boxShadow = `0 0 16px ${badgeColor.replace('rgb', 'rgba').replace(')', ', 0.15)')}`;
          }
        }, 50);
      }

      card.innerHTML = `
        <div class="tier-item-left">
          <span class="tier-range">${tier.range}</span>
          <span class="badge ${tier.badgeClass}">● ${tier.level}</span>
        </div>
        <span class="tier-protocol-text">${tier.protocol}</span>
      `;

      card.addEventListener('click', () => {
        // Remove active class and reset inline styles
        document.querySelectorAll('.tier-item-card').forEach(el => {
          el.classList.remove('active');
          el.style.borderColor = '';
          el.style.background = '';
          el.style.boxShadow = '';
        });

        card.classList.add('active');
        
        // Match the border color to the badge color dynamically
        const badge = card.querySelector('.badge');
        if (badge) {
          const badgeColor = window.getComputedStyle(badge).color;
          card.style.borderColor = badgeColor;
          card.style.background = badgeColor.replace('rgb', 'rgba').replace(')', ', 0.1)');
          card.style.boxShadow = `0 0 16px ${badgeColor.replace('rgb', 'rgba').replace(')', ', 0.15)')}`;
        }

        // Animate BGI gauge to midpoint of range
        const [lowVal, highVal] = tier.range.replace(/%/g, '').split('–').map(Number);
        const midpoint = lowVal + (highVal - lowVal) / 2;
        animateBGIVal(midpoint);

        // Update hero gauge card badge text and class
        const gaugeBadge = document.querySelector('.hero-gauge-card .badge');
        if (gaugeBadge) {
          gaugeBadge.textContent = `● ${tier.level} RISK LEVEL`;
          gaugeBadge.className = `badge ${tier.badgeClass}`;
        }

        // Update score range description below badge
        const rangeDesc = document.querySelector('.hero-gauge-card p');
        if (rangeDesc) {
          rangeDesc.textContent = `Bacteria Growth Index score range: ${tier.range}`;
        }
      });

      container.appendChild(card);
    });
  }

  /* ================================================================
     SCROLL OBSERVER & LOADING OVERLAY
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
      { threshold: 0.1 }
    );

    document.querySelectorAll('.glass-card').forEach(el => {
      el.style.opacity = '0';
      el.style.transform = 'translateY(16px)';
      el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
      observer.observe(el);
    });
  }

  const style = document.createElement('style');
  style.textContent = `.animate-in { opacity: 1 !important; transform: translateY(0) !important; }`;
  document.head.appendChild(style);

  function showLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.classList.remove('hidden');
  }

  function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.classList.add('hidden');
  }

  async function fetchAndRender(lat, lon, city) {
    showLoading();
    try {
      const response = await fetch(`/api/weather/current?latitude=${lat}&longitude=${lon}`);
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      
      // Update the global state that charts and tables rely on
      window.MOCK_WEATHER_DATA = data;
      
      // 1. Update generated timestamp
      const elTime = document.getElementById('generated-timestamp');
      if (elTime) elTime.textContent = `Generated on: ${data.assessment.generatedAt}`;
      
      // 2. Update BGI score and risk level
      const elScore = document.getElementById('bgi-score-val');
      if (elScore) elScore.textContent = `${Math.round(data.assessment.bacteriaGrowthIndex)}%`;
      
      const elRisk = document.getElementById('bgi-risk-label');
      if (elRisk) {
        elRisk.textContent = data.assessment.riskLevelLabel;
        elRisk.className = 'risk-label';
        if (data.assessment.riskLevel === 'LOW') elRisk.classList.add('text-green');
        else if (data.assessment.riskLevel === 'MODERATE') elRisk.classList.add('text-cyan');
        else if (data.assessment.riskLevel === 'HIGH') elRisk.classList.add('text-orange');
        else if (data.assessment.riskLevel === 'CRITICAL') elRisk.classList.add('text-red');
      }
      
      // 3. Update stars list
      const elStarsContainer = document.getElementById('stars-container');
      if (elStarsContainer) {
        elStarsContainer.innerHTML = '';
        for (let i = 1; i <= 5; i++) {
          const filled = i <= data.assessment.riskStars;
          elStarsContainer.innerHTML += `
            <svg class="star-svg${filled ? ' filled' : ''}" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
          `;
        }
      }
      const elStarsNum = document.getElementById('summary-stars-val');
      if (elStarsNum) elStarsNum.textContent = data.assessment.riskStars;
      
      // 4. Update Card 1: Accumulated Rain
      const elPast7 = document.getElementById('summary-past7-val');
      if (elPast7) elPast7.textContent = `${data.precipitation.past7_mm.toFixed(1)} mm`;
      
      const elPast15 = document.getElementById('summary-past15-val');
      if (elPast15) elPast15.textContent = `${data.precipitation.past15_mm.toFixed(1)} mm`;
      
      const elPast30 = document.getElementById('summary-past30-val');
      if (elPast30) elPast30.textContent = `${data.precipitation.past30_mm.toFixed(1)} mm`;
      
      // 5. Update Card 2: Rainfall Trend
      const elTrendVal = document.getElementById('summary-trend-val');
      if (elTrendVal) elTrendVal.textContent = `${data.precipitation.trendPct >= 0 ? '+' : ''}${data.precipitation.trendPct.toFixed(1)}%`;
      
      const elTrendDir = document.getElementById('summary-trend-dir');
      if (elTrendDir) {
        elTrendDir.textContent = data.precipitation.trendDirection;
        elTrendDir.className = 'footer-status';
        if (data.precipitation.trendDirection === 'Increasing') elTrendDir.classList.add('text-red');
        else elTrendDir.classList.add('text-cyan');
      }
      
      // 6. Update Card 3: Rainfall Anomaly
      const elAnomaly7 = document.getElementById('summary-anomaly7d-val');
      if (elAnomaly7) elAnomaly7.textContent = data.precipitation.anomaly7d;
      
      const elAnomaly15 = document.getElementById('summary-anomaly15d-val');
      if (elAnomaly15) elAnomaly15.textContent = data.precipitation.anomaly15d;
      
      const elAnomaly30 = document.getElementById('summary-anomaly30d-val');
      if (elAnomaly30) elAnomaly30.textContent = data.precipitation.anomaly30d;
      
      const elAnomalyStatus = document.getElementById('summary-anomaly-status');
      if (elAnomalyStatus) {
        elAnomalyStatus.textContent = data.precipitation.anomalyStatus;
        elAnomalyStatus.className = 'footer-status';
        if (data.precipitation.anomalyStatus === 'Above Normal') elAnomalyStatus.classList.add('text-red');
        else elAnomalyStatus.classList.add('text-cyan');
      }
      
      // 7. Update Card 4: Consecutive Rain Streak
      const elStreakVal = document.getElementById('summary-streak-val');
      if (elStreakVal) elStreakVal.innerHTML = `${data.precipitation.consecutiveRainyDays} <span class="unit">Days</span>`;
      
      const elStreakStatus = document.getElementById('summary-streak-status');
      if (elStreakStatus) {
        elStreakStatus.textContent = data.precipitation.streakStatus;
        elStreakStatus.className = 'footer-status';
        elStreakStatus.classList.add('text-cyan');
      }
      
      // 8. Re-render charts, gauges, tables, matrices
      renderDailyPrecipChart();
      renderAccumulatedChart();
      
      drawSemiGauge('heat-gauge-canvas', data.heatIndex.heatIndex_c, 20, 55, [
        { min: 20, max: 27, color: '#10b981' },
        { min: 27, max: 32, color: '#f59e0b' },
        { min: 32, max: 40, color: '#f97316' },
        { min: 40, max: 55, color: '#ef4444' }
      ]);
      currentBGIVal = 0;
      animateBGIVal(data.assessment.bacteriaGrowthIndex);
      renderScoreMatrix();
      renderRiskTiers();
      
    } catch (error) {
      console.error('Error loading weather data:', error);
      alert('Error querying weather engine: ' + error.message);
    } finally {
      hideLoading();
    }
  }

  function setupFetchButton() {
    const btn = document.getElementById('fetch-weather-btn');
    if (!btn) return;

    btn.addEventListener('click', () => {
      const elCity = document.getElementById('input-village');
      const elLat = document.getElementById('input-lat');
      const elLon = document.getElementById('input-lon');

      const city = elCity ? elCity.value : 'Alappuzha, Kerala, India';
      const lat = elLat ? parseFloat(elLat.value) : 9.4981;
      const lon = elLon ? parseFloat(elLon.value) : 76.3388;

      saveSession({ city, lat, lon });
      fetchAndRender(lat, lon, city);
    });
  }

  /* ================================================================
     INITIALIZATION ON DOMContentLoaded
     ================================================================ */
  window.addEventListener('DOMContentLoaded', () => {
    if (window.AquaShield) {
      window.AquaShield.renderSidebar('/weather.html');
      window.AquaShield.renderHeader({
        title: 'Meteorological Intelligence Engine',
        subtitle: 'Module 1 — 30-Day Precipitation, Heat Index & 6-Variable BGI Score Matrix',
        stepCurrent: '1',
        stepTotal: '7'
      });
    }

    restoreInputs();
    setupFetchButton();
    initWaveCanvas();
    
    // Initial fetch based on restored inputs
    const elCity = document.getElementById('input-village');
    const elLat = document.getElementById('input-lat');
    const elLon = document.getElementById('input-lon');
    const city = elCity ? elCity.value : 'Alappuzha, Kerala, India';
    const lat = elLat ? parseFloat(elLat.value) : 9.4981;
    const lon = elLon ? parseFloat(elLon.value) : 76.3388;
    
    fetchAndRender(lat, lon, city).then(() => {
      initScrollAnimations();
    });
  });
})();


