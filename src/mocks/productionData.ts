/** Моки и типы для модуля «Производство». */

export type Role = string;

export type StageType =
  | "registration"
  | "production"
  | "quality_control"
  | "release";

export type FieldType =
  | "number"
  | "text"
  | "checkbox"
  | "select"
  | "date"
  | "section_header";

export type ComputeRule = "age_from_date";

export interface ConsumableItem {
  id: string;
  name: string;
  unit: string;
}

export interface EquipmentItem {
  id: string;
  name: string;
}

/** Допустимый диапазон для числового показателя (например КК). */
export interface FieldReferenceRange {
  min?: number;
  max?: number;
}

export interface FieldDefinition {
  id: string;
  label: string;
  type: FieldType;
  unit?: string;
  required: boolean;
  options?: string[];
  placeholder?: string;
  /** Многострочное поле (textarea) для типа text. */
  multiline?: boolean;
  /** Для `number`: референсный интервал (подсветка отклонений в UI КК). */
  referenceRange?: FieldReferenceRange;
  computedFrom?: string;
  computeRule?: ComputeRule;
  refStageIndex?: number;
  refFieldId?: string;
  refDeviations?: number[];
  sopRef?: string;
  sopFileName?: string;
}

export interface StepTemplate {
  id: string;
  name: string;
  fields: FieldDefinition[];
  consumables: ConsumableItem[];
  equipment: EquipmentItem[];
  hasDeviations: boolean;
}

export interface StageTemplate {
  id: string;
  name: string;
  type: StageType;
  allowedRoles: Role[];
  steps: StepTemplate[];
}

export interface ProcessTemplate {
  id: string;
  name: string;
  stages: StageTemplate[];
}

export type ProductionOrderStatus = "in_progress" | "completed" | "rejected";
export type ExecutionStatus = "pending" | "in_progress" | "completed";

/** Этап процесса, на котором зафиксирован брак (для учёта и отчётности). */
export type ProductionRejectionPhase =
  | "incoming_material"
  | "production"
  | "quality_control"
  | "logistics";

/** Подписи совпадают с этапами шаблона (registration / production / QC / release). */
export const PRODUCTION_REJECTION_PHASE_LABELS: Record<
  ProductionRejectionPhase,
  string
> = {
  incoming_material: "Регистрация биоматериала",
  production: "Производство",
  quality_control: "Контроль качества",
  logistics: "Выдача",
};

export interface ProductionRejectionAttachment {
  id: string;
  fileName: string;
  mimeType: string;
  dataUrl: string;
}

export type FieldValue = string | number | boolean | null;

export interface StepExecution {
  stepTemplateId: string;
  name: string;
  status: ExecutionStatus;
  fieldValues: Record<string, FieldValue>;
  consumableValues: Record<string, number>;
  equipmentValues: Record<string, boolean>;
  deviationFlag: boolean | null;
  deviationNotes: string;
  completedAt?: string;
  completedBy?: string;
  updatedAt?: string;
  updatedBy?: string;
  version?: number;
}

export interface StageExecution {
  stageTemplateId: string;
  name: string;
  type: StageType;
  status: ExecutionStatus;
  deferred?: boolean;
  deferredAt?: string;
  deferredBy?: string;
  deferredReason?: string;
  completedAt?: string;
  completedBy?: string;
  steps: StepExecution[];
}

export interface ProductionOrder {
  id: string;
  templateId: string;
  templateName: string;
  status: ProductionOrderStatus;
  currentStageIndex: number;
  createdAt: string;
  createdBy: string;
  completedAt?: string;
  rejectedAt?: string;
  rejectedBy?: string;
  rejectedReason?: string;
  rejectedPhase?: ProductionRejectionPhase;
  rejectedAttachments?: ProductionRejectionAttachment[];
  rejectedStageIndex?: number;
  rejectedStepTemplateId?: string;
  stages: StageExecution[];
}

const CURRENT_USER = "Смирнова А.";

function emptyStepExecution(step: StepTemplate): StepExecution {
  const fieldValues: Record<string, FieldValue> = {};
  for (const f of step.fields) {
    if (f.type === "section_header") continue;
    fieldValues[f.id] = null;
  }

  const consumableValues: Record<string, number> = {};
  for (const c of step.consumables) consumableValues[c.id] = 0;

  const equipmentValues: Record<string, boolean> = {};
  for (const e of step.equipment) equipmentValues[e.id] = false;

  return {
    stepTemplateId: step.id,
    name: step.name,
    status: "pending",
    fieldValues,
    consumableValues,
    equipmentValues,
    deviationFlag: null,
    deviationNotes: "",
    version: 1,
  };
}

