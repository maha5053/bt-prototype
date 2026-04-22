import type { StageTemplate, StepTemplate, FieldDefinition } from "../mocks/productionData";
import { THROMBOGEL_NEW_TEMPLATE } from "../mocks/productionData";

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function stageByType(type: StageTemplate["type"]): StageTemplate {
  const st = THROMBOGEL_NEW_TEMPLATE.stages.find((s) => s.type === type);
  if (!st) throw new Error(`Baseline stage not found: ${type}`);
  return st;
}

export function getBaselineRegistrationStage(): StageTemplate {
  return clone(stageByType("registration"));
}

export function getBaselineReleaseStage(): StageTemplate {
  return clone(stageByType("release"));
}

export function makeMinimalQualityControlStage(): StageTemplate {
  const field: FieldDefinition = {
    id: "pltWhole",
    label: "Кол-во Тц в цельной крови",
    type: "number",
    unit: "10^9/л",
    required: false,
    referenceRange: { min: 150, max: 450 },
  };

  const step: StepTemplate = {
    id: "step-qc-1",
    name: "1. Результаты контроля качества",
    hasDeviations: true,
    consumables: [],
    equipment: [],
    fields: [field],
  };

  return {
    id: "stg-qc",
    name: "Контроль качества",
    type: "quality_control",
    isSystem: true,
    isSopStage: true,
    allowedRoles: [],
    steps: [step],
  };
}

/**
 * Этап КК для runtime-шаблона ver2: копия из шаблона конструктора, без подмены на «минимальный»
 * с pltWhole, если в шаблоне уже есть этап КК. Поддерживает пустой список шагов и поля в groups.
 */
export function resolveQualityControlStageForV2Runtime(
  qcStageFromTemplate: StageTemplate | undefined,
): StageTemplate {
  if (!qcStageFromTemplate) {
    return makeMinimalQualityControlStage();
  }
  const cloned = clone(qcStageFromTemplate);
  if (cloned.steps.length === 0) {
    cloned.steps = [
      {
        id: "step-qc-1",
        name: "1. Результаты контроля качества",
        hasDeviations: true,
        consumables: [],
        equipment: [],
        fields: [],
      },
    ];
  }
  for (const step of cloned.steps) {
    const fromGroups = (step.groups ?? []).flatMap((g) => g.fields ?? []);
    if (!(step.fields?.length) && fromGroups.length > 0) {
      step.fields = fromGroups;
    }
    if (!step.fields) {
      step.fields = [];
    }
  }
  return cloned;
}

