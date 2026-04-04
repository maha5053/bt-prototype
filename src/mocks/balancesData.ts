/** Моки для UI «Остатки» и карточки номенклатуры (без бэкенда). */

export type NomenclatureGroup = 'Проточная цитометрия' | 'ИФА'

export type TransactionType =
  | 'приемка'
  | 'списание'
  | 'перемещение'
  | 'инвентаризация'

export interface Lot {
  code: string
  receiptDate: string
  expiryDate: string
}

export interface CatalogItem {
  id: string
  name: string
  catalogNumber: string
  group: NomenclatureGroup
  unit: string
  manufacturer: string
  description: string
  storageConditions: string
  notes: string
  lots: Lot[]
}

export interface StockLine {
  nomenclatureId: string
  place: string
  lot: string
  quantity: number
}

export interface StockTransaction {
  id: string
  nomenclatureId: string
  timestamp: string
  type: TransactionType
  initiator: string
  quantity: number
  lot: string
  context: string
  comment: string
}

export interface BalanceRow {
  nomenclatureId: string
  name: string
  catalogNumber: string
  group: NomenclatureGroup
  lotCode: string
  receiptDate: string
  expiryDate: string
  quantity: number
  place: string
}

export const MOCK_CATALOG: CatalogItem[] = [
  {
    id: 'nm-001',
    name: 'CytoFlex Daily QC Fluorospheres',
    catalogNumber: 'B53230',
    group: 'Проточная цитометрия',
    unit: 'фл',
    manufacturer: 'Beckman Coulter',
    description: 'Ежедневные контрольные флуоросферы для CytoFlex',
    storageConditions: '+2…+8 °C',
    notes: '',
    lots: [
      { code: 'LOT-2025-001A', receiptDate: '2025-01-15', expiryDate: '2026-03-15' },
      { code: 'LOT-2025-002B', receiptDate: '2025-04-10', expiryDate: '2026-07-22' },
      { code: 'LOT-2025-003C', receiptDate: '2025-09-05', expiryDate: '2026-11-28' },
    ],
  },
  {
    id: 'nm-002',
    name: 'DxFLEX Daily QC Fluorospheres (3 фл по 10 мл)',
    catalogNumber: 'C39283',
    group: 'Проточная цитометрия',
    unit: 'фл',
    manufacturer: 'Beckman Coulter',
    description: 'Контрольные флуоросферы для DxFLEX, 3 флакона по 10 мл',
    storageConditions: '+2…+8 °C',
    notes: '1 фл — вскр.',
    lots: [
      { code: 'LOT-2025-004A', receiptDate: '2025-02-20', expiryDate: '2026-02-08' },
      { code: 'LOT-2025-005B', receiptDate: '2025-06-12', expiryDate: '2026-05-19' },
    ],
  },
  {
    id: 'nm-003',
    name: 'Stem-Kit Reagents',
    catalogNumber: 'IM3630',
    group: 'Проточная цитометрия',
    unit: 'фл',
    manufacturer: 'Beckman Coulter',
    description: 'Реагенты для определения стволовых клеток',
    storageConditions: '+2…+8 °C',
    notes: 'вскр.',
    lots: [
      { code: 'LOT-2025-006A', receiptDate: '2025-01-08', expiryDate: '2026-09-03' },
    ],
  },
  {
    id: 'nm-005',
    name: 'CD14-Krome Orange (0,5 мл)',
    catalogNumber: 'B01175',
    group: 'Проточная цитометрия',
    unit: 'фл',
    manufacturer: 'Beckman Coulter',
    description: 'Моноклональное антитело CD14-Krome Orange',
    storageConditions: '+2…+8 °C',
    notes: 'вскр.',
    lots: [
      { code: 'LOT-2025-007A', receiptDate: '2025-03-25', expiryDate: '2026-04-11' },
      { code: 'LOT-2025-008B', receiptDate: '2025-07-18', expiryDate: '2026-08-25' },
      { code: 'LOT-2025-009C', receiptDate: '2025-11-02', expiryDate: '2026-12-30' },
      { code: 'LOT-2025-010D', receiptDate: '2025-12-15', expiryDate: '2026-02-17' },
      { code: 'LOT-2025-011E', receiptDate: '2025-05-30', expiryDate: '2026-06-06' },
    ],
  },
  {
    id: 'nm-006',
    name: 'CD19-Krome Orange (0,5 мл)',
    catalogNumber: 'A96418',
    group: 'Проточная цитометрия',
    unit: 'фл',
    manufacturer: 'Beckman Coulter',
    description: 'Моноклональное антитело CD19-Krome Orange',
    storageConditions: '+2…+8 °C',
    notes: 'вскр.',
    lots: [
      { code: 'LOT-2025-012A', receiptDate: '2025-04-05', expiryDate: '2026-10-14' },
      { code: 'LOT-2025-013B', receiptDate: '2025-08-22', expiryDate: '2026-03-21' },
    ],
  },
  {
    id: 'nm-007',
    name: 'CD34-APC-Alexa Fluor 750 (0,5 мл)',
    catalogNumber: 'A89309',
    group: 'Проточная цитометрия',
    unit: 'фл',
    manufacturer: 'Beckman Coulter',
    description: 'Моноклональное антитело CD34-APC-Alexa Fluor 750',
    storageConditions: '+2…+8 °C',
    notes: 'вскр.',
    lots: [
      { code: 'LOT-2025-014A', receiptDate: '2025-01-20', expiryDate: '2026-05-05' },
      { code: 'LOT-2025-015B', receiptDate: '2025-05-15', expiryDate: '2026-09-16' },
      { code: 'LOT-2025-016C', receiptDate: '2025-09-30', expiryDate: '2026-12-27' },
    ],
  },
  {
    id: 'nm-008',
    name: 'CD73-PE (1 мл)',
    catalogNumber: 'B68176',
    group: 'Проточная цитометрия',
    unit: 'фл',
    manufacturer: 'Beckman Coulter',
    description: 'Моноклональное антитело CD73-PE',
    storageConditions: '+2…+8 °C',
    notes: 'вскр.',
    lots: [
      { code: 'LOT-2025-017A', receiptDate: '2025-02-10', expiryDate: '2026-07-09' },
    ],
  },
  {
    id: 'nm-009',
    name: 'CD90-FITC (2 мл)',
    catalogNumber: 'IM1839U',
    group: 'Проточная цитометрия',
    unit: 'фл',
    manufacturer: 'Beckman Coulter',
    description: 'Моноклональное антитело CD90-FITC',
    storageConditions: '+2…+8 °C',
    notes: 'вскр.',
    lots: [
      { code: 'LOT-2025-018A', receiptDate: '2025-03-14', expiryDate: '2026-04-12' },
      { code: 'LOT-2025-019B', receiptDate: '2025-06-28', expiryDate: '2026-08-23' },
      { code: 'LOT-2025-020C', receiptDate: '2025-10-05', expiryDate: '2026-12-29' },
      { code: 'LOT-2025-021D', receiptDate: '2025-12-20', expiryDate: '2026-06-18' },
    ],
  },
  {
    id: 'nm-010',
    name: 'Anti-Hu CD105 APC (1 мл)',
    catalogNumber: '1A-298-T100',
    group: 'Проточная цитометрия',
    unit: 'фл',
    manufacturer: 'Exbio',
    description: 'Моноклональное антитело Anti-Hu CD105 APC',
    storageConditions: '+2…+8 °C',
    notes: 'вскр.',
    lots: [
      { code: 'LOT-2025-022A', receiptDate: '2025-04-18', expiryDate: '2026-10-07' },
      { code: 'LOT-2025-023B', receiptDate: '2025-07-25', expiryDate: '2026-03-20' },
      { code: 'LOT-2025-024C', receiptDate: '2025-11-15', expiryDate: '2026-11-30' },
    ],
  },
  {
    id: 'nm-011',
    name: 'CD45-PC5.5 (1 мл)',
    catalogNumber: 'A62835',
    group: 'Проточная цитометрия',
    unit: 'фл',
    manufacturer: 'Beckman Coulter',
    description: 'Моноклональное антитело CD45-PC5.5',
    storageConditions: '+2…+8 °C',
    notes: 'нам не по',
    lots: [
      { code: 'LOT-2025-025A', receiptDate: '2025-01-30', expiryDate: '2026-08-10' },
      { code: 'LOT-2025-026B', receiptDate: '2025-05-22', expiryDate: '2026-12-24' },
    ],
  },
  {
    id: 'nm-012',
    name: 'CD15-PE (2 мл)',
    catalogNumber: 'IM1954U',
    group: 'Проточная цитометрия',
    unit: 'фл',
    manufacturer: 'Beckman Coulter',
    description: 'Моноклональное антитело CD15-PE',
    storageConditions: '+2…+8 °C',
    notes: '',
    lots: [
      { code: 'LOT-2025-027A', receiptDate: '2025-02-28', expiryDate: '2026-05-13' },
      { code: 'LOT-2025-028B', receiptDate: '2025-06-08', expiryDate: '2026-09-26' },
      { code: 'LOT-2025-029C', receiptDate: '2025-10-18', expiryDate: '2026-03-04' },
      { code: 'LOT-2025-030D', receiptDate: '2025-12-01', expiryDate: '2026-11-15' },
      { code: 'LOT-2025-031E', receiptDate: '2025-08-10', expiryDate: '2026-07-28' },
    ],
  },
  {
    id: 'nm-013',
    name: 'Anti-HLA-DR-PC7 (0,5 мл)',
    catalogNumber: 'B49180',
    group: 'Проточная цитометрия',
    unit: 'фл',
    manufacturer: 'Beckman Coulter',
    description: 'Моноклональное антитело Anti-HLA-DR-PC7',
    storageConditions: '+2…+8 °C',
    notes: 'вскр.',
    lots: [
      { code: 'LOT-2025-032A', receiptDate: '2025-03-05', expiryDate: '2026-06-11' },
      { code: 'LOT-2025-033B', receiptDate: '2025-07-12', expiryDate: '2026-10-22' },
    ],
  },
  {
    id: 'nm-014',
    name: 'CD45-Pacific Blue (1 мл)',
    catalogNumber: 'A74763',
    group: 'Проточная цитометрия',
    unit: 'фл',
    manufacturer: 'Beckman Coulter',
    description: 'Моноклональное антитело CD45-Pacific Blue',
    storageConditions: '+2…+8 °C',
    notes: 'вскр.',
    lots: [
      { code: 'LOT-2025-034A', receiptDate: '2025-04-22', expiryDate: '2026-04-06' },
      { code: 'LOT-2025-035B', receiptDate: '2025-09-15', expiryDate: '2026-09-17' },
      { code: 'LOT-2025-036C', receiptDate: '2025-11-28', expiryDate: '2026-12-25' },
    ],
  },
  // === ИФА ===
  {
    id: 'nm-ifa-001',
    name: 'TIMP-1',
    catalogNumber: 'ELH-TIMP1',
    group: 'ИФА',
    unit: 'наб',
    manufacturer: 'RayBiotech',
    description: 'Тканевой ингибитор ММР-1 (TIMP-1)',
    storageConditions: '+2…+8 °C',
    notes: '',
    lots: [
      { code: '0603250191', receiptDate: '2025-01-10', expiryDate: '2026-06-03' },
      { code: '0815250412', receiptDate: '2025-03-20', expiryDate: '2026-08-15' },
      { code: '1020250677', receiptDate: '2025-06-15', expiryDate: '2026-10-20' },
    ],
  },
  {
    id: 'nm-ifa-002',
    name: 'MMP-2',
    catalogNumber: 'ELH-MMP2',
    group: 'ИФА',
    unit: 'наб',
    manufacturer: 'RayBiotech',
    description: 'Матриксная металлопротеиназа 2',
    storageConditions: '+2…+8 °C',
    notes: '',
    lots: [
      { code: '0603250170', receiptDate: '2025-02-14', expiryDate: '2026-06-03' },
      { code: '0718250255', receiptDate: '2025-04-10', expiryDate: '2026-07-18' },
      { code: '0930250841', receiptDate: '2025-07-22', expiryDate: '2026-09-30' },
    ],
  },
  {
    id: 'nm-ifa-003',
    name: 'MMP-9',
    catalogNumber: 'ELH-MMP9',
    group: 'ИФА',
    unit: 'наб',
    manufacturer: 'RayBiotech',
    description: 'Матриксная металлопротеиназа 9',
    storageConditions: '+2…+8 °C',
    notes: '',
    lots: [
      { code: '0603250173', receiptDate: '2025-03-08', expiryDate: '2026-06-03' },
      { code: '0920250881', receiptDate: '2025-05-22', expiryDate: '2026-09-20' },
      { code: '1115250399', receiptDate: '2025-08-10', expiryDate: '2026-11-15' },
    ],
  },
  {
    id: 'nm-ifa-004',
    name: 'Интерлейкин-1 бета',
    catalogNumber: 'A-8766',
    group: 'ИФА',
    unit: 'наб',
    manufacturer: 'Вектор-Бест',
    description: 'Интерлейкин-1 бета человека',
    storageConditions: '+2…+8 °C',
    notes: '',
    lots: [
      { code: '54', receiptDate: '2024-08-15', expiryDate: '2024-02-17' },
      { code: '58', receiptDate: '2024-09-22', expiryDate: '2024-12-14' },
      { code: '82', receiptDate: '2025-06-10', expiryDate: '2026-06-10' },
      { code: '115', receiptDate: '2025-09-18', expiryDate: '2026-09-18' },
    ],
  },
  {
    id: 'nm-ifa-005',
    name: 'Интерлейкин-2',
    catalogNumber: 'A-8772',
    group: 'ИФА',
    unit: 'наб',
    manufacturer: 'Вектор-Бест',
    description: 'Интерлейкин-2 человека',
    storageConditions: '+2…+8 °C',
    notes: '',
    lots: [
      { code: '51', receiptDate: '2024-11-05', expiryDate: '2025-01-04' },
      { code: '95', receiptDate: '2025-07-15', expiryDate: '2026-07-15' },
      { code: '142', receiptDate: '2025-10-05', expiryDate: '2026-10-05' },
    ],
  },
  {
    id: 'nm-ifa-006',
    name: 'Интерлейкин-4',
    catalogNumber: 'A-8754',
    group: 'ИФА',
    unit: 'наб',
    manufacturer: 'Вектор-Бест',
    description: 'Интерлейкин-4 человека',
    storageConditions: '+2…+8 °C',
    notes: '',
    lots: [
      { code: '68', receiptDate: '2024-09-10', expiryDate: '2024-09-17' },
      { code: '104', receiptDate: '2025-08-01', expiryDate: '2026-08-01' },
      { code: '158', receiptDate: '2025-11-12', expiryDate: '2026-11-12' },
    ],
  },
  {
    id: 'nm-ifa-007',
    name: 'Интерлейкин-6',
    catalogNumber: 'A-8768',
    group: 'ИФА',
    unit: 'наб',
    manufacturer: 'Вектор-Бест',
    description: 'Интерлейкин-6 человека',
    storageConditions: '+2…+8 °C',
    notes: '',
    lots: [
      { code: '75', receiptDate: '2024-10-01', expiryDate: '2024-09-14' },
      { code: '112', receiptDate: '2025-05-18', expiryDate: '2026-05-18' },
      { code: '167', receiptDate: '2025-09-25', expiryDate: '2026-09-25' },
    ],
  },
  {
    id: 'nm-ifa-008',
    name: 'Интерлейкин-6',
    catalogNumber: 'BMS213-2',
    group: 'ИФА',
    unit: 'наб',
    manufacturer: 'Invitrogen by Thermo Fisher Scientific',
    description: 'Интерлейкин-6 человека (eBioscience)',
    storageConditions: '+2…+8 °C',
    notes: '',
    lots: [
      { code: '273143-003', receiptDate: '2024-06-20', expiryDate: '2024-05-31' },
      { code: '284501-012', receiptDate: '2025-04-05', expiryDate: '2026-04-05' },
      { code: '291608-045', receiptDate: '2025-08-18', expiryDate: '2026-08-18' },
    ],
  },
  {
    id: 'nm-ifa-009',
    name: 'Интерлейкин-8',
    catalogNumber: 'A-8762',
    group: 'ИФА',
    unit: 'наб',
    manufacturer: 'Вектор-Бест',
    description: 'Интерлейкин-8 человека',
    storageConditions: '+2…+8 °C',
    notes: '',
    lots: [
      { code: '53', receiptDate: '2024-08-28', expiryDate: '2024-11-30' },
      { code: '128', receiptDate: '2025-09-10', expiryDate: '2026-09-10' },
      { code: '183', receiptDate: '2025-12-01', expiryDate: '2026-12-01' },
    ],
  },
  {
    id: 'nm-ifa-010',
    name: 'Интерлейкин-10',
    catalogNumber: 'A-8774',
    group: 'ИФА',
    unit: 'наб',
    manufacturer: 'Вектор-Бест',
    description: 'Интерлейкин-10 человека',
    storageConditions: '+2…+8 °C',
    notes: '',
    lots: [
      { code: '53', receiptDate: '2024-09-05', expiryDate: '2024-11-15' },
      { code: '135', receiptDate: '2025-06-25', expiryDate: '2026-06-25' },
      { code: '190', receiptDate: '2025-10-15', expiryDate: '2026-10-15' },
    ],
  },
  {
    id: 'nm-ifa-011',
    name: 'Интерлейкин-12',
    catalogNumber: 'ELH-IL12p40',
    group: 'ИФА',
    unit: 'наб',
    manufacturer: 'RayBiotech',
    description: 'Интерлейкин-12 p40 человека',
    storageConditions: '+2…+8 °C',
    notes: '',
    lots: [
      { code: '0926230319', receiptDate: '2024-10-12', expiryDate: '2024-09-25' },
      { code: '1105250874', receiptDate: '2025-08-20', expiryDate: '2026-11-05' },
      { code: '1220250551', receiptDate: '2025-11-05', expiryDate: '2026-12-20' },
    ],
  },
  {
    id: 'nm-ifa-012',
    name: 'Интерлейкин-13',
    catalogNumber: 'ELH-IL13',
    group: 'ИФА',
    unit: 'наб',
    manufacturer: 'RayBiotech',
    description: 'Интерлейкин-13 человека',
    storageConditions: '+2…+8 °C',
    notes: '',
    lots: [
      { code: '0926230148', receiptDate: '2024-10-15', expiryDate: '2024-09-25' },
      { code: '1218250492', receiptDate: '2025-07-30', expiryDate: '2026-12-18' },
      { code: '0115260723', receiptDate: '2025-12-10', expiryDate: '2027-01-15' },
    ],
  },
  {
    id: 'nm-ifa-013',
    name: 'LOXL2',
    catalogNumber: 'ELH-LOXL2',
    group: 'ИФА',
    unit: 'наб',
    manufacturer: 'RayBiotech',
    description: 'Лизилоксидаза-подобный белок 2 (LOXL2)',
    storageConditions: '+2…+8 °C',
    notes: '',
    lots: [
      { code: '0926232643', receiptDate: '2024-10-18', expiryDate: '2024-09-25' },
      { code: '1125250756', receiptDate: '2025-09-05', expiryDate: '2026-11-25' },
      { code: '0130260418', receiptDate: '2025-12-20', expiryDate: '2027-01-30' },
    ],
  },
  {
    id: 'nm-ifa-014',
    name: 'PARC',
    catalogNumber: 'ELH-PARC',
    group: 'ИФА',
    unit: 'наб',
    manufacturer: 'RayBiotech',
    description: 'Лёгочный хемокин, рег. активацией (PARC)',
    storageConditions: '+2…+8 °C',
    notes: '',
    lots: [
      { code: '0926230179', receiptDate: '2024-10-20', expiryDate: '2024-09-25' },
      { code: '1015250338', receiptDate: '2025-06-12', expiryDate: '2026-10-15' },
      { code: '0205260601', receiptDate: '2025-12-28', expiryDate: '2027-02-05' },
    ],
  },
  {
    id: 'nm-ifa-015',
    name: 'Муцин 1 (MUC1)',
    catalogNumber: 'SEA413Hu',
    group: 'ИФА',
    unit: 'наб',
    manufacturer: 'Cloud-Clone Corp.',
    description: 'Муцин 1 (MUC1) человека',
    storageConditions: '+2…+8 °C',
    notes: '',
    lots: [
      { code: 'L230920215', receiptDate: '2024-07-10', expiryDate: '2024-09-01' },
      { code: 'L250418092', receiptDate: '2025-08-15', expiryDate: '2026-04-18' },
      { code: 'L260105077', receiptDate: '2025-12-15', expiryDate: '2027-01-05' },
    ],
  },
  {
    id: 'nm-ifa-016',
    name: 'Сурфактантный белок А (SPA)',
    catalogNumber: 'SEA890Hu',
    group: 'ИФА',
    unit: 'наб',
    manufacturer: 'Cloud-Clone Corp.',
    description: 'Сурфактантный белок А (SPA) человека',
    storageConditions: '+2…+8 °C',
    notes: '',
    lots: [
      { code: 'L230920193', receiptDate: '2024-07-12', expiryDate: '2024-09-01' },
      { code: 'L250625144', receiptDate: '2025-09-22', expiryDate: '2026-06-25' },
      { code: 'L260210088', receiptDate: '2025-12-30', expiryDate: '2027-02-10' },
    ],
  },
]

