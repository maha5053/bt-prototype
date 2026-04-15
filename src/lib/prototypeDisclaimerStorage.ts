/** localStorage: плашка-дисклеймер скрыта до указанного времени (мс с epoch). */

export const PROTOTYPE_DISCLAIMER_STORAGE_KEY =
  "bio-prototype-disclaimer-dismissed-until";

/** Событие в текущей вкладке после нажатия «Закрыть». */
export const PROTOTYPE_DISCLAIMER_DISMISS_EVENT =
  "bio-prototype-disclaimer-dismiss";

const DAY_MS = 24 * 60 * 60 * 1000;

export function isDisclaimerDismissed(): boolean {
  try {
    const raw = localStorage.getItem(PROTOTYPE_DISCLAIMER_STORAGE_KEY);
    if (!raw) return false;
    const until = JSON.parse(raw) as number;
    if (typeof until !== "number" || !Number.isFinite(until)) {
      localStorage.removeItem(PROTOTYPE_DISCLAIMER_STORAGE_KEY);
      return false;
    }
    if (until <= Date.now()) {
      localStorage.removeItem(PROTOTYPE_DISCLAIMER_STORAGE_KEY);
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function dismissDisclaimerForOneDay(): void {
  const until = Date.now() + DAY_MS;
  localStorage.setItem(
    PROTOTYPE_DISCLAIMER_STORAGE_KEY,
    JSON.stringify(until),
  );
  window.dispatchEvent(new Event(PROTOTYPE_DISCLAIMER_DISMISS_EVENT));
}
