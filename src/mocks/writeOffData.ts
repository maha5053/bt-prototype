/** Моки для UI «Списания». */

import {
  getAllStoragePlaces,
  ALL_GROUPS,
  MOCK_CATALOG,
  MOCK_STOCK_LINES,
  type NomenclatureGroup,
} from "./balancesData";
import { USERS } from "./usersMock";

export { USERS };

export type WriteOffStatus = "draft" | "completed";

export interface WriteOffReason {
  id: string;
  label: string;
}

export const WRITE_OFF_REASONS: WriteOffReason[] = [
  { id: "sterility", label: "Нарушение стерильности" },
  { id: "integrity", label: "Нарушение целостности" },
  { id: "expiry", label: "Нарушение сроков годности" },
  { id: "storage", label: "Нарушение условий хранения" },
  { id: "other", label: "Другие" },
];

export interface WriteOffCommission {
  headOfProduction: string;
  headOfQuality: string;
  qualityEmployee: string;
  authorizedPerson: string;
}

export interface WriteOffAction {
  id: string;
  label: string;
}

export const WRITE_OFF_ACTIONS: WriteOffAction[] = [
  { id: "utilized", label: "Утилизировано" },
  { id: "transferred", label: "Передано в отдел внутреннего поставщика" },
];

export interface WriteOffLine {
  nomenclatureId: string;
  nomenclatureName: string;
  group: NomenclatureGroup;
  manufacturer: string;
  lot: string;
  place: string;
  quantity: number;
  reason: string;
  comment: string;
}

export interface WriteOffSession {
  id: string;
  createdAt: string;
  createdBy: string;
  completedAt?: string;
  status: WriteOffStatus;
  commission: WriteOffCommission;
  action: string;
  lines: WriteOffLine[];
}

const CURRENT_USER = "Смирнова А.";

const EMPTY_COMMISSION: WriteOffCommission = {
  headOfProduction: "",
  headOfQuality: "",
  qualityEmployee: "",
  authorizedPerson: "",
};

/** Initial mock sessions (completed, for demo history). */
export const INITIAL_WRITE_OFF_SESSIONS: WriteOffSession[] = [
  {
    id: "wo-001",
    createdAt: "2025-03-10T10:00:00.000Z",
    createdBy: "Иванова Е.",
    completedAt: "2025-03-10T15:30:00.000Z",
    status: "completed",
    commission: {
      headOfProduction: "Козлова М.",
      headOfQuality: "Петров С.",
      qualityEmployee: "Сидоров В.",
      authorizedPerson: "Иванова Е.",
    },
    action: "utilized",
    lines: [
      {
        nomenclatureId: "nm-001",
        nomenclatureName: "CytoFlex Daily QC Fluorospheres",
        group: "Проточная цитометрия",
        manufacturer: "Beckman Coulter",
        lot: "LOT-2025-001A",
        place: "Склад БМКП",
        quantity: 5,
        reason: "expiry",
        comment: "Истёк срок годности 01.03.2025",
      },
      {
        nomenclatureId: "nm-ifa-001",
        nomenclatureName: "TIMP-1",
        group: "ИФА",
        manufacturer: "RayBiotech",
        lot: "0603250191",
        place: "Склад БМКП",
        quantity: 3,
        reason: "storage",
        comment: "Нарушение температурного режима",
      },
    ],
  },
  {
    id: "wo-002",
    createdAt: "2025-03-20T08:30:00.000Z",
    createdBy: "Петров С.",
    completedAt: "2025-03-20T12:00:00.000Z",
    status: "completed",
    commission: {
      headOfProduction: "Смирнова А.",
      headOfQuality: "Козлова М.",
      qualityEmployee: "Сидоров В.",
      authorizedPerson: "Петров С.",
    },
    action: "transferred",
    lines: [
      {
        nomenclatureId: "nm-002",
        nomenclatureName: "DuraClone IM LC Cells",
        group: "Проточная цитометрия",
        manufacturer: "Beckman Coulter",
        lot: "DC-2025-003",
        place: "Лаборатория",
        quantity: 2,
        reason: "integrity",
        comment: "Повреждена упаковка при транспортировке",
      },
    ],
  },
];

/** Generate a new draft session with empty lines. */
export function createDraftSession(
  createdBy: string = CURRENT_USER,
): WriteOffSession {
  return {
    id: `wo-${Date.now()}`,
    createdAt: new Date().toISOString(),
    createdBy,
    status: "draft",
    commission: { ...EMPTY_COMMISSION },
    action: "utilized",
    lines: [],
  };
}

/** Helper: get unique storage places. */
export { getAllStoragePlaces };

/** Re-export NomenclatureGroup type. */
export type { NomenclatureGroup } from "./balancesData";

/** Re-export catalog and stock for write-off form. */
export { MOCK_CATALOG, MOCK_STOCK_LINES };

/** Helper: get unique nomenclature groups. */
export { ALL_GROUPS };

/** Helper: get reason label by ID. */
export function getReasonLabel(reasonId: string): string {
  const reason = WRITE_OFF_REASONS.find((r) => r.id === reasonId);
  return reason ? reason.label : reasonId;
}
