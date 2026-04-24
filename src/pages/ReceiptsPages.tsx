import { useMemo, useRef, useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Combobox } from "@headlessui/react";
import {
  NomenclatureProvider,
  useNomenclature,
  type SpecificationItem,
} from "../context/NomenclatureContext";
import { ReceiptsProvider, useReceipts } from "../context/ReceiptsContext";
import {
  MOCK_CATALOG,
  type ReceiptIncomingControlAnswers,
  type ReceiptIncomingIndicatorValue,
  type ReceiptLine,
} from "../mocks/receiptsData";
import {
  getAllStoragePlaces,
  formatRuDate,
  type CatalogItem,
} from "../mocks/balancesData";

const INCOMING_INDICATOR_OPTIONS = [
  "Не определено",
  "Да",
  "Нет",
] as const satisfies readonly ReceiptIncomingIndicatorValue[];

const PAGE_SIZE = 15;

function sortedSpecRows(specification: SpecificationItem[] | undefined) {
  return specification?.length
    ? [...specification].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
    : [];
}

/** Хотя бы по одному показателю выбрано «Нет». */
function hasIncomingControlNo(
  line: Pick<ReceiptLine, "incomingControl">,
  specification: SpecificationItem[] | undefined,
): boolean {
  return sortedSpecRows(specification).some(
    (row) => line.incomingControl?.[row.id] === "Нет",
  );
}

/** Все строки спецификации имеют ответ «Да» или «Нет» (не «Не определено»). */
function isIncomingControlComplete(
  line: Pick<ReceiptLine, "incomingControl">,
  specification: SpecificationItem[] | undefined,
): boolean {
  const rows = sortedSpecRows(specification);
  if (rows.length === 0) return false;
  return rows.every((row) => {
    const v = line.incomingControl?.[row.id];
    return v === "Да" || v === "Нет";
  });
}

/** Спецификация есть, но не по всем показателям выбрано «Да» или «Нет». */
function hasIncomingControlUnfilled(
  line: Pick<ReceiptLine, "incomingControl">,
  specification: SpecificationItem[] | undefined,
): boolean {
  const rows = sortedSpecRows(specification);
  if (rows.length === 0) return false;
  return !isIncomingControlComplete(line, specification);
}

/* ===========================
   LIST PAGE
   =========================== */

export function ReceiptsListPage() {
  return (
    <ReceiptsProvider>
      <ReceiptsListContent />
    </ReceiptsProvider>
  );
}

