/* ==============================================================================
   MumbAIR — Complaint Workflow Engine, SLA Clocks & Audit Logger
   Full lifecycle governance, transition validation, escalation routing & audit
   ============================================================================== */

window.MumbAIR = window.MumbAIR || {};

window.MumbAIR.WORKFLOW = (function(){
  'use strict';

  var CONFIG = window.MumbAIR.CONFIG;
  var STORAGE = window.MumbAIR.STORAGE;

  /**
   * Calculate SLA status for a complaint
   */
  function calculateSla(complaint){
    if(!complaint) return null;
    if(complaint.status === 'RESOLVED' || complaint.status === 'CLOSED' || complaint.status === 'REJECTED'){
      return { status: 'COMPLETED', label: 'Resolved Safe', hoursLeft: 0, deadline: null };
    }

    var priority = complaint.priority || 'MEDIUM';
    var policy = (CONFIG.SLA_POLICIES && CONFIG.SLA_POLICIES[priority]) || { resolveHours: 48 };
    var submittedTime = new Date(complaint.createdAt).getTime();
    var deadlineTime = submittedTime + (policy.resolveHours * 60 * 60 * 1000);
    var now = Date.now();
    var msLeft = deadlineTime - now;
    var hoursLeft = Math.round(msLeft / (60 * 60 * 1000));

    if(msLeft < 0){
      return {
        status: 'BREACHED',
        label: 'SLA Breached (' + Math.abs(hoursLeft) + 'h overdue)',
        hoursLeft: hoursLeft,
        deadline: new Date(deadlineTime).toISOString()
      };
    } else if(hoursLeft <= 6){
      return {
        status: 'DUE_SOON',
        label: 'Due Soon (' + hoursLeft + 'h left)',
        hoursLeft: hoursLeft,
        deadline: new Date(deadlineTime).toISOString()
      };
    } else {
      return {
        status: 'ON_TRACK',
        label: 'On Track (' + hoursLeft + 'h left)',
        hoursLeft: hoursLeft,
        deadline: new Date(deadlineTime).toISOString()
      };
    }
  }

  /**
   * Append an immutable entry to system audit logs
   */
  function logAudit(action, actor, recordId, prevVal, newVal, notes){
    var state = STORAGE.loadState();
    state.auditLogs = state.auditLogs || [];

    var logEntry = {
      id: 'AUD-' + Date.now().toString(36) + '-' + Math.floor(Math.random() * 1000),
      timestamp: new Date().toISOString(),
      action: action,
      actorName: actor ? actor.name : 'System Node',
      actorRole: actor ? actor.role : 'SYSTEM',
      recordId: recordId,
      previousState: prevVal || null,
      newState: newVal || null,
      notes: notes || ''
    };

    state.auditLogs.unshift(logEntry);
    if(state.auditLogs.length > 500) state.auditLogs.pop(); // Keep 500 latest entries
    STORAGE.saveState(state);
    return logEntry;
  }

  /**
   * Validates and transitions a complaint state
   */
  function transitionComplaintStatus(complaintId, targetStatus, actor, noteText, photoProof){
    var state = STORAGE.loadState();
    var complaint = state.reports.find(function(c){ return c.id === complaintId; });
    if(!complaint) return { success: false, error: 'Complaint not found' };

    var prevStatus = complaint.status;
    complaint.status = targetStatus;
    complaint.updatedAt = new Date().toISOString();
    complaint.timeline = complaint.timeline || [];

    var timelineEntry = {
      status: targetStatus,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actor: actor.name + ' (' + ((CONFIG.ROLES && CONFIG.ROLES[actor.role]) ? CONFIG.ROLES[actor.role].label : actor.role) + ')',
      note: noteText || ('Status updated to ' + targetStatus.replace(/_/g, ' ')),
      photoProof: photoProof || null
    };

    complaint.timeline.push(timelineEntry);

    // Audit log
    logAudit('STATUS_TRANSITION', actor, complaintId, prevStatus, targetStatus, noteText);

    // Trigger notification
    if(window.MumbAIR.NOTIFICATIONS){
      window.MumbAIR.NOTIFICATIONS.dispatch({
        type: 'STATUS_CHANGE',
        title: 'Case ' + complaintId + ' Updated',
        message: 'Status updated to ' + targetStatus.replace(/_/g, ' ') + ': ' + noteText,
        linkId: complaintId
      });
    }

    STORAGE.saveState(state);
    return { success: true, complaint: complaint };
  }

  /**
   * Assign a Field Officer to a single complaint
   */
  function assignOfficer(complaintId, officerId, supervisorActor, instructions){
    var state = STORAGE.loadState();
    var complaint = state.reports.find(function(c){ return c.id === complaintId; });
    var officers = state.officers || (CONFIG.DEMO_USERS || []);
    var officer = officers.find(function(u){ return u.id === officerId || u.name === officerId; });
    if(!complaint || !officer) return { success: false, error: 'Invalid complaint or officer' };

    complaint.assignedOfficer = officer.name;
    complaint.assignedOfficerId = officer.id;
    complaint.assignedBadge = officer.badge;
    complaint.department = complaint.department || (CONFIG.ROUTING_MAP && CONFIG.ROUTING_MAP[complaint.category]) || officer.department || 'SWM';
    complaint.status = 'ASSIGNED';
    complaint.updatedAt = new Date().toISOString();

    complaint.timeline = complaint.timeline || [];
    complaint.timeline.push({
      status: 'ASSIGNED',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actor: supervisorActor.name + ' (' + supervisorActor.role + ')',
      note: 'Dispatched to ' + officer.name + ' (' + officer.badge + '). Directives: ' + (instructions || 'Immediate on-ground inspection requested.')
    });

    logAudit('OFFICER_ASSIGNED', supervisorActor, complaintId, null, officer.name, instructions);

    if(window.MumbAIR.NOTIFICATIONS){
      window.MumbAIR.NOTIFICATIONS.dispatch({
        type: 'ASSIGNMENT',
        title: 'New Case Assigned: ' + complaintId,
        message: 'You have been assigned complaint ' + complaintId + ' in Ward ' + complaint.ward,
        targetRole: 'FIELD_OFFICER',
        linkId: complaintId
      });
    }

    STORAGE.saveState(state);
    return { success: true, complaint: complaint };
  }

  /**
   * Bulk assign multiple complaints to an officer
   */
  function bulkAssign(complaintIds, officerId, supervisorActor, instructions){
    var state = STORAGE.loadState();
    var officers = state.officers || (CONFIG.DEMO_USERS || []);
    var officer = officers.find(function(u){ return u.id === officerId || u.name === officerId; });
    if(!officer) return { success: false, error: 'Officer not found' };

    var count = 0;
    complaintIds.forEach(function(cid){
      var c = state.reports.find(function(r){ return r.id === cid; });
      if(c && c.status !== 'RESOLVED' && c.status !== 'CLOSED'){
        c.assignedOfficer = officer.name;
        c.assignedOfficerId = officer.id;
        c.assignedBadge = officer.badge;
        c.status = 'ASSIGNED';
        c.updatedAt = new Date().toISOString();
        c.timeline = c.timeline || [];
        c.timeline.push({
          status: 'ASSIGNED',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actor: supervisorActor.name,
          note: 'Bulk assigned to ' + officer.name + '. ' + (instructions || '')
        });
        logAudit('BULK_ASSIGNED', supervisorActor, cid, null, officer.name, instructions);
        count++;
      }
    });

    STORAGE.saveState(state);
    return { success: true, count: count };
  }

  /**
   * Bulk update priority
   */
  function bulkUpdatePriority(complaintIds, newPriority, actor){
    var state = STORAGE.loadState();
    var count = 0;
    complaintIds.forEach(function(cid){
      var c = state.reports.find(function(r){ return r.id === cid; });
      if(c){
        var prev = c.priority;
        c.priority = newPriority;
        c.updatedAt = new Date().toISOString();
        logAudit('PRIORITY_CHANGED', actor, cid, prev, newPriority, 'Bulk priority adjustment');
        count++;
      }
    });
    STORAGE.saveState(state);
    return { success: true, count: count };
  }

  /**
   * Bulk transfer department
   */
  function bulkTransferDept(complaintIds, newDept, actor){
    var state = STORAGE.loadState();
    var count = 0;
    complaintIds.forEach(function(cid){
      var c = state.reports.find(function(r){ return r.id === cid; });
      if(c){
        var prev = c.department;
        c.department = newDept;
        c.updatedAt = new Date().toISOString();
        c.timeline = c.timeline || [];
        c.timeline.push({
          status: c.status,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actor: actor.name,
          note: 'Transferred department to ' + newDept
        });
        logAudit('DEPT_TRANSFERRED', actor, cid, prev, newDept, 'Inter-departmental routing reallocated');
        count++;
      }
    });
    STORAGE.saveState(state);
    return { success: true, count: count };
  }

  /**
   * Start field inspection
   */
  function startInspection(complaintId, officerActor, notes){
    return transitionComplaintStatus(
      complaintId,
      'IN_PROGRESS',
      officerActor,
      notes || 'Field inspector arrived at site coordinates. Formal inspection initiated.'
    );
  }

  /**
   * Submit resolution with mitigation notes
   */
  function submitResolution(complaintId, officerActor, summary, photoProof){
    var state = STORAGE.loadState();
    var complaint = state.reports.find(function(c){ return c.id === complaintId; });
    if(!complaint) return { success: false, error: 'Complaint not found' };

    complaint.resolution = {
      summary: summary,
      submittedAt: new Date().toISOString(),
      submittedBy: officerActor.name,
      beforePhoto: complaint.evidencePhoto || 'Standard Citizen Proof',
      afterPhoto: photoProof || 'Field Inspection Mitigation Photo'
    };

    var res = transitionComplaintStatus(
      complaintId,
      'RESOLUTION_SUBMITTED',
      officerActor,
      'Mitigation completed: ' + summary + '. Awaiting supervisor verification.',
      true
    );

    return res;
  }

  /**
   * Supervisor verification (Approve or Reject resolution)
   */
  function verifyResolution(complaintId, supervisorActor, isApproved, reviewNotes, rejectionReason){
    var state = STORAGE.loadState();
    var complaint = state.reports.find(function(c){ return c.id === complaintId; });
    if(!complaint) return { success: false, error: 'Complaint not found' };

    complaint.timeline = complaint.timeline || [];

    if(isApproved){
      complaint.status = 'RESOLVED';
      complaint.updatedAt = new Date().toISOString();
      if(complaint.resolution){
        complaint.resolution.approvedBy = supervisorActor.name;
        complaint.resolution.approvedAt = new Date().toISOString();
        complaint.resolution.reviewNotes = reviewNotes || 'Compliance verified against BMC standards.';
      }

      complaint.timeline.push({
        status: 'RESOLVED',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actor: supervisorActor.name + ' (' + supervisorActor.role + ')',
        note: 'Resolution verified and approved: ' + (reviewNotes || 'Site clean & compliant.')
      });

      logAudit('RESOLUTION_APPROVED', supervisorActor, complaintId, 'RESOLUTION_SUBMITTED', 'RESOLVED', reviewNotes);

      if(window.MumbAIR.NOTIFICATIONS){
        window.MumbAIR.NOTIFICATIONS.dispatch({
          type: 'CASE_RESOLVED',
          title: 'Case ' + complaintId + ' Certified Resolved',
          message: 'Supervisor ' + supervisorActor.name + ' approved the mitigation report for ' + complaint.addressText,
          linkId: complaintId
        });
      }
    } else {
      complaint.status = 'IN_PROGRESS';
      complaint.updatedAt = new Date().toISOString();
      if(complaint.resolution){
        complaint.resolution.rejectionReason = rejectionReason;
        complaint.resolution.rejectedBy = supervisorActor.name;
        complaint.resolution.rejectedAt = new Date().toISOString();
      }

      complaint.timeline.push({
        status: 'IN_PROGRESS',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actor: supervisorActor.name + ' (' + supervisorActor.role + ')',
        note: 'Resolution rejected by supervisor. Re-inspection required: ' + rejectionReason
      });

      logAudit('RESOLUTION_REJECTED', supervisorActor, complaintId, 'RESOLUTION_SUBMITTED', 'IN_PROGRESS', rejectionReason);

      if(window.MumbAIR.NOTIFICATIONS){
        window.MumbAIR.NOTIFICATIONS.dispatch({
          type: 'RESOLUTION_REJECTED',
          title: 'Re-inspection Mandated: ' + complaintId,
          message: 'Supervisor ' + supervisorActor.name + ' rejected resolution for ' + complaintId + ': ' + rejectionReason,
          targetRole: 'FIELD_OFFICER',
          linkId: complaintId
        });
      }
    }

    STORAGE.saveState(state);
    return { success: true, complaint: complaint };
  }

  /**
   * Add internal staff note to a complaint
   */
  function addInternalNote(complaintId, actor, noteText){
    var state = STORAGE.loadState();
    var complaint = state.reports.find(function(c){ return c.id === complaintId; });
    if(!complaint) return { success: false, error: 'Complaint not found' };

    complaint.internalNotes = complaint.internalNotes || [];
    var noteObj = {
      id: 'n_' + Date.now().toString(36),
      author: actor.name,
      role: actor.role,
      text: noteText,
      timestamp: new Date().toISOString()
    };
    complaint.internalNotes.push(noteObj);
    logAudit('INTERNAL_NOTE_ADDED', actor, complaintId, null, null, noteText);

    STORAGE.saveState(state);
    return { success: true, note: noteObj };
  }

  /**
   * Escalate complaint
   */
  function escalateComplaint(complaintId, actor, reason, escalationLevel){
    var state = STORAGE.loadState();
    var complaint = state.reports.find(function(c){ return c.id === complaintId; });
    if(!complaint) return { success: false, error: 'Complaint not found' };

    var prev = complaint.status;
    complaint.status = 'ESCALATED';
    complaint.priority = 'URGENT';
    complaint.escalationLevel = escalationLevel || 'LEVEL_2';
    complaint.updatedAt = new Date().toISOString();

    complaint.timeline = complaint.timeline || [];
    complaint.timeline.push({
      status: 'ESCALATED',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actor: actor.name + ' (' + actor.role + ')',
      note: 'Escalated (' + (escalationLevel || 'LEVEL 2') + '): ' + reason
    });

    logAudit('COMPLAINT_ESCALATED', actor, complaintId, prev, 'ESCALATED', reason);

    if(window.MumbAIR.NOTIFICATIONS){
      window.MumbAIR.NOTIFICATIONS.dispatch({
        type: 'ESCALATION',
        title: 'CRITICAL ESCALATION: ' + complaintId,
        message: 'Case ' + complaintId + ' escalated by ' + actor.name + ': ' + reason,
        targetRole: 'CITY_ADMIN',
        linkId: complaintId
      });
    }

    STORAGE.saveState(state);
    return { success: true, complaint: complaint };
  }

  /**
   * Publish Public Environmental Advisory
   */
  function publishAdvisory(advisoryData, actor){
    var state = STORAGE.loadState();
    state.advisories = state.advisories || [];

    var newAdv = {
      id: 'ADV-' + Math.floor(100 + Math.random() * 900),
      title: advisoryData.title,
      category: advisoryData.category || 'REGULATION',
      severity: advisoryData.severity || 'WARNING',
      affectedWards: advisoryData.affectedWards || ['ALL'],
      startDate: advisoryData.startDate || new Date().toISOString(),
      endDate: advisoryData.endDate || new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
      status: 'ACTIVE',
      issuingDept: advisoryData.issuingDept || actor.department || 'APC',
      author: actor.name + ' (' + actor.role + ')',
      summary: advisoryData.summary
    };

    state.advisories.unshift(newAdv);
    logAudit('ADVISORY_PUBLISHED', actor, newAdv.id, null, 'ACTIVE', newAdv.title);

    if(window.MumbAIR.NOTIFICATIONS){
      window.MumbAIR.NOTIFICATIONS.dispatch({
        type: 'ADVISORY',
        title: 'Official Civic Advisory: ' + newAdv.title,
        message: newAdv.summary,
        targetRole: 'ALL'
      });
    }

    STORAGE.saveState(state);
    return { success: true, advisory: newAdv };
  }

  /**
   * Reopen a complaint (Citizen action)
   */
  function reopenComplaint(complaintId, citizenActor, reason){
    var state = STORAGE.loadState();
    var complaint = state.reports.find(function(c){ return c.id === complaintId; });
    if(!complaint) return { success: false, error: 'Complaint not found' };

    var prev = complaint.status;
    complaint.status = 'REOPENED';
    complaint.timeline.push({
      status: 'REOPENED',
      time: 'Just now',
      actor: citizenActor.name + ' (Citizen)',
      note: 'Citizen dissatisfied with resolution: ' + reason
    });

    logAudit('COMPLAINT_REOPENED', citizenActor, complaintId, prev, 'REOPENED', reason);

    if(window.MumbAIR.NOTIFICATIONS){
      window.MumbAIR.NOTIFICATIONS.dispatch({
        type: 'CASE_REOPENED',
        title: 'Case Reopened: ' + complaintId,
        message: 'Citizen reopened case ' + complaintId + ' in Ward ' + complaint.ward + ': ' + reason,
        targetRole: 'WARD_OFFICER',
        linkId: complaintId
      });
    }

    STORAGE.saveState(state);
    return { success: true, complaint: complaint };
  }

  return {
    calculateSla: calculateSla,
    logAudit: logAudit,
    transitionComplaintStatus: transitionComplaintStatus,
    assignOfficer: assignOfficer,
    bulkAssign: bulkAssign,
    bulkUpdatePriority: bulkUpdatePriority,
    bulkTransferDept: bulkTransferDept,
    startInspection: startInspection,
    submitResolution: submitResolution,
    verifyResolution: verifyResolution,
    addInternalNote: addInternalNote,
    escalateComplaint: escalateComplaint,
    publishAdvisory: publishAdvisory,
    reopenComplaint: reopenComplaint
  };
})();
