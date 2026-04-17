import { Link, useNavigate, useParams } from "react-router-dom";
import { useMemo, useState } from "react";
import { ProductionProvider, useProduction } from "../context/ProductionContext";
import {
  type FieldDefinition,
  type FieldValue,
  type ProcessTemplate,
  type ProductionOrder,
  type StageTemplate,
  type StepTemplate,
} from "../mocks/productionData";

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

  const isOrderReadonly = order.status !== "in_progress";
  const isCurrentStage = effectiveActiveStageIndex === order.currentStageIndex;
  const canEditStage = !isOrderReadonly && isCurrentStage;

  const stepsTpl: StepTemplate[] = stageTemplate?.steps ?? [];
  const stepTpl = stepsTpl[activeStepIndex] ?? null;

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
          <div className="mt-1 text-xs text-red-700/80">
            Зафиксировал: {order.rejectedBy || "—"} ·{" "}
            {order.rejectedAt ? formatRuDateTime(order.rejectedAt) : "—"}
          </div>
        </div>
      ) : null}

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 flex-wrap items-center gap-3">
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
            <button
              type="button"
              onClick={() => {
                setRejectReason("");
                setRejectTouched(false);
                setShowReject(true);
              }}
              className="h-9 whitespace-nowrap rounded-lg border border-red-300 bg-red-50 px-4 text-sm font-medium text-red-700 transition hover:bg-red-100"
            >
              Забраковать заказ
            </button>
          ) : null}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-slate-900">
                {stageTemplate?.name ?? stageExecution?.name ?? "Этап"}
              </div>
              <div className="mt-1 text-sm text-slate-500">
                {isCurrentStage ? "Текущий этап" : "Просмотр этапа"} · Доступ:{" "}
                {canEditStage ? "редактирование" : "только просмотр"}
                {stageExecution?.deferred ? " · Ожидает результатов" : ""}
              </div>
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
            className="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
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

            <label className="block">
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
}: {
  status: "in_progress" | "completed" | "rejected";
  reason?: string;
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
        const statusLabel =
          st.status === "completed"
            ? "Готово"
            : st.status === "in_progress"
              ? st.deferred
                ? "Ожидает"
                : "В работе"
              : "Ожидает";
        const badgeCls =
          st.status === "completed"
            ? "bg-slate-100 text-slate-600 ring-slate-500/20"
            : st.status === "in_progress"
              ? st.deferred
                ? "bg-indigo-50 text-indigo-700 ring-indigo-600/20"
                : "bg-amber-50 text-amber-700 ring-amber-500/20"
              : "bg-slate-100 text-slate-600 ring-slate-500/20";

        const pillCls = (() => {
          if (isCurrent) {
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
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset ${badgeCls}`}
              >
                {statusLabel}
              </span>
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
  const firstIncompleteIndex = Math.max(
    0,
    stepsExec.findIndex((s) => s.status !== "completed"),
  );
  const activeStepLocked = activeStepIndex > firstIncompleteIndex;

  return (
    <div
      className={
        showStepsSidebar ? "grid gap-4 lg:grid-cols-[260px_1fr]" : "grid gap-4"
      }
    >
      {showStepsSidebar ? (
        <aside className="rounded-lg border border-slate-200 bg-slate-50 p-3">
          <div className="mb-2 text-xs font-semibold text-slate-600">Шаги</div>
          <nav className="flex flex-col gap-1">
            {stepsTpl.map((s, idx) => {
              const exec = stepsExec[idx];
              const isActive = idx === activeStepIndex;
              const isLocked = idx > firstIncompleteIndex;
              const state =
                exec?.status === "completed"
                  ? "completed"
                  : idx === order.currentStageIndex && idx === 0
                    ? "in_progress"
                    : exec?.status ?? "pending";
              const badge =
                exec?.status === "completed"
                  ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                  : isLocked
                    ? "bg-slate-100 text-slate-500 ring-slate-500/20"
                    : "bg-amber-50 text-amber-700 ring-amber-500/20";
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
                  <span className="min-w-0 whitespace-normal text-slate-800 leading-snug">
                    {s.name}
                  </span>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ring-1 ring-inset ${badge}`}
                  >
                    {state === "completed"
                      ? "готово"
                      : isLocked
                        ? "ожидает"
                        : "в работе"}
                  </span>
                </button>
              );
            })}
          </nav>
        </aside>
      ) : null}

      <section className="min-w-0">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            {showStepsSidebar ? (
              <div className="text-base font-semibold text-slate-900">
                {stepsTpl[activeStepIndex]?.name ?? "Шаг"}
              </div>
            ) : null}
            <div className="mt-1 text-sm text-slate-500">
              {canEdit ? "Заполните поля и завершите шаг." : "Просмотр данных."}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
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
            <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
              {!activeStepLocked &&
              stepsExec[activeStepIndex]?.status !== "completed" ? (
                <button
                  type="button"
                  onClick={() => onCompleteStep(activeStepIndex)}
                  className="cursor-pointer rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  Завершить
                </button>
              ) : null}
              {allStepsCompleted ? (
                <button
                  type="button"
                  onClick={onCompleteStage}
                  className="cursor-pointer rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
                >
                  Завершить
                </button>
              ) : null}
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

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-slate-600">
          {editable ? "Введите показатели и подтвердите результаты." : "Просмотр результатов."}
        </div>
        {editable ? (
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
          >
            Подтвердить результаты
          </button>
        ) : null}
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
                  <tr key={f.id} className="hover:bg-slate-50">
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
          if (step.deviationFlag) {
            const note = step.deviationNotes?.trim();
            items.push(note ? `${st.name}: ${note}` : `${st.name}: отклонение`);
          }
        }
      }
      return items.length ? items.join("; ") : "";
    }
    // computed age
    if (field.computeRule === "age_from_date" && field.computedFrom) {
      const raw = stepExecution.fieldValues[field.computedFrom];
      if (typeof raw === "string" && raw) {
        const dob = new Date(raw);
        if (!Number.isNaN(dob.getTime())) {
          const now = new Date();
          let age = now.getFullYear() - dob.getFullYear();
          const m = now.getMonth() - dob.getMonth();
          if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age -= 1;
          return age;
        }
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
        if (field.type === "section_header") {
          return (
            <div key={field.id} className="pt-2">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
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
            <div
              key={field.id}
              className="flex flex-wrap items-center justify-between gap-3"
            >
              <div className="text-xs font-medium text-slate-600">
                {field.label}
                {field.required ? (
                  <span className="text-red-500"> *</span>
                ) : null}
              </div>
              <FieldInput
                field={field}
                value={value}
                disabled={isReadonly}
                onChange={(v) => onChange(field.id, v)}
              />
            </div>
          );
        }

        return (
          <label key={field.id} className="block">
            <div className="mb-1 flex items-baseline justify-between gap-2">
              <div className="text-xs font-medium text-slate-600">
                {field.label}
                {field.required ? <span className="text-red-500"> *</span> : null}
              </div>
              {field.unit ? (
                <div className="text-[11px] text-slate-400">{field.unit}</div>
              ) : null}
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
        value={typeof value === "number" ? value : value == null ? "" : Number(value)}
        onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
        disabled={disabled}
        className={common}
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

