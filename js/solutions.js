/* ==============================================================================
   MumbAIR — Air Quality Action & Solutions Center (Phase 12)
   Evidence-based citizen health guidance, municipal mitigation directives,
   and city environmental improvement tracker.
   ============================================================================== */

window.MumbAIR = window.MumbAIR || {};

window.MumbAIR.SOLUTIONS = (function(){
  'use strict';

  var CITIZEN_ACTIONS = [
    {
      category: 'COMMUTING & MOBILITY',
      icon: '🚇',
      title: 'Prioritize Mumbai Metro, Suburban Rail & BEST Electric Buses',
      action: 'Shifting one personal vehicular trip daily reduces personal carbon footprint by 2.4 kg and suppresses curb-side nitrogen dioxide (NO2) exposure.',
      impact: 'High Impact on Corridor NO2 & PM2.5'
    },
    {
      category: 'HEALTH & EXPOSURE',
      icon: '😷',
      title: 'Adopt Certified N95 / FFP2 Particulate Filtration During Spikes',
      action: 'When Greater Mumbai NAQI exceeds 200 (Poor/Very Poor), standard cloth masks offer zero sub-micron protection. N95 respirators filter 95% of fine combustion particles.',
      impact: 'Immediate Personal Lung Protection'
    },
    {
      category: 'CIVIC ENFORCEMENT',
      icon: '📸',
      title: 'Report Visible Open Burning via MumbAIR Camera',
      action: 'Open burning of leaf litter, rubber tires, or scrap releases hazardous dioxins and black carbon directly into residential breathing zones. Logging reports triggers mandatory BMC squad dispatch.',
      impact: 'Statutory 6h Municipal SLA Mandate'
    },
    {
      category: 'CONSTRUCTION MONITORING',
      icon: '🏗️',
      title: 'Flag Uncovered Transit Dumpers & Unmisted Demolition Sites',
      action: 'Developers must maintain 35-foot perimeter barricades and continuous misting cannons under GRAP-II. Citations carry spot fines under MMC Act Section 368.',
      impact: 'Suppresses Localized PM10 Dust'
    }
  ];

  var MUNICIPAL_TRACKER = [
    {
      initiative: 'Mechanized Street Sweeping & STP Wastewater Washing',
      department: 'Solid Waste Management (SWM)',
      status: 'OPERATIONAL',
      progress: '85%',
      target: '1,200 km weekly',
      location: '24 Greater Mumbai Administrative Wards'
    },
    {
      initiative: 'Continuous Anti-Smog Misting Guns on Building Sites > 5,000 sqm',
      department: 'Building Proposal & Environment Cell',
      status: 'ACTIVE ENFORCEMENT',
      progress: '92%',
      target: '480 registered active sites',
      location: 'Suburban Mumbai & Island City'
    },
    {
      initiative: 'BEST 100% Zero-Emission Electric Bus Fleet Transition',
      department: 'Brihanmumbai Electric Supply & Transport',
      status: 'EXPANDING',
      progress: '65%',
      target: '3,000 electric buses by 2027',
      location: 'Western & Eastern Express Corridors'
    },
    {
      initiative: 'Miyawaki Dense Urban Forestation in Creek Buffers',
      department: 'Gardens & Tree Authority / MCAP Cell',
      status: 'ON TRACK',
      progress: '78%',
      target: '64 micro-forests planted',
      location: 'Govandi, Mankhurd, Dahisar, Mulund'
    }
  ];

  function render(containerId){
    var container = document.getElementById(containerId || 'solutionsContainer');
    if(!container) return;

    var html = '' +
      '<div style="display:flex; flex-direction:column; gap:22px;">' +
        '<div class="card" style="padding:22px; background:linear-gradient(135deg, #F0FDFA 0%, #FFFFFF 100%); border-left:4px solid var(--brand-teal);">' +
          '<div class="card-eyebrow">ENVIRONMENTAL MITIGATION PLAYBOOK</div>' +
          '<h2 style="font-size:18px; font-weight:800; color:var(--ink-primary); margin:4px 0 6px;">Air Quality Action &amp; Solutions Center</h2>' +
          '<p style="font-size:13px; color:#334155; line-height:1.5;">Evidence-based civic interventions and certified municipal initiatives driving measurable atmospheric improvements across Greater Mumbai.</p>' +
        '</div>' +

        '<div class="section-title-row" style="margin-top:4px;">' +
          '<div><h3 style="font-size:15px; font-weight:800; color:var(--ink-primary);">🌿 Actionable Citizen Recommendations</h3></div>' +
        '</div>' +

        '<div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(320px, 1fr)); gap:14px;">' +
          CITIZEN_ACTIONS.map(function(act){
            return '<div class="card" style="padding:16px; display:flex; flex-direction:column; justify-content:space-between;">' +
              '<div>' +
                '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">' +
                  '<span style="font-size:24px;">' + act.icon + '</span>' +
                  '<span class="ops-badge" style="background:#F1F5F9; color:#0F172A;">' + act.category + '</span>' +
                '</div>' +
                '<h4 style="font-size:14px; font-weight:700; color:var(--ink-primary); margin-bottom:6px;">' + act.title + '</h4>' +
                '<p style="font-size:12px; color:#475569; line-height:1.45; margin-bottom:12px;">' + act.action + '</p>' +
              '</div>' +
              '<div style="background:#F8FAFC; border:1px solid #E2E8F0; padding:6px 10px; border-radius:6px; font-size:11px; font-weight:600; color:#0F766E;">' +
                'Impact: ' + act.impact +
              '</div>' +
            '</div>';
          }).join('') +
        '</div>' +

        '<div class="section-title-row" style="margin-top:12px;">' +
          '<div><h3 style="font-size:15px; font-weight:800; color:var(--ink-primary);">🏛️ Municipal Mitigation Progress Tracker</h3></div>' +
        '</div>' +

        '<div class="card" style="padding:0; overflow:hidden;">' +
          '<table class="ops-table">' +
            '<thead>' +
              '<tr>' +
                '<th>Initiative</th>' +
                '<th>Responsible Agency</th>' +
                '<th>Status</th>' +
                '<th>Target Milestone</th>' +
                '<th>Implementation Progress</th>' +
              '</tr>' +
            '</thead>' +
            '<tbody>' +
              MUNICIPAL_TRACKER.map(function(t){
                return '<tr>' +
                  '<td><strong>' + t.initiative + '</strong><br><span style="font-size:11px; color:#64748B;">📍 ' + t.location + '</span></td>' +
                  '<td>' + t.department + '</td>' +
                  '<td><span class="ops-badge badge-resolved">' + t.status + '</span></td>' +
                  '<td>' + t.target + '</td>' +
                  '<td>' +
                    '<div style="display:flex; align-items:center; gap:8px;">' +
                      '<div style="flex:1; height:6px; background:#E2E8F0; border-radius:999px; overflow:hidden;">' +
                        '<div style="width:' + t.progress + '; height:100%; background:var(--brand-teal);"></div>' +
                      '</div>' +
                      '<span style="font-size:11.5px; font-weight:700; color:var(--ink-primary);">' + t.progress + '</span>' +
                    '</div>' +
                  '</td>' +
                '</tr>';
              }).join('') +
            '</tbody>' +
          '</table>' +
        '</div>' +
      '</div>';

    container.innerHTML = html;
  }

  return {
    render: render,
    CITIZEN_ACTIONS: CITIZEN_ACTIONS,
    MUNICIPAL_TRACKER: MUNICIPAL_TRACKER
  };
})();
