import { useMemo, useState, useRef, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { InventoryProvider, useInventory } from "../context/InventoryContext";
import { getAllStoragePlaces, ALL_GROUPS } from "../mocks/inventoryData";
import type {
  DiscrepancyStatus,
  InventorySession,
} from "../mocks/inventoryData";

const PAGE_SIZE = 15;

/* ===========================
   LIST PAGE
   =========================== */

export function InventoryListPage() {
  return (
    <InventoryProvider>
      <InventoryListContent />
    </InventoryProvider>
  );
}

function InventoryListContent() {
  const { sessions, createSession } = useInventory();
  const navigate = useNavigate();

  const [showDevTools, setShowDevTools] = useState(false);

  const STORAGE_KEY = "bio-inventory";

  const clearInventoryLocalStorage = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      window.location.reload();
    } catch {
      // ignore
    }
  };

  const handleCreate = () => {
    const newSession = createSession();
    navigate(`/sklad/inventarizatsiya/${newSession.id}`);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">
            Инвентаризация
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Сравнение системных остатков с фактическими. Проведите
            инвентаризацию по всему складу.
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          Начать инвентаризацию
        </button>
      </div>

      {/* Session list */}
      {sessions.length > 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-3">
            <h2 className="text-sm font-medium text-slate-700">
              Документы инвентаризации
            </h2>
          </div>
          <div className="divide-y divide-slate-100">
            {sessions.map((session) => (
              <SessionRow key={session.id} session={session} />
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 py-16">
          <svg
            className="mb-3 h-10 w-10 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <p className="text-sm text-slate-500">
            Нет документов инвентаризации
          </p>
          <button
            onClick={handleCreate}
            className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            Начать первую инвентаризацию
          </button>
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
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <p className="mb-4 text-sm text-slate-600">
              Очистка localStorage удалит все данные инвентаризации и
              восстановит исходные mock-данные.
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
                onClick={clearInventoryLocalStorage}
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

/* ===========================
   SESSION DETAIL PAGE
   =========================== */

export function InventorySessionPage() {
  return (
    <InventoryProvider>
      <InventorySessionContent />
    </InventoryProvider>
  );
}

function InventorySessionContent() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const {
    sessions,
    updateLineActualQuantity,
    updateLineComment,
    completeSession,
    saveDraft,
    deleteSession,
  } = useInventory();

  const session = useMemo(
    () => sessions.find((s) => s.id === sessionId) ?? null,
    [sessions, sessionId],
  );

  const [search, setSearch] = useState("");
  const [placeFilter, setPlaceFilter] = useState<string>("all");
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [discrepancyFilter, setDiscrepancyFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [editingCell, setEditingCell] = useState<{
    lineIndex: number;
    field: "qty" | "comment";
  } | null>(null);
  const [confirmComplete, setConfirmComplete] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Toast notification for save draft
  const [saveToast, setSaveToast] = useState<{
    message: string;
    details: string;
  } | null>(null);
  const saveToastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSaveDraft = () => {
    if (!session) return;
    const result = saveDraft(session.id);
    const time = formatRuTime(result.savedAt);
    setSaveToast({
      message: "Черновик сохранён",
      details: `${time} · Проверено ${result.checkedCount}, не проверено ${result.uncheckedCount} из ${result.total}`,
    });
    if (saveToastTimer.current) clearTimeout(saveToastTimer.current);
    saveToastTimer.current = setTimeout(() => setSaveToast(null), 4000);
  };

  const handleDelete = () => {
    if (!session) return;
    const ok = deleteSession(session.id);
    if (ok) {
      navigate("/sklad/inventarizatsiya", { replace: true });
    }
  };

  // If session not found or doesn't exist, redirect to list
  useEffect(() => {
    if (!session && sessionId) {
      navigate("/sklad/inventarizatsiya", { replace: true });
    }
  }, [session, sessionId, navigate]);

  // Filter & paginate session lines
  const filteredLines = useMemo(() => {
    if (!session) return [];
    const q = search.trim().toLowerCase();
    return session.lines.filter((line) => {
      if (placeFilter !== "all" && line.place !== placeFilter) return false;
      if (groupFilter !== "all" && line.group !== groupFilter) return false;
      if (discrepancyFilter !== "all") {
        if (discrepancyFilter === "не проверено") {
          if (line.actualQuantity !== null) return false;
        } else {
          if (line.actualQuantity === null) return false;
          if (line.status !== discrepancyFilter) return false;
        }
      }
      if (!q) return true;
      return (
        line.nomenclatureName.toLowerCase().includes(q) ||
        line.lot.toLowerCase().includes(q) ||
        line.manufacturer.toLowerCase().includes(q)
      );
    });
  }, [session, search, placeFilter, groupFilter, discrepancyFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredLines.length / PAGE_SIZE));
  const paginatedLines = useMemo(
    () => filteredLines.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filteredLines, page],
  );

  // Summary stats
  const summary = useMemo(() => {
    if (!session)
      return {
        total: 0,
        match: 0,
        surplus: 0,
        shortage: 0,
        unchecked: 0,
      };
    return {
      total: session.lines.length,
      unchecked: session.lines.filter((l) => l.actualQuantity === null).length,
      match: session.lines.filter(
        (l) => l.status === "совпадение" && l.actualQuantity !== null,
      ).length,
      surplus: session.lines.filter((l) => l.status === "излишек").length,
      shortage: session.lines.filter((l) => l.status === "недостача").length,
    };
  }, [session]);

  const storagePlaces = useMemo(() => getAllStoragePlaces(), []);

  const resetFilters = () => {
    setSearch("");
    setPlaceFilter("all");
    setGroupFilter("all");
    setDiscrepancyFilter("all");
    setPage(1);
  };

  if (!session) return null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      {/* Header */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <Link
              to="/sklad/inventarizatsiya"
              className="text-sm text-slate-500 transition hover:text-slate-700"
              title="К списку инвентаризаций"
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
              Инвентаризация
            </h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            от {formatRuDateTime(session.createdAt)} &middot; Создал:{" "}
            {session.createdBy}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {session.status === "draft" && (
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
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
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
          {session.status === "completed" && (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              Завершена
            </span>
          )}
        </div>
      </div>

      {/* Summary cards */}
      <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <SummaryCard
          label="Всего позиций"
          value={summary.total}
          color="slate"
        />
        <SummaryCard
          label="Не проверено"
          value={summary.unchecked}
          color="amber"
        />
        <SummaryCard label="Совпадения" value={summary.match} color="emerald" />
        <SummaryCard label="Излишки" value={summary.surplus} color="blue" />
        <SummaryCard label="Недостачи" value={summary.shortage} color="red" />
      </div>

      {/* Filters */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Поиск по названию, партии, производителю…"
            className="w-full rounded-lg border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-blue-400"
          />
        </div>
        <select
          value={placeFilter}
          onChange={(e) => {
            setPlaceFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-blue-400"
        >
          <option value="all">Все места</option>
          {storagePlaces.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <select
          value={groupFilter}
          onChange={(e) => {
            setGroupFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-blue-400"
        >
          <option value="all">Все группы</option>
          {ALL_GROUPS.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
        <select
          value={discrepancyFilter}
          onChange={(e) => {
            setDiscrepancyFilter(e.target.value);
            setPage(1);
          }}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-blue-400"
        >
          <option value="all">Все статусы</option>
          <option value="не проверено">Не проверено</option>
          <option value="совпадение">Совпадение</option>
          <option value="излишек">Излишек</option>
          <option value="недостача">Недостача</option>
        </select>
        {(search ||
          placeFilter !== "all" ||
          groupFilter !== "all" ||
          discrepancyFilter !== "all") && (
          <button
            onClick={resetFilters}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-500 transition hover:bg-slate-50"
          >
            Сбросить
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2.5 font-medium">Номенклатура</th>
                <th className="px-4 py-2.5 font-medium">Партия</th>
                <th className="px-4 py-2.5 font-medium">Место хранения</th>
                <th className="px-4 py-2.5 font-medium text-right">
                  Системное кол-во
                </th>
                <th className="px-4 py-2.5 font-medium text-right">
                  Фактическое кол-во
                </th>
                <th className="px-4 py-2.5 font-medium text-right">
                  Расхождение
                </th>
                <th className="px-4 py-2.5 font-medium text-center">Статус</th>
                <th className="px-4 py-2.5 font-medium">Комментарий</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedLines.map((line) => {
                const realIndex = session.lines.indexOf(line);
                const isEditable = session.status === "draft";
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
                        {line.group} &middot; {line.manufacturer}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs text-slate-600">
                      {line.lot}
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">{line.place}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">
                      {line.systemQuantity}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {isEditable ? (
                        editingCell?.lineIndex === realIndex &&
                        editingCell?.field === "qty" ? (
                          <input
                            type="number"
                            min={0}
                            autoFocus
                            defaultValue={line.actualQuantity ?? ""}
                            onBlur={(e) => {
                              const val = Math.max(
                                0,
                                parseInt(e.target.value, 10) || 0,
                              );
                              updateLineActualQuantity(
                                session.id,
                                realIndex,
                                val,
                              );
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
                                updateLineActualQuantity(
                                  session.id,
                                  realIndex,
                                  val,
                                );
                                setEditingCell(null);
                              }
                              if (e.key === "Escape") {
                                setEditingCell(null);
                              }
                            }}
                            className="w-20 rounded border border-blue-300 bg-blue-50 px-2 py-1 text-right text-sm tabular-nums outline-none focus:border-blue-500"
                          />
                        ) : line.actualQuantity === null ? (
                          <button
                            onClick={() =>
                              setEditingCell({
                                lineIndex: realIndex,
                                field: "qty",
                              })
                            }
                            className="w-20 rounded border border-dashed border-amber-400 bg-amber-50 px-2 py-1 text-right text-sm tabular-nums text-amber-600 transition hover:border-amber-500 hover:bg-amber-100"
                            title="Введите фактическое количество"
                          >
                            —
                          </button>
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
                            {line.actualQuantity}
                          </button>
                        )
                      ) : line.actualQuantity === null ? (
                        <span className="text-sm tabular-nums text-slate-400">
                          —
                        </span>
                      ) : (
                        <span className="text-sm tabular-nums text-slate-700">
                          {line.actualQuantity}
                        </span>
                      )}
                    </td>
                    <td
                      className={`px-4 py-2.5 text-right text-sm font-medium tabular-nums ${
                        line.discrepancy === null
                          ? "text-slate-300"
                          : line.discrepancy > 0
                            ? "text-blue-600"
                            : line.discrepancy < 0
                              ? "text-red-600"
                              : "text-slate-500"
                      }`}
                    >
                      {line.discrepancy === null
                        ? "—"
                        : line.discrepancy > 0
                          ? "+"
                          : ""}
                      {line.discrepancy === null ? "" : line.discrepancy}
                    </td>
                    <td className="px-4 py-2.5 text-center">
                      {line.actualQuantity === null ? (
                        <span className="inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-400 ring-1 ring-inset ring-slate-400/20">
                          не проверено
                        </span>
                      ) : (
                        <DiscrepancyBadge status={line.status} />
                      )}
                    </td>
                    <td className="px-4 py-2.5 max-w-[180px]">
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
                              if (e.key === "Escape") {
                                setEditingCell(null);
                              }
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
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-3">
            <span className="text-xs text-slate-500">
              {(page - 1) * PAGE_SIZE + 1}–
              {Math.min(page * PAGE_SIZE, filteredLines.length)} из{" "}
              {filteredLines.length}
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
                  if (idx > 0 && p - arr[idx - 1] > 1) acc.push("...");
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
                      onClick={() => setPage(item)}
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
              Завершить инвентаризацию?
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              После завершения данные будут зафиксированы и редактирование
              станет недоступным. Убедитесь, что все фактические количества
              введены корректно.
            </p>
            <div className="mt-2 text-sm tabular-nums text-slate-600">
              <div>
                Совпадения:{" "}
                <span className="font-medium text-emerald-600">
                  {summary.match}
                </span>
              </div>
              <div>
                Излишки:{" "}
                <span className="font-medium text-blue-600">
                  {summary.surplus}
                </span>
              </div>
              <div>
                Недостачи:{" "}
                <span className="font-medium text-red-600">
                  {summary.shortage}
                </span>
              </div>
            </div>
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
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
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
                  Удалить инвентаризацию?
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  Черновик будет удалён безвозвратно. Введённые данные не будут
                  сохранены.
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

function SummaryCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: string;
}) {
  const colorMap: Record<string, string> = {
    slate: "bg-slate-100 text-slate-800",
    emerald: "bg-emerald-50 text-emerald-700",
    blue: "bg-blue-50 text-blue-700",
    red: "bg-red-50 text-red-700",
    amber: "bg-amber-50 text-amber-700",
  };
  return (
    <div
      className={`rounded-lg ${colorMap[color] || colorMap.slate} px-4 py-3`}
    >
      <div className="text-2xl font-bold tabular-nums">{value}</div>
      <div className="text-xs opacity-80">{label}</div>
    </div>
  );
}

function DiscrepancyBadge({ status }: { status: DiscrepancyStatus }) {
  const cls: Record<string, string> = {
    совпадение: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    излишек: "bg-blue-50 text-blue-700 ring-blue-600/20",
    недостача: "bg-red-50 text-red-700 ring-red-600/20",
  };
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${cls[status]}`}
    >
      {status}
    </span>
  );
}

function SessionRow({ session }: { session: InventorySession }) {
  const matchCount = session.lines.filter(
    (l) => l.status === "совпадение" && l.actualQuantity !== null,
  ).length;
  const surplusCount = session.lines.filter(
    (l) => l.status === "излишек",
  ).length;
  const shortageCount = session.lines.filter(
    (l) => l.status === "недостача",
  ).length;
  const uncheckedCount = session.lines.filter(
    (l) => l.actualQuantity === null,
  ).length;

  return (
    <Link
      to={`/sklad/inventarizatsiya/${session.id}`}
      className="flex items-center justify-between px-5 py-3 transition hover:bg-blue-50/50 hover:cursor-pointer"
    >
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-700">
            {formatRuDateTime(session.createdAt)}
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset ${
              session.status === "completed"
                ? "bg-slate-100 text-slate-600 ring-slate-500/20"
                : "bg-amber-50 text-amber-700 ring-amber-500/20"
            }`}
          >
            {session.status === "completed" ? "Завершена" : "В процессе"}
          </span>
        </div>
        <div className="mt-0.5 text-xs text-slate-500">
          Создал: {session.createdBy}
          {session.completedAt && (
            <> · Завершена: {formatRuDateTime(session.completedAt)}</>
          )}
        </div>
        <div className="mt-1 flex flex-wrap gap-3 text-xs tabular-nums text-slate-500">
          <span>
            Всего: <span className="font-medium">{session.lines.length}</span>
          </span>
          {uncheckedCount > 0 && (
            <span className="text-amber-600">
              Не проверено: {uncheckedCount}
            </span>
          )}
          <span className="text-emerald-600">Совпало: {matchCount}</span>
          <span className="text-blue-600">Излишки: {surplusCount}</span>
          <span className="text-red-600">Недостачи: {shortageCount}</span>
        </div>
      </div>
      <svg
        className="h-5 w-5 shrink-0 text-slate-400"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}
