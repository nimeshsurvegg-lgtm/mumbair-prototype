/* ==============================================================================
   MumbAIR — Municipal Operations & Authority Portal Controller
   ============================================================================== */

window.MumbAIR = window.MumbAIR || {};

window.MumbAIR.OPERATIONS = (function(){
  'use strict';

  var CONFIG = window.MumbAIR.CONFIG;
  var STORAGE = window.MumbAIR.STORAGE;
  var WORKFLOW = window.MumbAIR.WORKFLOW;
  var UTILS = window.MumbAIR.UTILS;
  var AI = window.MumbAIR.AI;

  /**
   * Render Field Officer Operations View
   */
  function renderFieldOps(containerEl, currentUser){
    var state = STORAGE.loadState();
    var reports = state.reports || [];

    // Filter complaints assigned to this officer or in this officer's ward
    var assignedCases = reports.filter(function(r){
      return (r.assignedOfficer === currentUser.name || r.ward === currentUser.ward) &&
             r.status !== 'RESOLVED' && r.status !== 'CLOSED' && r.status !== 'REJECTED';
    });

    var completedCases = reports.filter(function(r){
      return (r.assignedOfficer === currentUser.name || r.ward === currentUser.ward) &&
             (r.status === 'ACTION_TAKEN' || r.status === 'RESOLUTION_SUBMITTED' || r.status === 'RESOLVED');
    });

    var html =
      '<div class="metric-grid">' +
        '<div class="metric-card info">' +
          '<div class="metric-header">Assigned Queue</div>' +
          '<div class="metric-val">' + assignedCases.length + '</div>' +
          '<div class="metric-sub">Active field cases in Ward ' + currentUser.ward + '</div>' +
        '</div>' +
        '<div class="metric-card alert">' +
          '<div class="metric-header">Urgent Tasks</div>' +
          '<div class="metric-val">' + assignedCases.filter(function(c){ return c.priority === 'URGENT' || c.category === 'INDUSTRIAL_EMISSIONS'; }).length + '</div>' +
          '<div class="metric-sub">Immediate inspection required</div>' +
        '</div>' +
        '<div class="metric-card success">' +
          '<div class="metric-header">Completed Tasks</div>' +
          '<div class="metric-val">' + completedCases.length + '</div>' +
          '<div class="metric-sub">Mitigated & submitted</div>' +
        '</div>' +
      '</div>' +

      '<div class="section-header" style="margin-top:20px;">' +
        '<div>' +
          '<div class="section-title">📋 Today\'s Operational Field Queue</div>' +
          '<div class="section-subtitle">Mobile-optimized case handling for Field Inspector ' + currentUser.name + ' (' + (currentUser.badge || 'BMC-FO') + ')</div>' +
        '</div>' +
      '</div>' +
      '<div id="fieldTasksContainer"></div>';

    containerEl.innerHTML = html;

    var tasksList = containerEl.querySelector('#fieldTasksContainer');
    if(assignedCases.length === 0){
      tasksList.innerHTML = '<div style="padding:40px; text-align:center; color:#64748B;">No pending assignments in your queue today.</div>';
      return;
    }

    assignedCases.forEach(function(c){
      var sla = WORKFLOW.calculateSla(c);
      var slaClass = sla.status === 'BREACHED' ? 'sla-breached' : (sla.status === 'DUE_SOON' ? 'sla-due-soon' : 'sla-on-track');
      var checklist = AI.generateInspectionChecklist(c.category);

      var card = document.createElement('div');
      card.className = 'field-task-card ' + (c.status === 'IN_PROGRESS' ? 'in-progress' : '');

      card.innerHTML =
        '<div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">' +
          '<div>' +
            '<span class="badge" style="background:#0F172A; color:#fff;">' + c.id + '</span>' +
            '<span style="font-weight:700; margin-left:8px; font-size:14px;">' + UTILS.escapeHtml(c.title) + '</span>' +
            '<div style="font-size:11.5px; color:#64748B; margin-top:2px;">📍 ' + c.addressText + ' &middot; Ward ' + c.ward + '</div>' +
          '</div>' +
          '<span class="sla-tag ' + slaClass + '">' + sla.label + '</span>' +
        '</div>' +
        '<p style="font-size:13px; color:#334155; margin:8px 0;">' + UTILS.escapeHtml(c.description) + '</p>' +

        '<div style="background:#F8FAFC; border:1px solid #E2E8F0; padding:12px; border-radius:6px; margin:10px 0;">' +
          '<div style="font-family:var(--font-mono); font-size:11px; font-weight:700; color:#0D9488; text-transform:uppercase; margin-bottom:6px;">' +
            '🤖 AI-Generated Field Protocol Checklist' +
          '</div>' +
          '<div class="field-checklist">' +
            checklist.map(function(item, idx){
              return '<label class="checklist-item"><input type="checkbox" id="chk_' + c.id + '_' + idx + '"> <span>' + item + '</span></label>';
            }).join('') +
          '</div>' +
        '</div>' +

        '<div style="display:flex; gap:10px; margin-top:14px; flex-wrap:wrap;">' +
          (c.status !== 'IN_PROGRESS'
            ? '<button class="btn btn-sm btn-primary" onclick="window.MumbAIR.OPERATIONS.startInspection(\'' + c.id + '\')">▶ Start Field Inspection</button>'
            : '<button class="btn btn-sm btn-accent" onclick="window.MumbAIR.OPERATIONS.submitResolutionModal(\'' + c.id + '\')">✓ Submit Resolution & Evidence</button>'
          ) +
          '<button class="btn btn-sm btn-secondary" onclick="window.MumbAIR.APP.viewReportTimeline(\'' + c.id + '\')">Timeline History</button>' +
        '</div>' +
        '<div id="timeline-' + c.id + '" class="resolution-timeline hidden"></div>';

      tasksList.appendChild(card);
    });
  }

  function startInspection(complaintId){
    var currentUser = window.MumbAIR.AUTH.getCurrentUser();
    var res = WORKFLOW.transitionComplaintStatus(
      complaintId,
      'IN_PROGRESS',
      currentUser,
      'Field inspector arrived at incident coordinates. Mitigation protocol started.'
    );
    if(res.success){
      window.MumbAIR.APP.showToast('Inspection initiated for ' + complaintId, '▶');
      window.MumbAIR.APP.renderCurrentRoleView();
    }
  }

  function submitResolutionModal(complaintId){
    var notes = prompt('Enter official action taken notes (e.g. Deployed high-pressure water sprinkler, quenched waste fire):');
    if(!notes) return;

    var currentUser = window.MumbAIR.AUTH.getCurrentUser();
    var res = WORKFLOW.transitionComplaintStatus(
      complaintId,
      'ACTION_TAKEN',
      currentUser,
      notes,
      true
    );

    if(res.success){
      window.MumbAIR.APP.showToast('Resolution submitted with photo proof verification!', '✅');
      window.MumbAIR.APP.renderCurrentRoleView();
    }
  }

  /**
   * Render Ward Officer Command Center View
   */
  function renderWardCommand(containerEl, currentUser){
    var state = STORAGE.loadState();
    var reports = state.reports || [];
    var wardCode = currentUser.ward === 'ALL' ? 'M/E' : currentUser.ward;

    var wardCases = reports.filter(function(r){ return r.ward === wardCode; });
    var unassignedCases = wardCases.filter(function(r){ return r.status === 'SUBMITTED' || r.status === 'UNDER_REVIEW'; });
    var inProgressCases = wardCases.filter(function(r){ return r.status === 'ASSIGNED' || r.status === 'IN_PROGRESS' || r.status === 'ACTION_TAKEN'; });
    var resolvedCases = wardCases.filter(function(r){ return r.status === 'RESOLVED' || r.status === 'CLOSED'; });

    var html =
      '<div class="metric-grid">' +
        '<div class="metric-card alert">' +
          '<div class="metric-header">Unassigned Complaints</div>' +
          '<div class="metric-val">' + unassignedCases.length + '</div>' +
          '<div class="metric-sub">Awaiting officer allocation in Ward ' + wardCode + '</div>' +
        '</div>' +
        '<div class="metric-card warning">' +
          '<div class="metric-header">Active Operations</div>' +
          '<div class="metric-val">' + inProgressCases.length + '</div>' +
          '<div class="metric-sub">Under field inspection</div>' +
        '</div>' +
        '<div class="metric-card success">' +
          '<div class="metric-header">Ward Resolved</div>' +
          '<div class="metric-val">' + resolvedCases.length + '</div>' +
          '<div class="metric-sub">Certified clean & compliant</div>' +
        '</div>' +
        '<div class="metric-card info">' +
          '<div class="metric-header">SLA Compliance</div>' +
          '<div class="metric-val">94.2%</div>' +
          '<div class="metric-sub">Average resolution: 18.4 hrs</div>' +
        '</div>' +
      '</div>' +

      '<div class="card" style="margin-top:20px;">' +
        '<div class="card-header">' +
          '<div class="card-title">📥 Unassigned Ward Complaints Queue</div>' +
          '<button class="btn btn-sm btn-accent" onclick="window.MumbAIR.OPERATIONS.publishAdvisoryModal(\'' + wardCode + '\')">📢 Issue Ward Advisory</button>' +
        '</div>' +
        '<div class="ops-table-container">' +
          '<table class="ops-table">' +
            '<thead>' +
              '<tr>' +
                '<th>Case ID</th>' +
                '<th>Category</th>' +
                '<th>Title / Street</th>' +
                '<th>Endorsements</th>' +
                '<th>SLA Status</th>' +
                '<th>Actions</th>' +
              '</tr>' +
            '</thead>' +
            '<tbody id="wardTbody">' +
            '</tbody>' +
          '</table>' +
        '</div>' +
      '</div>';

    containerEl.innerHTML = html;

    var tbody = containerEl.querySelector('#wardTbody');
    if(unassignedCases.length === 0){
      tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:24px; color:#64748B;">All complaints in Ward ' + wardCode + ' have been assigned.</td></tr>';
      return;
    }

    unassignedCases.forEach(function(c){
      var sla = WORKFLOW.calculateSla(c);
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td style="font-family:var(--font-mono); font-weight:700; color:var(--accent-teal);">' + c.id + '</td>' +
        '<td>' + c.category.replace(/_/g, ' ') + '</td>' +
        '<td><strong>' + UTILS.escapeHtml(c.title) + '</strong><br><span style="font-size:11px; color:#64748B;">' + c.addressText + '</span></td>' +
        '<td><span class="badge" style="background:#FEF3C7; color:#B45309;">👍 ' + c.upvotes + '</span></td>' +
        '<td><span class="sla-tag sla-' + (sla.status === 'BREACHED' ? 'breached' : 'on-track') + '">' + sla.label + '</span></td>' +
        '<td>' +
          '<button class="btn btn-sm btn-primary" onclick="window.MumbAIR.OPERATIONS.assignModal(\'' + c.id + '\')">Assign Officer</button>' +
        '</td>';
      tbody.appendChild(tr);
    });
  }

  function assignModal(complaintId){
    var officerName = prompt('Assign Field Officer (Enter name: Sanjay Shinde, Rahul Mane, or Anita Patil):', 'Officer Sanjay Shinde');
    if(!officerName) return;

    var currentUser = window.MumbAIR.AUTH.getCurrentUser();
    var officer = CONFIG.DEMO_USERS.find(function(u){ return u.name.includes(officerName) || u.role === 'FIELD_OFFICER'; }) || CONFIG.DEMO_USERS[1];

    var res = WORKFLOW.assignOfficer(complaintId, officer.id, currentUser, 'Dispatched under Ward Officer mandate.');
    if(res.success){
      window.MumbAIR.APP.showToast('Complaint ' + complaintId + ' assigned to ' + officer.name, '✅');
      window.MumbAIR.APP.renderCurrentRoleView();
    }
  }

  function publishAdvisoryModal(wardCode){
    var title = prompt('Enter Ward Air Quality / Civic Advisory Title:', 'Health Alert: Refrain from outdoor burning during high inversion');
    if(!title) return;

    window.MumbAIR.NOTIFICATIONS.dispatch({
      type: 'ALERT',
      title: 'Official Ward ' + wardCode + ' Advisory: ' + title,
      message: 'Issued by Ward Executive Officer. Citizens advised to take precautionary respiratory measures.',
      targetRole: 'ALL'
    });

    window.MumbAIR.APP.showToast('Public advisory broadcasted to all citizens in Ward ' + wardCode, '📢');
  }

  /**
   * Render City Administrator Operations
   */
  function renderCityCommand(containerEl){
    var state = STORAGE.loadState();
    var reports = state.reports || [];

    var html =
      '<div class="metric-grid">' +
        '<div class="metric-card info">' +
          '<div class="metric-header">City-Wide Volume</div>' +
          '<div class="metric-val">' + reports.length + '</div>' +
          '<div class="metric-sub">Active civic complaints logged</div>' +
        '</div>' +
        '<div class="metric-card alert">' +
          '<div class="metric-header">High Severity Hotspots</div>' +
          '<div class="metric-val">3 Wards</div>' +
          '<div class="metric-sub">M/E (Chembur), M/W (Deonar), G/S (Worli)</div>' +
        '</div>' +
        '<div class="metric-card success">' +
          '<div class="metric-header">City Resolution Rate</div>' +
          '<div class="metric-val">89.6%</div>' +
          '<div class="metric-sub">MCGM Clean Air Benchmark Target: 85%</div>' +
        '</div>' +
        '<div class="metric-card warning">' +
          '<div class="metric-header">Active GRAP Status</div>' +
          '<div class="metric-val" style="font-size:1.4rem; padding-top:4px;">GRAP STAGE II</div>' +
          '<div class="metric-sub">City-Wide Anti-Smog Gun Mandate</div>' +
        '</div>' +
      '</div>' +

      '<div class="card" style="margin-top:20px;">' +
        '<div class="card-header">' +
          '<div class="card-title">📊 24-Ward Municipal Compliance Matrix</div>' +
          '<button class="btn btn-sm btn-primary" onclick="window.MumbAIR.OPERATIONS.exportCityCsv()">📥 Export Full City Dataset (CSV)</button>' +
        '</div>' +
        '<div class="ops-table-container">' +
          '<table class="ops-table">' +
            '<thead>' +
              '<tr>' +
                '<th>Ward Code</th>' +
                '<th>Zone</th>' +
                '<th>Administrative Area</th>' +
                '<th>Primary CAAQMS Station</th>' +
                '<th>Primary Emission Vector</th>' +
              '</tr>' +
            '</thead>' +
            '<tbody>' +
              CONFIG.WARDS_DATA.slice(0, 8).map(function(w){
                return '<tr>' +
                  '<td style="font-family:var(--font-mono); font-weight:700;">' + w.code + '</td>' +
                  '<td>' + w.zone + '</td>' +
                  '<td><strong>' + w.name + '</strong></td>' +
                  '<td>' + w.station + '</td>' +
                  '<td style="font-size:12px; color:#475569;">' + w.defaultCause + '</td>' +
                '</tr>';
              }).join('') +
            '</tbody>' +
          '</table>' +
        '</div>' +
      '</div>';

    containerEl.innerHTML = html;
  }

  /**
   * Render Super Admin Audit Logs View
   */
  function renderSystemAdmin(containerEl){
    var state = STORAGE.loadState();
    var logs = state.auditLogs || [];

    var html =
      '<div class="section-header">' +
        '<div>' +
          '<div class="section-title">🔒 Immutable System Audit Trail</div>' +
          '<div class="section-subtitle">Real-time ledger of administrative state changes, assignments, status transitions, and role provisioning</div>' +
        '</div>' +
      '</div>' +
      '<div class="ops-table-container">' +
        '<table class="ops-table">' +
          '<thead>' +
            '<tr>' +
              '<th>Audit ID</th>' +
              '<th>Timestamp</th>' +
              '<th>Action</th>' +
              '<th>Actor</th>' +
              '<th>Target Record</th>' +
              '<th>Details / Notes</th>' +
            '</tr>' +
          '</thead>' +
          '<tbody>' +
            (logs.length === 0
              ? '<tr><td colspan="6" style="text-align:center; padding:24px; color:#64748B;">No audit entries logged yet.</td></tr>'
              : logs.map(function(l){
                  return '<tr>' +
                    '<td style="font-family:var(--font-mono); font-size:11px;">' + l.id + '</td>' +
                    '<td style="font-family:var(--font-mono); font-size:11px;">' + UTILS.formatDateTime(l.timestamp) + '</td>' +
                    '<td><span class="audit-log-badge">' + l.action + '</span></td>' +
                    '<td><strong>' + l.actorName + '</strong> (' + l.actorRole + ')</td>' +
                    '<td style="font-family:var(--font-mono); font-weight:700;">' + (l.recordId || 'SYSTEM') + '</td>' +
                    '<td style="font-size:12px; color:#475569;">' + UTILS.escapeHtml(l.notes) + '</td>' +
                  '</tr>';
                }).join('')
            ) +
          '</tbody>' +
        '</table>' +
      '</div>';

    containerEl.innerHTML = html;
  }

  function exportCityCsv(){
    var state = STORAGE.loadState();
    var rows = [
      ['Complaint ID', 'Ward', 'Category', 'Title', 'Status', 'Endorsements', 'Submitted Date', 'Assigned Officer']
    ];

    (state.reports || []).forEach(function(r){
      rows.push([
        r.id,
        r.ward,
        r.category,
        '"' + r.title.replace(/"/g, '""') + '"',
        r.status,
        r.upvotes,
        r.createdAt,
        r.assignedOfficer || 'Unassigned'
      ]);
    });

    var csvContent = 'data:text/csv;charset=utf-8,' + rows.map(function(e){ return e.join(','); }).join('\n');
    var encodedUri = encodeURI(csvContent);
    var link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'MCGM_MumbAIR_Complaints_' + new Date().toISOString().slice(0, 10) + '.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.MumbAIR.APP.showToast('Full municipal operational dataset exported to CSV.', '📥');
  }

  return {
    renderFieldOps: renderFieldOps,
    startInspection: startInspection,
    submitResolutionModal: submitResolutionModal,
    renderWardCommand: renderWardCommand,
    assignModal: assignModal,
    publishAdvisoryModal: publishAdvisoryModal,
    renderCityCommand: renderCityCommand,
    renderSystemAdmin: renderSystemAdmin,
    exportCityCsv: exportCityCsv
  };
})();
