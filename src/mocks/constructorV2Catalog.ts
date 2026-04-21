export type ConsumableCatalogItem = {
  id: string;
  name: string;
};

export type EquipmentCatalogItem = {
  id: string;
  name: string;
};

/**
 * Справочник расходных материалов для конструктора ver2 (моки).
 * Используется при настройке действий в производстве.
 */
export const ACTION_CONSUMABLE_CATALOG: ConsumableCatalogItem[] = [
  { id: "c-tubes50", name: "Пробирки 50 мл" },
  { id: "c-pip5", name: "Пипетки 5 мл" },
  { id: "c-pip10", name: "Пипетки 10 мл" },
  { id: "c-pip25", name: "Пипетки 25 мл" },
  { id: "c-labels", name: "Термоэтикетки" },
  { id: "c-epp", name: "Пробирки Эппендорф" },
  { id: "c-syr20", name: "Шприцы 20 мл" },
  { id: "c-scalpel", name: "Скальпель" },
  { id: "c-aero", name: "Флаконы для бак. посева на аэробы" },
  { id: "c-ana", name: "Флаконы для бак. посева на анаэробы" },
];

/**
 * Справочник оборудования для конструктора ver2 (моки).
 * Используется при настройке шагов в производстве.
 */
export const STEP_EQUIPMENT_CATALOG: EquipmentCatalogItem[] = [
  { id: "e-laminar", name: "Ламинарный шкаф" },
  { id: "e-centrifuge", name: "Центрифуга" },
  { id: "e-strip", name: "Стриппетер" },
];