function ReceiptsListContent() {
  const { sessions, createSession } = useReceipts();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [showDevTools, setShowDevTools] = useState(false);
  const STORAGE_KEY = "bio-receipts";

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
    navigate(`/sklad/postupleniya/${newSession.id}`);
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return sessions.filter((s) => {
      if (statusFilter !== "all" && s.status !== statusFilter) return false;
      if (!q) return true;
      const names = s.lines.map((l) => l.nomenclatureName.toLowerCase()).join(" ");
      const lots = s.lines.map((l) => l.lot.toLowerCase()).join(" ");
      return (
        names.includes(q) ||
        lots.includes(q) ||
        s.id.toLowerCase().includes(q) ||
        s.createdBy.toLowerCase().includes(q)
      );
    });
  }, [sessions, statusFilter, search]);

  const total = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, total);
  const shown = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="p-6 md:p-8 relative">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Поступления
        </h1>
      </header>

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
              Очистка localStorage удалит только данные поступлений.
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

      <div className="mb-4 flex items-center gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          placeholder="Поиск по товару или лоту…"
          className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
        />
        <select
          value={statusFilter}
          onChange={(e) => {
            setPage(1);
            setStatusFilter(e.target.value);
          }}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
          aria-label="Статус"
        >
          <option value="all">Все</option>
          <option value="draft">В процессе</option>
          <option value="completed">Завершено</option>
        </select>
        <button
          onClick={handleCreate}
          className="shrink-0 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-emerald-500"
        >
          Создать поступление
        </button>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <th className="px-4 py-3 font-medium">Номер</th>
                <th className="px-4 py-3 font-medium">Дата</th>
                <th className="px-4 py-3 font-medium">Создал</th>
                <th className="px-4 py-3 font-medium">Товар</th>
                <th className="px-4 py-3 font-medium">Лоты</th>
                <th className="px-4 py-3 font-medium text-right">Кол-во</th>
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
                    Нет документов поступления.
                  </td>
                </tr>
              ) : (
                shown.map((s) => {
                  const totalQty = s.lines.reduce((sum, l) => sum + l.quantity, 0);
                  const names = [...new Set(s.lines.map((l) => l.nomenclatureName))];
                  const lots = [...new Set(s.lines.map((l) => l.lot))];
                  return (
                    <tr
                      key={s.id}
                      onClick={() => navigate(`/sklad/postupleniya/${s.id}`)}
                      className="border-b border-slate-100 last:border-0 hover:bg-slate-50/80 cursor-pointer"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">
                        {s.id.replace("rcpt-", "")}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {formatRuDateTime(s.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{s.createdBy}</td>
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
                        {totalQty || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${
                            s.status === "completed"
                              ? "bg-slate-100 text-slate-600 ring-slate-500/20"
                              : "bg-amber-50 text-amber-700 ring-amber-500/20"
                          }`}
                        >
                          {s.status === "completed" ? "Завершено" : "В процессе"}
                        </span>
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
              {filtered.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1}–
              {Math.min(safePage * PAGE_SIZE, filtered.length)}
            </strong>{" "}
            из{" "}
            <strong className="font-medium text-slate-800">
              {filtered.length}
            </strong>
          </span>
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

export function ReceiptsSessionPage() {
  return (
    <NomenclatureProvider>
      <ReceiptsProvider>
        <ReceiptsSessionContent />
      </ReceiptsProvider>
    </NomenclatureProvider>
  );
}

function ReceiptsSessionContent() {
  const { receiptId } = useParams<{ receiptId: string }>();
  const navigate = useNavigate();
  const { entries: nomenclatureEntries } = useNomenclature();
  const { sessions, addLine, removeLine, updateLine, completeSession, saveDraft, deleteSession } =
    useReceipts();

  const session = useMemo(
    () => sessions.find((s) => s.id === receiptId) ?? null,
    [sessions, receiptId],
  );

  const [page, setPage] = useState(1);
  const [confirmComplete, setConfirmComplete] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saveToast, setSaveToast] = useState<{ message: string; details: string } | null>(
    null,
  );
  const saveToastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Add line modal state
  const places = useMemo(() => getAllStoragePlaces(), []);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addNomSearch, setAddNomSearch] = useState("");
  const [newRow, setNewRow] = useState({
    nomenclatureId: "",
    lot: "",
    serialNumber: "",
    quantity: "",
    place: "",
  });
  const [qtyError, setQtyError] = useState("");
  const [incomingModalLineIndex, setIncomingModalLineIndex] = useState<number | null>(
    null,
  );
  const [incomingControlDraft, setIncomingControlDraft] =
    useState<ReceiptIncomingControlAnswers>({});
  const [incomingNotesDraft, setIncomingNotesDraft] = useState("");
  /** Индекс только что добавленной строки — спросить про переход к ВК. */
  const [afterAddIncomingLineIndex, setAfterAddIncomingLineIndex] = useState<number | null>(
    null,
  );

  const isEditable = session?.status === "draft";

  const filteredCatalog = useMemo(() => {
    const q = addNomSearch.trim().toLowerCase();
    const base = [...MOCK_CATALOG].sort((a, b) => a.name.localeCompare(b.name, "ru"));
    if (!q) return base;
    return base.filter((c) => {
      const hay = `${c.name} ${c.manufacturer} ${c.group} ${c.catalogNumber}`.toLowerCase();
      return hay.includes(q);
    });
  }, [addNomSearch]);

  const selectedCatalogItem = useMemo<CatalogItem | null>(() => {
    if (!newRow.nomenclatureId) return null;
    return MOCK_CATALOG.find((c) => c.id === newRow.nomenclatureId) ?? null;
  }, [newRow.nomenclatureId]);

  const selectedLotData = useMemo(() => {
    if (!selectedCatalogItem || !newRow.lot) return null;
    return selectedCatalogItem.lots.find((l) => l.code === newRow.lot) ?? null;
  }, [selectedCatalogItem, newRow.lot]);

  useEffect(() => {
    if (!session && receiptId) navigate("/sklad/postupleniya", { replace: true });
  }, [session, receiptId, navigate]);

  const incomingModalLine = useMemo(() => {
    if (!session || incomingModalLineIndex === null) return null;
    return session.lines[incomingModalLineIndex] ?? null;
  }, [session, incomingModalLineIndex]);

  const incomingModalSpec = useMemo(() => {
    if (!incomingModalLine) return [];
    const entry = nomenclatureEntries.find((e) => e.id === incomingModalLine.nomenclatureId);
    const raw = entry?.specification ?? [];
    return [...raw].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }, [nomenclatureEntries, incomingModalLine]);

  const completeVkWarnings = useMemo(() => {
    if (!session) return { hasRed: false, hasUnfilled: false };
    let hasRed = false;
    let hasUnfilled = false;
    for (const line of session.lines) {
      const entry = nomenclatureEntries.find((e) => e.id === line.nomenclatureId);
      const spec = entry?.specification;
      if (hasIncomingControlNo(line, spec)) hasRed = true;
      if (hasIncomingControlUnfilled(line, spec)) hasUnfilled = true;
    }
    return { hasRed, hasUnfilled };
  }, [session, nomenclatureEntries]);

  if (!session) return null;

  const totalPages = Math.max(1, Math.ceil(session.lines.length / PAGE_SIZE));
  const paginatedLines = useMemo(
    () => session.lines.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [session, page],
  );

  const handleSaveDraft = () => {
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
    const ok = deleteSession(session.id);
    if (ok) navigate("/sklad/postupleniya", { replace: true });
  };

  const handleAddRow = () => {
    if (!selectedCatalogItem) return;
    const qty = parseInt(newRow.quantity, 10);
    if (!qty || qty <= 0) {
      setQtyError("Введите количество");
      return;
    }
    if (!newRow.lot) {
      setQtyError("Укажите лот");
      return;
    }
    if (!newRow.place) {
      setQtyError("Укажите место хранения");
      return;
    }
    setQtyError("");
    const newLineIndex = session.lines.length;
    const newLength = newLineIndex + 1;
    const targetPage = Math.max(1, Math.ceil(newLength / PAGE_SIZE));
    setPage(targetPage);
    addLine(session.id, {
      nomenclatureId: selectedCatalogItem.id,
      nomenclatureName: selectedCatalogItem.name,
      catalogNumber: selectedCatalogItem.catalogNumber,
      serialNumber: newRow.serialNumber.trim(),
      lot: newRow.lot,
      quantity: qty,
      expiryDate: selectedLotData?.expiryDate || "",
      unit: selectedCatalogItem.unit,
      place: newRow.place,
    });
    setNewRow({
      nomenclatureId: "",
      lot: "",
      serialNumber: "",
      quantity: "",
      place: "",
    });
    setAddNomSearch("");
    setAddModalOpen(false);
    setAfterAddIncomingLineIndex(newLineIndex);
  };

  const openIncomingModal = (lineIndex: number) => {
    const line = session.lines[lineIndex];
    setIncomingControlDraft(line?.incomingControl ? { ...line.incomingControl } : {});
    setIncomingNotesDraft(line?.incomingControlNotes ?? "");
    setIncomingModalLineIndex(lineIndex);
  };

  const closeIncomingModal = () => {
    setIncomingModalLineIndex(null);
    setIncomingControlDraft({});
    setIncomingNotesDraft("");
  };

  const saveIncomingModal = () => {
    if (incomingModalLineIndex === null) return;
    const notes = incomingNotesDraft.trim();
    updateLine(session.id, incomingModalLineIndex, {
      incomingControl: { ...incomingControlDraft },
      incomingControlNotes: notes || undefined,
    });
    setIncomingModalLineIndex(null);
    setIncomingControlDraft({});
    setIncomingNotesDraft("");
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <Link
              to="/sklad/postupleniya"
              className="text-sm text-slate-500 transition hover:text-slate-700"
              title="К списку поступлений"
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
            <h1 className="text-xl font-semibold text-slate-800">Поступление</h1>
          </div>
          <p className="mt-1 text-sm text-slate-500">
            от {formatRuDateTime(session.createdAt)} · Создал: {session.createdBy}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isEditable ? (
            <>
              <button
                onClick={handleSaveDraft}
                className="rounded-lg border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100"
              >
                Сохранить черновик
              </button>
              <button
                onClick={() => setConfirmComplete(true)}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500"
              >
                Завершить
              </button>
              <button
                onClick={() => setConfirmDelete(true)}
                className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-100"
                title="Удалить черновик"
              >
                Удалить
              </button>
            </>
          ) : (
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
              Завершено
            </span>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-[1080px] w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2.5 font-medium">Товар</th>
                <th className="px-4 py-2.5 font-medium">Артикул</th>
                <th className="px-4 py-2.5 font-medium whitespace-nowrap">
                  Серийный №
                </th>
                <th className="px-4 py-2.5 font-medium">Лот</th>
                <th className="px-4 py-2.5 font-medium whitespace-nowrap text-right">
                  Кол-во
                </th>
                <th className="px-4 py-2.5 font-medium whitespace-nowrap">
                  Годен до
                </th>
                <th className="px-4 py-2.5 font-medium">Упаковка</th>
                <th className="px-4 py-2.5 font-medium">Годность</th>
                <th className="px-4 py-2.5 font-medium">Место хранения</th>
                <th
                  className="px-2 py-2.5 w-12 text-center text-xs font-semibold uppercase tracking-wide text-slate-500"
                  title="Входной контроль"
                  aria-label="Входной контроль"
                >
                  ВК
                </th>
                {isEditable && <th className="px-4 py-2.5 font-medium w-10"></th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedLines.map((line) => {
                const realIndex = session.lines.indexOf(line);
                const expiry = line.expiryDate ? formatRuDate(line.expiryDate) : "—";
                const nomEntry = nomenclatureEntries.find((e) => e.id === line.nomenclatureId);
                const spec = nomEntry?.specification;
                const incomingVkHasNo = hasIncomingControlNo(line, spec);
                const incomingVkOk =
                  !incomingVkHasNo && isIncomingControlComplete(line, spec);
                return (
                  <tr
                    key={`${line.nomenclatureId}-${line.lot}-${realIndex}`}
                    className="transition hover:bg-slate-50"
                  >
                    <td className="px-4 py-2.5">
                      <div className="font-medium text-slate-800">
                        {line.nomenclatureName}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {line.quantity} {line.unit}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs text-slate-600">
                      {line.catalogNumber || "—"}
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">
                      {line.serialNumber || "—"}
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs text-slate-600">
                      {line.lot}
                    </td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-slate-700">
                      {line.quantity}
                    </td>
                    <td className="px-4 py-2.5 text-slate-600 text-xs">{expiry}</td>
                    <td className="px-4 py-2.5 text-slate-600">{line.unit}</td>
                    <td className="px-4 py-2.5">
                      <ShelfLifeBadge expiryDate={line.expiryDate} />
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">{line.place}</td>
                    <td className="px-2 py-2.5 text-center">
                      <div className="relative inline-flex items-center justify-center">
                        <button
                          type="button"
                          onClick={() => openIncomingModal(realIndex)}
                          className={
                            incomingVkHasNo
                              ? "inline-flex rounded-md p-1.5 text-red-700 ring-1 ring-red-200 bg-red-50 transition hover:bg-red-100"
                              : incomingVkOk
                                ? "inline-flex rounded-md p-1.5 text-emerald-700 ring-1 ring-emerald-200 bg-emerald-50 transition hover:bg-emerald-100"
                                : "inline-flex rounded-md p-1.5 text-slate-500 transition hover:bg-emerald-50 hover:text-emerald-700"
                          }
                          title={
                            incomingVkHasNo
                              ? "Входной контроль — есть ответы «Нет»"
                              : incomingVkOk
                                ? "Входной контроль — все показатели отмечены"
                                : "Входной контроль"
                          }
                          aria-label={
                            incomingVkHasNo
                              ? "Входной контроль, есть ответы нет"
                              : incomingVkOk
                                ? "Входной контроль, все показатели отмечены"
                                : "Входной контроль по спецификации"
                          }
                        >
                          <svg
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            aria-hidden
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                            />
                          </svg>
                        </button>
                        {incomingVkHasNo ? (
                          <span
                            className="pointer-events-none absolute -bottom-1 -right-1 inline-flex items-center rounded-full bg-red-600 px-1 py-px text-[9px] font-semibold leading-none text-white shadow-sm ring-1 ring-white"
                            title="Есть «Нет»"
                            aria-hidden
                          >
                            нет
                          </span>
                        ) : incomingVkOk ? (
                          <span
                            className="pointer-events-none absolute -bottom-1 -right-1 inline-flex items-center rounded-full bg-emerald-600 px-1 py-px text-[9px] font-semibold leading-none text-white shadow-sm ring-1 ring-white"
                            title="Ок"
                            aria-hidden
                          >
                            ок
                          </span>
                        ) : null}
                      </div>
                    </td>
                    {isEditable && (
                      <td className="px-4 py-2.5 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            setIncomingModalLineIndex(null);
                            setIncomingControlDraft({});
                            setIncomingNotesDraft("");
                            removeLine(session.id, realIndex);
                          }}
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

              {session.lines.length === 0 && (
                <tr>
                  <td
                    colSpan={isEditable ? 11 : 10}
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
              <span className="rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600">
                {page} / {totalPages}
              </span>
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

      {isEditable && (
        <div className="mt-3 flex justify-end">
          <button
            onClick={() => {
              setAddModalOpen(true);
              setQtyError("");
              setAddNomSearch("");
            }}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500"
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

      {/* Add line modal */}
      {isEditable && addModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 pt-16"
          onClick={() => {
            setAddModalOpen(false);
            setQtyError("");
            setAddNomSearch("");
          }}
        >
          <div
            className="relative w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Добавить позицию"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                Добавить позицию
              </h2>
              <button
                type="button"
                onClick={() => {
                  setAddModalOpen(false);
                  setQtyError("");
                  setAddNomSearch("");
                }}
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

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
                  Товар <span className="text-red-500">*</span>
                </label>
                <Combobox
                  value={selectedCatalogItem}
                  onChange={(item: CatalogItem | null) => {
                    setNewRow((r) => ({
                      ...r,
                      nomenclatureId: item?.id ?? "",
                      lot: "",
                    }));
                    setAddNomSearch("");
                  }}
                >
                  <div className="relative">
                    <Combobox.Input
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 pr-9 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                      placeholder="Выберите товар..."
                      autoFocus
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
                    <Combobox.Options className="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-md border border-slate-200 bg-white py-1 text-sm shadow-lg focus:outline-none">
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
                                active ? "bg-emerald-600 text-white" : "text-slate-700"
                              }`
                            }
                          >
                            <div className="flex items-baseline justify-between gap-3">
                              <span className="font-medium">{c.name}</span>
                              <span className="shrink-0 text-xs opacity-80">
                                {c.catalogNumber}
                              </span>
                            </div>
                            <div className="mt-0.5 text-xs opacity-80">
                              {c.manufacturer} · {c.group}
                            </div>
                          </Combobox.Option>
                        ))
                      )}
                    </Combobox.Options>
                  </div>
                </Combobox>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
                  Артикул
                </label>
                <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  <span className="font-mono text-xs">
                    {selectedCatalogItem?.catalogNumber || "—"}
                  </span>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
                  Упаковка
                </label>
                <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  {selectedCatalogItem?.unit || "—"}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
                  Серийный №
                </label>
                <input
                  value={newRow.serialNumber}
                  onChange={(e) =>
                    setNewRow((r) => ({ ...r, serialNumber: e.target.value }))
                  }
                  placeholder="Необязательно"
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
                  Лот <span className="text-red-500">*</span>
                </label>
                <select
                  value={newRow.lot}
                  onChange={(e) => setNewRow((r) => ({ ...r, lot: e.target.value }))}
                  disabled={!selectedCatalogItem}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200 disabled:bg-slate-100 disabled:text-slate-400"
                >
                  <option value="">Выберите лот...</option>
                  {selectedCatalogItem
                    ? selectedCatalogItem.lots.map((l) => (
                        <option key={l.code} value={l.code}>
                          {l.code}
                        </option>
                      ))
                    : []}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
                  Годен до
                </label>
                <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  {selectedLotData?.expiryDate
                    ? formatRuDate(selectedLotData.expiryDate)
                    : "—"}
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
                  Годность
                </label>
                <div className="flex items-center">
                  <ShelfLifeBadge expiryDate={selectedLotData?.expiryDate || ""} />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
                  Место хранения <span className="text-red-500">*</span>
                </label>
                <select
                  value={newRow.place}
                  onChange={(e) =>
                    setNewRow((r) => ({ ...r, place: e.target.value }))
                  }
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                >
                  <option value="">Выберите место...</option>
                  {places.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
                  Кол-во <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  value={newRow.quantity}
                  onChange={(e) => {
                    setNewRow((r) => ({ ...r, quantity: e.target.value }));
                    setQtyError("");
                  }}
                  className={`w-full rounded-md border bg-white px-3 py-2 text-sm outline-none ${
                    qtyError ? "border-red-400 ring-2 ring-red-200" : "border-slate-300"
                  } focus:border-slate-400 focus:ring-2 focus:ring-slate-200`}
                />
                {qtyError && (
                  <p className="mt-1 text-xs text-red-600" role="alert">
                    {qtyError}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
              <button
                type="button"
                onClick={() => {
                  setAddModalOpen(false);
                  setQtyError("");
                  setAddNomSearch("");
                }}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={handleAddRow}
                className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-emerald-500"
              >
                Добавить
              </button>
            </div>
          </div>
        </div>
      )}

      {afterAddIncomingLineIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => setAfterAddIncomingLineIndex(null)}
        >
          <div
            className="mx-4 w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="after-add-incoming-title"
          >
            <h3
              id="after-add-incoming-title"
              className="text-lg font-semibold text-slate-900"
            >
              Позиция добавлена
            </h3>
            <p className="mt-3 text-sm font-medium text-emerald-800">
              Позиция успешно добавлена к поступлению.
            </p>
            <p className="mt-2 text-sm text-slate-600">
              Перейти сейчас к заполнению входного контроля для этой позиции?
            </p>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setAfterAddIncomingLineIndex(null)}
                className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
              >
                Заполню позже
              </button>
              <button
                type="button"
                onClick={() => {
                  const idx = afterAddIncomingLineIndex;
                  setAfterAddIncomingLineIndex(null);
                  if (idx !== null) openIncomingModal(idx);
                }}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500"
              >
                Да, открыть
              </button>
            </div>
          </div>
        </div>
      )}

      {incomingModalLineIndex !== null && incomingModalLine && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 px-4 py-12"
          onClick={closeIncomingModal}
        >
          <div
            className="relative w-full max-w-3xl rounded-xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="incoming-qc-title"
          >
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
              <div>
                <h2
                  id="incoming-qc-title"
                  className="text-lg font-semibold text-slate-900"
                >
                  Входной контроль
                </h2>
                <p className="mt-1 text-sm text-slate-600">{incomingModalLine.nomenclatureName}</p>
                <p className="mt-0.5 font-mono text-xs text-slate-500">
                  Лот {incomingModalLine.lot}
                </p>
              </div>
              <button
                type="button"
                onClick={closeIncomingModal}
                className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                aria-label="Закрыть"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="max-h-[min(70vh,520px)] overflow-y-auto px-5 py-4">
              {incomingModalSpec.length === 0 ? (
                <p className="text-sm text-slate-600">
                  Для этой номенклатуры не задана спецификация. Добавьте её в карточке
                  номенклатуры на вкладке «Спецификация».{" "}
                  <Link
                    to={`/sklad/nomenklatura/${incomingModalLine.nomenclatureId}`}
                    className="font-medium text-emerald-700 underline hover:text-emerald-600"
                    onClick={closeIncomingModal}
                  >
                    Открыть карточку
                  </Link>
                </p>
              ) : (
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase text-slate-500">
                      <th className="px-3 py-2 font-medium">Показатель</th>
                      <th className="px-3 py-2 font-medium">Требование</th>
                      <th className="px-3 py-2 font-medium whitespace-nowrap">Оценка</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {incomingModalSpec.map((row) => {
                      const val = incomingControlDraft[row.id] ?? "Не определено";
                      return (
                        <tr key={row.id} className="align-top">
                          <td className="px-3 py-2.5 font-medium text-slate-800">{row.name}</td>
                          <td className="px-3 py-2.5 text-slate-600">{row.requirement}</td>
                          <td className="px-3 py-2.5">
                            <select
                              value={val}
                              disabled={!isEditable}
                              onChange={(e) => {
                                const v = e.target.value as ReceiptIncomingIndicatorValue;
                                setIncomingControlDraft((d) => ({ ...d, [row.id]: v }));
                              }}
                              className="w-full min-w-[9rem] rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-600"
                            >
                              {INCOMING_INDICATOR_OPTIONS.map((o) => (
                                <option key={o} value={o}>
                                  {o}
                                </option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
              <div className="mt-5 border-t border-slate-200 pt-4">
                <label
                  htmlFor="incoming-qc-notes"
                  className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-slate-500"
                >
                  Примечания{" "}
                  <span className="font-normal normal-case text-slate-400">(необязательно)</span>
                </label>
                <textarea
                  id="incoming-qc-notes"
                  value={incomingNotesDraft}
                  onChange={(e) => setIncomingNotesDraft(e.target.value)}
                  disabled={!isEditable}
                  rows={3}
                  placeholder="При необходимости укажите комментарий…"
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-slate-400 focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-600"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-200 px-5 py-3">
              <button
                type="button"
                onClick={closeIncomingModal}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
              >
                Отмена
              </button>
              <button
                type="button"
                disabled={!isEditable}
                onClick={saveIncomingModal}
                className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-emerald-600"
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}

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
              <div className="text-xs text-emerald-600">{saveToast.details}</div>
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
              Завершить поступление?
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Завершение создаст транзакцию поступления, которая увеличит остатки
              на складе. Действие нельзя отменить.
            </p>
            {(completeVkWarnings.hasRed || completeVkWarnings.hasUnfilled) && (
              <div
                className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-950"
                role="status"
              >
                <p className="font-medium text-amber-900">Входной контроль (ВК)</p>
                <ul className="mt-2 list-inside list-disc space-y-1 text-amber-900/90">
                  {completeVkWarnings.hasUnfilled && (
                    <li>Есть позиции с незаполненным или неполностью заполненным ВК.</li>
                  )}
                  {completeVkWarnings.hasRed && (
                    <li>
                      Есть позиции с ответом «Нет» по показателям (красная индикация ВК).
                    </li>
                  )}
                </ul>
                <p className="mt-2 text-xs leading-snug text-amber-800/85">
                  Вы можете отменить завершение и заполнить ВК либо всё равно завершить
                  поступление.
                </p>
              </div>
            )}
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
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500"
              >
                Завершить
              </button>
            </div>
          </div>
        </div>
      )}

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
                  Удалить поступление?
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

function ShelfLifeBadge({ expiryDate }: { expiryDate: string }) {
  if (!expiryDate) {
    return <span className="text-slate-400">—</span>;
  }
  const now = new Date();
  const expiry = new Date(expiryDate + "T23:59:59");
  const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / 86400000);

  if (daysLeft < 0) {
    return (
      <span className="inline-flex items-center rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 ring-1 ring-red-200">
        просрочен
      </span>
    );
  }
  if (daysLeft <= 30) {
    return (
      <span className="inline-flex items-center rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-amber-200">
        скоро
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800 ring-1 ring-emerald-200">
      ок
    </span>
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

