import { useEffect, useState } from "react";
import {
  PROTOTYPE_DISCLAIMER_DISMISS_EVENT,
  PROTOTYPE_DISCLAIMER_STORAGE_KEY,
  isDisclaimerDismissed,
} from "../lib/prototypeDisclaimerStorage";

/** Нужен ли нижний отступ под фиксированную плашку (пока она не скрыта на сутки). */
export function usePrototypeDisclaimerBottomPad() {
  const [reserve, setReserve] = useState(() => !isDisclaimerDismissed());

  useEffect(() => {
    const sync = () => setReserve(!isDisclaimerDismissed());

    window.addEventListener(PROTOTYPE_DISCLAIMER_DISMISS_EVENT, sync);

    const onStorage = (e: StorageEvent) => {
      if (e.key === PROTOTYPE_DISCLAIMER_STORAGE_KEY) sync();
    };
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener(PROTOTYPE_DISCLAIMER_DISMISS_EVENT, sync);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return reserve;
}
