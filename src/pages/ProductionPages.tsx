import { Link, useNavigate, useParams } from "react-router-dom";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ProductionProvider,
  useProduction,
  type UpdateFieldValueInput,
} from "../context/ProductionContext";
import {
  PRODUCTION_REJECTION_PHASE_LABELS,
  type FieldDefinition,
  type FieldReferenceRange,
  type FieldValue,
  type ProcessTemplate,
  type ProductionOrder,
  type ProductionOrderStatus,
  type ProductionRejectionAttachment,
  type ProductionRejectionPhase,
  type StageTemplate,
  type StageType,
  type StepTemplate,
} from "../mocks/productionData";
import {
  getRegistrationPatientFields,
  getReleaseIssueConfirmSummary,
  isReleaseStageCompleted,
  type ReleaseIssueConfirmSummary,
} from "../lib/productionReleaseAct";

const REJECTION_PHASE_OPTIONS = Object.entries(
  PRODUCTION_REJECTION_PHASE_LABELS,
) as [ProductionRejectionPhase, string][];

/** Типовые причины брака (модалка подтверждения). */
const REJECTION_TYPICAL_REASON_OPTIONS = [
  { id: "hemolysis", label: "Гемолиз" },
  { id: "low_volume", label: "Недостаточный объём" },
  { id: "contamination", label: "Контаминация" },
  { id: "expiry", label: "Нарушение срока" },
  { id: "other", label: "Другое" },
] as const;

const MAX_REJECT_ATTACHMENTS = 6;
const MAX_REJECT_FILE_BYTES = 4 * 1024 * 1024;

const PRODUCTION_LIST_PAGE_SIZE = 15;

/** Убирает ведущую нумерацию вида «1. » из подписи этапа (пиллы и заголовок). */
function formatStageLabel(label: string): string {
  return label.replace(/^\d+\.\s*/, "");
}

/** Ведущий номер из названия шага вида «1. …» для подписей «Действие 1.n». */
function parseProductionStepMajor(stepName: string): number | null {
  const m = stepName.trim().match(/^(\d+)\s*[.)]\s*/u);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function isCrossStageRefField(field: FieldDefinition): boolean {
  return typeof field.refStageIndex === "number" && Boolean(field.refFieldId);
}

/** Пилл «из этапа …» для ref-полей (выдача: ФИО, ИБ, ID продукта и т.д.). */
function refFieldCrossStageBadge(
  order: ProductionOrder,
  refStageIndex: number,
): { text: string; title: string } {
  const st = order.stages[refStageIndex];
  const name = st?.name?.trim();
  if (name) {
    const short = formatStageLabel(name);
    return {
      text: `из этапа: ${short}`,
      title: `Значение из этапа «${short}»`,
    };
  }
  return {
    text: "из данных этапа",
    title: "Значение подставлено из другого этапа",
  };
}

/** Локализованная подпись статуса заказа на производство. */
function formatOrderStatus(status: ProductionOrderStatus): string {
  switch (status) {
    case "completed":
      return "Завершён";
    case "rejected":
      return "Брак";
    case "in_progress":
    default:
      return "В работе";
  }
}

function compareProductionOrderNumbers(
  a: ProductionOrder,
  b: ProductionOrder,
): number {
  const sa = a.id.replace(/^po-?/i, "");
  const sb = b.id.replace(/^po-?/i, "");
  const na = /^\d+$/.test(sa) ? BigInt(sa) : null;
  const nb = /^\d+$/.test(sb) ? BigInt(sb) : null;
  if (na !== null && nb !== null) {
    if (na < nb) return -1;
    if (na > nb) return 1;
    return 0;
  }
  return sa.localeCompare(sb, "ru", { numeric: true });
}

