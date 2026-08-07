/**
 * AquaShield AI — Module 7: Decision Intelligence & Intervention Optimisation Engine (DIOE) JS
 * Client-side deterministic WHO mathematical calculations & UI renderer.
 * Ref: Module_7.pdf & aquashield_ui_ux_blueprint.md
 */

(function () {
  'use strict';

  // 1. MOCK DATA & DETERMINISTIC FORMULAS — matches Module_7.pdf
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
      { rank: 1, action: 'Water Chlorination & Well Sealing', target: 'Neutralize waterborne bacterial vector in flooded public wells', efficacy: 18.0 },
      { rank: 2, action: 'Mobile Medical Camp & Triage Unit', target: 'Deploy 12 additional doctors & emergency beds to Kuttanad PHC', efficacy: 10.0 },
      { rank: 3, action: 'Mass ORS & Zinc Distribution', target: 'Distribute 9,093 ORS packets to vulnerable households', efficacy: 5.0 },
      { rank: 4, action: 'ASHA Worker Door-to-Door Survey', target: 'Early detection of active diarrhea/fever cases within 200m cluster', efficacy: 4.0 },
    ],
    timeline: [
      { time: '0–6h', stage: 'IMMEDIATE RESPONSE', priority: 'CRITICAL', tasks: ['Activate rapid response team & seal contaminated public wells', 'Alert district health authorities & emergency management', 'Pre-position emergency ORS & chlorine reserves', 'Issue public boil-water advisory via local channels'] },
      { time: '6–12h', stage: 'EARLY INTERVENTION', priority: 'CRITICAL', tasks: ['Procure & deploy 6,500 missing chlorine tablets', 'Distribute 4,893 missing ORS packets to forward points', 'Begin water quality testing at 24 sampling stations', 'Start active case finding at Primary Health Centres'] },
      { time: '12–24h', stage: 'CONTAINMENT', priority: 'HIGH', tasks: ['Establish Mobile Medical Camp & deploy 12 emergency doctors', 'Intensify spatial cluster surveillance in high-risk zones', 'Ensure safe potable water supply via emergency tankers', 'Conduct community hygiene awareness drive'] },
      { time: '24–48h', stage: 'STABILISATION', priority: 'HIGH', tasks: ['Evaluate intervention impact & post-action risk reduction', 'Adjust medical resource allocation based on bed occupancy', 'Strengthen PHC healthcare capacity & triage units', 'Submit daily epidemiological surveillance report to State'] },
      { time: '3–7d', stage: 'SUSTAIN & PREPARE', priority: 'MODERATE', tasks: ['Maintain active surveillance sweep across 100% of village', 'Prevent secondary vector spread in receding flood zones', 'Replenish emergency ORS and antibiotic medicine stock', 'Prepare post-outbreak evaluation report'] },
    ],
    narrative: [
      { title: '1. Executive Situation & Patient Load Forecast', text: 'Target location Kuttanad, Kerala (Pop: 16,240) exhibits a CRITICAL outbreak risk score of 84.0% with a 5-day forecast horizon. Based on WHO epidemiological model equations (Attack Rate = 8.0%), the expected patient load is calculated at 1,299 individuals requiring clinical rehydration and monitoring.' },
      { title: '2. Resource Bottleneck Analysis (Shortages & Gaps)', text: 'Comparing WHO resource requirements against current hospital inventory reveals severe critical shortages: a gap of 12 medical doctors (17 required vs. 5 on duty), 4,893 ORS packets (9,093 required vs. 4,200 in stock), and 6,500 chlorine tablets (15,000 required vs. 8,500 in stock).' },
      { title: '3. Intervention Optimization & Impact Simulation (84% → 47%)', text: 'Executing the 4 prioritized interventions in order—Water Chlorination (-18%), Mobile Medical Camp (-10%), Mass ORS Distribution (-5%), and ASHA Worker Survey (-4%)—yields a cumulative risk reduction of -37.0%. This reduces projected outbreak risk from 84.0% (CRITICAL) down to 47.0% (MODERATE CONTAINED).' },
      { title: '4. Operational 24–48 Hour Execution Timeline', text: 'Immediate priority (0–6h) focuses on well chlorination and RRT activation, followed by emergency supply procurement (6–12h), mobile camp setup with 12 additional doctors (12–24h), and stabilization monitoring (24–48h) to contain transmission prior to peak incubation.' },
    ],
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
      console.warn("Session data could not be parsed.", e);
    }
  }

  function saveSessionData() {
    try {
      const session = JSON.parse(localStorage.getItem('aquashield_session') || '{}');
      session.dioe_results = {
        expectedPatients: Math.floor(MOCK_DIOE_DATA.location.population * MOCK_DIOE_DATA.prediction.attackRate),
        postActionRisk: 47.0,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('aquashield_session', JSON.stringify(session));
    } catch (e) {}
  }

  // 3. UI Animation and Render Functions
  function animateValue(element, start, end, duration, suffix = '', decimals = 0) {
    if (!element) return;
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 4);
      const currentVal = start + (end - start) * easeProgress;
      
      element.innerText = (decimals > 0 ? currentVal.toFixed(decimals) : Math.floor(currentVal).toLocaleString()) + suffix;
      
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        element.innerText = (decimals > 0 ? end.toFixed(decimals) : end.toLocaleString()) + suffix;
      }
    };
    window.requestAnimationFrame(step);
  }

  function initCounters() {
    const elRisk = document.getElementById('val-risk') || document.getElementById('initialRisk');
    const elPatients = document.getElementById('val-patients') || document.getElementById('patientCount');
    const elOrs = document.getElementById('val-ors') || document.getElementById('orsCount');
    const elChlorine = document.getElementById('val-chlorine') || document.getElementById('chlorineCount');
    const elDoctors = document.getElementById('val-doctors') || document.getElementById('doctorCount');
    
    const elInitialRisk = document.getElementById('val-initial-risk');
    const elReduction = document.getElementById('val-reduction') || document.getElementById('totalReduction');
    const elPostRisk = document.getElementById('val-post-risk') || document.getElementById('postRisk');

    const elGapDoctors = document.getElementById('val-gap-doctors') || document.getElementById('doctorGap');
    const elGapOrs = document.getElementById('val-gap-ors') || document.getElementById('orsGap');
    const elGapChlorine = document.getElementById('val-gap-chlorine') || document.getElementById('chlorineGap');

    if (elRisk) animateValue(elRisk, 0, MOCK_DIOE_DATA.prediction.riskScore, 1500, '%', 0);
    if (elPatients) animateValue(elPatients, 0, Math.floor(MOCK_DIOE_DATA.location.population * MOCK_DIOE_DATA.prediction.attackRate), 1500);
    if (elOrs) animateValue(elOrs, 0, 9093, 1500);
    if (elChlorine) animateValue(elChlorine, 0, 15000, 1500);
    if (elDoctors) animateValue(elDoctors, 0, 17, 1500);

    if (elGapDoctors) animateValue(elGapDoctors, 0, 12, 1500);
    if (elGapOrs) animateValue(elGapOrs, 0, 4893, 1500);
    if (elGapChlorine) animateValue(elGapChlorine, 0, 6500, 1500);

    if (elInitialRisk) animateValue(elInitialRisk, 0, MOCK_DIOE_DATA.prediction.riskScore, 1500, '%', 1);
    if (elReduction) animateValue(elReduction, 0, -37.0, 1500, '%', 1);
    if (elPostRisk) animateValue(elPostRisk, 0, 47.0, 1500, '%', 1);
  }

  function initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.glass-card').forEach(card => {
      observer.observe(card);
    });
  }

  const style = document.createElement('style');
  style.textContent = `.animate-in { opacity: 1 !important; transform: translateY(0) !important; }`;
  document.head.appendChild(style);

  function showLoading() {
    const overlay = document.getElementById('loading-overlay') || document.getElementById('loadingOverlay');
    if (overlay) overlay.style.display = 'flex';
  }

  function hideLoading() {
    const overlay = document.getElementById('loading-overlay') || document.getElementById('loadingOverlay');
    if (overlay) {
      overlay.classList.add('hidden');
      setTimeout(() => {
        overlay.style.display = 'none';
      }, 500);
    }
  }

  // 4. Initializer
  document.addEventListener('DOMContentLoaded', () => {
    // Load layout components
    if (window.AquaShield) {
      if (typeof window.AquaShield.renderSidebar === 'function') {
        window.AquaShield.renderSidebar('/dioe.html');
      }
      if (typeof window.AquaShield.renderHeader === 'function') {
        window.AquaShield.renderHeader({
          title: 'AI Decision Intelligence and Intervention Optimisation Engine',
          subtitle: 'Convert predictions into optimal, actionable interventions',
          stepCurrent: '7',
          stepTotal: '7'
        });
      }
    }

    showLoading();

    setTimeout(() => {
      loadSessionData();
      initCounters();
      initScrollAnimations();
      saveSessionData();
      hideLoading();
    }, 1000);
  });
})();
