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
    const urlParams = new URLSearchParams(window.location.search);
    const centralParams = window.AquaShieldSession ? window.AquaShieldSession.getAssessmentParams() : {};

    const village = urlParams.get('village_name') || urlParams.get('location') || centralParams.village_name || '';
    const lat = urlParams.get('latitude') || urlParams.get('lat') || centralParams.latitude || '';
    const lon = urlParams.get('longitude') || urlParams.get('lon') || centralParams.longitude || '';

    const elVillage = document.getElementById('input-village');
    const elLat = document.getElementById('input-lat');
    const elLon = document.getElementById('input-lon');

    if (elVillage) elVillage.value = village;
    if (elLat) elLat.value = lat;
    if (elLon) elLon.value = lon;

    const elStart = document.getElementById('input-start-date');
    const elEnd = document.getElementById('input-end-date');

    if (centralParams.start_date && elStart) {
      elStart.value = centralParams.start_date;
    }
    if (centralParams.end_date && elEnd) {
      elEnd.value = centralParams.end_date;
    }

    // Attach sync listeners on date changes
    if (elStart) {
      elStart.addEventListener('change', () => {
        if (window.AquaShieldSession) {
          window.AquaShieldSession.setAssessmentParams({ start_date: elStart.value });
        }
      });
    }
    if (elEnd) {
      elEnd.addEventListener('change', () => {
        if (window.AquaShieldSession) {
          window.AquaShieldSession.setAssessmentParams({ end_date: elEnd.value });
        }
      });
    }
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
     CANVAS SEMI-GAUGE DRAWING (Sci-Fi / Modern Geospatial Instrument)
     ================================================================ */
  function hexToRgba(hex, alpha) {
    if (!hex) return `rgba(6, 214, 214, ${alpha})`;
    if (hex.startsWith('rgb')) return hex.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
    let c = hex.replace('#', '');
    if (c.length === 3) c = c.split('').map(x => x + x).join('');
    const r = parseInt(c.substring(0, 2), 16) || 0;
    const g = parseInt(c.substring(2, 4), 16) || 0;
    const b = parseInt(c.substring(4, 6), 16) || 0;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

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
    const cy = h - 20;
    const radius = Math.min(cx - 30, cy - 14);
    const lineWidth = 12;

    const startAngle = Math.PI;
    const endAngle = 2 * Math.PI;

    ctx.clearRect(0, 0, w, h);

    const currentPct = Math.max(0, Math.min((value - min) / (max - min), 1));
    const activeZone = zones.find(z => value >= z.min && value <= z.max) || zones[zones.length - 1];

    // 1. Soft Ambient Radial Glow Backdrop inside the arch
    const bgGlowGrad = ctx.createRadialGradient(cx, cy, 4, cx, cy, radius);
    bgGlowGrad.addColorStop(0, hexToRgba(activeZone.color, 0.16));
    bgGlowGrad.addColorStop(0.85, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = bgGlowGrad;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.fill();

    // 2. Base Background Segmented Tracks
    zones.forEach(zone => {
      const zStart = startAngle + ((Math.max(zone.min, min) - min) / (max - min)) * Math.PI;
      const zEnd = startAngle + ((Math.min(zone.max, max) - min) / (max - min)) * Math.PI;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, zStart, zEnd);
      ctx.strokeStyle = hexToRgba(zone.color, 0.18);
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'butt';
      ctx.stroke();
    });

    // 3. Precision Radial Tick Marks (20 Ticks)
    const numTicks = 20;
    for (let i = 0; i <= numTicks; i++) {
      const tickAngle = startAngle + (i / numTicks) * Math.PI;
      const isMajor = i % 5 === 0;
      const tickInner = radius + (isMajor ? 8 : 10);
      const tickOuter = radius + (isMajor ? 16 : 13);

      const x1 = cx + Math.cos(tickAngle) * tickInner;
      const y1 = cy + Math.sin(tickAngle) * tickInner;
      const x2 = cx + Math.cos(tickAngle) * tickOuter;
      const y2 = cy + Math.sin(tickAngle) * tickOuter;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = isMajor ? 'rgba(255, 255, 255, 0.45)' : 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = isMajor ? 1.5 : 1;
      ctx.stroke();
    }

    // 4. Active Glowing Gradient Arc
    const valAngle = startAngle + currentPct * Math.PI;
    
    // Outer Neon Glow Layer
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, valAngle);
    ctx.strokeStyle = activeZone.color;
    ctx.lineWidth = lineWidth + 6;
    ctx.globalAlpha = 0.35;
    ctx.lineCap = 'round';
    ctx.shadowBlur = 18;
    ctx.shadowColor = activeZone.color;
    ctx.stroke();
    ctx.restore();

    // Sharp Core Active Arc
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, valAngle);
    ctx.strokeStyle = activeZone.color;
    ctx.lineWidth = lineWidth;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.restore();

    // 5. Sleek Needle / Pointer with pivot hub
    const needleLength = radius - 16;
    const needleX = cx + Math.cos(valAngle) * needleLength;
    const needleY = cy + Math.sin(valAngle) * needleLength;

    // Needle stroke
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(needleX, needleY);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.shadowBlur = 8;
    ctx.shadowColor = activeZone.color;
    ctx.stroke();

    // Needle tip glow dot
    ctx.beginPath();
    ctx.arc(needleX, needleY, 3.5, 0, 2 * Math.PI);
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 10;
    ctx.shadowColor = activeZone.color;
    ctx.fill();

    // Center Pivot Hub Ring
    ctx.beginPath();
    ctx.arc(cx, cy, 7, 0, 2 * Math.PI);
    ctx.fillStyle = '#1a1f2e';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = activeZone.color;
    ctx.stroke();

    // Inner Hub Dot
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, 2 * Math.PI);
    ctx.fillStyle = activeZone.color;
    ctx.fill();
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
      const activeZone = zones.find(z => currentBGIVal >= z.min && currentBGIVal <= z.max) || zones[zones.length - 1];
      if (valEl) {
        valEl.textContent = `${currentBGIVal.toFixed(1)}%`;
        valEl.style.color = activeZone.color;
        valEl.style.textShadow = `0 0 20px ${hexToRgba(activeZone.color, 0.45)}`;
      }
      
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



  /* ================================================================
     AUTO-GEOCODING & LOCATION AUTOFILL
     ================================================================ */
  function setupAutoGeocoding() {
    const elVillage = document.getElementById('input-village');
    const elLat = document.getElementById('input-lat');
    const elLon = document.getElementById('input-lon');
    const dropdown = document.getElementById('location-suggestions');
    if (!elVillage || !dropdown) return;

    let debounceTimer = null;

    async function queryGeocode(text, autoSelectSingle = false) {
      if (!text || text.trim().length < 2) {
        dropdown.style.display = 'none';
        return [];
      }

      try {
        const res = await fetch(`/api/weather/geocode?query=${encodeURIComponent(text.trim())}`);
        if (!res.ok) return [];
        const data = await res.json();
        const results = data.results || [];

        if (results.length === 0) {
          dropdown.style.display = 'none';
          return [];
        }

        if (autoSelectSingle && results.length >= 1) {
          applyLocation(results[0]);
          dropdown.style.display = 'none';
          return results;
        }

        renderDropdown(results);
        return results;
      } catch (err) {
        console.warn('Geocoding fetch error:', err);
        dropdown.style.display = 'none';
        return [];
      }
    }

    function renderDropdown(items) {
      dropdown.innerHTML = '';
      items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'suggestion-item';
        div.innerHTML = `
          <span class="suggestion-name">${item.display_name}</span>
          <span class="suggestion-coords">${item.latitude}° N, ${item.longitude}° E</span>
        `;
        div.addEventListener('mousedown', (e) => {
          e.preventDefault();
          applyLocation(item);
          dropdown.style.display = 'none';
        });
        dropdown.appendChild(div);
      });
      dropdown.style.display = 'block';
    }

    function applyLocation(item) {
      if (elVillage) elVillage.value = item.display_name;
      if (elLat) {
        elLat.value = item.latitude;
        elLat.classList.remove('field-highlight-autofill');
        void elLat.offsetWidth;
        elLat.classList.add('field-highlight-autofill');
      }
      if (elLon) {
        elLon.value = item.longitude;
        elLon.classList.remove('field-highlight-autofill');
        void elLon.offsetWidth;
        elLon.classList.add('field-highlight-autofill');
      }
      saveSession({ city: item.display_name, lat: item.latitude, lon: item.longitude });
      if (window.AquaShieldSession) {
        const elStart = document.getElementById('input-start-date');
        const elEnd = document.getElementById('input-end-date');
        window.AquaShieldSession.setAssessmentParams({
          village_name: item.display_name,
          latitude: item.latitude,
          longitude: item.longitude,
          start_date: elStart ? elStart.value : '',
          end_date: elEnd ? elEnd.value : ''
        });
      }
    }

    elVillage.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      const val = elVillage.value.trim();
      if (val.length < 2) {
        dropdown.style.display = 'none';
        return;
      }
      debounceTimer = setTimeout(() => {
        queryGeocode(val, false);
      }, 250);
    });

    elVillage.addEventListener('blur', () => {
      setTimeout(() => {
        dropdown.style.display = 'none';
      }, 200);
      const val = elVillage.value.trim();
      if (val && (!elLat.value || !elLon.value)) {
        queryGeocode(val, true);
      }
    });

    elVillage.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        const val = elVillage.value.trim();
        if (val) {
          queryGeocode(val, true);
        }
      }
    });

    document.addEventListener('click', (e) => {
      if (!elVillage.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.style.display = 'none';
      }
    });
  }

  function setupFetchButton() {
    const btn = document.getElementById('fetch-weather-btn');
    if (!btn) return;

    btn.addEventListener('click', async () => {
      const elCity = document.getElementById('input-village');
      const elLat = document.getElementById('input-lat');
      const elLon = document.getElementById('input-lon');
      const elStart = document.getElementById('input-start-date');
      const elEnd = document.getElementById('input-end-date');

      let city = elCity ? elCity.value.trim() : '';
      let lat = elLat && elLat.value.trim() ? parseFloat(elLat.value) : null;
      let lon = elLon && elLon.value.trim() ? parseFloat(elLon.value) : null;
      const startDate = elStart ? elStart.value.trim() : '';
      const endDate = elEnd ? elEnd.value.trim() : '';

      // If user typed location name but lat/lon are not yet populated, auto-geocode first
      if ((lat === null || isNaN(lat) || lon === null || isNaN(lon)) && city) {
        try {
          const res = await fetch(`/api/weather/geocode?query=${encodeURIComponent(city)}`);
          if (res.ok) {
            const data = await res.json();
            if (data.results && data.results.length > 0) {
              const top = data.results[0];
              city = top.display_name;
              lat = top.latitude;
              lon = top.longitude;
              if (elCity) elCity.value = city;
              if (elLat) elLat.value = lat;
              if (elLon) elLon.value = lon;
            }
          }
        } catch (e) {
          console.warn('Auto-geocoding error before fetch:', e);
        }
      }

      if (lat === null || isNaN(lat) || lon === null || isNaN(lon)) {
        if (window.AquaShieldUtils) {
          window.AquaShieldUtils.showErrorToast('Please enter a location name to evaluate meteorological risk.', 'warning');
        } else {
          alert('Please enter a location name to evaluate meteorological risk.');
        }
        if (elCity) elCity.focus();
        return;
      }

      saveSession({ city, lat, lon });
      if (window.AquaShieldSession) {
        window.AquaShieldSession.setAssessmentParams({
          village_name: city,
          latitude: lat,
          longitude: lon,
          start_date: startDate,
          end_date: endDate
        });
      }
      fetchAndRender(lat, lon, city);
    });
  }

  function renderEmptyState() {
    const elTime = document.getElementById('generated-timestamp');
    if (elTime) elTime.textContent = 'Status: Waiting for user input...';

    const elScore = document.getElementById('bgi-score-val');
    if (elScore) elScore.textContent = '--%';

    const elRisk = document.getElementById('bgi-risk-label');
    if (elRisk) {
      elRisk.textContent = 'NOT ANALYZED';
      elRisk.className = 'risk-label text-muted';
    }

    const elPast7 = document.getElementById('summary-past7-val');
    if (elPast7) elPast7.textContent = '-- mm';
    const elPast15 = document.getElementById('summary-past15-val');
    if (elPast15) elPast15.textContent = '-- mm';
    const elPast30 = document.getElementById('summary-past30-val');
    if (elPast30) elPast30.textContent = '-- mm';

    const elTrendVal = document.getElementById('summary-trend-val');
    if (elTrendVal) elTrendVal.textContent = '--%';
    const elAnomaly30 = document.getElementById('summary-anomaly30d-val');
    if (elAnomaly30) elAnomaly30.textContent = '--%';
    const elStreakVal = document.getElementById('summary-streak-val');
    if (elStreakVal) elStreakVal.textContent = '-- Days';

    const tbody = document.getElementById('matrix-tbody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding: 24px; color: #7a8ba8;">Please click "FETCH METEOROLOGICAL DATA" above to run live analysis.</td></tr>';
  }

  function applyDataToUI(data) {
    window.MOCK_WEATHER_DATA = data;

    const elTime = document.getElementById('generated-timestamp');
    if (elTime && data.assessment) elTime.textContent = `Generated on: ${data.assessment.generatedAt}`;

    const elScore = document.getElementById('bgi-score-val');
    if (elScore && data.assessment) elScore.textContent = `${Math.round(data.assessment.bacteriaGrowthIndex)}%`;

    const elRisk = document.getElementById('bgi-risk-label');
    if (elRisk && data.assessment) {
      elRisk.textContent = data.assessment.riskLevelLabel;
      elRisk.className = 'risk-label';
      if (data.assessment.riskLevel === 'LOW') elRisk.classList.add('text-green');
      else if (data.assessment.riskLevel === 'MODERATE') elRisk.classList.add('text-cyan');
      else if (data.assessment.riskLevel === 'HIGH') elRisk.classList.add('text-orange');
      else if (data.assessment.riskLevel === 'CRITICAL') elRisk.classList.add('text-red');
    }

    const elStarsContainer = document.getElementById('stars-container');
    if (elStarsContainer && data.assessment) {
      elStarsContainer.innerHTML = '';
      for (let i = 1; i <= 5; i++) {
        const filled = i <= data.assessment.riskStars;
        elStarsContainer.innerHTML += `
          <svg class="star-svg${filled ? ' filled' : ''}" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
        `;
      }
    }
    const elStarsNum = document.getElementById('summary-stars-val');
    if (elStarsNum && data.assessment) elStarsNum.textContent = data.assessment.riskStars;

    if (data.precipitation) {
      const elPast7 = document.getElementById('summary-past7-val');
      if (elPast7) elPast7.textContent = `${data.precipitation.past7_mm.toFixed(1)} mm`;
      const elPast15 = document.getElementById('summary-past15-val');
      if (elPast15) elPast15.textContent = `${data.precipitation.past15_mm.toFixed(1)} mm`;
      const elPast30 = document.getElementById('summary-past30-val');
      if (elPast30) elPast30.textContent = `${data.precipitation.past30_mm.toFixed(1)} mm`;

      const elTrendVal = document.getElementById('summary-trend-val');
      if (elTrendVal) elTrendVal.textContent = `${data.precipitation.trendPct >= 0 ? '+' : ''}${data.precipitation.trendPct.toFixed(1)}%`;

      const elTrendDir = document.getElementById('summary-trend-dir');
      if (elTrendDir) {
        elTrendDir.textContent = data.precipitation.trendDirection;
        elTrendDir.className = 'footer-status';
        if (data.precipitation.trendDirection === 'Increasing') elTrendDir.classList.add('text-red');
        else elTrendDir.classList.add('text-cyan');
      }

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

      const elStreakVal = document.getElementById('summary-streak-val');
      if (elStreakVal) elStreakVal.innerHTML = `${data.precipitation.consecutiveRainyDays} <span class="unit">Days</span>`;

      const elStreakStatus = document.getElementById('summary-streak-status');
      if (elStreakStatus) {
        elStreakStatus.textContent = data.precipitation.streakStatus;
        elStreakStatus.className = 'footer-status';
        elStreakStatus.classList.add('text-cyan');
      }
    }

    renderDailyPrecipChart();
    renderAccumulatedChart();

    if (data.heatIndex) {
      const heatZones = [
        { min: 20, max: 27, color: '#10b981' },
        { min: 27, max: 32, color: '#f59e0b' },
        { min: 32, max: 40, color: '#f97316' },
        { min: 40, max: 55, color: '#ef4444' }
      ];
      drawSemiGauge('heat-gauge-canvas', data.heatIndex.heatIndex_c, 20, 55, heatZones);
      const heatValEl = document.querySelector('.heat-gauge-num');
      const activeHeatZone = heatZones.find(z => data.heatIndex.heatIndex_c >= z.min && data.heatIndex.heatIndex_c <= z.max) || heatZones[heatZones.length - 1];
      if (heatValEl) {
        heatValEl.textContent = `${data.heatIndex.heatIndex_c.toFixed(1)}°C`;
        heatValEl.style.color = activeHeatZone.color;
        heatValEl.style.textShadow = `0 0 20px ${hexToRgba(activeHeatZone.color, 0.45)}`;
      }
    }
    if (data.assessment) {
      currentBGIVal = 0;
      animateBGIVal(data.assessment.bacteriaGrowthIndex);
    }
    renderScoreMatrix();
    renderRiskTiers();
  }

  async function fetchAndRender(lat, lon, city) {
    showLoading();
    try {
      const fetchFn = window.AquaShieldUtils ? window.AquaShieldUtils.safeFetch : fetch;
      const response = await fetchFn(`/api/weather/current?latitude=${lat}&longitude=${lon}`);
      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();

      // Save to central session manager
      if (window.AquaShieldSession) {
        window.AquaShieldSession.saveModuleResult('module1_weather', { village_name: city, latitude: lat, longitude: lon }, data);
      }

      applyDataToUI(data);

    } catch (error) {
      console.error('Error loading weather data:', error);
      if (window.AquaShieldUtils) {
        window.AquaShieldUtils.showErrorToast('Weather Engine Error: ' + error.message, 'error');
      } else {
        alert('Error querying weather engine: ' + error.message);
      }
    } finally {
      hideLoading();
    }
  }

  /* ================================================================
     INITIALIZATION ON DOMContentLoaded
     ================================================================ */
  window.addEventListener('DOMContentLoaded', () => {
    if (window.AquaShield) {
      window.AquaShield.renderSidebar('/weather.html');
      window.AquaShield.renderHeader({
        title: 'Meteorological Intelligence Engine',
        subtitle: '30-Day Precipitation, Heat Index & 6-Variable BGI Score Matrix',
        stepCurrent: '1',
        stepTotal: '7'
      });
    }

    restoreInputs();
    setupAutoGeocoding();
    setupFetchButton();
    initWaveCanvas();

    // Check if current run has completed module1
    const m1 = window.AquaShieldSession ? window.AquaShieldSession.getModuleResult('module1_weather') : null;
    if (m1 && m1.result) {
      applyDataToUI(m1.result);
      initScrollAnimations();
    } else {
      renderEmptyState();
      initScrollAnimations();
    }
  });
})();


