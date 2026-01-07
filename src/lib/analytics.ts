/**
 * Umami Analytics Helper
 * 
 * Safe wrapper for Umami tracking calls.
 * - Fails silently if Umami is unavailable
 * - NEVER passes user-entered financial data (amounts, names, balances, etc.)
 * 
 * Tab tracking: Added in Index.tsx via handleTabChange
 * Action tracking: Added in usePlan.ts (addDebt, deleteDebt, setStrategy)
 *                  and ExportTab.tsx (export_clicked)
 */

declare global {
  interface Window {
    umami?: {
      track: (eventName: string, data?: Record<string, string | number | boolean>) => void;
    };
  }
}

/**
 * Track an analytics event safely
 * @param eventName - The event name to track
 * @param data - Optional metadata (non-sensitive only!)
 */
export const track = (
  eventName: string,
  data?: Record<string, string | number | boolean>
): void => {
  try {
    if (typeof window !== 'undefined' && window.umami) {
      window.umami.track(eventName, data);
    }
  } catch {
    // Fail silently - analytics should never break the app
  }
};
