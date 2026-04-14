"use client";

/**
 * Requests permission from the user to show desktop notifications.
 * Returns true if granted, false otherwise.
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  if (typeof window === "undefined" || !("Notification" in window)) {
    console.warn("This browser does not support desktop notifications");
    return false;
  }

  // If already granted, just return true
  if (Notification.permission === "granted") {
    return true;
  }

  // If denied, we can't ask again unless the user resets it in browser settings
  if (Notification.permission === "denied") {
    console.warn("Notification permission was previously denied by the user");
    return false;
  }

  try {
    const permission = await Notification.requestPermission();
    
    if (permission === "granted") {
      // Send a test notification to confirm it works
      sendSystemNotification(
        "Notifications Enabled! 🚀", 
        "You will now receive alerts when your focus sessions are complete."
      );
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error requesting notification permission:", error);
    return false;
  }
};

/**
 * Sends a system-level desktop notification.
 */
export const sendSystemNotification = (title: string, body: string) => {
  if (typeof window === "undefined" || !("Notification" in window)) return;

  if (Notification.permission === "granted") {
    try {
      // Use a service worker if available for better reliability, 
      // but fallback to standard Notification constructor
      const notification = new Notification(title, {
        body,
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        silent: false,
        requireInteraction: false,
      });

      // Auto-close after 5 seconds
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
      
      setTimeout(() => notification.close(), 5000);
    } catch (error) {
      console.error("Failed to send notification:", error);
    }
  } else {
    console.warn("Attempted to send notification but permission is not granted");
  }
};