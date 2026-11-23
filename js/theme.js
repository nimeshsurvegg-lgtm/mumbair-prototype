/* ==============================================================================
   MumbAIR — Appearance & Theme Engine (Phase 3)
   Preserves Mumbai Original as default.
   Maintains immutable AQI semantic colors across all themes.
   ============================================================================== */

window.MumbAIR = window.MumbAIR || {};

window.MumbAIR.THEME = (function(){
  'use strict';

  var STORAGE_KEY = 'mumbair_theme_preference';
  var DEFAULT_THEME = 'mumbai-original';

  var THEMES = [
    {
      id: 'mumbai-original',
      name: 'Mumbai Original',
      subtitle: 'Antigravity Default',
      desc: 'Deep marine teal, sky azure, luminous canvas, and rich oceanic slate typography.',
      swatches: ['#0D9488', '#0284C7', '#F6F9FC', '#091E33'],
      isDefault: true
    },
    {
      id: 'coastal-breeze',
      name: 'Coastal Breeze',
      subtitle: 'Arabian Sea Tones',
      desc: 'Marine azure, sky cyan, fresh ocean mist and luminous light-blue surfaces.',
      swatches: ['#0284C7', '#06B6D4', '#F0F7FF', '#072C4F']
    },
    {
      id: 'forest-earth',
      name: 'Forest & Earth',
      subtitle: 'Sanjay Gandhi Bio-Lung',
      desc: 'Botanical foliage green, eco sage, earthy tones and warm natural surfaces.',
      swatches: ['#16A34A', '#059669', '#F3F7F4', '#0D2B17']
    },
    {
      id: 'sunset-mumbai',
      name: 'Sunset Mumbai',
      subtitle: 'Marine Drive Twilight',
      desc: 'Warm coral, golden amber, twilight terracotta and warm neutral cards.',
      swatches: ['#EA580C', '#F59E0B', '#FFF8F3', '#341407']
    },
    {
      id: 'midnight-air',
      name: 'Midnight Air',
      subtitle: 'High-Contrast Dark Mode',
      desc: 'Deep obsidian space canvas, glowing card surfaces, and neon cyan telemetry.',
      swatches: ['#14B8A6', '#00F2FE', '#080D18', '#F8FAFC']
    },
    {
      id: 'minimal-monochrome',
      name: 'Minimal Monochrome',
      subtitle: 'Editorial Grayscale',
      desc: 'Crisp zinc and charcoal palette with stark high-contrast typography.',
      swatches: ['#171717', '#525252', '#F7F7F8', '#0A0A0A']
    }
  ];

  var currentTheme = DEFAULT_THEME;
  var previewThemeId = null;

  function init(){
    var saved = localStorage.getItem(STORAGE_KEY);
    if(saved && isValidTheme(saved)){
      currentTheme = saved;
    } else {
      currentTheme = DEFAULT_THEME;
    }
    applyTheme(currentTheme, false);
    bindEvents();
  }

  function isValidTheme(id){
    for(var i = 0; i < THEMES.length; i++){
      if(THEMES[i].id === id) return true;
    }
    return false;
  }

  function applyTheme(themeId, save){
    if(!isValidTheme(themeId)) themeId = DEFAULT_THEME;
    currentTheme = themeId;
    previewThemeId = null;

    document.documentElement.setAttribute('data-theme', themeId);
    document.body.setAttribute('data-theme', themeId);

    if(save !== false){
      localStorage.setItem(STORAGE_KEY, themeId);
    }

    // Update any label in header/footer
    var labelEl = document.getElementById('currentThemeLabel');
    if(labelEl){
      var t = getThemeMeta(themeId);
      labelEl.textContent = t ? t.name : 'Theme';
    }

    updateModalSelection(themeId);

    if(window.MumbAIR.APP && window.MumbAIR.APP.showToast && save){
      var meta = getThemeMeta(themeId);
      window.MumbAIR.APP.showToast('Theme set to ' + (meta ? meta.name : themeId), '🎨');
    }
  }

  function previewTheme(themeId){
    if(!isValidTheme(themeId)) return;
    previewThemeId = themeId;
    document.documentElement.setAttribute('data-theme', themeId);
    document.body.setAttribute('data-theme', themeId);
    updateModalSelection(themeId);
  }

  function cancelPreview(){
    if(previewThemeId){
      applyTheme(currentTheme, false);
    }
  }

  function resetTheme(){
    applyTheme(DEFAULT_THEME, true);
  }

  function getThemeMeta(id){
    for(var i = 0; i < THEMES.length; i++){
      if(THEMES[i].id === id) return THEMES[i];
    }
    return null;
  }

  function getCurrentTheme(){
    return currentTheme;
  }

  function renderThemeGrid(containerEl){
    if(!containerEl) return;
    var html = '<div class="theme-picker-grid">';
    THEMES.forEach(function(t){
      var isCur = t.id === currentTheme;
      html += '<div class="theme-card-option ' + (isCur ? 'active' : '') + '" data-theme-id="' + t.id + '" onclick="window.MumbAIR.THEME.handleCardClick(\'' + t.id + '\')">';
      html += '  <div class="theme-card-swatches">';
      t.swatches.forEach(function(c){
        html += '    <div class="theme-swatch-chip" style="background:' + c + '"></div>';
      });
      html += '  </div>';
      html += '  <div class="theme-card-title">';
      html += '    <span>' + t.name + '</span>';
      if(t.isDefault){
        html += '    <span class="theme-card-badge">DEFAULT</span>';
      }
      html += '  </div>';
      html += '  <div class="theme-card-desc">' + t.desc + '</div>';
      html += '</div>';
    });
    html += '</div>';
    containerEl.innerHTML = html;
  }

  function updateModalSelection(themeId){
    var cards = document.querySelectorAll('.theme-card-option');
    cards.forEach(function(c){
      var id = c.getAttribute('data-theme-id');
      if(id === themeId){
        c.classList.add('active');
      } else {
        c.classList.remove('active');
      }
    });
  }

  function handleCardClick(themeId){
    applyTheme(themeId, true);
  }

  function openThemeModal(){
    var modal = document.getElementById('modalThemeSelector');
    if(!modal) return;
    var container = document.getElementById('themeGridContainer');
    if(container){
      renderThemeGrid(container);
    }
    modal.classList.remove('hidden');
  }

  function closeThemeModal(){
    var modal = document.getElementById('modalThemeSelector');
    if(!modal) return;
    cancelPreview();
    modal.classList.add('hidden');
  }

  function bindEvents(){
    var btnOpen = document.getElementById('btnOpenThemeModal');
    if(btnOpen){
      btnOpen.onclick = openThemeModal;
    }
    var btnClose = document.getElementById('btnCloseThemeModal');
    if(btnClose){
      btnClose.onclick = closeThemeModal;
    }
    var btnReset = document.getElementById('btnResetDefaultTheme');
    if(btnReset){
      btnReset.onclick = resetTheme;
    }
  }

  return {
    init: init,
    applyTheme: applyTheme,
    previewTheme: previewTheme,
    cancelPreview: cancelPreview,
    resetTheme: resetTheme,
    getCurrentTheme: getCurrentTheme,
    openThemeModal: openThemeModal,
    closeThemeModal: closeThemeModal,
    handleCardClick: handleCardClick,
    renderThemeGrid: renderThemeGrid,
    THEMES: THEMES
  };
})();
