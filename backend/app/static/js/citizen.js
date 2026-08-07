/**
 * AquaShield AI — Module 4: Citizen Water Quality Reports JS
 * Geotagged uploads, OpenCV-like validation simulation, and 200m Haversine Clustering.
 */

(function () {
  'use strict';

  // 1. INITIAL SEED DATA
  const MOCK_REPORTS = [
    {
      id: "REP-001",
      reporter: "Anjali Kurup",
      timestamp: "04 Jun 2025 14:12 IST",
      latitude: 12.9716,
      longitude: 77.5946,
      condition: "silt",
      silt: 18.4,
      algae: 6.2,
      sludge: 3.1,
      laplacian: 340, // Bonus +10
      rWater: 26.4,
      status: "ACCEPTED",
      reason: "Water contamination accepted",
      reliability: "badge-trusted",
      reliabilityText: "Trusted ★★★",
      photo: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='%231b223c'><rect width='100' height='100'/><path d='M10 80 Q 30 50, 50 80 T 90 80' fill='none' stroke='%23d97706' stroke-width='3'/><path d='M10 60 Q 30 40, 50 60 T 90 60' fill='none' stroke='%23059669' stroke-width='2'/></svg>"
    },
    {
      id: "REP-002",
      reporter: "Manu Joseph",
      timestamp: "04 Jun 2025 13:45 IST",
      latitude: 12.9720,
      longitude: 77.5950,
      condition: "algae",
      silt: 4.5,
      algae: 22.8,
      sludge: 1.2,
      laplacian: 180,
      rWater: 21.0,
      status: "ACCEPTED",
      reason: "Water contamination accepted",
      reliability: "badge-trusted",
      reliabilityText: "Trusted ★★★",
      photo: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='%231b223c'><rect width='100' height='100'/><circle cx='50' cy='50' r='25' fill='%23059669' opacity='0.7'/></svg>"
    },
    {
      id: "REP-003",
      reporter: "Devassy Thomas",
      timestamp: "04 Jun 2025 12:30 IST",
      latitude: 12.9710,
      longitude: 77.5940,
      condition: "sludge",
      silt: 2.1,
      algae: 3.4,
      sludge: 15.6,
      laplacian: 95,
      rWater: 20.1,
      status: "ACCEPTED",
      reason: "Water contamination accepted",
      reliability: "badge-new",
      reliabilityText: "New",
      photo: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='%231b223c'><rect width='100' height='100'/><rect x='25' y='25' width='50' height='50' fill='%23111827'/></svg>"
    },
    {
      id: "REP-004",
      reporter: "Ramesh K.",
      timestamp: "04 Jun 2025 11:15 IST",
      latitude: 12.9715,
      longitude: 77.5942,
      condition: "silt",
      silt: 12.0,
      algae: 5.0,
      sludge: 2.0,
      laplacian: 290,
      rWater: 23.6,
      status: "ACCEPTED",
      reason: "Water contamination accepted",
      reliability: "badge-trusted",
      reliabilityText: "Trusted ★★★",
      photo: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='%231b223c'><rect width='100' height='100'/><line x1='10' y1='80' x2='90' y2='20' stroke='%23d97706' stroke-width='4'/></svg>"
    },
    {
      id: "REP-005",
      reporter: "Sunitha Paul",
      timestamp: "04 Jun 2025 10:02 IST",
      latitude: 12.9621,
      longitude: 77.6058,
      condition: "silt",
      silt: 24.5,
      algae: 1.5,
      sludge: 8.2,
      laplacian: 410, // Bonus +10
      rWater: 31.2,
      status: "ACCEPTED",
      reason: "Water contamination accepted",
      reliability: "badge-trusted",
      reliabilityText: "Trusted ★★★",
      photo: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='%231b223c'><rect width='100' height='100'/><path d='M10 90 L90 10 M10 10 L90 90' stroke='%23d97706' stroke-width='3'/></svg>"
    },
    {
      id: "REP-006",
      reporter: "Unknown Uploader",
      timestamp: "04 Jun 2025 09:12 IST",
      latitude: 12.9810,
      longitude: 77.5812,
      condition: "clean",
      silt: 0.2,
      algae: 0.1,
      sludge: 0.5,
      laplacian: 42,
      rWater: 15.0,
      status: "REJECTED",
      reason: "Selfie rejected",
      reliability: "badge-spam",
      reliabilityText: "Spam-Flagged",
      photo: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='%231b223c'><rect width='100' height='100'/><circle cx='50' cy='35' r='15' fill='%23e0e0e0'/><path d='M20 80 Q 50 50, 80 80' fill='%23e0e0e0'/></svg>"
    }
  ];

  // Global variables tracking state
  let reports = [...MOCK_REPORTS];
  let photoDataUrl = null;

  // 2. HAVERSINE DISTANCE COMPUTATION
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

  // 3. CLUSTERING ENGINE
  function computeClusters() {
    const activeClusters = {};

    // Group only ACCEPTED reports
    const acceptedReports = reports.filter(r => r.status === "ACCEPTED");

    acceptedReports.forEach(report => {
      let grouped = false;

      // Check if this report belongs to any existing cluster
      for (const clusterId in activeClusters) {
        const cluster = activeClusters[clusterId];
        const distance = haversineDistance(
          report.latitude,
          report.longitude,
          cluster.latitude,
          cluster.longitude
        );

        if (distance <= 200.0) {
          cluster.reports.push(report);
          grouped = true;
          break;
        }
      }

      // Create new cluster if not grouped
      if (!grouped) {
        const clusterId = `C-${Math.floor(report.latitude * 1000)}-${Math.floor(report.longitude * 1000)}`;
        activeClusters[clusterId] = {
          id: clusterId,
          latitude: report.latitude,
          longitude: report.longitude,
          reports: [report]
        };
      }
    });

    return Object.values(activeClusters);
  }

  // 4. DATA RENDERERS
  function renderMetrics() {
    const accepted = reports.filter(r => r.status === "ACCEPTED");
    
    // Total reports count
    const totalReportsEl = document.getElementById('val-total-reports');
    if (totalReportsEl) {
      totalReportsEl.textContent = reports.length;
    }

    // High risk clusters count (nearby reports >= 3)
    const clusters = computeClusters();
    const highRiskCount = clusters.filter(c => c.reports.length >= 3).length;
    const totalClustersEl = document.getElementById('val-total-clusters');
    if (totalClustersEl) {
      totalClustersEl.textContent = highRiskCount;
    }

    // Average risk score
    const avgRiskEl = document.getElementById('val-avg-risk');
    if (avgRiskEl && accepted.length > 0) {
      const sum = accepted.reduce((acc, curr) => acc + curr.rWater, 0);
      avgRiskEl.textContent = (sum / accepted.length).toFixed(1);
    }
  }

  function renderClustersTable() {
    const tbody = document.getElementById('clusters-table-body');
    if (!tbody) return;

    tbody.innerHTML = '';
    const clusters = computeClusters();

    if (clusters.length === 0) {
      tbody.innerHTML = `<tr><td colspan="4" class="text-center" style="color: var(--text-dimmed); padding: 20px;">No spatial clusters active.</td></tr>`;
      return;
    }

    clusters.forEach(c => {
      const tr = document.createElement('tr');
      const count = c.reports.length;
      const isHighRisk = count >= 3;
      const riskClass = isHighRisk ? 'badge-critical' : 'badge-watch';
      const riskLabel = isHighRisk ? 'HIGH RISK' : 'MODERATE';
      const dotColorClass = isHighRisk ? 'bg-red-dot' : 'bg-orange-dot';

      tr.innerHTML = `
        <td><span class="cluster-dot ${dotColorClass}"></span>${c.id}</td>
        <td>${c.latitude.toFixed(4)}, ${c.longitude.toFixed(4)}</td>
        <td>${count}</td>
        <td><span class="badge ${riskClass}" style="font-size: 0.65rem; padding: 2px 8px;">${riskLabel}</span></td>
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
                <span class="param-value">${r.laplacian}</span>
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

  // 5. FILE UPLOAD & DRAG DROP EVENT HANDLERS
  function setupUploadZone() {
    const zone = document.getElementById('upload-zone');
    const fileInput = document.getElementById('file-input');
    const previewContainer = document.getElementById('preview-container');
    const previewImg = document.getElementById('image-preview');
    const btnRemove = document.getElementById('btn-remove-photo');

    if (!zone || !fileInput) return;

    zone.addEventListener('click', (e) => {
      // Trigger file selection if not clicking remove button
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

  // 6. FORM SUBMISSION
  function setupFormSubmission() {
    const btnSubmit = document.getElementById('btn-submit-report');
    if (!btnSubmit) return;

    btnSubmit.addEventListener('click', () => {
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

      // Simulate CV metrics calculation
      let silt = 0;
      let algae = 0;
      let sludge = 0;
      let laplacian = Math.floor(Math.random() * 200) + 60; // default range 60-260

      if (condition === 'silt') {
        silt = Math.random() * 15 + 15; // 15% - 30%
        algae = Math.random() * 5 + 2;
        sludge = Math.random() * 4 + 1;
        laplacian = Math.floor(Math.random() * 200) + 250; // High texture
      } else if (condition === 'algae') {
        silt = Math.random() * 4 + 1;
        algae = Math.random() * 20 + 10; // 10% - 30%
        sludge = Math.random() * 3 + 1;
        laplacian = Math.floor(Math.random() * 150) + 120;
      } else if (condition === 'sludge') {
        silt = Math.random() * 5 + 1;
        algae = Math.random() * 4 + 1;
        sludge = Math.random() * 15 + 8; // 8% - 23%
        laplacian = Math.floor(Math.random() * 100) + 80;
      } else if (condition === 'clean') {
        silt = Math.random() * 1.5;
        algae = Math.random() * 1.0;
        sludge = Math.random() * 1.0;
        laplacian = Math.floor(Math.random() * 50) + 40;
      }

      // Apply Validation Decision logic
      // REJECTED if (silt+algae+sludge) < 4.0% AND laplacian < 80.0
      const totalPixelsRatio = silt + algae + sludge;
      let status = "ACCEPTED";
      let reason = "Water contamination accepted";
      let rWater = 15.0;

      if (totalPixelsRatio < 4.0 && laplacian < 80.0) {
        status = "REJECTED";
        reason = "Selfie rejected";
        rWater = 15.0; // default minimum
      } else {
        // AI Contamination score calculation
        const bonus = laplacian > 300 ? 10.0 : 0.0;
        rWater = Math.min(100.0, Math.max(15.0, (silt * 0.55) + (algae * 0.25) + (sludge * 0.20) + bonus));
      }

      const now = new Date();
      const formattedTime = now.toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
        hour12: false
      }) + ' IST';

      const defaultPhoto = status === "ACCEPTED" 
        ? "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='%231b223c'><rect width='100' height='100'/><path d='M10 80 C30 60 70 90 90 70' stroke='%2300f2fe' fill='none' stroke-width='3'/></svg>"
        : "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' fill='%231b223c'><rect width='100' height='100'/><line x1='20' y1='20' x2='80' y2='80' stroke='%23ef4444' stroke-width='4'/></svg>";

      // Add to array prepend
      reports.unshift({
        id: `REP-0${reports.length + 1}`,
        reporter: reporter,
        timestamp: formattedTime,
        latitude: latitude,
        longitude: longitude,
        condition: condition || "clean",
        silt: silt,
        algae: algae,
        sludge: sludge,
        laplacian: laplacian,
        rWater: rWater,
        status: status,
        reason: reason,
        reliability: "badge-new",
        reliabilityText: "New",
        photo: photoDataUrl || defaultPhoto
      });

      // Clear input fields
      document.getElementById('input-reporter').value = '';
      document.getElementById('input-lat').value = '';
      document.getElementById('input-lon').value = '';
      document.getElementById('select-condition').selectedIndex = 0;
      
      const removePhotoBtn = document.getElementById('btn-remove-photo');
      if (removePhotoBtn) removePhotoBtn.click();

      // Trigger update
      updateDashboard();
    });
  }

  function updateDashboard() {
    renderMetrics();
    renderClustersTable();
    renderReportsFeed();
  }

  // 7. INITIALIZE PAGE
  function init() {
    if (window.AquaShield) {
      if (typeof window.AquaShield.renderSidebar === 'function') {
        window.AquaShield.renderSidebar('/citizen.html');
      }
      if (typeof window.AquaShield.renderHeader === 'function') {
        window.AquaShield.renderHeader({
          title: 'Citizen Reports Engine',
          subtitle: 'Module 4 — Computer Vision Water Verification & Spatial Clustering',
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
    updateDashboard();
  }

  // Run on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