/** Строки остатков: номенклатура + место + лот + количество. */
export const MOCK_STOCK_LINES: StockLine[] = [
  { nomenclatureId: 'nm-001', place: 'Склад БМКП', lot: 'LOT-2025-001A', quantity: 30 },
  { nomenclatureId: 'nm-001', place: 'Лаборатория', lot: 'LOT-2025-002B', quantity: 25 },
  { nomenclatureId: 'nm-001', place: 'Лаборатория', lot: 'LOT-2025-003C', quantity: 15 },
  { nomenclatureId: 'nm-002', place: 'Склад БМКП', lot: 'LOT-2025-004A', quantity: 40 },
  { nomenclatureId: 'nm-002', place: 'Криокамера', lot: 'LOT-2025-005B', quantity: 20 },
  { nomenclatureId: 'nm-003', place: 'Склад БМКП', lot: 'LOT-2025-006A', quantity: 50 },
  { nomenclatureId: 'nm-005', place: 'Склад БМКП', lot: 'LOT-2025-007A', quantity: 35 },
  { nomenclatureId: 'nm-005', place: 'Чистая зона', lot: 'LOT-2025-008B', quantity: 45 },
  { nomenclatureId: 'nm-005', place: 'Склад БМКП', lot: 'LOT-2025-009C', quantity: 10 },
  { nomenclatureId: 'nm-005', place: 'Лаборатория', lot: 'LOT-2025-010D', quantity: 20 },
  { nomenclatureId: 'nm-005', place: 'Склад БМКП', lot: 'LOT-2025-011E', quantity: 28 },
  { nomenclatureId: 'nm-006', place: 'Склад БМКП', lot: 'LOT-2025-012A', quantity: 60 },
  { nomenclatureId: 'nm-006', place: 'Чистая зона', lot: 'LOT-2025-013B', quantity: 15 },
  { nomenclatureId: 'nm-007', place: 'Склад БМКП', lot: 'LOT-2025-014A', quantity: 80 },
  { nomenclatureId: 'nm-007', place: 'CNC', lot: 'LOT-2025-015B', quantity: 50 },
  { nomenclatureId: 'nm-007', place: 'Склад БМКП', lot: 'LOT-2025-016C', quantity: 30 },
  { nomenclatureId: 'nm-008', place: 'Склад БМКП', lot: 'LOT-2025-017A', quantity: 42 },
  { nomenclatureId: 'nm-008', place: 'Чистая зона', lot: 'LOT-2025-018A', quantity: 55 },
  { nomenclatureId: 'nm-009', place: 'Склад БМКП', lot: 'LOT-2025-019B', quantity: 33 },
  { nomenclatureId: 'nm-009', place: 'Склад БМКП', lot: 'LOT-2025-020C', quantity: 18 },
  { nomenclatureId: 'nm-009', place: 'Склад БМКП', lot: 'LOT-2025-021D', quantity: 25 },
  { nomenclatureId: 'nm-010', place: 'Склад БМКП', lot: 'LOT-2025-022A', quantity: 70 },
  { nomenclatureId: 'nm-010', place: 'Лаборатория', lot: 'LOT-2025-023B', quantity: 22 },
  { nomenclatureId: 'nm-010', place: 'Склад БМКП', lot: 'LOT-2025-024C', quantity: 8 },
  { nomenclatureId: 'nm-011', place: 'Склад БМКП', lot: 'LOT-2025-025A', quantity: 48 },
  { nomenclatureId: 'nm-011', place: 'Лаборатория', lot: 'LOT-2025-026B', quantity: 60 },
  { nomenclatureId: 'nm-012', place: 'Склад БМКП', lot: 'LOT-2025-027A', quantity: 38 },
  { nomenclatureId: 'nm-012', place: 'Склад БМКП', lot: 'LOT-2025-028B', quantity: 55 },
  { nomenclatureId: 'nm-012', place: 'Склад БМКП', lot: 'LOT-2025-029C', quantity: 27 },
  { nomenclatureId: 'nm-012', place: 'Склад БМКП', lot: 'LOT-2025-030D', quantity: 12 },
  { nomenclatureId: 'nm-012', place: 'Склад БМКП', lot: 'LOT-2025-031E', quantity: 30 },
  { nomenclatureId: 'nm-013', place: 'Склад БМКП', lot: 'LOT-2025-032A', quantity: 44 },
  { nomenclatureId: 'nm-013', place: 'Холодильник Реагенты', lot: 'LOT-2025-033B', quantity: 16 },
  { nomenclatureId: 'nm-014', place: 'Склад БМКП', lot: 'LOT-2025-034A', quantity: 65 },
  { nomenclatureId: 'nm-014', place: 'Склад БМКП', lot: 'LOT-2025-035B', quantity: 30 },
  { nomenclatureId: 'nm-014', place: 'Склад БМКП', lot: 'LOT-2025-036C', quantity: 20 },
  // ИФА items
  { nomenclatureId: 'nm-ifa-001', place: 'Склад БМКП', lot: '0603250191', quantity: 45 },
  { nomenclatureId: 'nm-ifa-001', place: 'Склад БМКП', lot: '0815250412', quantity: 30 },
  { nomenclatureId: 'nm-ifa-001', place: 'Склад БМКП', lot: '1020250677', quantity: 18 },
  { nomenclatureId: 'nm-ifa-002', place: 'Склад БМКП', lot: '0603250170', quantity: 28 },
  { nomenclatureId: 'nm-ifa-002', place: 'Склад БМКП', lot: '0718250255', quantity: 12 },
  { nomenclatureId: 'nm-ifa-002', place: 'Склад БМКП', lot: '0926230170', quantity: 0 },
  { nomenclatureId: 'nm-ifa-002', place: 'Склад БМКП', lot: '0930250841', quantity: 22 },
  { nomenclatureId: 'nm-ifa-003', place: 'Склад БМКП', lot: '0603250173', quantity: 35 },
  { nomenclatureId: 'nm-ifa-003', place: 'Склад БМКП', lot: '0920250881', quantity: 15 },
  { nomenclatureId: 'nm-ifa-003', place: 'Склад БМКП', lot: '1115250399', quantity: 27 },
  { nomenclatureId: 'nm-ifa-004', place: 'Склад БМКП', lot: '54', quantity: 0 },
  { nomenclatureId: 'nm-ifa-004', place: 'Склад БМКП', lot: '58', quantity: 0 },
  { nomenclatureId: 'nm-ifa-004', place: 'Склад БМКП', lot: '82', quantity: 0 },
  { nomenclatureId: 'nm-ifa-004', place: 'Склад БМКП', lot: '115', quantity: 0 },
  { nomenclatureId: 'nm-ifa-005', place: 'Склад БМКП', lot: '51', quantity: 8 },
  { nomenclatureId: 'nm-ifa-005', place: 'Склад БМКП', lot: '95', quantity: 18 },
  { nomenclatureId: 'nm-ifa-005', place: 'Склад БМКП', lot: '142', quantity: 25 },
  { nomenclatureId: 'nm-ifa-006', place: 'Склад БМКП', lot: '68', quantity: 0 },
  { nomenclatureId: 'nm-ifa-006', place: 'Склад БМКП', lot: '104', quantity: 25 },
  { nomenclatureId: 'nm-ifa-006', place: 'Склад БМКП', lot: '158', quantity: 11 },
  { nomenclatureId: 'nm-ifa-007', place: 'Склад БМКП', lot: '75', quantity: 0 },
  { nomenclatureId: 'nm-ifa-007', place: 'Склад БМКП', lot: '112', quantity: 30 },
  { nomenclatureId: 'nm-ifa-007', place: 'Склад БМКП', lot: '167', quantity: 16 },
  { nomenclatureId: 'nm-ifa-008', place: 'Склад БМКП', lot: '273143-003', quantity: 0 },
  { nomenclatureId: 'nm-ifa-008', place: 'Склад БМКП', lot: '284501-012', quantity: 14 },
  { nomenclatureId: 'nm-ifa-008', place: 'Склад БМКП', lot: '291608-045', quantity: 9 },
  { nomenclatureId: 'nm-ifa-009', place: 'Склад БМКП', lot: '53', quantity: 0 },
  { nomenclatureId: 'nm-ifa-009', place: 'Склад БМКП', lot: '128', quantity: 20 },
  { nomenclatureId: 'nm-ifa-009', place: 'Склад БМКП', lot: '183', quantity: 13 },
  { nomenclatureId: 'nm-ifa-010', place: 'Склад БМКП', lot: '53', quantity: 0 },
  { nomenclatureId: 'nm-ifa-010', place: 'Склад БМКП', lot: '135', quantity: 0 },
  { nomenclatureId: 'nm-ifa-010', place: 'Склад БМКП', lot: '190', quantity: 0 },
  { nomenclatureId: 'nm-ifa-011', place: 'Склад БМКП', lot: '0926230319', quantity: 0 },
  { nomenclatureId: 'nm-ifa-011', place: 'Склад БМКП', lot: '1105250874', quantity: 10 },
  { nomenclatureId: 'nm-ifa-011', place: 'Склад БМКП', lot: '1220250551', quantity: 19 },
  { nomenclatureId: 'nm-ifa-012', place: 'Склад БМКП', lot: '0926230148', quantity: 0 },
  { nomenclatureId: 'nm-ifa-012', place: 'Склад БМКП', lot: '1218250492', quantity: 12 },
  { nomenclatureId: 'nm-ifa-012', place: 'Склад БМКП', lot: '0115260723', quantity: 17 },
  { nomenclatureId: 'nm-ifa-013', place: 'Склад БМКП', lot: '0926232643', quantity: 0 },
  { nomenclatureId: 'nm-ifa-013', place: 'Склад БМКП', lot: '1125250756', quantity: 8 },
  { nomenclatureId: 'nm-ifa-013', place: 'Склад БМКП', lot: '0130260418', quantity: 14 },
  { nomenclatureId: 'nm-ifa-014', place: 'Склад БМКП', lot: '0926230179', quantity: 0 },
  { nomenclatureId: 'nm-ifa-014', place: 'Склад БМКП', lot: '1015250338', quantity: 15 },
  { nomenclatureId: 'nm-ifa-014', place: 'Склад БМКП', lot: '0205260601', quantity: 23 },
  { nomenclatureId: 'nm-ifa-015', place: 'Склад БМКП', lot: 'L230920215', quantity: 0 },
  { nomenclatureId: 'nm-ifa-015', place: 'Склад БМКП', lot: 'L250418092', quantity: 18 },
  { nomenclatureId: 'nm-ifa-015', place: 'Склад БМКП', lot: 'L260105077', quantity: 12 },
  { nomenclatureId: 'nm-ifa-016', place: 'Склад БМКП', lot: 'L230920193', quantity: 0 },
  { nomenclatureId: 'nm-ifa-016', place: 'Склад БМКП', lot: 'L250625144', quantity: 24 },
  { nomenclatureId: 'nm-ifa-016', place: 'Склад БМКП', lot: 'L260210088', quantity: 16 },
]

