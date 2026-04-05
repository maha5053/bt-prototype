import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  INITIAL_INVENTORY_SESSIONS,
  createDraftSession,
  calcDiscrepancyStatus,
  type InventorySession,
  type InventoryStatus,
  type DiscrepancyStatus,
} from "../mocks/inventoryData";

const STORAGE_KEY = "bio-inventory";

function loadFromStorage(): InventorySession[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as InventorySession[];
  } catch {
    /* ignore */
  }
  return null;
}

function saveToStorage(sessions: InventorySession[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch {
    /* ignore */
  }
}

type InventoryContextValue = {
  sessions: InventorySession[];
  activeSession: InventorySession | null;
  createSession: () => InventorySession;
  updateLineActualQuantity: (
    sessionId: string,
    lineIndex: number,
    actualQuantity: number,
  ) => void;
  updateLineComment: (
    sessionId: string,
    lineIndex: number,
    comment: string,
  ) => void;
  completeSession: (sessionId: string) => void;
  /** Explicitly save the draft (returns timestamp + checked count for feedback). */
  saveDraft: (sessionId: string) => {
    savedAt: string;
    checkedCount: number;
    uncheckedCount: number;
    total: number;
  };
  /** Delete a draft session. Returns true if deleted, false if not found or not draft. */
  deleteSession: (sessionId: string) => boolean;
};

const InventoryContext = createContext<InventoryContextValue | null>(null);

export function InventoryProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<InventorySession[]>(() => {
    const stored = loadFromStorage();
    return stored ?? [...INITIAL_INVENTORY_SESSIONS];
  });

  const activeSession = useMemo(
    () => sessions.find((s) => s.status === "draft") ?? null,
    [sessions],
  );

  const createSession = useCallback((): InventorySession => {
    const newSession = createDraftSession();
    setSessions((prev) => {
      // If there's an existing draft, complete it first
      const withoutDraft = prev.map((s) =>
        s.status === "draft"
          ? {
              ...s,
              status: "completed" as InventoryStatus,
              completedAt: new Date().toISOString(),
            }
          : s,
      );
      const next = [newSession, ...withoutDraft];
      saveToStorage(next);
      return next;
    });
    return newSession;
  }, []);

  const updateLineActualQuantity = useCallback(
    (sessionId: string, lineIndex: number, actualQuantity: number) => {
      setSessions((prev) => {
        const next = prev.map((s) => {
          if (s.id !== sessionId || s.status !== "draft") return s;
          const updatedLines = [...s.lines];
          const line = updatedLines[lineIndex];
          if (!line) return s;
          const discrepancy = actualQuantity - line.systemQuantity;
          const status = calcDiscrepancyStatus(
            line.systemQuantity,
            actualQuantity,
          );
          updatedLines[lineIndex] = {
            ...line,
            actualQuantity,
            discrepancy,
            status,
          };
          return { ...s, lines: updatedLines };
        });
        saveToStorage(next);
        return next;
      });
    },
    [],
  );

  const updateLineComment = useCallback(
    (sessionId: string, lineIndex: number, comment: string) => {
      setSessions((prev) => {
        const next = prev.map((s) => {
          if (s.id !== sessionId || s.status !== "draft") return s;
          const updatedLines = [...s.lines];
          updatedLines[lineIndex] = { ...updatedLines[lineIndex], comment };
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
          ? {
              ...s,
              status: "completed" as InventoryStatus,
              completedAt: new Date().toISOString(),
            }
          : s,
      );
      saveToStorage(next);
      return next;
    });
  }, []);

  const saveDraft = useCallback(
    (
      sessionId: string,
    ): {
      savedAt: string;
      checkedCount: number;
      uncheckedCount: number;
      total: number;
    } => {
      const savedAt = new Date().toISOString();
      let result = { savedAt, checkedCount: 0, uncheckedCount: 0, total: 0 };
      setSessions((prev) => {
        const next = prev.map((s) => {
          if (s.id !== sessionId || s.status !== "draft") return s;
          result = {
            savedAt,
            checkedCount: s.lines.filter((l) => l.actualQuantity !== null)
              .length,
            uncheckedCount: s.lines.filter((l) => l.actualQuantity === null)
              .length,
            total: s.lines.length,
          };
          return { ...s, updatedAt: savedAt };
        });
        saveToStorage(next);
        return next;
      });
      return result;
    },
    [],
  );

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
      activeSession,
      createSession,
      updateLineActualQuantity,
      updateLineComment,
      completeSession,
      saveDraft,
      deleteSession,
    }),
    [
      sessions,
      activeSession,
      createSession,
      updateLineActualQuantity,
      updateLineComment,
      completeSession,
      saveDraft,
      deleteSession,
    ],
  );

  return (
    <InventoryContext.Provider value={value}>
      {children}
    </InventoryContext.Provider>
  );
}

export function useInventory() {
  const ctx = useContext(InventoryContext);
  if (!ctx) {
    throw new Error("useInventory must be used within InventoryProvider");
  }
  return ctx;
}

export type { InventorySession, InventoryStatus, DiscrepancyStatus };
