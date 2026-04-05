export type QuarantineStatus = "карантин" | "разрешён" | "брак";

export type RejectionReason =
  | "нарушение стерильности"
  | "нарушение целостности"
  | "нарушение сроков годности"
  | "нарушение условий хранения"
  | "другие";

export interface QuarantineEntry {
  id: string;
  nomenclatureId: string;
  nomenclatureName: string;
  group: string;
  manufacturer: string;
  lot: string;
  quantity: number;
  expiryDate: string;
  placedAt: string;
  expectedReleaseDate: string;
  status: QuarantineStatus;
  labResult: string;
  resolvedAt?: string;
  rejectionReason?: RejectionReason;
  rejectionReasonOther?: string;
  rejectionComment?: string;
  destinationPlace: string;
}

export const INITIAL_QUARANTINE_ENTRIES: QuarantineEntry[] = [
  {
    id: "q-001",
    nomenclatureId: "nm-001",
    nomenclatureName: "CytoFlex Daily QC Fluorospheres",
    group: "Проточная цитометрия",
    manufacturer: "Beckman Coulter",
    lot: "LOT-2025-037Q",
    quantity: 50,
    expiryDate: "2026-08-15",
    placedAt: "2025-04-01T09:00:00",
    expectedReleaseDate: "2026-04-15",
    status: "карантин",
    labResult: "",
    destinationPlace: "Склад БМКП",
  },
  {
    id: "q-002",
    nomenclatureId: "nm-005",
    nomenclatureName: "CD14-Krome Orange (0,5 мл)",
    group: "Проточная цитометрия",
    manufacturer: "Beckman Coulter",
    lot: "LOT-2025-038Q",
    quantity: 30,
    expiryDate: "2026-09-20",
    placedAt: "2025-04-02T11:30:00",
    expectedReleaseDate: "2026-04-08",
    status: "карантин",
    labResult: "",
    destinationPlace: "Склад БМКП",
  },
  {
    id: "q-003",
    nomenclatureId: "nm-ifa-001",
    nomenclatureName: "TIMP-1",
    group: "ИФА",
    manufacturer: "RayBiotech",
    lot: "1105250789",
    quantity: 25,
    expiryDate: "2026-11-10",
    placedAt: "2025-04-03T14:00:00",
    expectedReleaseDate: "2026-04-22",
    status: "карантин",
    labResult: "",
    destinationPlace: "Склад БМКП",
  },
  {
    id: "q-004",
    nomenclatureId: "nm-ifa-004",
    nomenclatureName: "Интерлейкин-1 бета",
    group: "ИФА",
    manufacturer: "Вектор-Бест",
    lot: "120",
    quantity: 15,
    expiryDate: "2026-12-01",
    placedAt: "2025-04-04T08:00:00",
    expectedReleaseDate: "2026-04-29",
    status: "карантин",
    labResult: "",
    destinationPlace: "Склад БМКП",
  },
];
