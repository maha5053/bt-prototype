import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  INITIAL_RECEIPT_SESSIONS,
  createDraftReceipt,
  type ReceiptLine,
  type ReceiptSession,
  type ReceiptStatus,
} from "../mocks/receiptsData";

const STORAGE_KEY = "bio-receipts";

function loadFromStorage(): ReceiptSession[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as ReceiptSession[];
  } catch {
    /* ignore */
  }
  return null;
}

function saveToStorage(sessions: ReceiptSession[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch {
    /* ignore */
  }
}

type ReceiptsContextValue = {
  sessions: ReceiptSession[];
  createSession: () => ReceiptSession;
  addLine: (sessionId: string, line: ReceiptLine) => void;
  removeLine: (sessionId: string, lineIndex: number) => void;
  updateLine: (
    sessionId: string,
    lineIndex: number,
    patch: Partial<ReceiptLine>,
  ) => void;
  completeSession: (sessionId: string) => void;
  saveDraft: (sessionId: string) => { savedAt: string; total: number };
  deleteSession: (sessionId: string) => boolean;
};

const ReceiptsContext = createContext<ReceiptsContextValue | null>(null);

export function ReceiptsProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<ReceiptSession[]>(() => {
    const stored = loadFromStorage();
    return stored ?? [...INITIAL_RECEIPT_SESSIONS];
  });

  const createSession = useCallback((): ReceiptSession => {
    const newSession = createDraftReceipt();
    setSessions((prev) => {
      // Same UX as write-offs: only one draft at a time.
      const withoutDraft = prev.map((s) =>
        s.status === "draft"
          ? ({
              ...s,
              status: "completed" as ReceiptStatus,
              completedAt: new Date().toISOString(),
            } satisfies ReceiptSession)
          : s,
      );
      const next = [newSession, ...withoutDraft];
      saveToStorage(next);
      return next;
    });
    return newSession;
  }, []);

  const addLine = useCallback((sessionId: string, line: ReceiptLine) => {
    setSessions((prev) => {
      const next = prev.map((s) => {
        if (s.id !== sessionId || s.status !== "draft") return s;
        return { ...s, lines: [...s.lines, line] };
      });
      saveToStorage(next);
      return next;
    });
  }, []);

  const removeLine = useCallback((sessionId: string, lineIndex: number) => {
    setSessions((prev) => {
      const next = prev.map((s) => {
        if (s.id !== sessionId || s.status !== "draft") return s;
        return { ...s, lines: s.lines.filter((_, i) => i !== lineIndex) };
      });
      saveToStorage(next);
      return next;
    });
  }, []);

  const updateLine = useCallback(
    (sessionId: string, lineIndex: number, patch: Partial<ReceiptLine>) => {
      setSessions((prev) => {
        const next = prev.map((s) => {
          if (s.id !== sessionId || s.status !== "draft") return s;
          const updatedLines = [...s.lines];
          updatedLines[lineIndex] = { ...updatedLines[lineIndex], ...patch };
          return { ...s, lines: updatedLines };
        });
        saveToStorage(next);
        return next;
      });
    },
    [],
  );

  const completeSession = useCallback((sessionId: string) => {
    setSessions((prev) => {
      const next = prev.map((s) =>
        s.id === sessionId && s.status === "draft"
          ? ({
              ...s,
              status: "completed" as ReceiptStatus,
              completedAt: new Date().toISOString(),
            } satisfies ReceiptSession)
          : s,
      );
      saveToStorage(next);
      return next;
    });
  }, []);

  const saveDraft = useCallback((sessionId: string) => {
    const savedAt = new Date().toISOString();
    let total = 0;
    setSessions((prev) => {
      const next = prev.map((s) => {
        if (s.id !== sessionId || s.status !== "draft") return s;
        total = s.lines.length;
        return { ...s, updatedAt: savedAt };
      });
      saveToStorage(next);
      return next;
    });
    return { savedAt, total };
  }, []);

  const deleteSession = useCallback((sessionId: string): boolean => {
    let deleted = false;
    setSessions((prev) => {
      const target = prev.find((s) => s.id === sessionId);
      if (!target || target.status !== "draft") {
        deleted = false;
        return prev;
      }
      deleted = true;
      const next = prev.filter((s) => s.id !== sessionId);
      saveToStorage(next);
      return next;
    });
    return deleted;
  }, []);

  const value = useMemo(
    () => ({
      sessions,
      createSession,
      addLine,
      removeLine,
      updateLine,
      completeSession,
      saveDraft,
      deleteSession,
    }),
    [
      sessions,
      createSession,
      addLine,
      removeLine,
      updateLine,
      completeSession,
      saveDraft,
      deleteSession,
    ],
  );

  return (
    <ReceiptsContext.Provider value={value}>{children}</ReceiptsContext.Provider>
  );
}

export function useReceipts() {
  const ctx = useContext(ReceiptsContext);
  if (!ctx) throw new Error("useReceipts must be used within ReceiptsProvider");
  return ctx;
}

export type { ReceiptSession, ReceiptStatus };
export type { ReceiptLine } from "../mocks/receiptsData";

