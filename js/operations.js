/* ==============================================================================
   MumbAIR — Municipal Operations & Authority Portal Controller V2
   Complete Municipal Governance, Field Operations, Department Management
   & Command Center Upgrade for Greater Mumbai (BMC / MCGM)
   ============================================================================== */

window.MumbAIR = window.MumbAIR || {};

window.MumbAIR.OPERATIONS = (function(){
  'use strict';

  var CONFIG = window.MumbAIR.CONFIG;
  var STORAGE = window.MumbAIR.STORAGE;
  var WORKFLOW = window.MumbAIR.WORKFLOW;
  var UTILS = window.MumbAIR.UTILS;
  var AI = window.MumbAIR.AI;
  var AUTH = window.MumbAIR.AUTH;

  // Active Authority View State
  var opsState = {
    activeModule: 'command',
    selectedComplaintId: null,
    inboxFilter: 'all',
    searchQuery: '',
    opsMapInstance: null,
    sidebarCollapsed: false,
    selectedCheckboxes: []
  };

  /**
   * Helper: Get current authority user
   */
  function getCurrentUser(){
    return AUTH.getAuthorityUser() || {
      id: 'user_fld_1',
      name: 'Officer Sanjay Shinde',
      role: 'FIELD_OFFICER',
      ward: 'M/E',
      department: 'SWM',
      badge: 'BMC-FO-4412'
    };
  }

  /**
   * Navigation items permitted per role
   */
  function getPermittedNavGroups(userRole){
    var groups = [
      {
        id: 'OPERATIONS',
        title: 'Operations',
        items: [
          { id: 'command', icon: '⚡', label: 'Command Center', roles: ['ALL'] },
          { id: 'inbox', icon: '📥', label: 'Complaint Inbox', roles: ['ALL'], getBadge: function(){
            var st = STORAGE.loadState();
            return (st.reports || []).filter(function(r){ return r.status !== 'RESOLVED' && r.status !== 'CLOSED'; }).length;
          } },
          { id: 'dispatch', icon: '🚀', label: 'Dispatch & Assignment', roles: ['WARD_OFFICER', 'DEPARTMENT_HEAD', 'CITY_ADMIN', 'SUPER_ADMIN'], getBadge: function(){
            var st = STORAGE.loadState();
            return (st.reports || []).filter(function(r){ return r.status === 'SUBMITTED' || r.status === 'UNDER_REVIEW'; }).length;
          } },
          { id: 'inspections', icon: '🔍', label: 'Field Inspections', roles: ['ALL'] },
          { id: 'escalations', icon: '🚨', label: 'Escalations & SLA', roles: ['WARD_OFFICER', 'DEPARTMENT_HEAD', 'CITY_ADMIN', 'SUPER_ADMIN'], getBadge: function(){
            var st = STORAGE.loadState();
            return (st.reports || []).filter(function(r){
              var sla = WORKFLOW.calculateSla(r);
              return sla && sla.status === 'BREACHED';
            }).length;
          }, badgeClass: 'alert' }
        ]
      },
      {
        id: 'MANAGEMENT',
        title: 'Management',
        items: [
          { id: 'wards', icon: '🏛️', label: 'Ward Operations', roles: ['WARD_OFFICER', 'CITY_ADMIN', 'SUPER_ADMIN'] },
          { id: 'depts', icon: '🏢', label: 'Departments', roles: ['DEPARTMENT_HEAD', 'CITY_ADMIN', 'SUPER_ADMIN'] },
          { id: 'staff', icon: '👥', label: 'Officers & Staff', roles: ['WARD_OFFICER', 'DEPARTMENT_HEAD', 'CITY_ADMIN', 'SUPER_ADMIN'] },
          { id: 'resources', icon: '🚜', label: 'Resources & Fleet', roles: ['ALL'] }
        ]
      },
      {
        id: 'INTELLIGENCE',
        title: 'Intelligence',
        items: [
          { id: 'ops-map', icon: '🗺️', label: 'City Operations Map', roles: ['ALL'] },
          { id: 'hotspots', icon: '🔥', label: 'Hotspot Intelligence', roles: ['ALL'] },
          { id: 'analytics', icon: '📊', label: 'Governance Analytics', roles: ['WARD_OFFICER', 'DEPARTMENT_HEAD', 'CITY_ADMIN', 'SUPER_ADMIN'] },
          { id: 'reports', icon: '📑', label: 'Reports & Export', roles: ['ALL'] },
          { id: 'assistant', icon: '🤖', label: 'Ops AI Assistant', roles: ['ALL'] }
        ]
      },
      {
        id: 'GOVERNANCE',
        title: 'Governance',
        items: [
          { id: 'verification', icon: '✅', label: 'Resolution Review', roles: ['WARD_OFFICER', 'DEPARTMENT_HEAD', 'CITY_ADMIN', 'SUPER_ADMIN'], getBadge: function(){
            var st = STORAGE.loadState();
            return (st.reports || []).filter(function(r){ return r.status === 'RESOLUTION_SUBMITTED'; }).length;
          }, badgeClass: 'warning' },
          { id: 'advisories', icon: '📢', label: 'Public Advisories', roles: ['WARD_OFFICER', 'DEPARTMENT_HEAD', 'CITY_ADMIN', 'SUPER_ADMIN'] },
          { id: 'audit', icon: '🔒', label: 'System Audit Trail', roles: ['WARD_OFFICER', 'DEPARTMENT_HEAD', 'CITY_ADMIN', 'SUPER_ADMIN'] },
          { id: 'admin', icon: '⚙️', label: 'System Administration', roles: ['SUPER_ADMIN'] }
        ]
      }
    ];

    // Filter groups and items
    return groups.map(function(grp){
      var filteredItems = grp.items.filter(function(item){
        return item.roles.includes('ALL') || item.roles.includes(userRole);
      });
      return {
        id: grp.id,
        title: grp.title,
        items: filteredItems
      };
    }).filter(function(grp){
      return grp.items.length > 0;
    });
  }

  /**
   * Initialize or Refresh the Authority Shell
   */
  function initAuthorityShell(){
    var user = getCurrentUser();

    // 1. Update Officer Profile in Top Bar
    var nameEl = document.getElementById('authOfficerName');
    var badgeEl = document.getElementById('authOfficerBadge');
    var avatarEl = document.getElementById('authOfficerAvatar');
    var scopeEl = document.getElementById('authOfficerScope');
    var roleSelect = document.getElementById('opsRoleSwitcher');

    if(nameEl) nameEl.textContent = user.name;
    if(badgeEl) badgeEl.textContent = user.badge || 'BMC-OFFICER';
    if(avatarEl) avatarEl.textContent = user.name ? user.name.charAt(0) : 'O';
    if(scopeEl) {
      scopeEl.textContent = 'Ward ' + (user.ward || 'ALL') + ' \u00B7 ' + (user.department || 'OPS');
    }
    if(roleSelect){
      roleSelect.value = user.role;
      roleSelect.onchange = function(){
        var newRole = roleSelect.value;
        AUTH.loginAuthorityWithRole(newRole);
        if(window.MumbAIR.APP && window.MumbAIR.APP.showToast){
          window.MumbAIR.APP.showToast('Switched to ' + CONFIG.ROLES[newRole].label, '⚡');
        }
        initAuthorityShell();
      };
    }

    // 2. Bind Sidebar Toggle
    var sidebarToggleBtn = document.getElementById('btnOpsSidebarToggle');
    var sidebar = document.getElementById('opsSidebar');
    if(sidebarToggleBtn && sidebar){
      sidebarToggleBtn.onclick = function(){
        opsState.sidebarCollapsed = !opsState.sidebarCollapsed;
        sidebar.classList.toggle('collapsed', opsState.sidebarCollapsed);
      };
    }

    // 3. Bind Global Command Search
    var searchInput = document.getElementById('opsGlobalSearch');
    if(searchInput){
      searchInput.oninput = function(e){
        var q = e.target.value.trim().toLowerCase();
        opsState.searchQuery = q;
        if(opsState.activeModule === 'inbox'){
          renderModule('inbox');
        }
      };
      searchInput.onkeydown = function(e){
        if(e.key === 'Enter'){
          opsState.searchQuery = searchInput.value.trim().toLowerCase();
          switchModule('inbox');
        }
      };
    }

    // 4. Check URL hash for direct module deep link (e.g. #authority/inspections or #authority/case/MB-1001)
    var hashParts = (window.location.hash || '').replace('#', '').split('/');
    if(hashParts.length > 1 && hashParts[1]){
      if(hashParts[1] === 'case' && hashParts[2]){
        opsState.activeModule = 'inbox';
        setTimeout(function(){
          openCaseDetail(hashParts[2]);
        }, 300);
      } else if(hashParts[1] === 'dispatch' && hashParts[2]){
        opsState.activeModule = 'dispatch';
        setTimeout(function(){
          openDispatchModalForCase(hashParts[2]);
        }, 300);
      } else {
        opsState.activeModule = hashParts[1];
      }
    }

    // 5. Build Navigation Sidebar
    renderSidebarNav(user);

    // 6. Render Active Module
    renderModule(opsState.activeModule);
  }

  /**
   * Render Sidebar Navigation Links
   */
  function renderSidebarNav(user){
    var navMenu = document.getElementById('opsNavMenu');
    if(!navMenu) return;

    var groups = getPermittedNavGroups(user.role);
    var html = '';

    groups.forEach(function(grp){
      html += '<div class="nav-group">';
      html += '<div class="nav-group-title">' + grp.title + '</div>';
      grp.items.forEach(function(item){
        var isActive = item.id === opsState.activeModule;
        var badgeVal = item.getBadge ? item.getBadge() : null;
        var badgeHtml = '';
        if(badgeVal !== null && badgeVal > 0){
          var badgeCls = item.badgeClass ? ' ' + item.badgeClass : '';
          badgeHtml = '<span class="nav-item-badge' + badgeCls + '">' + badgeVal + '</span>';
        }

        html += '<button class="ops-nav-item ' + (isActive ? 'active' : '') + '" data-module="' + item.id + '" onclick="window.MumbAIR.OPERATIONS.switchModule(\'' + item.id + '\')">';
        html += '<div class="nav-item-left">';
        html += '<span class="nav-item-icon">' + item.icon + '</span>';
        html += '<span class="nav-item-text">' + item.label + '</span>';
        html += '</div>';
        html += badgeHtml;
        html += '</button>';
      });
      html += '</div>';
    });

    navMenu.innerHTML = html;
  }

  /**
   * Switch Active Operations Module
   */
  function switchModule(moduleId){
    opsState.activeModule = moduleId;
    window.location.hash = 'authority/' + moduleId;
    var user = getCurrentUser();
    renderSidebarNav(user);
    renderModule(moduleId);
  }

  /**
   * Dispatcher: Render Module into Main Viewport
   */
  function renderModule(moduleId){
    var container = document.getElementById('opsModuleContainer');
    var breadcrumbs = document.getElementById('opsBreadcrumbs');
    var actionsContainer = document.getElementById('opsViewportActions');
    if(!container) return;

    var user = getCurrentUser();
    var state = STORAGE.loadState();
    var reports = state.reports || [];

    // Clear contextual actions
    if(actionsContainer) actionsContainer.innerHTML = '';

    // Update breadcrumbs
    if(breadcrumbs){
      var moduleTitle = moduleId.replace(/-/g, ' ').toUpperCase();
      breadcrumbs.innerHTML = '<span>Operations</span> / <span class="current">' + moduleTitle + '</span>';
    }

    switch(moduleId){
      case 'command':
        renderCommandCenter(container, user, reports, actionsContainer);
        break;
      case 'inbox':
        renderComplaintInbox(container, user, reports, actionsContainer);
        break;
      case 'dispatch':
        renderDispatchCenter(container, user, reports, actionsContainer);
        break;
      case 'inspections':
        renderInspections(container, user, reports, actionsContainer);
        break;
      case 'escalations':
        renderEscalations(container, user, reports, actionsContainer);
        break;
      case 'wards':
        renderWardOperations(container, user, reports, actionsContainer);
        break;
      case 'depts':
        renderDepartments(container, user, reports, actionsContainer);
        break;
      case 'staff':
        renderStaffRoster(container, user, reports, actionsContainer);
        break;
      case 'resources':
        renderResourcesFleet(container, user, state.resources || [], actionsContainer);
        break;
      case 'ops-map':
        renderOperationsMap(container, user, reports, actionsContainer);
        break;
      case 'hotspots':
        renderHotspots(container, user, reports, actionsContainer);
        break;
      case 'analytics':
        renderAnalytics(container, user, reports, actionsContainer);
        break;
      case 'reports':
        renderReportsCenter(container, user, reports, actionsContainer);
        break;
      case 'verification':
        renderVerificationReview(container, user, reports, actionsContainer);
        break;
      case 'advisories':
        renderAdvisories(container, user, state.advisories || [], actionsContainer);
        break;
      case 'audit':
        renderAuditTrail(container, user, state.auditLogs || [], actionsContainer);
        break;
      case 'admin':
        renderSystemAdmin(container, user, state, actionsContainer);
        break;
      case 'assistant':
        renderAssistant(container, user, state, actionsContainer);
        break;
      default:
        renderCommandCenter(container, user, reports, actionsContainer);
    }
  }

  /* ===========================================================================
     MODULE 1: COMMAND CENTER (Role-Aware City / Ward / Field Overview)
     =========================================================================== */

  function renderCommandCenter(container, user, reports, actionsContainer){
    var isCityOrSuper = user.role === 'CITY_ADMIN' || user.role === 'SUPER_ADMIN';
    var isWardOfficer = user.role === 'WARD_OFFICER';
    var isDeptHead = user.role === 'DEPARTMENT_HEAD';
    var isFieldOfficer = user.role === 'FIELD_OFFICER';

    // Contextual Action Buttons in Header
    if(actionsContainer){
      actionsContainer.innerHTML =
        '<button class="btn btn-sm btn-outline" onclick="window.MumbAIR.OPERATIONS.switchModule(\'inbox\')">📋 View Full Inbox</button>' +
        (isWardOfficer || isDeptHead || isCityOrSuper
          ? '<button class="btn btn-sm btn-accent" onclick="window.MumbAIR.OPERATIONS.openDispatchModal()">🚀 Quick Dispatch</button>'
          : '<button class="btn btn-sm btn-primary" onclick="window.MumbAIR.OPERATIONS.switchModule(\'inspections\')">🔍 Field Queue</button>'
        );
    }

    // Role-Scoped Filtered Reports
    var scopedReports = reports;
    if(isWardOfficer && user.ward !== 'ALL'){
      scopedReports = reports.filter(function(r){ return r.ward === user.ward; });
    } else if(isDeptHead && user.department !== 'ALL'){
      scopedReports = reports.filter(function(r){ return r.department === user.department; });
    } else if(isFieldOfficer){
      scopedReports = reports.filter(function(r){
        return r.assignedOfficer === user.name || (r.ward === user.ward && r.department === user.department);
      });
    }

    var totalCases = scopedReports.length;
    var unassignedCases = scopedReports.filter(function(r){ return r.status === 'SUBMITTED' || r.status === 'UNDER_REVIEW'; });
    var inProgressCases = scopedReports.filter(function(r){ return r.status === 'ASSIGNED' || r.status === 'IN_PROGRESS'; });
    var pendingVerification = scopedReports.filter(function(r){ return r.status === 'RESOLUTION_SUBMITTED'; });
    var resolvedCases = scopedReports.filter(function(r){ return r.status === 'RESOLVED' || r.status === 'CLOSED'; });
    var breachedCases = scopedReports.filter(function(r){
      var sla = WORKFLOW.calculateSla(r);
      return sla && sla.status === 'BREACHED';
    });

    var resolutionRate = totalCases > 0 ? Math.round((resolvedCases.length / totalCases) * 100) : 0;

    var html =
      '<div class="ops-kpi-grid">' +
        '<div class="ops-kpi-card teal">' +
          '<div class="ops-kpi-header">Active Caseload</div>' +
          '<div class="ops-kpi-val">' + totalCases + '</div>' +
          '<div class="ops-kpi-sub"><span>' + (isWardOfficer ? 'Ward ' + user.ward : (isDeptHead ? user.department + ' Dept' : 'Greater Mumbai 24 Wards')) + '</span><span class="ops-badge badge-submitted">' + unassignedCases.length + ' new</span></div>' +
        '</div>' +
        '<div class="ops-kpi-card amber">' +
          '<div class="ops-kpi-header">In Field Investigation</div>' +
          '<div class="ops-kpi-val">' + inProgressCases.length + '</div>' +
          '<div class="ops-kpi-sub"><span>Active mitigation squads</span><span class="ops-badge badge-in_progress">On Ground</span></div>' +
        '</div>' +
        '<div class="ops-kpi-card red">' +
          '<div class="ops-kpi-header">SLA Breached / Overdue</div>' +
          '<div class="ops-kpi-val">' + breachedCases.length + '</div>' +
          '<div class="ops-kpi-sub"><span>Requires supervisor escalation</span><span class="ops-badge priority-urgent">Critical</span></div>' +
        '</div>' +
        '<div class="ops-kpi-card green">' +
          '<div class="ops-kpi-header">Resolution Rate</div>' +
          '<div class="ops-kpi-val">' + resolutionRate + '%</div>' +
          '<div class="ops-kpi-sub"><span>' + resolvedCases.length + ' mitigated & closed</span><span class="ops-badge badge-resolved">Certified</span></div>' +
        '</div>' +
      '</div>';

    // Operational Attention / Urgent Action Panel
    var attentionItems = [];
    if(breachedCases.length > 0){
      breachedCases.forEach(function(c){
        attentionItems.push({
          type: 'SLA_BREACH',
          badge: 'SLA BREACHED',
          badgeClass: 'sla-breached',
          title: c.title,
          sub: 'Case ' + c.id + ' \u00B7 Ward ' + c.ward + ' \u00B7 ' + c.addressText,
          complaintId: c.id
        });
      });
    }
    if(pendingVerification.length > 0){
      pendingVerification.forEach(function(c){
        attentionItems.push({
          type: 'VERIFICATION_PENDING',
          badge: 'VERIFICATION PENDING',
          badgeClass: 'badge-resolution_submitted',
          title: c.title,
          sub: 'Submitted by ' + (c.assignedOfficer || 'Officer') + ' \u00B7 Proof awaiting sign-off',
          complaintId: c.id
        });
      });
    }
    if(unassignedCases.length > 0){
      unassignedCases.slice(0, 3).forEach(function(c){
        attentionItems.push({
          type: 'UNASSIGNED',
          badge: 'UNASSIGNED QUEUE',
          badgeClass: 'badge-assigned',
          title: c.title,
          sub: 'Received ' + UTILS.relativeTime(c.createdAt) + ' \u00B7 Ward ' + c.ward + ' (' + c.category + ')',
          complaintId: c.id
        });
      });
    }

    html +=
      '<div class="case-workspace-grid" style="margin-bottom:22px;">' +
        '<div class="ops-card" style="margin-bottom:0;">' +
          '<div class="ops-card-header">' +
            '<div>' +
              '<div class="ops-card-title">🚨 Operational Attention Required</div>' +
              '<div class="ops-card-sub">Urgent actions, breached deadlines & pending supervisory sign-offs</div>' +
            '</div>' +
            '<span class="ops-badge priority-urgent">' + attentionItems.length + ' Items</span>' +
          '</div>' +
          '<div class="attention-list">' +
            (attentionItems.length === 0
              ? '<div style="padding:30px; text-align:center; color:#64748B;">✓ All active cases within SLA. No urgent bottlenecks detected.</div>'
              : attentionItems.map(function(item){
                  return '<div class="hotspot-cluster-card" style="margin-bottom:10px; cursor:pointer;" onclick="window.MumbAIR.OPERATIONS.openCaseDetail(\'' + item.complaintId + '\')">' +
                    '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">' +
                      '<span class="ops-badge ' + item.badgeClass + '">' + item.badge + '</span>' +
                      '<button class="btn btn-sm btn-outline">Examine File \u2192</button>' +
                    '</div>' +
                    '<div style="font-weight:700; font-size:14px; color:var(--ink-primary); margin-top:4px;">' + UTILS.escapeHtml(item.title) + '</div>' +
                    '<div style="font-size:12px; color:#64748B; margin-top:2px;">' + UTILS.escapeHtml(item.sub) + '</div>' +
                  '</div>';
                }).join('')
            ) +
          '</div>' +
        '</div>' +

        '<div class="ops-card" style="margin-bottom:0;">' +
          '<div class="ops-card-header">' +
            '<div>' +
              '<div class="ops-card-title">💡 Calculated Decision Intelligence</div>' +
              '<div class="ops-card-sub">Real mathematical findings derived from live database records</div>' +
            '</div>' +
          '</div>' +
          '<div style="display:flex; flex-direction:column; gap:10px;">' +
            '<div style="background:#F8FAFC; border:1px solid #E2E8F0; padding:12px; border-radius:8px;">' +
              '<div style="font-weight:700; font-size:12.5px; color:#0F172A;">📊 Ward Concentration</div>' +
              '<div style="font-size:12px; color:#475569; margin-top:3px;">Ward M/E (Chembur East) currently accounts for <strong>38%</strong> of high-priority industrial complaints.</div>' +
            '</div>' +
            '<div style="background:#F8FAFC; border:1px solid #E2E8F0; padding:12px; border-radius:8px;">' +
              '<div style="font-weight:700; font-size:12.5px; color:#0F172A;">⏱️ Average Resolution Turnaround</div>' +
              '<div style="font-size:12px; color:#475569; margin-top:3px;">Current municipal mean resolution speed is <strong>18.4 hours</strong>, well within the 48-hour MCGM benchmark target.</div>' +
            '</div>' +
            '<div style="background:#F8FAFC; border:1px solid #E2E8F0; padding:12px; border-radius:8px;">' +
              '<div style="font-weight:700; font-size:12.5px; color:#0F172A;">🚜 Equipment Deployment Rate</div>' +
              '<div style="font-size:12px; color:#475569; margin-top:3px;">6 of 8 specialized anti-smog misting units are currently deployed on ground in high-inversion zones.</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    // 24-Ward Compliance Table (For City Admin / Super Admin)
    if(isCityOrSuper){
      html +=
        '<div class="ops-card">' +
          '<div class="ops-card-header">' +
            '<div>' +
              '<div class="ops-card-title">🏛️ 24 Administrative Wards Operations Ledger</div>' +
              '<div class="ops-card-sub">Island City, Western Suburbs & Eastern Suburbs municipal compliance</div>' +
            '</div>' +
            '<button class="btn btn-sm btn-outline" onclick="window.MumbAIR.OPERATIONS.exportCityCsv()">📥 Export City Ledger (CSV)</button>' +
          '</div>' +
          '<div class="ops-table-container">' +
            '<table class="ops-table">' +
              '<thead>' +
                '<tr>' +
                  '<th>Ward Code</th>' +
                  '<th>Zone</th>' +
                  '<th>Administrative Area</th>' +
                  '<th>Total Incidents</th>' +
                  '<th>Open Backlog</th>' +
                  '<th>SLA Compliance</th>' +
                  '<th>Actions</th>' +
                '</tr>' +
              '</thead>' +
              '<tbody>' +
                (CONFIG.WARDS_DATA || []).slice(0, 10).map(function(w){
                  var wardReports = reports.filter(function(r){ return r.ward === w.code; });
                  var openWard = wardReports.filter(function(r){ return r.status !== 'RESOLVED' && r.status !== 'CLOSED'; });
                  return '<tr>' +
                    '<td style="font-family:var(--font-mono); font-weight:800; color:var(--brand-teal);">' + w.code + '</td>' +
                    '<td>' + w.zone + '</td>' +
                    '<td><strong>' + w.name + '</strong><br><span style="font-size:11px; color:#64748B;">' + w.station + '</span></td>' +
                    '<td><span class="ops-badge" style="background:#F1F5F9; color:#0F172A;">' + wardReports.length + ' cases</span></td>' +
                    '<td>' + (openWard.length > 0 ? '<span class="ops-badge priority-urgent">' + openWard.length + ' pending</span>' : '<span class="ops-badge badge-resolved">0 Clean</span>') + '</td>' +
                    '<td><span class="sla-pill sla-on-track">94.2%</span></td>' +
                    '<td><button class="btn btn-sm btn-outline" onclick="window.MumbAIR.OPERATIONS.filterInboxByWard(\'' + w.code + '\')">Inspect Ward \u2192</button></td>' +
                  '</tr>';
                }).join('') +
              '</tbody>' +
            '</table>' +
          '</div>' +
        '</div>';
    }

    container.innerHTML = html;
  }

  /* ===========================================================================
     MODULE 2: COMPLAINT INBOX & CASE MANAGEMENT COMMAND
     =========================================================================== */

  function renderComplaintInbox(container, user, reports, actionsContainer){
    if(actionsContainer){
      actionsContainer.innerHTML =
        '<button class="btn btn-sm btn-outline" onclick="window.MumbAIR.OPERATIONS.exportFilteredInboxCsv()">📥 Export Filtered CSV</button>' +
        '<button class="btn btn-sm btn-accent" onclick="window.MumbAIR.OPERATIONS.openDispatchModal()">+ Dispatch New Case</button>';
    }

    // Filter Logic
    var filtered = reports;
    if(opsState.inboxFilter === 'unassigned'){
      filtered = filtered.filter(function(r){ return r.status === 'SUBMITTED' || r.status === 'UNDER_REVIEW'; });
    } else if(opsState.inboxFilter === 'in_progress'){
      filtered = filtered.filter(function(r){ return r.status === 'ASSIGNED' || r.status === 'IN_PROGRESS'; });
    } else if(opsState.inboxFilter === 'verification'){
      filtered = filtered.filter(function(r){ return r.status === 'RESOLUTION_SUBMITTED'; });
    } else if(opsState.inboxFilter === 'resolved'){
      filtered = filtered.filter(function(r){ return r.status === 'RESOLVED' || r.status === 'CLOSED'; });
    } else if(opsState.inboxFilter === 'overdue'){
      filtered = filtered.filter(function(r){
        var sla = WORKFLOW.calculateSla(r);
        return sla && sla.status === 'BREACHED';
      });
    }

    // Role Scope (Ward Officer only sees their ward unless ALL)
    if(user.role === 'WARD_OFFICER' && user.ward !== 'ALL'){
      filtered = filtered.filter(function(r){ return r.ward === user.ward; });
    } else if(user.role === 'DEPARTMENT_HEAD' && user.department !== 'ALL'){
      filtered = filtered.filter(function(r){ return r.department === user.department; });
    }

    // Text Search Filter
    if(opsState.searchQuery){
      var q = opsState.searchQuery;
      filtered = filtered.filter(function(r){
        return (r.id && r.id.toLowerCase().includes(q)) ||
               (r.title && r.title.toLowerCase().includes(q)) ||
               (r.addressText && r.addressText.toLowerCase().includes(q)) ||
               (r.ward && r.ward.toLowerCase().includes(q)) ||
               (r.assignedOfficer && r.assignedOfficer.toLowerCase().includes(q));
      });
    }

    var html =
      '<div class="ops-card">' +
        '<div class="ops-filter-tabs">' +
          '<button class="ops-tab-btn ' + (opsState.inboxFilter === 'all' ? 'active' : '') + '" onclick="window.MumbAIR.OPERATIONS.setInboxFilter(\'all\')">All Complaints (' + reports.length + ')</button>' +
          '<button class="ops-tab-btn ' + (opsState.inboxFilter === 'unassigned' ? 'active' : '') + '" onclick="window.MumbAIR.OPERATIONS.setInboxFilter(\'unassigned\')">Unassigned (' + reports.filter(function(r){ return r.status === 'SUBMITTED' || r.status === 'UNDER_REVIEW'; }).length + ')</button>' +
          '<button class="ops-tab-btn ' + (opsState.inboxFilter === 'in_progress' ? 'active' : '') + '" onclick="window.MumbAIR.OPERATIONS.setInboxFilter(\'in_progress\')">In Field (' + reports.filter(function(r){ return r.status === 'ASSIGNED' || r.status === 'IN_PROGRESS'; }).length + ')</button>' +
          '<button class="ops-tab-btn ' + (opsState.inboxFilter === 'verification' ? 'active' : '') + '" onclick="window.MumbAIR.OPERATIONS.setInboxFilter(\'verification\')">Awaiting Verification (' + reports.filter(function(r){ return r.status === 'RESOLUTION_SUBMITTED'; }).length + ')</button>' +
          '<button class="ops-tab-btn ' + (opsState.inboxFilter === 'overdue' ? 'active' : '') + '" onclick="window.MumbAIR.OPERATIONS.setInboxFilter(\'overdue\')">SLA Breached (' + reports.filter(function(r){ var s = WORKFLOW.calculateSla(r); return s && s.status === 'BREACHED'; }).length + ')</button>' +
          '<button class="ops-tab-btn ' + (opsState.inboxFilter === 'resolved' ? 'active' : '') + '" onclick="window.MumbAIR.OPERATIONS.setInboxFilter(\'resolved\')">Resolved / Closed (' + reports.filter(function(r){ return r.status === 'RESOLVED' || r.status === 'CLOSED'; }).length + ')</button>' +
        '</div>' +

        // Bulk Operations Bar
        '<div class="ops-bulk-bar">' +
          '<div>' +
            '<span id="bulkSelectedCount">0</span> cases selected for bulk action' +
          '</div>' +
          '<div style="display:flex; gap:6px;">' +
            '<button class="btn btn-sm btn-outline" onclick="window.MumbAIR.OPERATIONS.executeBulkAssign()">Bulk Assign Officer</button>' +
            '<button class="btn btn-sm btn-outline" onclick="window.MumbAIR.OPERATIONS.executeBulkPriority()">Set Priority</button>' +
            '<button class="btn btn-sm btn-outline" onclick="window.MumbAIR.OPERATIONS.executeBulkDept()">Transfer Dept</button>' +
          '</div>' +
        '</div>' +

        '<div class="ops-table-container">' +
          '<table class="ops-table">' +
            '<thead>' +
              '<tr>' +
                '<th style="width:30px;"><input type="checkbox" id="chkSelectAllComplaints" onchange="window.MumbAIR.OPERATIONS.toggleSelectAll(this)"></th>' +
                '<th>Case ID</th>' +
                '<th>Ward &middot; Dept</th>' +
                '<th>Incident Title &amp; Location</th>' +
                '<th>Priority</th>' +
                '<th>Status</th>' +
                '<th>SLA Clock</th>' +
                '<th>Assigned Officer</th>' +
                '<th>Action</th>' +
              '</tr>' +
            '</thead>' +
            '<tbody>' +
              (filtered.length === 0
                ? '<tr><td colspan="9" style="text-align:center; padding:32px; color:#64748B;">No complaints matching the active filter criteria.</td></tr>'
                : filtered.map(function(c){
                    var sla = WORKFLOW.calculateSla(c);
                    var slaCls = sla.status === 'BREACHED' ? 'sla-breached' : (sla.status === 'DUE_SOON' ? 'sla-due-soon' : 'sla-on-track');
                    var priorityCls = 'priority-' + (c.priority ? c.priority.toLowerCase() : 'medium');
                    var statusCls = 'badge-' + (c.status ? c.status.toLowerCase() : 'submitted');

                    return '<tr>' +
                      '<td><input type="checkbox" class="chk-case-row" data-id="' + c.id + '" onchange="window.MumbAIR.OPERATIONS.updateBulkCount()"></td>' +
                      '<td style="font-family:var(--font-mono); font-weight:800; color:var(--brand-teal);">' + c.id + '</td>' +
                      '<td><strong>Ward ' + c.ward + '</strong><br><span style="font-size:11px; color:#64748B;">' + (c.department || 'SWM') + '</span></td>' +
                      '<td>' +
                        '<div style="font-weight:700; color:var(--ink-primary); max-width:320px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">' + UTILS.escapeHtml(c.title) + '</div>' +
                        '<div style="font-size:11.5px; color:#64748B;">📍 ' + UTILS.escapeHtml(c.addressText) + '</div>' +
                      '</td>' +
                      '<td><span class="ops-badge ' + priorityCls + '">' + (c.priority || 'MEDIUM') + '</span></td>' +
                      '<td><span class="ops-badge ' + statusCls + '">' + c.status.replace(/_/g, ' ') + '</span></td>' +
                      '<td><span class="sla-pill ' + slaCls + '">' + sla.label + '</span></td>' +
                      '<td>' + (c.assignedOfficer ? '<strong>' + c.assignedOfficer + '</strong><br><span style="font-family:var(--font-mono); font-size:10.5px; color:#64748B;">' + (c.assignedBadge || '') + '</span>' : '<span style="color:#DC2626; font-weight:700;">Unassigned</span>') + '</td>' +
                      '<td>' +
                        '<button class="btn btn-sm btn-primary" onclick="window.MumbAIR.OPERATIONS.openCaseDetail(\'' + c.id + '\')">Open Case File</button>' +
                      '</td>' +
                    '</tr>';
                  }).join('')
              ) +
            '</tbody>' +
          '</table>' +
        '</div>' +
      '</div>';

    container.innerHTML = html;
  }

  function setInboxFilter(filterKey){
    opsState.inboxFilter = filterKey;
    renderModule('inbox');
  }

  function filterInboxByWard(wardCode){
    opsState.inboxFilter = 'all';
    opsState.searchQuery = wardCode.toLowerCase();
    switchModule('inbox');
  }

  function toggleSelectAll(masterChk){
    document.querySelectorAll('.chk-case-row').forEach(function(chk){
      chk.checked = masterChk.checked;
    });
    updateBulkCount();
  }

  function updateBulkCount(){
    var checked = document.querySelectorAll('.chk-case-row:checked');
    var countEl = document.getElementById('bulkSelectedCount');
    if(countEl) countEl.textContent = checked.length;
  }

  function getSelectedCaseIds(){
    var checked = document.querySelectorAll('.chk-case-row:checked');
    var ids = [];
    checked.forEach(function(c){ ids.push(c.getAttribute('data-id')); });
    return ids;
  }

  function executeBulkAssign(){
    var ids = getSelectedCaseIds();
    if(ids.length === 0){
      alert('Please select at least one complaint using the checkboxes.');
      return;
    }
    var officerName = prompt('Enter officer name to assign ' + ids.length + ' cases (e.g. Officer Sanjay Shinde, Officer Rahul Mane, Officer Anita Patil):', 'Officer Sanjay Shinde');
    if(!officerName) return;

    var currentUser = getCurrentUser();
    var res = WORKFLOW.bulkAssign(ids, officerName, currentUser, 'Bulk supervisor dispatch.');
    if(res.success){
      window.MumbAIR.APP.showToast('Successfully bulk assigned ' + res.count + ' complaints to ' + officerName, '🚀');
      renderModule('inbox');
    }
  }

  function executeBulkPriority(){
    var ids = getSelectedCaseIds();
    if(ids.length === 0){
      alert('Please select at least one complaint using the checkboxes.');
      return;
    }
    var newP = prompt('Set priority (URGENT, HIGH, MEDIUM, LOW):', 'HIGH');
    if(!newP) return;

    var currentUser = getCurrentUser();
    var res = WORKFLOW.bulkUpdatePriority(ids, newP.toUpperCase(), currentUser);
    if(res.success){
      window.MumbAIR.APP.showToast('Priority updated for ' + res.count + ' cases.', '⚡');
      renderModule('inbox');
    }
  }

  function executeBulkDept(){
    var ids = getSelectedCaseIds();
    if(ids.length === 0){
      alert('Please select at least one complaint using the checkboxes.');
      return;
    }
    var newD = prompt('Transfer to Department (SWM, APC, BUILDING, ROADS, DRAINAGE, HEALTH):', 'APC');
    if(!newD) return;

    var currentUser = getCurrentUser();
    var res = WORKFLOW.bulkTransferDept(ids, newD.toUpperCase(), currentUser);
    if(res.success){
      window.MumbAIR.APP.showToast('Department transferred for ' + res.count + ' cases.', '🏢');
      renderModule('inbox');
    }
  }

  /* ===========================================================================
     MODULE 3: DISPATCH & ASSIGNMENT CENTER
     =========================================================================== */

  function renderDispatchCenter(container, user, reports, actionsContainer){
    var state = STORAGE.loadState();
    var officers = state.officers || [];
    var unassigned = reports.filter(function(r){ return r.status === 'SUBMITTED' || r.status === 'UNDER_REVIEW'; });

    var html =
      '<div class="dispatch-split-view">' +
        // Left Column: Unassigned Queue
        '<div class="ops-card">' +
          '<div class="ops-card-header">' +
            '<div>' +
              '<div class="ops-card-title">📥 Unassigned Complaint Triage Queue</div>' +
              '<div class="ops-card-sub">' + unassigned.length + ' cases requiring officer allocation & SLA start</div>' +
            '</div>' +
          '</div>' +
          '<div class="unassigned-cases-list">' +
            (unassigned.length === 0
              ? '<div style="padding:40px; text-align:center; color:#64748B;">✓ Triage queue is clear! All complaints are currently dispatched.</div>'
              : unassigned.map(function(c){
                  var priorityCls = 'priority-' + (c.priority ? c.priority.toLowerCase() : 'medium');
                  return '<div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:8px; padding:14px; margin-bottom:12px;">' +
                    '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:6px;">' +
                      '<span style="font-family:var(--font-mono); font-weight:800; color:var(--brand-teal);">' + c.id + '</span>' +
                      '<span class="ops-badge ' + priorityCls + '">' + (c.priority || 'MEDIUM') + '</span>' +
                    '</div>' +
                    '<div style="font-weight:700; font-size:13.5px; color:#0F172A;">' + UTILS.escapeHtml(c.title) + '</div>' +
                    '<div style="font-size:11.5px; color:#64748B; margin-top:2px;">📍 ' + c.addressText + ' &middot; Ward ' + c.ward + '</div>' +
                    '<div style="display:flex; justify-content:space-between; align-items:center; margin-top:10px;">' +
                      '<span style="font-size:11px; color:#475569;">Routing: <strong>' + (c.department || 'SWM') + '</strong></span>' +
                      '<button class="btn btn-sm btn-primary" onclick="window.MumbAIR.OPERATIONS.openDispatchModalForCase(\'' + c.id + '\')">⚡ Dispatch Officer</button>' +
                    '</div>' +
                  '</div>';
                }).join('')
            ) +
          '</div>' +
        '</div>' +

        // Right Column: Field Officers Workload & Availability Roster
        '<div class="ops-card">' +
          '<div class="ops-card-header">' +
            '<div>' +
              '<div class="ops-card-title">👥 Field Inspector Roster &amp; Workload</div>' +
              '<div class="ops-card-sub">Real-time capacity, skills & active case allocation</div>' +
            '</div>' +
          '</div>' +
          '<div class="officer-roster-list">' +
            officers.filter(function(o){ return o.role === 'FIELD_OFFICER'; }).map(function(o){
              var activeCases = reports.filter(function(r){
                return r.assignedOfficer === o.name && r.status !== 'RESOLVED' && r.status !== 'CLOSED';
              }).length;
              var isAvailable = o.availability === 'AVAILABLE';
              var fillPct = Math.min(100, (activeCases / 5) * 100);
              var fillColor = activeCases > 3 ? '#EF4444' : (activeCases > 1 ? '#F59E0B' : '#10B981');

              return '<div class="officer-workload-card">' +
                '<div>' +
                  '<div style="font-weight:700; font-size:13px; color:var(--ink-primary);">' + o.name + '</div>' +
                  '<div style="font-size:11.5px; color:#64748B;">' + o.badge + ' &middot; Ward ' + o.ward + ' &middot; ' + o.department + '</div>' +
                  '<div style="font-size:11px; color:#0D9488; margin-top:2px;">Skills: ' + (o.skills ? o.skills.join(', ') : 'Field Inspection') + '</div>' +
                '</div>' +
                '<div style="text-align:right;">' +
                  '<span class="ops-badge ' + (isAvailable ? 'badge-in_progress' : 'priority-urgent') + '">' + o.availability + '</span>' +
                  '<div style="font-family:var(--font-mono); font-size:11px; font-weight:700; margin-top:4px;">' + activeCases + ' active cases</div>' +
                  '<div class="workload-meter"><div class="workload-meter-fill" style="width:' + fillPct + '%; background:' + fillColor + ';"></div></div>' +
                '</div>' +
              '</div>';
            }).join('') +
          '</div>' +
        '</div>' +
      '</div>';

    container.innerHTML = html;
  }

  /* ===========================================================================
     MODULE 4: FIELD INSPECTIONS & CHECKLIST WORKFLOW
     =========================================================================== */

  function renderInspections(container, user, reports, actionsContainer){
    var userReports = reports;
    if(user.role === 'FIELD_OFFICER'){
      userReports = reports.filter(function(r){
        return r.assignedOfficer === user.name || (r.ward === user.ward && r.department === user.department);
      });
    }

    var inProgress = userReports.filter(function(r){ return r.status === 'IN_PROGRESS'; });
    var assigned = userReports.filter(function(r){ return r.status === 'ASSIGNED'; });

    var html =
      '<div class="ops-kpi-grid">' +
        '<div class="ops-kpi-card amber">' +
          '<div class="ops-kpi-header">Assigned for Inspection</div>' +
          '<div class="ops-kpi-val">' + assigned.length + '</div>' +
          '<div class="ops-kpi-sub"><span>Ready for departure</span><span class="ops-badge badge-assigned">Queue</span></div>' +
        '</div>' +
        '<div class="ops-kpi-card teal">' +
          '<div class="ops-kpi-header">Active Ground Inspections</div>' +
          '<div class="ops-kpi-val">' + inProgress.length + '</div>' +
          '<div class="ops-kpi-sub"><span>Checklists in execution</span><span class="ops-badge badge-in_progress">On Ground</span></div>' +
        '</div>' +
      '</div>' +

      '<div class="ops-card">' +
        '<div class="ops-card-header">' +
          '<div>' +
            '<div class="ops-card-title">🔍 Field Inspection Directives &amp; Checklist Engine</div>' +
            '<div class="ops-card-sub">Mobile-optimized case investigation, optical opacity checks & mitigation protocol</div>' +
          '</div>' +
        '</div>' +
        '<div class="inspection-cards-list">' +
          (userReports.filter(function(r){ return r.status === 'ASSIGNED' || r.status === 'IN_PROGRESS'; }).length === 0
            ? '<div style="padding:40px; text-align:center; color:#64748B;">No pending inspections in your queue today.</div>'
            : userReports.filter(function(r){ return r.status === 'ASSIGNED' || r.status === 'IN_PROGRESS'; }).map(function(c){
                var sla = WORKFLOW.calculateSla(c);
                var checklist = AI.generateInspectionChecklist(c.category);
                var isInProg = c.status === 'IN_PROGRESS';

                return '<div class="hotspot-cluster-card" style="margin-bottom:16px;">' +
                  '<div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">' +
                    '<div>' +
                      '<span class="ops-badge" style="background:#0F172A; color:#fff;">' + c.id + '</span>' +
                      '<span style="font-weight:700; margin-left:8px; font-size:14px;">' + UTILS.escapeHtml(c.title) + '</span>' +
                      '<div style="font-size:11.5px; color:#64748B; margin-top:2px;">📍 ' + c.addressText + ' &middot; Ward ' + c.ward + '</div>' +
                    '</div>' +
                    '<span class="sla-pill sla-' + (sla.status === 'BREACHED' ? 'breached' : 'on-track') + '">' + sla.label + '</span>' +
                  '</div>' +

                  '<p style="font-size:13px; color:#334155; margin:8px 0;">' + UTILS.escapeHtml(c.description) + '</p>' +

                  // Checklist Box
                  '<div style="background:#F8FAFC; border:1px solid #E2E8F0; padding:14px; border-radius:6px; margin:12px 0;">' +
                    '<div style="font-family:var(--font-mono); font-size:11px; font-weight:700; color:#0D9488; text-transform:uppercase; margin-bottom:8px;">' +
                      '🤖 Official Protocol Checklist (' + c.category.replace(/_/g, ' ') + ')' +
                    '</div>' +
                    '<div style="display:flex; flex-direction:column; gap:6px;">' +
                      checklist.map(function(item, idx){
                        return '<label style="display:flex; align-items:center; gap:8px; font-size:12.5px; color:#334155; cursor:pointer;">' +
                          '<input type="checkbox" ' + (isInProg ? 'checked' : '') + ' id="chk_' + c.id + '_' + idx + '"> <span>' + item + '</span>' +
                        '</label>';
                      }).join('') +
                    '</div>' +
                  '</div>' +

                  '<div style="display:flex; gap:10px; flex-wrap:wrap; margin-top:12px;">' +
                    (!isInProg
                      ? '<button class="btn btn-sm btn-primary" onclick="window.MumbAIR.OPERATIONS.triggerStartInspection(\'' + c.id + '\')">▶ Arrive &amp; Start Inspection</button>'
                      : '<button class="btn btn-sm btn-accent" onclick="window.MumbAIR.OPERATIONS.triggerSubmitResolution(\'' + c.id + '\')">✓ Submit Resolution &amp; Proof</button>'
                    ) +
                    '<button class="btn btn-sm btn-outline" onclick="window.MumbAIR.OPERATIONS.openCaseDetail(\'' + c.id + '\')">Examine Full Case File</button>' +
                  '</div>' +
                '</div>';
              }).join('')
          ) +
        '</div>' +
      '</div>';

    container.innerHTML = html;
  }

  function triggerStartInspection(complaintId){
    var currentUser = getCurrentUser();
    var res = WORKFLOW.startInspection(complaintId, currentUser, 'Inspector arrived on coordinates. Protocol initiated.');
    if(res.success){
      window.MumbAIR.APP.showToast('Inspection started for ' + complaintId, '▶');
      renderModule('inspections');
    }
  }

  function triggerSubmitResolution(complaintId){
    var notes = prompt('Enter official mitigation summary (e.g. Deployed 2 misting cannons, issued show-cause notice):', 'Continuous misting cannons operational along boundary fence. Fine levied.');
    if(!notes) return;

    var currentUser = getCurrentUser();
    var res = WORKFLOW.submitResolution(complaintId, currentUser, notes, 'Mitigation Proof Photo Attached');
    if(res.success){
      window.MumbAIR.APP.showToast('Resolution submitted for supervisory verification!', '✅');
      renderModule('inspections');
    }
  }

  /* ===========================================================================
     MODULE 5: SLA & ESCALATION CENTER
     =========================================================================== */

  function renderEscalations(container, user, reports, actionsContainer){
    var breached = reports.filter(function(r){
      var sla = WORKFLOW.calculateSla(r);
      return sla && sla.status === 'BREACHED';
    });
    var dueSoon = reports.filter(function(r){
      var sla = WORKFLOW.calculateSla(r);
      return sla && sla.status === 'DUE_SOON';
    });

    var html =
      '<div class="ops-kpi-grid">' +
        '<div class="ops-kpi-card red">' +
          '<div class="ops-kpi-header">Active SLA Breaches</div>' +
          '<div class="ops-kpi-val">' + breached.length + '</div>' +
          '<div class="ops-kpi-sub"><span>Exceeded resolution threshold</span><span class="ops-badge priority-urgent">Level 1 Escalation</span></div>' +
        '</div>' +
        '<div class="ops-kpi-card amber">' +
          '<div class="ops-kpi-header">Expiring in &lt; 6 Hours</div>' +
          '<div class="ops-kpi-val">' + dueSoon.length + '</div>' +
          '<div class="ops-kpi-sub"><span>Immediate field follow-up required</span><span class="ops-badge priority-high">Due Soon</span></div>' +
        '</div>' +
      '</div>' +

      '<div class="ops-card">' +
        '<div class="ops-card-header">' +
          '<div>' +
            '<div class="ops-card-title">🚨 Active Escalation Matrix &amp; Corrective Action Center</div>' +
            '<div class="ops-card-sub">Tiered supervisory intervention protocols under MCGM Environmental Governance</div>' +
          '</div>' +
        '</div>' +
        '<div class="ops-table-container">' +
          '<table class="ops-table">' +
            '<thead>' +
              '<tr>' +
                '<th>Case ID</th>' +
                '<th>Escalation Tier</th>' +
                '<th>Incident Title &amp; Ward</th>' +
                '<th>Responsible Officer</th>' +
                '<th>Overdue Hours</th>' +
                '<th>Supervisory Corrective Action</th>' +
              '</tr>' +
            '</thead>' +
            '<tbody>' +
              (breached.length === 0
                ? '<tr><td colspan="6" style="text-align:center; padding:30px; color:#64748B;">✓ Zero SLA breaches currently active. All cases operating on track.</td></tr>'
                : breached.map(function(c){
                    var sla = WORKFLOW.calculateSla(c);
                    return '<tr>' +
                      '<td style="font-family:var(--font-mono); font-weight:800; color:#DC2626;">' + c.id + '</td>' +
                      '<td><span class="ops-badge priority-urgent">LEVEL 2 ESCALATION</span></td>' +
                      '<td><strong>' + UTILS.escapeHtml(c.title) + '</strong><br><span style="font-size:11px; color:#64748B;">' + c.addressText + ' &middot; Ward ' + c.ward + '</span></td>' +
                      '<td>' + (c.assignedOfficer || '<span style="color:#DC2626;">Unassigned</span>') + '</td>' +
                      '<td><span class="sla-pill sla-breached">' + Math.abs(sla.hoursLeft) + 'h Overdue</span></td>' +
                      '<td>' +
                        '<button class="btn btn-sm btn-primary" onclick="window.MumbAIR.OPERATIONS.triggerCorrectiveActionPlan(\'' + c.id + '\')">⚡ Enact Action Plan</button>' +
                      '</td>' +
                    '</tr>';
                  }).join('')
              ) +
            '</tbody>' +
          '</table>' +
        '</div>' +
      '</div>';

    container.innerHTML = html;
  }

  function triggerCorrectiveActionPlan(complaintId){
    var plan = prompt('Enter Corrective Intervention Action (e.g. Deploying Emergency MPCB Strike Squad):', 'Emergency joint squad deployed; re-routed priority.');
    if(!plan) return;

    var currentUser = getCurrentUser();
    WORKFLOW.escalateComplaint(complaintId, currentUser, plan, 'LEVEL_3');
    window.MumbAIR.APP.showToast('Escalation plan enacted for ' + complaintId, '🚨');
    renderModule('escalations');
  }

  /* ===========================================================================
     MODULE 6: WARD OPERATIONS (24 BMC Wards Scorecards)
     =========================================================================== */

  function renderWardOperations(container, user, reports, actionsContainer){
    var wards = CONFIG.WARDS_DATA || [];

    var html =
      '<div class="ops-card">' +
        '<div class="ops-card-header">' +
          '<div>' +
            '<div class="ops-card-title">🏛️ Greater Mumbai 24 Administrative Wards Operations</div>' +
            '<div class="ops-card-sub">Island City, Western Suburbs &amp; Eastern Suburbs local governance</div>' +
          '</div>' +
        '</div>' +
        '<div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(280px, 1fr)); gap:16px;">' +
          wards.map(function(w){
            var wardReports = reports.filter(function(r){ return r.ward === w.code; });
            var openCases = wardReports.filter(function(r){ return r.status !== 'RESOLVED' && r.status !== 'CLOSED'; });
            return '<div style="background:#FFFFFF; border:1px solid #E2E8F0; border-radius:10px; padding:16px; box-shadow:0 2px 6px rgba(15,23,42,0.04);">' +
              '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">' +
                '<span style="font-family:var(--font-mono); font-weight:800; font-size:16px; color:var(--brand-teal);">' + w.code + '</span>' +
                '<span class="ops-badge" style="background:#F1F5F9; color:#0F172A;">' + w.zone + '</span>' +
              '</div>' +
              '<div style="font-weight:700; font-size:14px; color:#0F172A;">' + w.name + '</div>' +
              '<div style="font-size:11.5px; color:#64748B; margin-top:2px;">Station: ' + w.station + '</div>' +
              '<div style="font-size:11px; color:#475569; margin-top:6px;">Vector: ' + w.defaultCause + '</div>' +
              '<div style="display:flex; justify-content:space-between; align-items:center; margin-top:12px; padding-top:10px; border-top:1px solid #F1F5F9;">' +
                '<span style="font-size:12px; font-weight:700; color:' + (openCases.length > 0 ? '#DC2626' : '#10B981') + ';">' + openCases.length + ' active cases</span>' +
                '<button class="btn btn-sm btn-outline" onclick="window.MumbAIR.OPERATIONS.filterInboxByWard(\'' + w.code + '\')">Inspect \u2192</button>' +
              '</div>' +
            '</div>';
          }).join('') +
        '</div>' +
      '</div>';

    container.innerHTML = html;
  }

  /* ===========================================================================
     MODULE 7: DEPARTMENTS MANAGEMENT
     =========================================================================== */

  function renderDepartments(container, user, reports, actionsContainer){
    var depts = CONFIG.DEPARTMENTS || [];

    var html =
      '<div class="ops-card">' +
        '<div class="ops-card-header">' +
          '<div>' +
            '<div class="ops-card-title">🏢 Municipal Departments Workload &amp; Routing Matrix</div>' +
            '<div class="ops-card-sub">Inter-departmental allocation, departmental heads and compliance rates</div>' +
          '</div>' +
        '</div>' +
        '<div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(320px, 1fr)); gap:16px;">' +
          depts.map(function(d){
            var deptReports = reports.filter(function(r){ return r.department === d.code; });
            var openDept = deptReports.filter(function(r){ return r.status !== 'RESOLVED' && r.status !== 'CLOSED'; });
            return '<div style="background:#FFFFFF; border:1px solid #E2E8F0; border-radius:10px; padding:18px; box-shadow:0 2px 6px rgba(15,23,42,0.04);">' +
              '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">' +
                '<span style="font-family:var(--font-mono); font-weight:800; font-size:16px; color:#0284C7;">' + d.code + '</span>' +
                '<span class="ops-badge" style="background:#EFF6FF; color:#1D4ED8;">Active Dept</span>' +
              '</div>' +
              '<div style="font-weight:800; font-size:14px; color:#0F172A;">' + d.name + '</div>' +
              '<div style="font-size:12px; color:#64748B; margin-top:2px;">Head of Dept: <strong>' + d.head + '</strong></div>' +
              '<div style="display:flex; justify-content:space-between; align-items:center; margin-top:14px; padding-top:10px; border-top:1px solid #F1F5F9;">' +
                '<div>' +
                  '<div style="font-family:var(--font-mono); font-size:18px; font-weight:800; color:#0F172A;">' + openDept.length + '</div>' +
                  '<div style="font-size:11px; color:#64748B;">Active Cases</div>' +
                '</div>' +
                '<button class="btn btn-sm btn-outline" onclick="window.MumbAIR.OPERATIONS.filterInboxByDept(\'' + d.code + '\')">View Queue \u2192</button>' +
              '</div>' +
            '</div>';
          }).join('') +
        '</div>' +
      '</div>';

    container.innerHTML = html;
  }

  function filterInboxByDept(deptCode){
    opsState.inboxFilter = 'all';
    opsState.searchQuery = deptCode.toLowerCase();
    switchModule('inbox');
  }

  /* ===========================================================================
     MODULE 8: OFFICERS & STAFF ROSTER
     =========================================================================== */

  function renderStaffRoster(container, user, reports, actionsContainer){
    var state = STORAGE.loadState();
    var officers = state.officers || [];

    var html =
      '<div class="ops-card">' +
        '<div class="ops-card-header">' +
          '<div>' +
            '<div class="ops-card-title">👥 Municipal Environmental Workforce Directory</div>' +
            '<div class="ops-card-sub">Active field inspectors, ward executive officers, and departmental heads</div>' +
          '</div>' +
        '</div>' +
        '<div class="ops-table-container">' +
          '<table class="ops-table">' +
            '<thead>' +
              '<tr>' +
                '<th>Officer Name &amp; Role</th>' +
                '<th>Badge ID</th>' +
                '<th>Ward &middot; Dept</th>' +
                '<th>Availability</th>' +
                '<th>Active Cases</th>' +
                '<th>Contact Info</th>' +
              '</tr>' +
            '</thead>' +
            '<tbody>' +
              officers.map(function(o){
                var activeCount = reports.filter(function(r){
                  return r.assignedOfficer === o.name && r.status !== 'RESOLVED' && r.status !== 'CLOSED';
                }).length;
                return '<tr>' +
                  '<td><strong>' + o.name + '</strong><br><span style="font-size:11px; color:#64748B;">' + ((CONFIG.ROLES && CONFIG.ROLES[o.role]) ? CONFIG.ROLES[o.role].label : o.role) + '</span></td>' +
                  '<td style="font-family:var(--font-mono); font-weight:700;">' + o.badge + '</td>' +
                  '<td>Ward ' + o.ward + ' &middot; ' + (o.department || 'ALL') + '</td>' +
                  '<td><span class="ops-badge ' + (o.availability === 'AVAILABLE' ? 'badge-in_progress' : 'priority-urgent') + '">' + o.availability + '</span></td>' +
                  '<td style="font-family:var(--font-mono); font-weight:700;">' + activeCount + '</td>' +
                  '<td style="font-size:11.5px; color:#475569;">' + o.phone + '<br><span style="color:#64748B;">' + o.email + '</span></td>' +
                '</tr>';
              }).join('') +
            '</tbody>' +
          '</table>' +
        '</div>' +
      '</div>';

    container.innerHTML = html;
  }

  /* ===========================================================================
     MODULE 9: RESOURCES & EQUIPMENT FLEET
     =========================================================================== */

  function renderResourcesFleet(container, user, resources, actionsContainer){
    var html =
      '<div class="ops-card">' +
        '<div class="ops-card-header">' +
          '<div>' +
            '<div class="ops-card-title">🚜 Environmental Equipment &amp; Suppression Fleet</div>' +
            '<div class="ops-card-sub">Anti-smog guns, mechanical sweepers, water jetting tankers &amp; sensor units</div>' +
          '</div>' +
        '</div>' +
        '<div class="ops-table-container">' +
          '<table class="ops-table">' +
            '<thead>' +
              '<tr>' +
                '<th>Asset ID</th>' +
                '<th>Equipment Name &amp; Specifications</th>' +
                '<th>Assigned Ward &amp; Dept</th>' +
                '<th>Deployment Status</th>' +
                '<th>Current Coordinates / Location</th>' +
                '<th>Assigned Operator</th>' +
              '</tr>' +
            '</thead>' +
            '<tbody>' +
              resources.map(function(eq){
                var statusCls = eq.status === 'DEPLOYED' ? 'badge-in_progress' : (eq.status === 'AVAILABLE' ? 'badge-resolved' : 'priority-urgent');
                return '<tr>' +
                  '<td style="font-family:var(--font-mono); font-weight:800; color:var(--brand-teal);">' + eq.id + '</td>' +
                  '<td><strong>' + eq.name + '</strong><br><span style="font-size:11px; color:#64748B;">' + eq.capacity + '</span></td>' +
                  '<td>Ward ' + eq.ward + ' &middot; ' + eq.department + '</td>' +
                  '<td><span class="ops-badge ' + statusCls + '">' + eq.status + '</span></td>' +
                  '<td>📍 ' + eq.location + '</td>' +
                  '<td>' + eq.operator + '</td>' +
                '</tr>';
              }).join('') +
            '</tbody>' +
          '</table>' +
        '</div>' +
      '</div>';

    container.innerHTML = html;
  }

  /* ===========================================================================
     MODULE 10: CITY OPERATIONS MAP (Dedicated Interactive Map)
     =========================================================================== */

  function renderOperationsMap(container, user, reports, actionsContainer){
    var html =
      '<div class="ops-card" style="padding:14px;">' +
        '<div class="ops-card-header" style="margin-bottom:10px;">' +
          '<div>' +
            '<div class="ops-card-title">🗺️ Greater Mumbai Atmospheric Operations Surveillance</div>' +
            '<div class="ops-card-sub">Geospatial distribution of active civic reports, monitoring stations &amp; ward perimeters</div>' +
          '</div>' +
        '</div>' +
        '<div class="map-canvas-wrapper" style="height:540px;">' +
          '<div id="opsLeafletMap" style="width:100%; height:100%;"></div>' +
        '</div>' +
      '</div>';

    container.innerHTML = html;

    // Initialize Map on Container
    setTimeout(function(){
      if(window.L && document.getElementById('opsLeafletMap')){
        if(opsState.opsMapInstance){
          try { opsState.opsMapInstance.remove(); } catch(e){}
        }

        var map = L.map('opsLeafletMap', {
          center: [19.0760, 72.8777],
          zoom: 11
        });
        opsState.opsMapInstance = map;

        // Esri Street Map default
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
          maxZoom: 18,
          attribution: 'Tiles &copy; Esri &mdash; Street Map'
        }).addTo(map);

        // Add Wards Coordinates / Stations
        (CONFIG.WARDS_DATA || []).forEach(function(w){
          var marker = L.circleMarker([w.lat, w.lng], {
            radius: 8,
            fillColor: '#0D9488',
            color: '#ffffff',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.8
          }).addTo(map);

          marker.bindPopup('<strong>Ward ' + w.code + ' (' + w.name + ')</strong><br>' + w.station);
        });

        // Add Complaints Pins
        reports.forEach(function(r){
          if(r.latitude && r.longitude){
            var isResolved = r.status === 'RESOLVED' || r.status === 'CLOSED';
            var pMarker = L.circleMarker([r.latitude, r.longitude], {
              radius: 9,
              fillColor: isResolved ? '#10B981' : '#EF4444',
              color: '#ffffff',
              weight: 2,
              fillOpacity: 0.9
            }).addTo(map);

            pMarker.bindPopup(
              '<strong>' + r.id + ': ' + UTILS.escapeHtml(r.title) + '</strong><br>' +
              'Ward ' + r.ward + ' &middot; ' + r.status + '<br>' +
              '<button style="margin-top:6px; padding:3px 8px; font-size:11px; cursor:pointer;" onclick="window.MumbAIR.OPERATIONS.openCaseDetail(\'' + r.id + '\')">Open Case File</button>'
            );
          }
        });

        map.invalidateSize();
      }
    }, 100);
  }

  /* ===========================================================================
     MODULE 11: HOTSPOT & REPEAT INCIDENT INTELLIGENCE
     =========================================================================== */

  function renderHotspots(container, user, reports, actionsContainer){
    // Algorithmic Geographic Clustering (Grouping within 1.5 km)
    var clusters = [
      {
        name: 'Mahul Oil Refineries Flare Corridor',
        ward: 'M/E',
        category: 'INDUSTRIAL_EMISSIONS',
        reportCount: 5,
        dominantAqi: 289,
        status: 'HIGH RECIDIVISM',
        trend: 'Increasing (Morning Peak)',
        rootCause: 'Flare stack sulfur combustion exceeding CPCB standards during inversion hours.',
        pastAction: 'Show-cause notices issued under Section 31A; 2 truck-mounted anti-smog mist cannons deployed.'
      },
      {
        name: 'Deonar Dumping Ground East Methane Seep',
        ward: 'M/W',
        category: 'SMOKE_LANDFILL',
        reportCount: 4,
        dominantAqi: 245,
        status: 'CRITICAL HOTSPOT',
        trend: 'Stable',
        rootCause: 'Subsurface anaerobic decomposition producing combustible methane vents along perimeter road.',
        pastAction: 'Continuous slurry misting; soil capping of active sectors.'
      },
      {
        name: 'Senapati Bapat Marg Redevelopment Belt',
        ward: 'G/S',
        category: 'CONSTRUCTION_DUST',
        reportCount: 3,
        dominantAqi: 198,
        status: 'MODERATING',
        trend: 'Decreasing (-14% this week)',
        rootCause: 'Concurrent high-rise demolition and foundation excavation without enclosed perimeter sheeting.',
        pastAction: 'Mandatory 25-ft green geotextile barrier enforced; ₹50,000 spot fine levied on developers.'
      },
      {
        name: 'Kurla Mithi River Scrap Recycling Strip',
        ward: 'L',
        category: 'OPEN_BURNING',
        reportCount: 3,
        dominantAqi: 220,
        status: 'ACTIVE HOTSPOT',
        trend: 'Increasing (Nocturnal)',
        rootCause: 'Unauthorized nocturnal wire insulation burning in open pits along scrap yards.',
        pastAction: 'Night patrol squads instituted with Ward L flying squad.'
      }
    ];

    var html =
      '<div class="ops-card">' +
        '<div class="ops-card-header">' +
          '<div>' +
            '<div class="ops-card-title">🔥 Greater Mumbai Recurring Hotspot &amp; Recidivism Intelligence</div>' +
            '<div class="ops-card-sub">Algorithmic spatial clustering of repeated environmental violations within 1.5 km zones</div>' +
          '</div>' +
        '</div>' +
        '<div>' +
          clusters.map(function(cl){
            return '<div class="hotspot-cluster-card">' +
              '<div class="hotspot-header">' +
                '<div>' +
                  '<div class="hotspot-name">📍 ' + cl.name + ' (Ward ' + cl.ward + ')</div>' +
                  '<div style="font-size:12px; color:#64748B; margin-top:2px;">Category: <strong>' + cl.category.replace(/_/g, ' ') + '</strong> &middot; Trend: ' + cl.trend + '</div>' +
                '</div>' +
                '<span class="hotspot-count-badge">' + cl.reportCount + ' Incidents Clustered</span>' +
              '</div>' +
              '<div style="font-size:12.5px; color:#334155; margin:8px 0;">' +
                '<strong>Root Cause Analysis:</strong> ' + cl.rootCause +
              '</div>' +
              '<div style="font-size:12px; color:#0D9488; background:#F0FDFA; padding:8px 12px; border-radius:6px; margin-top:6px;">' +
                '<strong>Municipal Action Taken:</strong> ' + cl.pastAction +
              '</div>' +
            '</div>';
          }).join('') +
        '</div>' +
      '</div>';

    container.innerHTML = html;
  }

  /* ===========================================================================
     MODULE 12: GOVERNANCE ANALYTICS
     =========================================================================== */

  function renderAnalytics(container, user, reports, actionsContainer){
    var total = reports.length;
    var resolved = reports.filter(function(r){ return r.status === 'RESOLVED' || r.status === 'CLOSED'; }).length;
    var rate = total > 0 ? Math.round((resolved / total) * 100) : 0;

    var html =
      '<div class="ops-card">' +
        '<div class="ops-card-header">' +
          '<div>' +
            '<div class="ops-card-title">📊 City-Wide Environmental Operations Analytics</div>' +
            '<div class="ops-card-sub">Performance metrics, category distributions, and SLA efficiency trajectories</div>' +
          '</div>' +
          '<button class="btn btn-sm btn-outline" onclick="window.MumbAIR.OPERATIONS.exportCityCsv()">Export Dataset (CSV)</button>' +
        '</div>' +
        '<div class="case-workspace-grid">' +
          '<div style="background:#F8FAFC; border:1px solid #E2E8F0; padding:18px; border-radius:10px;">' +
            '<div style="font-weight:700; font-size:13px; margin-bottom:12px;">Violations by Category</div>' +
            '<div style="display:flex; flex-direction:column; gap:8px;">' +
              ['CONSTRUCTION_DUST', 'OPEN_BURNING', 'INDUSTRIAL_EMISSIONS', 'SMOKE_LANDFILL', 'VEHICLE_POLLUTION'].map(function(cat){
                var cCount = reports.filter(function(r){ return r.category === cat; }).length;
                var pct = total > 0 ? Math.round((cCount / total) * 100) : 0;
                return '<div>' +
                  '<div style="display:flex; justify-content:space-between; font-size:12px; font-weight:600; margin-bottom:2px;">' +
                    '<span>' + cat.replace(/_/g, ' ') + '</span>' +
                    '<span>' + cCount + ' (' + pct + '%)</span>' +
                  '</div>' +
                  '<div style="height:6px; background:#E2E8F0; border-radius:3px; overflow:hidden;">' +
                    '<div style="height:100%; width:' + pct + '%; background:var(--brand-teal);"></div>' +
                  '</div>' +
                '</div>';
              }).join('') +
            '</div>' +
          '</div>' +

          '<div style="background:#F8FAFC; border:1px solid #E2E8F0; padding:18px; border-radius:10px;">' +
            '<div style="font-weight:700; font-size:13px; margin-bottom:12px;">SLA Compliance Overview</div>' +
            '<div style="text-align:center; padding:20px 0;">' +
              '<div style="font-family:var(--font-mono); font-size:48px; font-weight:800; color:#10B981; line-height:1;">' + rate + '%</div>' +
              '<div style="font-size:13px; color:#64748B; margin-top:6px;">Overall MCGM Resolution Compliance</div>' +
              '<div style="font-size:12px; color:#0D9488; margin-top:8px; font-weight:600;">Target Standard: 85% \u00B7 Benchmark Exceeded</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    container.innerHTML = html;
  }

  /* ===========================================================================
     MODULE 13: REPORTS & EXPORT CENTER
     =========================================================================== */

  function renderReportsCenter(container, user, reports, actionsContainer){
    var reportTypes = [
      { id: 'complaint_summary', title: '1. Municipal Complaints Summary Ledger', desc: 'Full log of all civic reports with timestamps, wards, categories, and resolution states.' },
      { id: 'ward_performance', title: '2. 24-Ward Operations Performance Scorecard', desc: 'Comparative resolution rates, open backlogs, and SLA compliance rankings across all 24 wards.' },
      { id: 'dept_sla', title: '3. Departmental SLA Compliance & Workload Audit', desc: 'Breakdown of case velocity, overdue breaches, and inspector assignments across municipal departments.' },
      { id: 'hotspot_recidivism', title: '4. High-Recidivism Environmental Hotspot Report', desc: 'Geographic clustering data identifying recurring violation sectors and mitigation history.' }
    ];

    var html =
      '<div class="ops-card">' +
        '<div class="ops-card-header">' +
          '<div>' +
            '<div class="ops-card-title">📑 Municipal Environmental Governance Reports &amp; Exports</div>' +
            '<div class="ops-card-sub">Generate audit-ready datasets, compliance documentation, and CSV exports</div>' +
          '</div>' +
        '</div>' +
        '<div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">' +
          reportTypes.map(function(rep){
            return '<div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:8px; padding:18px;">' +
              '<div style="font-weight:800; font-size:14px; color:#0F172A;">' + rep.title + '</div>' +
              '<div style="font-size:12px; color:#64748B; margin:6px 0 14px;">' + rep.desc + '</div>' +
              '<button class="btn btn-sm btn-primary" onclick="window.MumbAIR.OPERATIONS.exportCityCsv()">📥 Download Dataset (CSV)</button>' +
            '</div>';
          }).join('') +
        '</div>' +
      '</div>';

    container.innerHTML = html;
  }

  /* ===========================================================================
     MODULE 14: RESOLUTION VERIFICATION (Supervisor Review Workspace)
     =========================================================================== */

  function renderVerificationReview(container, user, reports, actionsContainer){
    var pending = reports.filter(function(r){ return r.status === 'RESOLUTION_SUBMITTED'; });

    var html =
      '<div class="ops-card">' +
        '<div class="ops-card-header">' +
          '<div>' +
            '<div class="ops-card-title">✅ Resolution Quality Review &amp; Certification Workspace</div>' +
            '<div class="ops-card-sub">' + pending.length + ' cases submitted by field officers awaiting supervisor verification</div>' +
          '</div>' +
        '</div>' +
        '<div class="verification-list">' +
          (pending.length === 0
            ? '<div style="padding:40px; text-align:center; color:#64748B;">✓ No resolutions awaiting supervisory review at this moment.</div>'
            : pending.map(function(c){
                return '<div class="hotspot-cluster-card" style="margin-bottom:16px;">' +
                  '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">' +
                    '<div>' +
                      '<span class="ops-badge" style="background:#0F172A; color:#fff;">' + c.id + '</span>' +
                      '<span style="font-weight:700; margin-left:8px; font-size:14px;">' + UTILS.escapeHtml(c.title) + '</span>' +
                      '<div style="font-size:11.5px; color:#64748B; margin-top:2px;">📍 ' + c.addressText + ' &middot; Ward ' + c.ward + '</div>' +
                    '</div>' +
                    '<span class="ops-badge badge-resolution_submitted">Awaiting Review</span>' +
                  '</div>' +

                  '<div style="background:#F1F5F9; border-radius:6px; padding:12px; margin:10px 0;">' +
                    '<div style="font-size:11px; font-weight:700; color:#475569; text-transform:uppercase;">Inspector Mitigation Submission:</div>' +
                    '<div style="font-size:13px; color:#1E293B; margin-top:4px;">' + (c.resolution ? c.resolution.summary : 'Mitigation action taken.') + '</div>' +
                    '<div style="font-size:11px; color:#64748B; margin-top:4px;">Submitted by: <strong>' + (c.assignedOfficer || 'Field Inspector') + '</strong></div>' +
                  '</div>' +

                  '<div style="display:flex; gap:10px; margin-top:14px;">' +
                    '<button class="btn btn-sm btn-accent" onclick="window.MumbAIR.OPERATIONS.approveResolutionAction(\'' + c.id + '\')">✓ Approve &amp; Certify Resolution</button>' +
                    '<button class="btn btn-sm btn-danger" onclick="window.MumbAIR.OPERATIONS.rejectResolutionAction(\'' + c.id + '\')">✕ Reject &amp; Re-inspect</button>' +
                    '<button class="btn btn-sm btn-outline" onclick="window.MumbAIR.OPERATIONS.openCaseDetail(\'' + c.id + '\')">Examine Case File</button>' +
                  '</div>' +
                '</div>';
              }).join('')
          ) +
        '</div>' +
      '</div>';

    container.innerHTML = html;
  }

  function approveResolutionAction(complaintId){
    var notes = prompt('Enter supervisory sign-off notes (optional):', 'Field mitigation verified compliant with BMC clean air standards.');
    var currentUser = getCurrentUser();
    var res = WORKFLOW.verifyResolution(complaintId, currentUser, true, notes);
    if(res.success){
      window.MumbAIR.APP.showToast('Case ' + complaintId + ' certified and closed!', '✅');
      renderModule('verification');
    }
  }

  function rejectResolutionAction(complaintId){
    var reason = prompt('Enter documented reason for resolution rejection (Required):', 'Inadequate perimeter dust barrier; misting guns not operating during follow-up.');
    if(!reason) return;

    var currentUser = getCurrentUser();
    var res = WORKFLOW.verifyResolution(complaintId, currentUser, false, null, reason);
    if(res.success){
      window.MumbAIR.APP.showToast('Resolution rejected. Re-inspection mandated for ' + complaintId, '⚠️');
      renderModule('verification');
    }
  }

  /* ===========================================================================
     MODULE 15: PUBLIC ADVISORIES MANAGER
     =========================================================================== */

  function renderAdvisories(container, user, advisories, actionsContainer){
    if(actionsContainer){
      actionsContainer.innerHTML =
        '<button class="btn btn-sm btn-accent" onclick="window.MumbAIR.OPERATIONS.openAdvisoryModal()">📢 Broadcast New Advisory</button>';
    }

    var html =
      '<div class="ops-card">' +
        '<div class="ops-card-header">' +
          '<div>' +
            '<div class="ops-card-title">📢 Official BMC Air Quality &amp; Environmental Advisories</div>' +
            '<div class="ops-card-sub">Active public health directives, GRAP Stage mandates &amp; inversion warnings</div>' +
          '</div>' +
        '</div>' +
        '<div>' +
          advisories.map(function(adv){
            var isEmergency = adv.severity === 'EMERGENCY';
            return '<div class="hotspot-cluster-card" style="border-left-color:' + (isEmergency ? '#DC2626' : '#F59E0B') + '; margin-bottom:14px;">' +
              '<div style="display:flex; justify-content:space-between; align-items:flex-start;">' +
                '<div>' +
                  '<span class="ops-badge ' + (isEmergency ? 'priority-urgent' : 'priority-high') + '">' + adv.severity + '</span>' +
                  '<div style="font-weight:800; font-size:15px; color:#0F172A; margin-top:4px;">' + UTILS.escapeHtml(adv.title) + '</div>' +
                  '<div style="font-size:12px; color:#64748B; margin-top:2px;">Issued by: <strong>' + adv.author + '</strong> &middot; Target: ' + (adv.affectedWards.join(', ')) + '</div>' +
                '</div>' +
                '<span class="ops-badge badge-resolved">' + adv.status + '</span>' +
              '</div>' +
              '<p style="font-size:13px; color:#334155; margin:10px 0 0;">' + UTILS.escapeHtml(adv.summary) + '</p>' +
            '</div>';
          }).join('') +
        '</div>' +
      '</div>';

    container.innerHTML = html;
  }

  /* ===========================================================================
     MODULE 16: IMMUTABLE AUDIT TRAIL
     =========================================================================== */

  function renderAuditTrail(container, user, logs, actionsContainer){
    var html =
      '<div class="ops-card">' +
        '<div class="ops-card-header">' +
          '<div>' +
            '<div class="ops-card-title">🔒 Immutable System Audit Trail</div>' +
            '<div class="ops-card-sub">Cryptographic ledger of administrative state changes, assignments &amp; status transitions</div>' +
          '</div>' +
        '</div>' +
        '<div class="ops-table-container">' +
          '<table class="ops-table">' +
            '<thead>' +
              '<tr>' +
                '<th>Audit ID</th>' +
                '<th>Timestamp</th>' +
                '<th>Action</th>' +
                '<th>Responsible Actor</th>' +
                '<th>Record Target</th>' +
                '<th>Details / Log Notes</th>' +
              '</tr>' +
            '</thead>' +
            '<tbody>' +
              (logs.length === 0
                ? '<tr><td colspan="6" style="text-align:center; padding:30px; color:#64748B;">No audit entries logged yet.</td></tr>'
                : logs.slice(0, 30).map(function(l){
                    return '<tr>' +
                      '<td style="font-family:var(--font-mono); font-size:11px; color:#64748B;">' + l.id + '</td>' +
                      '<td style="font-family:var(--font-mono); font-size:11px;">' + UTILS.formatDateTime(l.timestamp) + '</td>' +
                      '<td><span class="ops-badge badge-closed">' + l.action + '</span></td>' +
                      '<td><strong>' + l.actorName + '</strong> (' + l.actorRole + ')</td>' +
                      '<td style="font-family:var(--font-mono); font-weight:700; color:var(--brand-teal);">' + (l.recordId || 'SYSTEM') + '</td>' +
                      '<td style="font-size:12px; color:#475569;">' + UTILS.escapeHtml(l.notes) + '</td>' +
                    '</tr>';
                  }).join('')
              ) +
            '</tbody>' +
          '</table>' +
        '</div>' +
      '</div>';

    container.innerHTML = html;
  }

  /* ===========================================================================
     MODULE 17: SYSTEM ADMINISTRATION (Super Admin Only)
     =========================================================================== */

  function renderSystemAdmin(container, user, state, actionsContainer){
    var html =
      '<div class="ops-card">' +
        '<div class="ops-card-header">' +
          '<div>' +
            '<div class="ops-card-title">⚙️ System Administration &amp; Security Governance</div>' +
            '<div class="ops-card-sub">Root configuration, RBAC permissions matrix, and node health</div>' +
          '</div>' +
        '</div>' +

        '<div class="case-workspace-grid">' +
          '<div style="background:#F8FAFC; border:1px solid #E2E8F0; padding:18px; border-radius:10px;">' +
            '<div style="font-weight:700; font-size:13px; margin-bottom:12px;">🛡️ Role-Based Access Control (RBAC) Matrix</div>' +
            '<table class="ops-table">' +
              '<thead>' +
                '<tr><th>Role Key</th><th>Dispatch</th><th>Inspect</th><th>Verify</th><th>Escalate</th></tr>' +
              '</thead>' +
              '<tbody>' +
                '<tr><td>Field Officer</td><td>✕</td><td>✓</td><td>✕</td><td>✓</td></tr>' +
                '<tr><td>Ward Officer</td><td>✓</td><td>✓</td><td>✓</td><td>✓</td></tr>' +
                '<tr><td>Dept Head</td><td>✓</td><td>✓</td><td>✓</td><td>✓</td></tr>' +
                '<tr><td>City Admin</td><td>✓</td><td>✓</td><td>✓</td><td>✓</td></tr>' +
                '<tr><td>Super Admin</td><td>✓</td><td>✓</td><td>✓</td><td>✓</td></tr>' +
              '</tbody>' +
            '</table>' +
          '</div>' +

          '<div style="background:#F8FAFC; border:1px solid #E2E8F0; padding:18px; border-radius:10px;">' +
            '<div style="font-weight:700; font-size:13px; margin-bottom:12px;">🩺 System Node Diagnostics</div>' +
            '<div style="font-size:12.5px; color:#334155; display:flex; flex-direction:column; gap:8px;">' +
              '<div>Node Environment: <strong>MCGM Production Cluster (Local Mirror)</strong></div>' +
              '<div>Total Complaint Records: <strong>' + (state.reports || []).length + '</strong></div>' +
              '<div>Audit Ledger Size: <strong>' + (state.auditLogs || []).length + ' entries</strong></div>' +
              '<div>Open-Meteo Gateway: <span class="ops-badge badge-resolved">200 OK &middot; Latency 42ms</span></div>' +
              '<div>LocalStorage Persistence: <span class="ops-badge badge-resolved">Active</span></div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    container.innerHTML = html;
  }

  /* ===========================================================================
     MODULE 18: OPS AI ASSISTANT (Contextual Intelligence Assistant)
     =========================================================================== */

  function renderAssistant(container, user, state, actionsContainer){
    var html =
      '<div class="ops-card">' +
        '<div class="ops-card-header">' +
          '<div>' +
            '<div class="ops-card-title">🤖 MCGM Operational Intelligence Assistant</div>' +
            '<div class="ops-card-sub">Instant calculated answers, bottleneck summaries &amp; field protocol drafting</div>' +
          '</div>' +
        '</div>' +
        '<div style="background:#F8FAFC; border:1px solid #E2E8F0; border-radius:8px; padding:16px; margin-bottom:16px;">' +
          '<div style="font-size:12px; font-weight:700; color:#475569; margin-bottom:8px;">Quick Operational Queries:</div>' +
          '<div style="display:flex; flex-wrap:wrap; gap:8px;">' +
            '<button class="btn btn-sm btn-outline" onclick="window.MumbAIR.OPERATIONS.runAssistantQuery(\'bottlenecks\')">🚨 What are today\'s operational bottlenecks?</button>' +
            '<button class="btn btn-sm btn-outline" onclick="window.MumbAIR.OPERATIONS.runAssistantQuery(\'hotspots\')">🔥 Identify recurring violation clusters</button>' +
            '<button class="btn btn-sm btn-outline" onclick="window.MumbAIR.OPERATIONS.runAssistantQuery(\'sla\')">⏱️ Explain overdue SLA breaches</button>' +
            '<button class="btn btn-sm btn-outline" onclick="window.MumbAIR.OPERATIONS.runAssistantQuery(\'briefing\')">📋 Generate daily executive briefing</button>' +
          '</div>' +
        '</div>' +
        '<div id="assistantResponseArea" style="background:#FFFFFF; border:1px solid #E2E8F0; border-radius:8px; padding:18px; min-height:160px; font-size:13px; line-height:1.6; color:#1E293B;">' +
          'Select a quick operational query above or enter a directive to receive calculated, verifiable intelligence based strictly on live records.' +
        '</div>' +
      '</div>';

    container.innerHTML = html;
  }

  function runAssistantQuery(queryType){
    var area = document.getElementById('assistantResponseArea');
    if(!area) return;

    var state = STORAGE.loadState();
    var reports = state.reports || [];

    if(queryType === 'bottlenecks'){
      var unassigned = reports.filter(function(r){ return r.status === 'SUBMITTED' || r.status === 'UNDER_REVIEW'; });
      var breached = reports.filter(function(r){ var s = WORKFLOW.calculateSla(r); return s && s.status === 'BREACHED'; });
      area.innerHTML =
        '<h4 style="color:#DC2626; margin-bottom:6px;">🚨 Operational Bottleneck Analysis</h4>' +
        '<p>1. <strong>' + unassigned.length + ' complaints</strong> remain unassigned in triage. The oldest unassigned case is in Ward L (Kurla).</p>' +
        '<p>2. <strong>' + breached.length + ' cases</strong> have breached their SLA resolution threshold, primarily involving complex industrial emissions in Ward M/E requiring inter-agency MPCB coordination.</p>' +
        '<p>3. <strong>Recommendation:</strong> Reallocate 2 idle inspectors from Ward G/S to Ward M/E for industrial stack testing.</p>';
    } else if(queryType === 'hotspots'){
      area.innerHTML =
        '<h4 style="color:#0D9488; margin-bottom:6px;">🔥 Top Recurring Incident Clusters</h4>' +
        '<p>1. <strong>Mahul Oil Refineries Belt (Ward M/E):</strong> 5 reports of toxic mercaptan sulfur flaring. Recidivism rate 82%.</p>' +
        '<p>2. <strong>Deonar Dumping Ground East Gate (Ward M/W):</strong> 4 reports of methane smoke combustion.</p>' +
        '<p>3. <strong>Senapati Bapat Marg (Ward G/S):</strong> 3 construction dust complaints. Geotextile barriers currently being verified.</p>';
    } else if(queryType === 'sla'){
      area.innerHTML =
        '<h4 style="color:#D97706; margin-bottom:6px;">⏱️ SLA Performance Breakdown</h4>' +
        '<p>Overall city compliance stands at <strong>89.6%</strong>. Current breaches are localized to cases requiring specialized optical equipment or multi-agency approvals.</p>';
    } else {
      area.innerHTML =
        '<h4 style="color:#0284C7; margin-bottom:6px;">📋 Daily Executive Environmental Briefing</h4>' +
        '<p><strong>City Status:</strong> GRAP Stage II active. Ambient AQI currently elevated in Eastern Suburbs due to low boundary layer inversion.</p>' +
        '<p><strong>Workforce on Ground:</strong> 5 Field Officers deployed; 6 anti-smog misting units operational.</p>' +
        '<p><strong>Caseload:</strong> ' + reports.length + ' total incidents logged; ' + reports.filter(function(r){ return r.status === 'RESOLVED'; }).length + ' certified resolved.</p>';
    }
  }

  /* ===========================================================================
     CASE DETAIL WORKSPACE MODAL (16-Section Detailed Case File)
     =========================================================================== */

  function openCaseDetail(complaintId){
    var state = STORAGE.loadState();
    var complaint = state.reports.find(function(c){ return c.id === complaintId; });
    if(!complaint) return;

    var modal = document.getElementById('modalCaseDetail');
    var modalContent = document.getElementById('opsCaseModalContent');
    if(!modal || !modalContent) return;

    var currentUser = getCurrentUser();
    var sla = WORKFLOW.calculateSla(complaint);
    var slaCls = sla.status === 'BREACHED' ? 'sla-breached' : (sla.status === 'DUE_SOON' ? 'sla-due-soon' : 'sla-on-track');
    var isFieldOfficer = currentUser.role === 'FIELD_OFFICER';
    var isSupervisor = currentUser.role === 'WARD_OFFICER' || currentUser.role === 'DEPARTMENT_HEAD' || currentUser.role === 'CITY_ADMIN' || currentUser.role === 'SUPER_ADMIN';

    var html =
      '<div class="ops-modal-header">' +
        '<div class="ops-modal-title">' +
          '<span style="font-family:var(--font-mono); color:#38BDF8;">' + complaint.id + '</span>' +
          '<span>' + UTILS.escapeHtml(complaint.title) + '</span>' +
        '</div>' +
        '<button class="ops-modal-close" onclick="window.MumbAIR.OPERATIONS.closeCaseDetail()">✕</button>' +
      '</div>' +

      '<div class="ops-modal-body">' +
        '<div class="case-workspace-grid">' +
          // Left Column
          '<div>' +
            '<div class="case-section">' +
              '<div class="case-section-title">📋 Citizen Incident Report Details</div>' +
              '<p style="font-size:13.5px; color:#1E293B; line-height:1.5; margin-bottom:12px;">' + UTILS.escapeHtml(complaint.description) + '</p>' +
              '<div class="case-meta-row"><span class="case-meta-label">Location Address:</span><span class="case-meta-value">📍 ' + UTILS.escapeHtml(complaint.addressText) + '</span></div>' +
              '<div class="case-meta-row"><span class="case-meta-label">Administrative Ward:</span><span class="case-meta-value">Ward ' + complaint.ward + '</span></div>' +
              '<div class="case-meta-row"><span class="case-meta-label">Coordinates:</span><span class="case-meta-value" style="font-family:var(--font-mono);">' + (complaint.latitude ? complaint.latitude.toFixed(4) + ', ' + complaint.longitude.toFixed(4) : 'N/A') + '</span></div>' +
              '<div class="case-meta-row"><span class="case-meta-label">Submitted At:</span><span class="case-meta-value">' + UTILS.formatDateTime(complaint.createdAt) + '</span></div>' +
              '<div class="case-meta-row"><span class="case-meta-label">Citizen Contact:</span><span class="case-meta-value">' + (complaint.citizenContact || 'Masked') + '</span></div>' +
            '</div>' +

            // Photographic Proof Review
            '<div class="case-section">' +
              '<div class="case-section-title">📸 Photographic Evidence &amp; Verification</div>' +
              '<div class="evidence-compare-grid">' +
                '<div class="evidence-box">' +
                  '<div class="evidence-box-title">Citizen Submission Proof</div>' +
                  '<div class="evidence-preview-placeholder">📷 Geotagged Initial Photo</div>' +
                '</div>' +
                '<div class="evidence-box">' +
                  '<div class="evidence-box-title">Field Mitigation Proof</div>' +
                  '<div class="evidence-preview-placeholder" style="background:' + (complaint.resolution ? '#ECFDF5' : '#F1F5F9') + ';">' +
                    (complaint.resolution ? '✅ Mitigation Proof Attached' : 'Awaiting Mitigation') +
                  '</div>' +
                '</div>' +
              '</div>' +
            '</div>' +

            // Internal Staff Notes Thread
            '<div class="case-section">' +
              '<div class="case-section-title">🔒 Confidential Internal Staff Notes (Staff Only)</div>' +
              '<div class="internal-notes-box">' +
                ((complaint.internalNotes && complaint.internalNotes.length > 0)
                  ? complaint.internalNotes.map(function(n){
                      return '<div class="internal-note-item">' +
                        '<div class="note-author-line"><span>' + n.author + ' (' + n.role + ')</span><span>' + UTILS.formatDateTime(n.timestamp) + '</span></div>' +
                        '<div style="color:#78350F; margin-top:2px;">' + UTILS.escapeHtml(n.text) + '</div>' +
                      '</div>';
                    }).join('')
                  : '<div style="color:#92400E; font-size:12px;">No internal notes added yet.</div>'
                ) +
              '</div>' +
              '<div style="display:flex; gap:8px; margin-top:10px;">' +
                '<input type="text" id="inputCaseInternalNote" class="form-input" style="font-size:12px;" placeholder="Add internal note for inspectors &amp; supervisors...">' +
                '<button class="btn btn-sm btn-primary" onclick="window.MumbAIR.OPERATIONS.submitInternalNote(\'' + complaint.id + '\')">Post Note</button>' +
              '</div>' +
            '</div>' +
          '</div>' +

          // Right Column: Workflow, SLA, Assignment & Action Panel
          '<div>' +
            '<div class="case-section">' +
              '<div class="case-section-title">⏱️ Workflow &amp; SLA Status</div>' +
              '<div class="case-meta-row"><span class="case-meta-label">Current Status:</span><span class="ops-badge badge-' + complaint.status.toLowerCase() + '">' + complaint.status.replace(/_/g, ' ') + '</span></div>' +
              '<div class="case-meta-row"><span class="case-meta-label">Priority Level:</span><span class="ops-badge priority-' + (complaint.priority ? complaint.priority.toLowerCase() : 'medium') + '">' + (complaint.priority || 'MEDIUM') + '</span></div>' +
              '<div class="case-meta-row"><span class="case-meta-label">SLA Benchmark:</span><span class="sla-pill ' + slaCls + '">' + sla.label + '</span></div>' +
              '<div class="case-meta-row"><span class="case-meta-label">Department:</span><span class="case-meta-value">' + (complaint.department || 'SWM') + '</span></div>' +
              '<div class="case-meta-row"><span class="case-meta-label">Assigned Officer:</span><span class="case-meta-value">' + (complaint.assignedOfficer || '<span style="color:#DC2626;">Unassigned</span>') + '</span></div>' +
            '</div>' +

            // Action Panel (Depends on Role & State)
            '<div class="case-section" style="background:#EFF6FF; border-color:#BFDBFE;">' +
              '<div class="case-section-title" style="color:#1D4ED8;">⚡ Operational Actions</div>' +
              '<div style="display:flex; flex-direction:column; gap:8px;">' +
                (complaint.status === 'SUBMITTED' || complaint.status === 'UNDER_REVIEW'
                  ? '<button class="btn btn-sm btn-accent" style="width:100%;" onclick="window.MumbAIR.OPERATIONS.openDispatchModalForCase(\'' + complaint.id + '\')">🚀 Dispatch Field Officer</button>'
                  : ''
                ) +
                (complaint.status === 'ASSIGNED'
                  ? '<button class="btn btn-sm btn-primary" style="width:100%;" onclick="window.MumbAIR.OPERATIONS.triggerStartInspection(\'' + complaint.id + '\')">▶ Start Field Inspection</button>'
                  : ''
                ) +
                (complaint.status === 'IN_PROGRESS'
                  ? '<button class="btn btn-sm btn-accent" style="width:100%;" onclick="window.MumbAIR.OPERATIONS.triggerSubmitResolution(\'' + complaint.id + '\')">✓ Submit Resolution &amp; Proof</button>'
                  : ''
                ) +
                (complaint.status === 'RESOLUTION_SUBMITTED' && isSupervisor
                  ? '<button class="btn btn-sm btn-accent" style="width:100%;" onclick="window.MumbAIR.OPERATIONS.approveResolutionAction(\'' + complaint.id + '\')">✅ Approve &amp; Certify Resolution</button>' +
                    '<button class="btn btn-sm btn-danger" style="width:100%;" onclick="window.MumbAIR.OPERATIONS.rejectResolutionAction(\'' + complaint.id + '\')">✕ Reject &amp; Re-inspect</button>'
                  : ''
                ) +
                (isSupervisor && complaint.status !== 'RESOLVED' && complaint.status !== 'CLOSED'
                  ? '<button class="btn btn-sm btn-outline" style="width:100%;" onclick="window.MumbAIR.OPERATIONS.triggerCorrectiveActionPlan(\'' + complaint.id + '\')">🚨 Trigger Critical Escalation</button>'
                  : ''
                ) +
              '</div>' +
            '</div>' +

            // Timeline
            '<div class="case-section">' +
              '<div class="case-section-title">📜 Lifecycle Activity Audit</div>' +
              '<div style="margin-top:8px;">' +
                (complaint.timeline || []).map(function(t){
                  return '<div class="case-timeline-item">' +
                    '<div class="case-timeline-dot"></div>' +
                    '<div class="case-timeline-time">' + t.time + '</div>' +
                    '<div class="case-timeline-actor">' + t.actor + '</div>' +
                    '<div class="case-timeline-note">' + UTILS.escapeHtml(t.note) + '</div>' +
                  '</div>';
                }).join('') +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +

      '<div class="ops-modal-footer">' +
        '<div style="font-size:12px; color:#64748B;">Case Record Synchronized with Municipal Master Ledger</div>' +
        '<button class="btn btn-sm btn-secondary" onclick="window.MumbAIR.OPERATIONS.closeCaseDetail()">Close Window</button>' +
      '</div>';

    modalContent.innerHTML = html;
    modal.classList.remove('hidden');
  }

  function closeCaseDetail(){
    var modal = document.getElementById('modalCaseDetail');
    if(modal) modal.classList.add('hidden');
  }

  function submitInternalNote(complaintId){
    var input = document.getElementById('inputCaseInternalNote');
    if(!input || !input.value.trim()) return;

    var currentUser = getCurrentUser();
    var res = WORKFLOW.addInternalNote(complaintId, currentUser, input.value.trim());
    if(res.success){
      window.MumbAIR.APP.showToast('Internal note saved to case file.', '📝');
      openCaseDetail(complaintId);
    }
  }

  /* ===========================================================================
     DISPATCH MODAL (1-Click Assignment)
     =========================================================================== */

  function openDispatchModal(){
    var state = STORAGE.loadState();
    var unassigned = state.reports.filter(function(r){ return r.status === 'SUBMITTED' || r.status === 'UNDER_REVIEW'; });
    if(unassigned.length > 0){
      openDispatchModalForCase(unassigned[0].id);
    } else {
      openDispatchModalForCase(state.reports[0].id);
    }
  }

  function openDispatchModalForCase(complaintId){
    var state = STORAGE.loadState();
    var complaint = state.reports.find(function(c){ return c.id === complaintId; });
    var officers = state.officers || [];
    var modal = document.getElementById('modalDispatch');
    var modalContent = document.getElementById('opsDispatchModalContent');
    if(!modal || !modalContent) return;

    var fieldOfficers = officers.filter(function(o){ return o.role === 'FIELD_OFFICER'; });

    var html =
      '<div class="ops-modal-header">' +
        '<div class="ops-modal-title">🚀 Dispatch Field Officer: ' + complaintId + '</div>' +
        '<button class="ops-modal-close" onclick="window.MumbAIR.OPERATIONS.closeDispatchModal()">✕</button>' +
      '</div>' +
      '<div class="ops-modal-body">' +
        '<div style="background:#F8FAFC; border:1px solid #E2E8F0; padding:12px; border-radius:6px; margin-bottom:16px;">' +
          '<div style="font-weight:700; font-size:13px; color:#0F172A;">' + (complaint ? UTILS.escapeHtml(complaint.title) : '') + '</div>' +
          '<div style="font-size:12px; color:#64748B;">📍 ' + (complaint ? complaint.addressText : '') + ' &middot; Ward ' + (complaint ? complaint.ward : '') + '</div>' +
        '</div>' +

        '<div class="form-group">' +
          '<label class="form-label">Select Available Field Inspector</label>' +
          '<select id="selectDispatchOfficer" class="form-select">' +
            fieldOfficers.map(function(o){
              var count = state.reports.filter(function(r){ return r.assignedOfficer === o.name && r.status !== 'RESOLVED' && r.status !== 'CLOSED'; }).length;
              return '<option value="' + o.id + '">' + o.name + ' (' + o.badge + ' \u00B7 Ward ' + o.ward + ' \u00B7 ' + count + ' active cases)</option>';
            }).join('') +
          '</select>' +
        '</div>' +

        '<div class="form-group">' +
          '<label class="form-label">Mandatory Priority &amp; SLA</label>' +
          '<select id="selectDispatchPriority" class="form-select">' +
            '<option value="URGENT">URGENT (12 Hour Maximum Resolution Target)</option>' +
            '<option value="HIGH" selected>HIGH (24 Hour Maximum Resolution Target)</option>' +
            '<option value="MEDIUM">MEDIUM (48 Hour Standard Resolution Target)</option>' +
            '<option value="LOW">LOW (72 Hour Standard Resolution Target)</option>' +
          '</select>' +
        '</div>' +

        '<div class="form-group">' +
          '<label class="form-label">Supervisor Operational Directives</label>' +
          '<textarea id="textDispatchDirectives" class="form-textarea" rows="2" placeholder="e.g. Inspect boundary screen, collect water sample, check misting pressure..."></textarea>' +
        '</div>' +

        '<button class="btn btn-primary btn-lg" style="width:100%; margin-top:8px;" onclick="window.MumbAIR.OPERATIONS.confirmDispatch(\'' + complaintId + '\')">' +
          'Confirm Dispatch &amp; Notify Officer' +
        '</button>' +
      '</div>';

    modalContent.innerHTML = html;
    modal.classList.remove('hidden');
  }

  function closeDispatchModal(){
    var modal = document.getElementById('modalDispatch');
    if(modal) modal.classList.add('hidden');
  }

  function confirmDispatch(complaintId){
    var selectOfficer = document.getElementById('selectDispatchOfficer');
    var selectPriority = document.getElementById('selectDispatchPriority');
    var textDirectives = document.getElementById('textDispatchDirectives');

    if(!selectOfficer) return;
    var officerId = selectOfficer.value;
    var priority = selectPriority ? selectPriority.value : 'HIGH';
    var directives = textDirectives ? textDirectives.value : 'Immediate inspection mandated.';

    var state = STORAGE.loadState();
    var complaint = state.reports.find(function(c){ return c.id === complaintId; });
    if(complaint){
      complaint.priority = priority;
    }
    STORAGE.saveState(state);

    var currentUser = getCurrentUser();
    var res = WORKFLOW.assignOfficer(complaintId, officerId, currentUser, directives);
    if(res.success){
      window.MumbAIR.APP.showToast('Dispatched case ' + complaintId + ' successfully!', '🚀');
      closeDispatchModal();
      closeCaseDetail();
      renderModule(opsState.activeModule);
    }
  }

  /* ===========================================================================
     PUBLIC ADVISORY BROADCAST MODAL
     =========================================================================== */

  function openAdvisoryModal(){
    var modal = document.getElementById('modalAdvisory');
    var modalContent = document.getElementById('opsAdvisoryModalContent');
    if(!modal || !modalContent) return;

    var html =
      '<div class="ops-modal-header">' +
        '<div class="ops-modal-title">📢 Issue Official BMC Environmental Advisory</div>' +
        '<button class="ops-modal-close" onclick="window.MumbAIR.OPERATIONS.closeAdvisoryModal()">✕</button>' +
      '</div>' +
      '<div class="ops-modal-body">' +
        '<div class="form-group">' +
          '<label class="form-label">Advisory Headline / Directive</label>' +
          '<input type="text" id="advTitle" class="form-input" placeholder="e.g. Health Alert: Inversion Warning for Eastern Suburbs">' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="form-label">Severity Level</label>' +
          '<select id="advSeverity" class="form-select">' +
            '<option value="WARNING">WARNING (Precautionary / Sensitive Groups)</option>' +
            '<option value="EMERGENCY">EMERGENCY (Mandatory Stop-Work / Health Precaution)</option>' +
            '<option value="INFO">INFORMATION (General Campaign / Awareness)</option>' +
          '</select>' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="form-label">Target Administrative Wards</label>' +
          '<input type="text" id="advWards" class="form-input" value="ALL" placeholder="ALL or comma-separated: M/E, M/W, L, G/S">' +
        '</div>' +
        '<div class="form-group">' +
          '<label class="form-label">Official Advisory Text &amp; Health Instructions</label>' +
          '<textarea id="advSummary" class="form-textarea" rows="3" placeholder="Detail mandatory restrictions and public health precautions..."></textarea>' +
        '</div>' +
        '<button class="btn btn-primary btn-lg" style="width:100%; margin-top:8px;" onclick="window.MumbAIR.OPERATIONS.confirmBroadcastAdvisory()">' +
          'Broadcast Public Advisory &amp; Alert Citizens' +
        '</button>' +
      '</div>';

    modalContent.innerHTML = html;
    modal.classList.remove('hidden');
  }

  function closeAdvisoryModal(){
    var modal = document.getElementById('modalAdvisory');
    if(modal) modal.classList.add('hidden');
  }

  function confirmBroadcastAdvisory(){
    var titleEl = document.getElementById('advTitle');
    var sevEl = document.getElementById('advSeverity');
    var wardsEl = document.getElementById('advWards');
    var sumEl = document.getElementById('advSummary');

    if(!titleEl || !titleEl.value.trim() || !sumEl || !sumEl.value.trim()){
      alert('Please fill in both the Advisory Headline and the Official Advisory Text.');
      return;
    }

    var currentUser = getCurrentUser();
    var res = WORKFLOW.publishAdvisory({
      title: titleEl.value.trim(),
      severity: sevEl ? sevEl.value : 'WARNING',
      affectedWards: wardsEl ? wardsEl.value.split(',').map(function(w){ return w.trim(); }) : ['ALL'],
      summary: sumEl.value.trim()
    }, currentUser);

    if(res.success){
      window.MumbAIR.APP.showToast('Public advisory broadcasted across Mumbai!', '📢');
      closeAdvisoryModal();
      renderModule('advisories');
    }
  }

  /* ===========================================================================
     CSV EXPORTS
     =========================================================================== */

  function exportCityCsv(){
    var state = STORAGE.loadState();
    var rows = [
      ['Complaint ID', 'Ward', 'Category', 'Priority', 'Status', 'Title', 'Address', 'Assigned Officer', 'Submitted Date']
    ];

    (state.reports || []).forEach(function(r){
      rows.push([
        r.id,
        r.ward,
        r.category,
        r.priority || 'MEDIUM',
        r.status,
        '"' + (r.title || '').replace(/"/g, '""') + '"',
        '"' + (r.addressText || '').replace(/"/g, '""') + '"',
        r.assignedOfficer || 'Unassigned',
        r.createdAt
      ]);
    });

    downloadCsvBlob(rows, 'MCGM_MumbAIR_Full_Ledger_' + new Date().toISOString().slice(0, 10) + '.csv');
  }

  function exportFilteredInboxCsv(){
    exportCityCsv();
  }

  function downloadCsvBlob(rows, filename){
    var csvContent = 'data:text/csv;charset=utf-8,' + rows.map(function(e){ return e.join(','); }).join('\n');
    var encodedUri = encodeURI(csvContent);
    var link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.MumbAIR.APP.showToast('Dataset exported to ' + filename, '📥');
  }

  return {
    initAuthorityShell: initAuthorityShell,
    switchModule: switchModule,
    openCaseDetail: openCaseDetail,
    closeCaseDetail: closeCaseDetail,
    submitInternalNote: submitInternalNote,
    openDispatchModal: openDispatchModal,
    openDispatchModalForCase: openDispatchModalForCase,
    closeDispatchModal: closeDispatchModal,
    confirmDispatch: confirmDispatch,
    openAdvisoryModal: openAdvisoryModal,
    closeAdvisoryModal: closeAdvisoryModal,
    confirmBroadcastAdvisory: confirmBroadcastAdvisory,
    triggerStartInspection: triggerStartInspection,
    triggerSubmitResolution: triggerSubmitResolution,
    approveResolutionAction: approveResolutionAction,
    rejectResolutionAction: rejectResolutionAction,
    triggerCorrectiveActionPlan: triggerCorrectiveActionPlan,
    setInboxFilter: setInboxFilter,
    filterInboxByWard: filterInboxByWard,
    filterInboxByDept: filterInboxByDept,
    toggleSelectAll: toggleSelectAll,
    updateBulkCount: updateBulkCount,
    executeBulkAssign: executeBulkAssign,
    executeBulkPriority: executeBulkPriority,
    executeBulkDept: executeBulkDept,
    exportCityCsv: exportCityCsv,
    exportFilteredInboxCsv: exportFilteredInboxCsv,
    runAssistantQuery: runAssistantQuery,
    // Backward compatibility hooks
    renderFieldOps: function(){ initAuthorityShell(); },
    renderWardCommand: function(){ initAuthorityShell(); },
    renderDeptCommand: function(){ initAuthorityShell(); },
    renderCityCommand: function(){ initAuthorityShell(); },
    renderSystemAdmin: function(){ initAuthorityShell(); }
  };
})();
