import type { FieldValue, ProductionOrder } from "../mocks/productionData";

const REGISTRATION_FIELD_FIO = "fio";
const REGISTRATION_FIELD_IB = "ib";

export function registrationFieldAsString(v: FieldValue | undefined): string {
  if (v === null || v === undefined) return "";
  if (typeof v === "boolean") return v ? "Да" : "Нет";
  return String(v).trim();
}

/** ФИО и № ИБ из этапа `registration` (поля шаблона `fio`, `ib`). */
export function getRegistrationPatientFields(order: ProductionOrder): {
  patientName: string;
  caseNumber: string;
} {
  const reg = order.stages.find((s) => s.type === "registration");
  if (!reg?.steps?.length) {
    return { patientName: "", caseNumber: "" };
  }
  let patientName = "";
  let caseNumber = "";
  for (const step of reg.steps) {
    const fv = step.fieldValues;
    const fio = registrationFieldAsString(fv[REGISTRATION_FIELD_FIO]);
    const ib = registrationFieldAsString(fv[REGISTRATION_FIELD_IB]);
    if (fio) patientName = fio;
    if (ib) caseNumber = ib;
  }
  return { patientName, caseNumber };
}

export function dashField(v: FieldValue | undefined): string {
  const s = registrationFieldAsString(v);
  return s || "—";
}

export type ReleaseIssueConfirmSummary = {
  orderId: string;
  productName: string;
  productId: string;
  patientName: string;
  caseNumber: string;
  destination: string;
  deviations: string;
  processBy: string;
  approvedBy: string;
};

/** Данные для модалки подтверждения и печати акта выдачи. */
export function getReleaseIssueConfirmSummary(
  order: ProductionOrder,
  releaseStep?: ProductionOrder["stages"][number]["steps"][number],
): ReleaseIssueConfirmSummary {
  const reg = order.stages.find((s) => s.type === "registration");
  const regFv = reg?.steps[0]?.fieldValues ?? {};
  const { patientName, caseNumber } = getRegistrationPatientFields(order);
  const rv = releaseStep?.fieldValues ?? {};
  return {
    orderId: order.id,
    productName: order.templateName,
    productId: dashField(regFv.productId),
    patientName: patientName || "—",
    caseNumber: caseNumber || "—",
    destination: dashField(rv.where),
    deviations: dashField(rv.devSummary),
    processBy: dashField(rv.processDoneBy),
    approvedBy: dashField(rv.approvedBy),
  };
}

export function isReleaseStageCompleted(order: ProductionOrder): boolean {
  const st = order.stages.find((s) => s.type === "release");
  return st?.status === "completed";
}

export function getReleaseStageForPrint(order: ProductionOrder): {
  stage: ProductionOrder["stages"][number] | undefined;
  step: ProductionOrder["stages"][number]["steps"][number] | undefined;
} {
  const stage = order.stages.find((s) => s.type === "release");
  const step = stage?.steps?.[0];
  return { stage, step };
}
