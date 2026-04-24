import { Link } from "react-router-dom";
import { useMemo, useState, useRef, useEffect } from "react";
import {
  QuarantineProvider,
  useQuarantine,
  type QuarantineStatus,
  type RejectionReason,
} from "../context/QuarantineContext";
import { formatRuDate } from "../mocks/balancesData";
import { ALL_STORAGE_PLACES_META } from "../mocks/storagePlacesMeta";

const PAGE_SIZE = 10;
const STORAGE_KEY = "bio-quarantine";

export function KarantinPage() {
  return (
    <QuarantineProvider>
      <KarantinContent />
    </QuarantineProvider>
  );
}

function KarantinContent() {
  const { entries, updateStatus, updateLabResult, allowEntry } = useQuarantine();
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Toast notifications
  const [toast, setToast] = useState<{
    id: string;
    type: "success" | "error";
    message: string;
  } | null>(null);
  const toastIdRef = useRef(0);

  // Row actions menu
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{
    left: number;
    top: number;
  } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // Modal state
  type ModalState =
    | { type: "lab"; id: string; value: string }
    | { type: "allow"; id: string; name: string; lot: string }
    | {
        type: "reject";
        id: string;
        name: string;
        lot: string;
        reason: RejectionReason;
        reasonOther: string;
        comment: string;
      }
    | { type: "devtools" }
    | null;
  const [modal, setModal] = useState<ModalState>(null);
  const [labInput, setLabInput] = useState("");
  const [rejectReason, setRejectReason] = useState<RejectionReason | "">("");
  const [rejectReasonOther, setRejectReasonOther] = useState("");
  const [rejectComment, setRejectComment] = useState("");
  const [rejectError, setRejectError] = useState("");
  const [allowPlace, setAllowPlace] = useState("");
  const [allowComment, setAllowComment] = useState("");
  const [allowError, setAllowError] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return entries.filter((e) => {
      if (e.status === "брак" || e.status === "разрешён") return false;
      if (groupFilter !== "all" && e.group !== groupFilter) return false;
      if (!q) return true;
      return (
        e.nomenclatureName.toLowerCase().includes(q) ||
        e.lot.toLowerCase().includes(q)
      );
    });
  }, [entries, groupFilter, search]);

  const total = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, total);
  const shown = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const resetFilters = () => {
    setGroupFilter("all");
    setSearch("");
    setPage(1);
  };

  const hasActiveFilters = groupFilter !== "all";

  // Toast functions
  const showToast = (type: "success" | "error", message: string) => {
    const id = (++toastIdRef.current).toString();
    setToast({ id, type, message });
    setTimeout(() => {
      setToast((prev) => (prev?.id === id ? null : prev));
    }, 5000);
  };

  const dismissToast = () => {
    setToast(null);
  };

  // Close menu on outside click
  useEffect(() => {
    if (!openMenuId) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
        setMenuPosition(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [openMenuId]);

  const handleMenuOpen = (id: string, button: HTMLButtonElement) => {
    const rect = button.getBoundingClientRect();
    setMenuPosition({ left: rect.left, top: rect.bottom });
    setOpenMenuId(id);
  };

  const submitLabResult = () => {
    if (!modal || modal.type !== "lab") return;
    updateLabResult(modal.id, labInput.trim());
    setModal(null);
    setLabInput("");
  };

  const submitRejection = () => {
    if (!modal || modal.type !== "reject") return;
    if (!rejectReason) {
      setRejectError("Укажите причину списания.");
      return;
    }
    if (rejectReason === "другие" && !rejectReasonOther.trim()) {
      setRejectError("Опишите причину списания.");
      return;
    }
    updateStatus(
      modal.id,
      "брак",
      rejectReason,
      rejectReason === "другие" ? rejectReasonOther.trim() : undefined,
      rejectComment.trim() || undefined,
    );
    setModal(null);
    setRejectReason("");
    setRejectReasonOther("");
    setRejectComment("");
    setRejectError("");
    showToast("error", "Партия отправлена в брак");
  };

  const submitAllow = () => {
    if (!modal || modal.type !== "allow") return;
    if (!allowPlace) {
      setAllowError("Укажите место хранения, куда выводится партия из карантина.");
      return;
    }
    allowEntry(modal.id, allowPlace, allowComment);
    setModal(null);
    setAllowPlace("");
    setAllowComment("");
    setAllowError("");
    showToast("success", "Партия разрешена к использованию");
  };

  const clearQuarantineLocalStorage = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      window.location.reload();
    } catch {
      // ignore
    }
  };

  return (
    <div className="p-6 md:p-8 relative">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Карантин
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
            aria-label="Фильтры карантина"
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
                  Группа
                </label>
                <select
                  value={groupFilter}
                  onChange={(e) => {
                    setPage(1);
                    setGroupFilter(e.target.value);
                  }}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="all">Все</option>
                  <option value="Проточная цитометрия">
                    Проточная цитометрия
                  </option>
                  <option value="ИФА">ИФА</option>
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

      {/* Lab result modal */}
      {modal && modal.type === "lab" && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 pt-16"
          onClick={() => {
            setModal(null);
            setLabInput("");
          }}
        >
          <div
            className="relative w-full max-w-lg rounded-xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Результат БАК"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                Результат БАК лаборатории
              </h2>
              <button
                type="button"
                onClick={() => {
                  setModal(null);
                  setLabInput("");
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

            <p className="mb-3 text-sm text-slate-600">
              <strong>
                {entries.find((e) => e.id === modal.id)?.nomenclatureName}
              </strong>
              , лот{" "}
              <span className="font-mono">
                {entries.find((e) => e.id === modal.id)?.lot}
              </span>
            </p>

            <div>
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
                Результат
              </label>
              <textarea
                value={labInput}
                onChange={(e) => setLabInput(e.target.value)}
                placeholder="Введите результат БАК…"
                rows={3}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                autoFocus
              />
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
              <button
                type="button"
                onClick={() => {
                  setModal(null);
                  setLabInput("");
                }}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={submitLabResult}
                className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white shadow hover:bg-slate-700"
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Allow release modal */}
      {modal && modal.type === "allow" && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 pt-16"
          onClick={() => {
            setModal(null);
            setAllowPlace("");
            setAllowComment("");
            setAllowError("");
          }}
        >
          <div
            className="relative w-full max-w-lg rounded-xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Разрешить к использованию"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                Разрешить к использованию
              </h2>
              <button
                type="button"
                onClick={() => {
                  setModal(null);
                  setAllowPlace("");
                  setAllowComment("");
                  setAllowError("");
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

            <p className="mb-3 text-sm text-slate-600">
              <strong>{modal.name}</strong>, лот{" "}
              <span className="font-mono">{modal.lot}</span>
            </p>

            <div className="mb-4">
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
                Место хранения <span className="text-red-500">*</span>
              </label>
              <select
                value={allowPlace}
                onChange={(e) => {
                  setAllowPlace(e.target.value);
                  if (allowError) setAllowError("");
                }}
                className={`w-full rounded-md border bg-white px-3 py-2 text-sm outline-none ${
                  allowError && !allowPlace
                    ? "border-red-400 ring-2 ring-red-200"
                    : "border-slate-300"
                } focus:border-slate-400 focus:ring-2 focus:ring-slate-200`}
                autoFocus
              >
                <option value="">Выберите место...</option>
                {ALL_STORAGE_PLACES_META.filter((p) => !p.quarantineZone).map(
                  (p) => (
                    <option
                      key={p.name}
                      value={p.name}
                      title={
                        p.writeOffOnTransfer
                          ? "Зона настроена на автоматическое списание при перемещении"
                          : undefined
                      }
                    >
                      {p.name}
                      {p.writeOffOnTransfer ? " · автосписание" : ""}
                    </option>
                  ),
                )}
              </select>
            </div>

            <div className="mb-4">
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
                Комментарий
              </label>
              <textarea
                value={allowComment}
                onChange={(e) => setAllowComment(e.target.value)}
                placeholder="Необязательный комментарий..."
                rows={2}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              />
            </div>

            {allowError && (
              <p className="mb-3 text-xs text-red-600" role="alert">
                {allowError}
              </p>
            )}

            <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
              <button
                type="button"
                onClick={() => {
                  setModal(null);
                  setAllowPlace("");
                  setAllowComment("");
                  setAllowError("");
                }}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={submitAllow}
                className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-emerald-500"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection reason modal */}
      {modal && modal.type === "reject" && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 pt-16"
          onClick={() => {
            setModal(null);
            setRejectReason("");
            setRejectError("");
          }}
        >
          <div
            className="relative w-full max-w-lg rounded-xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Списание в брак"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                Списание в брак
              </h2>
              <button
                type="button"
                onClick={() => {
                  setModal(null);
                  setRejectReason("");
                  setRejectError("");
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

            <p className="mb-3 text-sm text-slate-600">
              <strong>{modal.name}</strong>, лот{" "}
              <span className="font-mono">{modal.lot}</span>
            </p>

            <div className="mb-4">
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
                Причина списания <span className="text-red-500">*</span>
              </label>
              <select
                value={rejectReason}
                onChange={(e) => {
                  setRejectReason(e.target.value as RejectionReason);
                  setRejectReasonOther("");
                  if (rejectError) setRejectError("");
                }}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                autoFocus
              >
                <option value="">Выберите причину...</option>
                <option value="нарушение стерильности">
                  Нарушение стерильности
                </option>
                <option value="нарушение целостности">
                  Нарушение целостности
                </option>
                <option value="нарушение сроков годности">
                  Нарушение сроков годности
                </option>
                <option value="нарушение условий хранения">
                  Нарушение условий хранения
                </option>
                <option value="другие">Другие</option>
              </select>
            </div>

            {rejectReason === "другие" && (
              <div className="mb-4">
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
                  Описание причины <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectReasonOther}
                  onChange={(e) => {
                    setRejectReasonOther(e.target.value);
                    if (rejectError) setRejectError("");
                  }}
                  placeholder="Опишите причину списания..."
                  rows={2}
                  className={`w-full rounded-md border bg-white px-3 py-2 text-sm outline-none ${rejectError && !rejectReasonOther.trim() ? "border-red-400 ring-2 ring-red-200" : "border-slate-300"} focus:border-slate-400 focus:ring-2 focus:ring-slate-200`}
                />
              </div>
            )}

            <div className="mb-4">
              <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
                Комментарий
              </label>
              <textarea
                value={rejectComment}
                onChange={(e) => setRejectComment(e.target.value)}
                placeholder="Необязательный комментарий..."
                rows={2}
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              />
            </div>

            {rejectError && (
              <p className="mb-3 text-xs text-red-600" role="alert">
                {rejectError}
              </p>
            )}

            <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
              <button
                type="button"
                onClick={() => {
                  setModal(null);
                  setRejectReason("");
                  setRejectReasonOther("");
                  setRejectComment("");
                  setRejectError("");
                }}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={submitRejection}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-red-500"
              >
                Списать
              </button>
            </div>
          </div>
        </div>
      )}

      {modal && modal.type === "devtools" && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 pt-16"
          onClick={() => setModal(null)}
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
                onClick={() => setModal(null)}
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
              Очистка localStorage удалит все данные карантина и восстановит
              исходные mock-данные.
            </p>

            <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
              <button
                type="button"
                onClick={() => setModal(null)}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={clearQuarantineLocalStorage}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-red-500"
              >
                Очистить localStorage
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="mb-4">
        <input
          type="search"
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          placeholder="Поиск по номенклатуре или лоту…"
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
        />
      </div>

      {/* Table */}
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm relative">
        <div ref={menuRef} className="overflow-x-auto">
          <table className="min-w-[1200px] w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <th className="px-4 py-3 font-medium w-10"></th>
                <th className="px-4 py-3 font-medium">Номенклатура</th>
                <th className="px-4 py-3 font-medium">Лот</th>
                <th className="px-4 py-3 font-medium text-right">Количество</th>
                <th className="px-4 py-3 font-medium whitespace-nowrap">
                  Срок годности
                </th>
                <th className="px-4 py-3 font-medium whitespace-nowrap">
                  Дата отправки
                </th>
                <th className="px-4 py-3 font-medium whitespace-nowrap">
                  План. снятие
                </th>
                <th className="px-4 py-3 font-medium">Результат БАК</th>
                <th className="px-4 py-3 font-medium whitespace-nowrap">
                  Статус качества
                </th>
              </tr>
            </thead>
            <tbody>
              {shown.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-12 text-center text-slate-500"
                  >
                    Нет записей по фильтрам.
                  </td>
                </tr>
              ) : (
                shown.map((e) => (
                  <tr
                    key={e.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50/80"
                  >
                    {/* Context menu trigger */}
                    <td className="px-2 py-3 align-middle">
                      <button
                        type="button"
                        ref={(el) => {
                          buttonRefs.current[e.id] = el;
                        }}
                        onClick={(ev) => {
                          ev.stopPropagation();
                          if (openMenuId === e.id) {
                            setOpenMenuId(null);
                            setMenuPosition(null);
                          } else {
                            handleMenuOpen(e.id, ev.currentTarget);
                          }
                        }}
                        className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        aria-label="Действия"
                        title="Действия"
                      >
                        <svg
                          className="size-5"
                          viewBox="0 0 24 24"
                          fill="currentColor"
                        >
                          <circle cx="12" cy="6" r="2" />
                          <circle cx="12" cy="12" r="2" />
                          <circle cx="12" cy="18" r="2" />
                        </svg>
                      </button>
                      {openMenuId === e.id && menuPosition && (
                        <div
                          ref={menuRef}
                          className="fixed z-50 mt-1 w-56 rounded-lg border border-slate-200 bg-white py-1 shadow-xl"
                          style={{
                            left: `${menuPosition.left}px`,
                            top: `${menuPosition.top}px`,
                          }}
                        >
                          {e.status === "карантин" && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  setModal({
                                    type: "lab",
                                    id: e.id,
                                    value: e.labResult,
                                  });
                                  setLabInput(e.labResult);
                                }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                              >
                                <svg
                                  className="size-4 text-slate-500"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M12 20h9" />
                                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                                </svg>
                                Ввести результат БАК
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  setModal({
                                    type: "allow",
                                    id: e.id,
                                    name: e.nomenclatureName,
                                    lot: e.lot,
                                  });
                                  setAllowPlace(e.destinationPlace || "");
                                  setAllowComment("");
                                  setAllowError("");
                                }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-emerald-700 hover:bg-emerald-50"
                              >
                                <svg
                                  className="size-4"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                                Разрешить
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setOpenMenuId(null);
                                  setModal({
                                    type: "reject",
                                    id: e.id,
                                    name: e.nomenclatureName,
                                    lot: e.lot,
                                    reason: "" as RejectionReason,
                                    reasonOther: "",
                                    comment: "",
                                  });
                                  setRejectReason("");
                                  setRejectReasonOther("");
                                  setRejectComment("");
                                  setRejectError("");
                                }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-700 hover:bg-red-50"
                              >
                                <svg
                                  className="size-4"
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
                                Списать в брак
                              </button>
                            </>
                          )}
                          {e.status !== "карантин" && (
                            <span className="block px-3 py-2 text-xs text-slate-400">
                              Нет доступных действий
                            </span>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <Link
                        to={`/sklad/nomenklatura/${e.nomenclatureId}`}
                        className="font-medium text-emerald-700 hover:underline"
                      >
                        {e.nomenclatureName}
                      </Link>
                      <div className="mt-0.5 text-[11px] text-slate-500">
                        {e.group}, {e.manufacturer}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{e.lot}</td>
                    <td className="px-4 py-3 tabular-nums text-right">
                      {e.quantity}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <ExpiryBadge expiryDate={e.expiryDate} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-700">
                      {formatRuDate(e.placedAt.split("T")[0])}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-slate-700">
                      {formatRuDate(e.expectedReleaseDate)}
                    </td>
                    <td className="px-4 py-3 max-w-[200px]">
                      {e.labResult ? (
                        <span className="text-xs text-slate-700 break-words">
                          {e.labResult}
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <StatusBadge status={e.status} />
                        {e.status === "брак" && e.rejectionReason && (
                          <span
                            className="text-xs text-red-600"
                            title={e.rejectionReason}
                          >
                            {e.rejectionReason.length > 30
                              ? e.rejectionReason.slice(0, 30) + "…"
                              : e.rejectionReason}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
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
                {filtered.length === 0
                  ? 0
                  : `${(safePage - 1) * PAGE_SIZE + 1}–${Math.min(safePage * PAGE_SIZE, filtered.length)}`}
              </strong>{" "}
              из{" "}
              <strong className="font-medium text-slate-800">
                {filtered.length}
              </strong>
            </span>
          </div>
          <div className="flex items-center gap-3">
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

      <button
        type="button"
        onClick={() => setModal({ type: "devtools" })}
        className="fixed bottom-4 right-4 z-[55] rounded-md p-2 text-slate-300 hover:bg-slate-100 hover:text-slate-600 print:hidden"
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

      {/* Toast notification */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
          <div
            className={`flex items-center gap-3 rounded-lg p-4 shadow-lg ${
              toast.type === "success"
                ? "bg-emerald-50 text-emerald-900 border border-emerald-200"
                : "bg-red-50 text-red-900 border border-red-200"
            }`}
          >
            <div
              className={`flex-shrink-0 ${
                toast.type === "success" ? "text-emerald-500" : "text-red-500"
              }`}
            >
              {toast.type === "success" ? (
                <svg
                  className="size-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg
                  className="size-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              )}
            </div>
            <span className="flex-1 text-sm font-medium">{toast.message}</span>
            <button
              type="button"
              onClick={dismissToast}
              className={`flex-shrink-0 rounded-md p-1 hover:bg-black/5 ${
                toast.type === "success"
                  ? "text-emerald-700 hover:text-emerald-900"
                  : "text-red-700 hover:text-red-900"
              }`}
              aria-label="Закрыть уведомление"
            >
              <svg
                className="size-4"
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
        </div>
      )}
    </div>
  );
}

function ExpiryBadge({ expiryDate }: { expiryDate: string }) {
  const now = new Date();
  const expiry = new Date(expiryDate + "T23:59:59");
  const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / 86400000);

  if (daysLeft < 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700 ring-1 ring-red-200">
        <span className="size-1.5 rounded-full bg-red-500" />
        просрочен{" "}
        <span className="ml-0.5 text-red-500">{formatRuDate(expiryDate)}</span>
      </span>
    );
  }
  if (daysLeft <= 30) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800 ring-1 ring-amber-200">
        <span className="size-1.5 rounded-full bg-amber-500" />
        скоро истекает{" "}
        <span className="ml-0.5 text-amber-600">
          {formatRuDate(expiryDate)}
        </span>
      </span>
    );
  }
  return <span className="text-slate-700">{formatRuDate(expiryDate)}</span>;
}

function StatusBadge({ status }: { status: QuarantineStatus }) {
  const styles: Record<QuarantineStatus, string> = {
    карантин: "bg-amber-50 text-amber-900 ring-amber-200",
    разрешён: "bg-emerald-50 text-emerald-900 ring-emerald-200",
    брак: "bg-red-50 text-red-900 ring-red-200",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${styles[status]}`}
    >
      {status}
    </span>
  );
}
