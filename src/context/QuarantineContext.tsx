import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  INITIAL_QUARANTINE_ENTRIES,
  type QuarantineEntry,
  type QuarantineStatus,
  type RejectionReason,
} from "../mocks/quarantineData";

const STORAGE_KEY = "bio-quarantine";

function loadFromStorage(): QuarantineEntry[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as QuarantineEntry[];
  } catch {
    /* ignore */
  }
  return null;
}

function saveToStorage(entries: QuarantineEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    /* ignore */
  }
}

type QuarantineContextValue = {
  entries: QuarantineEntry[];
  updateStatus: (
    id: string,
    status: QuarantineStatus,
    rejectionReason?: RejectionReason,
    rejectionReasonOther?: string,
    rejectionComment?: string,
  ) => void;
  updateLabResult: (id: string, labResult: string) => void;
  allowEntry: (id: string, destinationPlace: string, comment?: string) => void;
};

const QuarantineContext = createContext<QuarantineContextValue | null>(null);

export function QuarantineProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<QuarantineEntry[]>(() => {
    const stored = loadFromStorage();
    return stored ?? [...INITIAL_QUARANTINE_ENTRIES];
  });

  const updateStatus = useCallback(
    (
      id: string,
      status: QuarantineStatus,
      rejectionReason?: RejectionReason,
      rejectionReasonOther?: string,
      rejectionComment?: string,
    ) => {
      setEntries((prev) => {
        const resolvedAt =
          status === "разрешён" || status === "брак"
            ? new Date().toISOString()
            : undefined;
        const next = prev.map((e) =>
          e.id === id
            ? {
                ...e,
                status,
                ...(resolvedAt ? { resolvedAt } : {}),
                ...(rejectionReason ? { rejectionReason } : {}),
                ...(rejectionReasonOther ? { rejectionReasonOther } : {}),
                ...(rejectionComment ? { rejectionComment } : {}),
              }
            : e,
        );
        saveToStorage(next);
        return next;
      });
    },
    [],
  );

  const updateLabResult = useCallback((id: string, labResult: string) => {
    setEntries((prev) => {
      const next = prev.map((e) => (e.id === id ? { ...e, labResult } : e));
      saveToStorage(next);
      return next;
    });
  }, []);

  const allowEntry = useCallback(
    (id: string, destinationPlace: string, comment?: string) => {
      setEntries((prev) => {
        const resolvedAt = new Date().toISOString();
        const releaseComment = comment?.trim();
        const next = prev.map((e) =>
          e.id === id
            ? {
                ...e,
                status: "разрешён" as const,
                resolvedAt,
                destinationPlace,
                ...(releaseComment ? { releaseComment } : {}),
              }
            : e,
        );
        saveToStorage(next);
        return next;
      });
    },
    [],
  );

  const value = useMemo(
    () => ({ entries, updateStatus, updateLabResult, allowEntry }),
    [entries, updateStatus, updateLabResult, allowEntry],
  );

  return (
    <QuarantineContext.Provider value={value}>
      {children}
    </QuarantineContext.Provider>
  );
}

export function useQuarantine() {
  const ctx = useContext(QuarantineContext);
  if (!ctx) {
    throw new Error("useQuarantine must be used within QuarantineProvider");
  }
  return ctx;
}

export type { QuarantineEntry, QuarantineStatus, RejectionReason };
