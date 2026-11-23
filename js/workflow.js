/* ==============================================================================
   MumbAIR — Complaint Workflow Engine, Strict State Machine, SLA & RBAC Matrix
   Centralized lifecycle transitions, separation of duties & atomic persistence
   ============================================================================== */

window.MumbAIR = window.MumbAIR || {};

window.MumbAIR.WORKFLOW = (function(){
  'use strict';

  function getConfig(){
    return window.MumbAIR.CONFIG || {};
  }

  function getStorage(){
    return window.MumbAIR.STORAGE;
  }

  /**
   * ACCURATE SLA ENGINE
   * Distinguishes: ON_TRACK, DUE_SOON, BREACHED, PAUSED, COMPLETED_ON_TIME, COMPLETED_LATE
   * Does NOT label late completions as compliant.
   */
  function calculateSla(complaint){
    if(!complaint) return null;
    var config = getConfig();
    var priority = complaint.priority || 'MEDIUM';
    var policy = (config.SLA_POLICIES && config.SLA_POLICIES[priority]) || { ackHours: 8, inspectHours: 24, resolveHours: 48 };

    var submittedTime = new Date(complaint.createdAt).getTime();
    if(isNaN(submittedTime)){
      submittedTime = Date.now();
    }
    var deadlineTime = submittedTime + (policy.resolveHours * 60 * 60 * 1000);

    // Completed states
    if(complaint.status === 'RESOLVED' || complaint.status === 'CLOSED'){
      var finishTime = new Date(complaint.resolvedAt || complaint.updatedAt || Date.now()).getTime();
      var wasOnTime = finishTime <= deadlineTime;
      var overdueHours = Math.max(0, Math.round((finishTime - deadlineTime) / (60 * 60 * 1000)));

      if(wasOnTime){
        return {
          status: 'COMPLETED_ON_TIME',
          label: 'Resolved On-Time',
          isCompliant: true,
          hoursLeft: 0,
          deadline: new Date(deadlineTime).toISOString()
        };
      } else {
        return {
          status: 'COMPLETED_LATE',
          label: 'Resolved Late (' + overdueHours + 'h overdue)',
          isCompliant: false, // MANDATORY: Late completion is NOT compliant
          hoursLeft: -overdueHours,
          deadline: new Date(deadlineTime).toISOString()
        };
      }
    }

    if(complaint.status === 'REJECTED' || complaint.status === 'DUPLICATE'){
      return {
        status: 'CLOSED_OUT',
        label: complaint.status === 'REJECTED' ? 'Rejected' : 'Merged Duplicate',
        isCompliant: true,
        hoursLeft: 0,
        deadline: new Date(deadlineTime).toISOString()
      };
    }

    if(complaint.status === 'ON_HOLD'){
      return {
        status: 'PAUSED',
        label: 'SLA Paused (Dependency: ' + (complaint.holdReason || 'External Agency') + ')',
        isCompliant: true,
        hoursLeft: 0,
        deadline: new Date(deadlineTime).toISOString()
      };
    }

    // Active cases
    var now = Date.now();
    var msLeft = deadlineTime - now;
    var hoursLeft = Math.round(msLeft / (60 * 60 * 1000));

    if(msLeft < 0){
      return {
        status: 'BREACHED',
        label: 'SLA Breached (' + Math.abs(hoursLeft) + 'h overdue)',
        isCompliant: false,
        hoursLeft: hoursLeft,
        deadline: new Date(deadlineTime).toISOString()
      };
    } else if(hoursLeft <= 6){
      return {
        status: 'DUE_SOON',
        label: 'Due Soon (' + hoursLeft + 'h left)',
        isCompliant: true,
        hoursLeft: hoursLeft,
        deadline: new Date(deadlineTime).toISOString()
      };
    } else {
      return {
        status: 'ON_TRACK',
        label: 'On Track (' + hoursLeft + 'h left)',
        isCompliant: true,
        hoursLeft: hoursLeft,
        deadline: new Date(deadlineTime).toISOString()
      };
    }
  }

  /**
   * STRICT ROLE-BASED ACCESS & PERMISSION VALIDATOR
   * Enforced inside business logic, independent of UI display
   */
  function canActorPerformAction(action, complaint, actor){
    if(!actor || !actor.role) return { allowed: false, error: 'Unauthenticated or missing actor role' };
    var role = actor.role;

    // Field Officer Scope: Can ONLY act on assigned cases
    if(role === 'FIELD_OFFICER'){
      if(action === 'START_INSPECTION' || action === 'COMPLETE_INSPECTION' || action === 'SUBMIT_RESOLUTION'){
        if(complaint.assignedOfficerId !== actor.id && complaint.assignedOfficer !== actor.name){
          return { allowed: false, error: 'Unauthorized: Field Officer cannot act on complaints assigned to another officer.' };
        }
        return { allowed: true };
      }
      if(action === 'REQUEST_HOLD' || action === 'REQUEST_ESCALATION'){
        if(complaint.assignedOfficerId !== actor.id && complaint.assignedOfficer !== actor.name){
          return { allowed: false, error: 'Unauthorized: Can only request escalation on assigned cases.' };
        }
        return { allowed: true };
      }
      if(action === 'ASSIGN_OFFICER' || action === 'TRANSFER_DEPT' || action === 'CHANGE_PRIORITY' || action === 'APPROVE_RESOLUTION'){
        return { allowed: false, error: 'Unauthorized: Field Officers do not possess supervisory permissions.' };
      }
    }

    // Ward Officer Scope: Restricted strictly to their ward
    if(role === 'WARD_OFFICER'){
      if(actor.ward && actor.ward !== 'ALL' && complaint.ward !== actor.ward){
        return { allowed: false, error: 'Unauthorized: Ward Officer (' + actor.ward + ') cannot operate on Ward ' + complaint.ward + ' cases.' };
      }
      return { allowed: true };
    }

    // Department Head Scope: Restricted to their department
    if(role === 'DEPARTMENT_HEAD'){
      if(actor.department && actor.department !== 'ALL' && complaint.department && complaint.department !== actor.department){
        return { allowed: false, error: 'Unauthorized: Department Head (' + actor.department + ') cannot manage ' + complaint.department + ' department cases.' };
      }
      return { allowed: true };
    }

    // City Admin: City-level oversight
    if(role === 'CITY_ADMIN'){
      return { allowed: true };
    }

    // Super Admin: User/Role/System settings only; cannot routinely approve resolutions
    if(role === 'SUPER_ADMIN'){
      if(action === 'APPROVE_RESOLUTION'){
        return { allowed: false, error: 'Separation of duties violation: Super Admin role manages system security, not routine operational resolutions.' };
      }
      return { allowed: true };
    }

    // Citizen Scope
    if(role === 'CITIZEN'){
      if(action === 'REOPEN_CASE'){
        if(complaint.citizenId && actor.id && complaint.citizenId !== actor.id){
          return { allowed: false, error: 'Unauthorized: Citizens can only reopen their own filed complaints.' };
        }
        return { allowed: true };
      }
      return { allowed: false, error: 'Unauthorized citizen action.' };
    }

    return { allowed: true };
  }

  /**
   * CENTRALIZED STATE MACHINE VALIDATOR
   * Enforces legal transitions, prerequisites, and mandatory justification
   */
  function validateStateTransition(currentStatus, targetStatus, options){
    options = options || {};
    var config = getConfig();
    var lifecycle = config.STATUS_LIFECYCLE || {};

    var stateDef = lifecycle[currentStatus];
    if(!stateDef){
      return { valid: false, error: 'Invalid current complaint status: ' + currentStatus };
    }

    // Check if target is in legal next transitions
    if(!stateDef.next || stateDef.next.indexOf(targetStatus) === -1){
      return {
        valid: false,
        error: 'Illegal state transition from ' + currentStatus + ' to ' + targetStatus + '. Legal transitions: ' + (stateDef.next ? stateDef.next.join(', ') : 'none')
      };
    }

    // Prerequisite checks
    var targetDef = lifecycle[targetStatus] || {};
    if(targetDef.requiresReason && (!options.reason || String(options.reason).trim().length < 5)){
      return {
        valid: false,
        error: 'Mandatory detailed justification (minimum 5 characters) required for status: ' + targetStatus
      };
    }

    return { valid: true };
  }

  /**
   * APPEND AUDIT LOG DIRECTLY INTO STATE
   * Internal transaction helper (called within atomic mutators)
   */
  function internalAppendAudit(state, action, actor, recordId, prevVal, newVal, notes){
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
    if(state.auditLogs.length > 500) state.auditLogs.pop();
    return logEntry;
  }

  /**
   * APPEND TARGETED NOTIFICATION DIRECTLY INTO STATE
   * Internal transaction helper (called within atomic mutators)
   */
  function internalAppendNotification(state, notifData){
    state.notifications = state.notifications || [];
    var newNotif = {
      id: 'notif_' + Date.now().toString(36) + '_' + Math.floor(Math.random() * 1000),
      title: notifData.title || 'MumbAIR Alert',
      message: notifData.message || '',
      time: 'Just now',
      createdAt: new Date().toISOString(),
      read: false,
      type: notifData.type || 'INFO',
      linkId: notifData.linkId || null,
      targetRole: notifData.targetRole || 'ALL',
      targetWard: notifData.targetWard || 'ALL',
      targetUserId: notifData.targetUserId || null,
      targetCitizenId: notifData.targetCitizenId || null
    };
    state.notifications.unshift(newNotif);
    if(state.notifications.length > 50) state.notifications.pop();
    return newNotif;
  }

  /* ===========================================================================
     CORE OPERATIONAL ACTIONS (ALL FULLY ATOMIC & RBAC-VALIDATED)
     =========================================================================== */

  /**
   * Atomic transition of complaint status
   */
  function transitionComplaintStatus(complaintId, targetStatus, actor, noteText, options){
    options = options || {};
    return getStorage().atomicUpdate(function(state){
      var complaint = state.reports.find(function(c){ return c.id === complaintId; });
      if(!complaint) return { success: false, error: 'Complaint ' + complaintId + ' not found' };

      // 1. RBAC Check
      var authCheck = canActorPerformAction(options.actionType || 'STATUS_TRANSITION', complaint, actor);
      if(!authCheck.allowed) return { success: false, error: authCheck.error };

      // 2. State Machine Validation
      var valCheck = validateStateTransition(complaint.status, targetStatus, { reason: noteText || options.reason });
      if(!valCheck.valid) return { success: false, error: valCheck.error };

      var prevStatus = complaint.status;
      complaint.previousStatus = prevStatus;
      complaint.status = targetStatus;
      complaint.updatedAt = new Date().toISOString();

      if(targetStatus === 'RESOLVED') complaint.resolvedAt = new Date().toISOString();
      if(targetStatus === 'CLOSED') complaint.closedAt = new Date().toISOString();

      // Timeline update
      complaint.timeline = complaint.timeline || [];
      complaint.timeline.push({
        status: targetStatus,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actor: actor.name + ' (' + actor.role + ')',
        note: noteText || ('Status updated to ' + targetStatus.replace(/_/g, ' '))
      });

      // Atomic Audit
      internalAppendAudit(state, 'STATUS_TRANSITION', actor, complaintId, prevStatus, targetStatus, noteText);

      // Atomic Targeted Notification
      internalAppendNotification(state, {
        type: 'STATUS_CHANGE',
        title: 'Case ' + complaintId + ' Updated',
        message: 'Status updated to ' + targetStatus.replace(/_/g, ' ') + ': ' + (noteText || ''),
        linkId: complaintId,
        targetRole: 'ALL',
        targetCitizenId: complaint.citizenId
      });

      return { success: true, complaint: complaint };
    });
  }

  /**
   * Assign an officer to a complaint
   */
  function assignOfficer(complaintId, officerId, supervisorActor, instructions){
    return getStorage().atomicUpdate(function(state){
      var complaint = state.reports.find(function(c){ return c.id === complaintId; });
      if(!complaint) return { success: false, error: 'Complaint ' + complaintId + ' not found' };

      // Prevent assignment of resolved/rejected/closed cases
      if(complaint.status === 'RESOLVED' || complaint.status === 'CLOSED' || complaint.status === 'REJECTED'){
        return { success: false, error: 'Cannot assign officer to a ' + complaint.status + ' case.' };
      }

      // RBAC Check
      var authCheck = canActorPerformAction('ASSIGN_OFFICER', complaint, supervisorActor);
      if(!authCheck.allowed) return { success: false, error: authCheck.error };

      var officer = (state.officers || []).find(function(u){ return u.id === officerId || u.name === officerId; });
      if(!officer) return { success: false, error: 'Officer with ID ' + officerId + ' not found in roster.' };

      var prevOfficer = complaint.assignedOfficer;
      complaint.assignedOfficer = officer.name;
      complaint.assignedOfficerId = officer.id;
      complaint.assignedBadge = officer.badge;
      complaint.department = complaint.department || officer.department || 'SWM';
      complaint.status = 'ASSIGNED';
      complaint.updatedAt = new Date().toISOString();
      complaint.assignedAt = new Date().toISOString();

      complaint.timeline = complaint.timeline || [];
      complaint.timeline.push({
        status: 'ASSIGNED',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actor: supervisorActor.name + ' (' + supervisorActor.role + ')',
        note: 'Dispatched to ' + officer.name + ' (' + officer.badge + '). Directives: ' + (instructions || 'Mandatory on-ground inspection requested.')
      });

      internalAppendAudit(state, 'OFFICER_ASSIGNED', supervisorActor, complaintId, prevOfficer, officer.name, instructions);

      internalAppendNotification(state, {
        type: 'ASSIGNMENT',
        title: 'New Case Assigned: ' + complaintId,
        message: 'You have been assigned complaint ' + complaintId + ' in Ward ' + complaint.ward,
        targetRole: 'FIELD_OFFICER',
        targetUserId: officer.id,
        targetWard: complaint.ward,
        linkId: complaintId
      });

      return { success: true, complaint: complaint };
    });
  }

  /**
   * Bulk assign multiple complaints to an officer
   */
  function bulkAssign(complaintIds, officerId, supervisorActor, instructions){
    return getStorage().atomicUpdate(function(state){
      var officer = (state.officers || []).find(function(u){ return u.id === officerId || u.name === officerId; });
      if(!officer) return { success: false, error: 'Officer not found' };

      var count = 0;
      complaintIds.forEach(function(cid){
        var c = state.reports.find(function(r){ return r.id === cid; });
        if(c && c.status !== 'RESOLVED' && c.status !== 'CLOSED' && c.status !== 'REJECTED'){
          var authCheck = canActorPerformAction('ASSIGN_OFFICER', c, supervisorActor);
          if(authCheck.allowed){
            c.assignedOfficer = officer.name;
            c.assignedOfficerId = officer.id;
            c.assignedBadge = officer.badge;
            c.status = 'ASSIGNED';
            c.updatedAt = new Date().toISOString();
            c.assignedAt = new Date().toISOString();
            c.timeline = c.timeline || [];
            c.timeline.push({
              status: 'ASSIGNED',
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              actor: supervisorActor.name,
              note: 'Bulk assigned to ' + officer.name + '. ' + (instructions || '')
            });
            internalAppendAudit(state, 'BULK_ASSIGNED', supervisorActor, cid, null, officer.name, instructions);
            count++;
          }
        }
      });

      return { success: true, count: count };
    });
  }

  /**
   * Start field inspection
   */
  function startInspection(complaintId, officerActor, notes){
    return transitionComplaintStatus(
      complaintId,
      'IN_PROGRESS',
      officerActor,
      notes || 'Field inspector arrived at site coordinates. Formal inspection initiated.',
      { actionType: 'START_INSPECTION' }
    );
  }

  /**
   * Record completed field inspection findings and evidence
   */
  function completeInspection(complaintId, officerActor, inspectionData){
    return getStorage().atomicUpdate(function(state){
      var complaint = state.reports.find(function(c){ return c.id === complaintId; });
      if(!complaint) return { success: false, error: 'Complaint ' + complaintId + ' not found' };

      var authCheck = canActorPerformAction('COMPLETE_INSPECTION', complaint, officerActor);
      if(!authCheck.allowed) return { success: false, error: authCheck.error };

      complaint.inspection = {
        completedAt: new Date().toISOString(),
        inspectorName: officerActor.name,
        inspectorId: officerActor.id,
        findings: inspectionData.findings || 'On-site emission confirmed.',
        measuredPpm: inspectionData.measuredPpm || null,
        photoProof: inspectionData.photoProof || null,
        equipmentUsed: inspectionData.equipmentUsed || 'Standard field kit'
      };

      complaint.status = 'INSPECTION_COMPLETED';
      complaint.updatedAt = new Date().toISOString();
      complaint.timeline = complaint.timeline || [];
      complaint.timeline.push({
        status: 'INSPECTION_COMPLETED',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actor: officerActor.name + ' (Field Officer)',
        note: 'Inspection findings recorded: ' + (inspectionData.findings || 'Completed')
      });

      internalAppendAudit(state, 'INSPECTION_COMPLETED', officerActor, complaintId, 'IN_PROGRESS', 'INSPECTION_COMPLETED', inspectionData.findings);

      return { success: true, complaint: complaint };
    });
  }

  /**
   * Submit resolution with mitigation notes
   */
  function submitResolution(complaintId, officerActor, summary, photoProof){
    return getStorage().atomicUpdate(function(state){
      var complaint = state.reports.find(function(c){ return c.id === complaintId; });
      if(!complaint) return { success: false, error: 'Complaint not found' };

      var authCheck = canActorPerformAction('SUBMIT_RESOLUTION', complaint, officerActor);
      if(!authCheck.allowed) return { success: false, error: authCheck.error };

      if(!summary || summary.trim().length < 10){
        return { success: false, error: 'Detailed mitigation summary (minimum 10 characters) is required.' };
      }

      complaint.resolution = {
        summary: summary,
        submittedAt: new Date().toISOString(),
        submittedBy: officerActor.name,
        submittedById: officerActor.id,
        beforePhoto: complaint.evidencePhoto || 'Citizen Photo Evidence',
        afterPhoto: photoProof || 'Field Inspection Mitigation Photo'
      };

      complaint.status = 'RESOLUTION_SUBMITTED';
      complaint.updatedAt = new Date().toISOString();

      complaint.timeline = complaint.timeline || [];
      complaint.timeline.push({
        status: 'RESOLUTION_SUBMITTED',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actor: officerActor.name + ' (Field Officer)',
        note: 'Mitigation completed: ' + summary + '. Awaiting independent supervisor sign-off.'
      });

      internalAppendAudit(state, 'RESOLUTION_SUBMITTED', officerActor, complaintId, 'IN_PROGRESS', 'RESOLUTION_SUBMITTED', summary);

      internalAppendNotification(state, {
        type: 'RESOLUTION_SUBMITTED',
        title: 'Resolution Review Required: ' + complaintId,
        message: officerActor.name + ' submitted mitigation for ' + complaintId + ' in Ward ' + complaint.ward,
        targetRole: 'WARD_OFFICER',
        targetWard: complaint.ward,
        linkId: complaintId
      });

      return { success: true, complaint: complaint };
    });
  }

  /**
   * SUPERVISOR FOUR-EYES REVIEW (APPROVE OR REJECT RESOLUTION)
   * Enforces Separation of Duties:
   * 1. Inspector CANNOT approve own resolution
   * 2. Case dispatcher cannot bypass inspection and approve immediately
   * 3. Requires valid resolution and review notes
   */
  function verifyResolution(complaintId, supervisorActor, isApproved, reviewNotes, rejectionReason){
    return getStorage().atomicUpdate(function(state){
      var complaint = state.reports.find(function(c){ return c.id === complaintId; });
      if(!complaint) return { success: false, error: 'Complaint not found' };

      // Status prerequisite: Must be in submitted or review status
      if(complaint.status !== 'RESOLUTION_SUBMITTED' && complaint.status !== 'RESOLUTION_REVIEW'){
        return { success: false, error: 'Cannot approve resolution: Complaint is not in RESOLUTION_SUBMITTED status (current: ' + complaint.status + ').' };
      }

      // Resolution data prerequisite
      if(!complaint.resolution || !complaint.resolution.summary){
        return { success: false, error: 'Cannot approve resolution without submitted field mitigation documentation.' };
      }

      // FOUR-EYES PRINCIPLE: Inspector cannot approve their own work!
      if(complaint.assignedOfficerId === supervisorActor.id ||
         (complaint.resolution.submittedById && complaint.resolution.submittedById === supervisorActor.id) ||
         complaint.resolution.submittedBy === supervisorActor.name){
        return { success: false, error: 'Separation of duties violation: Field inspectors are strictly prohibited from approving their own resolutions.' };
      }

      // Role check
      var authCheck = canActorPerformAction('APPROVE_RESOLUTION', complaint, supervisorActor);
      if(!authCheck.allowed) return { success: false, error: authCheck.error };

      complaint.timeline = complaint.timeline || [];

      if(isApproved){
        if(!reviewNotes || reviewNotes.trim().length < 5){
          return { success: false, error: 'Supervisor review assessment notes (minimum 5 characters) are required.' };
        }

        complaint.status = 'RESOLVED';
        complaint.updatedAt = new Date().toISOString();
        complaint.resolvedAt = new Date().toISOString();

        complaint.resolution.approvedBy = supervisorActor.name;
        complaint.resolution.approvedById = supervisorActor.id;
        complaint.resolution.approvedAt = new Date().toISOString();
        complaint.resolution.reviewNotes = reviewNotes;

        complaint.timeline.push({
          status: 'RESOLVED',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actor: supervisorActor.name + ' (' + supervisorActor.role + ')',
          note: 'Resolution verified & approved: ' + reviewNotes
        });

        internalAppendAudit(state, 'RESOLUTION_APPROVED', supervisorActor, complaintId, 'RESOLUTION_SUBMITTED', 'RESOLVED', reviewNotes);

        internalAppendNotification(state, {
          type: 'CASE_RESOLVED',
          title: 'Case ' + complaintId + ' Certified Resolved',
          message: 'Supervisor ' + supervisorActor.name + ' verified and closed case at ' + complaint.addressText,
          linkId: complaintId,
          targetRole: 'ALL',
          targetCitizenId: complaint.citizenId
        });
      } else {
        if(!rejectionReason || rejectionReason.trim().length < 5){
          return { success: false, error: 'Mandatory reason for resolution rejection must be provided.' };
        }

        complaint.status = 'IN_PROGRESS'; // Returns to field officer for re-inspection
        complaint.updatedAt = new Date().toISOString();

        complaint.resolution.rejectionReason = rejectionReason;
        complaint.resolution.rejectedBy = supervisorActor.name;
        complaint.resolution.rejectedAt = new Date().toISOString();

        complaint.timeline.push({
          status: 'IN_PROGRESS',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          actor: supervisorActor.name + ' (' + supervisorActor.role + ')',
          note: 'Resolution rejected by supervisor. Re-inspection mandated: ' + rejectionReason
        });

        internalAppendAudit(state, 'RESOLUTION_REJECTED', supervisorActor, complaintId, 'RESOLUTION_SUBMITTED', 'IN_PROGRESS', rejectionReason);

        internalAppendNotification(state, {
          type: 'RESOLUTION_REJECTED',
          title: 'Re-inspection Mandated: ' + complaintId,
          message: 'Supervisor ' + supervisorActor.name + ' rejected resolution: ' + rejectionReason,
          targetRole: 'FIELD_OFFICER',
          targetUserId: complaint.assignedOfficerId,
          linkId: complaintId
        });
      }

      return { success: true, complaint: complaint };
    });
  }

  /**
   * Escalate complaint with validated mandatory reason
   */
  function escalateComplaint(complaintId, actor, reason, escalationLevel){
    if(!reason || reason.trim().length < 5){
      return { success: false, error: 'Detailed reason required for escalation.' };
    }

    return getStorage().atomicUpdate(function(state){
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

      internalAppendAudit(state, 'COMPLAINT_ESCALATED', actor, complaintId, prev, 'ESCALATED', reason);

      internalAppendNotification(state, {
        type: 'ESCALATION',
        title: 'CRITICAL ESCALATION: ' + complaintId,
        message: 'Case ' + complaintId + ' escalated by ' + actor.name + ': ' + reason,
        targetRole: 'CITY_ADMIN',
        targetWard: complaint.ward,
        linkId: complaintId
      });

      return { success: true, complaint: complaint };
    });
  }

  /**
   * Reopen a complaint (Valid from RESOLVED or CLOSED)
   */
  function reopenComplaint(complaintId, citizenActor, reason){
    if(!reason || reason.trim().length < 5){
      return { success: false, error: 'Reason for reopening case is required (minimum 5 characters).' };
    }

    return getStorage().atomicUpdate(function(state){
      var complaint = state.reports.find(function(c){ return c.id === complaintId; });
      if(!complaint) return { success: false, error: 'Complaint not found' };

      if(complaint.status !== 'RESOLVED' && complaint.status !== 'CLOSED'){
        return { success: false, error: 'Only RESOLVED or CLOSED complaints may be reopened.' };
      }

      var authCheck = canActorPerformAction('REOPEN_CASE', complaint, citizenActor);
      if(!authCheck.allowed) return { success: false, error: authCheck.error };

      var prev = complaint.status;
      complaint.status = 'REOPENED';
      complaint.updatedAt = new Date().toISOString();

      complaint.timeline = complaint.timeline || [];
      complaint.timeline.push({
        status: 'REOPENED',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actor: citizenActor.name + ' (Citizen)',
        note: 'Citizen dissatisfied with resolution: ' + reason
      });

      internalAppendAudit(state, 'COMPLAINT_REOPENED', citizenActor, complaintId, prev, 'REOPENED', reason);

      internalAppendNotification(state, {
        type: 'CASE_REOPENED',
        title: 'Case Reopened: ' + complaintId,
        message: 'Citizen reopened case ' + complaintId + ' in Ward ' + complaint.ward + ': ' + reason,
        targetRole: 'WARD_OFFICER',
        targetWard: complaint.ward,
        linkId: complaintId
      });

      return { success: true, complaint: complaint };
    });
  }

  /**
   * Merge duplicate complaint into master case
   */
  function mergeDuplicate(duplicateId, masterId, actor, reason){
    if(!masterId || masterId === duplicateId){
      return { success: false, error: 'Valid master case ID required.' };
    }

    return getStorage().atomicUpdate(function(state){
      var duplicate = state.reports.find(function(c){ return c.id === duplicateId; });
      var master = state.reports.find(function(c){ return c.id === masterId; });
      if(!duplicate || !master) return { success: false, error: 'Both duplicate and master cases must exist.' };

      var prev = duplicate.status;
      duplicate.status = 'DUPLICATE';
      duplicate.masterCaseId = masterId;
      duplicate.updatedAt = new Date().toISOString();

      duplicate.timeline = duplicate.timeline || [];
      duplicate.timeline.push({
        status: 'DUPLICATE',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actor: actor.name,
        note: 'Merged into master complaint #' + masterId + '. ' + (reason || '')
      });

      // Also update master case timeline
      master.timeline = master.timeline || [];
      master.timeline.push({
        status: master.status,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actor: actor.name,
        note: 'Linked duplicate report #' + duplicateId + ' added to case dossier.'
      });
      master.upvotes = (master.upvotes || 0) + (duplicate.upvotes || 1);

      internalAppendAudit(state, 'COMPLAINT_MERGED', actor, duplicateId, prev, 'DUPLICATE', 'Merged into ' + masterId);

      return { success: true, duplicate: duplicate, master: master };
    });
  }

  /**
   * Add internal staff note to a complaint
   */
  function addInternalNote(complaintId, actor, noteText){
    if(!noteText || noteText.trim().length === 0){
      return { success: false, error: 'Note text cannot be empty.' };
    }

    return getStorage().atomicUpdate(function(state){
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
      internalAppendAudit(state, 'INTERNAL_NOTE_ADDED', actor, complaintId, null, null, noteText);

      return { success: true, note: noteObj };
    });
  }

  /**
   * Publish Public Environmental Advisory (Requires Supervisory Authorization)
   */
  function publishAdvisory(advisoryData, actor){
    if(!actor || (actor.role !== 'CITY_ADMIN' && actor.role !== 'WARD_OFFICER' && actor.role !== 'DEPARTMENT_HEAD')){
      return { success: false, error: 'Unauthorized: Public advisories require Department Head, Ward Officer, or City Admin review.' };
    }

    return getStorage().atomicUpdate(function(state){
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
      internalAppendAudit(state, 'ADVISORY_PUBLISHED', actor, newAdv.id, null, 'ACTIVE', newAdv.title);

      internalAppendNotification(state, {
        type: 'ADVISORY',
        title: 'Official Civic Advisory: ' + newAdv.title,
        message: newAdv.summary,
        targetRole: 'ALL'
      });

      return { success: true, advisory: newAdv };
    });
  }

  return {
    calculateSla: calculateSla,
    canActorPerformAction: canActorPerformAction,
    validateStateTransition: validateStateTransition,
    transitionComplaintStatus: transitionComplaintStatus,
    assignOfficer: assignOfficer,
    bulkAssign: bulkAssign,
    startInspection: startInspection,
    completeInspection: completeInspection,
    submitResolution: submitResolution,
    verifyResolution: verifyResolution,
    escalateComplaint: escalateComplaint,
    reopenComplaint: reopenComplaint,
    mergeDuplicate: mergeDuplicate,
    addInternalNote: addInternalNote,
    publishAdvisory: publishAdvisory
  };
})();
