/** Моки и типы для модуля «Производство». */

import thrombogelNewSeed from "./thrombogelNewSeed.json";

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
  isSystem?: boolean;
  unit?: string;
  required: boolean;
  /** Сортировка (порядок отображения в таблицах). */
  sortOrder?: number;
  options?: string[];
  placeholder?: string;
  /** Многострочное поле (textarea) для типа text. */
  multiline?: boolean;
  /** Для `number`: референсный интервал (подсветка отклонений в UI КК). */
  referenceRange?: FieldReferenceRange;
  /** Для `select`: "нормальное" (эталонное) значение. */
  referenceValue?: string;
  computedFrom?: string;
  computeRule?: ComputeRule;
  refStageIndex?: number;
  refFieldId?: string;
  refDeviations?: number[];
  sopRef?: string;
  sopFileName?: string;
}

export interface StepFieldGroup {
  id: string;
  name: string;
  fields: FieldDefinition[];
}

export interface SopAction {
  id: string;
  title: string;
  description: string;
  doneFieldId: string;
  groups: StepFieldGroup[];
}

export interface StepGroupTemplate {
  id: string;
  name: string;
  /** PDF-вложение группы (хранится как data URL в localStorage прототипа). */
  attachmentPdf?: { fileName: string; dataUrl: string };
  /** Элементы формы внутри группы (для конструктора). */
  fields: FieldDefinition[];
}

export interface StepActionTemplate {
  id: string;
  text: string;
  /** Конструктор ver2: обязательность отметки «выполнено». */
  required?: boolean;
  /** Опциональное поле ввода у действия (число/текст). */
  input?: { label: string; type: "text" | "number" };
}

export interface StepTemplate {
  id: string;
  name: string;
  /** Ссылка на документ шага (как у section_header в форме): открывается в новой вкладке. */
  sopRef?: string;
  sopFileName?: string;
  /** PDF-вложение шага (хранится как data URL в localStorage прототипа). */
  attachmentPdf?: { fileName: string; dataUrl: string };
  groups?: StepGroupTemplate[];
  actions?: StepActionTemplate[];
  sopActions?: SopAction[];
  fields: FieldDefinition[];
  consumables: ConsumableItem[];
  equipment: EquipmentItem[];
  hasDeviations: boolean;
}

export interface StageTemplate {
  id: string;
  name: string;
  type: StageType;
  isSystem?: boolean;
  isSopStage?: boolean;
  allowedRoles: Role[];
  steps: StepTemplate[];
}

