import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { MOCK_CATALOG, type CatalogItem } from "../mocks/balancesData";

const STORAGE_KEY = "bio-nomenclature";

function loadFromStorage(): CatalogItem[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as CatalogItem[];
  } catch {
    /* ignore */
  }
  return null;
}

function saveToStorage(entries: CatalogItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    /* ignore */
  }
}

function mergeCatalogWithStorage(base: CatalogItem[], stored: CatalogItem[]): CatalogItem[] {
  const storedById = new Map(stored.map((s) => [s.id, s]));
  const merged = base.map((b) => storedById.get(b.id) ?? b);
  // If storage has items missing in base, keep them too (prototype-friendly).
  for (const s of stored) {
    if (!base.some((b) => b.id === s.id)) merged.push(s);
  }
  return merged;
}

type NomenclatureContextValue = {
  entries: CatalogItem[];
  updateItem: (id: string, patch: Partial<CatalogItem>) => void;
};

const NomenclatureContext = createContext<NomenclatureContextValue | null>(null);

export function NomenclatureProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<CatalogItem[]>(() => {
    const stored = loadFromStorage();
    return stored ? mergeCatalogWithStorage(MOCK_CATALOG, stored) : [...MOCK_CATALOG];
  });

  const updateItem = useCallback((id: string, patch: Partial<CatalogItem>) => {
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