export function buildOrderFromTemplate(
  template: ProcessTemplate,
  input?: { id?: string; createdBy?: string; createdAt?: string },
): ProductionOrder {
  const now = input?.createdAt ?? new Date().toISOString();
  const createdBy = input?.createdBy ?? CURRENT_USER;

  const stages: StageExecution[] = template.stages.map((stage, stageIndex) => ({
    stageTemplateId: stage.id,
    name: stage.name,
    type: stage.type,
    status: stageIndex === 0 ? "in_progress" : "pending",
    steps: stage.steps.map(emptyStepExecution),
  }));

  return {
    id: input?.id ?? `po-${Date.now()}`,
    templateId: template.id,
    templateName: template.name,
    status: "in_progress",
    currentStageIndex: 0,
    createdAt: now,
    createdBy,
    stages,
  };
}

function seedRegistrationFioIb(
  order: ProductionOrder,
  fio: string,
  ib: string,
): void {
  const reg = order.stages.find((s) => s.type === "registration");
  const step = reg?.steps[0];
  if (!step) return;
  step.fieldValues.fio = fio;
  step.fieldValues.ib = ib;
}

/** Фиксированные референсы для числовых полей КК (шаблон «Тромбогель»). */
const THROMBOGEL_QC_REFS: {
  pltWhole: FieldReferenceRange;
  wbcWhole: FieldReferenceRange;
  rbcWhole: FieldReferenceRange;
  hbWhole: FieldReferenceRange;
  pltPrp: FieldReferenceRange;
  wbcPrp: FieldReferenceRange;
  rbcPrp: FieldReferenceRange;
  hbPrp: FieldReferenceRange;
} = {
  pltWhole: { min: 150, max: 450 },
  wbcWhole: { min: 4.0, max: 10.0 },
  rbcWhole: { min: 3.8, max: 5.5 },
  hbWhole: { min: 120, max: 160 },
  pltPrp: { min: 800, max: 1800 },
  wbcPrp: { min: 0.5, max: 8.0 },
  rbcPrp: { min: 0, max: 0.5 },
  hbPrp: { min: 0, max: 8 },
};