export interface ProcessTemplate {
  id: string;
  name: string;
  /** ISO datetime when archived. Archived templates are read-only and hidden from "start production" chooser. */
  archivedAt?: string;
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
  /** Этап «Выдача»: одобрение технологического процесса (кнопка, ФИО из профиля). */
  techProcessApprovedAt?: string;
  techProcessApprovedBy?: string;
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

export type SystemFieldRegistry = {
  version: number;
  registration: FieldDefinition[];
  release: FieldDefinition[];
};

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

/**
 * Шаблон «Тромбогель NEW» из конструктора ver2: тело в `thrombogelNewSeed.json`
 * (экспорт из localStorage). После очистки storage подставляется с id `tpl-thrombogel-new`.
 */
export const THROMBOGEL_NEW_TEMPLATE: ProcessTemplate =
  thrombogelNewSeed as ProcessTemplate;

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function toSystemFields(fields: FieldDefinition[]): FieldDefinition[] {
  return fields.map((f) => ({ ...clone(f), isSystem: true }));
}

function getTemplateStage(
  template: ProcessTemplate,
  type: StageType,
): StageTemplate | undefined {
  return template.stages.find((s) => s.type === type);
}

export const DEFAULT_SYSTEM_FIELD_REGISTRY: SystemFieldRegistry = (() => {
  const regFields = getTemplateStage(THROMBOGEL_NEW_TEMPLATE, "registration")
    ?.steps[0]
    ?.fields;
  const relFields = getTemplateStage(THROMBOGEL_NEW_TEMPLATE, "release")?.steps[0]
    ?.fields;
  return {
    version: 1,
    registration: toSystemFields(regFields ?? []),
    release: toSystemFields(relFields ?? []),
  };
})();

function defaultStageName(type: StageType): string {
  if (type === "registration") return "Регистрация биоматериала";
  if (type === "production") return "Производство";
  if (type === "quality_control") return "Контроль качества";
  return "Выдача";
}

function makeStageStep(
  stageType: StageType,
  systemFields: FieldDefinition[],
): StepTemplate {
  return {
    id: `step-${stageType}-1`,
    name: "Шаг 1",
    sopFileName: undefined,
    sopActions: [],
    fields: clone(systemFields),
    consumables: [],
    equipment: [],
    hasDeviations: true,
  };
}

export function createTemplateWithSystemStages(
  input: {
    id: string;
    name: string;
    systemFieldRegistry?: SystemFieldRegistry;
  },
): ProcessTemplate {
  const system = input.systemFieldRegistry ?? DEFAULT_SYSTEM_FIELD_REGISTRY;
  const stageTypes: StageType[] = [
    "registration",
    "production",
    "quality_control",
    "release",
  ];
  return {
    id: input.id,
    name: input.name,
    stages: stageTypes.map((type) => ({
      id: `stg-${type}`,
      name: defaultStageName(type),
      type,
      isSystem: true,
      isSopStage: true,
      allowedRoles: [],
      steps: [
        makeStageStep(
          type,
          type === "registration"
            ? system.registration
            : type === "release"
              ? system.release
              : [],
        ),
      ],
    })),
  };
}

export const INITIAL_PROCESS_TEMPLATES: ProcessTemplate[] = [
  THROMBOGEL_NEW_TEMPLATE,
];

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

/** Действия ver2: структура и id — из baseline; текст/обязательность/поле — из storage. Если в baseline нет действий — сбрасываем (иначе «лишние» actions из storage смешиваются с чек-листом по fields). */
function mergeStepActions(
  stored: StepActionTemplate[] | undefined,
  baseline: StepActionTemplate[] | undefined,
): StepActionTemplate[] | undefined {
  if (!baseline?.length) {
    return undefined;
  }
  return baseline.map((ba) => {
    const sa = stored?.find((a) => a.id === ba.id);
    if (!sa) return clone(ba);
    return {
      id: ba.id,
      text: sa.text?.trim() ? sa.text : ba.text,
      required: sa.required !== undefined ? sa.required : ba.required,
      input: sa.input !== undefined ? sa.input : ba.input,
    };
  });
}

function mergeOneStepWithBaseline(
  sstep: StepTemplate,
  bstep: StepTemplate,
): StepTemplate {
  return {
    ...sstep,
    name:
      typeof sstep.name === "string" && sstep.name.trim().length > 0
        ? sstep.name
        : bstep.name,
    sopRef: bstep.sopRef,
    sopFileName: bstep.sopFileName,
    hasDeviations: bstep.hasDeviations,
    consumables: clone(sstep.consumables ?? bstep.consumables),
    equipment: clone(sstep.equipment ?? bstep.equipment),
    fields: mergeFieldDefinitions(sstep.fields, bstep.fields),
    actions: mergeStepActions(sstep.actions, bstep.actions),
    groups: !bstep.groups?.length
      ? undefined
      : sstep.groups?.length
        ? sstep.groups
        : clone(bstep.groups),
  };
}

function mergeProductionSteps(
  storedSteps: StepTemplate[] | undefined,
  baselineSteps: StepTemplate[],
): StepTemplate[] {
  // Нет шагов в storage (старые данные / не инициализировано) — эталон из кода.
  if (storedSteps == null) {
    return baselineSteps.map((b) => clone(b));
  }
  // Порядок и набор шагов — из storage; иначе удалённые в конструкторе шаги снова подмешиваются из baseline.
  return storedSteps.map((sstep) => {
    const bstep = baselineSteps.find((b) => b.id === sstep.id);
    if (!bstep) return clone(sstep);
    return mergeOneStepWithBaseline(sstep, bstep);
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
      isSopStage: bs.isSopStage,
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
  const mergedBaseline = baselineList.map((bt) => {
    const st = storedList.find((t) => t.id === bt.id);
    if (!st) return clone(bt);
    return {
      ...st,
      name:
        typeof st.name === "string" && st.name.trim().length > 0
          ? st.name
          : bt.name,
      stages: mergeProductionStages(st.stages, bt.stages),
    };
  });

  // Keep user-created templates that are not part of baseline seeds.
  const extraStored = storedList.filter(
    (st) => !baselineList.some((bt) => bt.id === st.id),
  );

  return reconcileRuntimeV2Templates([...mergedBaseline, ...clone(extraStored)]);
}

const RUNTIME_V2_PREFIX = "tpl-runtime-v2-";

/** Подтягивает этап «Производство» в runtime-шаблоне заказа ver2 из актуального исходного шаблона (после merge). */
export function reconcileRuntimeV2Templates(
  templates: ProcessTemplate[],
): ProcessTemplate[] {
  const byId = new Map(templates.map((t) => [t.id, t]));
  return templates.map((t) => {
    if (!t.id.startsWith(RUNTIME_V2_PREFIX)) return t;
    const sourceId = t.id.slice(RUNTIME_V2_PREFIX.length);
    const source = byId.get(sourceId);
    if (!source) return t;
    const prodStage = source.stages.find((s) => s.type === "production");
    if (!prodStage) return t;
    const prodClone = clone(prodStage);
    return {
      ...t,
      name: source.name,
      stages: t.stages.map((stage) =>
        stage.type === "production"
          ? { ...prodClone, id: stage.id, name: stage.name }
          : stage,
      ),
    };
  });
}

export const INITIAL_PRODUCTION_ORDERS: ProductionOrder[] = (() => {
  const tpl = THROMBOGEL_NEW_TEMPLATE;

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

  const atQualityControl = buildOrderFromTemplate(tpl, {
    id: "po-004",
    createdAt: "2025-03-22T07:30:00.000Z",
    createdBy: "Козлова М.",
  });
  seedRegistrationFioIb(atQualityControl, "Волкова Татьяна Игоревна", "9012345");
  atQualityControl.currentStageIndex = 2;
  atQualityControl.stages[0]!.status = "completed";
  atQualityControl.stages[0]!.completedAt = "2025-03-22T09:00:00.000Z";
  atQualityControl.stages[0]!.completedBy = atQualityControl.createdBy;
  for (const step of atQualityControl.stages[0]!.steps) {
    step.status = "completed";
    step.completedAt = atQualityControl.stages[0]!.completedAt;
    step.completedBy = atQualityControl.createdBy;
  }
  atQualityControl.stages[1]!.status = "completed";
  atQualityControl.stages[1]!.completedAt = "2025-03-22T11:30:00.000Z";
  atQualityControl.stages[1]!.completedBy = "Сидоров В.";
  for (const step of atQualityControl.stages[1]!.steps) {
    step.status = "completed";
    step.completedAt = atQualityControl.stages[1]!.completedAt;
    step.completedBy = atQualityControl.stages[1]!.completedBy;
  }
  atQualityControl.stages[2]!.status = "in_progress";

  return [inProgress, completed, rejected, atQualityControl].map(clone);
})();

