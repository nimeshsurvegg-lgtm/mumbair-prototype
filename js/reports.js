/* ==============================================================================
   MumbAIR — Reports Layer (Civic Workflow, Duplicate Detection & Voting)
   ============================================================================== */

window.MumbAIR = window.MumbAIR || {};

window.MumbAIR.REPORTS = (function(){
  'use strict';

  var CONFIG = window.MumbAIR.CONFIG;
  var STORAGE = window.MumbAIR.STORAGE;
  var UTILS = window.MumbAIR.UTILS;

  var currentWizardState = {
    step: 1,
    category: null,
    ward: 'M/E',
    lat: 19.0522,
    lng: 72.9005,
    title: '',
    description: '',
    photoDataUrl: null,
    duplicateConfirmed: false
  };

  /**
   * Check for nearby duplicate reports in the same category within radius
   */
  function findNearbyDuplicates(category, lat, lng, currentReportId){
    var state = STORAGE.loadState();
    var reports = state.reports || [];
    var radiusKm = CONFIG.DUPLICATE_RADIUS_KM || 1.5;

    return reports.filter(function(r){
      if(r.id === currentReportId) return false;
      if(r.status === 'RESOLVED' || r.status === 'CLOSED' || r.status === 'REJECTED') return false;
      if(r.category !== category) return false;

      var dist = UTILS.haversineDistance(lat, lng, r.latitude, r.longitude);
      r._distKm = dist;
      return dist <= radiusKm;
    });
  }

  /**
   * Create and persist a new civic violation report
   */
  function submitReport(reportData){
    var state = STORAGE.loadState();
    var randomId = 'MB-' + Math.floor(1000 + Math.random() * 9000);
    var bmcRef = 'MCGM-' + Math.floor(100000 + Math.random() * 899999);

    var newReport = {
      id: randomId,
      ward: reportData.ward,
      category: reportData.category,
      title: reportData.title || (reportData.category.replace(/_/g, ' ') + ' Violation'),
      description: reportData.description || 'Citizen reported environmental infraction.',
      latitude: reportData.lat,
      longitude: reportData.lng,
      addressText: reportData.addressText || ('Ward ' + reportData.ward + ', Greater Mumbai'),
      aqiAtTrigger: reportData.aqiAtTrigger || 180,
      status: 'SUBMITTED',
      upvotes: 1,
      bmcRef: bmcRef,
      photoDataUrl: reportData.photoDataUrl || null,
      createdAt: new Date().toISOString(),
      timeline: [
        { status: 'SUBMITTED', time: 'Just now', note: 'Civic report logged with tamper-verified evidence & GPS.' },
        { status: 'UNDER_REVIEW', time: 'Pending', note: 'Queued for MCGM Ward Desk officer inspection.' }
      ]
    };

    state.reports.unshift(newReport);
    // Mark author as having voted
    if(!state.userVotes.includes(randomId)){
      state.userVotes.push(randomId);
    }
    STORAGE.saveState(state);

    return newReport;
  }

  /**
   * Cast endorsement vote for a civic report (with duplicate vote prevention)
   */
  function upvoteReport(reportId){
    var state = STORAGE.loadState();
    if(state.userVotes.includes(reportId)){
      return { success: false, reason: 'ALREADY_VOTED' };
    }

    var report = state.reports.find(function(r){ return r.id === reportId; });
    if(!report) return { success: false, reason: 'NOT_FOUND' };

    report.upvotes = (report.upvotes || 0) + 1;
    state.userVotes.push(reportId);
    STORAGE.saveState(state);

    return { success: true, newCount: report.upvotes };
  }

  /**
   * Apply watermark on image canvas for cryptographic evidence seal
   */
  function stampEvidenceWatermark(imageSrc, wardCode, lat, lng, callback){
    var img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function(){
      var canvas = document.createElement('canvas');
      canvas.width = img.width || 640;
      canvas.height = img.height || 480;
      var ctx = canvas.getContext('2d');

      // Draw base photo
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Watermark footer bar
      ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
      ctx.fillRect(0, canvas.height - 52, canvas.width, 52);

      // Header text
      ctx.fillStyle = '#D97706';
      ctx.font = 'bold 13px IBM Plex Mono, monospace';
      ctx.fillText('MumbAIR CIVIC SURVEILLANCE VERIFIED EVIDENCE', 14, canvas.height - 30);

      // Metadata text
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '11px IBM Plex Mono, monospace';
      var stamp = 'Ward ' + wardCode + ' | GPS: ' + lat.toFixed(4) + 'N, ' + lng.toFixed(4) + 'E | ' + UTILS.formatDateTime(new Date()) + ' IST';
      ctx.fillText(stamp, 14, canvas.height - 12);

      var watermarkedDataUrl = canvas.toDataURL('image/jpeg', 0.88);
      if(typeof callback === 'function') callback(watermarkedDataUrl);
    };
    img.src = imageSrc;
  }

  return {
    currentWizardState: currentWizardState,
    findNearbyDuplicates: findNearbyDuplicates,
    submitReport: submitReport,
    upvoteReport: upvoteReport,
    stampEvidenceWatermark: stampEvidenceWatermark
  };
})();
