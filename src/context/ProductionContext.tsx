import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  INITIAL_PROCESS_TEMPLATES,
  INITIAL_PRODUCTION_ORDERS,
  buildOrderFromTemplate,
  type ExecutionStatus,
  type FieldValue,
  type ProcessTemplate,
  type ProductionOrder,
  type ProductionOrderStatus,
  type ProductionRejectionAttachment,
  type ProductionRejectionPhase,
} from "../mocks/productionData";

const STORAGE_KEY = "bio-production";

const PO_ORDER_ID_RE = /^po-(\d+)$/i;

/** Next id po-NNN (min 3 digits via padStart); max over existing po-<digits> + 1. */
function nextProductionOrderId(orders: ProductionOrder[]): string {
  let max = 0;
  for (const o of orders) {
    const m = PO_ORDER_ID_RE.exec(o.id);
    if (!m) continue;
    const n = Number.parseInt(m[1], 10);
    if (Number.isFinite(n)) max = Math.max(max, n);
  }
  const next = max + 1;
  return `po-${String(next).padStart(3, "0")}`;
}

function loadFromStorage(): { templates: ProcessTemplate[]; orders: ProductionOrder[] } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as { templates: ProcessTemplate[]; orders: ProductionOrder[] };
  } catch {
    /* ignore */
  }
  return null;
}

function saveToStorage(state: { templates: ProcessTemplate[]; orders: ProductionOrder[] }) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
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
      consumableQty: number;
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
  getOrderById: (orderId: string) => ProductionOrder | null;
  createOrder: (templateId: string) => ProductionOrder;
  updateFieldValue: (input: UpdateFieldValueInput) => void;
  saveDraft: (input: {
    orderId: string;
    stageIndex: number;
    stepIndex: number;
    updatedBy: string;
  }) => { savedAt: string };
  deferQualityControl: (input: {
    orderId: string;
    stageIndex: number;
    deferredBy: string;
    deferredReason?: string;
  }) => void;
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

const DEFAULT_USER = "Смирнова А.";

export function ProductionProvider({ children }: { children: ReactNode }) {
  const [{ templates, orders }, setState] = useState<{
    templates: ProcessTemplate[];
    orders: ProductionOrder[];
  }>(() => {
    const stored = loadFromStorage();
    return stored ?? { templates: [...INITIAL_PROCESS_TEMPLATES], orders: [...INITIAL_PRODUCTION_ORDERS] };
  });

  const getOrderById = useCallback(
    (orderId: string) => orders.find((o) => o.id === orderId) ?? null,
    [orders],
  );

  const createOrder = useCallback(
    (templateId: string): ProductionOrder => {
      const template =
        templates.find((t) => t.id === templateId) ?? templates[0];
      if (!template) throw new Error("No production templates available");

      let created: ProductionOrder | undefined;
      setState((prev) => {
        const id = nextProductionOrderId(prev.orders);
        const newOrder = buildOrderFromTemplate(template, {
          id,
          createdBy: DEFAULT_USER,
        });
        created = newOrder;
        const next = { ...prev, orders: [newOrder, ...prev.orders] };
        saveToStorage(next);
        return next;
      });
      if (!created) throw new Error("Failed to create order");
      return created;
    },
    [templates],
  );

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
          const qty = Number.isFinite(input.consumableQty)
            ? Math.max(0, Math.floor(input.consumableQty))
            : 0;
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

  const deferQualityControl = useCallback(
    (input: {
      orderId: string;
      stageIndex: number;
      deferredBy: string;
      deferredReason?: string;
    }) => {
      const now = new Date().toISOString();
      setState((prev) => {
        const nextOrders = prev.orders.map((o) => {
          if (o.id !== input.orderId) return o;
          if (o.status !== "in_progress") return o;
          const stage = o.stages[input.stageIndex];
          if (!stage) return o;
          const nextStages = [...o.stages];
          nextStages[input.stageIndex] = {
            ...stage,
            deferred: true,
            deferredAt: now,
            deferredBy: input.deferredBy,
            deferredReason: input.deferredReason,
          };
          return { ...o, stages: nextStages };
        });
        const next = { ...prev, orders: nextOrders };
        saveToStorage(next);
        return next;
      });
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

          const nextStages = [...o.stages];
          nextStages[input.stageIndex] = {
            ...stage,
            status: "completed" as ExecutionStatus,
            deferred: false,
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
          deferred: false,
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
      getOrderById,
      createOrder,
      updateFieldValue,
      saveDraft,
      deferQualityControl,
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
      getOrderById,
      createOrder,
      updateFieldValue,
      saveDraft,
      deferQualityControl,
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

