// Request permission for push notifications
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.log('This browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

// Show browser notification
export const showNotification = (title, options = {}) => {
  if (Notification.permission === 'granted') {
    const notification = new Notification(title, {
      body: options.body,
      icon: options.icon || '/favicon.ico',
      tag: options.tag,
      requireInteraction: options.requireInteraction || false,
      silent: false
    });

    // Play sound
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPTgjMGHm7A7+OZURQNQJ7h8Ll');
      audio.volume = 0.3;
      audio.play().catch(err => console.log('Audio play failed:', err));
    } catch (e) {
      // Sound failed, continue without it
    }

    notification.onclick = () => {
      window.focus();
      if (options.url) {
        window.location.href = options.url;
      }
      notification.close();
    };

    return notification;
  }
  return null;
};

// Send fire incident notification
export const notifyNewIncident = (incident) => {
  const title = '🚨 NEW FIRE INCIDENT';
  const options = {
    body: `${incident.fireSize?.toUpperCase() || 'UNKNOWN'} ${incident.fireType || 'fire'} reported\nLocation: ${incident.location?.address || 'Unknown location'}`,
    tag: `incident-${incident.id}`,
    requireInteraction: true,
    url: `/dashboard`
  };

  return showNotification(title, options);
};

// Send status update notification
export const notifyStatusUpdate = (incident, newStatus) => {
  const title = `Fire Incident Update`;
  const options = {
    body: `Incident at ${incident.location.address} is now ${newStatus.toUpperCase()}`,
    tag: `update-${incident.id}`,
    url: `/dashboard/incidents/${incident.id}`
  };

  return showNotification(title, options);
};