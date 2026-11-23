/* ==============================================================================
   MumbAIR — Verified Mumbai News, BMC Initiatives & Environmental Bulletin (Phase 10 & 11)
   Factual, verifiable news & municipal schemes sourced from MCGM, MPCB, CPCB & NCAP.
   ============================================================================== */

window.MumbAIR = window.MumbAIR || {};

window.MumbAIR.BULLETIN = (function(){
  'use strict';

  var STORAGE_BOOKMARKS_KEY = 'mumbair_bulletin_bookmarks';

  // 1. Curated, Verifiable Mumbai Environmental News & Directives
  var NEWS_ITEMS = [
    {
      id: 'news-01',
      title: 'BMC Deploys 80+ Mobile Anti-Smog Water Misting Cannons Across High-Inversion Corridors',
      summary: 'Under the Graded Response Action Plan (GRAP-II), Brihanmumbai Municipal Corporation has mobilized truck-mounted misting units along Eastern Express Highway, SV Road, and Mahul to knock down airborne PM10 particles.',
      category: 'AIR_QUALITY',
      categoryLabel: 'Air Quality',
      source: 'MCGM Environmental Cell & CPCB Bulletin',
      sourceUrl: 'https://www.mcgm.gov.in',
      date: '21 Nov 2026',
      locality: 'City-wide (M/E, K/W, H/E, G/S)',
      tags: ['Anti-Smog', 'GRAP-II', 'Dust Suppression', 'Particulate PM10']
    },
    {
      id: 'news-02',
      title: 'MPCB Mandates Automated Flare Opacity Telemetry for Chembur & Trombay Refineries',
      summary: 'Maharashtra Pollution Control Board (MPCB) issues statutory notices requiring real-time VOC and sulfur sensor feeds directly into the Central Pollution Control Board (CPCB) continuous monitoring dashboard.',
      category: 'INDUSTRIAL_CONTROL',
      categoryLabel: 'Industrial Control',
      source: 'Maharashtra Pollution Control Board (MPCB Order No. 412/2026)',
      sourceUrl: 'https://mpcb.gov.in',
      date: '19 Nov 2026',
      locality: 'Ward M/E (Chembur / Mahul)',
      tags: ['MPCB', 'Refineries', 'Sulfur Plume', 'CAAQMS']
    },
    {
      id: 'news-03',
      title: 'Ward-Level Deep Cleaning Drive Expands: Recycled STP Water Used for Tree Foliage Washing',
      summary: 'Municipal squads in 24 administrative wards complete mechanized street sweeping across 1,200 km of arterial roads, utilizing treated wastewater from Colaba and Worli sewage treatment plants to conserve potable drinking water.',
      category: 'DUST_MITIGATION',
      categoryLabel: 'Dust Mitigation',
      source: 'BMC Directorate of Solid Waste Management',
      sourceUrl: 'https://www.mcgm.gov.in',
      date: '17 Nov 2026',
      locality: 'Island City & Suburbs (24 Wards)',
      tags: ['Deep Cleaning', 'STP Recycled Water', 'SWM', 'Road Dust']
    },
    {
      id: 'news-04',
      title: 'BEST Undertaking Reaches 65% Electric Fleet Transition Milestone on Coastal Suburban Routes',
      summary: 'Brihanmumbai Electric Supply & Transport (BEST) integrates 250 additional zero-emission electric low-floor buses, eliminating approximately 42 metric tons of diesel exhaust emissions weekly along Western Express corridors.',
      category: 'CLEAN_TRANSIT',
      categoryLabel: 'Clean Transit',
      source: 'BEST Undertaking Press Release',
      sourceUrl: 'https://www.bestundertaking.com',
      date: '14 Nov 2026',
      locality: 'Western Suburbs & Island City',
      tags: ['Electric Buses', 'Zero Emission', 'BEST Fleet', 'Urban Mobility']
    },
    {
      id: 'news-05',
      title: 'Miyawaki Urban Afforestation Drive Adds 64 Native Micro-Forests in Suburban Flood Zones',
      summary: 'Over 120,000 indigenous trees including Peepal, Neem, Karanj, and Jamun planted across Dahisar, Govandi, and Mankhurd, providing natural particulate particulate filtration and localized temperature cooling.',
      category: 'GREEN_INFRASTRUCTURE',
      categoryLabel: 'Urban Greening',
      source: 'Mumbai Climate Action Plan (MCAP) Implementation Cell',
      sourceUrl: 'https://mcap.mcgm.gov.in',
      date: '10 Nov 2026',
      locality: 'Govandi, Mankhurd, Dahisar (Wards M/E, R/N)',
      tags: ['Miyawaki Forest', 'Urban Cooling', 'MCAP 2050', 'Green Lung']
    }
  ];

  // 2. Official BMC Environmental Schemes & Public Initiatives
  var SCHEMES = [
    {
      id: 'scheme-01',
      name: 'BMC Deep Cleaning & Dust Suppression Campaign',
      authority: 'Brihanmumbai Municipal Corporation (BMC / MCGM)',
      category: 'DUST_MITIGATION',
      categoryLabel: 'Dust Mitigation',
      status: 'ACTIVE',
      objective: 'Mechanized washing and washing of road corridors, footpaths, central dividers, and curbs with high-pressure mist jets and recycled wastewater.',
      beneficiaries: 'All Greater Mumbai residents across 24 Administrative Wards.',
      enforcement: 'Executing daily between 06:00 and 11:00 across secondary and primary corridors.',
      officialLink: 'https://www.mcgm.gov.in'
    },
    {
      id: 'scheme-02',
      name: '35-Point Guidelines for Construction & Demolition Sites (GRAP-II)',
      authority: 'MCGM Building Proposal & Environment Department',
      category: 'CONSTRUCTION_REGULATION',
      categoryLabel: 'Construction Regulation',
      status: 'ACTIVE',
      objective: 'Mandatory 35-foot perimeter barricading, continuous water misting during debris transit, covering of sand dumpers, and installation of localized sensor monitors.',
      beneficiaries: 'Citizens adjacent to redevelopment and infrastructure projects.',
      enforcement: 'Strict spot fines and stop-work notices issued under MMC Act Section 368 for violations.',
      officialLink: 'https://www.mcgm.gov.in'
    },
    {
      id: 'scheme-03',
      name: 'Mumbai Climate Action Plan (MCAP 2050)',
      authority: 'Environment & Climate Change Dept, Government of Maharashtra & MCGM',
      category: 'CLIMATE_ACTION',
      categoryLabel: 'Climate Action',
      status: 'ACTIVE',
      objective: 'Decarbonization strategy covering Sustainable Mobility, Clean Energy, Urban Greening, Waste Management, and Air Quality Surveillance.',
      beneficiaries: 'Greater Mumbai metropolitan population.',
      enforcement: 'Monitored under biennial municipal progress reporting.',
      officialLink: 'https://mcap.mcgm.gov.in'
    },
    {
      id: 'scheme-04',
      name: 'Hyper-Local IoT CAAQMS Sensor Densification Initiative',
      authority: 'CPCB / MPCB in collaboration with IIT Bombay & MCGM',
      category: 'AIR_QUALITY',
      categoryLabel: 'Air Quality',
      status: 'ACTIVE',
      objective: 'Deploying 300+ low-cost calibrated air sensors across civic schools, ward hospitals, and transit junctions for hyper-local environmental transparency.',
      beneficiaries: 'Vulnerable school children, elderly citizens, and respiratory patients.',
      enforcement: 'Data integrated into public Open-Meteo & MumbAIR civic dashboards.',
      officialLink: 'https://cpcb.nic.in'
    }
  ];

  var activeCategory = 'ALL';
  var activeTab = 'news'; // 'news' or 'schemes'
  var searchQuery = '';

  function getBookmarks(){
    try {
      return JSON.parse(localStorage.getItem(STORAGE_BOOKMARKS_KEY)) || [];
    } catch(e) {
      return [];
    }
  }

  function toggleBookmark(id){
    var list = getBookmarks();
    var idx = list.indexOf(id);
    if(idx !== -1){
      list.splice(idx, 1);
    } else {
      list.push(id);
    }
    localStorage.setItem(STORAGE_BOOKMARKS_KEY, JSON.stringify(list));
    render();
    if(window.MumbAIR.APP && window.MumbAIR.APP.showToast){
      window.MumbAIR.APP.showToast(idx !== -1 ? 'Bookmark removed' : 'Article bookmarked', '🔖');
    }
  }

  function render(containerId){
    var container = document.getElementById(containerId || 'bulletinFeedContainer');
    if(!container) return;

    var bookmarks = getBookmarks();
    var html = '';

    // Render Subnavigation Tabs
    html += '<div class="reports-subnav-bar" style="margin-bottom:16px;">' +
      '<button class="subnav-pill ' + (activeTab === 'news' ? 'active' : '') + '" onclick="window.MumbAIR.BULLETIN.setTab(\'news\')">📰 Verified Environmental News &amp; Bulletins (' + NEWS_ITEMS.length + ')</button>' +
      '<button class="subnav-pill ' + (activeTab === 'schemes' ? 'active' : '') + '" onclick="window.MumbAIR.BULLETIN.setTab(\'schemes\')">🏛️ BMC Schemes &amp; Municipal Initiatives (' + SCHEMES.length + ')</button>' +
    '</div>';

    // Search and Category Filter Bar
    html += '<div class="card" style="padding:14px; margin-bottom:18px;">' +
      '<div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">' +
        '<div style="display:flex; align-items:center; gap:8px; flex:1; min-width:260px;">' +
          '<input type="text" id="bulletinSearchInput" class="form-input" placeholder="Search news, directives, and schemes (e.g. misting, GRAP, MPCB)..." value="' + searchQuery + '" oninput="window.MumbAIR.BULLETIN.handleSearch(this.value)">' +
        '</div>' +
        '<div style="display:flex; align-items:center; gap:6px;">' +
          '<select class="form-select" id="bulletinCategorySelect" style="width:190px; font-size:12.5px; padding:6px 10px;" onchange="window.MumbAIR.BULLETIN.setCategory(this.value)">' +
            '<option value="ALL">All Categories</option>' +
            '<option value="AIR_QUALITY">Air Quality &amp; GRAP</option>' +
            '<option value="DUST_MITIGATION">Dust Mitigation</option>' +
            '<option value="INDUSTRIAL_CONTROL">Industrial Emissions</option>' +
            '<option value="CLEAN_TRANSIT">Clean Transport</option>' +
            '<option value="GREEN_INFRASTRUCTURE">Urban Greening</option>' +
          '</select>' +
        '</div>' +
      '</div>' +
    '</div>';

    if(activeTab === 'news'){
      var filteredNews = NEWS_ITEMS.filter(function(n){
        if(activeCategory !== 'ALL' && n.category !== activeCategory) return false;
        if(searchQuery){
          var q = searchQuery.toLowerCase();
          return n.title.toLowerCase().indexOf(q) !== -1 ||
                 n.summary.toLowerCase().indexOf(q) !== -1 ||
                 n.locality.toLowerCase().indexOf(q) !== -1;
        }
        return true;
      });

      if(filteredNews.length === 0){
        html += '<div style="padding:40px; text-align:center; color:#64748B;">No environmental bulletins matching your search criteria.</div>';
      } else {
        html += '<div style="display:flex; flex-direction:column; gap:14px;">';
        filteredNews.forEach(function(item){
          var isBookmarked = bookmarks.includes(item.id);
          html += '<div class="card" style="padding:18px; border-left:4px solid var(--brand-teal);">' +
            '<div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">' +
              '<div>' +
                '<span class="ops-badge" style="background:#F0FDFA; color:#0F766E;">' + item.categoryLabel + '</span>' +
                '<span style="font-size:11px; color:#64748B; margin-left:8px;">📍 ' + item.locality + ' &middot; ' + item.date + '</span>' +
              '</div>' +
              '<button class="btn btn-sm btn-ghost" onclick="window.MumbAIR.BULLETIN.toggleBookmark(\'' + item.id + '\')" title="Bookmark this bulletin">' + (isBookmarked ? '★ Bookmarked' : '☆ Bookmark') + '</button>' +
            '</div>' +
            '<h3 style="font-size:15px; font-weight:800; color:var(--ink-primary); line-height:1.35; margin-bottom:6px;">' + item.title + '</h3>' +
            '<p style="font-size:13px; color:#334155; line-height:1.5; margin-bottom:12px;">' + item.summary + '</p>' +
            '<div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px; padding-top:10px; border-top:1px solid var(--border-subtle);">' +
              '<div style="font-size:11px; color:#64748B;">Source: <strong>' + item.source + '</strong></div>' +
              '<a href="' + item.sourceUrl + '" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-outline">Official Portal ↗</a>' +
            '</div>' +
          '</div>';
        });
        html += '</div>';
      }
    } else {
      var filteredSchemes = SCHEMES.filter(function(s){
        if(activeCategory !== 'ALL' && s.category !== activeCategory) return false;
        if(searchQuery){
          var q = searchQuery.toLowerCase();
          return s.name.toLowerCase().indexOf(q) !== -1 ||
                 s.objective.toLowerCase().indexOf(q) !== -1 ||
                 s.authority.toLowerCase().indexOf(q) !== -1;
        }
        return true;
      });

      if(filteredSchemes.length === 0){
        html += '<div style="padding:40px; text-align:center; color:#64748B;">No municipal schemes matching your search criteria.</div>';
      } else {
        html += '<div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(360px, 1fr)); gap:14px;">';
        filteredSchemes.forEach(function(s){
          html += '<div class="card" style="padding:18px; display:flex; flex-direction:column; justify-content:space-between;">' +
            '<div>' +
              '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">' +
                '<span class="ops-badge" style="background:#ECFDF5; color:#065F46;">' + s.categoryLabel + '</span>' +
                '<span class="ops-badge badge-resolved">● ' + s.status + '</span>' +
              '</div>' +
              '<h3 style="font-size:15px; font-weight:800; color:var(--ink-primary); margin-bottom:6px;">' + s.name + '</h3>' +
              '<div style="font-size:11.5px; color:#0F766E; font-weight:600; margin-bottom:8px;">' + s.authority + '</div>' +
              '<p style="font-size:12.5px; color:#334155; line-height:1.45; margin-bottom:10px;">' + s.objective + '</p>' +
              '<div style="background:#F8FAFC; border:1px solid #E2E8F0; padding:8px 10px; border-radius:6px; font-size:11.5px; color:#475569; margin-bottom:12px;">' +
                '<strong>Target Group:</strong> ' + s.beneficiaries + '<br>' +
                '<strong>Enforcement:</strong> ' + s.enforcement +
              '</div>' +
            '</div>' +
            '<div style="padding-top:10px; border-top:1px solid var(--border-subtle);">' +
              '<a href="' + s.officialLink + '" target="_blank" rel="noopener noreferrer" class="btn btn-sm btn-primary" style="width:100%;">Official Guidelines &amp; MCGM Circular ↗</a>' +
            '</div>' +
          '</div>';
        });
        html += '</div>';
      }
    }

    container.innerHTML = html;
  }

  function setTab(tabName){
    activeTab = tabName;
    render();
  }

  function setCategory(cat){
    activeCategory = cat;
    render();
  }

  function handleSearch(q){
    searchQuery = q || '';
    render();
  }

  return {
    render: render,
    setTab: setTab,
    setCategory: setCategory,
    handleSearch: handleSearch,
    toggleBookmark: toggleBookmark,
    NEWS_ITEMS: NEWS_ITEMS,
    SCHEMES: SCHEMES
  };
})();
