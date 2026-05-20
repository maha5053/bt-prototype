import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  type ConfigurableMaterialField,
  type ConfigurableMaterialFieldType,
  DEFAULT_MATERIAL_TYPE_SETTINGS,
  DEFAULT_SYSTEM_FIELD_REGISTRY,
  INITIAL_PROCESS_TEMPLATES,
  INITIAL_PRODUCTION_ORDERS,
  buildOrderFromTemplate,
  createTemplateWithSystemStages,
  mergeProductionTemplatesWithBaseline,
  reconcileRuntimeV2Templates,
  type ExecutionStatus,
  type FieldValue,
  type MaterialTypeCode,
  type MaterialTypeSettings,
  type ProcessTemplate,
  type ProductionOrder,
  type ProductionOrderSettingsSnapshot,
  type ProductionOrderStatus,
  type ProductionRejectionAttachment,
  type ProductionRejectionPhase,
  type SystemFieldRegistry,
} from "../mocks/productionData";
import {
  getBaselineRegistrationStage,
  getBaselineReleaseStage,
  resolveQualityControlStageForV2Runtime,
} from "../lib/productionSystemStages";
import { isReleaseTechProcessApproved } from "../lib/productionReleaseAct";
import { PRODUCTION_STORAGE_KEY } from "../lib/productionStorageKey";

const PO_ORDER_ID_RE = /^po-?(\d+)$/i;

/** Next id NNN (min 3 digits via padStart). Supports legacy po-NNN too. */
function nextProductionOrderId(orders: ProductionOrder[]): string {
  let max = 0;
  for (const o of orders) {
    const m = PO_ORDER_ID_RE.exec(o.id);
    if (!m) continue;
    const n = Number.parseInt(m[1], 10);
    if (Number.isFinite(n)) max = Math.max(max, n);
  }
  const next = max + 1;
  return String(next).padStart(3, "0");
}

function normalizeOrderId(id: string): string {
  return id.replace(/^po-?/i, "");
}

function normalizeOrdersIds(orders: ProductionOrder[]): ProductionOrder[] {
  // Keep stable ordering; strip legacy prefix if present.
  return orders.map((o) => {
    const nextId = normalizeOrderId(o.id);
    return nextId === o.id ? o : { ...o, id: nextId };
  });
}

