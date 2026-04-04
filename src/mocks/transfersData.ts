/** Документы внутреннего перемещения (мок, без бэкенда). */

export type TransferStatus = 'черновик' | 'проведено' | 'отменено'

export interface TransferLine {
  nomenclatureId: string
  nomenclatureName: string
  lot: string
  quantity: number
}

export interface TransferDocument {
  id: string
  number: string
  createdAt: string
  status: TransferStatus
  fromPlace: string
  toPlace: string
  /**
   * Зафиксировано при создании: место «куда» требует автосписания
   * перенесённого товара при проведении документа.
   */
  writeOffAtDestination: boolean
  /** Единственный ответственный (без пары подписантов). */
  executor: string
  comment: string
  lines: TransferLine[]
}

/** Большой набор для проверки UI журнала и фильтров. */
export const INITIAL_TRANSFERS: TransferDocument[] = [
  {
    id: 'tr-001',
    number: '1',
    createdAt: '2025-04-02T11:30:00',
    status: 'проведено',
    fromPlace: 'Склад БМКП',
    toPlace: 'Лаборатория',
    writeOffAtDestination: false,
    executor: 'Петров И.',
    comment: 'Пополнение рабочей зоны',
    lines: [
      {
        nomenclatureId: 'nm-001',
        nomenclatureName: 'CytoFlex Daily QC Fluorospheres',
        lot: '05ANAF',
        quantity: 1,
      },
    ],
  },
  {
    id: 'tr-002',
    number: '2',
    createdAt: '2025-04-03T09:15:00',
    status: 'черновик',
    fromPlace: 'Склад БМКП',
    toPlace: 'CNC',
    writeOffAtDestination: true,
    executor: 'Смирнова А.',
    comment: '',
    lines: [
      {
        nomenclatureId: 'nm-005',
        nomenclatureName: 'CD14-Krome Orange (0,5 мл)',
        lot: '200041',
        quantity: 1,
      },
    ],
  },
  {
    id: 'tr-003',
    number: '3',
    createdAt: '2025-03-28T16:00:00',
    status: 'отменено',
    fromPlace: 'Склад БМКП',
    toPlace: 'Лаборатория',
    writeOffAtDestination: false,
    executor: 'Иванова Е.',
    comment: 'Отмена: ошибка в заявке',
    lines: [
      {
        nomenclatureId: 'nm-003',
        nomenclatureName: 'Stem-Kit Reagents',
        lot: '200280',
        quantity: 1,
      },
    ],
  },
  {
    id: 'tr-004',
    number: '4',
    createdAt: '2025-04-01T08:20:00',
    status: 'проведено',
    fromPlace: 'Склад БМКП',
    toPlace: 'Чистая зона',
    writeOffAtDestination: false,
    executor: 'Козлов Д.',
    comment: '',
    lines: [
      {
        nomenclatureId: 'nm-007',
        nomenclatureName: 'CD19-Krome Orange (0,5 мл)',
        lot: '200044',
        quantity: 1,
      },
      {
        nomenclatureId: 'nm-009',
        nomenclatureName: 'CD34-APC-Alexa Fluor 750 (0,5 мл)',
        lot: '200093',
        quantity: 1,
      },
      {
        nomenclatureId: 'nm-011',
        nomenclatureName: 'CD73-PE (1 мл)',
        lot: '200026',
        quantity: 1,
      },
    ],
  },
  {
    id: 'tr-005',
    number: '5',
    createdAt: '2025-03-30T14:00:00',
    status: 'проведено',
    fromPlace: 'Лаборатория',
    toPlace: 'Склад БМКП',
    writeOffAtDestination: false,
    executor: 'Сидорова А.',
    comment: 'Возврат неиспользованного',
    lines: [
      {
        nomenclatureId: 'nm-013',
        nomenclatureName: 'CD90-FITC (2 мл)',
        lot: '200055',
        quantity: 1,
      },
    ],
  },
  {
    id: 'tr-006',
    number: '6',
    createdAt: '2025-03-27T10:45:00',
    status: 'проведено',
    fromPlace: 'Склад БМКП',
    toPlace: 'Лаборатория',
    writeOffAtDestination: false,
    executor: 'Орлов М.',
    comment: 'Для серии ПЦР',
    lines: [
      {
        nomenclatureId: 'nm-015',
        nomenclatureName: 'Anti-Hu CD105 APC (1 мл)',
        lot: '538620',
        quantity: 1,
      },
      {
        nomenclatureId: 'nm-017',
        nomenclatureName: 'CD45-PC5.5 (1 мл)',
        lot: '200516',
        quantity: 1,
      },
    ],
  },
  {
    id: 'tr-007',
    number: '7',
    createdAt: '2025-03-26T09:00:00',
    status: 'черновик',
    fromPlace: 'Склад БМКП',
    toPlace: 'CNC',
    writeOffAtDestination: true,
    executor: 'Петров И.',
    comment: 'Расход на фрезер',
    lines: [
      {
        nomenclatureId: 'nm-019',
        nomenclatureName: 'CD15-PE (2 мл)',
        lot: '200069',
        quantity: 1,
      },
    ],
  },
  {
    id: 'tr-008',
    number: '8',
    createdAt: '2025-03-25T16:30:00',
    status: 'проведено',
    fromPlace: 'Криокамера',
    toPlace: 'Чистая зона',
    writeOffAtDestination: false,
    executor: 'Иванова Е.',
    comment: '',
    lines: [
      {
        nomenclatureId: 'nm-002',
        nomenclatureName: 'DxFLEX Daily QC Fluorospheres (3 фл по 10 мл)',
        lot: '16ARJF',
        quantity: 1,
      },
    ],
  },
  {
    id: 'tr-009',
    number: '9',
    createdAt: '2025-03-24T11:10:00',
    status: 'проведено',
    fromPlace: 'Склад БМКП',
    toPlace: 'Лаборатория',
    writeOffAtDestination: false,
    executor: 'Смирнова А.',
    comment: '',
    lines: [
      {
        nomenclatureId: 'nm-006',
        nomenclatureName: 'CD14-Krome Orange (0,5 мл)',
        lot: '300004',
        quantity: 1,
      },
      {
        nomenclatureId: 'nm-008',
        nomenclatureName: 'CD19-Krome Orange (0,5 мл)',
        lot: '300001',
        quantity: 1,
      },
      {
        nomenclatureId: 'nm-010',
        nomenclatureName: 'CD34-APC-Alexa Fluor 750 (0,5 мл)',
        lot: '300010',
        quantity: 1,
      },
      {
        nomenclatureId: 'nm-012',
        nomenclatureName: 'CD73-PE (1 мл)',
        lot: '300008',
        quantity: 1,
      },
    ],
  },
  {
    id: 'tr-010',
    number: '10',
    createdAt: '2025-03-23T08:00:00',
    status: 'отменено',
    fromPlace: 'Склад БМКП',
    toPlace: 'CNC',
    writeOffAtDestination: true,
    executor: 'Козлов Д.',
    comment: 'Дубль заявки',
    lines: [
      {
        nomenclatureId: 'nm-014',
        nomenclatureName: 'CD90-FITC (2 мл)',
        lot: '300003',
        quantity: 1,
      },
    ],
  },
  {
    id: 'tr-011',
    number: '11',
    createdAt: '2025-03-22T13:20:00',
    status: 'проведено',
    fromPlace: 'Чистая зона',
    toPlace: 'Лаборатория',
    writeOffAtDestination: false,
    executor: 'Сидорова А.',
    comment: '',
    lines: [
      {
        nomenclatureId: 'nm-016',
        nomenclatureName: 'Anti-Hu CD105 APC (1 мл)',
        lot: '548442',
        quantity: 1,
      },
    ],
  },
  {
    id: 'tr-012',
    number: '12',
    createdAt: '2025-03-21T15:45:00',
    status: 'черновик',
    fromPlace: 'Склад БМКП',
    toPlace: 'Лаборатория',
    writeOffAtDestination: false,
    executor: 'Орлов М.',
    comment: 'Срочно',
    lines: [
      {
        nomenclatureId: 'nm-018',
        nomenclatureName: 'CD45-PC5.5 (1 мл)',
        lot: '300007',
        quantity: 1,
      },
      {
        nomenclatureId: 'nm-020',
        nomenclatureName: 'CD15-PE (2 мл)',
        lot: '300005',
        quantity: 1,
      },
    ],
  },
  {
    id: 'tr-013',
    number: '13',
    createdAt: '2025-03-20T10:00:00',
    status: 'проведено',
    fromPlace: 'Лаборатория',
    toPlace: 'Холодильник Реагенты',
    writeOffAtDestination: false,
    executor: 'Петров И.',
    comment: 'Возврат в холодильник',
    lines: [
      {
        nomenclatureId: 'nm-021',
        nomenclatureName: 'Anti-HLA-DR-PC7 (0,5 мл)',
        lot: '300001',
        quantity: 1,
      },
    ],
  },
  {
    id: 'tr-014',
    number: '14',
    createdAt: '2025-03-19T12:00:00',
    status: 'проведено',
    fromPlace: 'Склад БМКП',
    toPlace: 'Чистая зона',
    writeOffAtDestination: false,
    executor: 'Иванова Е.',
    comment: '',
    lines: [
      {
        nomenclatureId: 'nm-022',
        nomenclatureName: 'CD45-Pacific Blue (1 мл)',
        lot: '300004',
        quantity: 1,
      },
    ],
  },
]
