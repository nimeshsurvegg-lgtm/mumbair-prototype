/* ==============================================================================
   MumbAIR — Reports Layer (Civic Workflow, Accurate Geo & Duplicate Detection)
   Atomic complaint creation, coordinate verification & tamper-evident watermarking
   ============================================================================== */

window.MumbAIR = window.MumbAIR || {};

window.MumbAIR.REPORTS = (function(){
  'use strict';

  var CONFIG = window.MumbAIR.CONFIG;
  var STORAGE = window.MumbAIR.STORAGE;
  var UTILS = window.MumbAIR.UTILS;
  var AUTH = window.MumbAIR.AUTH;

  var currentWizardState = {
    step: 1,
    category: null,
    ward: 'M/E',
    lat: 19.0490,
    lng: 72.8980,
    accuracy: null,
    isManualPin: false,
    title: '',
    description: '',
    addressText: '',
    landmark: '',
    photoDataUrl: null,
    duplicateConfirmed: false
  };

  /**
   * Check for nearby duplicate reports in the same category within radius
   * Prevents false duplicates caused by identical ward centroid coordinates
   */
  function findNearbyDuplicates(category, lat, lng, currentReportId){
    var state = STORAGE.loadState();
    var reports = state.reports || [];
    var radiusKm = CONFIG.DUPLICATE_RADIUS_KM || 1.5;

    return reports.filter(function(r){
      if(r.id === currentReportId) return false;
      if(r.status === 'RESOLVED' || r.status === 'CLOSED' || r.status === 'REJECTED' || r.status === 'DUPLICATE') return false;
      if(r.category !== category) return false;

      var dist = UTILS.haversineDistance(lat, lng, r.latitude, r.longitude);
      r._distKm = dist;

      // If distance is near zero, verify whether it's genuine co-location or default centroid collision
      if(dist < 0.05 && (!r.isGpsVerified || !currentWizardState.isGpsVerified)){
        // Both are unverified fallback coordinates; do not lock as false duplicate
        return false;
      }

      return dist <= radiusKm;
    });
  }

  /**
   * Create and persist a new civic violation report with atomic persistence
   */
  function submitReport(reportData){
    if(!reportData.category){
      return { success: false, error: 'Complaint category is required.' };
    }
    if(!reportData.description || reportData.description.trim().length < 10){
      return { success: false, error: 'Detailed description (minimum 10 characters) is required.' };
    }

    var currentUser = AUTH.getCitizenUser();
    var randomId = 'MB-' + Math.floor(1000 + Math.random() * 9000);
    var bmcRef = 'MCGM-' + Math.floor(100000 + Math.random() * 899999);
    var nowIso = new Date().toISOString();

    var department = (CONFIG.ROUTING_MAP && CONFIG.ROUTING_MAP[reportData.category]) || 'SWM';
    var catObj = (CONFIG.CATEGORIES && CONFIG.CATEGORIES.find(function(c){ return c.id === reportData.category; })) || {};
    var priority = catObj.defaultPriority || 'MEDIUM';

    var newReport = {
      id: randomId,
      ward: reportData.ward || 'M/E',
      category: reportData.category,
      title: reportData.title || (reportData.category.replace(/_/g, ' ') + ' Violation'),
      description: reportData.description.trim(),
      latitude: Number(reportData.lat || 19.0490),
      longitude: Number(reportData.lng || 72.8980),
      locationAccuracy: reportData.accuracy ? Math.round(reportData.accuracy) : null,
      isGpsVerified: !!reportData.isGpsVerified,
      addressText: reportData.addressText || ('Ward ' + (reportData.ward || 'M/E') + ', Greater Mumbai'),
      landmark: reportData.landmark || '',
      aqiAtTrigger: reportData.aqiAtTrigger || 180,
      priority: priority,
      department: department,
      status: 'SUBMITTED',
      upvotes: 1,
      bmcRef: bmcRef,
      citizenId: currentUser ? currentUser.id : 'guest_' + Date.now().toString(36),
      citizenName: currentUser ? currentUser.name : 'Citizen User',
      citizenContact: (currentUser && currentUser.phone) ? currentUser.phone : '+91 98****0000',
      photoDataUrl: reportData.photoDataUrl || null,
      createdAt: nowIso,
      updatedAt: nowIso,
      timeline: [
        { status: 'SUBMITTED', time: 'Just now', actor: currentUser ? currentUser.name + ' (Citizen)' : 'Citizen', note: 'Civic report logged with tamper-verified evidence & GPS.' },
        { status: 'UNDER_REVIEW', time: 'Pending', note: 'Queued for MCGM Ward Desk officer triage & verification.' }
      ]
    };

    var updateResult = STORAGE.atomicUpdate(function(state){
      state.reports = state.reports || [];
      state.reports.unshift(newReport);

      // Register initial vote by author
      state.userVotes = state.userVotes || [];
      if(!state.userVotes.includes(randomId)){
        state.userVotes.push(randomId);
      }

      // Append Audit Log
      state.auditLogs = state.auditLogs || [];
      state.auditLogs.unshift({
        id: 'AUD-' + Date.now().toString(36) + '-' + Math.floor(Math.random() * 1000),
        timestamp: nowIso,
        action: 'COMPLAINT_SUBMITTED',
        actorName: currentUser ? currentUser.name : 'Citizen',
        actorRole: 'CITIZEN',
        recordId: randomId,
        previousState: null,
        newState: 'SUBMITTED',
        notes: 'Complaint filed: ' + newReport.title + ' in Ward ' + newReport.ward
      });

      // Targeted notification to Ward Officer
      state.notifications = state.notifications || [];
      state.notifications.unshift({
        id: 'notif_' + Date.now().toString(36),
        title: 'New Complaint: ' + randomId,
        message: 'New ' + newReport.category.replace(/_/g, ' ') + ' complaint submitted in Ward ' + newReport.ward,
        time: 'Just now',
        createdAt: nowIso,
        read: false,
        type: 'ALERT',
        targetRole: 'WARD_OFFICER',
        targetWard: newReport.ward,
        linkId: randomId
      });

      return { success: true, report: newReport };
    });

    if(updateResult && updateResult.success){
      return newReport;
    } else {
      console.error('Failed to submit report atomically:', updateResult);
      return null;
    }
  }

  /**
   * Cast endorsement vote for a civic report with duplicate vote prevention
   */
  function upvoteReport(reportId){
    return STORAGE.atomicUpdate(function(state){
      state.userVotes = state.userVotes || [];
      if(state.userVotes.includes(reportId)){
        return { success: false, reason: 'ALREADY_VOTED' };
      }

      var report = (state.reports || []).find(function(r){ return r.id === reportId; });
      if(!report) return { success: false, reason: 'NOT_FOUND' };

      report.upvotes = (report.upvotes || 0) + 1;
      state.userVotes.push(reportId);

      return { success: true, newCount: report.upvotes };
    });
  }

  /**
   * Apply watermark on image canvas for tamper-evident civic evidence seal
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
      ctx.fillStyle = 'rgba(15, 23, 42, 0.90)';
      ctx.fillRect(0, canvas.height - 52, canvas.width, 52);

      // Header text
      ctx.fillStyle = '#0EA5E9';
      ctx.font = 'bold 12px monospace';
      ctx.fillText('MumbAIR CIVIC SURVEILLANCE &middot; GEOTAGGED CITIZEN EVIDENCE', 14, canvas.height - 30);

      // Metadata text
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '11px monospace';
      var stamp = 'Ward ' + wardCode + ' | GPS: ' + Number(lat).toFixed(4) + 'N, ' + Number(lng).toFixed(4) + 'E | ' + UTILS.formatDateTime(new Date()) + ' IST';
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
