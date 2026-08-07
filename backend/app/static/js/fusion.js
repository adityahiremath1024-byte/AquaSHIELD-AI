/**
 * AquaShield AI — Module 5: Multi-Signal Data Fusion Engine JS
 * Client-side custom Radar/Spider chart renderer and SVG dynamic particle stream flows.
 */

(function () {
  'use strict';

  // 1. DATA CONFIGURATION
  const DATA = {
    fusionScore: 78.4,
    domains: [
      { label: 'Environmental', value: 82, color: '#10b981' },
      { label: 'Water Contamination', value: 76, color: '#00f2fe' },
      { label: 'Health Stress', value: 71, color: '#f59e0b' },
      { label: 'Community Exposure', value: 84, color: '#a855f7' }
    ]
  };

  // 2. RADAR/SPIDER CHART RENDERER (Custom HTML5 Canvas)
  function renderRadarChart() {
    const canvas = document.getElementById('radar-chart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const maxRadius = Math.min(width, height) / 2 - 40;

    // Resolve colors based on current theme variables if possible, or fallback
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';
    const textColor = isDark ? '#9090a0' : '#707080';
    const labelColor = isDark ? '#ffffff' : '#000000';

    ctx.clearRect(0, 0, width, height);

    // Number of axes (4 risk domains)
    const totalAxes = DATA.domains.length;
    const angleStep = (Math.PI * 2) / totalAxes;

    // Draw concentric scale rings (5 layers)
    const concentricRings = 5;
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    for (let r = 1; r <= concentricRings; r++) {
      const radius = (maxRadius / concentricRings) * r;
      ctx.beginPath();
      for (let i = 0; i < totalAxes; i++) {
        const angle = i * angleStep - Math.PI / 2;
        const x = centerX + Math.cos(angle) * radius;
        const y = centerY + Math.sin(angle) * radius;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.stroke();
    }

    // Draw axis lines and labels
    DATA.domains.forEach((domain, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const axisX = centerX + Math.cos(angle) * maxRadius;
      const axisY = centerY + Math.sin(angle) * maxRadius;

      // Draw axis line
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(axisX, axisY);
      ctx.stroke();

      // Label positioning
      const labelDistance = maxRadius + 20;
      const labelX = centerX + Math.cos(angle) * labelDistance;
      const labelY = centerY + Math.sin(angle) * labelDistance;

      ctx.fillStyle = labelColor;
      ctx.font = 'bold 11px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Fine-tune label offsets
      let alignX = labelX;
      if (Math.abs(Math.cos(angle)) > 0.1) {
        alignX += Math.cos(angle) * 10;
      }
      ctx.fillText(domain.label.toUpperCase(), alignX, labelY);
    });

    // Draw data polygon
    ctx.beginPath();
    DATA.domains.forEach((domain, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const scoreFraction = domain.value / 100;
      const radius = maxRadius * scoreFraction;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();

    // Fill data polygon (semi-transparent teal-green gradient glow)
    const fillGrad = ctx.createRadialGradient(centerX, centerY, 5, centerX, centerY, maxRadius);
    fillGrad.addColorStop(0, 'rgba(0, 255, 170, 0.1)');
    fillGrad.addColorStop(1, 'rgba(0, 242, 254, 0.35)');
    ctx.fillStyle = fillGrad;
    ctx.fill();

    // Outline data polygon
    ctx.strokeStyle = '#00ffaa';
    ctx.lineWidth = 2.5;
    ctx.shadowBlur = 15;
    ctx.shadowColor = 'rgba(0, 255, 170, 0.5)';
    ctx.stroke();
    
    // Reset shadow
    ctx.shadowBlur = 0;

    // Draw data points
    DATA.domains.forEach((domain, i) => {
      const angle = i * angleStep - Math.PI / 2;
      const scoreFraction = domain.value / 100;
      const radius = maxRadius * scoreFraction;
      const x = centerX + Math.cos(angle) * radius;
      const y = centerY + Math.sin(angle) * radius;

      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fillStyle = domain.color;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.fill();
      ctx.stroke();
    });
  }

  // 3. RADIAL RISK GAUGE ANIMATION
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

  // 4. ANIMATED DYNAMIC DATA STREAMS (SVG Particle Flow Paths)
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

  // 5. INITIALIZE PAGE COMPONENTS
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

    // Hide loading overlay
    const loader = document.getElementById('loading-overlay');
    if (loader) {
      setTimeout(() => {
        loader.classList.add('hidden');
      }, 500);
    }

    // Run custom visuals
    initRiskGauge(DATA.fusionScore);
    renderRadarChart();
    renderDataStreams();

    // Re-render radar chart when theme changes
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        setTimeout(renderRadarChart, 150);
      });
    }

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
