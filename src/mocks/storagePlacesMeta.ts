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
