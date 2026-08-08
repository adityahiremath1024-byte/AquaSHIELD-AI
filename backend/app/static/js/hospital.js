/**
 * AquaShield AI — Module 3: Hospital Surveillance Interactive Engine
 * ═══════════════════════════════════════════════════════════════════
 * Handles:
 *  1. Page initialization & sidebar/header rendering
 *  2. Fetching live surge data from GET /api/hospital/surge-summary
 *  3. Submitting new records via POST /api/hospital/records
 *  4. Rendering the 4 hero metric cards with animated counters
 *  5. Drawing the interactive SVG 7-day trend line chart
 *  6. Rendering case breakdown and capacity risk panels
 *  7. Toast notification system
 */

const API_BASE = window.location.origin;

// ─── Page Initialization ────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // Render sidebar & header
  if (window.AquaShield) {
    window.AquaShield.renderSidebar('/hospital.html');
    window.AquaShield.renderHeader({
      title: 'Hospital Case and Capacity Surveillance',
      subtitle: 'Real-time hospital data ingestion and capacity monitoring',
      stepCurrent: '3',
      stepTotal: '7'
    });
  }

  // Wire up submit button
  document.getElementById('submit-data-btn').addEventListener('click', handleSubmit);

  // Wire up hospital dropdown change listener
  const hospitalSelect = document.getElementById('input-hospital');
  if (hospitalSelect) {
    hospitalSelect.addEventListener('change', (e) => {
      fetchSurgeData(e.target.value);
    });
  }

  // Load initial data
  fetchSurgeData(hospitalSelect ? hospitalSelect.value : 'Kottayam');
});


