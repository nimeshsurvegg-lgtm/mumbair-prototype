/* ==============================================================================
   MumbAIR — Unified In-App Notification Center
   ============================================================================== */

window.MumbAIR = window.MumbAIR || {};

window.MumbAIR.NOTIFICATIONS = (function(){
  'use strict';

  var STORAGE = window.MumbAIR.STORAGE;

  function getNotifications(){
    var state = STORAGE.loadState();
    return state.notifications || [
      {
        id: 'notif_1',
        title: 'GRAP Stage II Enforcement Alert',
        message: 'Mechanized road sweeping and water sprinkling active across eastern suburbs due to elevated PM10.',
        time: '25m ago',
        read: false,
        type: 'ALERT'
      },
      {
        id: 'notif_2',
        title: 'Mitigation Completed for MB-1003',
        message: 'Ward G/South squad has installed green dust barrier netting at Lower Parel construction site.',
        time: '2h ago',
        read: false,
        type: 'SUCCESS'
      }
    ];
  }

  function dispatch(notifPayload){
    var state = STORAGE.loadState();
    state.notifications = state.notifications || [];

    var newNotif = {
      id: 'notif_' + Date.now().toString(36),
      title: notifPayload.title || 'MumbAIR Alert',
      message: notifPayload.message || '',
      time: 'Just now',
      read: false,
      type: notifPayload.type || 'INFO',
      linkId: notifPayload.linkId || null,
      targetRole: notifPayload.targetRole || 'ALL'
    };

    state.notifications.unshift(newNotif);
    if(state.notifications.length > 50) state.notifications.pop();
    STORAGE.saveState(state);

    renderBadge();
    return newNotif;
  }

  function markAllRead(){
    var state = STORAGE.loadState();
    (state.notifications || []).forEach(function(n){ n.read = true; });
    STORAGE.saveState(state);
    renderBadge();
  }

  function renderBadge(){
    var list = getNotifications();
    var unreadCount = list.filter(function(n){ return !n.read; }).length;
    var badge = document.getElementById('notifBadgeCount');
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
