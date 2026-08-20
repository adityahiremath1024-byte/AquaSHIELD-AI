/**
 * AquaShield AI — Central Run-Scoped Session Manager
 * Enforces a single unified session object (`aquashield_run`) in localStorage across Modules 1–7.
 */

window.AquaShieldSession = (function () {
  'use strict';

  const STORAGE_KEY = 'aquashield_run';

  /**
   * Get active run session or null if no run exists.
   */
  function getRun() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.error('AquaShieldSession: Error reading session', e);
      return null;
    }
  }

  /**
   * Start a brand new assessment run, purging prior module results.
   */
  function startNewRun(initialVillage, initialLat, initialLon) {
    const runId = 'RUN-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
    const newRun = {
      run_id: runId,
      status: 'IN_PROGRESS',
      created_at: new Date().toISOString(),
      location: {
        village_name: initialVillage || '',
        latitude: initialLat !== undefined && initialLat !== null ? initialLat : '',
        longitude: initialLon !== undefined && initialLon !== null ? initialLon : '',
        start_date: '',
        end_date: ''
      },
      modules: {}
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newRun));
    } catch (e) {
      console.error('AquaShieldSession: Error saving new run', e);
    }
    return newRun;
  }

  /**
   * Get active assessment parameters (location, coordinates, date range).
   */
  function getAssessmentParams() {
    const run = getRun();
    let legacy = {};
    try {
      legacy = JSON.parse(localStorage.getItem('aquashield_session') || '{}');
    } catch {}

    const loc = (run && run.location) ? run.location : {};
    return {
      village_name: loc.village_name || legacy.city || legacy.village || '',
      latitude: loc.latitude !== undefined && loc.latitude !== '' ? loc.latitude : (legacy.lat || legacy.latitude || ''),
      longitude: loc.longitude !== undefined && loc.longitude !== '' ? loc.longitude : (legacy.lon || legacy.longitude || ''),
      start_date: loc.start_date || legacy.start_date || '',
      end_date: loc.end_date || legacy.end_date || ''
    };
  }

  /**
   * Update active assessment parameters across all modules.
   */
  function setAssessmentParams(params) {
    if (!params) return;
    let run = getRun();
    if (!run) {
      run = startNewRun(params.village_name || params.city || params.village, params.latitude || params.lat, params.longitude || params.lon);
    }
    run.location = run.location || {};
    if (params.village_name || params.city || params.village) {
      run.location.village_name = params.village_name || params.city || params.village;
    }
    if ((params.latitude ?? params.lat) !== undefined && (params.latitude ?? params.lat) !== '') {
      run.location.latitude = parseFloat(params.latitude ?? params.lat);
    }
    if ((params.longitude ?? params.lon) !== undefined && (params.longitude ?? params.lon) !== '') {
      run.location.longitude = parseFloat(params.longitude ?? params.lon);
    }
    if (params.start_date) run.location.start_date = params.start_date;
    if (params.end_date) run.location.end_date = params.end_date;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(run));
      // Sync legacy storage
      const legacy = {
        city: run.location.village_name,
        village: run.location.village_name,
        lat: run.location.latitude,
        latitude: run.location.latitude,
        lon: run.location.longitude,
        longitude: run.location.longitude,
        start_date: run.location.start_date,
        end_date: run.location.end_date
      };
      localStorage.setItem('aquashield_session', JSON.stringify(legacy));
    } catch (e) {
      console.error('AquaShieldSession: Error updating assessment params', e);
    }
  }

  /**
   * Completely reset the current run (clear all residue).
   */
  function resetRun() {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem('aquashield_session');
    } catch (e) {
      console.error('AquaShieldSession: Error clearing session', e);
    }
  }

  /**
   * Save a module's computed result & inputs into the active run.
   */
  function saveModuleResult(moduleId, inputData, resultData) {
    let run = getRun();
    if (!run) {
      run = startNewRun(
        inputData ? inputData.village_name || inputData.villageName : null,
        inputData ? inputData.latitude || inputData.lat : null,
        inputData ? inputData.longitude || inputData.lon : null
      );
    }
    run.modules[moduleId] = {
      status: 'COMPLETED',
      completed_at: new Date().toISOString(),
      input: inputData,
      result: resultData
    };
    // Update global location if updated
    if (inputData && (inputData.village_name || inputData.villageName)) {
      run.location.village_name = inputData.village_name || inputData.villageName;
    }
    if (inputData && (inputData.latitude || inputData.lat) !== undefined) {
      run.location.latitude = parseFloat(inputData.latitude || inputData.lat);
    }
    if (inputData && (inputData.longitude || inputData.lon) !== undefined) {
      run.location.longitude = parseFloat(inputData.longitude || inputData.lon);
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(run));
    } catch (e) {
      console.error('AquaShieldSession: Error saving module result', e);
    }
    return run;
  }

  /**
   * Get a specific module's completed result from active run.
   */
  function getModuleResult(moduleId) {
    const run = getRun();
    if (!run || !run.modules || !run.modules[moduleId]) {
      return null;
    }
    return run.modules[moduleId];
  }

  /**
   * Helper to collect all inputs & outputs across Modules 1–5 for Module 6 Prediction Engine.
   */
  function getAccumulatedVectorForPrediction() {
    const run = getRun();
    if (!run) return null;

    const m1 = getModuleResult('module1_weather');
    const m2 = getModuleResult('module2_satellite');
    const m3 = getModuleResult('module3_hospital');
    const m4 = getModuleResult('module4_citizen');

    // Build prediction request payload from real prior module results
    const loc = run.location || {};
    
    // M1 Weather defaults/values
    const rainfall_mm = m1?.result?.precipitation?.past7_mm ?? m1?.result?.precipitation?.past30_mm ?? 182.0;
    const temp_c = m1?.result?.heatIndex?.temperature_c ?? 29.5;
    const humidity_pct = m1?.result?.heatIndex?.humidity_pct ?? 91.0;

    // M2 Satellite defaults/values
    const flood_pct_increase = m2?.result?.flood_pct_increase ?? m2?.result?.surface_water_pct ?? 34.0;

    // M3 Hospital defaults/values
    const hospital_cases_7d = m3?.result?.summary?.total_cases ?? 120;
    const case_surge_pct = m3?.result?.summary?.growth_rate_pct ?? 47.0;

    // M4 Citizen defaults/values
    const citizen_reports_count = m4?.result?.total_reports ?? 18;
    const water_stagnation_index = m4?.result?.average_risk_score ?? 76.2;

    return {
      village_name: loc.village_name || 'Kuttanad, Kerala',
      latitude: loc.latitude || 9.3500,
      longitude: loc.longitude || 76.4300,
      rainfall_mm: rainfall_mm,
      temperature_c: temp_c,
      humidity_pct: humidity_pct,
      flood_pct_increase: flood_pct_increase,
      hospital_cases_7d: hospital_cases_7d,
      case_surge_pct: case_surge_pct,
      citizen_reports_count: citizen_reports_count,
      water_stagnation_index: water_stagnation_index
    };
  }

  return {
    getRun: getRun,
    startNewRun: startNewRun,
    resetRun: resetRun,
    getAssessmentParams: getAssessmentParams,
    setAssessmentParams: setAssessmentParams,
    saveModuleResult: saveModuleResult,
    getModuleResult: getModuleResult,
    getAccumulatedVectorForPrediction: getAccumulatedVectorForPrediction
  };
})();
