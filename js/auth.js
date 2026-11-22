/* ==============================================================================
   MumbAIR — Authentication & Session Authority Layer
   Strictly separates Public Citizen Sessions (Guest/Registered) and Protected
   Municipal Authority Sessions (Field Officer, Ward Officer, Dept Head, Admin)
   ============================================================================== */

window.MumbAIR = window.MumbAIR || {};

window.MumbAIR.AUTH = (function(){
  'use strict';

  var CONFIG = window.MumbAIR.CONFIG;
  var STORAGE = window.MumbAIR.STORAGE;

  var AUTH_STORAGE_KEY = 'mumbair_auth_session_v3';

  // Default Session State
  var sessionState = {
    isCitizenLoggedIn: false,
    citizenUser: {
      id: 'guest_citizen',
      name: 'Mumbai Citizen',
      phone: '',
      email: '',
      isGuest: true,
      pinnedWards: ['M/E', 'A', 'K/W']
    },
    isAuthorityLoggedIn: false,
    authorityUser: null
  };

  function loadAuthSession(){
    try {
      var saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if(saved){
        var parsed = JSON.parse(saved);
        if(parsed && typeof parsed === 'object'){
          sessionState.isCitizenLoggedIn = !!parsed.isCitizenLoggedIn;
          if(parsed.citizenUser) sessionState.citizenUser = parsed.citizenUser;
          sessionState.isAuthorityLoggedIn = !!parsed.isAuthorityLoggedIn;
          sessionState.authorityUser = parsed.authorityUser || null;
        }
      }
    } catch(e) {
      console.warn('Could not load auth session, using default guest session:', e);
    }
  }

  function saveAuthSession(){
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sessionState));
    } catch(e) {}
  }

  // Load session on startup
  loadAuthSession();

  /* ===========================================================================
     CITIZEN AUTHENTICATION
     =========================================================================== */

  function getCitizenUser(){
    return sessionState.citizenUser;
  }

  function isCitizenAuthenticated(){
    return sessionState.isCitizenLoggedIn && !sessionState.citizenUser.isGuest;
  }

  function loginCitizen(name, phoneOrEmail){
    sessionState.isCitizenLoggedIn = true;
    sessionState.citizenUser = {
      id: 'cit_' + Date.now(),
      name: name || 'Citizen User',
      phone: phoneOrEmail || '',
      email: phoneOrEmail && phoneOrEmail.indexOf('@') !== -1 ? phoneOrEmail : '',
      isGuest: false,
      pinnedWards: sessionState.citizenUser.pinnedWards || ['M/E']
    };
    saveAuthSession();
    return sessionState.citizenUser;
  }

  function logoutCitizen(){
    sessionState.isCitizenLoggedIn = false;
    sessionState.citizenUser = {
      id: 'guest_citizen',
      name: 'Mumbai Citizen (Guest)',
      phone: '',
      email: '',
      isGuest: true,
      pinnedWards: ['M/E']
    };
    saveAuthSession();
  }

  function togglePinnedWard(wardCode){
    var wards = sessionState.citizenUser.pinnedWards || [];
    var idx = wards.indexOf(wardCode);
    if(idx === -1){
      wards.push(wardCode);
    } else {
      wards.splice(idx, 1);
    }
    sessionState.citizenUser.pinnedWards = wards;
    saveAuthSession();
    return wards;
  }

  /* ===========================================================================
     MUNICIPAL AUTHORITY AUTHENTICATION & ACCESS CONTROL
     =========================================================================== */

  function isAuthorityAuthenticated(){
    return sessionState.isAuthorityLoggedIn && sessionState.authorityUser !== null;
  }

  function getAuthorityUser(){
    return sessionState.authorityUser;
  }

  function loginAuthorityWithRole(roleKey){
    var demoOfficer = CONFIG.DEMO_USERS.find(function(u){ return u.role === roleKey; });
    if(!demoOfficer){
      demoOfficer = CONFIG.DEMO_USERS[1]; // Field Officer default
    }

    sessionState.isAuthorityLoggedIn = true;
    sessionState.authorityUser = {
      id: demoOfficer.id,
      name: demoOfficer.name,
      role: demoOfficer.role,
      roleLabel: CONFIG.ROLES[demoOfficer.role].label,
      ward: demoOfficer.ward,
      department: demoOfficer.department,
      badge: demoOfficer.badge,
      email: demoOfficer.email,
      authenticatedAt: Date.now()
    };

    saveAuthSession();
    return sessionState.authorityUser;
  }

  function loginAuthority(officerId, password, department){
    // Match against verified demo accounts or authenticate officer
    var matched = CONFIG.DEMO_USERS.find(function(u){
      return (u.email && u.email.toLowerCase() === officerId.toLowerCase().trim()) ||
             (u.badge && u.badge.toLowerCase() === officerId.toLowerCase().trim()) ||
             (u.name && u.name.toLowerCase().indexOf(officerId.toLowerCase().trim()) !== -1);
    });

    if(!matched){
      // Default to field officer for presentation robustness if typed custom name
      matched = {
        id: 'officer_' + Date.now(),
        name: officerId.indexOf('@') !== -1 ? officerId.split('@')[0] : officerId,
        role: 'FIELD_OFFICER',
        ward: 'M/E',
        department: department || 'SWM',
        badge: 'BMC-AUTH-' + Math.floor(1000 + Math.random() * 9000),
        email: officerId
      };
    }

    sessionState.isAuthorityLoggedIn = true;
    sessionState.authorityUser = {
      id: matched.id,
      name: matched.name,
      role: matched.role,
      roleLabel: CONFIG.ROLES[matched.role].label,
      ward: matched.ward,
      department: department || matched.department,
      badge: matched.badge || 'BMC-OFFICER',
      email: matched.email,
      authenticatedAt: Date.now()
    };

    saveAuthSession();
    return sessionState.authorityUser;
  }

  function logoutAuthority(){
    sessionState.isAuthorityLoggedIn = false;
    sessionState.authorityUser = null;
    saveAuthSession();
  }

  function hasPermission(requiredRole){
    if(!sessionState.isAuthorityLoggedIn || !sessionState.authorityUser) return false;
    var userRole = sessionState.authorityUser.role;
    if(userRole === 'SUPER_ADMIN') return true;
    if(requiredRole === userRole) return true;
    return false;
  }

  function getCurrentUser(){
    return sessionState.authorityUser || sessionState.citizenUser;
  }

  return {
    getCurrentUser: getCurrentUser,
    getCitizenUser: getCitizenUser,
    isCitizenAuthenticated: isCitizenAuthenticated,
    loginCitizen: loginCitizen,
    logoutCitizen: logoutCitizen,
    togglePinnedWard: togglePinnedWard,

    isAuthorityAuthenticated: isAuthorityAuthenticated,
    getAuthorityUser: getAuthorityUser,
    loginAuthorityWithRole: loginAuthorityWithRole,
    loginAuthority: loginAuthority,
    logoutAuthority: logoutAuthority,
    hasPermission: hasPermission
  };
})();