export const THROMBOGEL_TEMPLATE: ProcessTemplate = {
  id: "tpl-thrombogel",
  name: "Тромбогель",
  stages: [
    {
      id: "stg-reg",
      name: "Регистрация биоматериала",
      type: "registration",
      allowedRoles: [],
      steps: [
        {
          id: "step-reg-1",
          name: "1. Регистрация",
          hasDeviations: true,
          consumables: [],
          equipment: [],
          fields: [
            { id: "sec-common", label: "Общие данные", type: "section_header", required: false },
            { id: "seq", label: "Порядковый номер", type: "number", required: false },
            { id: "fio", label: "ФИО", type: "text", required: true, placeholder: "Введите ФИО" },
            { id: "dob", label: "Дата рождения", type: "date", required: true },
            {
              id: "age",
              label: "Возраст",
              type: "number",
              required: false,
              computedFrom: "dob",
              computeRule: "age_from_date",
            },
            {
              id: "department",
              label: "Отделение",
              type: "select",
              required: false,
              options: ["Хирургия", "Терапия", "Травматология"],
            },
            { id: "ib", label: "N ИБ", type: "text", required: false },
            { id: "diagnosis", label: "Диагноз", type: "text", required: false },
            { id: "productId", label: "ID продукта", type: "text", required: false },
            { id: "executor", label: "ФИО исполнителя", type: "text", required: false },

            {
              id: "sec-blood",
              label: "Забор крови",
              type: "section_header",
              required: false,
              sopRef: "СОП 2.1.1",
              sopFileName: "SOP_2.1.1_zabor_krovi.docx",
            },
            { id: "bloodVolume", label: "Объём забранной крови", type: "number", unit: "мл", required: false },
            {
              id: "containerType",
              label: "Тип контейнера",
              type: "select",
              required: false,
              options: ["гемакон", "пробирки"],
            },

            { id: "sec-qc", label: "Входной контроль качества", type: "section_header", required: false },
            {
              id: "integrity",
              label: "Целостность",
              type: "select",
              required: false,
              options: ["не нарушена", "нарушена"],
            },
            { id: "volumeOk", label: "Объём", type: "select", required: false, options: ["соответствует", "не соответствует"] },
            { id: "hemolysis", label: "Гемолиз", type: "select", required: false, options: ["нет", "да"] },
            {
              id: "assignedStatus",
              label: "Присвоен статус",
              type: "select",
              required: false,
              options: ["Разрешено", "Брак"],
            },

            { id: "sec-balance", label: "Материальный баланс", type: "section_header", required: false },
            { id: "syringe20", label: "Шприцы 20", type: "number", unit: "шт", required: false },
            { id: "syringe30", label: "Шприцы 30", type: "number", unit: "шт", required: false },
            { id: "hemacon", label: "Гемакон", type: "number", unit: "шт", required: false },
            { id: "gauze", label: "Стерильные марлевые салфетки", type: "number", unit: "шт", required: false },
            { id: "alcohol", label: "Спирт", type: "number", unit: "мл", required: false },
            { id: "citrate", label: "Цитрат Na", type: "number", unit: "мл", required: false },

            { id: "sec-dev", label: "Отклонения", type: "section_header", required: false },
            { id: "devFlag", label: "Отклонения", type: "select", required: false, options: ["Нет", "Да"] },
            { id: "devNotes", label: "Примечания", type: "text", required: false },
          ],
        },
      ],
    },
    {
      id: "stg-prod",
      name: "Производство",
      type: "production",
      allowedRoles: [],
      steps: [
        {
          id: "step-prod-1",
          name: "1. Получение обогащённой тромбоцитами плазмы",
          hasDeviations: true,
          fields: [
            { id: "centrifugation1", label: "Центрифугирование", type: "checkbox", required: false },
            { id: "plasmaToTubes", label: "Отбор плазмы в 50 мл пробирки", type: "checkbox", required: false },
            { id: "plasmaVolume", label: "Объём отобранной плазмы", type: "number", unit: "мл", required: false },
            { id: "centrifugation2", label: "Центрифугирование (повторное)", type: "checkbox", required: false },
            { id: "supernatant", label: "Отбор надосадочной плазмы", type: "checkbox", required: false },
            { id: "supernatantVolume", label: "Объём надосадочной плазмы", type: "number", unit: "мл", required: false },
          ],
          consumables: [
            { id: "c-tubes50", name: "Пробирки 50 мл", unit: "шт" },
            { id: "c-pip5", name: "Пипетки 5 мл", unit: "шт" },
            { id: "c-pip10", name: "Пипетки 10 мл", unit: "шт" },
            { id: "c-pip25", name: "Пипетки 25 мл", unit: "шт" },
            { id: "c-labels", name: "Термоэтикетки", unit: "шт" },
            { id: "c-epp", name: "Пробирки Эппендорф", unit: "шт" },
            { id: "c-syr20", name: "Шприцы 20 мл", unit: "шт" },
            { id: "c-scalpel", name: "Скальпель", unit: "шт" },
            { id: "c-aero", name: "Флаконы для бак. посева на аэробы", unit: "шт" },
            { id: "c-ana", name: "Флаконы для бак. посева на анаэробы", unit: "шт" },
          ],
          equipment: [
            { id: "e-laminar", name: "Ламинарный шкаф" },
            { id: "e-centrifuge", name: "Центрифуга" },
            { id: "e-strip", name: "Стриппетер" },
          ],
        },
        {
          id: "step-prod-2",
          name: "2. Получение тромбогеля",
          hasDeviations: true,
          fields: [
            { id: "resusp", label: "Ресуспендирование осадка", type: "checkbox", required: false },
            { id: "resuspVol", label: "Объём ресуспендирования", type: "number", unit: "мл", required: false },
            { id: "marking", label: "Маркировка", type: "checkbox", required: false },
            { id: "bact", label: "Бакпосев", type: "checkbox", required: false },
            { id: "cbc", label: "ОАК", type: "checkbox", required: false },
            { id: "extra", label: "Дополнительные исследования", type: "text", required: false },
            { id: "quarantine", label: "Карантинное хранение", type: "checkbox", required: false },
            { id: "aliquots", label: "Количество аликвот", type: "number", unit: "шт", required: false },
          ],
          consumables: [],
          equipment: [],
        },
      ],
    },
    {
      id: "stg-qc",
      name: "Контроль качества",
      type: "quality_control",
      allowedRoles: [],
      steps: [
        {
          id: "step-qc-1",
          name: "1. Результаты контроля качества",
          hasDeviations: true,
          consumables: [],
          equipment: [],
          fields: [
            {
              id: "pltWhole",
              label: "Кол-во Тц в цельной крови",
              type: "number",
              unit: "10^9/л",
              required: false,
              referenceRange: THROMBOGEL_QC_REFS.pltWhole,
            },
            {
              id: "wbcWhole",
              label: "Кол-во Лц в цельной крови",
              type: "number",
              unit: "10^9/л",
              required: false,
              referenceRange: THROMBOGEL_QC_REFS.wbcWhole,
            },
            {
              id: "rbcWhole",
              label: "Кол-во Эр в цельной крови",
              type: "number",
              unit: "10^12/л",
              required: false,
              referenceRange: THROMBOGEL_QC_REFS.rbcWhole,
            },
            {
              id: "hbWhole",
              label: "Hb в цельной крови",
              type: "number",
              unit: "г/л",
              required: false,
              referenceRange: THROMBOGEL_QC_REFS.hbWhole,
            },
            {
              id: "pltPrp",
              label: "Кол-во Тц в PRP",
              type: "number",
              unit: "10^9/л",
              required: false,
              referenceRange: THROMBOGEL_QC_REFS.pltPrp,
            },
            {
              id: "wbcPrp",
              label: "Кол-во Лц в PRP",
              type: "number",
              unit: "10^9/л",
              required: false,
              referenceRange: THROMBOGEL_QC_REFS.wbcPrp,
            },
            {
              id: "rbcPrp",
              label: "Кол-во Эр в PRP",
              type: "number",
              unit: "10^12/л",
              required: false,
              referenceRange: THROMBOGEL_QC_REFS.rbcPrp,
            },
            {
              id: "hbPrp",
              label: "Hb в PRP",
              type: "number",
              unit: "г/л",
              required: false,
              referenceRange: THROMBOGEL_QC_REFS.hbPrp,
            },
            {
              id: "sterility",
              label: "Посев на стерильность",
              type: "select",
              required: false,
              options: ["стерильно", "нестерильно"],
            },
            { id: "extraQc", label: "Дополнительные показатели", type: "text", required: false },
            {
              id: "qcComment",
              label: "Комментарий",
              type: "text",
              required: false,
              multiline: true,
              placeholder: "При необходимости укажите комментарий…",
            },
          ],
        },
      ],
    },
    {
      id: "stg-release",
      name: "Выдача",
      type: "release",
      allowedRoles: [],
      steps: [
        {
          id: "step-release-1",
          name: "1. Выдача готового продукта",
          hasDeviations: true,
          consumables: [],
          equipment: [],
          fields: [
            { id: "productIdRef", label: "ID продукта", type: "text", required: false, refStageIndex: 0, refFieldId: "productId" },
            { id: "fioRef", label: "ФИО пациента", type: "text", required: false, refStageIndex: 0, refFieldId: "fio" },
            { id: "ibRef", label: "N ИБ", type: "text", required: false, refStageIndex: 0, refFieldId: "ib" },
            {
              id: "where",
              label: "Куда выдано",
              type: "select",
              required: true,
              options: ["Операционная", "Перевязочная", "Эндоскопический кабинет"],
            },
            {
              id: "devSummary",
              label: "Отклонения (сводка)",
              type: "text",
              required: false,
              refDeviations: [0],
            },
            {
              id: "processDoneBy",
              label: "Технологический процесс выполнил",
              type: "select",
              required: false,
              options: [CURRENT_USER, "Иванова Е.", "Петров С.", "Козлова М."],
            },
            {
              id: "approvedBy",
              label: "Одобрил",
              type: "select",
              required: false,
              options: [CURRENT_USER, "Иванова Е.", "Петров С.", "Козлова М."],
            },
          ],
        },
      ],
    },
  ],
};

