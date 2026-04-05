/**
 * Настройки мест хранения для UI (мок).
 * «Списывать при перемещении» — при проведении перемещения *в* это место
 * перенесённый товар автоматически списывается (например зона расхода CNC/CMC).
 */

const WRITE_OFF_ON_TRANSFER_TO: ReadonlySet<string> = new Set(['CNC'])

export function writesOffOnTransferTo(placeName: string): boolean {
  return WRITE_OFF_ON_TRANSFER_TO.has(placeName)
}

/** Короткая подпись для таблиц и бейджей. */
export const WRITE_OFF_BADGE_LABEL = 'Автоматическое списание'

/**
 * «Зона карантина» — место, куда размещаются товары, ожидающие проверки качества.
 * В системе одна зона карантина.
 */
const QUARANTINE_ZONES: ReadonlySet<string> = new Set(['Карантин'])

export function isQuarantineZone(placeName: string): boolean {
  return QUARANTINE_ZONES.has(placeName)
}

/** Полный список всех мест хранения с их свойствами. */
export interface StoragePlaceMeta {
  name: string
  writeOffOnTransfer: boolean
  quarantineZone: boolean
}

export const ALL_STORAGE_PLACES_META: StoragePlaceMeta[] = [
  { name: 'Склад БМКП', writeOffOnTransfer: false, quarantineZone: false },
  { name: 'Лаборатория', writeOffOnTransfer: false, quarantineZone: false },
  { name: 'Криокамера', writeOffOnTransfer: false, quarantineZone: false },
  { name: 'Чистая зона', writeOffOnTransfer: false, quarantineZone: false },
  { name: 'CNC', writeOffOnTransfer: true, quarantineZone: false },
  { name: 'Холодильник Реагенты', writeOffOnTransfer: false, quarantineZone: false },
  { name: 'Карантин', writeOffOnTransfer: false, quarantineZone: true },
]
