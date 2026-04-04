import { Link, Outlet, useNavigate, useParams } from "react-router-dom";
import { useMemo, useState } from "react";
import {
  TransfersProvider,
  useTransfers,
  type TransferDocument,
  type TransferStatus,
} from "../context/TransfersContext";
import {
  getAllStoragePlaces,
  getPositiveStockAtPlace,
} from "../mocks/balancesData";
import {
  WRITE_OFF_BADGE_LABEL,
  writesOffOnTransferTo,
} from "../mocks/storagePlacesMeta";
import type { TransferLine } from "../mocks/transfersData";

const DOCS_PAGE_SIZE = 10;

const MOCK_USER = { name: "Анна Смирнова", initials: "АС" };

type SortDir = "asc" | "desc";

export function TransfersLayout() {
  return (
    <TransfersProvider>
      <Outlet />
    </TransfersProvider>
  );
}

export function PeremeshcheniyaListPage() {
  const { documents } = useTransfers();
  const navigate = useNavigate();
  const places = useMemo(() => getAllStoragePlaces(), []);

  const [statusFilter, setStatusFilter] = useState<TransferStatus | "all">(
    "all",
  );
  const [fromFilter, setFromFilter] = useState<string>("");
  const [toFilter, setToFilter] = useState<string>("");
  const [search, setSearch] = useState("");

  const [sortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filteredDocs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return documents.filter((d) => {
      if (statusFilter !== "all" && d.status !== statusFilter) return false;
      if (fromFilter && d.fromPlace !== fromFilter) return false;
      if (toFilter && d.toPlace !== toFilter) return false;
      if (!q) return true;
      if (d.number.toLowerCase().includes(q)) return true;
      return d.lines.some((l) => l.nomenclatureName.toLowerCase().includes(q));
    });
  }, [documents, statusFilter, fromFilter, toFilter, search]);

  const sortedDocs = useMemo(() => {
    const sorted = [...filteredDocs].sort((a, b) => {
      const mul = sortDir === "asc" ? 1 : -1;
      return mul * (Number(a.number) - Number(b.number));
    });
    return sorted;
  }, [filteredDocs, sortDir]);

  const totalDocPages = Math.max(
    1,
    Math.ceil(sortedDocs.length / DOCS_PAGE_SIZE),
  );
  const safeDocPage = Math.min(page, totalDocPages);
  const pageDocs = sortedDocs.slice(
    (safeDocPage - 1) * DOCS_PAGE_SIZE,
    safeDocPage * DOCS_PAGE_SIZE,
  );

  const resetFilters = () => {
    setStatusFilter("all");
    setFromFilter("");
    setToFilter("");
    setSearch("");
    setPage(1);
  };

  const hasActiveFilters = statusFilter !== "all" || fromFilter || toFilter;

  return (
    <div className="p-6 md:p-8">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Перемещения
        </h1>
      </header>

      {/* Модальное окно фильтров */}
      {filtersOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 pt-16"
          onClick={() => setFiltersOpen(false)}
        >
          <div
            className="relative w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Фильтры журнала"
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

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
                  Статус
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => {
                    setPage(1);
                    setStatusFilter(e.target.value as TransferStatus | "all");
                  }}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="all">Все</option>
                  <option value="черновик">Черновик</option>
                  <option value="проведено">Проведено</option>
                  <option value="отменено">Отменено</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
                  Откуда
                </label>
                <select
                  value={fromFilter}
                  onChange={(e) => {
                    setPage(1);
                    setFromFilter(e.target.value);
                  }}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="">Все</option>
                  {places.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
                  Куда
                </label>
                <select
                  value={toFilter}
                  onChange={(e) => {
                    setPage(1);
                    setToFilter(e.target.value);
                  }}
                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="">Все</option>
                  {places.map((p) => (
                    <option key={p} value={p}>
                      {p}
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

      {/* Строка поиска и кнопка добавления */}
      <div className="mb-4 flex gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          placeholder="Поиск по номеру или наименованию…"
          className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
        />
        <button
          type="button"
          onClick={() => navigate("/sklad/peremeshcheniya/novoe")}
          className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-emerald-500"
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
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Добавить перемещение
        </button>
      </div>

      <div className="mb-10 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-[960px] w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <th className="px-4 py-3 font-medium">Номер</th>
                <th className="px-4 py-3 font-medium whitespace-nowrap">
                  Дата
                </th>
                <th className="px-4 py-3 font-medium">Откуда → куда</th>
                <th className="px-4 py-3 font-medium min-w-[220px]">Состав</th>
                <th className="px-4 py-3 font-medium whitespace-nowrap">
                  На входе
                </th>
                <th className="px-4 py-3 font-medium whitespace-nowrap">
                  Строк
                </th>
                <th className="px-4 py-3 font-medium">Статус</th>
                <th className="px-4 py-3 font-medium">Исполнитель</th>
              </tr>
            </thead>
            <tbody>
              {pageDocs.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-12 text-center text-slate-500"
                  >
                    Нет документов по фильтрам.
                  </td>
                </tr>
              ) : (
                pageDocs.map((d) => (
                  <tr
                    key={d.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50/80"
                  >
                    <td className="px-4 py-3">
                      <Link
                        to={`/sklad/peremeshcheniya/${d.id}`}
                        className="font-medium text-emerald-700 hover:underline"
                      >
                        {d.number}
                      </Link>
                    </td>
                    <td className="px-4 py-3 tabular-nums text-slate-700 whitespace-nowrap">
                      {new Date(d.createdAt).toLocaleString("ru-RU", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      <span className="text-slate-600">{d.fromPlace}</span>
                      <span className="mx-1.5 text-slate-400">→</span>
                      <span>{d.toPlace}</span>
                    </td>
                    <td className="align-top px-4 py-3">
                      <TransferLinesPreview lines={d.lines} />
                    </td>
                    <td className="px-4 py-3 align-top">
                      {d.writeOffAtDestination ? (
                        <WriteOffBadge compact />
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 tabular-nums">{d.lines.length}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={d.status} />
                    </td>
                    <td className="px-4 py-3">{d.executor}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-600">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className={`rounded-md border border-slate-300 bg-white p-2 shadow-sm hover:bg-slate-50 ${hasActiveFilters ? "border-slate-400 bg-slate-100 ring-2 ring-slate-200" : ""}`}
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
                <span className="ml-1.5 inline-block size-1.5 rounded-full bg-emerald-500"></span>
              )}
            </button>
            <span>
              Показано{" "}
              <strong className="font-medium text-slate-800">
                {sortedDocs.length === 0
                  ? 0
                  : `${(safeDocPage - 1) * DOCS_PAGE_SIZE + 1}–${Math.min(
                      safeDocPage * DOCS_PAGE_SIZE,
                      sortedDocs.length,
                    )}`}
              </strong>{" "}
              из{" "}
              <strong className="font-medium text-slate-800">
                {sortedDocs.length}
              </strong>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              disabled={safeDocPage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              ← Назад
            </button>
            <span className="tabular-nums text-slate-700">
              Стр. {safeDocPage} / {totalDocPages}
            </span>
            <button
              type="button"
              disabled={safeDocPage >= totalDocPages}
              onClick={() => setPage((p) => Math.min(totalDocPages, p + 1))}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Вперёд →
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

export function PeremeshcheniyaCreatePage() {
  const { addDocument } = useTransfers();
  const navigate = useNavigate();
  const places = useMemo(() => getAllStoragePlaces(), []);

  const [fromPlace, setFromPlace] = useState("");
  const [toPlace, setToPlace] = useState("");
  const [comment, setComment] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [draftLines, setDraftLines] = useState<DraftLine[]>(() => [
    emptyLine(),
  ]);

  const availability = useMemo(
    () => (fromPlace ? getPositiveStockAtPlace(fromPlace) : []),
    [fromPlace],
  );

  const nomOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const row of availability) {
      if (!map.has(row.nomenclatureId)) {
        map.set(row.nomenclatureId, row.nomenclatureName);
      }
    }
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1], "ru"));
  }, [availability]);

  const submitCreate = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!fromPlace || !toPlace) {
      setFormError("Укажите место «откуда» и «куда».");
      return;
    }
    if (fromPlace === toPlace) {
      setFormError("Места «откуда» и «куда» должны различаться.");
      return;
    }
    const builtLines: TransferDocument["lines"] = [];
    for (const row of draftLines) {
      if (!row.nomenclatureId || !row.lot) continue;
      const qty = Number(row.quantity);
      if (!Number.isFinite(qty) || qty <= 0) {
        setFormError(
          "Укажите положительное количество во всех заполненных строках.",
        );
        return;
      }
      const stock = availability.find(
        (a) => a.nomenclatureId === row.nomenclatureId && a.lot === row.lot,
      );
      if (!stock) {
        setFormError("Строка не соответствует остатку в выбранном месте.");
        return;
      }
      if (qty > stock.quantity) {
        setFormError(
          `По ${stock.nomenclatureName}, лот ${stock.lot} доступно не более ${stock.quantity} ед.`,
        );
        return;
      }
      builtLines.push({
        nomenclatureId: stock.nomenclatureId,
        nomenclatureName: stock.nomenclatureName,
        lot: stock.lot,
        quantity: qty,
      });
    }
    if (builtLines.length === 0) {
      setFormError(
        "Добавьте хотя бы одну позицию с номенклатурой, лотом и количеством.",
      );
      return;
    }

    const writeOffAtDestination = writesOffOnTransferTo(toPlace);
    if (writeOffAtDestination) {
      const ok = window.confirm(
        `Место назначения «${toPlace}» настроено на «Списывать при перемещении». ` +
          "После проведения документа перенесённый товар будет автоматически списан и не останется на остатках в этой зоне. Продолжить создание черновика?",
      );
      if (!ok) return;
    }

    const { id } = addDocument({
      status: "черновик",
      fromPlace,
      toPlace,
      writeOffAtDestination,
      executor: MOCK_USER.name,
      comment: comment.trim(),
      lines: builtLines,
    });
    navigate(`/sklad/peremeshcheniya/${id}`);
  };

  const syncFromPlace = (v: string) => {
    setFromPlace(v);
    setDraftLines([emptyLine()]);
  };

  return (
    <div className="p-6 md:p-8">
      <Link
        to="/sklad/peremeshcheniya"
        className="mb-4 inline-flex text-sm font-medium text-emerald-700 hover:underline"
      >
        ← К журналу перемещений
      </Link>

      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
        Новое перемещение
      </h1>

      <form className="mt-6 space-y-6" onSubmit={submitCreate}>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
              Откуда
            </label>
            <select
              required
              value={fromPlace}
              onChange={(e) => syncFromPlace(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">Выберите место</option>
              {places.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
              Куда
            </label>
            <select
              required
              value={toPlace}
              onChange={(e) => setToPlace(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
              aria-describedby={
                writesOffOnTransferTo(toPlace) ? "to-writeoff-hint" : undefined
              }
            >
              <option value="">Выберите место</option>
              {places.map((p) => (
                <option
                  key={p}
                  value={p}
                  title={
                    writesOffOnTransferTo(p)
                      ? "Списывать при перемещении: при проведении товар будет автоматически списан"
                      : undefined
                  }
                >
                  {p}
                  {writesOffOnTransferTo(p) ? " · списание при входе" : ""}
                </option>
              ))}
            </select>
            {writesOffOnTransferTo(toPlace) ? (
              <p
                id="to-writeoff-hint"
                className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950"
                role="status"
              >
                <strong className="font-semibold">Место «{toPlace}»:</strong>{" "}
                включена настройка «Списывать при перемещении». После проведения
                документа перенесённые позиции будут автоматически списаны;
                складской остаток в зоне назначения не формируется.
              </p>
            ) : null}
          </div>
          <div className="md:col-span-2 lg:col-span-4">
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
              Комментарий
            </label>
            <input
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Необязательно"
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-slate-800">
              Позиции (номенклатура + лот)
            </span>
            <button
              type="button"
              onClick={() => setDraftLines((rows) => [...rows, emptyLine()])}
              disabled={!fromPlace}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Добавить строку
            </button>
          </div>

          {!fromPlace ? (
            <p className="text-sm text-slate-500">
              Сначала выберите место «откуда», чтобы подставить доступные лоты.
            </p>
          ) : availability.length === 0 ? (
            <p className="text-sm text-amber-800">
              В этом месте нет положительных остатков в мок-данных.
            </p>
          ) : (
            <ul className="space-y-3">
              {draftLines.map((row) => (
                <li
                  key={row.key}
                  className="flex flex-wrap items-end gap-3 rounded-lg border border-slate-200 bg-slate-50/80 p-3"
                >
                  <div className="min-w-[200px] flex-1">
                    <label className="mb-1 block text-xs text-slate-500">
                      Номенклатура
                    </label>
                    <select
                      value={row.nomenclatureId}
                      onChange={(e) =>
                        updateDraftLine(row.key, (r) => ({
                          ...r,
                          nomenclatureId: e.target.value,
                          lot: "",
                          quantity: "",
                        }))
                      }
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
                    >
                      <option value="">—</option>
                      {nomOptions.map(([id, name]) => (
                        <option key={id} value={id}>
                          {name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="min-w-[120px]">
                    <label className="mb-1 block text-xs text-slate-500">
                      Лот
                    </label>
                    <select
                      value={row.lot}
                      onChange={(e) =>
                        updateDraftLine(row.key, (r) => ({
                          ...r,
                          lot: e.target.value,
                          quantity: "",
                        }))
                      }
                      disabled={!row.nomenclatureId}
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm disabled:opacity-50"
                    >
                      <option value="">—</option>
                      {availability
                        .filter((a) => a.nomenclatureId === row.nomenclatureId)
                        .map((a) => (
                          <option key={a.lot} value={a.lot}>
                            {a.lot} (доступно {a.quantity})
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="w-28">
                    <label className="mb-1 block text-xs text-slate-500">
                      Кол-во
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={row.quantity}
                      onChange={(e) =>
                        updateDraftLine(row.key, (r) => ({
                          ...r,
                          quantity: e.target.value,
                        }))
                      }
                      disabled={!row.lot}
                      className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm disabled:opacity-50"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setDraftLines((rows) =>
                        rows.filter((r) => r.key !== row.key),
                      )
                    }
                    disabled={draftLines.length <= 1}
                    className="mb-0.5 rounded-md px-2 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-30"
                  >
                    Удалить
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {formError ? (
          <p className="text-sm font-medium text-red-700" role="alert">
            {formError}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white shadow hover:bg-slate-700"
          >
            Создать черновик
          </button>
        </div>
      </form>
    </div>
  );

  function updateDraftLine(key: string, fn: (r: DraftLine) => DraftLine) {
    setDraftLines((rows) => rows.map((r) => (r.key === key ? fn(r) : r)));
  }
}

export function PeremeshcheniyaDetailPage() {
  const { transferId } = useParams<{ transferId: string }>();
  const { documents, updateStatus } = useTransfers();
  const doc = documents.find((d) => d.id === transferId);

  if (!transferId || !doc) {
    return (
      <div className="p-8">
        <p className="text-slate-600">Документ не найден.</p>
        <Link
          to="/sklad/peremeshcheniya"
          className="mt-4 inline-block text-sm font-medium text-emerald-700 hover:underline"
        >
          ← К журналу перемещений
        </Link>
      </div>
    );
  }

  const canAct = doc.status === "черновик";

  return (
    <div className="p-6 md:p-8">
      <Link
        to="/sklad/peremeshcheniya"
        className="mb-4 inline-flex text-sm font-medium text-emerald-700 hover:underline"
      >
        ← К журналу перемещений
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            {doc.number}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            {new Date(doc.createdAt).toLocaleString("ru-RU")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={doc.status} large />
          {doc.writeOffAtDestination ? <WriteOffBadge /> : null}
        </div>
      </div>

      {doc.writeOffAtDestination ? (
        <div
          className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950"
          role="status"
        >
          <strong className="font-semibold">Автоматическое списание.</strong>{" "}
          Место назначения «{doc.toPlace}» помечено как зона со списанием при
          перемещении: при проведении документа перенесённый товар списывается и
          не учитывается как остаток в этой зоне.
        </div>
      ) : null}

      <dl className="mt-6 grid max-w-2xl gap-3 sm:grid-cols-2">
        <div className="rounded-md border border-slate-100 bg-slate-50/80 px-3 py-2">
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Откуда
          </dt>
          <dd className="text-sm text-slate-900">{doc.fromPlace}</dd>
        </div>
        <div className="rounded-md border border-slate-100 bg-slate-50/80 px-3 py-2">
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Куда
          </dt>
          <dd className="flex flex-wrap items-center gap-2 text-sm text-slate-900">
            <span>{doc.toPlace}</span>
            {doc.writeOffAtDestination ? <WriteOffBadge compact /> : null}
          </dd>
        </div>
        <div className="rounded-md border border-slate-100 bg-slate-50/80 px-3 py-2 sm:col-span-2">
          <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Исполнитель
          </dt>
          <dd className="text-sm text-slate-900">{doc.executor}</dd>
        </div>
        {doc.comment ? (
          <div className="rounded-md border border-slate-100 bg-slate-50/80 px-3 py-2 sm:col-span-2">
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Комментарий
            </dt>
            <dd className="text-sm text-slate-900">{doc.comment}</dd>
          </div>
        ) : null}
      </dl>

      <h2 className="mt-8 text-lg font-semibold text-slate-900">Позиции</h2>
      <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-[640px] w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <th className="px-4 py-3 font-medium">Номенклатура</th>
                <th className="px-4 py-3 font-medium">Лот</th>
                <th className="px-4 py-3 font-medium whitespace-nowrap">
                  Количество
                </th>
              </tr>
            </thead>
            <tbody>
              {doc.lines.map((l, i) => (
                <tr
                  key={`${l.nomenclatureId}-${l.lot}-${i}`}
                  className="border-b border-slate-100 last:border-0"
                >
                  <td className="px-4 py-3">
                    <Link
                      to={`/sklad/nomenklatura/${l.nomenclatureId}`}
                      className="font-medium text-emerald-700 hover:underline"
                    >
                      {l.nomenclatureName}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{l.lot}</td>
                  <td className="px-4 py-3 tabular-nums">{l.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {canAct ? (
        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            className="rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
            onClick={() => {
              updateStatus(doc.id, "проведено");
              const extra = doc.writeOffAtDestination
                ? "\n\nУчтено: автоматическое списание перенесённых позиций (макет)."
                : "";
              window.alert(`Документ проведён.${extra}`);
            }}
          >
            Провести
          </button>
          <button
            type="button"
            className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-red-700 shadow-sm hover:bg-red-50"
            onClick={() => {
              updateStatus(doc.id, "отменено");
            }}
          >
            Отменить
          </button>
        </div>
      ) : null}
    </div>
  );
}

const PREVIEW_LINES = 2;

function TransferLinesPreview({ lines }: { lines: TransferLine[] }) {
  if (lines.length === 0) {
    return <span className="text-slate-400">—</span>;
  }
  const shown = lines.slice(0, PREVIEW_LINES);
  const rest = lines.length - shown.length;
  const title = lines
    .map((l) => `${l.nomenclatureName} · лот ${l.lot} · ${l.quantity} ед.`)
    .join("\n");

  return (
    <div className="max-w-[min(320px,40vw)]" title={title}>
      <ul className="space-y-1">
        {shown.map((l, idx) => (
          <li
            key={`${l.nomenclatureId}-${l.lot}-${idx}`}
            className="text-sm leading-snug text-slate-800"
          >
            <span className="line-clamp-2">{l.nomenclatureName}</span>
            <span className="block text-xs text-slate-500">
              {l.lot} · {l.quantity} ед.
            </span>
          </li>
        ))}
      </ul>
      {rest > 0 ? (
        <p className="mt-1.5 text-xs font-medium text-slate-500">
          и ещё {rest}
        </p>
      ) : null}
    </div>
  );
}

function WriteOffBadge({ compact }: { compact?: boolean }) {
  const size = compact ? "text-[10px] px-1.5 py-0.5" : "text-xs px-2 py-1";
  return (
    <span
      className={`inline-flex items-center rounded-md font-semibold uppercase tracking-wide bg-amber-100 text-amber-900 ring-1 ring-amber-300/80 ${size}`}
      title="Автоматическое списание при проведении перемещения в эту зону"
    >
      {WRITE_OFF_BADGE_LABEL}
    </span>
  );
}

function StatusBadge({
  status,
  large,
}: {
  status: TransferStatus;
  large?: boolean;
}) {
  const styles: Record<TransferStatus, string> = {
    черновик: "bg-amber-50 text-amber-900 ring-amber-200",
    проведено: "bg-emerald-50 text-emerald-900 ring-emerald-200",
    отменено: "bg-slate-100 text-slate-600 ring-slate-200",
  };
  const size = large ? "px-3 py-1 text-sm" : "px-2 py-0.5 text-xs";
  return (
    <span
      className={`inline-flex rounded-full font-medium ring-1 ${styles[status]} ${size}`}
    >
      {status}
    </span>
  );
}

type DraftLine = {
  key: string;
  nomenclatureId: string;
  lot: string;
  quantity: string;
};

function emptyLine(): DraftLine {
  return {
    key:
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : String(Math.random()),
    nomenclatureId: "",
    lot: "",
    quantity: "",
  };
}
