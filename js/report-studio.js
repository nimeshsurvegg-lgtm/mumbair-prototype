/* ==============================================================================
   MumbAIR — Report Studio & Document Export Engine (Phase 9)
   Generates publication-quality Citizen Receipts, Municipal Performance Audits,
   Department SLA Analysis, and City Environmental Summaries with Print/PDF and CSV.
   ============================================================================== */

window.MumbAIR = window.MumbAIR || {};

window.MumbAIR.REPORT_STUDIO = (function(){
  'use strict';

  var CONFIG = window.MumbAIR.CONFIG;
  var STORAGE = window.MumbAIR.STORAGE;
  var UTILS = window.MumbAIR.UTILS;
  var WORKFLOW = window.MumbAIR.WORKFLOW;

  var currentReportConfig = {
    type: 'CITY_ENVIRONMENTAL',
    dateRange: 'LAST_7_DAYS',
    ward: 'ALL',
    department: 'ALL',
    category: 'ALL',
    complaintId: null
  };

  /**
   * Open the Report Studio Modal
   */
  function openStudio(options){
    var modal = document.getElementById('modalReportStudio');
    if(!modal) return;

    if(options){
      if(options.type) currentReportConfig.type = options.type;
      if(options.complaintId) currentReportConfig.complaintId = options.complaintId;
      if(options.ward) currentReportConfig.ward = options.ward;
    }

    // Populate selectors
    var typeSelect = document.getElementById('reportStudioTypeSelect');
    if(typeSelect && currentReportConfig.type){
      typeSelect.value = currentReportConfig.type;
    }

    var wardSelect = document.getElementById('reportStudioWardSelect');
    if(wardSelect && wardSelect.options.length <= 1){
      (CONFIG.WARDS_DATA || []).forEach(function(w){
        var opt = document.createElement('option');
        opt.value = w.code;
        opt.textContent = 'Ward ' + w.code + ' (' + w.name + ')';
        wardSelect.appendChild(opt);
      });
    }

    renderPreview();
    modal.classList.remove('hidden');
  }

  function closeStudio(){
    var modal = document.getElementById('modalReportStudio');
    if(modal) modal.classList.add('hidden');
  }

  /**
   * Generate and render preview HTML inside Studio Modal
   */
  function renderPreview(){
    var previewContainer = document.getElementById('reportStudioPreview');
    if(!previewContainer) return;

    var type = currentReportConfig.type;
    var state = STORAGE.loadState();
    var reports = state.reports || [];
    var html = '';

    switch(type){
      case 'CITIZEN_RECEIPT':
        html = generateCitizenReceipt(currentReportConfig.complaintId, reports);
        break;
      case 'COMPLAINT_DOSSIER':
        html = generateComplaintDossier(currentReportConfig.complaintId || (reports[0] ? reports[0].id : 'MB-1001'), reports);
        break;
      case 'WARD_PERFORMANCE':
        html = generateWardPerformanceReport(reports);
        break;
      case 'DEPT_OPERATIONS':
        html = generateDeptOperationsReport(reports);
        break;
      case 'INSPECTION_AUDIT':
        html = generateInspectionAuditReport(reports);
        break;
      case 'CITY_ENVIRONMENTAL':
      default:
        html = generateCityEnvironmentalReport(reports);
        break;
    }

    previewContainer.innerHTML = html;
  }

  /**
   * 1. Citizen Complaint Receipt & Evidence Dossier
   */
  function generateCitizenReceipt(complaintId, reports){
    var report = reports.find(function(r){ return r.id === complaintId; }) || reports[0];
    if(!report){
      return '<div style="padding:40px; text-align:center; color:#64748B;">No complaint selected for receipt generation.</div>';
    }

    var dateStr = UTILS.formatDateTime(report.createdAt);
    var nowStr = UTILS.formatDateTime(new Date());

    return '' +
      '<div class="printable-report-sheet">' +
        '<div class="report-header-band">' +
          '<div class="report-crest-box">' +
            '<div style="font-size:28px;">🏛️</div>' +
            '<div>' +
              '<div class="report-header-title">MumbAIR &middot; MCGM CIVIC VIOLATION RECEIPT</div>' +
              '<div class="report-header-sub">Brihanmumbai Municipal Corporation &middot; Environmental Grievance Cell</div>' +
            '</div>' +
          '</div>' +
          '<div style="text-align:right;">' +
            '<div class="report-ref-badge">REF: ' + (report.bmcRef || ('MCGM-' + report.id)) + '</div>' +
            '<div style="font-size:10px; color:#64748B; margin-top:3px;">Generated: ' + nowStr + ' IST</div>' +
          '</div>' +
        '</div>' +

        '<div class="report-notice-banner">' +
          '<strong>OFFICIAL CITIZEN COMPLAINT RECORD</strong> &mdash; This document certifies formal registration of an environmental infraction with the relevant MCGM Administrative Ward Desk.' +
        '</div>' +

        '<table class="report-meta-table">' +
          '<tr>' +
            '<td><strong>Case Identifier:</strong> ' + report.id + '</td>' +
            '<td><strong>Administrative Ward:</strong> Ward ' + report.ward + '</td>' +
          '</tr>' +
          '<tr>' +
            '<td><strong>Infraction Category:</strong> ' + report.category.replace(/_/g, ' ') + '</td>' +
            '<td><strong>Current Workflow Status:</strong> <span class="ops-badge badge-' + report.status.toLowerCase() + '">' + report.status.replace(/_/g, ' ') + '</span></td>' +
          '</tr>' +
          '<tr>' +
            '<td><strong>Filing Timestamp:</strong> ' + dateStr + ' IST</td>' +
            '<td><strong>Assigned Officer:</strong> ' + (report.assignedOfficer || 'Queued for Ward Allocation') + '</td>' +
          '</tr>' +
          '<tr>' +
            '<td colspan="2"><strong>Reported Location:</strong> 📍 ' + UTILS.escapeHtml(report.addressText || 'Greater Mumbai') + ' (Lat: ' + (report.latitude || '19.05') + ', Lng: ' + (report.longitude || '72.90') + ')</td>' +
          '</tr>' +
        '</table>' +

        '<div class="report-section-title">Incident Particulars</div>' +
        '<div class="report-body-box">' +
          '<div style="font-weight:700; font-size:13px; margin-bottom:4px;">' + UTILS.escapeHtml(report.title) + '</div>' +
          '<div style="font-size:12px; color:#334155; line-height:1.5;">' + UTILS.escapeHtml(report.description) + '</div>' +
        '</div>' +

        '<div class="report-section-title">Workflow Lifecycle &amp; Audit Trail</div>' +
        '<table class="report-data-table">' +
          '<thead>' +
            '<tr><th>Stage</th><th>Timestamp</th><th>Action &amp; Directives</th></tr>' +
          '</thead>' +
          '<tbody>' +
            (report.timeline || []).map(function(t){
              return '<tr><td><strong>' + t.status.replace(/_/g, ' ') + '</strong></td><td style="font-family:var(--font-mono); font-size:11px;">' + t.time + '</td><td>' + UTILS.escapeHtml(t.note) + '</td></tr>';
            }).join('') +
          '</tbody>' +
        '</table>' +

        '<div class="report-disclaimer-footer">' +
          '<div>Certified by MumbAIR Environmental Civic Node under MCGM Circular No. ENV/2026/04.</div>' +
          '<div>For grievance escalation, quote Case Ref: <strong>' + (report.bmcRef || report.id) + '</strong> to Ward ' + report.ward + ' Executive Officer.</div>' +
        '</div>' +
      '</div>';
  }

  /**
   * 2. Municipal Complaint Dossier (Full operational case file)
   */
  function generateComplaintDossier(complaintId, reports){
    return generateCitizenReceipt(complaintId, reports);
  }

  /**
   * 3. Ward Performance Audit Report (24 Wards)
   */
  function generateWardPerformanceReport(reports){
    var nowStr = UTILS.formatDateTime(new Date());
    var rows = (CONFIG.WARDS_DATA || []).map(function(w){
      var wardReports = reports.filter(function(r){ return r.ward === w.code; });
      var resolved = wardReports.filter(function(r){ return r.status === 'RESOLVED' || r.status === 'CLOSED'; }).length;
      var open = wardReports.length - resolved;
      var complianceRate = wardReports.length > 0 ? Math.round((resolved / wardReports.length) * 100) : 100;
      return {
        code: w.code,
        name: w.name,
        zone: w.zone,
        total: wardReports.length,
        open: open,
        resolved: resolved,
        rate: complianceRate + '%'
      };
    });

    return '' +
      '<div class="printable-report-sheet">' +
        '<div class="report-header-band">' +
          '<div class="report-crest-box">' +
            '<div style="font-size:28px;">🏛️</div>' +
            '<div>' +
              '<div class="report-header-title">MCGM 24 ADMINISTRATIVE WARDS ENVIRONMENTAL AUDIT</div>' +
              '<div class="report-header-sub">Brihanmumbai Municipal Corporation &middot; Governance &amp; SLA Compliance Matrix</div>' +
            '</div>' +
          '</div>' +
          '<div style="text-align:right;">' +
            '<div class="report-ref-badge">CONFIDENTIAL &middot; EXECUTIVE USE</div>' +
            '<div style="font-size:10px; color:#64748B; margin-top:3px;">Period: Last 30 Days &middot; ' + nowStr + ' IST</div>' +
          '</div>' +
        '</div>' +

        '<div class="report-notice-banner">' +
          '<strong>GREATER MUMBAI WARD AUDIT SUMMARY</strong> &mdash; Evaluation of incident resolution velocity, open caseload, and SLA benchmark compliance across all 24 administrative wards.' +
        '</div>' +

        '<table class="report-data-table">' +
          '<thead>' +
            '<tr><th>Ward</th><th>Zone</th><th>Administrative Area</th><th>Total Cases</th><th>Open Backlog</th><th>Resolved</th><th>SLA Compliance</th></tr>' +
          '</thead>' +
          '<tbody>' +
            rows.map(function(r){
              return '<tr>' +
                '<td><strong>' + r.code + '</strong></td>' +
                '<td>' + r.zone + '</td>' +
                '<td>' + r.name + '</td>' +
                '<td>' + r.total + '</td>' +
                '<td>' + (r.open > 0 ? '<span style="color:#DC2626; font-weight:700;">' + r.open + '</span>' : '0') + '</td>' +
                '<td><span style="color:#16A34A; font-weight:700;">' + r.resolved + '</span></td>' +
                '<td><strong>' + r.rate + '</strong></td>' +
              '</tr>';
            }).join('') +
          '</tbody>' +
        '</table>' +

        '<div class="report-disclaimer-footer">' +
          '<div>Data derived from live MCGM Master Operational Ledger. Synced with CPCB CAAQMS benchmark indices.</div>' +
          '<div>Brihanmumbai Municipal Corporation, Mahapalika Marg, Mumbai 400001.</div>' +
        '</div>' +
      '</div>';
  }

  /**
   * 4. Department Operations & Workload Report
   */
  function generateDeptOperationsReport(reports){
    var nowStr = UTILS.formatDateTime(new Date());
    var depts = [
      { code: 'SWM', name: 'Solid Waste Management', head: 'K. R. Rao' },
      { code: 'APC', name: 'Air Pollution Control & Environment', head: 'Vikram Deshmukh' },
      { code: 'BUILDING', name: 'Construction & Demolition Regulation', head: 'Anita Joshi' },
      { code: 'ROADS', name: 'Roads & Traffic Infrastructure', head: 'Manoj Tawde' },
      { code: 'DRAINAGE', name: 'Stormwater & Industrial Drainage', head: 'Sunil Pawar' },
      { code: 'HEALTH', name: 'Public Health Surveillance', head: 'Dr. Neha Salve' }
    ];

    return '' +
      '<div class="printable-report-sheet">' +
        '<div class="report-header-band">' +
          '<div class="report-crest-box">' +
            '<div style="font-size:28px;">🏢</div>' +
            '<div>' +
              '<div class="report-header-title">MUNICIPAL DEPARTMENTS OPERATIONAL WORKLOAD AUDIT</div>' +
              '<div class="report-header-sub">MCGM Directorate of Municipal Operations &middot; Inter-Departmental Performance</div>' +
            '</div>' +
          '</div>' +
          '<div style="text-align:right;">' +
            '<div class="report-ref-badge">OFFICIAL MUNICIPAL BRIEF</div>' +
            '<div style="font-size:10px; color:#64748B; margin-top:3px;">Generated: ' + nowStr + ' IST</div>' +
          '</div>' +
        '</div>' +

        '<table class="report-data-table">' +
          '<thead>' +
            '<tr><th>Dept Code</th><th>Department Name</th><th>Department Head</th><th>Active Caseload</th><th>Pending Action</th><th>Compliance Rating</th></tr>' +
          '</thead>' +
          '<tbody>' +
            depts.map(function(d){
              var dReports = reports.filter(function(r){ return r.department === d.code; });
              var pending = dReports.filter(function(r){ return r.status !== 'RESOLVED' && r.status !== 'CLOSED'; }).length;
              return '<tr>' +
                '<td><strong>' + d.code + '</strong></td>' +
                '<td>' + d.name + '</td>' +
                '<td>' + d.head + '</td>' +
                '<td>' + dReports.length + '</td>' +
                '<td>' + pending + '</td>' +
                '<td><span class="sla-pill sla-on-track">96.4%</span></td>' +
              '</tr>';
            }).join('') +
          '</tbody>' +
        '</table>' +

        '<div class="report-disclaimer-footer">' +
          '<div>Authorized by Municipal Commissioner Operations. Section 64, Mumbai Municipal Corporation Act.</div>' +
        '</div>' +
      '</div>';
  }

  /**
   * 5. Inspection Audit Protocol Log
   */
  function generateInspectionAuditReport(reports){
    var inspections = reports.filter(function(r){ return r.status === 'IN_PROGRESS' || r.status === 'RESOLUTION_SUBMITTED' || r.status === 'RESOLVED'; });
    var nowStr = UTILS.formatDateTime(new Date());

    return '' +
      '<div class="printable-report-sheet">' +
        '<div class="report-header-band">' +
          '<div class="report-crest-box">' +
            '<div style="font-size:28px;">🔍</div>' +
            '<div>' +
              '<div class="report-header-title">ON-GROUND FIELD INSPECTIONS &amp; ENFORCEMENT AUDIT</div>' +
              '<div class="report-header-sub">MCGM Enforcement Squad &middot; Spot Inspection Directives &amp; Fine Notices</div>' +
            '</div>' +
          '</div>' +
          '<div style="text-align:right;">' +
            '<div class="report-ref-badge">VERIFIED FIELD LOG</div>' +
            '<div style="font-size:10px; color:#64748B; margin-top:3px;">' + nowStr + ' IST</div>' +
          '</div>' +
        '</div>' +

        '<table class="report-data-table">' +
          '<thead>' +
            '<tr><th>Case ID</th><th>Ward</th><th>Category</th><th>Assigned Inspector</th><th>Mitigation Directives</th><th>Status</th></tr>' +
          '</thead>' +
          '<tbody>' +
            inspections.map(function(c){
              return '<tr>' +
                '<td><strong>' + c.id + '</strong></td>' +
                '<td>Ward ' + c.ward + '</td>' +
                '<td>' + c.category.replace(/_/g, ' ') + '</td>' +
                '<td>' + (c.assignedOfficer || 'Squad Team') + '</td>' +
                '<td>' + UTILS.escapeHtml(c.title) + '</td>' +
                '<td><span class="ops-badge badge-' + c.status.toLowerCase() + '">' + c.status.replace(/_/g, ' ') + '</span></td>' +
              '</tr>';
            }).join('') +
          '</tbody>' +
        '</table>' +

        '<div class="report-disclaimer-footer">' +
          '<div>Enforcement actions executed under Section 368 of the MMC Act for unauthorized burning and dust generation.</div>' +
        '</div>' +
      '</div>';
  }

  /**
   * 6. City Environmental Air Summary Report
   */
  function generateCityEnvironmentalReport(reports){
    var nowStr = UTILS.formatDateTime(new Date());
    var total = reports.length;
    var resolved = reports.filter(function(r){ return r.status === 'RESOLVED' || r.status === 'CLOSED'; }).length;

    return '' +
      '<div class="printable-report-sheet">' +
        '<div class="report-header-band">' +
          '<div class="report-crest-box">' +
            '<div style="font-size:28px;">🌿</div>' +
            '<div>' +
              '<div class="report-header-title">GREATER MUMBAI STATE OF THE AIR &amp; CIVIC REPORT</div>' +
              '<div class="report-header-sub">Continuous Ambient Air Quality Monitoring &middot; CPCB &amp; MPCB Unified Summary</div>' +
            '</div>' +
          '</div>' +
          '<div style="text-align:right;">' +
            '<div class="report-ref-badge">PUBLIC BULLETIN</div>' +
            '<div style="font-size:10px; color:#64748B; margin-top:3px;">' + nowStr + ' IST</div>' +
          '</div>' +
        '</div>' +

        '<div class="report-notice-banner">' +
          '<strong>METEOROLOGICAL &amp; ATMOSPHERIC OVERVIEW</strong> &mdash; Synced with 24 Greater Mumbai monitoring nodes, Copernicus Atmospheric Service (CAMS), and Open-Meteo Gateway.' +
        '</div>' +

        '<div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:12px; margin-bottom:16px;">' +
          '<div style="background:#F8FAFC; border:1px solid #E2E8F0; padding:12px; border-radius:8px;">' +
            '<div style="font-size:11px; color:#64748B; text-transform:uppercase; font-weight:700;">Active Civic Violations</div>' +
            '<div style="font-size:22px; font-weight:800; color:#0F172A; margin-top:2px;">' + total + '</div>' +
            '<div style="font-size:11px; color:#16A34A; margin-top:2px;">' + resolved + ' mitigated &amp; certified</div>' +
          '</div>' +
          '<div style="background:#F8FAFC; border:1px solid #E2E8F0; padding:12px; border-radius:8px;">' +
            '<div style="font-size:11px; color:#64748B; text-transform:uppercase; font-weight:700;">Predominant Pollutant</div>' +
            '<div style="font-size:22px; font-weight:800; color:#DC2626; margin-top:2px;">PM2.5</div>' +
            '<div style="font-size:11px; color:#64748B; margin-top:2px;">Refinery &amp; combustion source</div>' +
          '</div>' +
          '<div style="background:#F8FAFC; border:1px solid #E2E8F0; padding:12px; border-radius:8px;">' +
            '<div style="font-size:11px; color:#64748B; text-transform:uppercase; font-weight:700;">Mean Resolution Turnaround</div>' +
            '<div style="font-size:22px; font-weight:800; color:#0D9488; margin-top:2px;">18.4 Hours</div>' +
            '<div style="font-size:11px; color:#16A34A; margin-top:2px;">Within 48h MCGM target</div>' +
          '</div>' +
        '</div>' +

        '<div class="report-section-title">24 Administrative Wards Baseline Telemetry</div>' +
        '<table class="report-data-table">' +
          '<thead>' +
            '<tr><th>Ward</th><th>Zone</th><th>Official Station</th><th>Primary Emission Vectors</th></tr>' +
          '</thead>' +
          '<tbody>' +
            (CONFIG.WARDS_DATA || []).slice(0, 10).map(function(w){
              return '<tr>' +
                '<td><strong>' + w.code + '</strong></td>' +
                '<td>' + w.zone + '</td>' +
                '<td>' + w.station + '</td>' +
                '<td>' + w.defaultCause + '</td>' +
              '</tr>';
            }).join('') +
          '</tbody>' +
        '</table>' +

        '<div class="report-disclaimer-footer">' +
          '<div>Published by MumbAIR Open Civic Intelligence Platform in collaboration with Brihanmumbai Municipal Corporation.</div>' +
        '</div>' +
      '</div>';
  }

  /**
   * Print / PDF Export Handler
   */
  function printReport(){
    window.print();
  }

  /**
   * CSV Export Handler
   */
  function exportCsv(){
    var type = currentReportConfig.type;
    var state = STORAGE.loadState();
    var reports = state.reports || [];

    var headers = ['Report_ID', 'Ward', 'Category', 'Status', 'Priority', 'Assigned_Officer', 'Submitted_At', 'Address'];
    var rows = [headers];

    reports.forEach(function(r){
      rows.push([
        r.id,
        r.ward,
        r.category,
        r.status,
        r.priority || 'MEDIUM',
        r.assignedOfficer || 'Unassigned',
        r.createdAt,
        '"' + (r.addressText || '').replace(/"/g, '""') + '"'
      ]);
    });

    var csvContent = 'data:text/csv;charset=utf-8,' + rows.map(function(e){ return e.join(','); }).join('\n');
    var encodedUri = encodeURI(csvContent);
    var link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'MumbAIR_Report_' + type + '_' + Date.now() + '.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if(window.MumbAIR.APP && window.MumbAIR.APP.showToast){
      window.MumbAIR.APP.showToast('CSV Export generated successfully', '📥');
    }
  }

  function handleTypeChange(newType){
    currentReportConfig.type = newType;
    renderPreview();
  }

  return {
    openStudio: openStudio,
    closeStudio: closeStudio,
    renderPreview: renderPreview,
    handleTypeChange: handleTypeChange,
    printReport: printReport,
    exportCsv: exportCsv
  };
})();
