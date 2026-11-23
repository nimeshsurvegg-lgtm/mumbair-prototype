/* ==============================================================================
   MumbAIR — Unified In-App Notification Center (Targeted & Role Scoped)
   Strictly filters notifications by session role, preventing authorization leaks
   ============================================================================== */

window.MumbAIR = window.MumbAIR || {};

window.MumbAIR.NOTIFICATIONS = (function(){
  'use strict';

  var STORAGE = window.MumbAIR.STORAGE;
  var AUTH = window.MumbAIR.AUTH;

  /**
   * Get notifications visible to current session
   * Prevents citizens seeing internal alerts and officers seeing unrelated ward notifications
   */
  function getNotifications(){
    var state = STORAGE.loadState();
    var all = state.notifications || [];
    var currentUser = (AUTH && AUTH.getCurrentUser) ? AUTH.getCurrentUser() : null;
    var isAuthority = (AUTH && AUTH.isAuthorityAuthenticated) ? AUTH.isAuthorityAuthenticated() : false;

    if(!currentUser) return [];

    return all.filter(function(n){
      if(!n.targetRole || n.targetRole === 'ALL') return true;

      if(!isAuthority){
        // Citizen session: only citizen targeted or public alerts
        if(n.targetRole === 'CITIZEN'){
          return !n.targetCitizenId || n.targetCitizenId === currentUser.id;
        }
        return false; // Hide FIELD_OFFICER, WARD_OFFICER, etc.
      }

      // Authority session: filter by role and scope
      var role = currentUser.role;
      if(role === 'CITY_ADMIN' || role === 'SUPER_ADMIN') return true;

      if(role === 'FIELD_OFFICER'){
        if(n.targetRole === 'FIELD_OFFICER'){
          return !n.targetUserId || n.targetUserId === currentUser.id;
        }
        return false;
      }

      if(role === 'WARD_OFFICER'){
        if(n.targetRole === 'WARD_OFFICER'){
          return n.targetWard === 'ALL' || n.targetWard === currentUser.ward;
        }
        return false;
      }

      if(role === 'DEPARTMENT_HEAD'){
        return (n.targetRole === 'DEPARTMENT_HEAD');
      }

      return false;
    });
  }

  function dispatch(notifPayload){
    return STORAGE.atomicUpdate(function(state){
      state.notifications = state.notifications || [];
      var newNotif = {
        id: 'notif_' + Date.now().toString(36) + '_' + Math.floor(Math.random() * 1000),
        title: notifPayload.title || 'MumbAIR Alert',
        message: notifPayload.message || '',
        time: 'Just now',
        createdAt: new Date().toISOString(),
        read: false,
        type: notifPayload.type || 'INFO',
        linkId: notifPayload.linkId || null,
        targetRole: notifPayload.targetRole || 'ALL',
        targetWard: notifPayload.targetWard || 'ALL',
        targetUserId: notifPayload.targetUserId || null,
        targetCitizenId: notifPayload.targetCitizenId || null
      };

      state.notifications.unshift(newNotif);
      if(state.notifications.length > 50) state.notifications.pop();
      return { success: true, notification: newNotif };
    });
  }

  function markAllRead(){
    STORAGE.atomicUpdate(function(state){
      var visible = getNotifications();
      var visibleIds = visible.map(function(n){ return n.id; });
      (state.notifications || []).forEach(function(n){
        if(visibleIds.indexOf(n.id) !== -1){
          n.read = true;
        }
      });
      return { success: true };
    });
    renderBadge();
  }

  function renderBadge(){
    var list = getNotifications();
    var unreadCount = list.filter(function(n){ return !n.read; }).length;
    var badge = document.getElementById('notifBadgeCount') || document.getElementById('headerNotifBadge');
    if(badge){
      badge.textContent = unreadCount;
      badge.style.display = unreadCount > 0 ? 'inline-block' : 'none';
    }
  }

  return {
    getNotifications: getNotifications,
    dispatch: dispatch,
    markAllRead: markAllRead,
    renderBadge: renderBadge
  };
})();