export const INITIAL_PROCESS_TEMPLATES: ProcessTemplate[] = [THROMBOGEL_TEMPLATE];

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function mergeFieldDefinitions(
  storedFields: FieldDefinition[],
  baselineFields: FieldDefinition[],
): FieldDefinition[] {
  const merged = baselineFields.map((bf) => {
    const sf = storedFields.find((f) => f.id === bf.id);
    return sf ? ({ ...sf, ...bf } as FieldDefinition) : clone(bf);
  });
  const extra = storedFields.filter(
    (f) => !baselineFields.some((b) => b.id === f.id),
  );
  return [...merged, ...extra];
}

function mergeProductionSteps(
  storedSteps: StepTemplate[],
  baselineSteps: StepTemplate[],
): StepTemplate[] {
  return baselineSteps.map((bstep) => {
    const sstep = storedSteps.find((s) => s.id === bstep.id);
    if (!sstep) return clone(bstep);
    return {
      ...sstep,
      name: bstep.name,
      hasDeviations: bstep.hasDeviations,
      consumables: bstep.consumables,
      equipment: bstep.equipment,
      fields: mergeFieldDefinitions(sstep.fields, bstep.fields),
    };
  });
}

function mergeProductionStages(
  storedStages: StageTemplate[],
  baselineStages: StageTemplate[],
): StageTemplate[] {
  return baselineStages.map((bs) => {
    const ss = storedStages.find((s) => s.id === bs.id);
    if (!ss) return clone(bs);
    return {
      ...ss,
      name: bs.name,
      type: bs.type,
      allowedRoles: bs.allowedRoles,
      steps: mergeProductionSteps(ss.steps, bs.steps),
    };
  });
}

