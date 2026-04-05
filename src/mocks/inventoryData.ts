/** Моки для UI «Инвентаризация». */

import {
  MOCK_STOCK_LINES,
  MOCK_CATALOG,
  getAllStoragePlaces,
  ALL_GROUPS,
  type NomenclatureGroup,
} from "./balancesData";

export type InventoryStatus = "draft" | "completed";
export type DiscrepancyStatus = "совпадение" | "излишек" | "недостача";

export interface InventoryLine {
  nomenclatureId: string;
  nomenclatureName: string;
  group: NomenclatureGroup;
  manufacturer: string;
  lot: string;
  place: string;
  systemQuantity: number;
  actualQuantity: number | null;
  discrepancy: number | null;
  status: DiscrepancyStatus;
  comment: string;
}

export interface InventorySession {
  id: string;
  createdAt: string;
  createdBy: string;
  completedAt?: string;
  status: InventoryStatus;
  lines: InventoryLine[];
}

const CURRENT_USER = "Смирнова А.";

/** Build inventory lines from current stock data. */
function buildInventoryLines(): InventoryLine[] {
  const lines: InventoryLine[] = [];

  for (const stockLine of MOCK_STOCK_LINES) {
    const catalogItem = MOCK_CATALOG.find(
      (c) => c.id === stockLine.nomenclatureId,
    );
    if (!catalogItem) continue;

    const discrepancy = null;
    const status: DiscrepancyStatus = "совпадение";

    lines.push({
      nomenclatureId: stockLine.nomenclatureId,
      nomenclatureName: catalogItem.name,
      group: catalogItem.group,
      manufacturer: catalogItem.manufacturer,
      lot: stockLine.lot,
      place: stockLine.place,
      systemQuantity: stockLine.quantity,
      actualQuantity: null,
      discrepancy,
      status,
      comment: "",
    });
  }

  return lines;
}

/** Initial mock session (completed, for demo history). */
export const INITIAL_INVENTORY_SESSIONS: InventorySession[] = [
  {
    id: "inv-001",
    createdAt: "2025-03-15T09:00:00.000Z",
    createdBy: "Иванова Е.",
    completedAt: "2025-03-15T14:30:00.000Z",
    status: "completed",
    lines: [
      {
        nomenclatureId: "nm-001",
        nomenclatureName: "CytoFlex Daily QC Fluorospheres",
        group: "Проточная цитометрия",
        manufacturer: "Beckman Coulter",
        lot: "LOT-2025-001A",
        place: "Склад БМКП",
        systemQuantity: 30,
        actualQuantity: 28,
        discrepancy: -2,
        status: "недостача",
        comment: "Возможно, не учтено перемещение",
      },
      {
        nomenclatureId: "nm-001",
        nomenclatureName: "CytoFlex Daily QC Fluorospheres",
        group: "Проточная цитометрия",
        manufacturer: "Beckman Coulter",
        lot: "LOT-2025-002B",
        place: "Лаборатория",
        systemQuantity: 25,
        actualQuantity: 25,
        discrepancy: 0,
        status: "совпадение",
        comment: "",
      },
      {
        nomenclatureId: "nm-ifa-001",
        nomenclatureName: "TIMP-1",
        group: "ИФА",
        manufacturer: "RayBiotech",
        lot: "0603250191",
        place: "Склад БМКП",
        systemQuantity: 45,
        actualQuantity: 47,
        discrepancy: 2,
        status: "излишек",
        comment: "Пересортица с другой партией",
      },
    ],
  },
];

/** Generate a new draft session with current stock levels. */
export function createDraftSession(
  createdBy: string = CURRENT_USER,
): InventorySession {
  return {
    id: `inv-${Date.now()}`,
    createdAt: new Date().toISOString(),
    createdBy,
    status: "draft",
    lines: buildInventoryLines(),
  };
}

/** Helper: get unique storage places. */
export { getAllStoragePlaces };

/** Helper: get unique nomenclature groups. */
export { ALL_GROUPS };

/** Helper: calculate discrepancy status. */
export function calcDiscrepancyStatus(
  systemQty: number,
  actualQty: number,
): DiscrepancyStatus {
  const diff = actualQty - systemQty;
  if (diff === 0) return "совпадение";
  if (diff > 0) return "излишек";
  return "недостача";
}
