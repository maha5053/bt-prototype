/** Моки для UI «Остатки» и карточки номенклатуры (без бэкенда). */

export type NomenclatureGroup =
  | 'Пластик'
  | 'Пуповинная кровь'
  | 'Расходные материалы'
  | 'Химия'

export type TransactionType =
  | 'приемка'
  | 'списание'
  | 'перемещение'
  | 'инвентаризация'

export interface CatalogItem {
  id: string
  name: string
  catalogNumber: string
  group: NomenclatureGroup
  unit: string
  manufacturer: string
  description: string
  storageConditions: string
  accountCode: string
  minStockLevel: number
  vendorCode: string
  notes: string
}

export interface StockLine {
  nomenclatureId: string
  place: string
  lot: string
  quantity: number
  expiryDate: string
  receiptDate: string
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
  totalQty: number
  expiryDates: string[]
  places: string[]
}

export const MOCK_CATALOG: CatalogItem[] = [
  {
    id: 'nm-001',
    name: 'CytoFlex Daily QC Fluorospheres',
    catalogNumber: 'B53230',
    group: 'Химия',
    unit: 'фл',
    manufacturer: 'Beckman Coulter',
    description: 'Ежедневные контрольные флуоросферы для CytoFlex',
    storageConditions: '+2…+8 °C',
    accountCode: '10.04.001',
    minStockLevel: 1,
    vendorCode: 'BC-B53230',
    notes: '',
  },
  {
    id: 'nm-002',
    name: 'DxFLEX Daily QC Fluorospheres (3 фл по 10 мл)',
    catalogNumber: 'C39283',
    group: 'Химия',
    unit: 'фл',
    manufacturer: 'Beckman Coulter',
    description: 'Контрольные флуоросферы для DxFLEX, 3 флакона по 10 мл',
    storageConditions: '+2…+8 °C',
    accountCode: '10.04.002',
    minStockLevel: 1,
    vendorCode: 'BC-C39283',
    notes: '1 фл — вскр.',
  },
  {
    id: 'nm-003',
    name: 'Stem-Kit Reagents',
    catalogNumber: 'IM3630',
    group: 'Химия',
    unit: 'фл',
    manufacturer: 'Beckman Coulter',
    description: 'Реагенты для определения стволовых клеток',
    storageConditions: '+2…+8 °C',
    accountCode: '10.04.003',
    minStockLevel: 1,
    vendorCode: 'BC-IM3630',
    notes: 'вскр.',
  },
  {
    id: 'nm-004',
    name: 'Stem-Kit Reagents',
    catalogNumber: 'IM3630',
    group: 'Химия',
    unit: 'фл',
    manufacturer: 'Beckman Coulter',
    description: 'Реагенты для определения стволовых клеток',
    storageConditions: '+2…+8 °C',
    accountCode: '10.04.003',
    minStockLevel: 1,
    vendorCode: 'BC-IM3630',
    notes: 'вскр.',
  },
  {
    id: 'nm-005',
    name: 'CD14-Krome Orange (0,5 мл)',
    catalogNumber: 'B01175',
    group: 'Химия',
    unit: 'фл',
    manufacturer: 'Beckman Coulter',
    description: 'Моноклональное антитело CD14-Krome Orange',
    storageConditions: '+2…+8 °C',
    accountCode: '10.04.004',
    minStockLevel: 1,
    vendorCode: 'BC-B01175',
    notes: 'вскр.',
  },
  {
    id: 'nm-006',
    name: 'CD14-Krome Orange (0,5 мл)',
    catalogNumber: 'B01175',
    group: 'Химия',
    unit: 'фл',
    manufacturer: 'Beckman Coulter',
    description: 'Моноклональное антитело CD14-Krome Orange',
    storageConditions: '+2…+8 °C',
    accountCode: '10.04.004',
    minStockLevel: 1,
    vendorCode: 'BC-B01175',
    notes: '',
  },
  {
    id: 'nm-007',
    name: 'CD19-Krome Orange (0,5 мл)',
    catalogNumber: 'A96418',
    group: 'Химия',
    unit: 'фл',
    manufacturer: 'Beckman Coulter',
    description: 'Моноклональное антитело CD19-Krome Orange',
    storageConditions: '+2…+8 °C',
    accountCode: '10.04.005',
    minStockLevel: 1,
    vendorCode: 'BC-A96418',
    notes: 'вскр.',
  },
  {
    id: 'nm-008',
    name: 'CD19-Krome Orange (0,5 мл)',
    catalogNumber: 'A96418',
    group: 'Химия',
    unit: 'фл',
    manufacturer: 'Beckman Coulter',
    description: 'Моноклональное антитело CD19-Krome Orange',
    storageConditions: '+2…+8 °C',
    accountCode: '10.04.005',
    minStockLevel: 1,
    vendorCode: 'BC-A96418',
    notes: '',
  },
  {
    id: 'nm-009',
    name: 'CD34-APC-Alexa Fluor 750 (0,5 мл)',
    catalogNumber: 'A89309',
    group: 'Химия',
    unit: 'фл',
    manufacturer: 'Beckman Coulter',
    description: 'Моноклональное антитело CD34-APC-Alexa Fluor 750',
    storageConditions: '+2…+8 °C',
    accountCode: '10.04.006',
    minStockLevel: 1,
    vendorCode: 'BC-A89309',
    notes: 'вскр.',
  },
  {
    id: 'nm-010',
    name: 'CD34-APC-Alexa Fluor 750 (0,5 мл)',
    catalogNumber: 'A89309',
    group: 'Химия',
    unit: 'фл',
    manufacturer: 'Beckman Coulter',
    description: 'Моноклональное антитело CD34-APC-Alexa Fluor 750',
    storageConditions: '+2…+8 °C',
    accountCode: '10.04.006',
    minStockLevel: 1,
    vendorCode: 'BC-A89309',
    notes: '',
  },
  {
    id: 'nm-011',
    name: 'CD73-PE (1 мл)',
    catalogNumber: 'B68176',
    group: 'Химия',
    unit: 'фл',
    manufacturer: 'Beckman Coulter',
    description: 'Моноклональное антитело CD73-PE',
    storageConditions: '+2…+8 °C',
    accountCode: '10.04.007',
    minStockLevel: 1,
    vendorCode: 'BC-B68176',
    notes: 'вскр.',
  },
  {
    id: 'nm-012',
    name: 'CD73-PE (1 мл)',
    catalogNumber: 'B68176',
    group: 'Химия',
    unit: 'фл',
    manufacturer: 'Beckman Coulter',
    description: 'Моноклональное антитело CD73-PE',
    storageConditions: '+2…+8 °C',
    accountCode: '10.04.007',
    minStockLevel: 1,
    vendorCode: 'BC-B68176',
    notes: '',
  },
  {
    id: 'nm-013',
    name: 'CD90-FITC (2 мл)',
    catalogNumber: 'IM1839U',
    group: 'Химия',
    unit: 'фл',
    manufacturer: 'Beckman Coulter',
    description: 'Моноклональное антитело CD90-FITC',
    storageConditions: '+2…+8 °C',
    accountCode: '10.04.008',
    minStockLevel: 1,
    vendorCode: 'BC-IM1839U',
    notes: 'вскр.',
  },
  {
    id: 'nm-014',
    name: 'CD90-FITC (2 мл)',
    catalogNumber: 'IM1839U',
    group: 'Химия',
    unit: 'фл',
    manufacturer: 'Beckman Coulter',
    description: 'Моноклональное антитело CD90-FITC',
    storageConditions: '+2…+8 °C',
    accountCode: '10.04.008',
    minStockLevel: 1,
    vendorCode: 'BC-IM1839U',
    notes: '',
  },
  {
    id: 'nm-015',
    name: 'Anti-Hu CD105 APC (1 мл)',
    catalogNumber: '1A-298-T100',
    group: 'Химия',
    unit: 'фл',
    manufacturer: 'Exbio',
    description: 'Моноклональное антитело Anti-Hu CD105 APC',
    storageConditions: '+2…+8 °C',
    accountCode: '10.04.009',
    minStockLevel: 1,
    vendorCode: 'EX-1A298T100',
    notes: 'вскр.',
  },
  {
    id: 'nm-016',
    name: 'Anti-Hu CD105 APC (1 мл)',
    catalogNumber: '1A-298-T100',
    group: 'Химия',
    unit: 'фл',
    manufacturer: 'Exbio',
    description: 'Моноклональное антитело Anti-Hu CD105 APC',
    storageConditions: '+2…+8 °C',
    accountCode: '10.04.009',
    minStockLevel: 1,
    vendorCode: 'EX-1A298T100',
    notes: '',
  },
  {
    id: 'nm-017',
    name: 'CD45-PC5.5 (1 мл)',
    catalogNumber: 'A62835',
    group: 'Химия',
    unit: 'фл',
    manufacturer: 'Beckman Coulter',
    description: 'Моноклональное антитело CD45-PC5.5',
    storageConditions: '+2…+8 °C',
    accountCode: '10.04.010',
    minStockLevel: 1,
    vendorCode: 'BC-A62835',
    notes: 'нам не по',
  },
  {
    id: 'nm-018',
    name: 'CD45-PC5.5 (1 мл)',
    catalogNumber: 'A62835',
    group: 'Химия',
    unit: 'фл',
    manufacturer: 'Beckman Coulter',
    description: 'Моноклональное антитело CD45-PC5.5',
    storageConditions: '+2…+8 °C',
    accountCode: '10.04.010',
    minStockLevel: 1,
    vendorCode: 'BC-A62835',
    notes: 'нам не по',
  },
  {
    id: 'nm-019',
    name: 'CD15-PE (2 мл)',
    catalogNumber: 'IM1954U',
    group: 'Химия',
    unit: 'фл',
    manufacturer: 'Beckman Coulter',
    description: 'Моноклональное антитело CD15-PE',
    storageConditions: '+2…+8 °C',
    accountCode: '10.04.011',
    minStockLevel: 1,
    vendorCode: 'BC-IM1954U',
    notes: '',
  },
  {
    id: 'nm-020',
    name: 'CD15-PE (2 мл)',
    catalogNumber: 'IM1954U',
    group: 'Химия',
    unit: 'фл',
    manufacturer: 'Beckman Coulter',
    description: 'Моноклональное антитело CD15-PE',
    storageConditions: '+2…+8 °C',
    accountCode: '10.04.011',
    minStockLevel: 1,
    vendorCode: 'BC-IM1954U',
    notes: '',
  },
  {
    id: 'nm-021',
    name: 'Anti-HLA-DR-PC7 (0,5 мл)',
    catalogNumber: 'B49180',
    group: 'Химия',
    unit: 'фл',
    manufacturer: 'Beckman Coulter',
    description: 'Моноклональное антитело Anti-HLA-DR-PC7',
    storageConditions: '+2…+8 °C',
    accountCode: '10.04.012',
    minStockLevel: 1,
    vendorCode: 'BC-B49180',
    notes: 'вскр.',
  },
  {
    id: 'nm-022',
    name: 'CD45-Pacific Blue (1 мл)',
    catalogNumber: 'A74763',
    group: 'Химия',
    unit: 'фл',
    manufacturer: 'Beckman Coulter',
    description: 'Моноклональное антитело CD45-Pacific Blue',
    storageConditions: '+2…+8 °C',
    accountCode: '10.04.013',
    minStockLevel: 1,
    vendorCode: 'BC-A74763',
    notes: 'вскр.',
  },
]