// ─── Fetch Surge Summary from API ───────────────────────────────────────────
async function fetchSurgeData(villageName) {
  showLoading(true);
  try {
    const res = await fetch(`${API_BASE}/api/hospital/surge-summary?village_name=${encodeURIComponent(villageName)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    renderAllPanels(data);
    showToast('Surge data loaded successfully', 'success');
  } catch (err) {
    console.error('Fetch surge error:', err);
    showToast('Failed to load hospital data — using defaults', 'error');
    renderAllPanels(getDefaultData());
  } finally {
    showLoading(false);
  }
}


// ─── Submit Hospital Record ─────────────────────────────────────────────────
async function handleSubmit() {
  const btn = document.getElementById('submit-data-btn');
  btn.disabled = true;
  btn.textContent = 'SUBMITTING…';

  const hospitalName = document.getElementById('input-hospital').value;
  const totalBeds = parseInt(document.getElementById('input-beds').value) || 100;
  const occupiedBeds = parseInt(document.getElementById('input-occupied').value) || 0;
  const totalCases = parseInt(document.getElementById('input-cases').value) || 0;
  const doctors = parseInt(document.getElementById('input-doctors').value) || 1;

  // Distribute total cases proportionally (realistic breakdown)
  const diarrhea = Math.round(totalCases * 0.45);
  const typhoid = Math.round(totalCases * 0.24);
  const cholera = Math.round(totalCases * 0.11);
  const fever = totalCases - diarrhea - typhoid - cholera;

  const today = new Date().toISOString().split('T')[0];

  const payload = {
    village_name: hospitalName,
    latitude: 9.5916,
    longitude: 76.5222,
    record_date: today,
    diarrhea_cases: diarrhea,
    typhoid_cases: typhoid,
    cholera_cases: cholera,
    fever_cases: fever,
    total_beds: totalBeds,
    occupied_beds: occupiedBeds,
    doctors_on_duty: doctors,
    medicine_stock_pct: 62.0,
    reported_by: 'Dashboard User'
  };

  try {
    const res = await fetch(`${API_BASE}/api/hospital/records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    showToast('Hospital record submitted successfully!', 'success');

    // Refresh surge data
    setTimeout(() => fetchSurgeData(hospitalName), 300);
  } catch (err) {
    console.error('Submit error:', err);
    showToast('Submission failed — check server connection', 'error');
  } finally {
    btn.disabled = false;
    btn.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
        <path d="M22 2L11 13"/>
        <path d="M22 2L15 22L11 13L2 9L22 2Z"/>
      </svg>
      SUBMIT DATA
    `;
  }
}


// ─── Render All Panels ──────────────────────────────────────────────────────
function renderAllPanels(data) {
  if (window.AquaShieldSession) {
    window.AquaShieldSession.saveModuleResult('module3_hospital', {
      village_name: data.village_name || 'Kottayam General Hospital'
    }, data);
  }
  renderMetricCards(data);
  renderTrendChart(data.historical_trend || []);
  renderCaseBreakdown(data);
  renderCapacityPanel(data);
}


// ─── Render Metric Cards ────────────────────────────────────────────────────
function renderMetricCards(data) {
  // 7-Day Rolling Average
  animateCounter('metric-avg', data.moving_avg_7d || 0, 1);

  // Growth Rate
  const growthEl = document.getElementById('metric-growth');
  const g = data.growth_rate_pct || 0;
  animateCounter('metric-growth', Math.abs(g), 1, g >= 0 ? '+' : '−', '%');
  growthEl.className = 'metric-value ' + (g >= 60 ? 'text-red' : g >= 30 ? 'text-amber' : 'text-green');

  // Capacity Utilization
  const cap = data.capacity_utilization_pct || 0;
  animateCounter('metric-capacity', cap, 1, '', '%');
  const capEl = document.getElementById('metric-capacity');
  capEl.className = 'metric-value ' + (cap >= 80 ? 'text-red' : cap >= 60 ? 'text-amber' : 'text-green');
  document.getElementById('metric-beds-sub').textContent =
    `${data.occupied_beds || 0} / ${data.total_beds || 0} beds occupied`;

  // Outbreak Threshold
  const tier = (data.outbreak_threshold_level || 'NORMAL').toUpperCase();
  const tierClass = tier.toLowerCase();
  document.getElementById('metric-threshold').innerHTML =
    `<span class="threshold-badge ${tierClass}">${tier}</span>`;
  document.getElementById('metric-threshold-sub').textContent =
    `Today: ${data.today_total || 0} cases`;
}


// ─── Animated Counter ───────────────────────────────────────────────────────
function animateCounter(elementId, targetValue, decimals = 0, prefix = '', suffix = '') {
  const el = document.getElementById(elementId);
  if (!el) return;

  const duration = 1200;
  const startTime = performance.now();
  const startVal = 0;

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
    const current = startVal + (targetValue - startVal) * eased;
    el.textContent = prefix + current.toFixed(decimals) + suffix;
    if (progress < 1) requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
}


// ─── Render SVG Trend Chart ─────────────────────────────────────────────────
function renderTrendChart(trendData) {
  const svg = document.getElementById('trend-chart-svg');
  if (!svg || !trendData.length) return;

  // Clear existing dynamic elements
  svg.querySelectorAll('.chart-dynamic').forEach(el => el.remove());

  const padding = { top: 30, right: 40, bottom: 40, left: 50 };
  const width = 800;
  const height = 280;
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const cases = trendData.map(d => d.cases);
  const maxCases = Math.max(...cases, 10);
  const yMax = Math.ceil(maxCases / 10) * 10 + 10;

  // Helper: data → SVG coords
  const xScale = (i) => padding.left + (i / (trendData.length - 1 || 1)) * chartW;
  const yScale = (val) => padding.top + chartH - (val / yMax) * chartH;

  const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
  g.classList.add('chart-dynamic');

  // Grid lines (horizontal)
  const gridSteps = 5;
  for (let i = 0; i <= gridSteps; i++) {
    const yVal = (yMax / gridSteps) * i;
    const y = yScale(yVal);

    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', padding.left);
    line.setAttribute('x2', width - padding.right);
    line.setAttribute('y1', y);
    line.setAttribute('y2', y);
    line.classList.add('chart-grid-line');
    g.appendChild(line);

    // Y-axis label
    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', padding.left - 10);
    label.setAttribute('y', y + 4);
    label.setAttribute('text-anchor', 'end');
    label.classList.add('chart-axis-label');
    label.textContent = Math.round(yVal);
    g.appendChild(label);
  }

  // Y-axis title
  const yTitle = document.createElementNS('http://www.w3.org/2000/svg', 'text');
  yTitle.setAttribute('x', 14);
  yTitle.setAttribute('y', height / 2);
  yTitle.setAttribute('text-anchor', 'middle');
  yTitle.setAttribute('transform', `rotate(-90, 14, ${height / 2})`);
  yTitle.classList.add('chart-axis-label');
  yTitle.textContent = 'Cases';
  g.appendChild(yTitle);

  // Build line path & area path
  let linePath = '';
  let areaPath = `M ${xScale(0)} ${yScale(0)} `;

  trendData.forEach((d, i) => {
    const x = xScale(i);
    const y = yScale(d.cases);
    if (i === 0) {
      linePath += `M ${x} ${y}`;
      areaPath += `L ${x} ${y}`;
    } else {
      linePath += ` L ${x} ${y}`;
      areaPath += ` L ${x} ${y}`;
    }
  });

  areaPath += ` L ${xScale(trendData.length - 1)} ${yScale(0)} Z`;

  // Area fill
  const area = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  area.setAttribute('d', areaPath);
  area.classList.add('chart-area');
  g.appendChild(area);

  // Line
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  line.setAttribute('d', linePath);
  line.classList.add('chart-line');
  g.appendChild(line);

  // Dots + labels + x-axis dates
  trendData.forEach((d, i) => {
    const x = xScale(i);
    const y = yScale(d.cases);

    // Dot
    const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    dot.setAttribute('cx', x);
    dot.setAttribute('cy', y);
    dot.setAttribute('r', 5);
    dot.classList.add('chart-dot');
    g.appendChild(dot);

    // Value label above dot
    const valLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    valLabel.setAttribute('x', x);
    valLabel.setAttribute('y', y - 14);
    valLabel.classList.add('chart-dot-label');
    valLabel.textContent = d.cases;
    g.appendChild(valLabel);

    // X-axis date label
    const dateLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    dateLabel.setAttribute('x', x);
    dateLabel.setAttribute('y', height - 8);
    dateLabel.setAttribute('text-anchor', 'middle');
    dateLabel.classList.add('chart-axis-label');
    // Format date as "DD Mon"
    const parts = d.date.split('-');
    const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    dateLabel.textContent = `${dateObj.getDate().toString().padStart(2, '0')} ${months[dateObj.getMonth()]}`;
    g.appendChild(dateLabel);
  });

  svg.appendChild(g);
}


// ─── Render Case Breakdown ──────────────────────────────────────────────────
function renderCaseBreakdown(data) {
  document.getElementById('case-diarrhea').textContent = data.diarrhea_cases || 0;
  document.getElementById('case-typhoid').textContent = data.typhoid_cases || 0;
  document.getElementById('case-cholera').textContent = data.cholera_cases || 0;
  document.getElementById('case-fever').textContent = data.fever_cases || 0;
}


// ─── Render Capacity & Risk Panel ───────────────────────────────────────────
function renderCapacityPanel(data) {
  const occ = data.capacity_utilization_pct || 0;
  document.getElementById('cap-occ-pct').textContent = occ.toFixed(1) + '%';
  document.getElementById('cap-bar-fill').style.width = Math.min(occ, 100) + '%';
  document.getElementById('cap-avail').textContent = data.beds_available || 0;
  document.getElementById('cap-docs').textContent = data.doctors_on_duty || 0;

  const risk = data.capacity_risk_score || 3.0;
  document.getElementById('cap-risk-score').textContent = risk.toFixed(1) + ' / 10';

  // Star rating
  const stars = data.hospital_score_stars || 5;
  const starContainer = document.getElementById('star-rating');
  starContainer.innerHTML = '';
  for (let i = 1; i <= 5; i++) {
    const starSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    starSvg.setAttribute('viewBox', '0 0 24 24');
    starSvg.classList.add('star');
    if (i > stars) starSvg.classList.add('empty');

    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z');
    path.setAttribute('fill', i <= stars ? '#f59e0b' : 'currentColor');
    path.setAttribute('stroke', 'none');
    starSvg.appendChild(path);
    starContainer.appendChild(starSvg);
  }

  // Risk label
  const labels = {
    5: 'Excellent PHC Capacity',
    4: 'Good Capacity',
    3: 'Moderate Strain',
    2: 'High Capacity Strain',
    1: 'Critical Capacity Collapse'
  };
  document.getElementById('cap-risk-label').textContent = labels[stars] || 'Unknown';
}


// ─── Default / Fallback Data ────────────────────────────────────────────────
function getDefaultData() {
  return {
    village_name: 'Kottayam General Hospital',
    today_total: 38,
    diarrhea_cases: 17,
    typhoid_cases: 9,
    cholera_cases: 4,
    fever_cases: 8,
    growth_rate_pct: 26.7,
    moving_avg_7d: 22.6,
    outbreak_threshold_level: 'ALERT',
    capacity_utilization_pct: 85.0,
    beds_available: 78,
    total_beds: 520,
    occupied_beds: 442,
    doctors_on_duty: 24,
    medicine_stock_pct: 62.0,
    capacity_risk_score: 7.0,
    hospital_score_stars: 2,
    is_imputed: false,
    historical_trend: [
      { date: '2025-05-29', cases: 12 },
      { date: '2025-05-30', cases: 14 },
      { date: '2025-05-31', cases: 18 },
      { date: '2025-06-01', cases: 21 },
      { date: '2025-06-02', cases: 25 },
      { date: '2025-06-03', cases: 30 },
      { date: '2025-06-04', cases: 38 },
    ]
  };
}


// ─── Loading Overlay ────────────────────────────────────────────────────────
function showLoading(show) {
  const el = document.getElementById('loading-overlay');
  if (!el) return;
  if (show) {
    el.classList.remove('hidden');
  } else {
    el.classList.add('hidden');
  }
}


// ─── Toast Notifications ────────────────────────────────────────────────────
function showToast(message, type = 'success') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.className = 'toast show' + (type === 'error' ? ' error' : '');
  setTimeout(() => {
    toast.className = 'toast';
  }, 3000);
}