function formatIncomingSampleId(now: Date, seqInYear: number): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}${m}${d}-${String(seqInYear).padStart(3, "0")}`;
}

function nextIncomingSampleId(orders: ProductionOrder[], createdAtIso: string): string {
  const now = new Date(createdAtIso);
  let max = 0;
  for (const order of orders) {
    const regStage = order.stages.find((s) => s.type === "registration");
    const productId = regStage?.steps?.[0]?.fieldValues?.productId;
    if (typeof productId !== "string") continue;
    const match = /^\d{8}-(\d+)$/.exec(productId);
    if (!match) continue;
    const seq = Number.parseInt(match[1], 10);
    if (Number.isFinite(seq)) max = Math.max(max, seq);
  }
  return formatIncomingSampleId(now, max + 1);
}

function withIncomingSampleId(order: ProductionOrder, incomingId: string): ProductionOrder {
  const regIdx = order.stages.findIndex((s) => s.type === "registration");
  if (regIdx < 0) return order;
  const regStage = order.stages[regIdx];
  const step0 = regStage?.steps?.[0];
  if (!regStage || !step0) return order;
  const nextStages = [...order.stages];
  const nextSteps = [...regStage.steps];
  nextSteps[0] = {
    ...step0,
    fieldValues: { ...step0.fieldValues, productId: incomingId },
  };
  nextStages[regIdx] = { ...regStage, steps: nextSteps };
  return { ...order, stages: nextStages };
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function normalizeMaterialTypeCode(code: unknown): MaterialTypeCode {
  return code === "skin" ? "skin" : "blood";
}

function normalizeFieldOptions(options: unknown): string[] {
  if (!Array.isArray(options)) return [];
  const next: string[] = [];
  const seen = new Set<string>();
  for (const raw of options) {
    if (typeof raw !== "string") continue;
    const value = raw.trim();
    if (!value) continue;
    const key = value.toLocaleLowerCase("ru");
    if (seen.has(key)) continue;
    seen.add(key);
    next.push(value);
  }
  return next;
}

function normalizeFieldDefaultValue(input: {
  type: ConfigurableMaterialFieldType;
  value: unknown;
  options: string[];
}): FieldValue {
  if (input.type === "checkbox") {
    return typeof input.value === "boolean" ? input.value : false;
  }
  if (input.type === "number") {
    if (typeof input.value === "number" && Number.isFinite(input.value)) return input.value;
    if (typeof input.value === "string" && input.value.trim() !== "") {
      const parsed = Number(input.value);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  }
  if (input.type === "select") {
    if (typeof input.value !== "string") return null;
    const trimmed = input.value.trim();
    if (!trimmed) return null;
    return input.options.some((option) => option === trimmed) ? trimmed : null;
  }
  return typeof input.value === "string" ? input.value.trim() : "";
}

function normalizeFieldOkOption(input: {
  type: ConfigurableMaterialFieldType;
  okOption: unknown;
  options: string[];
}): string | undefined {
  if (input.type !== "select") return undefined;
  if (typeof input.okOption !== "string") return undefined;
  const trimmed = input.okOption.trim();
  if (!trimmed) return undefined;
  return input.options.some((option) => option === trimmed) ? trimmed : undefined;
}

function normalizeMaterialField(
  input: ConfigurableMaterialField,
  fallback: ConfigurableMaterialField,
): ConfigurableMaterialField {
  const type: ConfigurableMaterialFieldType =
    input.type === "number" ||
    input.type === "date" ||
    input.type === "checkbox" ||
    input.type === "select" ||
    input.type === "text"
      ? input.type
      : fallback.type;
  const options = type === "select" ? normalizeFieldOptions(input.options) : undefined;
  return {
    ...fallback,
    ...input,
    id: typeof input.id === "string" && input.id.trim() ? input.id.trim() : fallback.id,
    label:
      typeof input.label === "string" && input.label.trim() ? input.label.trim() : fallback.label,
    type,
    required: Boolean(input.required),
    options,
    unit: typeof input.unit === "string" ? input.unit.trim() : "",
    helpText: typeof input.helpText === "string" ? input.helpText.trim() : "",
    defaultValue: normalizeFieldDefaultValue({
      type,
      value: input.defaultValue,
      options: options ?? [],
    }),
    okOption: normalizeFieldOkOption({
      type,
      okOption: input.okOption,
      options: options ?? [],
    }),
  };
}

function normalizeMaterialFieldList(
  input: unknown,
  fallback: ConfigurableMaterialField[],
): ConfigurableMaterialField[] {
  if (!Array.isArray(input)) return clone(fallback);

  const stored = input.filter(
    (item): item is ConfigurableMaterialField => Boolean(item && typeof item === "object"),
  );
  if (!stored.length) return clone(fallback);

  const fallbackById = new Map(fallback.map((field) => [field.id, field]));
  const storedById = new Map<string, ConfigurableMaterialField>();
  for (const item of stored) {
    if (typeof item.id !== "string" || !item.id.trim()) continue;
    const id = item.id.trim();
    const base = fallbackById.get(id);
    storedById.set(id, normalizeMaterialField(item, base ?? item));
  }

  const merged: ConfigurableMaterialField[] = fallback.map((baseField) => {
    const found = storedById.get(baseField.id);
    return found ? normalizeMaterialField(found, baseField) : clone(baseField);
  });

  for (const item of stored) {
    if (typeof item.id !== "string" || !item.id.trim()) continue;
    const id = item.id.trim();
    if (fallbackById.has(id)) continue;
    merged.push(normalizeMaterialField(item, item));
  }

  return merged;
}

function normalizeSingleMaterialTypeSettings(
  input: MaterialTypeSettings,
  base: MaterialTypeSettings,
): MaterialTypeSettings {
  return {
    ...clone(base),
    ...input,
    code: base.code,
    label: base.label,
    collectionFields: normalizeMaterialFieldList(input.collectionFields, base.collectionFields),
    materialBalanceItems: Array.isArray(input.materialBalanceItems)
      ? clone(input.materialBalanceItems)
      : clone(base.materialBalanceItems),
    incomingControlFields: normalizeMaterialFieldList(
      input.incomingControlFields,
      base.incomingControlFields,
    ),
  };
}

function normalizeMaterialTypeSettings(
  stored: MaterialTypeSettings[] | undefined,
): MaterialTypeSettings[] {
  return DEFAULT_MATERIAL_TYPE_SETTINGS.map((base) => {
    const found = stored?.find((item) => item.code === base.code);
    if (!found) return clone(base);
    return normalizeSingleMaterialTypeSettings(found, base);
  });
}

function buildSettingsSnapshot(input: {
  template: ProcessTemplate;
  materialTypes: MaterialTypeSettings[];
}): ProductionOrderSettingsSnapshot {
  const materialTypeCode = normalizeMaterialTypeCode(input.template.materialTypeCode);
  const materialType =
    input.materialTypes.find((item) => item.code === materialTypeCode) ??
    DEFAULT_MATERIAL_TYPE_SETTINGS.find((item) => item.code === materialTypeCode) ??
    DEFAULT_MATERIAL_TYPE_SETTINGS[0]!;
  const normalizedMaterialType = normalizeSingleMaterialTypeSettings(
    materialType,
    DEFAULT_MATERIAL_TYPE_SETTINGS.find((item) => item.code === materialTypeCode) ??
      DEFAULT_MATERIAL_TYPE_SETTINGS[0]!,
  );
  return {
    product: {
      templateId: input.template.id,
      templateName: input.template.name,
      materialTypeCode,
    },
    materialType: clone(normalizedMaterialType),
    storage: null,
    registrationMaterialBalance: clone(normalizedMaterialType.materialBalanceItems ?? []),
  };
}

function loadFromStorage():
  | {
      templates: ProcessTemplate[];
      orders: ProductionOrder[];
      systemFieldRegistry?: SystemFieldRegistry;
      materialTypes?: MaterialTypeSettings[];
    }
  | null {
  try {
    const raw = localStorage.getItem(PRODUCTION_STORAGE_KEY);
    if (raw)
      return JSON.parse(raw) as {
        templates: ProcessTemplate[];
        orders: ProductionOrder[];
        systemFieldRegistry?: SystemFieldRegistry;
        materialTypes?: MaterialTypeSettings[];
      };
  } catch {
    /* ignore */
  }
  return null;
}

function saveToStorage(state: {
  templates: ProcessTemplate[];
  orders: ProductionOrder[];
  systemFieldRegistry: SystemFieldRegistry;
  materialTypes: MaterialTypeSettings[];
}) {
  try {
    localStorage.setItem(PRODUCTION_STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

export type UpdateFieldValueInput =
  | {
      orderId: string;
      stageIndex: number;
      stepIndex: number;
      updatedBy: string;
      fieldId: string;
      value: FieldValue;
    }
  | {
      orderId: string;
      stageIndex: number;
      stepIndex: number;
      updatedBy: string;
      consumableId: string;
      consumableQty: number | null;
    }
  | {
      orderId: string;
      stageIndex: number;
      stepIndex: number;
      updatedBy: string;
      equipmentId: string;
      equipmentApplied: boolean;
    };

type ProductionContextValue = {
  templates: ProcessTemplate[];
  orders: ProductionOrder[];
  systemFieldRegistry: SystemFieldRegistry;
  materialTypes: MaterialTypeSettings[];
  getOrderById: (orderId: string) => ProductionOrder | null;
  createTemplate: (name: string) => ProcessTemplate;
  updateTemplate: (template: ProcessTemplate) => void;
  deleteTemplate: (templateId: string) => boolean;
  archiveTemplate: (templateId: string) => boolean;
  updateMaterialTypeSettings: (settings: MaterialTypeSettings) => void;
  resetMaterialTypeSettings: () => void;
  createOrder: (templateId: string, createdBy: string) => ProductionOrder;
  createOrderFromConstructorV2: (input: {
    templateId: string;
    orderId: string;
    createdBy: string;
  }) => ProductionOrder;
  deleteOrder: (orderId: string) => boolean;
  updateFieldValue: (input: UpdateFieldValueInput) => void;
  approveReleaseTechProcess: (input: {
    orderId: string;
    stageIndex: number;
    stepIndex: number;
    approvedByDisplayName: string;
    updatedBy: string;
  }) => void;
  saveDraft: (input: {
    orderId: string;
    stageIndex: number;
    stepIndex: number;
    updatedBy: string;
  }) => { savedAt: string };
  completeStep: (input: {
    orderId: string;
    stageIndex: number;
    stepIndex: number;
    completedBy: string;
  }) => void;
  completeStage: (input: {
    orderId: string;
    stageIndex: number;
    completedBy: string;
  }) => void;
  completeOrder: (input: { orderId: string; completedBy: string }) => void;
  rejectOrder: (input: {
    orderId: string;
    rejectedBy: string;
    rejectedReason: string;
    rejectedPhase: ProductionRejectionPhase;
    rejectedAttachments?: ProductionRejectionAttachment[];
    rejectedStageIndex: number;
    rejectedStepTemplateId?: string;
  }) => void;
  updateRegistrationValues: (input: {
    orderId: string;
    registrationStageIndex: number;
    registrationStepIndex: number;
    patch: Record<string, FieldValue>;
    updatedBy: string;
  }) => void;
  setOrderStatus: (input: {
    orderId: string;
    status: ProductionOrderStatus;
    updatedBy: string;
  }) => void;
};

const ProductionContext = createContext<ProductionContextValue | null>(null);

export function ProductionProvider({ children }: { children: ReactNode }) {
  const [{ templates, orders, systemFieldRegistry, materialTypes }, setState] = useState<{
    templates: ProcessTemplate[];
    orders: ProductionOrder[];
    systemFieldRegistry: SystemFieldRegistry;
    materialTypes: MaterialTypeSettings[];
  }>(() => {
    const stored = loadFromStorage();
    if (!stored) {
      return {
        templates: [...INITIAL_PROCESS_TEMPLATES],
        orders: [...INITIAL_PRODUCTION_ORDERS],
        systemFieldRegistry: DEFAULT_SYSTEM_FIELD_REGISTRY,
        materialTypes: normalizeMaterialTypeSettings(undefined),
      };
    }
    const storedOrders =
      Array.isArray(stored.orders) && stored.orders.length > 0
        ? normalizeOrdersIds(stored.orders)
        : [...INITIAL_PRODUCTION_ORDERS];
    const merged = {
      templates: mergeProductionTemplatesWithBaseline(
        stored.templates,
        INITIAL_PROCESS_TEMPLATES,
      ),
      orders: storedOrders,
      systemFieldRegistry:
        stored.systemFieldRegistry ?? DEFAULT_SYSTEM_FIELD_REGISTRY,
      materialTypes: normalizeMaterialTypeSettings(stored.materialTypes),
    };
    saveToStorage(merged);
    return merged;
  });

  const getOrderById = useCallback(
    (orderId: string) => orders.find((o) => o.id === orderId) ?? null,
    [orders],
  );

  const updateMaterialTypeSettings = useCallback((settings: MaterialTypeSettings) => {
    setState((prev) => {
      const code = normalizeMaterialTypeCode(settings.code);
      const base =
        DEFAULT_MATERIAL_TYPE_SETTINGS.find((item) => item.code === code) ??
        DEFAULT_MATERIAL_TYPE_SETTINGS[0]!;
      const nextMaterialTypes = prev.materialTypes.map((item) =>
        item.code === code
          ? { ...normalizeSingleMaterialTypeSettings(settings, base), updatedAt: new Date().toISOString() }
          : item,
      );
      const next = { ...prev, materialTypes: nextMaterialTypes };
      saveToStorage(next);
      return next;
    });
  }, []);

  const resetMaterialTypeSettings = useCallback(() => {
    setState((prev) => {
      const next = {
        ...prev,
        materialTypes: normalizeMaterialTypeSettings(undefined),
      };
      saveToStorage(next);
      return next;
    });
  }, []);

  const createOrder = useCallback(
    (templateId: string, createdBy: string): ProductionOrder => {
      const activeTemplates = templates.filter((t) => !t.archivedAt);
      const template =
        activeTemplates.find((t) => t.id === templateId) ?? activeTemplates[0];
      if (!template) throw new Error("No production templates available");

      let created: ProductionOrder | undefined;
      setState((prev) => {
        const id = nextProductionOrderId(prev.orders);
        const createdAt = new Date().toISOString();
        const incomingId = nextIncomingSampleId(prev.orders, createdAt);
        const newOrder = buildOrderFromTemplate(template, {
          id,
          createdBy,
          createdAt,
          settingsSnapshot: buildSettingsSnapshot({
            template,
            materialTypes: prev.materialTypes,
          }),
        });
        const withId = withIncomingSampleId(newOrder, incomingId);
        created = withId;
        const next = { ...prev, orders: [withId, ...prev.orders] };
        saveToStorage(next);
        return next;
      });
      if (!created) throw new Error("Failed to create order");
      return created;
    },
    [materialTypes, templates],
  );

  const createOrderFromConstructorV2 = useCallback(
    (input: { templateId: string; orderId: string; createdBy: string }): ProductionOrder => {
      const { templateId, orderId, createdBy } = input;
      const snapshot = loadFromStorage();
      const mergedForSource =
        snapshot?.templates && snapshot.templates.length > 0
          ? mergeProductionTemplatesWithBaseline(
              snapshot.templates,
              INITIAL_PROCESS_TEMPLATES,
            )
          : templates;
      const materialTypesForSnapshot = normalizeMaterialTypeSettings(
        snapshot?.materialTypes ?? materialTypes,
      );
      const activeTemplates = mergedForSource.filter((t) => !t.archivedAt);
      const source =
        activeTemplates.find((t) => t.id === templateId) ?? null;
      if (!source) throw new Error("Template not found");

      const prodStage = source.stages.find((s) => s.type === "production") ?? null;
      const qcFromSource = source.stages.find((s) => s.type === "quality_control");
      const qcStage = resolveQualityControlStageForV2Runtime(qcFromSource);
      const runtimeTemplateId = `tpl-runtime-v2-${templateId}`;
      const runtimeTemplate: ProcessTemplate = {
        id: runtimeTemplateId,
        name: source.name,
        materialTypeCode: source.materialTypeCode ?? "blood",
        stages: [
          getBaselineRegistrationStage(),
          prodStage ? JSON.parse(JSON.stringify(prodStage)) : {
            id: "stg-prod",
            name: "Производство",
            type: "production",
            isSystem: true,
            isSopStage: true,
            allowedRoles: [],
            steps: [],
          },
          qcStage,
          getBaselineReleaseStage(),
        ],
      };

      let created: ProductionOrder | undefined;
      setState((prev) => {
        if (prev.orders.some((o) => o.id === orderId)) return prev;
        const createdAt = new Date().toISOString();
        const incomingId = nextIncomingSampleId(prev.orders, createdAt);
        const newOrder = buildOrderFromTemplate(runtimeTemplate, {
          id: orderId,
          createdBy,
          createdAt,
          settingsSnapshot: buildSettingsSnapshot({
            template: source,
            materialTypes: materialTypesForSnapshot,
          }),
        });
        const withId = withIncomingSampleId(newOrder, incomingId);
        created = withId;
        const hasRuntime = prev.templates.some((t) => t.id === runtimeTemplateId);
        const nextTemplates = hasRuntime
          ? prev.templates.map((t) => (t.id === runtimeTemplateId ? runtimeTemplate : t))
          : [runtimeTemplate, ...prev.templates];
        const next = { ...prev, templates: nextTemplates, orders: [withId, ...prev.orders] };
        saveToStorage(next);
        return next;
      });
      if (!created) throw new Error("Failed to create order");
      return created;
    },
    [materialTypes, templates],
  );

  const deleteOrder = useCallback((orderId: string): boolean => {
    let removed = false;
    setState((prev) => {
      const order = prev.orders.find((o) => o.id === orderId);
      if (!order) return prev;
      if (order.status !== "in_progress") return prev;
      const currentStage = order.stages[order.currentStageIndex];
      if (!currentStage || currentStage.type !== "registration") return prev;
      const nextOrders = prev.orders.filter((o) => o.id !== orderId);
      if (nextOrders.length === prev.orders.length) return prev;
      removed = true;
      const next = { ...prev, orders: nextOrders };
      saveToStorage(next);
      return next;
    });
    return removed;
  }, []);

  const createTemplate = useCallback(
    (name: string): ProcessTemplate => {
      const id = `tpl-${Date.now()}`;
      const safeName = name.trim() || "Новый шаблон";
      const fromStorage = loadFromStorage();
      const nextTemplate = createTemplateWithSystemStages({
        id,
        name: safeName,
        systemFieldRegistry:
          fromStorage?.systemFieldRegistry ?? DEFAULT_SYSTEM_FIELD_REGISTRY,
      });
      setState((prev) => {
        const next = { ...prev, templates: [nextTemplate, ...prev.templates] };
        saveToStorage(next);
        return next;
      });
      return nextTemplate;
    },
    [],
  );

  const updateTemplate = useCallback((template: ProcessTemplate) => {
    setState((prev) => {
      const current = prev.templates.find((t) => t.id === template.id);
      if (!current) return prev;
      if (current.id === "tpl-thrombogel") return prev;
      const isArchived = Boolean(current.archivedAt);
      const usedByOrder = prev.orders.some((o) => o.templateId === template.id);
      if (isArchived || usedByOrder) return prev;
      const nextTemplate = {
        ...template,
        materialTypeCode: normalizeMaterialTypeCode(template.materialTypeCode),
      };
      const next = {
        ...prev,
        templates: reconcileRuntimeV2Templates(
          prev.templates.map((t) =>
            t.id === template.id ? nextTemplate : t,
          ),
        ),
      };
      saveToStorage(next);
      return next;
    });
  }, []);

  const deleteTemplate = useCallback((templateId: string): boolean => {
    let removed = false;
    setState((prev) => {
      if (templateId === "tpl-thrombogel") return prev;
      const usedByOrder = prev.orders.some((o) => o.templateId === templateId);
      const isArchived = prev.templates.some((t) => t.id === templateId && t.archivedAt);
      if (usedByOrder || isArchived) return prev;
      const nextTemplates = prev.templates.filter((t) => t.id !== templateId);
      if (nextTemplates.length === prev.templates.length) return prev;
      removed = true;
      const next = { ...prev, templates: nextTemplates };
      saveToStorage(next);
      return next;
    });
    return removed;
  }, []);

  const archiveTemplate = useCallback((templateId: string): boolean => {
    let archived = false;
    const now = new Date().toISOString();
    setState((prev) => {
      if (templateId === "tpl-thrombogel") return prev;
      const target = prev.templates.find((t) => t.id === templateId);
      if (!target) return prev;
      if (target.archivedAt) return prev;
      archived = true;
      const next = {
        ...prev,
        templates: prev.templates.map((t) =>
          t.id === templateId ? { ...t, archivedAt: now } : t,
        ),
      };
      saveToStorage(next);
      return next;
    });
    return archived;
  }, []);

  const updateFieldValue = useCallback((input: UpdateFieldValueInput) => {
    const { orderId, stageIndex, stepIndex, updatedBy } = input;
    const now = new Date().toISOString();
    setState((prev) => {
      const nextOrders = prev.orders.map((o) => {
        if (o.id !== orderId) return o;
        if (o.status !== "in_progress") return o;
        const stage = o.stages[stageIndex];
        const step = stage?.steps[stepIndex];
        if (!stage || !step) return o;

        const nextStages = [...o.stages];
        const nextSteps = [...stage.steps];
        const nextStep = { ...step };

        if ("fieldId" in input) {
          nextStep.fieldValues = {
            ...nextStep.fieldValues,
            [input.fieldId]: input.value,
          };
        } else if ("consumableId" in input) {
          const qty =
            input.consumableQty == null
              ? null
              : Number.isFinite(input.consumableQty)
                ? Math.max(0, Math.floor(input.consumableQty))
                : null;
          nextStep.consumableValues = {
            ...(nextStep.consumableValues ?? {}),
            [input.consumableId]: qty,
          };
        } else {
          nextStep.equipmentValues = {
            ...(nextStep.equipmentValues ?? {}),
            [input.equipmentId]: input.equipmentApplied,
          };
        }

        nextStep.updatedAt = now;
        nextStep.updatedBy = updatedBy;
        nextStep.version = (nextStep.version ?? 1) + 1;
        nextSteps[stepIndex] = nextStep;
        nextStages[stageIndex] = { ...stage, steps: nextSteps };
        return { ...o, stages: nextStages };
      });
      const next = { ...prev, orders: nextOrders };
      saveToStorage(next);
      return next;
    });
  }, []);

  const approveReleaseTechProcess = useCallback(
    (input: {
      orderId: string;
      stageIndex: number;
      stepIndex: number;
      approvedByDisplayName: string;
      updatedBy: string;
    }) => {
      const now = new Date().toISOString();
      const name = input.approvedByDisplayName.trim();
      if (!name) return;
      setState((prev) => {
        const nextOrders = prev.orders.map((o) => {
          if (o.id !== input.orderId) return o;
          if (o.status !== "in_progress") return o;
          const stage = o.stages[input.stageIndex];
          const step = stage?.steps[input.stepIndex];
          if (!stage || stage.type !== "release" || !step) return o;
          if (step.techProcessApprovedAt) return o;

          const nextStages = [...o.stages];
          const nextSteps = [...stage.steps];
          nextSteps[input.stepIndex] = {
            ...step,
            techProcessApprovedAt: now,
            techProcessApprovedBy: name,
            updatedAt: now,
            updatedBy: input.updatedBy,
            version: (step.version ?? 1) + 1,
          };
          nextStages[input.stageIndex] = { ...stage, steps: nextSteps };
          return { ...o, stages: nextStages };
        });
        const next = { ...prev, orders: nextOrders };
        saveToStorage(next);
        return next;
      });
    },
    [],
  );

  const saveDraft = useCallback(
    (input: { orderId: string; stageIndex: number; stepIndex: number; updatedBy: string }): { savedAt: string } => {
      const savedAt = new Date().toISOString();
      setState((prev) => {
        const nextOrders = prev.orders.map((o) => {
          if (o.id !== input.orderId) return o;
          if (o.status !== "in_progress") return o;
          const stage = o.stages[input.stageIndex];
          const step = stage?.steps[input.stepIndex];
          if (!stage || !step) return o;

          const nextStages = [...o.stages];
          const nextSteps = [...stage.steps];
          nextSteps[input.stepIndex] = {
            ...step,
            updatedAt: savedAt,
            updatedBy: input.updatedBy,
          };
          nextStages[input.stageIndex] = { ...stage, steps: nextSteps };
          return { ...o, stages: nextStages };
        });
        const next = { ...prev, orders: nextOrders };
        saveToStorage(next);
        return next;
      });
      return { savedAt };
    },
    [],
  );

  const completeStep = useCallback(
    (input: { orderId: string; stageIndex: number; stepIndex: number; completedBy: string }) => {
      const now = new Date().toISOString();
      setState((prev) => {
        const nextOrders = prev.orders.map((o) => {
          if (o.id !== input.orderId) return o;
          if (o.status !== "in_progress") return o;
          const stage = o.stages[input.stageIndex];
          const step = stage?.steps[input.stepIndex];
          if (!stage || !step) return o;
          if (
            stage.type === "release" &&
            !isReleaseTechProcessApproved(step)
          ) {
            return o;
          }
          if (stage.type === "production") {
            const tpl = prev.templates.find((t) => t.id === o.templateId) ?? null;
            const stageTpl = tpl?.stages[input.stageIndex] ?? null;
            const stepTpl = stageTpl?.steps?.[input.stepIndex] ?? null;
            const actions = (stepTpl?.actions ?? []) as unknown as Array<{
              id: string;
              required?: boolean;
            }>;
            const required = actions.filter((a) => (a.required ?? true) === true);
            const hasMissing = required.some(
              (a) => step.fieldValues?.[`action:${a.id}:done`] !== true,
            );
            if (hasMissing) return o;
          }

          const nextStages = [...o.stages];
          const nextSteps = [...stage.steps];
          nextSteps[input.stepIndex] = {
            ...step,
            status: "completed" as ExecutionStatus,
            completedAt: now,
            completedBy: input.completedBy,
          };
          nextStages[input.stageIndex] = { ...stage, steps: nextSteps };
          return { ...o, stages: nextStages };
        });
        const next = { ...prev, orders: nextOrders };
        saveToStorage(next);
        return next;
      });
    },
    [],
  );

  const completeStage = useCallback(
    (input: { orderId: string; stageIndex: number; completedBy: string }) => {
      setState((prev) => {
        const now = new Date().toISOString();
        const nextOrders = prev.orders.map((o) => {
          if (o.id !== input.orderId) return o;
          if (o.status !== "in_progress") return o;
          const stage = o.stages[input.stageIndex];
          if (!stage) return o;

          const allStepsCompleted = stage.steps.every((s) => s.status === "completed");
          if (!allStepsCompleted) return o;
          if (
            stage.type === "release" &&
            !stage.steps.every((s) => isReleaseTechProcessApproved(s))
          ) {
            return o;
          }

          const nextStages = [...o.stages];
          nextStages[input.stageIndex] = {
            ...stage,
            status: "completed" as ExecutionStatus,
            completedAt: now,
            completedBy: input.completedBy,
          };

          const nextStageIndex = input.stageIndex + 1;
          if (nextStages[nextStageIndex]) {
            nextStages[nextStageIndex] = {
              ...nextStages[nextStageIndex]!,
              status: "in_progress" as ExecutionStatus,
            };
            return { ...o, stages: nextStages, currentStageIndex: nextStageIndex };
          }

          // No next stage: complete order
          return {
            ...o,
            stages: nextStages,
            status: "completed" as ProductionOrderStatus,
            completedAt: now,
            currentStageIndex: o.stages.length - 1,
          };
        });
        const next = { ...prev, orders: nextOrders };
        saveToStorage(next);
        return next;
      });
    },
    [],
  );

  const completeOrder = useCallback((input: { orderId: string; completedBy: string }) => {
    setState((prev) => {
      const now = new Date().toISOString();
      const nextOrders = prev.orders.map((o) => {
        if (o.id !== input.orderId) return o;
        if (o.status !== "in_progress") return o;
        const nextStages = o.stages.map((st) => ({
          ...st,
          status: "completed" as ExecutionStatus,
          completedAt: st.completedAt ?? now,
          completedBy: st.completedBy ?? input.completedBy,
          steps: st.steps.map((s) => ({
            ...s,
            status: "completed" as ExecutionStatus,
            completedAt: s.completedAt ?? now,
            completedBy: s.completedBy ?? input.completedBy,
          })),
        }));
        return {
          ...o,
          stages: nextStages,
          status: "completed" as ProductionOrderStatus,
          completedAt: now,
          currentStageIndex: nextStages.length - 1,
        };
      });
      const next = { ...prev, orders: nextOrders };
      saveToStorage(next);
      return next;
    });
  }, []);

  const rejectOrder = useCallback(
    (input: {
      orderId: string;
      rejectedBy: string;
      rejectedReason: string;
      rejectedPhase: ProductionRejectionPhase;
      rejectedAttachments?: ProductionRejectionAttachment[];
      rejectedStageIndex: number;
      rejectedStepTemplateId?: string;
    }) => {
      const now = new Date().toISOString();
      setState((prev) => {
        const nextOrders = prev.orders.map((o) => {
          if (o.id !== input.orderId) return o;
          if (o.status !== "in_progress") return o;
          return {
            ...o,
            status: "rejected" as ProductionOrderStatus,
            rejectedAt: now,
            rejectedBy: input.rejectedBy,
            rejectedReason: input.rejectedReason,
            rejectedPhase: input.rejectedPhase,
            rejectedAttachments: input.rejectedAttachments?.length
              ? input.rejectedAttachments
              : undefined,
            rejectedStageIndex: input.rejectedStageIndex,
            rejectedStepTemplateId: input.rejectedStepTemplateId,
          };
        });
        const next = { ...prev, orders: nextOrders };
        saveToStorage(next);
        return next;
      });
    },
    [],
  );

  const updateRegistrationValues = useCallback(
    (input: {
      orderId: string;
      registrationStageIndex: number;
      registrationStepIndex: number;
      patch: Record<string, FieldValue>;
      updatedBy: string;
    }) => {
      const now = new Date().toISOString();
      setState((prev) => {
        const nextOrders = prev.orders.map((o) => {
          if (o.id !== input.orderId) return o;
          if (o.status !== "in_progress") return o;
          const stage = o.stages[input.registrationStageIndex];
          const step = stage?.steps[input.registrationStepIndex];
          if (!stage || !step) return o;

          const nextStages = [...o.stages];
          const nextSteps = [...stage.steps];
          const nextStep = {
            ...step,
            fieldValues: { ...step.fieldValues, ...input.patch },
            updatedAt: now,
            updatedBy: input.updatedBy,
            version: (step.version ?? 1) + 1,
          };
          nextSteps[input.registrationStepIndex] = nextStep;
          nextStages[input.registrationStageIndex] = { ...stage, steps: nextSteps };
          return { ...o, stages: nextStages };
        });
        const next = { ...prev, orders: nextOrders };
        saveToStorage(next);
        return next;
      });
    },
    [],
  );

  const setOrderStatus = useCallback(
    (input: { orderId: string; status: ProductionOrderStatus; updatedBy: string }) => {
      const now = new Date().toISOString();
      setState((prev) => {
        const nextOrders = prev.orders.map((o) => {
          if (o.id !== input.orderId) return o;
          if (o.status === input.status) return o;
          if (o.status === "rejected" || o.status === "completed") return o;
          if (input.status === "rejected") {
            return {
              ...o,
              status: "rejected" as ProductionOrderStatus,
              rejectedAt: now,
              rejectedBy: input.updatedBy,
              rejectedReason: "—",
              rejectedPhase: "production" as ProductionRejectionPhase,
              rejectedAttachments: undefined,
              rejectedStageIndex: o.currentStageIndex,
            };
          }
          if (input.status === "completed") {
            return {
              ...o,
              status: "completed" as ProductionOrderStatus,
              completedAt: now,
              currentStageIndex: o.stages.length - 1,
            };
          }
          return { ...o, status: "in_progress" as ProductionOrderStatus };
        });
        const next = { ...prev, orders: nextOrders };
        saveToStorage(next);
        return next;
      });
    },
    [],
  );

  const value = useMemo<ProductionContextValue>(
    () => ({
      templates,
      orders,
      systemFieldRegistry,
      materialTypes,
      getOrderById,
      createTemplate,
      updateTemplate,
      deleteTemplate,
      archiveTemplate,
      updateMaterialTypeSettings,
      resetMaterialTypeSettings,
      createOrder,
      createOrderFromConstructorV2,
      deleteOrder,
      updateFieldValue,
      approveReleaseTechProcess,
      saveDraft,
      completeStep,
      completeStage,
      completeOrder,
      rejectOrder,
      updateRegistrationValues,
      setOrderStatus,
    }),
    [
      templates,
      orders,
      systemFieldRegistry,
      materialTypes,
      getOrderById,
      createTemplate,
      updateTemplate,
      deleteTemplate,
      archiveTemplate,
      updateMaterialTypeSettings,
      resetMaterialTypeSettings,
      createOrder,
      createOrderFromConstructorV2,
      deleteOrder,
      updateFieldValue,
      approveReleaseTechProcess,
      saveDraft,
      completeStep,
      completeStage,
      completeOrder,
      rejectOrder,
      updateRegistrationValues,
      setOrderStatus,
    ],
  );

  return (
    <ProductionContext.Provider value={value}>
      {children}
    </ProductionContext.Provider>
  );
}

export function useProduction() {
  const ctx = useContext(ProductionContext);
  if (!ctx) {
    throw new Error("useProduction must be used within ProductionProvider");
  }
  return ctx;
}