/**
 * Подмешивает актуальные определения полей из кода в шаблоны из localStorage
 * (новые свойства вроде `referenceRange` не пропадают после обновления прототипа).
 */
export function mergeProductionTemplatesWithBaseline(
  storedList: ProcessTemplate[],
  baselineList: ProcessTemplate[],
): ProcessTemplate[] {
  return baselineList.map((bt) => {
    const st = storedList.find((t) => t.id === bt.id);
    if (!st) return clone(bt);
    return {
      ...st,
      name: bt.name,
      stages: mergeProductionStages(st.stages, bt.stages),
    };
  });
}

export const INITIAL_PRODUCTION_ORDERS: ProductionOrder[] = (() => {
  const tpl = THROMBOGEL_TEMPLATE;

  const inProgress = buildOrderFromTemplate(tpl, {
    id: "po-001",
    createdAt: "2025-03-18T09:10:00.000Z",
    createdBy: "Иванова Е.",
  });
  seedRegistrationFioIb(inProgress, "Иванов Иван Иванович", "1290047");

  const completed = buildOrderFromTemplate(tpl, {
    id: "po-002",
    createdAt: "2025-03-05T08:00:00.000Z",
    createdBy: "Петров С.",
  });
  seedRegistrationFioIb(completed, "Петрова Анна Николаевна", "5567823");
  completed.status = "completed";
  completed.completedAt = "2025-03-05T16:20:00.000Z";
  completed.currentStageIndex = tpl.stages.length - 1;
  for (const st of completed.stages) {
    st.status = "completed";
    for (const step of st.steps) {
      step.status = "completed";
      step.completedAt = completed.completedAt;
      step.completedBy = completed.createdBy;
    }
  }

  const rejected = buildOrderFromTemplate(tpl, {
    id: "po-003",
    createdAt: "2025-03-12T10:45:00.000Z",
    createdBy: "Иванова Е.",
  });
  seedRegistrationFioIb(rejected, "Сидоренко Олег Павлович", "3409128");
  rejected.status = "rejected";
  rejected.rejectedAt = "2025-03-12T11:05:00.000Z";
  rejected.rejectedBy = "Иванова Е.";
  rejected.rejectedReason = "Гемолиз образца при входном контроле";
  rejected.rejectedPhase = "incoming_material";
  rejected.rejectedAttachments = [];
  rejected.rejectedStageIndex = 0;
  rejected.rejectedStepTemplateId = "step-reg-1";
  rejected.currentStageIndex = 0;
  rejected.stages[0]!.status = "in_progress";

  const qcDeferred = buildOrderFromTemplate(tpl, {
    id: "po-004",
    createdAt: "2025-03-22T07:30:00.000Z",
    createdBy: "Козлова М.",
  });
  seedRegistrationFioIb(qcDeferred, "Волкова Татьяна Игоревна", "9012345");
  qcDeferred.currentStageIndex = 2;
  qcDeferred.stages[0]!.status = "completed";
  qcDeferred.stages[0]!.completedAt = "2025-03-22T09:00:00.000Z";
  qcDeferred.stages[0]!.completedBy = qcDeferred.createdBy;
  for (const step of qcDeferred.stages[0]!.steps) {
    step.status = "completed";
    step.completedAt = qcDeferred.stages[0]!.completedAt;
    step.completedBy = qcDeferred.createdBy;
  }
  qcDeferred.stages[1]!.status = "completed";
  qcDeferred.stages[1]!.completedAt = "2025-03-22T11:30:00.000Z";
  qcDeferred.stages[1]!.completedBy = "Сидоров В.";
  for (const step of qcDeferred.stages[1]!.steps) {
    step.status = "completed";
    step.completedAt = qcDeferred.stages[1]!.completedAt;
    step.completedBy = qcDeferred.stages[1]!.completedBy;
  }
  qcDeferred.stages[2]!.status = "in_progress";
  qcDeferred.stages[2]!.deferred = true;
  qcDeferred.stages[2]!.deferredAt = "2025-03-22T12:00:00.000Z";
  qcDeferred.stages[2]!.deferredBy = "Сидоров В.";
  qcDeferred.stages[2]!.deferredReason = "Ожидание результатов посева";

  return [inProgress, completed, rejected, qcDeferred].map(clone);
})();

