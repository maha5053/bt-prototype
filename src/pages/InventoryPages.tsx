import { useMemo, useState, useRef, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Combobox } from "@headlessui/react";
import { InventoryProvider, useInventory } from "../context/InventoryContext";
import { getAllStoragePlaces, ALL_GROUPS } from "../mocks/inventoryData";
import type {
  DiscrepancyStatus,
  InventorySession,
} from "../mocks/inventoryData";
import {
  MOCK_CATALOG,
  MOCK_STOCK_LINES,
  type CatalogItem,
} from "../mocks/balancesData";

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

  const [page, setPage] = useState(1);
  const [showDevTools, setShowDevTools] = useState(false);

  const listTotalPages = Math.max(1, Math.ceil(sessions.length / PAGE_SIZE));
  const safeListPage = Math.min(page, listTotalPages);
  const shownSessions = useMemo(
    () =>
      sessions.slice(
        (safeListPage - 1) * PAGE_SIZE,
        safeListPage * PAGE_SIZE,
      ),
    [sessions, safeListPage],
  );

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
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                  <th className="px-4 py-3 font-medium">Номер</th>
                  <th className="px-4 py-3 font-medium">Дата</th>
                  <th className="px-4 py-3 font-medium">Создал</th>
                  <th className="px-4 py-3 font-medium whitespace-nowrap">
                    Статус
                  </th>
                  <th className="px-4 py-3 text-right font-medium">
                    Позиций
                  </th>
                  <th className="px-4 py-3 text-right font-medium">
                    Совпало
                  </th>
                  <th className="px-4 py-3 text-right font-medium">
                    Излишки
                  </th>
                  <th className="px-4 py-3 text-right font-medium">
                    Недостачи
                  </th>
                </tr>
              </thead>
              <tbody>
                {shownSessions.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-12 text-center text-slate-500"
                    >
                      Нет документов инвентаризации.
                    </td>
                  </tr>
                ) : (
                  shownSessions.map((session) => {
                    const { match, surplus, shortage } =
                      inventoryListRowCounts(session);
                    return (
                      <tr
                        key={session.id}
                        onClick={() =>
                          navigate(`/sklad/inventarizatsiya/${session.id}`)
                        }
                        className="cursor-pointer border-b border-slate-100 last:border-0 hover:bg-slate-50/80"
                      >
                        <td className="px-4 py-3 font-mono text-xs text-slate-600">
                          {session.id.replace(/^inv-/, "")}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {formatRuDateTime(session.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {session.createdBy}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                              session.status === "completed"
                                ? "bg-slate-100 text-slate-600 ring-slate-500/20"
                                : "bg-amber-50 text-amber-700 ring-amber-500/20"
                            }`}
                          >
                            {session.status === "completed"
                              ? "Завершена"
                              : "В процессе"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums font-medium text-slate-700">
                          {session.lines.length}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-emerald-700">
                          {match}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-blue-700">
                          {surplus}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-red-700">
                          {shortage}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-600">
            <span>
              Показано{" "}
              <strong className="font-medium text-slate-800">
                {sessions.length === 0
                  ? 0
                  : (safeListPage - 1) * PAGE_SIZE + 1}
                –
                {Math.min(safeListPage * PAGE_SIZE, sessions.length)}
              </strong>{" "}
              из{" "}
              <strong className="font-medium text-slate-800">
                {sessions.length}
              </strong>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={safeListPage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                ← Назад
              </button>
              <span className="tabular-nums text-slate-700">
                Стр. {safeListPage} / {listTotalPages}
              </span>
              <button
                type="button"
                disabled={safeListPage >= listTotalPages}
                onClick={() =>
                  setPage((p) => Math.min(listTotalPages, p + 1))
                }
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Вперёд →
              </button>
            </div>
          </footer>
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
    addOrFocusLine,
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
  const [showAddLine, setShowAddLine] = useState(false);
  const [addNomId, setAddNomId] = useState<string>("");
  const [addNomSearch, setAddNomSearch] = useState<string>("");
  const [addPlace, setAddPlace] = useState<string>("");
  const [addLot, setAddLot] = useState<string>("");

  const [focusKey, setFocusKey] = useState<string | null>(null);
  const [flashKey, setFlashKey] = useState<string | null>(null);
  const focusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  // Scroll/focus helper: after page/filter changes, bring the row into view and flash it.
  useEffect(() => {
    if (!focusKey) return;

    const encoded = encodeURIComponent(focusKey);
    const run = () => {
      const el = document.querySelector(
        `[data-inv-key="${encoded}"]`,
      ) as HTMLElement | null;
      if (!el) return;
      el.scrollIntoView({ block: "center" });

      setFlashKey(focusKey);
      setFocusKey(null);

      if (focusTimer.current) clearTimeout(focusTimer.current);
      focusTimer.current = setTimeout(() => setFlashKey(null), 1400);
    };

    const t = window.setTimeout(run, 0);
    return () => window.clearTimeout(t);
  }, [focusKey, page, search, placeFilter, groupFilter, discrepancyFilter]);

  useEffect(() => {
    return () => {
      if (focusTimer.current) clearTimeout(focusTimer.current);
    };
  }, []);

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
  const catalog = useMemo(() => [...MOCK_CATALOG], []);
  const filteredCatalog = useMemo(() => {
    const q = addNomSearch.trim().toLowerCase();
    const base = catalog
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name, "ru"));
    if (!q) return base;
    return base.filter((c) => {
      const hay = `${c.name} ${c.manufacturer} ${c.group}`.toLowerCase();
      return hay.includes(q);
    });
  }, [catalog, addNomSearch]);

  const selectedCatalogItem = useMemo<CatalogItem | null>(() => {
    if (!addNomId) return null;
    return catalog.find((c) => c.id === addNomId) ?? null;
  }, [addNomId, catalog]);

  const addLots = useMemo(() => {
    if (!selectedCatalogItem) return [];

    const fromStock = MOCK_STOCK_LINES.filter(
      (l) => l.nomenclatureId === selectedCatalogItem.id,
    ).map((l) => l.lot);

    const fromSession = (session?.lines ?? [])
      .filter(
        (l) =>
          l.nomenclatureId === selectedCatalogItem.id,
      )
      .map((l) => l.lot);

    return [...new Set([...fromStock, ...fromSession])].sort((a, b) =>
      a.localeCompare(b, "ru"),
    );
  }, [selectedCatalogItem, session?.lines]);

  const canSubmitAdd = Boolean(addNomId && addPlace && addLot);

  useEffect(() => {
    if (!addLot) return;
    if (addLots.length > 0 && !addLots.includes(addLot)) {
      setAddLot("");
    }
  }, [addLot, addLots]);

  const resetFilters = () => {
    setSearch("");
    setPlaceFilter("all");
    setGroupFilter("all");
    setDiscrepancyFilter("all");
    setPage(1);
  };

  if (!session) return null;

  const clearAddModal = () => {
    setAddNomId("");
    setAddNomSearch("");
    setAddPlace("");
    setAddLot("");
  };

  const openAddModal = () => {
    clearAddModal();
    setShowAddLine(true);
  };

  const computeTargetPage = (targetIndex: number) =>
    Math.floor(targetIndex / PAGE_SIZE) + 1;

  const focusRow = (targetIndex: number, key: string) => {
    // Ensure row is visible: reset filters and go to correct page.
    setSearch("");
    setPlaceFilter("all");
    setGroupFilter("all");
    setDiscrepancyFilter("all");
    setPage(computeTargetPage(targetIndex));
    setFocusKey(key);
  };

  const handleAddOrFocus = () => {
    if (session.status !== "draft") return;
    if (!canSubmitAdd || !selectedCatalogItem) return;

    const res = addOrFocusLine(session.id, {
      nomenclatureId: selectedCatalogItem.id,
      nomenclatureName: selectedCatalogItem.name,
      group: selectedCatalogItem.group,
      manufacturer: selectedCatalogItem.manufacturer,
      lot: addLot,
      place: addPlace,
    });

    setShowAddLine(false);
    focusRow(res.index, makeLineKey(selectedCatalogItem.id, addPlace, addLot));
    if (res.created) {
      setEditingCell({ lineIndex: res.index, field: "qty" });
    }
  };

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
                onClick={openAddModal}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                + Добавить позицию
              </button>
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
                const rowKey = makeLineKey(
                  line.nomenclatureId,
                  line.place,
                  line.lot,
                );
                const isFlashing = flashKey === rowKey;
                return (
                  <tr
                    key={`${line.nomenclatureId}-${line.lot}-${line.place}`}
                    data-inv-key={encodeURIComponent(rowKey)}
                    className={`transition hover:bg-slate-50 ${isFlashing ? "bg-amber-50" : ""}`}
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
            {summary.unchecked > 0 && (
              <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                Не проверено{" "}
                <span className="font-semibold tabular-nums">
                  {summary.unchecked}{" "}
                  {ruPlural(summary.unchecked, "позиция", "позиции", "позиций")}
                </span>
                . Вы точно хотите завершить инвентаризацию?
              </div>
            )}
            <p className="mt-2 text-sm text-slate-500">
              После завершения данные будут зафиксированы и редактирование станет
              недоступным. Убедитесь, что фактические количества введены
              корректно.
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

      {/* Add line modal */}
      {showAddLine && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setShowAddLine(false)}
        >
          <div
            className="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Добавить позицию"
          >
            <h3 className="text-lg font-semibold text-slate-800">
              Добавить позицию
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Выберите номенклатуру, место хранения и лот.
            </p>

            <div className="mt-4 space-y-3">
              <label className="block">
                <div className="mb-1 text-xs font-medium text-slate-600">
                  Номенклатура
                </div>
                <Combobox
                  value={selectedCatalogItem}
                  onChange={(item: CatalogItem | null) => {
                    setAddNomId(item?.id ?? "");
                    setAddNomSearch("");
                    setAddLot("");
                  }}
                >
                  <div className="relative">
                    <Combobox.Input
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 pr-9 text-sm outline-none transition focus:border-blue-400"
                      placeholder="Выберите…"
                      displayValue={(item: CatalogItem | null) =>
                        item ? `${item.name} — ${item.manufacturer}` : ""
                      }
                      onChange={(event) => setAddNomSearch(event.target.value)}
                    />
                    <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600">
                      <svg
                        className="h-4 w-4"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </Combobox.Button>
                    <Combobox.Options className="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 text-sm shadow-lg focus:outline-none">
                      {filteredCatalog.length === 0 ? (
                        <div className="px-3 py-2 text-slate-500">
                          Ничего не найдено.
                        </div>
                      ) : (
                        filteredCatalog.map((c) => (
                          <Combobox.Option
                            key={c.id}
                            value={c}
                            className={({ active }) =>
                              `cursor-pointer select-none px-3 py-2 ${
                                active ? "bg-blue-600 text-white" : "text-slate-700"
                              }`
                            }
                          >
                            <div className="flex items-baseline justify-between gap-3">
                              <span className="font-medium">{c.name}</span>
                              <span className="shrink-0 text-xs opacity-80">
                                {c.manufacturer}
                              </span>
                            </div>
                            <div className="mt-0.5 text-xs opacity-80">
                              {c.group}
                            </div>
                          </Combobox.Option>
                        ))
                      )}
                    </Combobox.Options>
                  </div>
                </Combobox>
              </label>

              <label className="block">
                <div className="mb-1 text-xs font-medium text-slate-600">
                  Лот
                </div>
                <select
                  value={addLot}
                  onChange={(e) => setAddLot(e.target.value)}
                  disabled={!selectedCatalogItem}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-blue-400 disabled:bg-slate-50"
                >
                  <option value="">
                    {!selectedCatalogItem ? "Сначала выберите номенклатуру" : "Выберите…"}
                  </option>
                  {addLots.map((lot) => (
                    <option key={lot} value={lot}>
                      {lot}
                    </option>
                  ))}
                </select>
                {selectedCatalogItem && addLots.length === 0 && (
                  <div className="mt-1 text-xs text-slate-500">
                    Для выбранной номенклатуры нет доступных лотов.
                  </div>
                )}
              </label>

              <label className="block">
                <div className="mb-1 text-xs font-medium text-slate-600">
                  Место хранения
                </div>
                <select
                  value={addPlace}
                  onChange={(e) => {
                    setAddPlace(e.target.value);
                  }}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none transition focus:border-blue-400"
                >
                  <option value="">Выберите…</option>
                  {storagePlaces.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setShowAddLine(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 transition hover:bg-slate-50"
              >
                Отмена
              </button>
              <button
                onClick={handleAddOrFocus}
                disabled={!canSubmitAdd}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Добавить / перейти
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

function inventoryListRowCounts(session: InventorySession) {
  return {
    match: session.lines.filter(
      (l) => l.status === "совпадение" && l.actualQuantity !== null,
    ).length,
    surplus: session.lines.filter((l) => l.status === "излишек").length,
    shortage: session.lines.filter((l) => l.status === "недостача").length,
  };
}

function ruPlural(n: number, one: string, few: string, many: string) {
  const abs = Math.abs(n) % 100;
  const last = abs % 10;
  if (abs >= 11 && abs <= 14) return many;
  if (last === 1) return one;
  if (last >= 2 && last <= 4) return few;
  return many;
}

function makeLineKey(nomenclatureId: string, place: string, lot: string) {
  return `${nomenclatureId}||${place}||${lot}`;
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

