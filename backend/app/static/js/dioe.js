/**
 * AquaShield AI — Module 7: Decision Intelligence & Intervention Optimisation Engine (DIOE) JS
 * Client-side rendering, animated counters, backend integration & accordion logic.
 * Ref: Module_7.pdf & aquashield_ui_ux_blueprint.md Section 3 (Screen 8)
 */

(function () {
  'use strict';

  // 1. MOCK DATA OBJECT — Fallback matching Module_7.pdf
  const MOCK_DIOE_DATA = {
    location: {
      villageName: 'Kuttanad, Kerala',
      latitude: 9.3500,
      longitude: 76.4300,
      population: 16240,
    },
    prediction: {
      riskScore: 84.0,
      riskLevel: 'CRITICAL',
      diseaseType: 'Cholera / Acute Diarrhea',
      confidencePct: 91.0,
      horizonDays: 5,
      attackRate: 0.08,
    },
    hospitalStock: {
      totalBeds: 100,
      occupiedBeds: 85,
      doctorsOnDuty: 5,
      orsStockPackets: 4200,
      chlorineStockTablets: 8500,
    },
    interventions: [
      { rank: 1, action: 'Water Chlorination & Well Sealing', target: 'Neutralize waterborne bacterial vector across 24 high-risk well clusters', efficacy: -18.0 },
      { rank: 2, action: 'Mobile Medical Camp & Triage Unit', target: 'Deploy emergency triage tent & 12 additional medical officers', efficacy: -10.0 },
      { rank: 3, action: 'Mass ORS & Zinc Distribution', target: 'Distribute 9,093 ORS packets to vulnerable households', efficacy: -5.0 },
      { rank: 4, action: 'ASHA Worker Door-to-Door Survey', target: 'Early symptomatic case detection within 200m spatial clusters', efficacy: -4.0 },
    ],
    timeline: [
      {
        bracket: '0–6h',
        stage: 'IMMEDIATE RESPONSE',
        priority: 'CRITICAL',
        priorityClass: 'critical',
        tasks: [
          'Close contaminated public wells & seal source points',
          'Initiate shock chlorination in high-risk zones',
          'Issue urgent boil-water advisory via local channels',
          'Mobilize PHC emergency triage ward'
        ]
      },
      {
        bracket: '6–12h',
        stage: 'EARLY INTERVENTION',
        priority: 'CRITICAL',
        priorityClass: 'critical',
        tasks: [
          'Procure 6,500 missing chlorine tablets',
          'Dispatch 4,893 ORS packets from district warehouse',
          'Establish emergency water tanker stations',
          'Deploy first wave of 12 medical officers'
        ]
      },
      {
        bracket: '12–24h',
        stage: 'CONTAINMENT',
        priority: 'HIGH',
        priorityClass: 'high',
        tasks: [
          'Set up Mobile Medical Camp at central hub',
          'Commence mass distribution of ORS & Zinc kits',
          'Isolate severe cholera cases at District Hospital',
          'Inspect secondary water storage tanks'
        ]
      },
      {
        bracket: '24–48h',
        stage: 'STABILISATION',
        priority: 'HIGH',
        priorityClass: 'high',
        tasks: [
          'Launch ASHA door-to-door symptom mapping survey',
          'Conduct follow-up water quality sample testing',
          'Monitor bed occupancy rate (<85% target)',
          'Audit emergency supply replenishment'
        ]
      },
      {
        bracket: '3–7d',
        stage: 'SUSTAIN & PREPARE',
        priority: 'MODERATE',
        priorityClass: 'moderate',
        tasks: [
          'Perform 7-day epidemiological trend review',
          'Transition triage camp to routine PHC monitoring',
          'Subsidize household water purification filters',
          'Submit outbreak containment report to State'
        ]
      }
    ],
    narrative: [
      {
        title: '1. Executive Situation & Patient Load Forecast',
        content: 'The outbreak model forecasts an initial risk score of 84.0% for Kuttanad, Kerala. Under the standard WHO epidemiological attack rate (8.0%), an estimated 1,299 patients will require medical intervention over the 5-day forecast horizon.',
        type: 'text'
      },
      {
        title: '2. Resource Bottleneck Analysis (Shortages & Gaps)',
        content: 'Immediate supply chain gap analysis reveals critical shortages: a deficit of 12 doctors, 4,893 ORS packets, and 6,500 chlorine tablets. Emergency procurement must be initiated immediately.',
        type: 'text'
      },
      {
        title: '3. Intervention Optimization & Impact Simulation (84% → 47%)',
        content: 'By executing the 4-tier prioritized intervention plan (Water Chlorination -18%, Medical Camp -10%, ORS Distribution -5%, ASHA Survey -4%), the predicted disease risk drops from 84.0% to 47.0% (MODERATE CONTAINED status).',
        type: 'text'
      },
      {
        title: '4. Operational 24–48 Hour Execution Timeline',
        content: [
          '0–6h: Seal public wells and start shock chlorination',
          '6–12h: Procure missing chlorine tablets and ORS stock',
          '12–24h: Deploy Mobile Medical Unit and emergency staff',
          '24–48h: Door-to-door ASHA health survey & re-testing'
        ],
        type: 'list'
      }
    ]
  };

  // 2. Session Management
  function loadSessionData() {
    try {
      const stored = localStorage.getItem('aquashield_session');
      if (stored) {
        const session = JSON.parse(stored);
        if (session.prediction_raw_response?.risk_score) {
          MOCK_DIOE_DATA.prediction.riskScore = parseFloat(session.prediction_raw_response.risk_score);
        }
      }
    } catch (e) {
      console.warn("Session data parse error", e);
    }
  }

  // 3. Animated Value Counter (easeOutCubic)
  function animateValue(elementId, start, end, duration, prefix = '', suffix = '', decimals = 0) {
    const el = document.getElementById(elementId);
    if (!el) return;

    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentVal = start + (end - start) * easeProgress;

      const formatted = decimals > 0
        ? currentVal.toFixed(decimals)
        : Math.floor(currentVal).toLocaleString();

      el.textContent = prefix + formatted + suffix;

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        const finalFormatted = decimals > 0
          ? end.toFixed(decimals)
          : end.toLocaleString();
        el.textContent = prefix + finalFormatted + suffix;
      }
    };
    window.requestAnimationFrame(step);
  }

  // 4. Render Functions
  function renderInterventions() {
    const container = document.getElementById('intervention-list');
    if (!container) return;

    container.innerHTML = MOCK_DIOE_DATA.interventions.map(item => `
      <div class="intervention-card">
        <div class="rank-badge">${item.rank}</div>
        <div class="intervention-info">
          <span class="intervention-title">${item.action}</span>
          <span class="intervention-target">${item.target}</span>
        </div>
        <span class="efficacy-badge">${item.efficacy.toFixed(1)}%</span>
      </div>
    `).join('');
  }

  function renderTimeline() {
    const container = document.getElementById('timeline-grid');
    if (!container) return;

    const checkIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>`;
    const clockIcon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;

    container.innerHTML = MOCK_DIOE_DATA.timeline.map(col => `
      <div class="timeline-col">
        <div class="timeline-header">
          <span class="time-bracket-pill">${clockIcon} ${col.bracket}</span>
        </div>
        <span class="timeline-stage-title">${col.stage}</span>
        <ul class="timeline-checklist">
          ${col.tasks.map(t => `<li>${checkIcon} <span>${t}</span></li>`).join('')}
        </ul>
        <span class="priority-badge ${col.priorityClass}">PRIORITY: ${col.priority}</span>
      </div>
    `).join('');
  }

  function renderBriefingAccordion() {
    const container = document.getElementById('briefing-accordion');
    if (!container) return;

    const arrowIcon = `<svg class="briefing-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>`;

    container.innerHTML = MOCK_DIOE_DATA.narrative.map((item, idx) => {
      const isActive = idx === 0 ? 'active' : '';
      let contentHtml = '';
      if (item.type === 'text') {
        contentHtml = `<p class="briefing-text">${item.content}</p>`;
      } else if (item.type === 'list' && Array.isArray(item.content)) {
        contentHtml = `<ul class="briefing-list">${item.content.map(li => `<li>${li}</li>`).join('')}</ul>`;
      } else {
        contentHtml = `<p class="briefing-text">${item.content}</p>`;
      }

      return `
        <div class="briefing-item ${isActive}">
          <button class="briefing-trigger" aria-expanded="${idx === 0}">
            <span class="briefing-step-num">${idx + 1}</span>
            <span class="briefing-title-text">${item.title}</span>
            ${arrowIcon}
          </button>
          <div class="briefing-content">
            <div class="briefing-content-inner">
              ${contentHtml}
            </div>
          </div>
        </div>
      `;
    }).join('');

    // Attach click listeners for single-open accordion
    container.querySelectorAll('.briefing-trigger').forEach(trigger => {
      trigger.addEventListener('click', () => {
        const parent = trigger.closest('.briefing-item');
        const isActive = parent.classList.contains('active');

        // Close all items
        container.querySelectorAll('.briefing-item').forEach(item => {
          item.classList.remove('active');
          item.querySelector('.briefing-trigger').setAttribute('aria-expanded', 'false');
        });

        // Toggle clicked item
        if (!isActive) {
          parent.classList.add('active');
          trigger.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }

  function initCounters() {
    animateValue('sit-risk', 0, MOCK_DIOE_DATA.prediction.riskScore, 1400, '', '%', 0);

    const patients = Math.floor(MOCK_DIOE_DATA.location.population * MOCK_DIOE_DATA.prediction.attackRate);
    animateValue('res-patients', 0, patients, 1400);
    animateValue('res-ors', 0, 9093, 1400);
    animateValue('res-chlorine', 0, 15000, 1400);
    animateValue('res-doctors', 0, 17, 1400);

    animateValue('gap-doctors', 0, 12, 1400);
    animateValue('gap-ors', 0, 4893, 1400);
    animateValue('gap-chlorine', 0, 6500, 1400);

    animateValue('imp-initial', 0, MOCK_DIOE_DATA.prediction.riskScore, 1400, '', '%', 1);
    animateValue('imp-reduction', 0, -37.0, 1400, '', '%', 1);
    animateValue('imp-post', 0, 47.0, 1400, '', '%', 1);
  }

  // 5. Backend Integration Call
  async function fetchBackendData() {
    try {
      const payload = {
        village_name: MOCK_DIOE_DATA.location.villageName,
        latitude: MOCK_DIOE_DATA.location.latitude,
        longitude: MOCK_DIOE_DATA.location.longitude,
        risk_score: MOCK_DIOE_DATA.prediction.riskScore,
        risk_level: MOCK_DIOE_DATA.prediction.riskLevel,
        disease_type: MOCK_DIOE_DATA.prediction.diseaseType,
        confidence_pct: MOCK_DIOE_DATA.prediction.confidencePct,
        population: MOCK_DIOE_DATA.location.population,
        hospital: {
          total_beds: MOCK_DIOE_DATA.hospitalStock.totalBeds,
          occupied_beds: MOCK_DIOE_DATA.hospitalStock.occupiedBeds,
          doctors_on_duty: MOCK_DIOE_DATA.hospitalStock.doctorsOnDuty,
          ors_stock_packets: MOCK_DIOE_DATA.hospitalStock.orsStockPackets,
          chlorine_stock_tablets: MOCK_DIOE_DATA.hospitalStock.chlorineStockTablets
        }
      };

      const res = await fetch('/api/dioe/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      if (data.executive_narrative?.sections) {
        MOCK_DIOE_DATA.narrative = data.executive_narrative.sections;
        const badge = document.getElementById('narrative-source-badge');
        if (badge) {
          const isGemini = data.executive_narrative.source === 'gemini';
          badge.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
            ${isGemini ? 'Powered by Gemini 2.0 Flash' : 'Rule-Based Fallback Engine'}
          `;
        }
      }
    } catch (err) {
      console.warn('Backend DIOE connection warning. Using local engine.', err);
    }
  }

  function showLoading() {
    const el = document.getElementById('loading-overlay');
    if (el) el.style.display = 'flex';
  }

  function hideLoading() {
    const el = document.getElementById('loading-overlay');
    if (el) {
      el.classList.add('hidden');
      setTimeout(() => { el.style.display = 'none'; }, 500);
    }
  }

  // 6. DOMContentLoaded Init
  document.addEventListener('DOMContentLoaded', () => {
    if (window.AquaShield) {
      if (typeof window.AquaShield.renderSidebar === 'function') {
        window.AquaShield.renderSidebar('/dioe.html');
      }
      if (typeof window.AquaShield.renderHeader === 'function') {
        window.AquaShield.renderHeader({
          title: 'AI Decision Intelligence and Intervention Optimisation Engine',
          subtitle: 'Convert outbreak predictions into optimal, actionable interventions',
          stepCurrent: '7',
          stepTotal: '7'
        });
      }
    }

    showLoading();
    loadSessionData();

    renderInterventions();
    renderTimeline();

    fetchBackendData().then(() => {
      renderBriefingAccordion();
      setTimeout(() => {
        initCounters();
        hideLoading();
      }, 400);
    });
  });
})();
