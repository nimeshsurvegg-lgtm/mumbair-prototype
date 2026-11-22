/* ==============================================================================
   MumbAIR — Complaint Workflow Engine, SLA Clocks & Audit Logger
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
      return { status: 'COMPLETED', label: 'Completed', hoursLeft: 0, deadline: null };
    }

    var priority = complaint.priority || 'MEDIUM';
    var policy = CONFIG.SLA_POLICIES[priority] || CONFIG.SLA_POLICIES.MEDIUM;
    var submittedTime = new Date(complaint.createdAt).getTime();
    var deadlineTime = submittedTime + (policy.resolveHours * 60 * 60 * 1000);
    var now = Date.now();
    var msLeft = deadlineTime - now;
    var hoursLeft = Math.round(msLeft / (60 * 60 * 1000));

    if(msLeft < 0){
      return { status: 'BREACHED', label: 'SLA Breached (' + Math.abs(hoursLeft) + 'h overdue)', hoursLeft: hoursLeft, deadline: new Date(deadlineTime).toISOString() };
    } else if(hoursLeft <= 6){
      return { status: 'DUE_SOON', label: 'Due Soon (' + hoursLeft + 'h left)', hoursLeft: hoursLeft, deadline: new Date(deadlineTime).toISOString() };
    } else {
      return { status: 'ON_TRACK', label: 'On Track (' + hoursLeft + 'h left)', hoursLeft: hoursLeft, deadline: new Date(deadlineTime).toISOString() };
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
      actorName: actor ? actor.name : 'System',
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
    complaint.timeline = complaint.timeline || [];

    var timelineEntry = {
      status: targetStatus,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actor: actor.name + ' (' + (CONFIG.ROLES[actor.role] ? CONFIG.ROLES[actor.role].label : actor.role) + ')',
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
        title: 'Complaint ' + complaintId + ' Updated',
        message: 'Status updated to ' + targetStatus.replace(/_/g, ' ') + ': ' + noteText,
        linkId: complaintId
      });
    }

    STORAGE.saveState(state);
    return { success: true, complaint: complaint };
  }

  /**
   * Assign a Field Officer to a complaint
   */
  function assignOfficer(complaintId, officerId, supervisorActor, instructions){
    var state = STORAGE.loadState();
    var complaint = state.reports.find(function(c){ return c.id === complaintId; });
    var officer = CONFIG.DEMO_USERS.find(function(u){ return u.id === officerId; });
    if(!complaint || !officer) return { success: false, error: 'Invalid complaint or officer' };

    complaint.assignedOfficer = officer.name;
    complaint.assignedOfficerId = officer.id;
    complaint.assignedBadge = officer.badge;
    complaint.department = complaint.department || CONFIG.ROUTING_MAP[complaint.category] || 'SWM';
    complaint.status = 'ASSIGNED';

    complaint.timeline.push({
      status: 'ASSIGNED',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actor: supervisorActor.name,
      note: 'Assigned to ' + officer.name + ' (' + officer.badge + '). Instructions: ' + (instructions || 'Immediate on-ground inspection requested.')
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
    reopenComplaint: reopenComplaint
  };
})();