/** Строки остатков: номенклатура + место + лот (как в постановке для шприца). */
export const MOCK_STOCK_LINES: StockLine[] = [
  {
    nomenclatureId: 'nm-001',
    place: 'Склад БМКП',
    lot: '05ANAF',
    quantity: 1,
    expiryDate: '2024-05-04',
    receiptDate: '',
  },
  {
    nomenclatureId: 'nm-002',
    place: 'Склад БМКП',
    lot: '16ARJF',
    quantity: 1,
    expiryDate: '2025-10-03',
    receiptDate: '2025-10-10',
  },
  {
    nomenclatureId: 'nm-003',
    place: 'Склад БМКП',
    lot: '200280',
    quantity: 1,
    expiryDate: '2020-01-02',
    receiptDate: '',
  },
  {
    nomenclatureId: 'nm-004',
    place: 'Склад БМКП',
    lot: '200349',
    quantity: 1,
    expiryDate: '2023-04-18',
    receiptDate: '',
  },
  {
    nomenclatureId: 'nm-005',
    place: 'Склад БМКП',
    lot: '200041',
    quantity: 1,
    expiryDate: '2024-05-05',
    receiptDate: '',
  },
  {
    nomenclatureId: 'nm-006',
    place: 'Склад БМКП',
    lot: '300004',
    quantity: 1,
    expiryDate: '2028-03-13',
    receiptDate: '2025-11-25',
  },
  {
    nomenclatureId: 'nm-007',
    place: 'Склад БМКП',
    lot: '200044',
    quantity: 1,
    expiryDate: '2024-06-08',
    receiptDate: '',
  },
  {
    nomenclatureId: 'nm-008',
    place: 'Склад БМКП',
    lot: '300001',
    quantity: 1,
    expiryDate: '2028-04-18',
    receiptDate: '2025-11-25',
  },
  {
    nomenclatureId: 'nm-009',
    place: 'Склад БМКП',
    lot: '200093',
    quantity: 1,
    expiryDate: '2024-01-09',
    receiptDate: '',
  },
  {
    nomenclatureId: 'nm-010',
    place: 'Склад БМКП',
    lot: '300010',
    quantity: 1,
    expiryDate: '2027-06-12',
    receiptDate: '2025-11-25',
  },
  {
    nomenclatureId: 'nm-011',
    place: 'Склад БМКП',
    lot: '200026',
    quantity: 1,
    expiryDate: '2024-07-28',
    receiptDate: '',
  },
  {
    nomenclatureId: 'nm-012',
    place: 'Склад БМКП',
    lot: '300008',
    quantity: 1,
    expiryDate: '2020-01-20',
    receiptDate: '2025-11-25',
  },
  {
    nomenclatureId: 'nm-013',
    place: 'Склад БМКП',
    lot: '200055',
    quantity: 1,
    expiryDate: '2025-02-28',
    receiptDate: '',
  },
  {
    nomenclatureId: 'nm-014',
    place: 'Склад БМКП',
    lot: '300003',
    quantity: 1,
    expiryDate: '2028-08-11',
    receiptDate: '2025-11-25',
  },
  {
    nomenclatureId: 'nm-015',
    place: 'Склад БМКП',
    lot: '538620',
    quantity: 1,
    expiryDate: '2024-11',
    receiptDate: '',
  },
  {
    nomenclatureId: 'nm-016',
    place: 'Склад БМКП',
    lot: '548442',
    quantity: 1,
    expiryDate: '2028-06-30',
    receiptDate: '2026-01-14',
  },
  {
    nomenclatureId: 'nm-017',
    place: 'Склад БМКП',
    lot: '200516',
    quantity: 1,
    expiryDate: '2024-11-21',
    receiptDate: '',
  },
  {
    nomenclatureId: 'nm-018',
    place: 'Склад БМКП',
    lot: '300007',
    quantity: 1,
    expiryDate: '2027-01-17',
    receiptDate: '2025-10-10',
  },
  {
    nomenclatureId: 'nm-019',
    place: 'Склад БМКП',
    lot: '200069',
    quantity: 1,
    expiryDate: '2024-12-22',
    receiptDate: '',
  },
  {
    nomenclatureId: 'nm-020',
    place: 'Склад БМКП',
    lot: '300005',
    quantity: 1,
    expiryDate: '2028-04-01',
    receiptDate: '2025-11-25',
  },
  {
    nomenclatureId: 'nm-021',
    place: 'Склад БМКП',
    lot: '300001',
    quantity: 1,
    expiryDate: '2026-04-07',
    receiptDate: '2025-10-10',
  },
  {
    nomenclatureId: 'nm-022',
    place: 'Склад БМКП',
    lot: '300004',
    quantity: 1,
    expiryDate: '2026-11-08',
    receiptDate: '2025-10-10',
  },
  {
    nomenclatureId: 'nm-001',
    place: 'Лаборатория',
    lot: '05ANAF-2',
    quantity: 1,
    expiryDate: '2024-05-04',
    receiptDate: '',
  },
  {
    nomenclatureId: 'nm-006',
    place: 'Лаборатория',
    lot: '300004-L',
    quantity: 1,
    expiryDate: '2028-03-13',
    receiptDate: '',
  },
  {
    nomenclatureId: 'nm-002',
    place: 'Криокамера',
    lot: '16ARJF-K',
    quantity: 1,
    expiryDate: '2025-10-03',
    receiptDate: '',
  },
  {
    nomenclatureId: 'nm-015',
    place: 'Лаборатория',
    lot: '538620-L',
    quantity: 1,
    expiryDate: '2024-11',
    receiptDate: '',
  },
  {
    nomenclatureId: 'nm-017',
    place: 'Лаборатория',
    lot: '200516-L',
    quantity: 1,
    expiryDate: '2024-11-21',
    receiptDate: '',
  },
  {
    nomenclatureId: 'nm-007',
    place: 'Чистая зона',
    lot: '200044-Ч',
    quantity: 1,
    expiryDate: '2024-06-08',
    receiptDate: '',
  },
  {
    nomenclatureId: 'nm-011',
    place: 'Чистая зона',
    lot: '200026-Ч',
    quantity: 1,
    expiryDate: '2024-07-28',
    receiptDate: '',
  },
  {
    nomenclatureId: 'nm-021',
    place: 'Холодильник Реагенты',
    lot: '300001-Х',
    quantity: 1,
    expiryDate: '2026-04-07',
    receiptDate: '',
  },
  {
    nomenclatureId: 'nm-009',
    place: 'CNC',
    lot: '200093-C',
    quantity: 1,
    expiryDate: '2024-01-09',
    receiptDate: '',
  },
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
  const byNom = new Map<string, StockLine[]>()
  for (const line of MOCK_STOCK_LINES) {
    const list = byNom.get(line.nomenclatureId) ?? []
    list.push(line)
    byNom.set(line.nomenclatureId, list)
  }

  const rows: BalanceRow[] = []
  for (const item of MOCK_CATALOG) {
    const lines = byNom.get(item.id) ?? []
    const totalQty = lines.reduce((s, l) => s + l.quantity, 0)
    const expiryDates = uniqueSortedDates(
      lines.filter((l) => l.quantity > 0).map((l) => l.expiryDate),
    )
    const places = uniqueSortedStrings(
      lines.filter((l) => l.quantity > 0).map((l) => l.place),
    )
    rows.push({
      nomenclatureId: item.id,
      name: item.name,
      catalogNumber: item.catalogNumber,
      group: item.group,
      totalQty,
      expiryDates,
      places,
    })
  }
  return rows
}

export function getAllStoragePlaces(): string[] {
  return uniqueSortedStrings(MOCK_STOCK_LINES.map((l) => l.place))
}

/** Остатки по месту (только qty &gt; 0), для подбора лота при перемещении. */
export type StockAtPlace = StockLine & { nomenclatureName: string }

export function getPositiveStockAtPlace(place: string): StockAtPlace[] {
  return MOCK_STOCK_LINES.filter((l) => l.place === place && l.quantity > 0).map(
    (l) => ({
      ...l,
      nomenclatureName:
        catalogById.get(l.nomenclatureId)?.name ?? l.nomenclatureId,
    }),
  )
}

export const ALL_GROUPS: NomenclatureGroup[] = [
  'Пластик',
  'Пуповинная кровь',
  'Расходные материалы',
  'Химия',
]

export function formatRuDate(iso: string): string {
  const [y, m, d] = iso.split('-')
  if (!y || !m || !d) return iso
  return `${d}.${m}.${y}`
}

export function isOverdue(isoDate: string, now: Date): boolean {
  const t = new Date(isoDate + 'T23:59:59')
  return t.getTime() < now.getTime()
}
