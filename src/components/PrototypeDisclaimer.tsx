import { useState } from "react";
import {
  dismissDisclaimerForOneDay,
  isDisclaimerDismissed,
} from "../lib/prototypeDisclaimerStorage";

/** Предупреждение на всех экранах прототипа (скрывается при печати). */
export function PrototypeDisclaimer() {
  const [visible, setVisible] = useState(() => !isDisclaimerDismissed());

  if (!visible) return null;

  const handleDismiss = () => {
    dismissDisclaimerForOneDay();
    setVisible(false);
  };

  return (
    <div
      role="note"
      aria-label="Предупреждение о демонстрационном характере системы"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-amber-300 bg-amber-100 py-2.5 pl-3 pr-11 text-amber-950 shadow-[0_-4px_12px_rgba(0,0,0,0.08)] print:hidden"
    >
      <button
        type="button"
        className="absolute right-2 top-2 rounded-md p-1 text-amber-800/80 transition hover:bg-amber-200/80 hover:text-amber-950 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
        aria-label="Скрыть уведомление на сутки"
        title="Скрыть на сутки"
        onClick={handleDismiss}
      >
        <svg
          className="size-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs font-semibold leading-snug sm:text-sm">
        <svg
          className="size-4 shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M12 9v4" />
          <path d="M12 17h.01" />
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        </svg>
        <span>Интерактивный макет для согласования</span>
      </div>
      <div className="mx-auto mt-1 max-w-5xl text-center text-[0.65rem] font-normal leading-snug text-amber-900/90 sm:text-[0.7rem]">
        Это интерактивный прототип, не являющийся реальной системой.
        Предназначен исключительно для согласования задач с командой разработки и
        заказчиком. Прототип не хранит и не обрабатывает фактические данные.
      </div>
    </div>
  );
}
