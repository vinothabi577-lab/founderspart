"use client";

import { sendSystemNotification } from "./notifications";

/**
 * Keeps track of which notification thresholds have already been sent for a given task.
 * This prevents duplicate alerts while the timer is running.
 */
export const shouldNotifyTask = (() => {
  const notifiedMap = new Map<string, Set<number>>(); // taskId -> set of minutes already notified

  return (taskId: string, minutesLeft: number): boolean => {
    const thresholds = [60, 30, 10, 5, 4, 3, 2, 1];
    const match = thresholds.find(t => t === minutesLeft);
    if (!match) return false;

    let set = notifiedMap.get(taskId);
    if (!set) {
      set = new Set<number>();
      notifiedMap.set(taskId, set);
    }
    if (set.has(match)) return false; // already notified for this threshold
    set.add(match);
    return true;
  };
})();

/**
 * Sends a notification for a pending business payment only once per work item.
 */
export const shouldNotifyPayment = (() => {
  const notifiedWorks = new Set<string>(); // workId

  return (workId: string): boolean => {
    if (notifiedWorks.has(workId)) return false;
    notifiedWorks.add(workId);
    return true;
  };
})();

/**
 * Helper to fire a desktop notification with a fallback toast.
 */
export const notify = (title: string, body: string) => {
  // Try desktop notification first
  sendSystemNotification(title, body);
};