type ProductionListSortKey = "number" | "product" | "date";

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
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [productFilter, setProductFilter] = useState<string>("all");
  const [stageFilter, setStageFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [listSortKey, setListSortKey] =
    useState<ProductionListSortKey>("date");
  const [listSortDir, setListSortDir] = useState<"asc" | "desc">("desc");

  const toggleListSort = (key: ProductionListSortKey) => {
    setPage(1);
    if (listSortKey === key) {
      setListSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setListSortKey(key);
      setListSortDir(key === "date" ? "desc" : "asc");
    }
  };

  /** Активная колонка — ↑/↓; остальные — серая ↕ («можно сортировать»). */
  const listSortColumnHint = (key: ProductionListSortKey) =>
    listSortKey === key ? (
      <span className="tabular-nums text-slate-500" aria-hidden>
        {listSortDir === "asc" ? "↑" : "↓"}
      </span>
    ) : (
      <span className="tabular-nums text-slate-400" aria-hidden>
        ↕
      </span>
    );

  const sortedOrders = useMemo(() => {
    const list = [...orders];
    const dir = listSortDir === "asc" ? 1 : -1;
    list.sort((a, b) => {
      let cmp = 0;
      switch (listSortKey) {
        case "number":
          cmp = compareProductionOrderNumbers(a, b);
          break;
        case "product":
          cmp = a.templateName.localeCompare(b.templateName, "ru", {
            sensitivity: "base",
          });
          break;
        case "date":
          cmp =
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
      }
      return cmp * dir;
    });
    return list;
  }, [orders, listSortKey, listSortDir]);

  const productOptions = useMemo(() => {
    const byId = new Map<string, string>();
    for (const t of templates) {
      byId.set(t.id, t.name);
    }
    for (const o of orders) {
      if (!byId.has(o.templateId)) {
        byId.set(o.templateId, o.templateName);
      }
    }
    return [...byId.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, "ru"));
  }, [templates, orders]);

  const stageOptions = useMemo(() => {
    const names = new Set<string>();
    for (const t of templates) {
      for (const s of t.stages) {
        names.add(formatStageLabel(s.name));
      }
    }
    if (names.size === 0) {
      for (const o of orders) {
        const raw = o.stages[o.currentStageIndex]?.name;
        if (raw) names.add(formatStageLabel(raw));
      }
    }
    return [...names].sort((a, b) => a.localeCompare(b, "ru"));
  }, [templates, orders]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sortedOrders.filter((order) => {
      if (statusFilter !== "all" && order.status !== statusFilter) {
        return false;
      }
      if (productFilter !== "all" && order.templateId !== productFilter) {
        return false;
      }
      if (stageFilter !== "all") {
        const raw = order.stages[order.currentStageIndex]?.name ?? "";
        const stageLabel = raw ? formatStageLabel(raw) : "";
        if (stageLabel !== stageFilter) return false;
      }
      if (!q) return true;
      const { patientName, caseNumber } = getRegistrationPatientFields(order);
      const fioQ = patientName.toLowerCase();
      const ibQ = caseNumber.toLowerCase();
      const idFull = order.id.toLowerCase();
      const idShort = order.id.replace(/^po-?/i, "").toLowerCase();
      return (
        fioQ.includes(q) ||
        ibQ.includes(q) ||
        idFull.includes(q) ||
        idShort.includes(q)
      );
    });
  }, [sortedOrders, statusFilter, productFilter, stageFilter, search]);

  const totalPages = Math.max(
    1,
    Math.ceil(filtered.length / PRODUCTION_LIST_PAGE_SIZE),
  );
  const safePage = Math.min(page, totalPages);
  const shown = filtered.slice(
    (safePage - 1) * PRODUCTION_LIST_PAGE_SIZE,
    safePage * PRODUCTION_LIST_PAGE_SIZE,
  );

  const hasActiveFilters =
    statusFilter !== "all" ||
    productFilter !== "all" ||
    stageFilter !== "all";

  const resetFilters = () => {
    setStatusFilter("all");
    setProductFilter("all");
    setStageFilter("all");
    setSearch("");
    setPage(1);
  };

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

  useEffect(() => {
    if (!showCreate) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowCreate(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [showCreate]);

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
    <div className="p-6 md:p-8 relative">
      {filtersOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 pt-16"
          onClick={() => setFiltersOpen(false)}
        >
          <div
            className="relative w-full max-w-lg rounded-xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Фильтры журнала производства"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Фильтры</h2>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
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

            <div className="grid gap-4">
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
                  Статус
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setPage(1);
                    setStatusFilter(e.target.value);
                  }}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="all">Все</option>
                  <option value="in_progress">
                    {formatOrderStatus("in_progress")}
                  </option>
                  <option value="completed">
                    {formatOrderStatus("completed")}
                  </option>
                  <option value="rejected">
                    {formatOrderStatus("rejected")}
                  </option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
                  Продукт
                </label>
                <select
                  value={productFilter}
                  onChange={(e) => {
                    setPage(1);
                    setProductFilter(e.target.value);
                  }}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="all">Все</option>
                  {productOptions.map(({ id, name }) => (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
                  Текущий этап
                </label>
                <select
                  value={stageFilter}
                  onChange={(e) => {
                    setPage(1);
                    setStageFilter(e.target.value);
                  }}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="all">Все</option>
                  {stageOptions.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between border-t border-slate-200 pt-4">
              <button
                type="button"
                onClick={resetFilters}
                className="text-sm font-medium text-slate-600 underline decoration-slate-300 underline-offset-2 hover:text-slate-900"
              >
                Сбросить фильтры
              </button>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white shadow hover:bg-slate-700"
              >
                Закрыть
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Производство</h1>
          <p className="mt-1 text-sm text-slate-500">
            Журнал заказов на производство.
          </p>
        </div>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          placeholder="Поиск по номеру заказа, ФИО и № ИБ…"
          className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
        />
        <button
          type="button"
          onClick={() => setShowCreate(true)}
          className="shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          Начать производство
        </button>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <th
                  className="px-4 py-3 font-medium"
                  scope="col"
                  aria-sort={
                    listSortKey === "number"
                      ? listSortDir === "asc"
                        ? "ascending"
                        : "descending"
                      : "none"
                  }
                >
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 font-medium text-slate-600 hover:text-slate-900"
                    onClick={() => toggleListSort("number")}
                  >
                    Номер
                    {listSortColumnHint("number")}
                  </button>
                </th>
                <th
                  className="px-4 py-3 font-medium"
                  scope="col"
                  aria-sort={
                    listSortKey === "product"
                      ? listSortDir === "asc"
                        ? "ascending"
                        : "descending"
                      : "none"
                  }
                >
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 font-medium text-slate-600 hover:text-slate-900"
                    onClick={() => toggleListSort("product")}
                  >
                    Продукт
                    {listSortColumnHint("product")}
                  </button>
                </th>
                <th className="px-4 py-3 font-medium" scope="col">
                  ФИО пациента
                </th>
                <th className="px-4 py-3 font-medium whitespace-nowrap" scope="col">
                  № ИБ
                </th>
                <th
                  className="px-4 py-3 font-medium"
                  scope="col"
                  aria-sort={
                    listSortKey === "date"
                      ? listSortDir === "asc"
                        ? "ascending"
                        : "descending"
                      : "none"
                  }
                >
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 font-medium text-slate-600 hover:text-slate-900"
                    onClick={() => toggleListSort("date")}
                  >
                    Дата регистрации
                    {listSortColumnHint("date")}
                  </button>
                </th>
                <th className="px-4 py-3 font-medium whitespace-nowrap">
                  Статус
                </th>
                <th className="px-4 py-3 font-medium">Текущий этап</th>
                <th className="px-4 py-3 font-medium">Создатель</th>
              </tr>
            </thead>
            <tbody>
              {sortedOrders.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-12 text-center text-slate-500"
                  >
                    Нет заказов на производство.
                  </td>
                </tr>
              ) : shown.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-12 text-center text-slate-500"
                  >
                    Нет записей по фильтрам.
                  </td>
                </tr>
              ) : (
                shown.map((order) => {
                  const showCurrentStageColumn = order.status === "in_progress";
                  const rawStage =
                    order.stages[order.currentStageIndex]?.name ?? "—";
                  const currentStage =
                    rawStage === "—" ? "—" : formatStageLabel(rawStage);
                  const { patientName, caseNumber } =
                    getRegistrationPatientFields(order);
                  return (
                    <tr
                      key={order.id}
                      onClick={() => handleOpenOrder(order.id)}
                      className="cursor-pointer border-b border-slate-100 last:border-0 hover:bg-slate-50/80"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">
                        {order.id.replace(/^po-/, "")}
                      </td>
                      <td className="px-4 py-3 text-slate-800 font-medium">
                        {order.templateName}
                      </td>
                      <td className="max-w-[12rem] truncate px-4 py-3 text-slate-700">
                        {patientName || "—"}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">
                        {caseNumber || "—"}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {formatRuDateTime(order.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {showCurrentStageColumn ? currentStage : ""}
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

        {sortedOrders.length > 0 ? (
          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-600">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setFiltersOpen(true)}
                className={`relative rounded-md border border-slate-300 bg-white p-2 shadow-sm hover:bg-slate-50 ${hasActiveFilters ? "border-slate-400 bg-slate-100 ring-2 ring-slate-200" : ""}`}
                aria-label="Открыть фильтры"
                title="Фильтры"
              >
                <svg
                  className="size-4 text-slate-600"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                </svg>
                {hasActiveFilters ? (
                  <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full border-2 border-white bg-emerald-500" />
                ) : null}
              </button>
              <span>
                Показано{" "}
                <strong className="font-medium text-slate-800">
                  {filtered.length === 0
                    ? 0
                    : (safePage - 1) * PRODUCTION_LIST_PAGE_SIZE + 1}
                  –
                  {Math.min(
                    safePage * PRODUCTION_LIST_PAGE_SIZE,
                    filtered.length,
                  )}
                </strong>{" "}
                из{" "}
                <strong className="font-medium text-slate-800">
                  {filtered.length}
                </strong>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                ← Назад
              </button>
              <span className="tabular-nums text-slate-700">
                Стр. {safePage} / {totalPages}
              </span>
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Вперёд →
              </button>
            </div>
          </footer>
        ) : null}
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
  const [rejectTypicalReason, setRejectTypicalReason] = useState("");
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
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  const resetRejectForm = useCallback(() => {
    setRejectTypicalReason("");
    setRejectReason("");
    setRejectTouched(false);
    setRejectPhase("incoming_material");
    setRejectAttachments([]);
    setRejectAttachError(null);
    if (rejectFileRef.current) rejectFileRef.current.value = "";
  }, []);

  const requestCloseRejectModal = useCallback(() => {
    const dirty =
      rejectTypicalReason !== "" ||
      rejectReason.trim() !== "" ||
      rejectAttachments.length > 0 ||
      rejectPhase !== "incoming_material";
    if (dirty && !confirm("Отменить, данные будут потеряны?")) return;
    resetRejectForm();
    setShowReject(false);
  }, [
    rejectTypicalReason,
    rejectReason,
    rejectAttachments.length,
    rejectPhase,
    resetRejectForm,
  ]);

  useEffect(() => {
    if (!showReject) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        requestCloseRejectModal();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [showReject, requestCloseRejectModal]);

  const effectiveActiveStageIndex =
    activeStageIndex ?? (order ? order.currentStageIndex : 0);

  useEffect(() => {
    setLastSavedAt(null);
  }, [orderId]);

  const patchUpdateFieldValue = useCallback(
    (input: UpdateFieldValueInput) => {
      updateFieldValue(input);
      setLastSavedAt(new Date().toISOString());
    },
    [updateFieldValue],
  );

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
  const stageTitle = formatStageLabel(
    stageTemplate?.name ?? stageExecution?.name ?? "Этап",
  );

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

  const rejectError = rejectTouched
    ? !rejectTypicalReason
      ? "Выберите типовую причину."
      : rejectTypicalReason === "other" && !rejectReason.trim()
        ? "Укажите причину брака."
        : null
    : null;

  const releasePrintHref = `${import.meta.env.BASE_URL}proizvodstvo/${encodeURIComponent(order.id)}/print`;
  const printActEnabled =
    order.status !== "rejected" && isReleaseStageCompleted(order);
  const rejectFromMenuEnabled = order.status === "in_progress";
  const printMenuTitle = printActEnabled
    ? "Открыть печатную форму в новой вкладке"
    : order.status === "rejected"
      ? "Недоступно для забракованного заказа"
      : "Доступно после завершения этапа «Выдача»";
  const rejectMenuTitle = rejectFromMenuEnabled
    ? undefined
    : order.status === "rejected"
      ? "Заказ уже забракован"
      : "Недоступно после завершения этапа «Выдача»";

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
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
            <span className="ml-2 text-base font-normal text-slate-500">
              · {formatOrderStatus(order.status)}
            </span>
          </h1>
        </div>
        <div className="flex max-w-full flex-wrap items-center justify-end gap-x-2 gap-y-1 sm:max-w-[min(100%,42rem)]">
          <p className="text-right text-sm leading-snug text-slate-500">
            {order.templateName} · Создал: {order.createdBy} · Дата регистрации:{" "}
            {formatRuDateTime(order.createdAt)}
          </p>
          <StageActionsMenu
            releasePrintHref={releasePrintHref}
            printEnabled={printActEnabled}
            printTitle={printMenuTitle}
            rejectEnabled={rejectFromMenuEnabled}
            rejectTitle={rejectMenuTitle}
            onReject={() => {
              resetRejectForm();
              setShowReject(true);
            }}
          />
        </div>
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
            {canEditStage && lastSavedAt ? (
              <span
                className="inline-flex shrink-0 items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-900 ring-1 ring-emerald-600/20"
                title="Локальное автосохранение черновика"
              >
                Сохранено {formatSavedClock(lastSavedAt)}
              </span>
            ) : null}
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
                  patchUpdateFieldValue({
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
                  scrollProductionOrderMainToTop();
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
                  patchUpdateFieldValue({
                    orderId: order.id,
                    stageIndex: effectiveActiveStageIndex,
                    stepIndex,
                    fieldId,
                    value,
                    updatedBy: "Смирнова А.",
                  })
                }
                onChangeConsumableQty={(stepIndex, consumableId, consumableQty) =>
                  patchUpdateFieldValue({
                    orderId: order.id,
                    stageIndex: effectiveActiveStageIndex,
                    stepIndex,
                    consumableId,
                    consumableQty,
                    updatedBy: "Смирнова А.",
                  })
                }
                onChangeEquipment={(stepIndex, equipmentId, equipmentApplied) =>
                  patchUpdateFieldValue({
                    orderId: order.id,
                    stageIndex: effectiveActiveStageIndex,
                    stepIndex,
                    equipmentId,
                    equipmentApplied,
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
                  scrollProductionOrderMainToTop();
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
          onClick={() => requestCloseRejectModal()}
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
                onClick={() => requestCloseRejectModal()}
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
              <legend className="mb-1 text-xs font-medium text-slate-600">
                Этап брака
              </legend>
              <p className="mb-2 text-xs leading-snug text-slate-500">
                Названия совпадают с этапами процесса в шаблоне заказа.
              </p>
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
                Типовая причина
              </div>
              <select
                value={rejectTypicalReason}
                onChange={(e) => {
                  const v = e.target.value;
                  setRejectTypicalReason(v);
                  if (v !== "other") setRejectReason("");
                }}
                onBlur={() => setRejectTouched(true)}
                className={`w-full rounded-lg border bg-white px-3 py-2 text-sm outline-none transition ${
                  rejectTouched && !rejectTypicalReason
                    ? "border-red-300 focus:border-red-400"
                    : "border-slate-200 focus:border-blue-400"
                }`}
              >
                <option value="">Выберите…</option>
                {REJECTION_TYPICAL_REASON_OPTIONS.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>

            {rejectTypicalReason === "other" ? (
              <label className="mt-4 block">
                <div className="mb-1 text-xs font-medium text-slate-600">
                  Уточнение (обязательно)
                </div>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  onBlur={() => setRejectTouched(true)}
                  rows={4}
                  className={`w-full resize-none rounded-lg border px-3 py-2 text-sm outline-none transition ${
                    rejectTouched &&
                    rejectTypicalReason === "other" &&
                    !rejectReason.trim()
                      ? "border-red-300 bg-red-50 focus:border-red-400"
                      : "border-slate-200 focus:border-blue-400"
                  }`}
                  placeholder="Опишите причину брака…"
                />
              </label>
            ) : null}
            {rejectError ? (
              <div className="mt-2 text-xs text-red-600">{rejectError}</div>
            ) : null}

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
                onClick={() => requestCloseRejectModal()}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-50"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={() => {
                  setRejectTouched(true);
                  if (!rejectTypicalReason) return;
                  const preset = REJECTION_TYPICAL_REASON_OPTIONS.find(
                    (o) => o.id === rejectTypicalReason,
                  );
                  let finalReason = "";
                  if (rejectTypicalReason === "other") {
                    if (!rejectReason.trim()) return;
                    finalReason = rejectReason.trim();
                  } else {
                    finalReason = preset?.label ?? "";
                  }
                  if (!finalReason) return;
                  rejectOrder({
                    orderId: order.id,
                    rejectedBy: "Смирнова А.",
                    rejectedReason: finalReason,
                    rejectedPhase: rejectPhase,
                    rejectedAttachments:
                      rejectAttachments.length > 0
                        ? rejectAttachments
                        : undefined,
                    rejectedStageIndex: order.currentStageIndex,
                    rejectedStepTemplateId: stepTpl?.id,
                  });
                  resetRejectForm();
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

function StageActionsMenu({
  onReject,
  releasePrintHref,
  printEnabled,
  printTitle,
  rejectEnabled,
  rejectTitle,
}: {
  onReject: () => void;
  releasePrintHref: string;
  printEnabled: boolean;
  printTitle?: string;
  rejectEnabled: boolean;
  rejectTitle?: string;
}) {
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
        className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:bg-slate-50"
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
          className="absolute right-0 z-20 mt-2 min-w-[13.5rem] overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
        >
          <button
            type="button"
            role="menuitem"
            disabled={!printEnabled}
            title={printTitle}
            className={[
              "w-full cursor-pointer px-3 py-2 text-left text-sm transition disabled:cursor-pointer",
              printEnabled
                ? "text-slate-800 hover:bg-slate-50"
                : "text-slate-400",
            ].join(" ")}
            onClick={() => {
              if (!printEnabled) return;
              setOpen(false);
              window.open(releasePrintHref, "_blank", "noopener,noreferrer");
            }}
          >
            Печать акта выдачи
          </button>
          <div className="my-0.5 border-t border-slate-100" role="separator" />
          <button
            type="button"
            role="menuitem"
            disabled={!rejectEnabled}
            title={rejectTitle}
            className={[
              "w-full cursor-pointer px-3 py-2 text-left text-sm transition disabled:cursor-pointer",
              rejectEnabled
                ? "text-red-700 hover:bg-red-50"
                : "text-slate-400",
            ].join(" ")}
            onClick={() => {
              if (!rejectEnabled) return;
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

/** Прокрутка области контента приложения (`main` в AppLayout) к началу после смены этапа. */
function scrollProductionOrderMainToTop() {
  const run = () => {
    const main = document.querySelector("main");
    if (!main) return;
    const ae = document.activeElement;
    if (ae instanceof HTMLElement && main.contains(ae)) {
      ae.blur();
    }
    main.scrollTo({ top: 0, behavior: "auto" });
  };
  // После закрытия модалки фокус часто возвращается на кнопку внизу страницы и снова
  // прокручивает main — откладываем и повторяем, чтобы оказаться вверху.
  window.setTimeout(run, 0);
  window.setTimeout(run, 100);
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

/** Время автосохранения для бейджа (локальные часы). */
function formatSavedClock(iso: string): string {
  const d = new Date(iso);
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  const s = String(d.getSeconds()).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

type StageDotVisual = "done" | "active" | "error" | "pending";

function getStageDotVisual(
  order: ProductionOrder,
  st: ProductionOrder["stages"][number],
  idx: number,
): StageDotVisual {
  if (order.status === "rejected" && order.rejectedStageIndex === idx) {
    return "error";
  }
  if (st.status === "completed") return "done";
  if (st.status === "in_progress") return "active";
  return "pending";
}

function stageDotClass(visual: StageDotVisual, isActive: boolean): string {
  const base =
    "relative z-10 flex h-9 w-9 shrink-0 origin-center items-center justify-center rounded-full text-sm font-semibold tabular-nums transition duration-200 ease-out group-hover:scale-[1.12] motion-reduce:group-hover:scale-100";
  const body = (() => {
    switch (visual) {
      case "done":
        return "bg-emerald-500 text-white shadow-sm group-hover:bg-emerald-600";
      case "active":
        if (isActive)
          return "bg-amber-400 text-amber-950 shadow-sm group-hover:bg-amber-300";
        return "bg-amber-400 text-amber-950 shadow-sm ring-2 ring-amber-500/45 group-hover:bg-amber-300";
      case "error":
        return "bg-red-600 text-white shadow-sm group-hover:bg-red-700";
      default:
        return "bg-white text-slate-500 group-hover:bg-slate-50";
    }
  })();
  const ring = (() => {
    if (visual === "active" && !isActive) return "";
    if (!isActive) {
      if (visual === "pending") return " ring-2 ring-slate-300";
      return "";
    }
    switch (visual) {
      case "done":
        return " ring-2 ring-emerald-500 ring-offset-2 ring-offset-white";
      case "active":
        return " ring-2 ring-amber-500 ring-offset-2 ring-offset-white";
      case "error":
        return " ring-2 ring-red-500 ring-offset-2 ring-offset-white";
      default:
        return " ring-2 ring-slate-400 ring-offset-2 ring-offset-white";
    }
  })();
  return `${base} ${body}${ring}`;
}

/** Цвет названия этапа при ховере — в тон состоянию (как кружок и бейдж). */
function stageStepperTitleHoverClass(visual: StageDotVisual): string {
  switch (visual) {
    case "done":
      return "group-hover:text-emerald-800";
    case "active":
      return "group-hover:text-amber-900";
    case "error":
      return "group-hover:text-red-800";
    default:
      return "group-hover:text-slate-600";
  }
}

function getStageStepperColumnStatus(
  order: ProductionOrder,
  st: ProductionOrder["stages"][number],
  idx: number,
): { text: string; pillClass: string } {
  if (order.status === "rejected" && order.rejectedStageIndex === idx) {
    return {
      text: "Брак",
      pillClass:
        "bg-red-50 text-red-800 ring-1 ring-inset ring-red-200/90",
    };
  }
  if (st.status === "completed") {
    return {
      text: "Завершён",
      pillClass:
        "bg-emerald-50 text-emerald-800 ring-1 ring-inset ring-emerald-200/80",
    };
  }
  if (st.status === "in_progress") {
    if (st.deferred) {
      return {
        text: "Отложено",
        pillClass:
          "bg-slate-100 text-slate-700 ring-1 ring-inset ring-slate-200",
      };
    }
    return {
      text: "В работе",
      pillClass:
        "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-500/20",
    };
  }
  return {
    text: "Ожидается",
    pillClass: "bg-white text-slate-600 ring-1 ring-inset ring-slate-200",
  };
}

function StatusBadge({
  status,
}: {
  status: "in_progress" | "completed" | "rejected";
}) {
  const style =
    status === "completed"
      ? "bg-slate-100 text-slate-600 ring-slate-500/20"
      : status === "rejected"
        ? "bg-red-50 text-red-700 ring-red-600/20"
        : "bg-amber-50 text-amber-700 ring-amber-500/20";

  const label = formatOrderStatus(status);

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${style}`}
    >
      {label}
    </span>
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
  const stageCount = order.stages.length;

  const lastIdx = stageCount - 1;

  return (
    <nav
      aria-label="Прогресс по этапам"
      className="w-full max-w-full overflow-x-visible overflow-y-visible"
    >
      <ol className="flex list-none flex-wrap items-stretch justify-stretch gap-y-3 overflow-visible p-0 sm:flex-nowrap">
        {order.stages.map((st, idx) => {
          const tplName = template?.stages[idx]?.name;
          const name = formatStageLabel(
            tplName ?? st.name ?? `Этап ${idx + 1}`,
          );
          const isActive = idx === activeStageIndex;
          const visual = getStageDotVisual(order, st, idx);
          const prevDone =
            idx > 0 && order.stages[idx - 1]?.status === "completed";
          const segmentAfterDone = st.status === "completed";
          const { text: statusText, pillClass: statusPillClass } =
            getStageStepperColumnStatus(order, st, idx);

          return (
            <li
              key={`stage-col-${st.stageTemplateId}-${idx}`}
              className="flex min-w-0 flex-1 basis-[7.5rem] list-none flex-col overflow-visible"
            >
              <button
                type="button"
                onClick={() => onSelectStage(idx)}
                aria-current={isActive ? "step" : undefined}
                className={[
                  "group relative z-0 flex h-full w-full min-w-0 cursor-pointer flex-col items-center gap-1 overflow-visible rounded-xl border border-transparent px-0 py-1.5 text-center transition duration-200 ease-out",
                  "hover:z-[1]",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500",
                ].join(" ")}
              >
                <div className="flex h-9 w-full min-w-0 self-stretch items-center overflow-visible">
                  <div className="flex min-h-0 min-w-0 flex-1 items-center justify-end overflow-visible">
                    {idx > 0 ? (
                      <div
                        className={[
                          "h-1 min-w-2 shrink-0 rounded-none",
                          // квадратные торцы + 1px на стыке колонок (убирает субпиксельный разрыв)
                          "-ml-px w-[calc(100%+1px)]",
                          prevDone ? "bg-emerald-400" : "bg-slate-200",
                        ].join(" ")}
                      />
                    ) : (
                      <div className="h-1 w-full min-w-0" aria-hidden />
                    )}
                  </div>
                  <span
                    className={stageDotClass(visual, isActive)}
                    aria-hidden
                  >
                    {idx + 1}
                  </span>
                  <div className="flex min-h-0 min-w-0 flex-1 items-center justify-start overflow-visible">
                    {idx < lastIdx ? (
                      <div
                        className={[
                          "h-1 min-w-2 shrink-0 rounded-none",
                          "-mr-px w-[calc(100%+1px)]",
                          segmentAfterDone ? "bg-emerald-400" : "bg-slate-200",
                        ].join(" ")}
                      />
                    ) : (
                      <div className="h-1 w-full min-w-0" aria-hidden />
                    )}
                  </div>
                </div>
                <div className="flex w-full flex-col items-center gap-1 px-1.5">
                  <span
                    className={[
                      "whitespace-nowrap text-center text-sm font-semibold leading-snug text-slate-900",
                      "transition-colors duration-200 ease-out",
                      stageStepperTitleHoverClass(visual),
                    ].join(" ")}
                  >
                    {name}
                  </span>
                  <span
                    className={[
                      "mt-0.5 inline-flex justify-center rounded-full px-2.5 py-1 text-center text-xs font-medium",
                      statusPillClass,
                    ].join(" ")}
                  >
                    {statusText}
                  </span>
                </div>
                <span className="sr-only">
                  {`Этап ${idx + 1} из ${stageCount}: ${name}, ${statusText}`}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/** Подтверждение необратимого действия (завершение шага / этапа / КК). */
function IrreversibleConfirmModal({
  open,
  title,
  description,
  confirmLabel = "Да, завершить",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 pt-16 pb-8"
      onClick={onCancel}
      role="presentation"
    >
      <div
        className="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="irreversible-confirm-title"
      >
        <h2
          id="irreversible-confirm-title"
          className="text-lg font-semibold text-slate-900"
        >
          {title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          {description}
        </p>
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/** Финальное подтверждение перед фиксацией этапа «Выдача». */
function ReleaseIssueConfirmModal({
  open,
  summary,
  confirmLabel = "Подтвердить выдачу",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  summary: ReleaseIssueConfirmSummary;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  const row = (term: string, value: string, mono = false) => (
    <div className="grid grid-cols-[minmax(0,9.5rem)_1fr] gap-x-3 gap-y-1 border-b border-slate-100 py-2 text-sm last:border-b-0 sm:grid-cols-[11rem_1fr]">
      <dt className="text-slate-500">{term}</dt>
      <dd
        className={`min-w-0 break-words text-slate-900 ${mono ? "font-mono text-xs" : ""}`}
      >
        {value}
      </dd>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 pt-16 pb-8"
      onClick={onCancel}
      role="presentation"
    >
      <div
        className="mx-4 w-full max-w-lg rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="release-issue-confirm-title"
      >
        <h2
          id="release-issue-confirm-title"
          className="text-lg font-semibold text-slate-900"
        >
          Подтверждение выдачи
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">
          Проверьте данные перед фиксацией. После подтверждения этап «Выдача» будет
          закрыт, правки станут недоступны.
        </p>

        <div className="mt-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Реквизиты
          </div>
          <dl className="mt-1 rounded-lg border border-slate-200 bg-slate-50/60 px-3">
            {row("Заказ", summary.orderId, true)}
            {row("Продукт", summary.productName)}
            {row("ID продукта", summary.productId, true)}
            {row("ФИО пациента", summary.patientName)}
            {row("№ ИБ", summary.caseNumber, true)}
            {row("Куда выдано", summary.destination)}
          </dl>
        </div>

        <div className="mt-4">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Сводка
          </div>
          <dl className="mt-1 rounded-lg border border-slate-200 bg-slate-50/60 px-3">
            {row("Отклонения (сводка)", summary.deviations)}
            {row("Технологический процесс выполнил", summary.processBy)}
            {row("Одобрил", summary.approvedBy)}
          </dl>
        </div>

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
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
  onChangeConsumableQty,
  onChangeEquipment,
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
  onChangeConsumableQty: (
    stepIndex: number,
    consumableId: string,
    qty: number,
  ) => void;
  onChangeEquipment: (
    stepIndex: number,
    equipmentId: string,
    applied: boolean,
  ) => void;
  onCompleteStep: (stepIndex: number) => void;
  onCompleteStage: () => void;
}) {
  const stepsTpl = stageTemplate.steps;
  const stepsExec = stageExecution.steps;

  /** После этапа с несколькими шагами индекс мог остаться вне диапазона (напр. 1 при одном шаге выдачи). */
  useEffect(() => {
    const n = stepsTpl.length;
    if (n === 0) return;
    const clamped = Math.max(0, Math.min(activeStepIndex, n - 1));
    if (clamped !== activeStepIndex) {
      onSelectStep(clamped);
    }
  }, [
    stageExecution.stageTemplateId,
    stepsTpl.length,
    activeStepIndex,
    onSelectStep,
  ]);

  const stageMarkedComplete = stageExecution.status === "completed";
  const allStepsCompleted =
    stageMarkedComplete ||
    stepsExec.every((s) => s.status === "completed");
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
  const completedStepCount = stageMarkedComplete
    ? stepTotal
    : stepsExec.filter((s) => s.status === "completed").length;
  const stepHeading = (stepIndex: number, name: string) =>
    `Шаг ${stepIndex + 1} из ${stepTotal}: ${formatStageLabel(name)}`;

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
    canEdit &&
    !activeStepLocked &&
    !stageMarkedComplete &&
    activeStepExec?.status !== "completed";
  const completeDisabled =
    !canCompleteActiveStep || missingRequiredFields.length > 0;
  const completeTitle =
    missingRequiredFields.length > 0
      ? `Заполните обязательные поля: ${missingRequiredFields
          .slice(0, 3)
          .map((f) => f.label)
          .join(", ")}${missingRequiredFields.length > 3 ? "…" : ""}`
      : undefined;

  const [confirmKind, setConfirmKind] = useState<null | "step" | "stage">(
    null,
  );

  useEffect(() => {
    setConfirmKind(null);
  }, [activeStepIndex]);

  useEffect(() => {
    setConfirmKind(null);
  }, [completeDisabled]);

  useEffect(() => {
    setConfirmKind(null);
  }, [allStepsCompleted, activeStepIndex]);

  const isReleaseIssueFinal =
    stageTemplate.type === "release" &&
    (confirmKind === "stage" ||
      (confirmKind === "step" && isSingleStepStage));

  const releaseSummaryStep =
    confirmKind === "stage"
      ? stepsExec[stepsExec.length - 1]
      : stepsExec[activeStepIndex];

  const releaseSummary = getReleaseIssueConfirmSummary(
    order,
    releaseSummaryStep,
  );

  const confirmCompletionAndClose = () => {
    if (confirmKind === "step") {
      if (completeDisabled) return;
      onCompleteStep(activeStepIndex);
      if (isSingleStepStage) onCompleteStage();
    } else if (confirmKind === "stage") {
      onCompleteStage();
    }
    setConfirmKind(null);
  };

  return (
    <>
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
              const stepDone =
                stageMarkedComplete || exec?.status === "completed";
              const state = stepDone
                ? "completed"
                : sequentialLockEnabled && idx === firstIncompleteIndex
                  ? "in_progress"
                  : exec?.status === "in_progress"
                    ? "in_progress"
                    : "pending";
              const blockStepNum = firstIncompleteIndex + 1;
              const lockHint = `Завершите шаг ${blockStepNum}, чтобы перейти к этому`;
              const lockHintId = `production-step-lock-hint-${s.id}`;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => {
                    if (isLocked) return;
                    onSelectStep(idx);
                  }}
                  aria-disabled={isLocked}
                  aria-describedby={isLocked ? lockHintId : undefined}
                  title={isLocked ? lockHint : undefined}
                  tabIndex={isLocked ? -1 : undefined}
                  className={[
                    "flex items-center justify-between gap-3 rounded-md px-3 py-2 text-left text-sm transition",
                    isActive
                      ? "bg-white shadow-sm ring-1 ring-slate-200"
                      : isLocked
                        ? "cursor-not-allowed opacity-70"
                        : "hover:bg-white/70",
                  ].join(" ")}
                >
                  <span className="min-w-0 flex-1">
                    <span className="block whitespace-normal text-slate-800 leading-snug">
                      {stepHeading(idx, s.name)}
                    </span>
                    {stepDone &&
                    (exec?.completedBy || stageExecution.completedBy) &&
                    (exec?.completedAt || stageExecution.completedAt) ? (
                      <span className="mt-1 block text-[11px] leading-snug text-slate-500">
                        Завершил:{" "}
                        {exec?.completedBy ?? stageExecution.completedBy} ·{" "}
                        {formatRuDateTime(
                          exec?.completedAt ?? stageExecution.completedAt!,
                        )}
                      </span>
                    ) : null}
                  </span>
                  <span className="flex shrink-0 items-center gap-1.5">
                    {isLocked ? (
                      <>
                        <span id={lockHintId} className="sr-only">
                          {lockHint}
                        </span>
                        <svg
                          className="size-4 shrink-0 text-slate-400"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={1.5}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden
                        >
                          <path d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75M6.75 10.5h10.5a2.25 2.25 0 012.25 2.25v6.75a2.25 2.25 0 01-2.25 2.25H6.75a2.25 2.25 0 01-2.25-2.25v-6.75a2.25 2.25 0 012.25-2.25z" />
                        </svg>
                      </>
                    ) : null}
                    {state === "in_progress" ? (
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-700 ring-1 ring-inset ring-amber-500/20">
                        в работе
                      </span>
                    ) : null}
                  </span>
                </button>
              );
            })}
          </nav>
        </aside>
      ) : null}

      <section className="min-w-0">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <div className="text-base font-semibold text-slate-900">
                {activeStepTpl
                  ? stepHeading(activeStepIndex, activeStepTpl.name)
                  : "Шаг"}
              </div>
              <SopAttachmentLink
                sopRef={activeStepTpl?.sopRef}
                sopFileName={activeStepTpl?.sopFileName}
              />
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
              !stageMarkedComplete &&
              stepsExec[activeStepIndex]?.status !== "completed"
            }
            onChange={(fieldId, value) => onChangeField(activeStepIndex, fieldId, value)}
            onChangeConsumableQty={(consumableId, qty) =>
              onChangeConsumableQty(activeStepIndex, consumableId, qty)
            }
            onChangeEquipment={(equipmentId, applied) =>
              onChangeEquipment(activeStepIndex, equipmentId, applied)
            }
            stageType={stageTemplate.type}
            productionStepMajor={
              parseProductionStepMajor(stepsTpl[activeStepIndex]?.name ?? "") ??
              activeStepIndex + 1
            }
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
                      setConfirmKind("step");
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
                    onClick={() => setConfirmKind("stage")}
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
    {confirmKind !== null && isReleaseIssueFinal ? (
      <ReleaseIssueConfirmModal
        open
        summary={releaseSummary}
        onCancel={() => setConfirmKind(null)}
        onConfirm={confirmCompletionAndClose}
      />
    ) : (
      <IrreversibleConfirmModal
        open={confirmKind !== null}
        title={
          confirmKind === "stage"
            ? "Завершить этап?"
            : "Завершить шаг?"
        }
        description={
          confirmKind === "stage"
            ? "Этап будет отмечен завершённым. Правки данных этого этапа после этого будут недоступны."
            : isSingleStepStage
              ? "Шаг и этап будут завершены. Правки данных этапа после этого будут недоступны."
              : "Шаг будет отмечен завершённым. Убедитесь, что все данные введены верно."
        }
        onCancel={() => setConfirmKind(null)}
        onConfirm={confirmCompletionAndClose}
      />
    )}
    </>
  );
}

function formatQcReferenceCell(range: FieldReferenceRange | undefined): string {
  if (!range) return "—";
  const { min, max } = range;
  if (min !== undefined && max !== undefined) return `${min}–${max}`;
  if (min !== undefined) return `≥ ${min}`;
  if (max !== undefined) return `≤ ${max}`;
  return "—";
}

function qcValueOutOfRange(
  value: FieldValue,
  range: FieldReferenceRange | undefined,
): boolean {
  if (!range) return false;
  if (typeof value !== "number" || Number.isNaN(value)) return false;
  if (range.min !== undefined && value < range.min) return true;
  if (range.max !== undefined && value > range.max) return true;
  return false;
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
  const [qcConfirmOpen, setQcConfirmOpen] = useState(false);

  const editable = Boolean(
    stepTemplate &&
      stepExecution &&
      canEdit &&
      stepExecution.status !== "completed",
  );

  const missingRequired =
    stepTemplate && stepExecution
      ? stepTemplate.fields.filter((f) => {
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
        })
      : [];

  const confirmDisabled = !editable || missingRequired.length > 0;
  const confirmTitle =
    missingRequired.length > 0
      ? `Заполните обязательные поля: ${missingRequired
          .slice(0, 3)
          .map((f) => f.label)
          .join(", ")}${missingRequired.length > 3 ? "…" : ""}`
      : undefined;

  useEffect(() => {
    setQcConfirmOpen(false);
  }, [confirmDisabled]);

  if (!stepTemplate || !stepExecution) {
    return <div className="text-sm text-slate-500">Нет данных этапа КК.</div>;
  }

  const qcTableFields = stepTemplate.fields.filter(
    (f) =>
      f.type !== "section_header" && !(f.type === "text" && f.multiline),
  );
  const qcMultilineFields = stepTemplate.fields.filter(
    (f) => f.type === "text" && f.multiline,
  );
  const qcTextareaCls =
    "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-400 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-600 min-h-[6rem] resize-y";

  return (
    <>
    <div>
      <div className="mb-3 text-sm text-slate-600">
        {editable ? "Введите показатели и подтвердите результаты." : "Просмотр результатов."}
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-2.5 font-medium">Показатель</th>
              <th className="px-4 py-2.5 font-medium">Норма</th>
              <th className="px-4 py-2.5 font-medium">Значение</th>
              <th className="px-4 py-2.5 font-medium">Ед.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {qcTableFields.map((f) => {
              const value = stepExecution.fieldValues[f.id];
              const out = qcValueOutOfRange(value, f.referenceRange);
              return (
                <tr
                  key={f.id}
                  data-production-field={f.id}
                  className="hover:bg-slate-50"
                >
                  <td className="px-4 py-2.5 text-slate-700">{f.label}</td>
                  <td className="whitespace-nowrap px-4 py-2.5 text-slate-600 tabular-nums">
                    {formatQcReferenceCell(f.referenceRange)}
                  </td>
                  <td className="px-4 py-2.5">
                    <FieldInput
                      field={f}
                      value={value}
                      disabled={!editable}
                      onChange={(v) => onChangeField(0, f.id, v)}
                      className={
                        out
                          ? "font-medium text-red-600 disabled:text-red-600"
                          : undefined
                      }
                    />
                  </td>
                  <td className="px-4 py-2.5 text-slate-500">{f.unit ?? "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {qcMultilineFields.length > 0 ? (
        <div className="mt-4 space-y-4">
          {qcMultilineFields.map((f) => {
            const value = stepExecution.fieldValues[f.id];
            const str =
              typeof value === "string"
                ? value
                : value == null
                  ? ""
                  : String(value);
            return (
              <label key={f.id} className="block" data-production-field={f.id}>
                <div className="mb-1 text-sm font-semibold text-slate-900">
                  {f.label}
                </div>
                <textarea
                  rows={4}
                  value={str}
                  onChange={(e) => onChangeField(0, f.id, e.target.value)}
                  readOnly={!editable}
                  disabled={false}
                  placeholder={f.placeholder}
                  className={[
                    qcTextareaCls,
                    !editable ? "border-slate-100 bg-slate-50" : "",
                  ].join(" ")}
                  aria-label={f.label}
                />
              </label>
            );
          })}
        </div>
      ) : null}

      {editable ? (
        <div className="mt-4 flex flex-col items-end gap-2">
          {confirmDisabled && missingRequired.length > 0 ? (
            <MissingRequiredFieldsHint fields={missingRequired} />
          ) : null}
          <button
            type="button"
            onClick={() => {
              if (confirmDisabled) return;
              setQcConfirmOpen(true);
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
    <IrreversibleConfirmModal
      open={qcConfirmOpen}
      title="Подтвердить результаты?"
      description="Результаты контроля качества будут зафиксированы, этап завершён. Изменение показателей после этого будет недоступно."
      confirmLabel="Да, подтвердить"
      onCancel={() => setQcConfirmOpen(false)}
      onConfirm={() => {
        if (confirmDisabled) return;
        onConfirm();
        setQcConfirmOpen(false);
      }}
    />
    </>
  );
}

type ProductionChecklistSegment =
  | { kind: "section"; field: FieldDefinition }
  | { kind: "action"; minor: number; fields: FieldDefinition[] }
  | { kind: "trailing"; fields: FieldDefinition[] };

function isHiddenProductionMetaField(field: FieldDefinition): boolean {
  return field.id === "seq" || field.id === "executor";
}

/** Группы «чек-листа»: чекбокс + следующие не-checkbox поля до следующего чекбокса/секции. */
function buildProductionChecklistSegments(
  fields: FieldDefinition[],
): ProductionChecklistSegment[] {
  const segments: ProductionChecklistSegment[] = [];
  let minor = 0;
  let i = 0;

  while (i < fields.length) {
    const f = fields[i]!;
    if (isHiddenProductionMetaField(f)) {
      i++;
      continue;
    }

    if (f.type === "section_header") {
      segments.push({ kind: "section", field: f });
      i++;
      continue;
    }

    if (f.type === "checkbox") {
      minor += 1;
      const chunk: FieldDefinition[] = [f];
      i++;
      while (i < fields.length) {
        const nf = fields[i]!;
        if (isHiddenProductionMetaField(nf)) {
          i++;
          continue;
        }
        if (nf.type === "section_header" || nf.type === "checkbox") break;
        chunk.push(nf);
        i++;
      }
      segments.push({ kind: "action", minor, fields: chunk });
      continue;
    }

    const chunk: FieldDefinition[] = [];
    while (i < fields.length) {
      const nf = fields[i]!;
      if (isHiddenProductionMetaField(nf)) {
        i++;
        continue;
      }
      if (nf.type === "section_header" || nf.type === "checkbox") break;
      chunk.push(nf);
      i++;
    }
    if (chunk.length > 0) {
      segments.push({ kind: "trailing", fields: chunk });
    }
  }

  return segments;
}

function sopMockDocumentHref(): string {
  return `${import.meta.env.BASE_URL}mocks/sop/test-sop.pdf`;
}

/** СОП / файл: как на регистрации — ссылка открывает моковый PDF в новой вкладке. */
function SopAttachmentLink({
  sopRef,
  sopFileName,
  tabIndex,
}: {
  sopRef?: string;
  sopFileName?: string;
  /** Для вложенных подписей формы — не забирать фокус с клавиатуры (как у section_header). */
  tabIndex?: number;
}) {
  if (!sopRef && !sopFileName) return null;
  const href = sopMockDocumentHref();
  return (
    <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 text-xs text-slate-500">
      {sopRef ? <span className="font-medium text-slate-600">{sopRef}</span> : null}
      {sopRef && sopFileName ? <span className="text-slate-300">·</span> : null}
      {sopFileName ? (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          tabIndex={tabIndex}
          className="underline decoration-slate-300 underline-offset-2 transition hover:text-slate-700"
        >
          {sopFileName}
        </a>
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
  onChangeConsumableQty,
  onChangeEquipment,
  stageType,
  productionStepMajor,
}: {
  order: ProductionOrder;
  stepTemplate: StepTemplate | undefined;
  stepExecution: ProductionOrder["stages"][number]["steps"][number] | undefined;
  canEdit: boolean;
  onChange: (fieldId: string, value: FieldValue) => void;
  onChangeConsumableQty: (consumableId: string, qty: number) => void;
  onChangeEquipment: (equipmentId: string, applied: boolean) => void;
  stageType: StageType;
  productionStepMajor: number;
}) {
  if (!stepTemplate || !stepExecution) {
    return <div className="text-sm text-slate-500">Нет данных шага.</div>;
  }

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

  const renderSectionHeader = (field: FieldDefinition) => (
    <div className="pt-2">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <div className="text-sm font-semibold text-slate-900">{field.label}</div>
        <SopAttachmentLink
          sopRef={field.sopRef}
          sopFileName={field.sopFileName}
          tabIndex={-1}
        />
      </div>
      <div className="mt-2 h-px bg-slate-100" />
    </div>
  );

  const renderFieldRow = (field: FieldDefinition) => {
    const isReadonly =
      !canEdit ||
      Boolean(field.refDeviations?.length) ||
      typeof field.refStageIndex === "number" ||
      Boolean(field.computeRule);

    const value = resolveValue(field);
    const crossRef =
      isCrossStageRefField(field) && field.refStageIndex !== undefined
        ? refFieldCrossStageBadge(order, field.refStageIndex)
        : null;

    const refBadgeEl = crossRef ? (
      <span
        className="inline-flex max-w-full shrink-0 items-center truncate rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-medium text-sky-900 ring-1 ring-inset ring-sky-300/60"
        title={crossRef.title}
      >
        {crossRef.text}
      </span>
    ) : null;

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
          <span className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="text-xs font-medium text-slate-600">
              {field.label}
              {field.required ? <span className="text-red-500"> *</span> : null}
            </span>
            {refBadgeEl}
          </span>
        </label>
      );
    }

    return (
      <label key={field.id} className="block" data-production-field={field.id}>
        <div className="mb-1 flex flex-wrap items-baseline gap-x-2 gap-y-1">
          <div className="text-xs font-medium text-slate-600">
            {field.label}
            {field.required ? <span className="text-red-500"> *</span> : null}
            {field.unit ? (
              <span className="ml-1 text-[11px] font-normal text-slate-400">
                ({field.unit})
              </span>
            ) : null}
          </div>
          {refBadgeEl}
        </div>
        <FieldInput
          field={field}
          value={value}
          disabled={isReadonly}
          onChange={(v) => onChange(field.id, v)}
          tone={crossRef ? "crossStageRef" : "default"}
        />
      </label>
    );
  };

  const checklistSegments =
    stageType === "production"
      ? buildProductionChecklistSegments(stepTemplate.fields)
      : null;

  const fieldsBody =
    stageType === "production" && checklistSegments ? (
      <div className="space-y-4">
        {checklistSegments.map((seg, segIdx) => {
          if (seg.kind === "section") {
            return (
              <div key={seg.field.id}>{renderSectionHeader(seg.field)}</div>
            );
          }
          if (seg.kind === "action") {
            return (
              <div
                key={`action-${seg.minor}-${seg.fields[0]!.id}`}
                className="rounded-lg border border-slate-200 bg-slate-50/50 p-3 shadow-sm"
              >
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
                  Действие {productionStepMajor}.{seg.minor}
                </div>
                <div className="space-y-3">
                  {seg.fields.map((f) => renderFieldRow(f))}
                </div>
              </div>
            );
          }
          const precededByAction = checklistSegments
            .slice(0, segIdx)
            .some((s) => s.kind === "action");
          return (
            <div
              key={`trail-${seg.fields.map((f) => f.id).join("-")}`}
              className={
                precededByAction
                  ? "space-y-3 border-t border-slate-200 pt-4"
                  : "space-y-3"
              }
            >
              {seg.fields.map((f) => renderFieldRow(f))}
            </div>
          );
        })}
      </div>
    ) : (
      <div className="space-y-3">
        {stepTemplate.fields.map((field) => {
          if (field.id === "seq" || field.id === "executor") {
            return null;
          }
          if (field.type === "section_header") {
            return <div key={field.id}>{renderSectionHeader(field)}</div>;
          }
          return renderFieldRow(field);
        })}
      </div>
    );

  return (
    <div className="space-y-3">
      {fieldsBody}

      {stepTemplate.consumables.length > 0 ? (
        <div className="pt-4">
          <div className="mb-2 text-sm font-semibold text-slate-900">
            Расходные материалы
          </div>
          <div className="max-w-full overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-max max-w-full border-collapse text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-2.5 font-medium">Наименование</th>
                  <th className="px-4 py-2.5 font-medium">Кол-во</th>
                  <th className="px-4 py-2.5 font-medium">Ед.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stepTemplate.consumables.map((c) => {
                  const rawQty = stepExecution.consumableValues?.[c.id];
                  const qty =
                    typeof rawQty === "number" && Number.isFinite(rawQty)
                      ? Math.max(0, rawQty)
                      : 0;
                  const rowDisabled = !canEdit;
                  const inputCls =
                    "w-24 rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm outline-none transition focus:border-blue-400 disabled:bg-slate-50 disabled:text-slate-500";
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80">
                      <td className="max-w-md whitespace-normal px-4 py-2.5 text-slate-700">
                        {c.name}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 align-middle">
                        <input
                          type="number"
                          inputMode="numeric"
                          min={0}
                          step={1}
                          value={qty}
                          onKeyDown={(e) => {
                            if (rowDisabled) return;
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
                            if (rowDisabled) return;
                            const t = e.target.value;
                            if (t === "") {
                              onChangeConsumableQty(c.id, 0);
                              return;
                            }
                            const n = Number(t);
                            if (!Number.isFinite(n) || n < 0) return;
                            onChangeConsumableQty(c.id, Math.floor(n));
                          }}
                          disabled={rowDisabled}
                          className={inputCls}
                          aria-label={`Количество: ${c.name}`}
                        />
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 align-middle text-xs tabular-nums text-slate-500">
                        {c.unit}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {stepTemplate.equipment.length > 0 ? (
        <div className="pt-4">
          <div className="mb-2 text-sm font-semibold text-slate-900">
            Оборудование
          </div>
          <ul className="space-y-2">
            {stepTemplate.equipment.map((eItem) => {
              const applied = Boolean(
                stepExecution.equipmentValues?.[eItem.id],
              );
              const rowDisabled = !canEdit;
              return (
                <li key={eItem.id}>
                  <label
                    className={[
                      "flex items-start gap-3",
                      rowDisabled ? "cursor-not-allowed" : "cursor-pointer",
                    ].join(" ")}
                  >
                    <input
                      type="checkbox"
                      checked={applied}
                      onChange={(ev) =>
                        onChangeEquipment(eItem.id, ev.target.checked)
                      }
                      disabled={rowDisabled}
                      className="mt-0.5 size-4 shrink-0 rounded border-slate-300 text-blue-600"
                    />
                    <span className="min-w-0 text-xs font-medium text-slate-600">
                      {eItem.name}
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function FieldInput({
  field,
  value,
  disabled,
  onChange,
  className,
  tone = "default",
}: {
  field: FieldDefinition;
  value: FieldValue;
  disabled: boolean;
  onChange: (v: FieldValue) => void;
  /** Дополнительные классы для поля ввода (например подсветка отклонения от нормы). */
  className?: string;
  /** Подсветка значения с другого этапа — один контур, без вложенного блока. */
  tone?: "default" | "crossStageRef";
}) {
  const commonDefault =
    "w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-400 disabled:bg-slate-50 disabled:text-slate-500";
  const commonCrossRef =
    "w-full rounded-lg border border-sky-400 bg-sky-50/60 px-3 py-2 text-sm text-slate-800 outline-none shadow-sm transition focus:border-sky-500 focus:ring-2 focus:ring-sky-400/25 disabled:bg-slate-50 disabled:text-slate-500";
  const common =
    tone === "crossStageRef" ? commonCrossRef : commonDefault;
  const controlCls = className ? `${common} ${className}` : common;

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
        className={controlCls}
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
        className={controlCls}
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
        className={controlCls}
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
        className={`${controlCls} min-h-[5rem] resize-y`}
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
      className={controlCls}
    />
  );
}

