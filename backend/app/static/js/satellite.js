/**
 * AquaShield AI — Module 2: Satellite Flood Inundation Engine Controller
 * Redesigned client-side logic to match screenshots and blueprint.
 */

(function () {
  'use strict';

  // Coordinate mapping for village quick selections
  const VILLAGE_COORDS = {
    'Kuttanad, Kerala':  { lat: 9.3500, lon: 76.4300 },
    'Alappuzha, Kerala': { lat: 9.4981, lon: 76.3388 },
    'Kottayam, Kerala':  { lat: 9.5916, lon: 76.5221 }
  };

  // State registry
  let scenesList = [];
  let selectedBaselineId = null;
  let selectedFloodId = null;

  function loadSession() {
    try {
      return JSON.parse(localStorage.getItem('aquashield_session') || '{}');
    } catch { return {}; }
  }

  function saveSession(partial) {
    const session = { ...loadSession(), ...partial };
    localStorage.setItem('aquashield_session', JSON.stringify(session));
  }

  function showLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.classList.remove('hidden');
  }

  function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.classList.add('hidden');
  }

  // Helper to calculate days elapsed from target date
  function calculateAgeInDays(dateStr) {
    try {
      const acquired = new Date(dateStr);
      const target = new Date("2026-08-08"); // Current project date context
      const diffTime = Math.abs(target - acquired);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays;
    } catch {
      return 35; // Default fallback
    }
  }

  // Render 12 Skeleton/Placeholder Cards
  function renderSkeletons(message = 'Awaiting search...') {
    const container = document.getElementById('scenes-grid-container');
    if (!container) return;

    container.innerHTML = '';
    for (let i = 0; i < 12; i++) {
      const card = document.createElement('div');
      card.className = 'scene-card skeleton-card';
      card.innerHTML = `
        <div class="scene-thumbnail-wrapper skeleton-wrapper">
          <div class="skeleton-image">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="opacity: 0.3;">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <span class="skeleton-msg">${message}</span>
          </div>
        </div>
        <div class="scene-details skeleton-details">
          <div class="skeleton-line short"></div>
          <div class="skeleton-line"></div>
          <div class="skeleton-line medium"></div>
        </div>
      `;
      container.appendChild(card);
    }
  }

  // Render Search Error Message
  function showError(msg) {
    const statusPanel = document.getElementById('scenes-status-panel');
    if (statusPanel) {
      statusPanel.style.display = 'block';
      statusPanel.style.borderColor = 'rgba(255, 75, 75, 0.3)';
      statusPanel.style.background = 'rgba(255, 75, 75, 0.02)';
      
      const title = document.getElementById('status-title');
      const desc = document.getElementById('status-desc');
      if (title) {
        title.textContent = "Unable to retrieve satellite imagery";
        title.style.color = "var(--accent-red, #ff4b4b)";
      }
      if (desc) {
        desc.innerHTML = `
          ${msg}<br/><br/>
          Please verify:<br/>
          • Location / Coordinates<br/>
          • Date range (start date &le; end date)<br/>
          • Planet API key configuration in backend .env<br/><br/>
          <button id="status-retry-btn" class="search-btn" style="display: inline-flex; margin-top: 10px; padding: 6px 16px; font-size: 0.75rem; border-radius: 4px; background: rgba(255,255,255,0.05); color: #fff; cursor: pointer;">Retry Search</button>
        `;
        
        // Add retry listener
        const retryBtn = document.getElementById('status-retry-btn');
        if (retryBtn) {
          retryBtn.addEventListener('click', performSearch);
        }
      }
    }
  }

  // ─── Search Planet Satellite Scenes ───────────────────────────────────────
  async function performSearch() {
    showLoading();
    
    // Show Searching state in Status Panel
    const statusPanel = document.getElementById('scenes-status-panel');
    if (statusPanel) {
      statusPanel.style.display = 'block';
      statusPanel.style.borderColor = 'rgba(0, 242, 254, 0.3)';
      statusPanel.style.background = 'rgba(0, 242, 254, 0.01)';
      
      const title = document.getElementById('status-title');
      const desc = document.getElementById('status-desc');
      if (title) {
        title.textContent = "Searching satellite data...";
        title.style.color = "var(--accent-cyan, #00f2fe)";
      }
      if (desc) {
        desc.textContent = "Connecting to Planet Scope API and fetching high-resolution scenes...";
      }
    }

    renderSkeletons("Fetching satellite imagery...");

    const village = document.getElementById('input-village').value;
    const lat = parseFloat(document.getElementById('input-lat').value);
    const lon = parseFloat(document.getElementById('input-lon').value);
    const radius = parseFloat(document.getElementById('input-radius').value);
    const startDate = document.getElementById('input-start-date').value.trim();
    const endDate = document.getElementById('input-end-date').value.trim();

    // Input Validation
    if (isNaN(lat) || lat < -90 || lat > 90) {
      showError("Latitude must be a valid number between -90 and 90.");
      hideLoading();
      return;
    }
    if (isNaN(lon) || lon < -180 || lon > 180) {
      showError("Longitude must be a valid number between -180 and 180.");
      hideLoading();
      return;
    }

    // Convert date format from DD-MM-YYYY to YYYY-MM-DD for API call if needed
    let formattedStartDate = startDate;
    let formattedEndDate = endDate;
    
    const datePartsStart = startDate.split('-');
    if (datePartsStart.length === 3 && datePartsStart[2].length === 4) {
      formattedStartDate = `${datePartsStart[2]}-${datePartsStart[1]}-${datePartsStart[0]}`;
    }
    const datePartsEnd = endDate.split('-');
    if (datePartsEnd.length === 3 && datePartsEnd[2].length === 4) {
      formattedEndDate = `${datePartsEnd[2]}-${datePartsEnd[1]}-${datePartsEnd[0]}`;
    }

    try {
      const res = await fetch('/api/module2/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location_name: village,
          latitude: lat,
          longitude: lon,
          start_date: formattedStartDate,
          end_date: formattedEndDate
        })
      });

      if (!res.ok) {
        const errDetail = await res.json();
        throw new Error(errDetail.detail || "Search request failed");
      }

      const data = await res.json();
      updateUIWithResults(data);

    } catch (err) {
      console.error("Search failed:", err);
      showError(err.message || "An unexpected error occurred during search.");
    } finally {
      hideLoading();
    }
  }

  // ─── Update UI with Results Payload ───────────────────────────────────────
  function updateUIWithResults(data) {
    // Hide status panel
    const statusPanel = document.getElementById('scenes-status-panel');
    if (statusPanel) statusPanel.style.display = 'none';

    // Update scenes count
    document.getElementById('scenes-count').textContent = data.count;

    // Render scenes grid
    scenesList = data.results;
    renderScenesGrid();

    // Update Active Assessment Parameters
    document.getElementById('active-location').textContent = data.search.location_name;
    document.getElementById('active-latitude').textContent = data.search.latitude.toFixed(4);
    document.getElementById('active-longitude').textContent = data.search.longitude.toFixed(4);
    document.getElementById('active-start-date').textContent = data.search.start_date;
    document.getElementById('active-end-date').textContent = data.search.end_date;

    selectedBaselineId = data.baseline.id;
    selectedFloodId = data.post_flood.id;

    // Update Side-by-Side Comparison Panel Images & Values
    const imgBaseline = document.getElementById('img-baseline');
    if (imgBaseline) imgBaseline.src = data.results[0].image_url;
    const overlayBasePct = document.getElementById('overlay-baseline-pct');
    if (overlayBasePct) overlayBasePct.textContent = data.baseline.water_percentage.toFixed(1) + '%';
    const infoBaseArea = document.getElementById('info-baseline-area');
    if (infoBaseArea) infoBaseArea.textContent = `${data.baseline.flooded_area_sq_km.toFixed(1)} sq km`;

    const imgPostflood = document.getElementById('img-postflood');
    if (imgPostflood) imgPostflood.src = data.results[data.results.length - 1].ndwi_url;
    const overlayPostPct = document.getElementById('overlay-postflood-pct');
    if (overlayPostPct) overlayPostPct.textContent = data.post_flood.water_percentage.toFixed(1) + '%';
    const infoPostArea = document.getElementById('info-postflood-area');
    if (infoPostArea) infoPostArea.textContent = `${data.post_flood.flooded_area_sq_km.toFixed(1)} sq km`;

    // Render Matrix Values
    document.getElementById('matrix-before-val').textContent = data.baseline.water_percentage.toFixed(1) + '%';
    document.getElementById('matrix-before-area').textContent = `~${data.baseline.flooded_area_sq_km.toFixed(1)} sq km`;

    document.getElementById('matrix-after-val').textContent = data.post_flood.water_percentage.toFixed(1) + '%';
    document.getElementById('matrix-after-area').textContent = `~${data.post_flood.flooded_area_sq_km.toFixed(1)} sq km`;

    const sign = data.comparison.water_expansion_percentage >= 0 ? '+' : '';
    document.getElementById('matrix-expansion-val').textContent = `${sign}${data.comparison.water_expansion_percentage.toFixed(1)}%`;

    const badge = document.getElementById('matrix-severity-badge');
    if (badge) {
      badge.textContent = `${data.comparison.severity} RISK 🟢`;
      badge.className = `badge badge-${data.comparison.severity.toLowerCase().replace(' ', '-')}`;
      badge.style.display = 'inline-block';
    }

    document.getElementById('matrix-severity-desc').innerHTML = `
      Surface water expanded by ${sign}${data.comparison.water_expansion_percentage.toFixed(1)}% 
      (Baseline: ${data.baseline.water_percentage.toFixed(1)}% &rarr; Post-Flood: ${data.post_flood.water_percentage.toFixed(1)}%), 
      expanding power ${sign}${data.comparison.expanded_inundation_area_sq_km.toFixed(1)} sq km (Severity: ${data.comparison.severity}).
    `;

    // Update Quality Control Gate
    const latestScene = data.results[data.results.length - 1];
    const cloudPassed = latestScene.cloud_cover <= 0.20;
    const resPassed = latestScene.gsd <= 5.0;
    const ageDays = calculateAgeInDays(latestScene.acquired);
    const agePassed = ageDays <= 90;

    document.getElementById('gate-cloud').innerHTML = `
      <span class="gate-metric-label">Cloud Cover Limit (&le;20%)</span>
      <span class="gate-metric-value">${(latestScene.cloud_cover * 100).toFixed(1)}% avg 
        <span class="badge ${cloudPassed ? 'badge-pass' : 'badge-fail'}">${cloudPassed ? 'PASSED 🟢' : 'FAILED 🔴'}</span>
      </span>
    `;

    document.getElementById('gate-resolution').innerHTML = `
      <span class="gate-metric-label">Spatial Resolution (&le;5m)</span>
      <span class="gate-metric-value">${latestScene.gsd.toFixed(1)}m GSD 
        <span class="badge ${resPassed ? 'badge-pass' : 'badge-fail'}">${resPassed ? 'PASSED 🟢' : 'FAILED 🔴'}</span>
      </span>
    `;

    document.getElementById('gate-recency').innerHTML = `
      <span class="gate-metric-label">Imagery Recency (&le;90 days)</span>
      <span class="gate-metric-value">${ageDays}d newest 
        <span class="badge ${agePassed ? 'badge-pass' : 'badge-fail'}">${agePassed ? 'PASSED 🟢' : 'FAILED 🔴'}</span>
      </span>
    `;

    document.getElementById('gate-confidence-val').textContent = latestScene.detection_confidence.toFixed(1) + '%';

    const warningBox = document.getElementById('gate-warning');
    if (warningBox) {
      if (!cloudPassed || !resPassed || !agePassed) {
        warningBox.style.display = 'block';
      } else {
        warningBox.style.display = 'none';
      }
    }

    // Update Assessment Summary Table
    document.getElementById('summary-base-val').textContent = data.baseline.water_percentage.toFixed(1) + '%';
    document.getElementById('summary-base-detail').textContent = `${data.baseline.flooded_area_sq_km.toFixed(1)} sq km`;
    
    document.getElementById('summary-post-val').textContent = data.post_flood.water_percentage.toFixed(1) + '%';
    document.getElementById('summary-post-detail').textContent = `${data.post_flood.flooded_area_sq_km.toFixed(1)} sq km`;
    
    document.getElementById('summary-expansion-val').textContent = `${sign}${data.comparison.water_expansion_percentage.toFixed(1)}%`;
    document.getElementById('summary-expansion-detail').textContent = data.comparison.water_expansion_percentage >= 50.0 ? 'Critical increase' : 'Moderate increase';

    document.getElementById('summary-severity-val').innerHTML = `<span class="badge badge-${data.comparison.severity.toLowerCase().replace(' ', '-')}">${data.comparison.severity}</span>`;
    document.getElementById('summary-severity-detail').textContent = 'Epidemic alert threshold evaluation';

    document.getElementById('summary-confidence-val').textContent = latestScene.detection_confidence.toFixed(1) + '%';
    document.getElementById('summary-confidence-detail').textContent = `Cloud: ${(latestScene.cloud_cover * 100).toFixed(0)}% · GSD: ${latestScene.gsd.toFixed(1)}m/pixel`;

    // Save to localStorage session state
    saveSession({
      village:             data.search.location_name,
      latitude:            data.search.latitude,
      longitude:           data.search.longitude,
      start_date:          data.search.start_date,
      end_date:            data.search.end_date,
      flood_water_pct:     data.post_flood.water_percentage,
      flood_increase_pct:  data.comparison.water_expansion_percentage,
      flood_baseline_pct:  data.baseline.water_percentage,
      flood_severity:      data.comparison.severity,
      stagnant_pockets:    data.disease_vector.standing_water_detected ? 12 : 3,
    });
  }

  // ─── Render Satellite Scenes Grid ──────────────────────────────────────────
  function renderScenesGrid() {
    const container = document.getElementById('scenes-grid-container');
    if (!container) return;

    container.innerHTML = '';
    scenesList.forEach((scene) => {
      const sceneId = scene.id || scene.image_id;
      const dateObj = new Date(scene.acquired || scene.acquisition_date);
      const dateDisplay = isNaN(dateObj.getTime())
        ? 'Aug 8, 2025'
        : dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const cloudPct = (scene.cloud_cover_percent !== undefined
        ? scene.cloud_cover_percent
        : ((scene.cloud_cover || 0) * 100)).toFixed(1);
      const gsdVal = (scene.ground_resolution_m !== undefined
        ? scene.ground_resolution_m
        : (scene.gsd || 3.0)).toFixed(1);
      const thumbUrl = scene.thumbnail_url || `/api/satellite/thumbnail/${sceneId}`;

      const card = document.createElement('div');
      card.className = 'scene-card';
      card.id = `card-${sceneId}`;

      card.innerHTML = `
        <div class="scene-thumbnail-wrapper" id="wrapper-${sceneId}">
          <img class="scene-thumbnail loaded" id="thumb-${sceneId}"
               src="${thumbUrl}" alt="Satellite scene ${dateDisplay}"
               loading="lazy" decoding="async" />
          <img class="scene-mask-overlay" id="mask-${sceneId}"
               src="" alt="NDWI water mask" aria-hidden="true" />
          <span class="ndwi-label-badge">● NDWI MASK ON</span>
        </div>
        <div class="scene-details">
          <div class="scene-id-row">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
              <polyline points="13 2 13 9 20 9"/>
            </svg>
            <span title="${sceneId}">${sceneId.length > 28 ? sceneId.substring(0, 28) + '…' : sceneId}</span>
          </div>
          <div class="scene-meta-row">
            <div class="meta-col">
              <span class="meta-label">Acquired</span>
              <span class="meta-val">${dateDisplay}</span>
            </div>
            <div class="meta-col">
              <span class="meta-label">Cloud</span>
              <span class="meta-val">${cloudPct}%</span>
            </div>
            <div class="meta-col">
              <span class="meta-label">GSD</span>
              <span class="meta-val">${gsdVal}m</span>
            </div>
          </div>
          <div class="scene-actions">
            <button class="btn-run-ndwi" id="btn-run-${sceneId}">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
              RUN NDWI ANALYSIS
            </button>
            <button class="btn-toggle-mask" id="btn-mask-${sceneId}" disabled title="Run NDWI analysis first">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              TOGGLE MASK
            </button>
          </div>
          <div class="results-container" id="results-${sceneId}"></div>
        </div>
      `;

      container.appendChild(card);

      const runBtn   = card.querySelector(`#btn-run-${sceneId}`);
      const maskBtn  = card.querySelector(`#btn-mask-${sceneId}`);
      const maskImg  = card.querySelector(`#mask-${sceneId}`);
      const wrapper  = card.querySelector(`#wrapper-${sceneId}`);

      // RUN NDWI ANALYSIS
      if (runBtn) {
        runBtn.addEventListener('click', async () => {
          runBtn.disabled = true;
          runBtn.textContent = '⏳ Analyzing…';
          selectedFloodId = sceneId;

          await triggerAnalysis(sceneId, 'flood');

          // Set mask src only after the backend has cached it
          maskImg.src = `/api/satellite/ndwi/mask/${sceneId}?t=${Date.now()}`;

          // Enable toggle once mask image loads successfully
          maskImg.onload = () => {
            if (maskBtn) {
              maskBtn.disabled = false;
              maskBtn.title = '';
            }
          };

          runBtn.disabled = false;
          runBtn.innerHTML = `
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            RE-RUN NDWI
          `;
          runBtn.classList.add('active');

          await updateComparisonMatrix();
        });
      }

      // TOGGLE MASK (on/off)
      if (maskBtn) {
        maskBtn.addEventListener('click', () => {
          const isActive = maskImg.classList.toggle('active');
          wrapper.classList.toggle('mask-active', isActive);
          maskBtn.classList.toggle('active', isActive);
          maskBtn.title = isActive ? 'Click to hide NDWI mask' : 'Click to show NDWI mask';
        });
      }
    });
  }

  // ─── Trigger NDWI analysis on a specific scene ────────────────────────────
  async function triggerAnalysis(imageId, role = 'flood') {
    const card = document.getElementById(`card-${imageId}`);
    const resultsContainer = document.getElementById(`results-${imageId}`);
    if (!resultsContainer) return;

    try {
      const res = await fetch(`/api/satellite/ndwi/analyze?image_id=${imageId}`);
      if (!res.ok) throw new Error("NDWI Analysis endpoint error");
      const data = await res.json();

      // Highlight active analyzed card
      document.querySelectorAll('.btn-run-ndwi').forEach(b => b.classList.remove('active'));
      const activeBtn = document.getElementById(`btn-run-${imageId}`);
      if (activeBtn) activeBtn.classList.add('active');

      // Expand the nested results pane
      resultsContainer.innerHTML = `
        <div class="ndwi-results-panel">
          <div class="results-title">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="18 15 12 9 6 15"/></svg>
            NDWI Analysis Results
          </div>
          <div class="results-grid">
            <div class="res-item">
              <span class="res-label">Surface Water</span>
              <span class="res-val">${data.surface_water_pct.toFixed(2)}%</span>
            </div>
            <div class="res-item">
              <span class="res-label">Water Pixels</span>
              <span class="res-val">${(data.water_pixel_count || 0).toLocaleString()} / ${(data.total_pixels || 240000).toLocaleString()}</span>
            </div>
            <div class="res-item">
              <span class="res-label">Mean NDWI</span>
              <span class="res-val">${(data.mean_ndwi || 0).toFixed(4)}</span>
            </div>
            <div class="res-item">
              <span class="res-label">Flood Risk</span>
              <span class="res-val ${(data.flood_risk || 'LOW') === 'CRITICAL' || (data.flood_risk || 'LOW') === 'HIGH' ? 'text-red' : (data.flood_risk || 'LOW') === 'MODERATE' ? 'text-amber' : 'text-green'}">${data.flood_risk || 'MINIMAL'}</span>
            </div>
            <div class="res-item">
              <span class="res-label">Pipeline</span>
              <span class="res-val">${data.processing_pipeline || 'rgb_fallback'}</span>
            </div>
          </div>
        </div>
      `;

      // Update the Quality Control Gate if this is the active analyzed scene
      if (role === 'flood') {
        const cloudPassed = data.cloud_cover_pct <= 20.0;
        const resPassed = data.resolution_gsd_meters <= 5.0;
        const ageDays = calculateAgeInDays(data.image_date);
        const agePassed = ageDays <= 90;

        document.getElementById('gate-cloud').innerHTML = `
          <span class="gate-metric-label">Cloud Cover Limit (&le;20%)</span>
          <span class="gate-metric-value">${data.cloud_cover_pct.toFixed(1)}% avg 
            <span class="badge ${cloudPassed ? 'badge-pass' : 'badge-fail'}">${cloudPassed ? 'PASSED 🟢' : 'FAILED 🔴'}</span>
          </span>
        `;

        document.getElementById('gate-resolution').innerHTML = `
          <span class="gate-metric-label">Spatial Resolution (&le;5m)</span>
          <span class="gate-metric-value">${data.resolution_gsd_meters.toFixed(1)}m GSD 
            <span class="badge ${resPassed ? 'badge-pass' : 'badge-fail'}">${resPassed ? 'PASSED 🟢' : 'FAILED 🔴'}</span>
          </span>
        `;

        document.getElementById('gate-recency').innerHTML = `
          <span class="gate-metric-label">Imagery Recency (&le;90 days)</span>
          <span class="gate-metric-value">${ageDays}d newest 
            <span class="badge ${agePassed ? 'badge-pass' : 'badge-fail'}">${agePassed ? 'PASSED 🟢' : 'FAILED 🔴'}</span>
          </span>
        `;

        // Update confidence percentage
        const confVal = document.getElementById('gate-confidence-val');
        confVal.textContent = data.detection_confidence_pct.toFixed(1) + '%';

        // Toggle warning box
        const warningBox = document.getElementById('gate-warning');
        if (warningBox) {
          if (!cloudPassed || !resPassed || !agePassed) {
            warningBox.style.display = 'block';
          } else {
            warningBox.style.display = 'none';
          }
        }
      }

    } catch (e) {
      console.error("Analysis trigger failed:", e);
    }
  }

  // ─── Update comparative water matrix stats ─────────────────────────────
  async function updateComparisonMatrix() {
    if (!selectedBaselineId || !selectedFloodId) return;

    try {
      const lat = parseFloat(document.getElementById('input-lat').value);
      const lon = parseFloat(document.getElementById('input-lon').value);
      const radius = parseFloat(document.getElementById('input-radius').value);

      const res = await fetch(`/api/satellite/ndwi/compare?baseline_image_id=${selectedBaselineId}&flood_image_id=${selectedFloodId}&radius_km=${radius}`);
      if (!res.ok) throw new Error("Compare API error");
      const data = await res.json();

      // Update Side-by-Side Comparison Panel Images & Values
      const imgBaseline = document.getElementById('img-baseline');
      if (imgBaseline) imgBaseline.src = `/api/satellite/thumbnail/${selectedBaselineId}?lat=${lat}&lon=${lon}`;
      
      const imgPostflood = document.getElementById('img-postflood');
      if (imgPostflood) imgPostflood.src = `/api/satellite/ndwi/mask/${selectedFloodId}`;

      const overlayBasePct = document.getElementById('overlay-baseline-pct');
      if (overlayBasePct) overlayBasePct.textContent = data.baseline_water_pct.toFixed(1) + '%';

      const overlayPostPct = document.getElementById('overlay-postflood-pct');
      if (overlayPostPct) overlayPostPct.textContent = data.flood_water_pct.toFixed(1) + '%';

      const baseArea = (data.baseline_water_pct / 100 * Math.PI * (radius ** 2)).toFixed(1);
      const postArea = (data.flood_water_pct / 100 * Math.PI * (radius ** 2)).toFixed(1);

      const infoBaseArea = document.getElementById('info-baseline-area');
      if (infoBaseArea) infoBaseArea.textContent = `${baseArea} sq km`;

      const infoPostArea = document.getElementById('info-postflood-area');
      if (infoPostArea) infoPostArea.textContent = `${postArea} sq km`;

      // Render Matrix Values
      document.getElementById('matrix-before-val').textContent = data.baseline_water_pct.toFixed(1) + '%';
      document.getElementById('matrix-before-area').textContent = `~${baseArea} sq km`;

      document.getElementById('matrix-after-val').textContent = data.flood_water_pct.toFixed(1) + '%';
      document.getElementById('matrix-after-area').textContent = `~${postArea} sq km`;

      const sign = data.water_expansion_rate_pct >= 0 ? '+' : '';
      document.getElementById('matrix-expansion-val').textContent = `${sign}${data.water_expansion_rate_pct.toFixed(1)}%`;

      const badge = document.getElementById('matrix-severity-badge');
      if (badge) {
        badge.textContent = `${data.severity_level} RISK 🟢`;
        badge.className = `badge badge-${data.severity_level.toLowerCase().replace(' ', '-')}`;
      }

      document.getElementById('matrix-severity-desc').innerHTML = `
        Surface water expanded by ${sign}${data.water_expansion_rate_pct.toFixed(1)}% 
        (Before: ${data.baseline_water_pct.toFixed(1)}% &rarr; After: ${data.flood_water_pct.toFixed(1)}%), 
        expanding power ${sign}${data.expanded_area_sq_km.toFixed(1)} sq km (${data.severity_description}).
      `;

      // Save to AquaShieldSession
      if (window.AquaShieldSession) {
        const lat = parseFloat(document.getElementById('input-lat').value) || 9.4981;
        const lon = parseFloat(document.getElementById('input-lon').value) || 76.3388;
        const village = document.getElementById('input-village').value || 'Kuttanad, Kerala';

        window.AquaShieldSession.saveModuleResult('module2_satellite', {
          village_name: village,
          latitude: lat,
          longitude: lon,
          selected_baseline_id: selectedBaselineId,
          selected_flood_id: selectedFloodId
        }, {
          surface_water_pct: data.flood_water_pct,
          flood_water_pct: data.flood_water_pct,
          water_expansion_rate_pct: data.water_expansion_rate_pct,
          flood_pct_increase: data.water_expansion_rate_pct,
          baseline_water_pct: data.baseline_water_pct,
          severity_level: data.severity_level,
          stagnant_water_pockets: data.stagnant_water_pockets,
          expanded_area_sq_km: data.expanded_area_sq_km,
          severity_description: data.severity_description
        });
      }

      // Also save to legacy storage if needed
      saveSession({
        flood_water_pct:     data.flood_water_pct,
        flood_increase_pct:  data.water_expansion_rate_pct,
        flood_baseline_pct:  data.baseline_water_pct,
        flood_severity:      data.severity_level,
        stagnant_pockets:    data.stagnant_water_pockets,
      });

    } catch (e) {
      console.error("Comparison matrix sync error:", e);
    }
  }

  // ─── Input Selection listeners ──────────────────────────────────────────
  function onVillageChange() {
    const dropdown = document.getElementById('input-village');
    const coords = VILLAGE_COORDS[dropdown.value];
    if (coords) {
      document.getElementById('input-lat').value = coords.lat.toFixed(4);
      document.getElementById('input-lon').value = coords.lon.toFixed(4);
    }
  }

  window.addEventListener('DOMContentLoaded', () => {
    if (window.AquaShield) {
      window.AquaShield.renderSidebar('/satellite.html');
      window.AquaShield.renderHeader({
        title:       'Satellite Flood Inundation Analysis',
        subtitle:    'PlanetScope 3m Resolution Assessment',
        stepCurrent: '2',
        stepTotal:   '7',
      });
    }

    // Bind Search Action
    const searchBtn = document.getElementById('search-btn');
    if (searchBtn) {
      searchBtn.addEventListener('click', performSearch);
    }

    // Bind quick selection
    const dropdown = document.getElementById('input-village');
    if (dropdown) {
      dropdown.addEventListener('change', onVillageChange);
    }

    // Load initial values from session if present
    const session = loadSession();
    if (session.village) {
      if (dropdown) dropdown.value = session.village;
      document.getElementById('input-lat').value = session.latitude || '';
      document.getElementById('input-lon').value = session.longitude || '';
      document.getElementById('input-start-date').value = session.start_date || '';
      document.getElementById('input-end-date').value = session.end_date || '';
    }

    // Initially render empty skeletons
    renderSkeletons("Awaiting search...");
  });

})();



