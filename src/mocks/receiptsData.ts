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

/** Ответ по показателю спецификации во входном контроле поступления. */
export type ReceiptIncomingIndicatorValue = "Да" | "Нет" | "Не определено";

/** Ключ — `id` строки спецификации из номенклатуры. */
export type ReceiptIncomingControlAnswers = Record<
  string,
  ReceiptIncomingIndicatorValue
>;

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
  /** Входной контроль по спецификации номенклатуры (показатель id → ответ). */
  incomingControl?: ReceiptIncomingControlAnswers;
  /** Примечания к входному контролю (необязательно). */
  incomingControlNotes?: string;
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
        incomingControl: {
          "spec-01": "Да",
          "spec-02": "Да",
          "spec-03": "Да",
          "spec-04": "Да",
          "spec-05": "Да",
          "spec-06": "Да",
          "spec-07": "Да",
          "spec-08": "Да",
          "spec-09": "Да",
          "spec-10": "Да",
          "spec-11": "Да",
          "spec-12": "Да",
          "spec-13": "Да",
          "spec-14": "Да",
          "spec-15": "Да",
        },
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