export const MOCK_TRANSACTIONS: StockTransaction[] = [
  {
    id: 'tx-1001',
    nomenclatureId: 'nm-001',
    timestamp: '2025-01-10T10:20:00',
    type: 'приемка',
    initiator: 'Петров И.',
    quantity: 130,
    lot: 'LOT-2',
    context: 'Поставка №884',
    comment: 'Частично размещено в лаборатории',
  },
  {
    id: 'tx-1002',
    nomenclatureId: 'nm-001',
    timestamp: '2025-03-01T14:05:00',
    type: 'перемещение',
    initiator: 'Сидорова А.',
    quantity: 3,
    lot: 'LOT-2',
    context: 'CNC → Лаборатория',
    comment: 'По заявке лаборанта',
  },
  {
    id: 'tx-1003',
    nomenclatureId: 'nm-001',
    timestamp: '2024-12-15T09:00:00',
    type: 'приемка',
    initiator: 'Козлов Д.',
    quantity: 20,
    lot: 'LOT-1',
    context: 'Поставка №801',
    comment: 'Кладовая',
  },
  {
    id: 'tx-1004',
    nomenclatureId: 'nm-001',
    timestamp: '2025-03-12T11:30:00',
    type: 'списание',
    initiator: 'Иванова Е.',
    quantity: -10,
    lot: 'LOT-2',
    context: 'Брак упаковки',
    comment: 'Акт №12',
  },
  {
    id: 'tx-2001',
    nomenclatureId: 'nm-002',
    timestamp: '2024-11-20T16:00:00',
    type: 'приемка',
    initiator: 'Петров И.',
    quantity: 8,
    lot: 'K-L1',
    context: 'Импорт',
    comment: '',
  },
  {
    id: 'tx-3001',
    nomenclatureId: 'nm-003',
    timestamp: '2023-06-01T10:00:00',
    type: 'приемка',
    initiator: 'Админ',
    quantity: 5,
    lot: 'G-99',
    context: 'Старый остаток',
    comment: 'Часть списана ранее',
  },
  {
    id: 'tx-3002',
    nomenclatureId: 'nm-003',
    timestamp: '2025-04-12T12:00:00',
    type: 'приемка',
    initiator: 'Петров И.',
    quantity: 12,
    lot: 'G-100',
    context: 'Поставка',
    comment: '',
  },
]

