import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { WriteOffProvider, useWriteOff } from "../context/WriteOffContext";
import {
  WRITE_OFF_REASONS,
  WRITE_OFF_ACTIONS,
  getReasonLabel,
  USERS,
  MOCK_CATALOG,
  MOCK_STOCK_LINES,
} from "../mocks/writeOffData";

const PAGE_SIZE = 15;

/* ===========================
   LIST PAGE
   =========================== */

export function WriteOffListPage() {
  return (
    <WriteOffProvider>
      <WriteOffListContent />
    </WriteOffProvider>
  );
}

function WriteOffListContent() {
  const { sessions, createSession } = useWriteOff();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [showDevTools, setShowDevTools] = useState(false);
  const STORAGE_KEY = "bio-writeoffs";

  const clearLocalStorage = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      window.location.reload();
    } catch {
      // ignore
    }
  };

  const handleCreate = () => {
    const newSession = createSession();
    navigate(`/sklad/spisaniya/${newSession.id}`);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sessions.filter((s) => {
      if (statusFilter !== "all" && s.status !== statusFilter) return false;
      if (!q) return true;
      const nomenclatureNames = s.lines
        .map((l) => l.nomenclatureName.toLowerCase())
        .join(" ");
      const lots = s.lines.map((l) => l.lot.toLowerCase()).join(" ");
      return (
        nomenclatureNames.includes(q) ||
        lots.includes(q) ||
        s.id.toLowerCase().includes(q) ||
        s.createdBy.toLowerCase().includes(q)
      );
    });
  }, [sessions, statusFilter, search]);

  const total = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, total);
  const shown = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const resetFilters = () => {
    setStatusFilter("all");
    setSearch("");
    setPage(1);
  };

  const hasActiveFilters = statusFilter !== "all";

  return (
    <div className="p-6 md:p-8 relative">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Списания
        </h1>
      </header>

      {/* Modal filters */}
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
            aria-label="Фильтры списаний"
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
                  <option value="draft">В процессе</option>
                  <option value="completed">Завершено</option>
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
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            <p className="mb-4 text-sm text-slate-600">
              Очистка localStorage удалит все данные списаний.
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
                onClick={clearLocalStorage}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-red-500"
              >
                Очистить localStorage
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="mb-4 flex items-center gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          placeholder="Поиск по номенклатуре или лоту…"
          className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
        />
        <button
          onClick={handleCreate}
          className="shrink-0 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-red-500"
        >
          Создать списание
        </button>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <th className="px-4 py-3 font-medium">Номер</th>
                <th className="px-4 py-3 font-medium">Дата</th>
                <th className="px-4 py-3 font-medium">Создал</th>
                <th className="px-4 py-3 font-medium">Номенклатура</th>
                <th className="px-4 py-3 font-medium">Лоты</th>
                <th className="px-4 py-3 font-medium text-right">
                  Общее кол-во
                </th>
                <th className="px-4 py-3 font-medium whitespace-nowrap">
                  Статус
                </th>
              </tr>
            </thead>
            <tbody>
              {shown.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-12 text-center text-slate-500"
                  >
                    {filtered.length === 0
                      ? "Нет записей по фильтрам."
                      : "Нет документов списания."}
                  </td>
                </tr>
              ) : (
                shown.map((s) => {
                  const totalQty = s.lines.reduce(
                    (sum, l) => sum + l.quantity,
                    0,
                  );
                  const names = [
                    ...new Set(s.lines.map((l) => l.nomenclatureName)),
                  ];
                  const lots = [...new Set(s.lines.map((l) => l.lot))];

                  return (
                    <tr
                      key={s.id}
                      onClick={() => navigate(`/sklad/spisaniya/${s.id}`)}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50/80 cursor-pointer"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">
                        {s.id.replace("wo-", "")}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {formatRuDateTime(s.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {s.createdBy}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {names.slice(0, 2).map((n) => (
                            <span
                              key={n}
                              className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-700"
                            >
                              {n}
                            </span>
                          ))}
                          {names.length > 2 && (
                            <span className="inline-flex items-center text-xs text-slate-500">
                              +{names.length - 2}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {lots.slice(0, 2).map((l) => (
                            <span
                              key={l}
                              className="inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-mono text-slate-600"
                            >
                              {l}
                            </span>
                          ))}
                          {lots.length > 2 && (
                            <span className="inline-flex items-center text-xs text-slate-500">
                              +{lots.length - 2}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium text-slate-700">
                        {totalQty}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                            s.status === "completed"
                              ? "bg-slate-100 text-slate-600 ring-slate-500/20"
                              : "bg-amber-50 text-amber-700 ring-amber-500/20"
                          }`}
                        >
                          {s.status === "completed"
                            ? "Завершено"
                            : "В процессе"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination footer — filter button on the left */}
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
              >
                <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
              </svg>
              {hasActiveFilters && (
                <span className="absolute -right-0.5 -top-0.5 size-2 rounded-full border-2 border-white bg-emerald-500"></span>
              )}
            </button>
            <span>
              Показано{" "}
              <strong className="font-medium text-slate-800">
                {filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1}–
                {Math.min(safePage * PAGE_SIZE, filtered.length)}
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
              Стр. {safePage} / {total}
            </span>
            <button
              type="button"
              disabled={safePage >= total}
              onClick={() => setPage((p) => Math.min(total, p + 1))}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Вперёд →
            </button>
          </div>
        </footer>
      </div>

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
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>
    </div>
  );
}

/* ===========================
   SESSION DETAIL PAGE
   =========================== */

export function WriteOffSessionPage() {
  return (
    <WriteOffProvider>
      <WriteOffSessionContent />
    </WriteOffProvider>
  );
}

function WriteOffSessionContent() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const {
    sessions,
    addLine,
    removeLine,
    updateLineQuantity,
    updateLineReason,
    updateLineComment,
    updateCommission,
    updateAction,
    completeSession,
    saveDraft,
    deleteSession,
  } = useWriteOff();

  const session = useMemo(
    () => sessions.find((s) => s.id === sessionId) ?? null,
    [sessions, sessionId],
  );

  const [page, setPage] = useState(1);
  const [editingCell, setEditingCell] = useState<{
    lineIndex: number;
    field: "qty" | "comment";
  } | null>(null);
  const [confirmComplete, setConfirmComplete] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saveToast, setSaveToast] = useState<{
    message: string;
    details: string;
  } | null>(null);
  const saveToastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Inline new row state
  const [newRow, setNewRow] = useState({
    nomenclatureId: "",
    lot: "",
    quantity: "",
    place: "",
    reason: "",
    comment: "",
  });
  const [qtyError, setQtyError] = useState("");
  const [showNewRow, setShowNewRow] = useState(false);

  const isEditable = session?.status === "draft";

  // Only show catalog items with balance > 0
  const catalogWithStock = useMemo(() => {
    const idsWithStock = new Set(
      MOCK_STOCK_LINES.filter((s) => s.quantity > 0).map(
        (s) => s.nomenclatureId,
      ),
    );
    return MOCK_CATALOG.filter((c) => idsWithStock.has(c.id));
  }, []);

  const selectedCatalogItem = useMemo(() => {
    if (!newRow.nomenclatureId) return null;
    return MOCK_CATALOG.find((c) => c.id === newRow.nomenclatureId) ?? null;
  }, [newRow.nomenclatureId]);

  const selectedLotData = useMemo(() => {
    if (!selectedCatalogItem || !newRow.lot) return null;
    return selectedCatalogItem.lots.find((l) => l.code === newRow.lot) ?? null;
  }, [selectedCatalogItem, newRow.lot]);

  const maxAvailableQty = useMemo(() => {
    if (!selectedCatalogItem || !newRow.lot || !newRow.place) return 0;
    return MOCK_STOCK_LINES.reduce(
      (sum, s) =>
        s.nomenclatureId === selectedCatalogItem.id &&
        s.lot === newRow.lot &&
        s.place === newRow.place
          ? sum + s.quantity
          : sum,
      0,
    );
  }, [selectedCatalogItem, newRow.lot, newRow.place]);

  const getExpiryDate = useCallback(
    (nomenclatureId: string, lotCode: string): string | null => {
      const item = MOCK_CATALOG.find((c) => c.id === nomenclatureId);
      if (!item) return null;
      const lot = item.lots.find((l) => l.code === lotCode);
      return lot?.expiryDate ?? null;
    },
    [],
  );

  const handleSaveDraft = () => {
    if (!session) return;
    const result = saveDraft(session.id);
    const time = formatRuTime(result.savedAt);
    setSaveToast({
      message: "Черновик сохранён",
      details: `${time}`,
    });
    if (saveToastTimer.current) clearTimeout(saveToastTimer.current);
    saveToastTimer.current = setTimeout(() => setSaveToast(null), 4000);
  };

  const handleDelete = () => {
    if (!session) return;
    const ok = deleteSession(session.id);
    if (ok) navigate("/sklad/spisaniya", { replace: true });
  };

  const handleAddRow = () => {
    if (!session) return;
    if (!selectedCatalogItem) return;
    const qty = parseInt(newRow.quantity, 10);
    if (!qty || qty <= 0) {
      setQtyError("Введите количество");
      return;
    }
    if (qty > maxAvailableQty) {
      setQtyError(`Максимум: ${maxAvailableQty}`);
      return;
    }
    setQtyError("");
    addLine(session.id, {
      nomenclatureId: selectedCatalogItem.id,
      nomenclatureName: selectedCatalogItem.name,
      group: selectedCatalogItem.group,
      manufacturer: selectedCatalogItem.manufacturer,
      lot: newRow.lot,
      place: newRow.place,
      quantity: qty,
      reason: newRow.reason,
      comment: newRow.comment,
    });
    setNewRow({
      nomenclatureId: "",
      lot: "",
      quantity: "",
      place: "",
      reason: "",
      comment: "",
    });
    setShowNewRow(false);
  };

  useEffect(() => {
    if (!session && sessionId) navigate("/sklad/spisaniya", { replace: true });
  }, [session, sessionId, navigate]);

  if (!session) return null;

  const totalPages = Math.max(1, Math.ceil(session.lines.length / PAGE_SIZE));
  const paginatedLines = useMemo(
    () => session.lines.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [session, page],
  );

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <Link
              to="/sklad/spisaniya"
              className="text-sm text-slate-500 transition hover:text-slate-700"
              title="К списку списаний"
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
            <h1 className="text-xl font-semibold text-slate-800">Списание</h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            от {formatRuDateTime(session.createdAt)} · Создал:{" "}
            {session.createdBy}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!isEditable && (
            <button
              onClick={() =>
                window.open(
                  `${import.meta.env.BASE_URL}sklad/spisaniya/${session.id}/print`,
                  "_blank",
                  "width=900,height=700",
                )
              }
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              title="Печать акта списания"
            >
              <div className="flex items-center gap-1.5">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                  />
                </svg>
                Печать
              </div>
            </button>
          )}
          {isEditable && (
            <>
              <button
                onClick={handleSaveDraft}
                className="rounded-lg border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100"
              >
                <div className="flex items-center gap-1.5">
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                    />
                  </svg>
                  Сохранить черновик
                </div>
              </button>
              <button
                onClick={() => setConfirmComplete(true)}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
              >
                Завершить
              </button>
              <button
                onClick={() => setConfirmDelete(true)}
                className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100"
                title="Удалить черновик"
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </>
          )}
          {!isEditable && (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              Завершено
            </span>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2.5 font-medium">Номенклатура</th>
                <th className="px-4 py-2.5 font-medium">Место хранения</th>
                <th className="px-4 py-2.5 font-medium">Лот</th>
                <th className="px-4 py-2.5 font-medium">Срок годности</th>
                <th className="px-4 py-2.5 font-medium">Кол-во</th>
                <th className="px-4 py-2.5 font-medium">Причина</th>
                <th className="px-4 py-2.5 font-medium">Комментарий</th>
                {isEditable && (
                  <th className="px-4 py-2.5 font-medium w-10"></th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {/* Existing rows */}
              {paginatedLines.map((line) => {
                const realIndex = session.lines.indexOf(line);
                return (
                  <tr
                    key={`${line.nomenclatureId}-${line.lot}-${line.place}`}
                    className="transition hover:bg-slate-50"
                  >
                    <td className="px-4 py-2.5">
                      <div className="font-medium text-slate-800">
                        {line.nomenclatureName}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {line.group}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {line.manufacturer}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">{line.place}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-slate-600">
                      {line.lot}
                    </td>
                    <td className="px-4 py-2.5 text-slate-600 text-xs">
                      {getExpiryDate(line.nomenclatureId, line.lot) || "—"}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">
                      {isEditable ? (
                        editingCell?.lineIndex === realIndex &&
                        editingCell?.field === "qty" ? (
                          <input
                            type="number"
                            min={0}
                            autoFocus
                            defaultValue={line.quantity}
                            onBlur={(e) => {
                              const val = Math.max(
                                0,
                                parseInt(e.target.value, 10) || 0,
                              );
                              updateLineQuantity(session.id, realIndex, val);
                              setEditingCell(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                const val = Math.max(
                                  0,
                                  parseInt(
                                    (e.target as HTMLInputElement).value,
                                    10,
                                  ) || 0,
                                );
                                updateLineQuantity(session.id, realIndex, val);
                                setEditingCell(null);
                              }
                              if (e.key === "Escape") setEditingCell(null);
                            }}
                            className="w-20 rounded border border-blue-300 bg-blue-50 px-2 py-1 text-right text-sm tabular-nums outline-none focus:border-blue-500"
                          />
                        ) : (
                          <button
                            onClick={() =>
                              setEditingCell({
                                lineIndex: realIndex,
                                field: "qty",
                              })
                            }
                            className="w-20 rounded border border-transparent bg-transparent px-2 py-1 text-right text-sm tabular-nums text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                          >
                            {line.quantity}
                          </button>
                        )
                      ) : (
                        <span className="text-sm tabular-nums text-slate-700">
                          {line.quantity}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-2.5">
                      {isEditable ? (
                        <select
                          value={line.reason}
                          onChange={(e) =>
                            updateLineReason(
                              session.id,
                              realIndex,
                              e.target.value,
                            )
                          }
                          className={`rounded-lg border px-3 py-1.5 text-sm outline-none transition ${
                            line.reason
                              ? "border-slate-200 bg-white focus:border-blue-400"
                              : "border-amber-300 bg-amber-50 text-amber-700 focus:border-amber-500"
                          }`}
                        >
                          <option value="">— Выберите —</option>
                          {WRITE_OFF_REASONS.map((r) => (
                            <option key={r.id} value={r.id}>
                              {r.label}
                            </option>
                          ))}
                        </select>
                      ) : line.reason ? (
                        <span className="text-sm text-slate-700">
                          {getReasonLabel(line.reason)}
                        </span>
                      ) : (
                        <span className="text-sm text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-2.5 max-w-[140px]">
                      {isEditable ? (
                        editingCell?.lineIndex === realIndex &&
                        editingCell?.field === "comment" ? (
                          <input
                            type="text"
                            autoFocus
                            defaultValue={line.comment}
                            onBlur={(e) => {
                              updateLineComment(
                                session.id,
                                realIndex,
                                e.target.value,
                              );
                              setEditingCell(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                updateLineComment(
                                  session.id,
                                  realIndex,
                                  (e.target as HTMLInputElement).value,
                                );
                                setEditingCell(null);
                              }
                              if (e.key === "Escape") setEditingCell(null);
                            }}
                            placeholder="Комментарий…"
                            className="w-full rounded border border-blue-300 bg-blue-50 px-2 py-1 text-xs outline-none focus:border-blue-500"
                          />
                        ) : (
                          <button
                            onClick={() =>
                              setEditingCell({
                                lineIndex: realIndex,
                                field: "comment",
                              })
                            }
                            className="w-full truncate rounded border border-transparent bg-transparent px-2 py-1 text-left text-xs text-slate-500 transition hover:border-slate-300 hover:bg-slate-50"
                            title={line.comment || "Добавить комментарий"}
                          >
                            {line.comment || (
                              <span className="text-slate-300">+ добавить</span>
                            )}
                          </button>
                        )
                      ) : (
                        <span
                          className="block truncate text-xs text-slate-500"
                          title={line.comment}
                        >
                          {line.comment || "—"}
                        </span>
                      )}
                    </td>
                    {isEditable && (
                      <td className="px-4 py-2.5 text-center">
                        <button
                          onClick={() => removeLine(session.id, realIndex)}
                          className="rounded-md p-1 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                          title="Удалить позицию"
                        >
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M6 18L18 6M6 6l12 12"
                            />
                          </svg>
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}

              {/* New row (inline add) */}
              {isEditable && showNewRow && (
                <tr className="bg-red-50/30">
                  <td className="px-4 py-2.5">
                    <select
                      value={newRow.nomenclatureId}
                      onChange={(e) =>
                        setNewRow({
                          ...newRow,
                          nomenclatureId: e.target.value,
                          lot: "",
                          place: "",
                        })
                      }
                      className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-blue-400"
                      autoFocus
                    >
                      <option value="">— Выберите —</option>
                      {catalogWithStock.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  {/* Место хранения */}
                  <td className="px-4 py-2.5">
                    <select
                      value={newRow.place}
                      onChange={(e) =>
                        setNewRow({ ...newRow, place: e.target.value, lot: "" })
                      }
                      disabled={!selectedCatalogItem}
                      className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-blue-400 disabled:bg-slate-100 disabled:text-slate-400"
                    >
                      <option value="">— Выберите —</option>
                      {selectedCatalogItem
                        ? [
                            ...new Set(
                              MOCK_STOCK_LINES.filter(
                                (s) =>
                                  s.nomenclatureId === selectedCatalogItem.id &&
                                  s.quantity > 0,
                              ).map((s) => s.place),
                            ),
                          ].map((place) => (
                            <option key={place} value={place}>
                              {place}
                            </option>
                          ))
                        : []}
                    </select>
                  </td>
                  {/* Лот */}
                  <td className="px-4 py-2.5">
                    <select
                      value={newRow.lot}
                      onChange={(e) =>
                        setNewRow({ ...newRow, lot: e.target.value })
                      }
                      disabled={!selectedCatalogItem || !newRow.place}
                      className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-blue-400 disabled:bg-slate-100 disabled:text-slate-400"
                    >
                      <option value="">— Выберите —</option>
                      {selectedCatalogItem && newRow.place
                        ? selectedCatalogItem.lots
                            .filter((l) =>
                              MOCK_STOCK_LINES.some(
                                (s) =>
                                  s.nomenclatureId === selectedCatalogItem.id &&
                                  s.lot === l.code &&
                                  s.place === newRow.place &&
                                  s.quantity > 0,
                              ),
                            )
                            .map((l) => (
                              <option key={l.code} value={l.code}>
                                {l.code}
                              </option>
                            ))
                        : []}
                    </select>
                  </td>
                  {/* Срок годности */}
                  <td className="px-4 py-2.5 text-slate-600 text-xs">
                    {selectedLotData?.expiryDate || "—"}
                  </td>
                  {/* Кол-во */}
                  <td className="px-4 py-2.5">
                    <input
                      type="text"
                      value={newRow.quantity}
                      onChange={(e) => {
                        setNewRow({ ...newRow, quantity: e.target.value });
                        setQtyError("");
                      }}
                      onBlur={() => {
                        const val = parseInt(newRow.quantity, 10);
                        if (
                          val &&
                          maxAvailableQty > 0 &&
                          val > maxAvailableQty
                        ) {
                          setQtyError(`Макс: ${maxAvailableQty}`);
                        }
                      }}
                      placeholder="0"
                      className="w-20 rounded border border-slate-200 px-2 py-1.5 text-right text-sm tabular-nums outline-none focus:border-blue-400"
                    />
                    {maxAvailableQty > 0 && (
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Доступно: {maxAvailableQty}
                      </div>
                    )}
                    {qtyError && (
                      <div className="text-[10px] text-red-500">{qtyError}</div>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <select
                      value={newRow.reason}
                      onChange={(e) =>
                        setNewRow({ ...newRow, reason: e.target.value })
                      }
                      className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm outline-none focus:border-blue-400"
                    >
                      <option value="">— Выберите —</option>
                      {WRITE_OFF_REASONS.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-2.5">
                    <input
                      type="text"
                      value={newRow.comment}
                      onChange={(e) =>
                        setNewRow({ ...newRow, comment: e.target.value })
                      }
                      placeholder="Комментарий…"
                      className="w-full rounded border border-slate-200 px-2 py-1.5 text-xs outline-none focus:border-blue-400"
                    />
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    <button
                      onClick={handleAddRow}
                      disabled={!newRow.nomenclatureId || !newRow.lot}
                      className="rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition disabled:opacity-30 hover:bg-emerald-700"
                    >
                      ✓
                    </button>
                    <button
                      onClick={() => {
                        setShowNewRow(false);
                        setNewRow({
                          nomenclatureId: "",
                          lot: "",
                          quantity: "",
                          place: "",
                          reason: "",
                          comment: "",
                        });
                        setQtyError("");
                      }}
                      className="ml-1 rounded-md p-1.5 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                      title="Отмена"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </td>
                </tr>
              )}

              {/* Empty state */}
              {!showNewRow && session.lines.length === 0 && (
                <tr>
                  <td
                    colSpan={isEditable ? 8 : 7}
                    className="px-4 py-16 text-center text-sm text-slate-500"
                  >
                    Нет позиций. Нажмите «Добавить позицию».
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-3">
            <span className="text-xs text-slate-500">
              {(page - 1) * PAGE_SIZE + 1}–
              {Math.min(page * PAGE_SIZE, session.lines.length)} из{" "}
              {session.lines.length}
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600 transition disabled:opacity-40 hover:bg-slate-100"
              >
                ←
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(
                  (p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1,
                )
                .reduce<(number | "...")[]>((acc, p, idx, arr) => {
                  if (idx > 0 && p - (arr[idx - 1] as number) > 1)
                    acc.push("...");
                  acc.push(p);
                  return acc;
                }, [])
                .map((item, idx) =>
                  item === "..." ? (
                    <span
                      key={`dots-${idx}`}
                      className="px-1 text-xs text-slate-400"
                    >
                      …
                    </span>
                  ) : (
                    <button
                      key={item}
                      onClick={() => setPage(item as number)}
                      className={`rounded-md border px-2.5 py-1 text-xs transition ${
                        item === page
                          ? "border-blue-500 bg-blue-600 text-white"
                          : "border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                      }`}
                    >
                      {item}
                    </button>
                  ),
                )}
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600 transition disabled:opacity-40 hover:bg-slate-100"
              >
                →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add row button below table */}
      {isEditable && !showNewRow && (
        <div className="mt-3 flex justify-end">
          <button
            onClick={() => setShowNewRow(true)}
            className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4v16m8-8H4"
              />
            </svg>
            Добавить позицию
          </button>
        </div>
      )}

      {/* Commission form */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-slate-700">Комиссия</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <CommissionSelect
            label="Руководитель производственной площадки (Зав. Лабораторией)"
            value={session.commission.headOfProduction}
            onChange={(v) =>
              updateCommission(session.id, { headOfProduction: v })
            }
            disabled={!isEditable}
          />
          <CommissionSelect
            label="Руководитель ОКК"
            value={session.commission.headOfQuality}
            onChange={(v) => updateCommission(session.id, { headOfQuality: v })}
            disabled={!isEditable}
          />
          <CommissionSelect
            label="Сотрудник ОКК"
            value={session.commission.qualityEmployee}
            onChange={(v) =>
              updateCommission(session.id, { qualityEmployee: v })
            }
            disabled={!isEditable}
          />
          <CommissionSelect
            label="Уполномоченное лицо"
            value={session.commission.authorizedPerson}
            onChange={(v) =>
              updateCommission(session.id, { authorizedPerson: v })
            }
            disabled={!isEditable}
          />
        </div>
      </div>

      {/* Action dropdown */}
      <div className="mt-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold text-slate-700">Действие</h2>
        <select
          value={session.action || "utilized"}
          onChange={(e) => updateAction(session.id, e.target.value)}
          disabled={!isEditable}
          className="w-full max-w-sm rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 disabled:bg-slate-100 disabled:text-slate-400"
        >
          {WRITE_OFF_ACTIONS.map((a) => (
            <option key={a.id} value={a.id}>
              {a.label}
            </option>
          ))}
        </select>
      </div>

      {/* Save draft toast */}
      {saveToast && (
        <div className="fixed bottom-4 right-4 z-50 animate-slide-up">
          <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 shadow-lg">
            <svg
              className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div className="flex-1">
              <div className="text-sm font-medium text-emerald-800">
                {saveToast.message}
              </div>
              <div className="text-xs text-emerald-600">
                {saveToast.details}
              </div>
            </div>
            <button
              onClick={() => setSaveToast(null)}
              className="shrink-0 text-emerald-400 transition hover:text-emerald-600"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Confirm completion modal */}
      {confirmComplete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setConfirmComplete(false)}
        >
          <div
            className="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-slate-800">
              Завершить списание?
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Завершение создаст транзакцию списания, которая уменьшит остатки
              на складе. Действие нельзя отменить.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setConfirmComplete(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-50"
              >
                Отмена
              </button>
              <button
                onClick={() => {
                  completeSession(session.id);
                  setConfirmComplete(false);
                }}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
              >
                Завершить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setConfirmDelete(false)}
        >
          <div
            className="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
                <svg
                  className="h-5 w-5 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800">
                  Удалить списание?
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Черновик будет удалён безвозвратно.
                </p>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setConfirmDelete(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-50"
              >
                Отмена
              </button>
              <button
                onClick={handleDelete}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700"
              >
                Удалить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ===========================
   Helpers & sub-components
   =========================== */

function CommissionSelect({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-blue-400 disabled:bg-slate-50 disabled:text-slate-500"
      >
        <option value="">— Выберите —</option>
        {USERS.map((u) => (
          <option key={u} value={u}>
            {u}
          </option>
        ))}
      </select>
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

function formatRuTime(iso: string): string {
  const d = new Date(iso);
  const hours = String(d.getHours()).padStart(2, "0");
  const mins = String(d.getMinutes()).padStart(2, "0");
  const secs = String(d.getSeconds()).padStart(2, "0");
  return `${hours}:${mins}:${secs}`;
}
