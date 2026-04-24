/**
 * Моки для UI «Поступления».
 *
 * Реализовано по аналогии со списаниями: есть «сессия» (документ) со статусом
 * draft/completed и строками поступления. Данные хранятся в localStorage через контекст.
 */

import { MOCK_CATALOG, type NomenclatureGroup } from "./balancesData";
import { USERS } from "./usersMock";

export { USERS, MOCK_CATALOG };

export type ReceiptStatus = "draft" | "completed";

export interface ReceiptLine {
  nomenclatureId: string;
  nomenclatureName: string;
  catalogNumber: string;
  serialNumber: string;
  lot: string;
  quantity: number;
  expiryDate: string;
  unit: string;
  place: string;
}

export interface ReceiptSession {
  id: string;
  createdAt: string;
  createdBy: string;
  updatedAt?: string;
  completedAt?: string;
  status: ReceiptStatus;
  lines: ReceiptLine[];
}

const CURRENT_USER = "Смирнова А.";

/** Initial mock sessions (completed, for demo history). */
export const INITIAL_RECEIPT_SESSIONS: ReceiptSession[] = [
  {
    id: "rcpt-001",
    createdAt: "2025-03-02T09:20:00.000Z",
    createdBy: "Петров С.",
    completedAt: "2025-03-02T10:05:00.000Z",
    status: "completed",
    lines: [
      {
        nomenclatureId: "nm-001",
        nomenclatureName: "CytoFlex Daily QC Fluorospheres",
        catalogNumber: "B53230",
        serialNumber: "SN-000124",
        lot: "LOT-2025-003C",
        quantity: 10,
        expiryDate: "2026-11-28",
        unit: "фл",
        place: "Склад БМКП",
      },
    ],
  },
];

/** Generate a new draft receipt session. */
export function createDraftReceipt(
  createdBy: string = CURRENT_USER,
): ReceiptSession {
  return {
    id: `rcpt-${Date.now()}`,
    createdAt: new Date().toISOString(),
    createdBy,
    status: "draft",
    lines: [],
  };
}

export type { NomenclatureGroup };

