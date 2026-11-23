/* ==============================================================================
   MumbAIR — Authentication & Session Authority Layer (RBAC Hardened)
   Strictly separates Public Citizen Sessions and Municipal Authority Sessions.
   Enforces Scope Boundaries: Citizen Own-Only, Field Officer Assigned-Only,
   Ward Officer Ward-Only, Dept Head Dept-Only.
   ============================================================================== */

window.MumbAIR = window.MumbAIR || {};

window.MumbAIR.AUTH = (function(){
  'use strict';

  var CONFIG = window.MumbAIR.CONFIG;
  var STORAGE = window.MumbAIR.STORAGE;

  var AUTH_STORAGE_KEY = 'mumbair_auth_session_v4';

  // Default Session State
  var sessionState = {
    isCitizenLoggedIn: false,
    citizenUser: {
      id: 'user_cit_1',
      name: 'Aarav Patil',
      phone: '+91 98200 41200',
      email: 'aarav.patil@mumbai.gov.in.demo',
      isGuest: false,
      pinnedWards: ['M/E', 'A', 'K/W']
    },
    isAuthorityLoggedIn: false,
    authorityUser: null
  };

  function loadAuthSession(){
    try {
      var saved = localStorage.getItem(AUTH_STORAGE_KEY);
      if(!saved){
        // Check v3 migration
        var v3 = localStorage.getItem('mumbair_auth_session_v3');
        if(v3) saved = v3;
      }
      if(saved){
        var parsed = JSON.parse(saved);
        if(parsed && typeof parsed === 'object'){
          sessionState.isCitizenLoggedIn = !!parsed.isCitizenLoggedIn;
          if(parsed.citizenUser && typeof parsed.citizenUser === 'object') {
            sessionState.citizenUser = parsed.citizenUser;
          }
          sessionState.isAuthorityLoggedIn = !!parsed.isAuthorityLoggedIn;
          sessionState.authorityUser = parsed.authorityUser || null;
        }
      }
    } catch(e) {
      console.warn('Auth session parse error:', e);
    }
  }

  function saveAuthSession(){
    try {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(sessionState));
    } catch(e){}
  }

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
    var isAarav = (name && name.toLowerCase().indexOf('aarav') !== -1) || (phoneOrEmail && phoneOrEmail.indexOf('4120') !== -1);
    sessionState.citizenUser = {
      id: isAarav ? 'user_cit_1' : ('cit_' + Date.now().toString(36)),
      name: name || 'Citizen User',
      phone: phoneOrEmail || '+91 98200 41200',
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

  /**
   * Authenticate Municipal Authority Officer
   * Enforces verified account matching against verified roster
   */
  function loginAuthority(officerIdentifier, password, department){
    var term = String(officerIdentifier || '').toLowerCase().trim();
    var demoUsers = (CONFIG && CONFIG.DEMO_USERS) || [];

    // Match by email, badge ID, or exact name in verified roster
    var matched = demoUsers.find(function(u){
      return (u.email && u.email.toLowerCase() === term) ||
             (u.badge && u.badge.toLowerCase() === term) ||
             (u.id && u.id.toLowerCase() === term) ||
             (u.name && u.name.toLowerCase().indexOf(term) !== -1);
    });

    if(!matched){
      // Check storage roster
      var state = STORAGE.loadState();
      var officers = state.officers || [];
      matched = officers.find(function(u){
        return (u.email && u.email.toLowerCase() === term) ||
               (u.badge && u.badge.toLowerCase() === term) ||
               (u.id && u.id.toLowerCase() === term);
      });
    }

    if(!matched){
      return { success: false, error: 'Officer credential not recognized in municipal directory. Please check email/badge.' };
    }

    sessionState.isAuthorityLoggedIn = true;
    sessionState.authorityUser = {
      id: matched.id,
      name: matched.name,
      role: matched.role,
      roleLabel: (CONFIG.ROLES[matched.role] ? CONFIG.ROLES[matched.role].label : matched.role),
      ward: matched.ward || 'M/E',
      department: department || matched.department || 'SWM',
      badge: matched.badge || 'BMC-OFFICER',
      email: matched.email,
      authenticatedAt: Date.now()
    };

    saveAuthSession();
    return { success: true, user: sessionState.authorityUser };
  }

  /**
   * Authenticate demo account explicitly by user ID
   */
  function loginAuthorityDemoUser(userId){
    var demoUsers = (CONFIG && CONFIG.DEMO_USERS) || [];
    var matched = demoUsers.find(function(u){ return u.id === userId; });
    if(!matched){
      return { success: false, error: 'Demo account not found' };
    }

    sessionState.isAuthorityLoggedIn = true;
    sessionState.authorityUser = {
      id: matched.id,
      name: matched.name,
      role: matched.role,
      roleLabel: (CONFIG.ROLES[matched.role] ? CONFIG.ROLES[matched.role].label : matched.role),
      ward: matched.ward,
      department: matched.department,
      badge: matched.badge,
      email: matched.email,
      authenticatedAt: Date.now()
    };

    saveAuthSession();
    return { success: true, user: sessionState.authorityUser };
  }

  function logoutAuthority(){
    sessionState.isAuthorityLoggedIn = false;
    sessionState.authorityUser = null;
    saveAuthSession();
  }

  /**
   * Check whether current authority user has general permission for a role
   */
  function hasPermission(requiredRole){
    if(!sessionState.isAuthorityLoggedIn || !sessionState.authorityUser) return false;
    var userRole = sessionState.authorityUser.role;

    // Super Admin does NOT have universal permission for routine case approval (separation of duties)
    if(requiredRole === 'APPROVE_RESOLUTION'){
      return (userRole === 'WARD_OFFICER' || userRole === 'DEPARTMENT_HEAD' || userRole === 'CITY_ADMIN');
    }

    if(userRole === 'CITY_ADMIN') return true;
    if(userRole === 'SUPER_ADMIN' && requiredRole === 'SUPER_ADMIN') return true;
    if(requiredRole === userRole) return true;
    return false;
  }

  /**
   * Fine-grained Access Control: Can user view this complaint dossier?
   */
  function canUserViewComplaint(complaint, user){
    if(!complaint) return false;
    user = user || getCurrentUser();
    if(!user) return false;

    // Citizen can ONLY see their own complaint or basic public card
    if(!sessionState.isAuthorityLoggedIn){
      if(user.isGuest) return false;
      return (complaint.citizenId === user.id || (complaint.citizenContact && user.phone && complaint.citizenContact.indexOf(user.phone.slice(-4)) !== -1));
    }

    // Authority permissions
    var role = user.role;
    if(role === 'CITY_ADMIN' || role === 'SUPER_ADMIN') return true;
    if(role === 'WARD_OFFICER'){
      return (user.ward === 'ALL' || complaint.ward === user.ward);
    }
    if(role === 'DEPARTMENT_HEAD'){
      return (user.department === 'ALL' || complaint.department === user.department);
    }
    if(role === 'FIELD_OFFICER'){
      // Field officer can only view details of complaints assigned to them
      return (complaint.assignedOfficerId === user.id || complaint.assignedOfficer === user.name);
    }
    return false;
  }

  /**
   * Fine-grained Access Control: Can user export city ledger?
   */
  function canExportCityLedger(user){
    user = user || getAuthorityUser();
    if(!user) return false;
    // Field Officers and Ward Officers CANNOT export entire city ledger
    return (user.role === 'CITY_ADMIN' || user.role === 'SUPER_ADMIN' || user.role === 'DEPARTMENT_HEAD');
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
    loginAuthority: loginAuthority,
    loginAuthorityDemoUser: loginAuthorityDemoUser,
    logoutAuthority: logoutAuthority,
    hasPermission: hasPermission,
    canUserViewComplaint: canUserViewComplaint,
    canExportCityLedger: canExportCityLedger
  };
})();
