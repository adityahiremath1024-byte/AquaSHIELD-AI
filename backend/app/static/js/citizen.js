/**
 * AquaShield AI — Module 4: Citizen Water Quality Reports JS
 * Integrated with FastAPI + SQLAlchemy backend for live database persistence
 */

(function () {
  'use strict';

  // Global variables tracking state
  let reports = [];
  let clusters = [];
  let stats = {
    total_reports: 0,
    total_clusters: 0,
    avg_risk_score: 74.2
  };
  let photoDataUrl = null;

  // 1. HAVERSINE DISTANCE COMPUTATION
  function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Earth radius in meters
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  // 2. FETCH DASHBOARD DATA FROM BACKEND API
  async function fetchDashboardData() {
    try {
      const res = await fetch('/api/citizen/summary');
      if (!res.ok) throw new Error("Failed to load summary");
      const data = await res.json();
      
      // Map API database schema models to frontend variables
      reports = data.reports.map(r => ({
        id: `REP-${String(r.id).padStart(3, '0')}`,
        reporter: r.reporter_name,
        timestamp: new Date(r.timestamp).toLocaleString('en-IN', {
          day: '2-digit', month: 'short', year: 'numeric',
          hour: '2-digit', minute: '2-digit',
          hour12: false
        }) + ' IST',
        latitude: r.latitude,
        longitude: r.longitude,
        condition: r.condition,
        silt: r.silt_pct,
        algae: r.algae_pct,
        sludge: r.sludge_pct,
        laplacian: r.laplacian_variance,
        rWater: r.r_water_score,
        status: r.status,
        reason: r.reason || "Water contamination accepted",
        reliability: r.reliability,
        reliabilityText: r.reliability === 'badge-trusted' ? 'Trusted ★★★' : (r.reliability === 'badge-spam' ? 'Spam-Flagged' : 'New'),
        photo: r.photo_url
      }));

      clusters = data.clusters;
      
      stats = {
        total_reports: data.total_reports,
        total_clusters: data.total_clusters,
        avg_risk_score: data.avg_risk_score
      };

      updateDashboardUI();
    } catch (err) {
      console.error("Error fetching citizen reports data from backend:", err);
    }
  }

  // 3. DATA RENDERERS
  function renderMetrics() {
    const totalReportsEl = document.getElementById('val-total-reports');
    if (totalReportsEl) {
      totalReportsEl.textContent = stats.total_reports;
    }

    const totalClustersEl = document.getElementById('val-total-clusters');
    if (totalClustersEl) {
      totalClustersEl.textContent = stats.total_clusters;
    }

    const avgRiskEl = document.getElementById('val-avg-risk');
    if (avgRiskEl) {
      avgRiskEl.textContent = stats.avg_risk_score.toFixed(1);
    }
  }

  function renderClustersTable() {
    const tbody = document.getElementById('clusters-table-body');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (clusters.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" class="text-center" style="color: var(--text-dimmed); padding: 20px;">No spatial clusters active.</td></tr>`;
      return;
    }

    clusters.forEach(c => {
      const tr = document.createElement('tr');
      const count = c.reports_count;
      const isHighRisk = c.risk_level === 'HIGH RISK';
      const riskClass = isHighRisk ? 'badge-critical' : 'badge-watch';
      const dotColorClass = isHighRisk ? 'bg-red-dot' : 'bg-orange-dot';

      tr.innerHTML = `
        <td><span class="cluster-dot ${dotColorClass}"></span>${c.cluster_id}</td>
        <td>${c.latitude.toFixed(4)}, ${c.longitude.toFixed(4)}</td>
        <td>${count}</td>
        <td><span class="badge ${riskClass}" style="font-size: 0.65rem; padding: 2px 8px;">${c.risk_level}</span></td>
      `;
      tbody.appendChild(tr);
    });
  }

  function renderReportsFeed() {
    const feed = document.getElementById('reports-feed');
    if (!feed) return;

    feed.innerHTML = '';

    reports.forEach(r => {
      const card = document.createElement('div');
      card.className = `glass-card report-feed-card ${r.status === 'REJECTED' ? 'border-red' : ''}`;

      const overlayClass = r.status === 'ACCEPTED' ? 'bg-accept-tag' : 'bg-reject-tag';
      const statusLabel = r.status === 'ACCEPTED' ? 'ACCEPTED' : 'REJECTED';

      card.innerHTML = `
        <div class="feed-header">
          <div class="feed-reporter-info">
            <span class="feed-reporter-name">${r.reporter}</span>
            <span class="feed-timestamp">${r.timestamp}</span>
          </div>
          <span class="feed-reliability-badge ${r.reliability}">${r.reliabilityText}</span>
        </div>

        <div class="feed-content-grid">
          <div class="feed-photo-wrapper">
            <img src="${r.photo}" alt="Report photo" />
            <div class="validation-overlay-badge ${overlayClass}">${statusLabel}</div>
          </div>

          <div class="feed-parameters">
            <div class="param-grid">
              <div class="param-item">
                <span class="param-label">Silt Ratio</span>
                <span class="param-value">${r.silt.toFixed(1)}%</span>
              </div>
              <div class="param-item">
                <span class="param-label">Algae Ratio</span>
                <span class="param-value">${r.algae.toFixed(1)}%</span>
              </div>
              <div class="param-item">
                <span class="param-label">Sludge Ratio</span>
                <span class="param-value">${r.sludge.toFixed(1)}%</span>
              </div>
              <div class="param-item">
                <span class="param-label">Laplacian Var</span>
                <span class="param-value">${r.laplacian.toFixed(0)}</span>
              </div>
            </div>

            <div class="feed-footer">
              <span class="feed-coordinates">${r.latitude.toFixed(4)}, ${r.longitude.toFixed(4)}</span>
              <div class="risk-badge-wrapper">
                <span class="badge-score-prefix">Score</span>
                <span class="badge ${r.status === 'REJECTED' ? 'badge-critical' : 'badge-normal'}" style="font-size: 0.65rem; padding: 2px 8px;">
                  ${r.rWater.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      `;

      feed.appendChild(card);
    });
  }

  // 4. FILE UPLOAD & DRAG DROP EVENT HANDLERS
  function setupUploadZone() {
    const zone = document.getElementById('upload-zone');
    const fileInput = document.getElementById('file-input');
    const previewContainer = document.getElementById('preview-container');
    const previewImg = document.getElementById('image-preview');
    const btnRemove = document.getElementById('btn-remove-photo');

    if (!zone || !fileInput) return;

    zone.addEventListener('click', (e) => {
      if (e.target !== btnRemove) {
        fileInput.click();
      }
    });

    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      zone.classList.add('dragover');
    });

    zone.addEventListener('dragleave', () => {
      zone.classList.remove('dragover');
    });

    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('dragover');
      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFile(files[0]);
      }
    });

    fileInput.addEventListener('change', () => {
      if (fileInput.files.length > 0) {
        handleFile(fileInput.files[0]);
      }
    });

    btnRemove.addEventListener('click', (e) => {
      e.stopPropagation();
      resetPhotoInput();
    });

    function handleFile(file) {
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        photoDataUrl = event.target.result;
        previewImg.src = photoDataUrl;
        previewContainer.classList.remove('hidden');
      };
      reader.readAsDataURL(file);
    }

    function resetPhotoInput() {
      photoDataUrl = null;
      fileInput.value = '';
      previewImg.src = '#';
      previewContainer.classList.add('hidden');
    }
  }

  // 5. FORM SUBMISSION API BINDING
  function setupFormSubmission() {
    const btnSubmit = document.getElementById('btn-submit-report');
    if (!btnSubmit) return;

    btnSubmit.addEventListener('click', async () => {
      const reporter = document.getElementById('input-reporter').value.trim();
      const latRaw = document.getElementById('input-lat').value.trim();
      const lonRaw = document.getElementById('input-lon').value.trim();
      const condition = document.getElementById('select-condition').value;

      if (!reporter) {
        alert("Please enter reporter name.");
        return;
      }
      if (!latRaw || !lonRaw) {
        alert("Please specify coordinates.");
        return;
      }

      const latitude = parseFloat(latRaw);
      const longitude = parseFloat(lonRaw);

      if (isNaN(latitude) || isNaN(longitude)) {
        alert("Invalid coordinate numbers.");
        return;
      }

      // Construct request payload
      const payload = {
        reporter_name: reporter,
        latitude: latitude,
        longitude: longitude,
        condition: condition || "clean",
        photo_url: photoDataUrl
      };

      try {
        const res = await fetch('/api/citizen/reports', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });

        if (!res.ok) {
          const errDetail = await res.json();
          throw new Error(errDetail.detail || "Failed to submit report");
        }

        // Clear input fields on success
        document.getElementById('input-reporter').value = '';
        document.getElementById('input-lat').value = '';
        document.getElementById('input-lon').value = '';
        document.getElementById('select-condition').selectedIndex = 0;
        
        const removePhotoBtn = document.getElementById('btn-remove-photo');
        if (removePhotoBtn) removePhotoBtn.click();

        // Refresh dashboard from backend database
        await fetchDashboardData();

      } catch (err) {
        alert("Submission error: " + err.message);
      }
    });
  }

  function updateDashboardUI() {
    renderMetrics();
    renderClustersTable();
    renderReportsFeed();
  }

  // 6. INITIALIZE PAGE
  async function init() {
    if (window.AquaShield) {
      if (typeof window.AquaShield.renderSidebar === 'function') {
        window.AquaShield.renderSidebar('/citizen.html');
      }
      if (typeof window.AquaShield.renderHeader === 'function') {
        window.AquaShield.renderHeader({
          title: 'Citizen Reports Engine',
          subtitle: 'Computer Vision Water Verification & Spatial Clustering',
          stepCurrent: '4',
          stepTotal: '7',
          alertCount: 12
        });
      }
    }

    // Hide loader
    const loader = document.getElementById('loading-overlay');
    if (loader) {
      setTimeout(() => {
        loader.classList.add('hidden');
      }, 500);
    }

    setupUploadZone();
    setupFormSubmission();
    
    // Initial fetch from backend database
    await fetchDashboardData();
  }

  // Run on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
