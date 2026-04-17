import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { ProductionProvider, useProduction } from "../context/ProductionContext";
import {
  PRODUCTION_REJECTION_PHASE_LABELS,
  type FieldDefinition,
  type FieldValue,
  type ProcessTemplate,
  type ProductionOrder,
  type ProductionRejectionAttachment,
  type ProductionRejectionPhase,
  type StageTemplate,
  type StepTemplate,
} from "../mocks/productionData";

const REJECTION_PHASE_OPTIONS = Object.entries(
  PRODUCTION_REJECTION_PHASE_LABELS,
) as [ProductionRejectionPhase, string][];

const MAX_REJECT_ATTACHMENTS = 6;
const MAX_REJECT_FILE_BYTES = 4 * 1024 * 1024;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("read"));
    r.readAsDataURL(file);
  });
}

function rejectionAttachmentId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function ProductionListPage() {
  return (
    <ProductionProvider>
      <ProductionListContent />
    </ProductionProvider>
  );
}

function ProductionListContent() {
  const { orders, templates, createOrder } = useProduction();
  const navigate = useNavigate();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [showDevTools, setShowDevTools] = useState(false);

  const sortedOrders = useMemo(() => {
    return [...orders].sort((a, b) => {
      const da = new Date(a.createdAt).getTime();
      const db = new Date(b.createdAt).getTime();
      return db - da;
    });
  }, [orders]);

  const handleOpenOrder = (orderId: string) => {
    navigate(`/proizvodstvo/${orderId}`);
  };

  const handleCreate = () => {
    const templateId =
      selectedTemplateId || (templates[0] ? templates[0].id : "");
    if (!templateId) return;
    const order = createOrder(templateId);
    setShowCreate(false);
    setSelectedTemplateId("");
    navigate(`/proizvodstvo/${order.id}`);
  };

  const STORAGE_KEY = "bio-production";

  const clearProductionLocalStorage = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      window.location.reload();
    } catch {
      // ignore
    }
  };

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Производство</h1>
          <p className="mt-1 text-sm text-slate-500">
            Журнал заказов на производство.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          Начать производство
        </button>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <th className="px-4 py-3 font-medium">Номер</th>
                <th className="px-4 py-3 font-medium">Продукт</th>
                <th className="px-4 py-3 font-medium">Дата начала</th>
                <th className="px-4 py-3 font-medium">Текущий этап</th>
                <th className="px-4 py-3 font-medium whitespace-nowrap">
                  Статус
                </th>
                <th className="px-4 py-3 font-medium">Создатель</th>
              </tr>
            </thead>
            <tbody>
              {sortedOrders.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-slate-500"
                  >
                    Нет заказов на производство.
                  </td>
                </tr>
              ) : (
                sortedOrders.map((order) => {
                  const currentStage =
                    order.stages[order.currentStageIndex]?.name ?? "—";
                  return (
                    <tr
                      key={order.id}
                      onClick={() => handleOpenOrder(order.id)}
                      className="cursor-pointer border-b border-slate-100 last:border-0 hover:bg-slate-50/80"
                      title={
                        order.status === "rejected"
                          ? order.rejectedReason ?? "Брак"
                          : ""
                      }
                    >
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">
                        {order.id.replace(/^po-/, "")}
                      </td>
                      <td className="px-4 py-3 text-slate-800 font-medium">
                        {order.templateName}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {formatRuDateTime(order.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {currentStage}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge
                          status={order.status}
                          reason={order.rejectedReason}
                          currentStageLabel={
                            order.status === "in_progress"
                              ? currentStage
                              : undefined
                          }
                        />
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {order.createdBy}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showCreate && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 pt-16"
          onClick={() => setShowCreate(false)}
        >
          <div
            className="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Начать производство"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Начать производство
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Выберите продукт для нового заказа.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                aria-label="Закрыть"
              >
                <svg
                  className="size-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <label className="block">
              <div className="mb-1 text-xs font-medium text-slate-600">
                Продукт
              </div>
              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-blue-400"
              >
                <option value="">Выберите…</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} · этапов: {t.stages.length}
                  </option>
                ))}
              </select>
            </label>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-50"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={!selectedTemplateId && templates.length === 0}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Создать заказ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dev tools button - bottom right, subtle */}
      <button
        type="button"
        onClick={() => setShowDevTools(true)}
        className="fixed bottom-4 right-4 rounded-md p-2 text-slate-300 hover:bg-slate-100 hover:text-slate-600"
        aria-label="Инструменты разработчика"
        title="Инструменты разработчика"
      >
        <svg
          className="size-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>

      {/* Dev tools modal */}
      {showDevTools && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 pt-16"
          onClick={() => setShowDevTools(false)}
        >
          <div
            className="relative w-full max-w-sm rounded-xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Инструменты разработчика"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                Инструменты разработчика
              </h2>
              <button
                type="button"
                onClick={() => setShowDevTools(false)}
                className="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                aria-label="Закрыть"
              >
                <svg
                  className="size-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <p className="mb-4 text-sm text-slate-600">
              Очистка localStorage удалит все данные производства и восстановит
              исходные mock-данные.
            </p>

            <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
              <button
                type="button"
                onClick={() => setShowDevTools(false)}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={clearProductionLocalStorage}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-red-500"
              >
                Очистить localStorage
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function ProductionOrderPage() {
  return (
    <ProductionProvider>
      <ProductionOrderContent />
    </ProductionProvider>
  );
}

function ProductionOrderContent() {
  const { orderId } = useParams<{ orderId: string }>();
  const {
    getOrderById,
    templates,
    updateFieldValue,
    completeStep,
    completeStage,
    rejectOrder,
  } = useProduction();
  const order = orderId ? getOrderById(orderId) : null;
  const [activeStageIndex, setActiveStageIndex] = useState<number | null>(null);
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0);
  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectTouched, setRejectTouched] = useState(false);
  const [rejectPhase, setRejectPhase] =
    useState<ProductionRejectionPhase>("incoming_material");
  const [rejectAttachments, setRejectAttachments] = useState<
    ProductionRejectionAttachment[]
  >([]);
  const [rejectAttachError, setRejectAttachError] = useState<string | null>(
    null,
  );
  const rejectFileRef = useRef<HTMLInputElement>(null);

  const effectiveActiveStageIndex =
    activeStageIndex ?? (order ? order.currentStageIndex : 0);

  if (!order) {
    return (
      <div className="p-6 md:p-8">
        <h1 className="text-xl font-semibold text-slate-800">Заказ</h1>
        <p className="mt-2 text-sm text-slate-500">Заказ не найден.</p>
        <Link
          to="/proizvodstvo"
          className="mt-4 inline-flex rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
        >
          ← К журналу заказов
        </Link>
      </div>
    );
  }

  const template: ProcessTemplate | null =
    templates.find((t) => t.id === order.templateId) ?? null;

  const stageTemplate: StageTemplate | null =
    template?.stages[effectiveActiveStageIndex] ?? null;

  const stageExecution = order.stages[effectiveActiveStageIndex] ?? null;
  const stageTitle =
    stageTemplate?.name ?? stageExecution?.name ?? "Этап";

  const isOrderReadonly = order.status !== "in_progress";
  const canEditStage =
    !isOrderReadonly &&
    effectiveActiveStageIndex === order.currentStageIndex;

  const stepsTpl: StepTemplate[] = stageTemplate?.steps ?? [];
  const stepTpl = stepsTpl[activeStepIndex] ?? null;
  const viewedStepExecution =
    stageExecution && stageTemplate
      ? stageExecution.steps[
          stageTemplate.type === "quality_control"
            ? 0
            : Math.min(
                activeStepIndex,
                Math.max(0, stageExecution.steps.length - 1),
              )
        ]
      : null;
  const viewedStepCompletion = (() => {
    const isMultiStepStage =
      Boolean(stageTemplate) &&
      stageTemplate!.type !== "quality_control" &&
      (stageTemplate!.steps?.length ?? 0) > 1;

    if (isMultiStepStage && stageExecution) {
      const last = stageExecution.steps[stageExecution.steps.length - 1];
      if (last?.completedBy && last?.completedAt) {
        return { by: last.completedBy, at: last.completedAt };
      }
      for (let i = stageExecution.steps.length - 1; i >= 0; i -= 1) {
        const s = stageExecution.steps[i];
        if (s?.completedBy && s?.completedAt) {
          return { by: s.completedBy, at: s.completedAt };
        }
      }
    } else {
      if (
        viewedStepExecution?.status === "completed" &&
        viewedStepExecution.completedBy &&
        viewedStepExecution.completedAt
      ) {
        return {
          by: viewedStepExecution.completedBy,
          at: viewedStepExecution.completedAt,
        };
      }
    }

    if (
      stageExecution?.status === "completed" &&
      stageExecution.completedBy &&
      stageExecution.completedAt
    ) {
      return { by: stageExecution.completedBy, at: stageExecution.completedAt };
    }
    return null;
  })();

  const rejectError =
    rejectTouched && !rejectReason.trim()
      ? "Укажите причину брака."
      : null;

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            to="/proizvodstvo"
            className="text-sm text-slate-500 transition hover:text-slate-700"
            title="К журналу заказов"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </Link>
          <h1 className="text-xl font-semibold text-slate-800">
            Заказ {order.id}
          </h1>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          {order.templateName} · Создал: {order.createdBy} · Начало:{" "}
          {formatRuDateTime(order.createdAt)} · Статус:{" "}
          <span className="font-medium">{order.status}</span>
        </p>
      </div>

      {order.status === "rejected" ? (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-900">
          <div className="font-semibold">Брак</div>
          <div className="mt-1 text-red-800">
            Причина:{" "}
            <span className="font-medium">
              {order.rejectedReason || "—"}
            </span>
          </div>
          {order.rejectedPhase ? (
            <div className="mt-2 text-red-800">
              Этап:{" "}
              <span className="font-medium">
                {PRODUCTION_REJECTION_PHASE_LABELS[order.rejectedPhase]}
              </span>
            </div>
          ) : null}
          <div className="mt-1 text-xs text-red-700/80">
            Зафиксировал: {order.rejectedBy || "—"} ·{" "}
            {order.rejectedAt ? formatRuDateTime(order.rejectedAt) : "—"}
          </div>
          {order.rejectedAttachments && order.rejectedAttachments.length > 0 ? (
            <div className="mt-3 border-t border-red-200/80 pt-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-red-800/90">
                Вложения
              </div>
              <ul className="mt-2 space-y-3">
                {order.rejectedAttachments.map((a) => (
                  <li
                    key={a.id}
                    className="flex flex-wrap items-start gap-3 text-xs text-red-900"
                  >
                    {a.mimeType.startsWith("image/") ? (
                      <a
                        href={a.dataUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="shrink-0 rounded-md border border-red-200/80 bg-white p-0.5 shadow-sm"
                      >
                        <img
                          src={a.dataUrl}
                          alt={a.fileName}
                          className="h-16 w-16 rounded object-cover"
                        />
                      </a>
                    ) : null}
                    <div className="min-w-0 flex-1">
                      <a
                        href={a.dataUrl}
                        download={a.fileName}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-red-900 underline decoration-red-300 underline-offset-2 transition hover:text-red-950"
                      >
                        {a.fileName}
                      </a>
                      <div className="mt-0.5 text-[11px] text-red-700/80">
                        {a.mimeType || "файл"}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <div className="min-w-0 flex-1">
            <StageStepper
              order={order}
              template={template}
              activeStageIndex={effectiveActiveStageIndex}
              onSelectStage={(idx) => {
                setActiveStageIndex(idx);
                setActiveStepIndex(0);
              }}
            />
          </div>
          {!isOrderReadonly ? (
            <StageActionsMenu
              onReject={() => {
                setRejectReason("");
                setRejectTouched(false);
                setRejectPhase("incoming_material");
                setRejectAttachments([]);
                setRejectAttachError(null);
                if (rejectFileRef.current) rejectFileRef.current.value = "";
                setShowReject(true);
              }}
            />
          ) : null}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-slate-900">
                {stageTitle}
              </div>
              {viewedStepCompletion ? (
                <div className="mt-1 text-xs text-slate-500">
                  Завершил: {viewedStepCompletion.by} ·{" "}
                  {formatRuDateTime(viewedStepCompletion.at)}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {stageTemplate && stageExecution ? (
          <div className="p-4">
            {stageTemplate.type === "quality_control" ? (
              <QualityControlStage
                stageTemplate={stageTemplate}
                stageExecution={stageExecution}
                canEdit={canEditStage}
                onChangeField={(stepIndex, fieldId, value) =>
                  updateFieldValue({
                    orderId: order.id,
                    stageIndex: effectiveActiveStageIndex,
                    stepIndex,
                    fieldId,
                    value,
                    updatedBy: "Смирнова А.",
                  })
                }
                onConfirm={() => {
                  if (!canEditStage) return;
                  const stepIndex = 0;
                  completeStep({
                    orderId: order.id,
                    stageIndex: effectiveActiveStageIndex,
                    stepIndex,
                    completedBy: "Смирнова А.",
                  });
                  completeStage({
                    orderId: order.id,
                    stageIndex: effectiveActiveStageIndex,
                    completedBy: "Смирнова А.",
                  });
                }}
              />
            ) : (
              <StepsStage
                order={order}
                stageTemplate={stageTemplate}
                stageExecution={stageExecution}
                activeStepIndex={activeStepIndex}
                onSelectStep={setActiveStepIndex}
                canEdit={canEditStage}
                onChangeField={(stepIndex, fieldId, value) =>
                  updateFieldValue({
                    orderId: order.id,
                    stageIndex: effectiveActiveStageIndex,
                    stepIndex,
                    fieldId,
                    value,
                    updatedBy: "Смирнова А.",
                  })
                }
                onCompleteStep={(stepIndex) => {
                  if (!canEditStage) return;
                  completeStep({
                    orderId: order.id,
                    stageIndex: effectiveActiveStageIndex,
                    stepIndex,
                    completedBy: "Смирнова А.",
                  });
                }}
                onCompleteStage={() => {
                  if (!canEditStage) return;
                  completeStage({
                    orderId: order.id,
                    stageIndex: effectiveActiveStageIndex,
                    completedBy: "Смирнова А.",
                  });
                }}
              />
            )}
          </div>
        ) : (
          <div className="p-4 text-sm text-slate-500">
            Не найден шаблон этапа для этого заказа.
          </div>
        )}
      </div>

      {showReject && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 pt-16"
          onClick={() => setShowReject(false)}
        >
          <div
            className="mx-4 w-full max-w-lg rounded-xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Забраковать заказ"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Забраковать заказ
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Это финальное действие. После подтверждения заказ будет доступен
                  только для просмотра.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowReject(false)}
                className="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                aria-label="Закрыть"
              >
                <svg
                  className="size-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <fieldset className="mt-4">
              <legend className="mb-2 text-xs font-medium text-slate-600">
                Этап брака
              </legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {REJECTION_PHASE_OPTIONS.map(([value, label]) => (
                  <label
                    key={value}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                      rejectPhase === value
                        ? "border-red-300 bg-red-50 text-red-900"
                        : "border-slate-200 bg-white text-slate-800 hover:border-slate-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="reject-phase"
                      className="size-4 shrink-0 border-slate-300 text-red-600 focus:ring-red-500"
                      checked={rejectPhase === value}
                      onChange={() => setRejectPhase(value)}
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            <label className="mt-4 block">
              <div className="mb-1 text-xs font-medium text-slate-600">
                Причина (обязательно)
              </div>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                onBlur={() => setRejectTouched(true)}
                rows={4}
                className={`w-full resize-none rounded-lg border px-3 py-2 text-sm outline-none transition ${
                  rejectError
                    ? "border-red-300 bg-red-50 focus:border-red-400"
                    : "border-slate-200 focus:border-blue-400"
                }`}
                placeholder="Опишите причину брака…"
              />
              {rejectError ? (
                <div className="mt-1 text-xs text-red-600">{rejectError}</div>
              ) : null}
            </label>

            <div className="mt-4">
              <div className="mb-1 text-xs font-medium text-slate-600">
                Вложения (необязательно)
              </div>
              <input
                ref={rejectFileRef}
                type="file"
                className="sr-only"
                accept="image/*,.pdf,.doc,.docx,application/pdf"
                multiple
                onChange={(e) => {
                  const input = e.target;
                  const list = input.files;
                  input.value = "";
                  if (!list?.length) return;
                  setRejectAttachError(null);

                  void (async () => {
                    const toAdd: ProductionRejectionAttachment[] = [];
                    for (const file of Array.from(list)) {
                      if (file.size > MAX_REJECT_FILE_BYTES) {
                        setRejectAttachError(
                          `«${file.name}» слишком большой (макс. ${MAX_REJECT_FILE_BYTES / (1024 * 1024)} МБ).`,
                        );
                        continue;
                      }
                      try {
                        const dataUrl = await readFileAsDataUrl(file);
                        toAdd.push({
                          id: rejectionAttachmentId(),
                          fileName: file.name,
                          mimeType: file.type || "application/octet-stream",
                          dataUrl,
                        });
                      } catch {
                        setRejectAttachError(
                          `Не удалось прочитать «${file.name}».`,
                        );
                      }
                    }
                    if (!toAdd.length) return;
                    setRejectAttachments((prev) => {
                      const space = Math.max(
                        0,
                        MAX_REJECT_ATTACHMENTS - prev.length,
                      );
                      const slice = toAdd.slice(0, space);
                      if (slice.length < toAdd.length) {
                        setRejectAttachError(
                          `Не более ${MAX_REJECT_ATTACHMENTS} файлов.`,
                        );
                      }
                      return slice.length ? [...prev, ...slice] : prev;
                    });
                  })();
                }}
              />
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => rejectFileRef.current?.click()}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  Прикрепить файл или фото
                </button>
                <span className="text-xs text-slate-500">
                  До {MAX_REJECT_ATTACHMENTS} файлов, до{" "}
                  {MAX_REJECT_FILE_BYTES / (1024 * 1024)} МБ каждый
                </span>
              </div>
              {rejectAttachError ? (
                <div className="mt-2 text-xs text-amber-700">{rejectAttachError}</div>
              ) : null}
              {rejectAttachments.length > 0 ? (
                <ul className="mt-3 space-y-2 rounded-lg border border-slate-100 bg-slate-50/80 p-3">
                  {rejectAttachments.map((a) => (
                    <li
                      key={a.id}
                      className="flex items-center justify-between gap-2 text-xs text-slate-800"
                    >
                      <span className="min-w-0 truncate font-medium">
                        {a.fileName}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setRejectAttachments((prev) =>
                            prev.filter((x) => x.id !== a.id),
                          )
                        }
                        className="shrink-0 rounded-md px-2 py-1 text-slate-500 transition hover:bg-slate-200/80 hover:text-slate-800"
                      >
                        Удалить
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowReject(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-50"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={() => {
                  setRejectTouched(true);
                  if (!rejectReason.trim()) return;
                  rejectOrder({
                    orderId: order.id,
                    rejectedBy: "Смирнова А.",
                    rejectedReason: rejectReason.trim(),
                    rejectedPhase: rejectPhase,
                    rejectedAttachments:
                      rejectAttachments.length > 0
                        ? rejectAttachments
                        : undefined,
                    rejectedStageIndex: order.currentStageIndex,
                    rejectedStepTemplateId: stepTpl?.id,
                  });
                  setShowReject(false);
                }}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
              >
                Подтвердить брак
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StageActionsMenu({ onReject }: { onReject: () => void }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDocMouseDown = (e: MouseEvent) => {
      const el = rootRef.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) {
        setOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="relative shrink-0" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Действия"
        title="Действия"
      >
        <span className="text-lg leading-none">⋯</span>
      </button>
      {open ? (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-2 w-48 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
        >
          <button
            type="button"
            role="menuitem"
            className="w-full px-3 py-2 text-left text-sm text-red-700 transition hover:bg-red-50"
            onClick={() => {
              setOpen(false);
              onReject();
            }}
          >
            Забраковать
          </button>
        </div>
      ) : null}
    </div>
  );
}

function scrollToProductionField(fieldId: string) {
  const safeId = fieldId.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  const el = document.querySelector(
    `[data-production-field="${safeId}"]`,
  ) as HTMLElement | null;
  if (!el) return;
  el.scrollIntoView({ behavior: "smooth", block: "center" });
  window.setTimeout(() => {
    const focusable = el.querySelector(
      "input:not([type='hidden']), select, textarea, button",
    ) as HTMLElement | null;
    if (!focusable || (focusable as HTMLInputElement).disabled) return;
    focusable.focus({ preventScroll: true });
  }, 250);
}

function MissingRequiredFieldsHint({
  fields,
}: {
  fields: FieldDefinition[];
}) {
  const shown = fields.slice(0, 3);
  return (
    <div className="text-right text-xs text-slate-500">
      Заполните обязательные поля:{" "}
      {shown.map((f, i) => (
        <span key={f.id}>
          {i > 0 ? ", " : null}
          <button
            type="button"
            onClick={() => scrollToProductionField(f.id)}
            className="cursor-pointer text-slate-700 underline decoration-slate-300 underline-offset-2 transition hover:text-slate-900"
          >
            {f.label}
          </button>
        </span>
      ))}
      {fields.length > 3 ? "…" : ""}
    </div>
  );
}

function formatRuDateTime(iso: string): string {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const mins = String(d.getMinutes()).padStart(2, "0");
  return `${day}.${month}.${year} ${hours}:${mins}`;
}

function StatusBadge({
  status,
  reason,
  currentStageLabel,
}: {
  status: "in_progress" | "completed" | "rejected";
  reason?: string;
  /** Подпись под «В работе» в журнале (текущий этап). */
  currentStageLabel?: string;
}) {
  const style =
    status === "completed"
      ? "bg-slate-100 text-slate-600 ring-slate-500/20"
      : status === "rejected"
        ? "bg-red-50 text-red-700 ring-red-600/20"
        : "bg-amber-50 text-amber-700 ring-amber-500/20";

  const label =
    status === "completed"
      ? "Завершён"
      : status === "rejected"
        ? "Брак"
        : "В работе";

  return (
    <div className="max-w-[18rem]">
      <span
        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${style}`}
      >
        {label}
      </span>
      {status === "in_progress" && currentStageLabel ? (
        <div className="mt-1 line-clamp-2 text-xs text-slate-600">
          {currentStageLabel}
        </div>
      ) : null}
      {status === "rejected" && reason ? (
        <div className="mt-1 line-clamp-2 text-xs text-slate-500">
          {reason}
        </div>
      ) : null}
    </div>
  );
}

function StageStepper({
  order,
  template,
  activeStageIndex,
  onSelectStage,
}: {
  order: ProductionOrder;
  template: ProcessTemplate | null;
  activeStageIndex: number;
  onSelectStage: (idx: number) => void;
}) {
  return (
    <ol className="flex flex-wrap gap-2">
      {order.stages.map((st, idx) => {
        const isActive = idx === activeStageIndex;
        const isCurrent = idx === order.currentStageIndex;
        const tplName = template?.stages[idx]?.name;
        const name = tplName ?? st.name ?? `Этап ${idx + 1}`;
        const showStageWorkBadge =
          st.status === "in_progress" && !st.deferred;

        const pillCls = (() => {
          if (isCurrent && st.status !== "completed") {
            return isActive
              ? "border-amber-300 bg-amber-100 hover:bg-amber-100"
              : "border-amber-200 bg-amber-50 hover:bg-amber-100";
          }
          if (st.status === "completed") {
            return isActive
              ? "border-emerald-300 bg-emerald-100 hover:bg-emerald-100"
              : "border-emerald-200 bg-emerald-50 hover:bg-emerald-100";
          }
          // pending / not current
          return isActive
            ? "border-slate-300 bg-slate-100 hover:bg-slate-100"
            : "border-slate-200 bg-white hover:bg-slate-50";
        })();

        return (
          <li key={`${st.stageTemplateId}-${idx}`}>
            <button
              type="button"
              onClick={() => onSelectStage(idx)}
              className={[
                "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition",
                pillCls,
              ].join(" ")}
            >
              <span className="font-medium text-slate-800">{name}</span>
              {showStageWorkBadge ? (
                <span className="inline-flex shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 ring-1 ring-inset ring-amber-500/20">
                  В работе
                </span>
              ) : null}
            </button>
          </li>
        );
      })}
    </ol>
  );
}

function StepsStage({
  order,
  stageTemplate,
  stageExecution,
  activeStepIndex,
  onSelectStep,
  canEdit,
  onChangeField,
  onCompleteStep,
  onCompleteStage,
}: {
  order: ProductionOrder;
  stageTemplate: StageTemplate;
  stageExecution: ProductionOrder["stages"][number];
  activeStepIndex: number;
  onSelectStep: (idx: number) => void;
  canEdit: boolean;
  onChangeField: (stepIndex: number, fieldId: string, value: FieldValue) => void;
  onCompleteStep: (stepIndex: number) => void;
  onCompleteStage: () => void;
}) {
  const stepsTpl = stageTemplate.steps;
  const stepsExec = stageExecution.steps;

  const allStepsCompleted = stepsExec.every((s) => s.status === "completed");
  const showStepsSidebar = stepsTpl.length > 1;
  const isSingleStepStage = stepsTpl.length <= 1;
  const sequentialLockEnabled =
    canEdit && stageExecution.status !== "completed";
  const firstIncompleteIndex = Math.max(
    0,
    stepsExec.findIndex((s) => s.status !== "completed"),
  );
  const activeStepLocked =
    sequentialLockEnabled && activeStepIndex > firstIncompleteIndex;
  const activeStepTpl = stepsTpl[activeStepIndex];
  const activeStepExec = stepsExec[activeStepIndex];

  const stepTotal = stepsTpl.length;
  const completedStepCount = stepsExec.filter(
    (s) => s.status === "completed",
  ).length;
  const stepHeading = (stepIndex: number, name: string) =>
    `Шаг ${stepIndex + 1} из ${stepTotal}: ${name}`;

  const missingRequiredFields = (() => {
    if (!activeStepTpl || !activeStepExec) return [];
    return activeStepTpl.fields.filter((f) => {
      if (!f.required) return false;
      if (f.type === "section_header") return false;
      if (typeof f.refStageIndex === "number" || f.refFieldId) return false;
      if (f.refDeviations && f.refDeviations.length > 0) return false;
      if (f.computeRule) return false;

      const raw = activeStepExec.fieldValues[f.id];
      if (raw === null || raw === undefined) return true;

      switch (f.type) {
        case "text":
        case "select":
        case "date":
          return typeof raw !== "string" || raw.trim().length === 0;
        case "number":
          return (
            typeof raw !== "number" ||
            Number.isNaN(raw) ||
            raw < 0
          );
        case "checkbox":
          return raw !== true;
        default:
          return false;
      }
    });
  })();
  const canCompleteActiveStep =
    canEdit && !activeStepLocked && activeStepExec?.status !== "completed";
  const completeDisabled =
    !canCompleteActiveStep || missingRequiredFields.length > 0;
  const completeTitle =
    missingRequiredFields.length > 0
      ? `Заполните обязательные поля: ${missingRequiredFields
          .slice(0, 3)
          .map((f) => f.label)
          .join(", ")}${missingRequiredFields.length > 3 ? "…" : ""}`
      : undefined;

  return (
    <div
      className={
        showStepsSidebar ? "grid gap-4 lg:grid-cols-[260px_1fr]" : "grid gap-4"
      }
    >
      {showStepsSidebar ? (
        <aside className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="mb-2">
            <div className="text-xs font-semibold text-slate-600">Шаги</div>
            <div className="mt-0.5 text-[11px] text-slate-500">
              Завершено {completedStepCount} из {stepTotal}
            </div>
          </div>
          <nav className="flex flex-col gap-1">
            {stepsTpl.map((s, idx) => {
              const exec = stepsExec[idx];
              const isActive = idx === activeStepIndex;
              const isLocked = sequentialLockEnabled && idx > firstIncompleteIndex;
              const state =
                exec?.status === "completed"
                  ? "completed"
                  : sequentialLockEnabled && idx === firstIncompleteIndex
                    ? "in_progress"
                    : exec?.status === "in_progress"
                      ? "in_progress"
                      : "pending";
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    if (isLocked) return;
                    onSelectStep(idx);
                  }}
                  className={[
                    "flex items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm transition",
                    isActive
                      ? "bg-white shadow-sm ring-1 ring-slate-200"
                      : isLocked
                        ? "opacity-70"
                        : "hover:bg-white/70",
                  ].join(" ")}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block whitespace-normal text-slate-800 leading-snug">
                      {stepHeading(idx, s.name)}
                    </span>
                    {exec?.status === "completed" && exec.completedBy && exec.completedAt ? (
                      <span className="mt-1 block text-[11px] leading-snug text-slate-500">
                        Завершил: {exec.completedBy} · {formatRuDateTime(exec.completedAt)}
                      </span>
                    ) : null}
                  </span>
                  {state === "in_progress" ? (
                    <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 ring-1 ring-inset ring-amber-500/20">
                      в работе
                    </span>
                  ) : null}
                </button>
              );
            })}
          </nav>
        </aside>
      ) : null}

      <section className="min-w-0">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-base font-semibold text-slate-900">
              {stepsTpl[activeStepIndex]
                ? stepHeading(
                    activeStepIndex,
                    stepsTpl[activeStepIndex]!.name,
                  )
                : "Шаг"}
            </div>
            {!showStepsSidebar ? (
              <div className="mt-1 text-xs text-slate-500">
                Завершено {completedStepCount} из {stepTotal}
              </div>
            ) : null}
          </div>
        </div>

        <div className="space-y-4">
          <FormFields
            order={order}
            stepTemplate={stepsTpl[activeStepIndex]}
            stepExecution={stepsExec[activeStepIndex]}
            canEdit={
              canEdit &&
              !activeStepLocked &&
              stepsExec[activeStepIndex]?.status !== "completed"
            }
            onChange={(fieldId, value) => onChangeField(activeStepIndex, fieldId, value)}
          />

          {canEdit ? (
            <div className="mt-4 flex flex-col items-end gap-2">
              {completeDisabled && missingRequiredFields.length > 0 ? (
                <MissingRequiredFieldsHint fields={missingRequiredFields} />
              ) : null}
              <div className="flex flex-wrap items-center justify-end gap-2">
              {canCompleteActiveStep ? (
                <button
                  type="button"
                  onClick={() => {
                    if (completeDisabled) return;
                    onCompleteStep(activeStepIndex);
                    if (isSingleStepStage) onCompleteStage();
                  }}
                  title={completeTitle}
                  disabled={completeDisabled}
                  className={[
                    "rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50",
                    completeDisabled
                      ? "cursor-not-allowed opacity-60"
                      : "cursor-pointer",
                  ].join(" ")}
                >
                  Завершить
                </button>
              ) : null}
              {!isSingleStepStage && allStepsCompleted ? (
                <button
                  type="button"
                  onClick={onCompleteStage}
                  className="cursor-pointer rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
                >
                  Завершить
                </button>
              ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}

function QualityControlStage({
  stageTemplate,
  stageExecution,
  canEdit,
  onChangeField,
  onConfirm,
}: {
  stageTemplate: StageTemplate;
  stageExecution: ProductionOrder["stages"][number];
  canEdit: boolean;
  onChangeField: (stepIndex: number, fieldId: string, value: FieldValue) => void;
  onConfirm: () => void;
}) {
  const stepTemplate = stageTemplate.steps[0];
  const stepExecution = stageExecution.steps[0];

  if (!stepTemplate || !stepExecution) {
    return <div className="text-sm text-slate-500">Нет данных этапа КК.</div>;
  }

  const editable = canEdit && stepExecution.status !== "completed";
  const missingRequired = stepTemplate.fields.filter((f) => {
    if (!f.required) return false;
    if (f.type === "section_header") return false;
    const raw = stepExecution.fieldValues[f.id];
    if (raw === null || raw === undefined) return true;
    switch (f.type) {
      case "text":
      case "select":
      case "date":
        return typeof raw !== "string" || raw.trim().length === 0;
      case "number":
        return typeof raw !== "number" || Number.isNaN(raw) || raw < 0;
      case "checkbox":
        return raw !== true;
      default:
        return false;
    }
  });
  const confirmDisabled = !editable || missingRequired.length > 0;
  const confirmTitle =
    missingRequired.length > 0
      ? `Заполните обязательные поля: ${missingRequired
          .slice(0, 3)
          .map((f) => f.label)
          .join(", ")}${missingRequired.length > 3 ? "…" : ""}`
      : undefined;

  return (
    <div>
      <div className="mb-3 text-sm text-slate-600">
        {editable ? "Введите показатели и подтвердите результаты." : "Просмотр результатов."}
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2.5 font-medium">Показатель</th>
              <th className="px-4 py-2.5 font-medium">Значение</th>
              <th className="px-4 py-2.5 font-medium">Ед.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {stepTemplate.fields
              .filter((f) => f.type !== "section_header")
              .map((f) => {
                const value = stepExecution.fieldValues[f.id];
                return (
                  <tr
                    key={f.id}
                    data-production-field={f.id}
                    className="hover:bg-slate-50"
                  >
                    <td className="px-4 py-2.5 text-slate-700">{f.label}</td>
                    <td className="px-4 py-2.5">
                      <FieldInput
                        field={f}
                        value={value}
                        disabled={!editable}
                        onChange={(v) => onChangeField(0, f.id, v)}
                      />
                    </td>
                    <td className="px-4 py-2.5 text-slate-500">{f.unit ?? "—"}</td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      {editable ? (
        <div className="mt-4 flex flex-col items-end gap-2">
          {confirmDisabled && missingRequired.length > 0 ? (
            <MissingRequiredFieldsHint fields={missingRequired} />
          ) : null}
          <button
            type="button"
            onClick={() => {
              if (confirmDisabled) return;
              onConfirm();
            }}
            title={confirmTitle}
            disabled={confirmDisabled}
            className={[
              "rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700",
              confirmDisabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
            ].join(" ")}
          >
            Подтвердить результаты
          </button>
        </div>
      ) : null}
    </div>
  );
}

function FormFields({
  order,
  stepTemplate,
  stepExecution,
  canEdit,
  onChange,
}: {
  order: ProductionOrder;
  stepTemplate: StepTemplate | undefined;
  stepExecution: ProductionOrder["stages"][number]["steps"][number] | undefined;
  canEdit: boolean;
  onChange: (fieldId: string, value: FieldValue) => void;
}) {
  if (!stepTemplate || !stepExecution) {
    return <div className="text-sm text-slate-500">Нет данных шага.</div>;
  }

  const sopDownloadHref = `${import.meta.env.BASE_URL}mocks/sop/test-sop.pdf`;

  const resolveValue = (field: FieldDefinition): FieldValue => {
    // ref field
    if (typeof field.refStageIndex === "number" && field.refFieldId) {
      const st = order.stages[field.refStageIndex];
      const val = st?.steps?.[0]?.fieldValues?.[field.refFieldId];
      return val ?? null;
    }
    // ref deviations
    if (field.refDeviations && field.refDeviations.length > 0) {
      const items: string[] = [];
      for (const idx of field.refDeviations) {
        const st = order.stages[idx];
        if (!st) continue;
        for (const step of st.steps) {
          const fv = step.fieldValues;
          const devFlagRaw = fv.devFlag;
          const devNotesRaw = fv.devNotes;
          const devFlagYes =
            devFlagRaw === "Да" ||
            devFlagRaw === true ||
            devFlagRaw === "да";
          const devNotes =
            typeof devNotesRaw === "string" ? devNotesRaw.trim() : "";

          if (step.deviationFlag) {
            const note = step.deviationNotes?.trim();
            items.push(note ? `${st.name}: ${note}` : `${st.name}: отклонение`);
            continue;
          }

          if (devFlagYes || devNotes) {
            items.push(
              devNotes ? `${st.name}: ${devNotes}` : `${st.name}: отклонение`,
            );
          }
        }
      }
      return items.length ? items.join("; ") : "";
    }
    // computed age
    if (field.computeRule === "age_from_date" && field.computedFrom) {
      const raw = stepExecution.fieldValues[field.computedFrom];
      if (typeof raw === "string" && raw) {
        const m = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
        if (!m) return null;
        const y = Number(m[1]);
        const mo = Number(m[2]);
        const d = Number(m[3]);
        const now = new Date();
        if (!Number.isFinite(y) || y < 1900 || y > now.getFullYear()) return null;
        if (!Number.isFinite(mo) || mo < 1 || mo > 12) return null;
        if (!Number.isFinite(d) || d < 1 || d > 31) return null;

        const dob = new Date(y, mo - 1, d);
        if (
          dob.getFullYear() !== y ||
          dob.getMonth() !== mo - 1 ||
          dob.getDate() !== d
        ) {
          return null;
        }

        let age = now.getFullYear() - y;
        const nowMonth = now.getMonth() + 1;
        const nowDay = now.getDate();
        if (nowMonth < mo || (nowMonth === mo && nowDay < d)) age -= 1;
        if (age < 0 || age > 130) return null;
        return age;
      }
      return null;
    }
    return stepExecution.fieldValues[field.id] ?? null;
  };

  return (
    <div className="space-y-3">
      {stepTemplate.fields.map((field) => {
        if (field.id === "seq") {
          return null;
        }
        if (field.id === "executor") {
          return null;
        }
        if (field.type === "section_header") {
          return (
            <div key={field.id} className="pt-2">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <div className="text-sm font-semibold text-slate-900">
                  {field.label}
                </div>
                {field.sopRef || field.sopFileName ? (
                  <div className="text-xs text-slate-500">
                    {field.sopRef ? <span className="font-medium">{field.sopRef}</span> : null}
                    {field.sopRef && field.sopFileName ? " · " : null}
                    {field.sopFileName ? (
                      <a
                        href={sopDownloadHref}
                        tabIndex={-1}
                        target="_blank"
                        rel="noreferrer"
                        className="underline decoration-slate-300 underline-offset-2 transition hover:text-slate-700"
                      >
                        {field.sopFileName}
                      </a>
                    ) : null}
                  </div>
                ) : null}
              </div>
              <div className="mt-2 h-px bg-slate-100" />
            </div>
          );
        }

        const isReadonly =
          !canEdit ||
          Boolean(field.refDeviations?.length) ||
          typeof field.refStageIndex === "number" ||
          Boolean(field.computeRule);

        const value = resolveValue(field);

        if (field.type === "checkbox") {
          return (
            <label
              key={field.id}
              data-production-field={field.id}
              className={[
                "flex items-start gap-3",
                isReadonly ? "cursor-not-allowed" : "cursor-pointer",
              ].join(" ")}
            >
              <input
                type="checkbox"
                checked={Boolean(value)}
                onChange={(e) => onChange(field.id, e.target.checked)}
                disabled={isReadonly}
                className="mt-0.5 size-4 shrink-0 rounded border-slate-300 text-blue-600"
              />
              <span className="min-w-0 text-xs font-medium text-slate-600">
                {field.label}
                {field.required ? <span className="text-red-500"> *</span> : null}
              </span>
            </label>
          );
        }

        return (
          <label key={field.id} className="block" data-production-field={field.id}>
            <div className="mb-1 flex items-baseline justify-between gap-2">
              <div className="text-xs font-medium text-slate-600">
                {field.label}
                {field.required ? <span className="text-red-500"> *</span> : null}
                {field.unit ? (
                  <span className="ml-1 text-[11px] font-normal text-slate-400">
                    ({field.unit})
                  </span>
                ) : null}
              </div>
            </div>
            <FieldInput
              field={field}
              value={value}
              disabled={isReadonly}
              onChange={(v) => onChange(field.id, v)}
            />
          </label>
        );
      })}
    </div>
  );
}

function FieldInput({
  field,
  value,
  disabled,
  onChange,
}: {
  field: FieldDefinition;
  value: FieldValue;
  disabled: boolean;
  onChange: (v: FieldValue) => void;
}) {
  const common =
    "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-400 disabled:bg-slate-50 disabled:text-slate-500";

  if (field.type === "checkbox") {
    return (
      <label className="inline-flex items-center gap-2">
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="size-4 rounded border-slate-300 text-blue-600"
        />
        <span className="text-sm text-slate-700">Да</span>
      </label>
    );
  }

  if (field.type === "select") {
    return (
      <select
        value={typeof value === "string" ? value : value == null ? "" : String(value)}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={common}
      >
        <option value="">Выберите…</option>
        {(field.options ?? []).map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    );
  }

  if (field.type === "date") {
    return (
      <input
        type="date"
        value={typeof value === "string" ? value : ""}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={common}
      />
    );
  }

  if (field.type === "number") {
    return (
      <input
        type="number"
        inputMode="decimal"
        min={0}
        step="any"
        value={typeof value === "number" ? value : value == null ? "" : Number(value)}
        onKeyDown={(e) => {
          if (disabled) return;
          if (
            e.key === "-" ||
            e.key === "e" ||
            e.key === "E" ||
            e.key === "+"
          ) {
            e.preventDefault();
          }
        }}
        onChange={(e) => {
          const t = e.target.value;
          if (t === "") {
            onChange(null);
            return;
          }
          const n = Number(t);
          if (!Number.isFinite(n) || n < 0) return;
          onChange(n);
        }}
        disabled={disabled}
        className={common}
      />
    );
  }

  if (field.type === "text" && field.multiline) {
    return (
      <textarea
        rows={4}
        value={
          typeof value === "string" ? value : value == null ? "" : String(value)
        }
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder={field.placeholder}
        className={`${common} min-h-[5rem] resize-y`}
      />
    );
  }

  return (
    <input
      type="text"
      value={typeof value === "string" ? value : value == null ? "" : String(value)}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      placeholder={field.placeholder}
      className={common}
    />
  );
}

