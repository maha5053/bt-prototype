import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  INITIAL_WRITE_OFF_SESSIONS,
  createDraftSession,
  type WriteOffSession,
  type WriteOffStatus,
  type WriteOffLine,
  type WriteOffCommission,
} from "../mocks/writeOffData";

const STORAGE_KEY = "bio-writeoffs";

function loadFromStorage(): WriteOffSession[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as WriteOffSession[];
  } catch {
    /* ignore */
  }
  return null;
}

function saveToStorage(sessions: WriteOffSession[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch {
    /* ignore */
  }
}

type WriteOffContextValue = {
  sessions: WriteOffSession[];
  createSession: () => WriteOffSession;
  addLine: (sessionId: string, line: WriteOffLine) => void;
  removeLine: (sessionId: string, lineIndex: number) => void;
  updateLineQuantity: (
    sessionId: string,
    lineIndex: number,
    quantity: number,
  ) => void;
  updateLineReason: (
    sessionId: string,
    lineIndex: number,
    reason: string,
  ) => void;
  updateLineComment: (
    sessionId: string,
    lineIndex: number,
    comment: string,
  ) => void;
  updateCommission: (
    sessionId: string,
    commission: Partial<WriteOffCommission>,
  ) => void;
  updateAction: (sessionId: string, action: string) => void;
  completeSession: (sessionId: string) => void;
  saveDraft: (sessionId: string) => {
    savedAt: string;
    filledCount: number;
    emptyCount: number;
    total: number;
  };
  deleteSession: (sessionId: string) => boolean;
};

const WriteOffContext = createContext<WriteOffContextValue | null>(null);

export function WriteOffProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<WriteOffSession[]>(() => {
    const stored = loadFromStorage();
    if (stored) {
      // Migrate old sessions to include action field
      return stored.map((s) => ({
        ...s,
        action: s.action || "utilized",
      }));
    }
    return [...INITIAL_WRITE_OFF_SESSIONS];
  });

  const createSession = useCallback((): WriteOffSession => {
    const newSession = createDraftSession();
    setSessions((prev) => {
      const withoutDraft = prev.map((s) =>
        s.status === "draft"
          ? {
              ...s,
              status: "completed" as WriteOffStatus,
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

  const addLine = useCallback((sessionId: string, line: WriteOffLine) => {
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

  const updateLineQuantity = useCallback(
    (sessionId: string, lineIndex: number, quantity: number) => {
      setSessions((prev) => {
        const next = prev.map((s) => {
          if (s.id !== sessionId || s.status !== "draft") return s;
          const updatedLines = [...s.lines];
          updatedLines[lineIndex] = { ...updatedLines[lineIndex], quantity };
          return { ...s, lines: updatedLines };
        });
        saveToStorage(next);
        return next;
      });
    },
    [],
  );

  const updateLineReason = useCallback(
    (sessionId: string, lineIndex: number, reason: string) => {
      setSessions((prev) => {
        const next = prev.map((s) => {
          if (s.id !== sessionId || s.status !== "draft") return s;
          const updatedLines = [...s.lines];
          updatedLines[lineIndex] = { ...updatedLines[lineIndex], reason };
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

  const updateCommission = useCallback(
    (sessionId: string, commission: Partial<WriteOffCommission>) => {
      setSessions((prev) => {
        const next = prev.map((s) => {
          if (s.id !== sessionId || s.status !== "draft") return s;
          return {
            ...s,
            commission: { ...s.commission, ...commission },
          };
        });
        saveToStorage(next);
        return next;
      });
    },
    [],
  );

  const updateAction = useCallback((sessionId: string, action: string) => {
    setSessions((prev) => {
      const next = prev.map((s) => {
        if (s.id !== sessionId || s.status !== "draft") return s;
        return { ...s, action };
      });
      saveToStorage(next);
      return next;
    });
  }, []);

  const completeSession = useCallback((sessionId: string) => {
    setSessions((prev) => {
      const next = prev.map((s) =>
        s.id === sessionId && s.status === "draft"
          ? {
              ...s,
              status: "completed" as WriteOffStatus,
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
      filledCount: number;
      emptyCount: number;
      total: number;
    } => {
      const savedAt = new Date().toISOString();
      let result = { savedAt, filledCount: 0, emptyCount: 0, total: 0 };
      setSessions((prev) => {
        const next = prev.map((s) => {
          if (s.id !== sessionId || s.status !== "draft") return s;
          result = {
            savedAt,
            filledCount: s.lines.filter((l) => l.reason).length,
            emptyCount: s.lines.filter((l) => !l.reason).length,
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
      createSession,
      addLine,
      removeLine,
      updateLineQuantity,
      updateLineReason,
      updateLineComment,
      updateCommission,
      updateAction,
      completeSession,
      saveDraft,
      deleteSession,
    }),
    [
      sessions,
      createSession,
      addLine,
      removeLine,
      updateLineQuantity,
      updateLineReason,
      updateLineComment,
      updateCommission,
      updateAction,
      completeSession,
      saveDraft,
      deleteSession,
    ],
  );

  return (
    <WriteOffContext.Provider value={value}>
      {children}
    </WriteOffContext.Provider>
  );
}

export function useWriteOff() {
  const ctx = useContext(WriteOffContext);
  if (!ctx) {
    throw new Error("useWriteOff must be used within WriteOffProvider");
  }
  return ctx;
}

export type { WriteOffSession, WriteOffStatus };
export type { WriteOffLine } from "../mocks/writeOffData";