const catalogById = new Map(MOCK_CATALOG.map((c) => [c.id, c]))

export function getCatalogById(id: string): CatalogItem | undefined {
  return catalogById.get(id)
}

export function getStockLinesByNomenclature(id: string): StockLine[] {
  return MOCK_STOCK_LINES.filter((l) => l.nomenclatureId === id)
}

export interface EnrichedStockLine {
  nomenclatureId: string
  place: string
  lot: string
  quantity: number
  expiryDate: string
  receiptDate: string
}

export function getEnrichedStockLinesByNomenclature(id: string): EnrichedStockLine[] {
  return MOCK_STOCK_LINES.filter((l) => l.nomenclatureId === id && l.quantity > 0)
    .map((l) => {
      const item = catalogById.get(l.nomenclatureId)
      if (!item) return null
      const lot = item.lots.find((lt) => lt.code === l.lot)
      if (!lot) return null
      return {
        nomenclatureId: l.nomenclatureId,
        place: l.place,
        lot: l.lot,
        quantity: l.quantity,
        expiryDate: lot.expiryDate,
        receiptDate: lot.receiptDate,
      }
    })
    .filter((r): r is EnrichedStockLine => r !== null)
}

export function getTransactionsByNomenclature(id: string): StockTransaction[] {
  return MOCK_TRANSACTIONS.filter((t) => t.nomenclatureId === id).sort(
    (a, b) => b.timestamp.localeCompare(a.timestamp),
  )
}

