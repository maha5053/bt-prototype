import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { MOCK_CATALOG, type CatalogItem } from "../mocks/balancesData";

export type SpecResultType = "Да/нет" | "Не применимо" | "В работе";

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

function createDefaultSpecification(): SpecificationItem[] {
  const base = [
    { name: "Назначение", requirement: "Для работы с клеточными культурами" },
    { name: "Материал", requirement: "Полистирол (информация на этикетке)" },
    { name: "Форма горловины", requirement: "Скошенная (визуально)" },
    { name: "Крышка", requirement: "Крышка с фильтром, 0,22 мкм (визуально)" },
    { name: "Стерильность", requirement: "Стерильно (информация на этикетке)" },
    {
      name: "Отсутствие РНК, ДНК, АТФ, РНКаз, ДНКаз, цитотоксинов",
      requirement: "Соответствие (информация на этикетке)",
    },
    { name: "Апирогенность", requirement: "Соответствие (информация на этикетке)" },
    {
      name: "Гладкая зона роста обработана для роста культур клеток",
      requirement: "Соответствие",
    },
    {
      name: "Стабильная установка флаконов друг на друга",
      requirement: "Соответствие",
    },
    {
      name: "Площадь флакона",
      requirement: "25 см² (информация на этикетке)",
    },
    {
      name: "Упаковка",
      requirement:
        "первичная упаковка – флаконы упакованы в стерильный полимерный пакет, вторичная упаковка – картонная коробка..",
    },
    { name: "Маркировка", requirement: "В соответствии с нормативным документом." },
    {
      name: "Условия хранения и транспортировки",
      requirement: "При комнатной температуре на стеллажных полках.",
    },
    { name: "Меры предосторожности при обращении", requirement: "Не бросать" },
    { name: "Срок годности", requirement: "Не менее 1 года" },
  ] as const;

  return base.map((row, idx) => ({
    id: `spec-${String(idx + 1).padStart(2, "0")}`,
    name: row.name,
    requirement: row.requirement,
    resultType: "Да/нет",
    comment: "",
    sortOrder: idx + 1,
    confirmed: true,
  }));
}

function normalizeSpecResultType(value: unknown): SpecResultType {
  // Backward-compat for older prototypes where values were split into "Да" / "Нет".
  if (value === "Да" || value === "Нет") return "Да/нет";
  if (value === "Да/нет" || value === "Не применимо" || value === "В работе") return value;
  return "Да/нет";
}

function loadFromStorage(): NomenclatureEntry[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as NomenclatureEntry[];
      return parsed.map((entry) => {
        if (!entry.specification) return entry;
        return {
          ...entry,
          specification: entry.specification.map((row) => ({
            ...row,
            resultType: normalizeSpecResultType((row as { resultType?: unknown }).resultType),
          })),
        };
      });
    }
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
  const merged: NomenclatureEntry[] = base.map((b) => {
    const fromStorage = storedById.get(b.id);
    const candidate = fromStorage ?? (b as NomenclatureEntry);
    return {
      ...candidate,
      specification:
        candidate.specification && candidate.specification.length > 0
          ? candidate.specification
          : createDefaultSpecification(),
    };
  });
  // If storage has items missing in base, keep them too (prototype-friendly).
  for (const s of stored) {
    if (!base.some((b) => b.id === s.id)) {
      merged.push({
        ...s,
        specification:
          s.specification && s.specification.length > 0
            ? s.specification
            : createDefaultSpecification(),
      });
    }
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
    return stored
      ? mergeCatalogWithStorage(MOCK_CATALOG, stored)
      : MOCK_CATALOG.map((c) => ({
          ...(c as NomenclatureEntry),
          specification: createDefaultSpecification(),
        }));
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

