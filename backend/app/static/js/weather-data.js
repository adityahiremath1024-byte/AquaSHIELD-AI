/**
 * AquaShield AI — Module 1: Meteorological Intelligence Mock Data
 * Reference: Module_1.pdf "Current Assessment Result" (Kuttanad, Kerala)
 * & aquashield_ui_ux_blueprint.md Screen 2 specifications
 */

window.MOCK_WEATHER_DATA = {
  input: {
    villageName: 'Kuttanad, Kerala, India',
    latitude: 9.3500,
    longitude: 76.4300,
    startDate: '2025-05-28',
    endDate: '2025-06-04'
  },
  assessment: {
    bacteriaGrowthIndex: 64.0,
    riskLevel: 'HIGH',
    riskLevelLabel: 'High Risk',
    riskStars: 4,
    generatedAt: '04 Jun 2025 14:37:21 IST',
    protocol: 'Pre-chlorinate public drinking water and alert medical teams immediately.'
  },
  precipitation: {
    past7_mm: 20.1,
    previous7_mm: 12.6,
    past15_mm: 36.0,
    past30_mm: 196.9,
    seasonalNormal_mm: 113.0,
    trendPct: 59.5,
    trendDirection: 'Increasing',
    anomaly7d: '+38.2%',
    anomaly15d: '+41.7%',
    anomaly30d: '+67.3%',
    anomalyPct: 74.2,
    anomalyStatus: 'Above Normal',
    consecutiveRainyDays: 3,
    streakStatus: 'Ongoing',
    daily: [
      15.2, 12.8, 18.5, 8.3, 22.1, 14.6, 0.5, 11.2, 16.4, 9.7,
      5.8, 13.1, 0.2, 7.3, 5.2, 3.3, 2.1, 0.4, 3.8, 1.2,
      0.0, 2.5, 2.6, 0.0, 4.5, 3.2, 0.8, 0.0, 0.0, 11.6
    ]
  },
  heatIndex: {
    temperature_c: 26.3,
    humidity_pct: 90,
    vaporPressure_hpa: 30.73,
    heatIndex_c: 37.8,
    formula: 'e = 6.11 × 10^(7.5×26.3 / (237.7+26.3)) × 90/100 = 30.73 hPa\nHI = 26.3 + 0.5555 × (30.73 − 10.0) = 37.8°C'
  },
  scoreMatrix: [
    { variable: 'Temperature', rawValue: '26.3°C', condition: '25°C < T ≤ 30°C', score: 70, weightPct: '30%', weight: 0.30, contribution: 21.0, color: '#f59e0b' },
    { variable: 'Relative Humidity', rawValue: '90%', condition: 'H > 85%', score: 100, weightPct: '15%', weight: 0.15, contribution: 15.0, color: '#3b82f6' },
    { variable: 'Heat Index', rawValue: '37.8°C', condition: '30°C < HI ≤ 38°C', score: 80, weightPct: '10%', weight: 0.10, contribution: 8.0, color: '#ef4444' },
    { variable: 'Past 30-Day Rain', rawValue: '196.9 mm', condition: '100 < R₃₀ ≤ 200 mm', score: 60, weightPct: '20%', weight: 0.20, contribution: 12.0, color: '#00f2fe' },
    { variable: 'Flood Surface Area (NDWI)', rawValue: 'Estimated', condition: '196.9 mm rainfall band', score: 40, weightPct: '15%', weight: 0.15, contribution: 6.0, color: '#a855f7' },
    { variable: 'Consecutive Rain Streak', rawValue: '1 day', condition: '1 day continuous', score: 20, weightPct: '10%', weight: 0.10, contribution: 2.0, color: '#10b981' }
  ],
  riskTiers: [
    { range: '0%–30%', level: 'LOW', badgeClass: 'badge-low', protocol: 'Routine water monitoring' },
    { range: '31%–60%', level: 'MODERATE', badgeClass: 'badge-moderate', protocol: 'Test PHC water samples' },
    { range: '61%–80%', level: 'HIGH', badgeClass: 'badge-high', protocol: 'Pre-chlorinate public drinking water & alert medical teams' },
    { range: '81%–100%', level: 'CRITICAL', badgeClass: 'badge-critical', protocol: 'Issue emergency boil-water advisory' }
  ]
};
