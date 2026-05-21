import type {
  FieldDefinition,
  FieldReferenceRange,
  FieldValue,
  ProductionOrder,
  StageType,
} from "../mocks/productionData";

export const QC_DEVIATION_FLAG_FIELD_ID = "devFlag";

export function isQualityControlStageType(type: StageType): boolean {
  return type === "quality_control";
}

export function isWorkflowStageType(type: StageType): boolean {
  return !isQualityControlStageType(type);
}

export function findQualityControlStageIndex(
  stages: ProductionOrder["stages"],
): number {
  return stages.findIndex((stage) => isQualityControlStageType(stage.type));
}

export function findNextWorkflowStageIndex(
  stages: ProductionOrder["stages"],
  fromIndex: number,
): number | null {
  for (let i = fromIndex + 1; i < stages.length; i += 1) {
    if (isWorkflowStageType(stages[i]!.type)) return i;
  }
  return null;
}

/** Индекс активного этапа основной линии (QC не блокирует прогресс). */
export function resolveWorkflowCurrentStageIndex(order: ProductionOrder): number {
  const { stages, currentStageIndex, status } = order;
  const current = stages[currentStageIndex];
  if (!current || !isQualityControlStageType(current.type)) {
    return currentStageIndex;
  }

  if (status !== "in_progress") {
    const releaseIdx = stages.findIndex((stage) => stage.type === "release");
    return releaseIdx >= 0 ? releaseIdx : currentStageIndex;
  }

  for (let i = 0; i < stages.length; i += 1) {
    const stage = stages[i]!;
    if (!isWorkflowStageType(stage.type)) continue;
    if (stage.status !== "completed") return i;
  }

  const releaseIdx = stages.findIndex((stage) => stage.type === "release");
  return releaseIdx >= 0 ? releaseIdx : 0;
}

export function countWorkflowStages(stages: ProductionOrder["stages"]): number {
  return stages.filter((stage) => isWorkflowStageType(stage.type)).length;
}

export function workflowStageOrdinal(
  stages: ProductionOrder["stages"],
  actualIndex: number,
): number {
  let ordinal = 0;
  for (let i = 0; i <= actualIndex && i < stages.length; i += 1) {
    if (isWorkflowStageType(stages[i]!.type)) ordinal += 1;
  }
  return Math.max(1, ordinal);
}

export function qcValueOutOfRange(
  value: FieldValue,
  range: FieldReferenceRange | undefined,
): boolean {
  if (!range) return false;
  if (typeof value !== "number" || Number.isNaN(value)) return false;
  if (range.min !== undefined && value < range.min) return true;
  if (range.max !== undefined && value > range.max) return true;
  return false;
}

export function orderHasQualityControlDeviations(
  order: ProductionOrder,
  qcStepFields: FieldDefinition[] | undefined,
): boolean {
  const qcIdx = findQualityControlStageIndex(order.stages);
  if (qcIdx < 0) return false;
  const step = order.stages[qcIdx]?.steps?.[0];
  if (!step) return false;

  const devFlagRaw = step.fieldValues[QC_DEVIATION_FLAG_FIELD_ID];
  if (
    devFlagRaw === "Да" ||
    devFlagRaw === "да" ||
    devFlagRaw === true
  ) {
    return true;
  }

  if (!qcStepFields?.length) return false;
  for (const field of qcStepFields) {
    if (field.type !== "number" || !field.referenceRange) continue;
    if (qcValueOutOfRange(step.fieldValues[field.id], field.referenceRange)) {
      return true;
    }
  }
  return false;
}

export function normalizeOrdersWorkflowCurrentStage(
  orders: ProductionOrder[],
): ProductionOrder[] {
  return orders.map((order) => {
    if (order.status !== "in_progress") return order;
    const nextIndex = resolveWorkflowCurrentStageIndex(order);
    if (nextIndex === order.currentStageIndex) return order;
    return { ...order, currentStageIndex: nextIndex };
  });
}