function uniqueSortedDates(dates: string[]): string[] {
  return [...new Set(dates)].sort((a, b) => a.localeCompare(b))
}

function uniqueSortedStrings(values: string[]): string[] {
  return [...new Set(values)].sort((a, b) => a.localeCompare(b, 'ru'))
}

export function buildBalanceRows(): BalanceRow[] {
  const rows: BalanceRow[] = []
  for (const line of MOCK_STOCK_LINES) {
    const item = catalogById.get(line.nomenclatureId)
    if (!item) continue
    const lot = item.lots.find((l) => l.code === line.lot)
    if (!lot) continue
    rows.push({
      nomenclatureId: item.id,
      name: item.name,
      catalogNumber: item.catalogNumber,
      group: item.group,
      lotCode: line.lot,
      receiptDate: lot.receiptDate,
      expiryDate: lot.expiryDate,
      quantity: line.quantity,
      place: line.place,
    })
  }
  return rows
}

export function getAllStoragePlaces(): string[] {
  return uniqueSortedStrings(MOCK_STOCK_LINES.map((l) => l.place))
}

/** Остатки по месту (только qty &gt; 0), для подбора лота при перемещении. */
export type StockAtPlace = {
  nomenclatureId: string
  nomenclatureName: string
  place: string
  lot: string
  quantity: number
  expiryDate: string
  receiptDate: string
}

export function getPositiveStockAtPlace(place: string): StockAtPlace[] {
  return MOCK_STOCK_LINES.filter((l) => l.place === place && l.quantity > 0)
    .map((l) => {
      const item = catalogById.get(l.nomenclatureId)
      if (!item) return null
      const lot = item.lots.find((lt) => lt.code === l.lot)
      if (!lot) return null
      return {
        nomenclatureId: item.id,
        nomenclatureName: item.name,
        place: l.place,
        lot: l.lot,
        quantity: l.quantity,
        expiryDate: lot.expiryDate,
        receiptDate: lot.receiptDate,
      }
    })
    .filter((r): r is StockAtPlace => r !== null)
}

export const ALL_GROUPS: NomenclatureGroup[] = [
  'Проточная цитометрия',
  'ИФА',
]

export function formatRuDate(iso: string | undefined): string {
  if (!iso) return '—'
  const [y, m, d] = iso.split('-')
  if (!y || !m || !d) return iso
  return `${d}.${m}.${y}`
}

export function isOverdue(isoDate: string, now: Date): boolean {
  const t = new Date(isoDate + 'T23:59:59')
  return t.getTime() < now.getTime()
}
