import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { MOCK_CATALOG, type CatalogItem } from "../mocks/balancesData";

export type SpecResultType = "Да" | "Нет" | "Не применимо" | "В работе";

export type SpecificationItem = {
  id: string;
  name: string;
  requirement: string;
  resultType: SpecResultType;
  comment: string;
  sortOrder?: number;
  confirmed?: boolean;
};

export type NomenclatureEntry = CatalogItem & {
  specification?: SpecificationItem[];
};

const STORAGE_KEY = "bio-nomenclature";

function loadFromStorage(): NomenclatureEntry[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as NomenclatureEntry[];
  } catch {
    /* ignore */
  }
  return null;
}

function saveToStorage(entries: NomenclatureEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    /* ignore */
  }
}

function mergeCatalogWithStorage(
  base: CatalogItem[],
  stored: NomenclatureEntry[],
): NomenclatureEntry[] {
  const storedById = new Map(stored.map((s) => [s.id, s]));
  const merged: NomenclatureEntry[] = base.map((b) => storedById.get(b.id) ?? b);
  // If storage has items missing in base, keep them too (prototype-friendly).
  for (const s of stored) {
    if (!base.some((b) => b.id === s.id)) merged.push(s);
  }
  return merged;
}

type NomenclatureContextValue = {
  entries: NomenclatureEntry[];
  updateItem: (id: string, patch: Partial<NomenclatureEntry>) => void;
};

const NomenclatureContext = createContext<NomenclatureContextValue | null>(null);

export function NomenclatureProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<NomenclatureEntry[]>(() => {
    const stored = loadFromStorage();
    return stored ? mergeCatalogWithStorage(MOCK_CATALOG, stored) : [...MOCK_CATALOG];
  });

  const updateItem = useCallback((id: string, patch: Partial<NomenclatureEntry>) => {
    setEntries((prev) => {
      const next = prev.map((e) => (e.id === id ? { ...e, ...patch } : e));
      saveToStorage(next);
      return next;
    });
  }, []);

  const value = useMemo(() => ({ entries, updateItem }), [entries, updateItem]);

  return (
    <NomenclatureContext.Provider value={value}>
      {children}
    </NomenclatureContext.Provider>
  );
}

export function useNomenclature() {
  const ctx = useContext(NomenclatureContext);
  if (!ctx) {
    throw new Error("useNomenclature must be used within NomenclatureProvider");
  }
  return ctx;
}

