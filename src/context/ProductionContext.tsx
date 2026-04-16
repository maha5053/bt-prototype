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
} from "../mocks/productionData";

const STORAGE_KEY = "bio-production";

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

type ProductionContextValue = {
  templates: ProcessTemplate[];
  orders: ProductionOrder[];
  getOrderById: (orderId: string) => ProductionOrder | null;
  createOrder: (templateId: string) => ProductionOrder;
  updateFieldValue: (input: {
    orderId: string;
    stageIndex: number;
    stepIndex: number;
    fieldId: string;
    value: FieldValue;
    updatedBy: string;
  }) => void;
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
      const template = templates.find((t) => t.id === templateId);
      if (!template) {
        // Fallback: create from first template to avoid hard crash in demo.
        const fallback = templates[0];
        if (!fallback) throw new Error("No production templates available");
        const newOrder = buildOrderFromTemplate(fallback, { createdBy: DEFAULT_USER });
        setState((prev) => {
          const next = { ...prev, orders: [newOrder, ...prev.orders] };
          saveToStorage(next);
          return next;
        });
        return newOrder;
      }

      const newOrder = buildOrderFromTemplate(template, { createdBy: DEFAULT_USER });
      setState((prev) => {
        const next = { ...prev, orders: [newOrder, ...prev.orders] };
        saveToStorage(next);
        return next;
      });
      return newOrder;
    },
    [templates],
  );

  const updateFieldValue = useCallback(
    (input: {
      orderId: string;
      stageIndex: number;
      stepIndex: number;
      fieldId: string;
      value: FieldValue;
      updatedBy: string;
    }) => {
      const { orderId, stageIndex, stepIndex, fieldId, value, updatedBy } = input;
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
          nextStep.fieldValues = { ...nextStep.fieldValues, [fieldId]: value };
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

