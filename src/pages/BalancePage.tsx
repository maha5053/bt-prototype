import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import {
  ALL_GROUPS,
  type BalanceRow,
  buildBalanceRows,
  formatRuDate,
  getAllStoragePlaces,
  isOverdue,
  type NomenclatureGroup,
} from "../mocks/balancesData";

const PAGE_SIZE = 7;

type TabKey = "summary" | "places";

type PlaceSortKey =
  | "name"
  | "catalogNumber"
  | "group"
  | "lotCode"
  | "quantity"
  | "expiryDate"
  | "place";
type SummarySortKey =
  | "name"
  | "catalogNumber"
  | "group"
  | "totalQty"
  | "minExpiryDate";
type SortDir = "asc" | "desc";

interface SummaryRow {
  nomenclatureId: string;
  name: string;
  catalogNumber: string;
  group: NomenclatureGroup;
  totalQty: number;
  lotCount: number;
  minExpiryDate: string;
}

function useTabFilters(allRows: BalanceRow[], storagePlaces: string[]) {
  const [searchQuery, setSearchQuery] = useState("");
  const [onlyPositive, setOnlyPositive] = useState(true);
  const [selectedPlaces, setSelectedPlaces] = useState<Set<string>>(
    () => new Set(),
  );
  const [expiryBefore, setExpiryBefore] = useState("");
  const [group, setGroup] = useState<NomenclatureGroup | "all">("all");
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filtered = useMemo(() => {
    const sq = searchQuery.trim().toLowerCase();
    const now = new Date();

    let rows = allRows;
    if (onlyPositive) rows = rows.filter((r) => r.quantity > 0);
    if (sq) {
      rows = rows.filter(
        (r) =>
          r.name.toLowerCase().includes(sq) ||
          r.catalogNumber.toLowerCase().includes(sq) ||
          r.lotCode.toLowerCase().includes(sq),
      );
    }
    if (group !== "all") rows = rows.filter((r) => r.group === group);
    if (selectedPlaces.size > 0) {
      rows = rows.filter((r) => selectedPlaces.has(r.place));
    }
    if (expiryBefore) {
      rows = rows.filter((r) => r.expiryDate <= expiryBefore);
    }
    if (overdueOnly) {
      rows = rows.filter((r) => isOverdue(r.expiryDate, now));
    }

    return rows;
  }, [
    allRows,
    onlyPositive,
    searchQuery,
    group,
    selectedPlaces,
    expiryBefore,
    overdueOnly,
  ]);

  const togglePlace = (place: string) => {
    setPage(1);
    setSelectedPlaces((prev) => {
      const next = new Set(prev);
      if (next.has(place)) next.delete(place);
      else next.add(place);
      return next;
    });
  };

  const resetFilters = () => {
    setSearchQuery("");
    setOnlyPositive(true);
    setSelectedPlaces(new Set());
    setExpiryBefore("");
    setGroup("all");
    setOverdueOnly(false);
    setPage(1);
  };

  const hasActiveFilters =
    !onlyPositive ||
    selectedPlaces.size > 0 ||
    expiryBefore !== "" ||
    group !== "all" ||
    overdueOnly;

  const FiltersModal = () => (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 pt-16"
      onClick={() => setFiltersOpen(false)}
    >
      <div
        className="relative w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Фильтры"
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

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
              Группа
            </label>
            <select
              value={group}
              onChange={(e) => {
                setPage(1);
                setGroup(e.target.value as NomenclatureGroup | "all");
              }}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="all">Все группы</option>
              {ALL_GROUPS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
              Срок годности (не позднее)
            </label>
            <input
              type="date"
              value={expiryBefore}
              onChange={(e) => {
                setPage(1);
                setExpiryBefore(e.target.value);
              }}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
            />
          </div>

          <div>
            <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
              Места хранения
            </span>
            <div className="flex flex-wrap gap-2">
              {storagePlaces.map((p) => (
                <label
                  key={p}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700 shadow-sm hover:bg-slate-50 has-[:checked]:border-slate-400 has-[:checked]:bg-slate-100"
                >
                  <input
                    type="checkbox"
                    checked={selectedPlaces.has(p)}
                    onChange={() => togglePlace(p)}
                    className="size-3.5 rounded border-slate-300"
                  />
                  {p}
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={onlyPositive}
                onChange={(e) => {
                  setPage(1);
                  setOnlyPositive(e.target.checked);
                }}
                className="size-4 rounded border-slate-300 text-slate-800 focus:ring-slate-400"
              />
              Только остаток &gt; 0
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={overdueOnly}
                onChange={(e) => {
                  setPage(1);
                  setOverdueOnly(e.target.checked);
                }}
                className="size-4 rounded border-slate-300 text-red-600 focus:ring-slate-400"
              />
              Только просроченные
            </label>
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
  );

  return {
    searchQuery,
    setSearchQuery,
    onlyPositive,
    setOnlyPositive,
    selectedPlaces,
    expiryBefore,
    group,
    overdueOnly,
    sortDir,
    setSortDir,
    page,
    setPage,
    filtersOpen,
    setFiltersOpen,
    filtered,
    togglePlace,
    resetFilters,
    hasActiveFilters,
    FiltersModal,
  };
}

export function BalancePage() {
  const allRows = useMemo(() => buildBalanceRows(), []);
  const storagePlaces = useMemo(() => getAllStoragePlaces(), []);

  const [tab, setTab] = useState<TabKey>("summary");

  const summaryFilters = useTabFilters(allRows, storagePlaces);
  const placeFilters = useTabFilters(allRows, storagePlaces);

  const [summarySortKey, setSummarySortKey] = useState<SummarySortKey>("name");
  const [placeSortKey, setPlaceSortKey] = useState<PlaceSortKey>("name");

  // Summary: aggregated by nomenclature
  const summaryRows: SummaryRow[] = useMemo(() => {
    // Start with allRows to ensure lotCount is calculated correctly
    let rows = allRows;

    // Apply filters that define the scope of aggregation
    if (summaryFilters.group !== "all")
      rows = rows.filter((r) => r.group === summaryFilters.group);
    if (summaryFilters.selectedPlaces.size > 0) {
      rows = rows.filter((r) => summaryFilters.selectedPlaces.has(r.place));
    }
    if (summaryFilters.expiryBefore) {
      rows = rows.filter((r) => r.expiryDate <= summaryFilters.expiryBefore);
    }
    if (summaryFilters.overdueOnly) {
      const now = new Date();
      rows = rows.filter((r) => isOverdue(r.expiryDate, now));
    }

    // Aggregate
    const map = new Map<string, SummaryRow>();
    for (const row of rows) {
      const existing = map.get(row.nomenclatureId);
      if (existing) {
        existing.totalQty += row.quantity;
        existing.lotCount += 1;
        if (row.expiryDate < existing.minExpiryDate) {
          existing.minExpiryDate = row.expiryDate;
        }
      } else {
        map.set(row.nomenclatureId, {
          nomenclatureId: row.nomenclatureId,
          name: row.name,
          catalogNumber: row.catalogNumber,
          group: row.group,
          totalQty: row.quantity,
          lotCount: 1,
          minExpiryDate: row.expiryDate,
        });
      }
    }

    let result = [...map.values()];

    // Apply search
    const sq = summaryFilters.searchQuery.trim().toLowerCase();
    if (sq) {
      result = result.filter(
        (r) =>
          r.name.toLowerCase().includes(sq) ||
          r.catalogNumber.toLowerCase().includes(sq),
      );
    }

    // Apply onlyPositive to the aggregated result
    if (summaryFilters.onlyPositive) {
      result = result.filter((r) => r.totalQty > 0);
    }

    // Sort
    result.sort((a, b) => {
      const mul = summaryFilters.sortDir === "asc" ? 1 : -1;
      if (summarySortKey === "totalQty") return mul * (a.totalQty - b.totalQty);
      if (summarySortKey === "minExpiryDate")
        return mul * a.minExpiryDate.localeCompare(b.minExpiryDate);
      return (
        mul *
        String(a[summarySortKey]).localeCompare(String(b[summarySortKey]), "ru")
      );
    });

    return result;
  }, [allRows, summaryFilters, summarySortKey]);

  // Places: sorted per-lot rows
  const sortedPlaces = useMemo(() => {
    const sorted = [...placeFilters.filtered].sort((a, b) => {
      const mul = placeFilters.sortDir === "asc" ? 1 : -1;
      if (placeSortKey === "quantity") {
        return mul * (a.quantity - b.quantity);
      }
      return (
        mul *
        String(a[placeSortKey]).localeCompare(String(b[placeSortKey]), "ru")
      );
    });
    return sorted;
  }, [placeFilters, placeSortKey]);

  const currentData = tab === "summary" ? summaryRows : sortedPlaces;
  const currentTotal = currentData.length;
  const totalPages = Math.max(1, Math.ceil(currentTotal / PAGE_SIZE));
  const safePage = Math.min(
    tab === "summary" ? summaryFilters.page : placeFilters.page,
    totalPages,
  );
  const pageData = currentData.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const toggleSummarySort = (key: SummarySortKey) => {
    summaryFilters.setPage(1);
    if (summarySortKey === key) {
      summaryFilters.setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSummarySortKey(key);
      summaryFilters.setSortDir("asc");
    }
  };

  const togglePlaceSort = (key: PlaceSortKey) => {
    placeFilters.setPage(1);
    if (placeSortKey === key) {
      placeFilters.setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setPlaceSortKey(key);
      placeFilters.setSortDir("asc");
    }
  };

  const tabs: { key: TabKey; label: string }[] = [
    { key: "summary", label: "Свод" },
    { key: "places", label: "По местам" },
  ];

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Остатки
        </h1>
      </div>

      {/* Модальные окна фильтров */}
      {tab === "summary" && summaryFilters.filtersOpen && (
        <summaryFilters.FiltersModal />
      )}
      {tab === "places" && placeFilters.filtersOpen && (
        <placeFilters.FiltersModal />
      )}

      {/* Вкладки */}
      <div className="mb-4 flex gap-1 border-b border-slate-200">
        {tabs.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => {
              setTab(t.key);
            }}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.key
                ? "border-b-2 border-emerald-600 text-emerald-700"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Таб: Свод */}
      {tab === "summary" && (
        <div>
          {/* Поиск + чекбокс */}
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <label className="flex shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap text-sm text-slate-700">
              <input
                type="checkbox"
                checked={summaryFilters.onlyPositive}
                onChange={(e) => {
                  summaryFilters.setPage(1);
                  summaryFilters.setOnlyPositive(e.target.checked);
                }}
                className="size-4 rounded border-slate-300 text-slate-800 focus:ring-slate-400"
              />
              Остаток &gt; 0
            </label>
            <input
              type="search"
              value={summaryFilters.searchQuery}
              onChange={(e) => {
                summaryFilters.setPage(1);
                summaryFilters.setSearchQuery(e.target.value);
              }}
              placeholder="Поиск по наименованию или каталожному номеру…"
              className="min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-[600px] w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                    <th className="px-4 py-3 font-medium">
                      <button
                        type="button"
                        onClick={() => toggleSummarySort("name")}
                        className="inline-flex items-center gap-1 font-medium text-slate-700 hover:text-slate-900"
                      >
                        Наименование
                        <SortMark
                          active={summarySortKey === "name"}
                          dir={summaryFilters.sortDir}
                        />
                      </button>
                    </th>
                    <th className="px-4 py-3 font-medium whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => toggleSummarySort("catalogNumber")}
                        className="inline-flex items-center gap-1 font-medium text-slate-700 hover:text-slate-900"
                      >
                        Каталожный номер
                        <SortMark
                          active={summarySortKey === "catalogNumber"}
                          dir={summaryFilters.sortDir}
                        />
                      </button>
                    </th>
                    <th className="px-4 py-3 font-medium whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => toggleSummarySort("group")}
                        className="inline-flex items-center gap-1 font-medium text-slate-700 hover:text-slate-900"
                      >
                        Группа
                        <SortMark
                          active={summarySortKey === "group"}
                          dir={summaryFilters.sortDir}
                        />
                      </button>
                    </th>
                    <th className="px-4 py-3 font-medium whitespace-nowrap text-right">
                      <button
                        type="button"
                        onClick={() => toggleSummarySort("totalQty")}
                        className="inline-flex items-center gap-1 font-medium text-slate-700 hover:text-slate-900"
                      >
                        Кол-во
                        <SortMark
                          active={summarySortKey === "totalQty"}
                          dir={summaryFilters.sortDir}
                        />
                      </button>
                    </th>
                    <th className="px-4 py-3 font-medium whitespace-nowrap text-center">
                      Партий
                    </th>
                    <th className="px-4 py-3 font-medium whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => toggleSummarySort("minExpiryDate")}
                        className="inline-flex items-center gap-1 font-medium text-slate-700 hover:text-slate-900"
                      >
                        Мин. срок годности
                        <SortMark
                          active={summarySortKey === "minExpiryDate"}
                          dir={summaryFilters.sortDir}
                        />
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pageData.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-12 text-center text-slate-500"
                      >
                        Нет данных.
                      </td>
                    </tr>
                  ) : (
                    (pageData as SummaryRow[]).map((row) => (
                      <SummaryTableRow key={row.nomenclatureId} row={row} />
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <Footer
              total={currentTotal}
              page={safePage}
              totalPages={totalPages}
              hasActiveFilters={summaryFilters.hasActiveFilters}
              onOpenFilters={() => summaryFilters.setFiltersOpen(true)}
              onPrev={() => summaryFilters.setPage((p) => Math.max(1, p - 1))}
              onNext={() =>
                summaryFilters.setPage((p) => Math.min(totalPages, p + 1))
              }
            />
          </div>
        </div>
      )}

      {/* Таб: По местам */}
      {tab === "places" && (
        <div>
          {/* Поиск + чекбокс */}
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <label className="flex shrink-0 cursor-pointer items-center gap-2 whitespace-nowrap text-sm text-slate-700">
              <input
                type="checkbox"
                checked={placeFilters.onlyPositive}
                onChange={(e) => {
                  placeFilters.setPage(1);
                  placeFilters.setOnlyPositive(e.target.checked);
                }}
                className="size-4 rounded border-slate-300 text-slate-800 focus:ring-slate-400"
              />
              Остаток &gt; 0
            </label>
            <input
              type="search"
              value={placeFilters.searchQuery}
              onChange={(e) => {
                placeFilters.setPage(1);
                placeFilters.setSearchQuery(e.target.value);
              }}
              placeholder="Поиск по наименованию, каталожному номеру или партии…"
              className="min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            />
          </div>

          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-[900px] w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                    <th className="px-4 py-3 font-medium">
                      <button
                        type="button"
                        onClick={() => togglePlaceSort("name")}
                        className="inline-flex items-center gap-1 font-medium text-slate-700 hover:text-slate-900"
                      >
                        Наименование
                        <SortMark
                          active={placeSortKey === "name"}
                          dir={placeFilters.sortDir}
                        />
                      </button>
                    </th>
                    <th className="px-4 py-3 font-medium whitespace-nowrap">
                      Каталожный номер
                    </th>
                    <th className="px-4 py-3 font-medium whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => togglePlaceSort("group")}
                        className="inline-flex items-center gap-1 font-medium text-slate-700 hover:text-slate-900"
                      >
                        Группа
                        <SortMark
                          active={placeSortKey === "group"}
                          dir={placeFilters.sortDir}
                        />
                      </button>
                    </th>
                    <th className="px-4 py-3 font-medium whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => togglePlaceSort("lotCode")}
                        className="inline-flex items-center gap-1 font-medium text-slate-700 hover:text-slate-900"
                      >
                        Партия
                        <SortMark
                          active={placeSortKey === "lotCode"}
                          dir={placeFilters.sortDir}
                        />
                      </button>
                    </th>
                    <th className="px-4 py-3 font-medium whitespace-nowrap">
                      Дата поступления
                    </th>
                    <th className="px-4 py-3 font-medium whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => togglePlaceSort("expiryDate")}
                        className="inline-flex items-center gap-1 font-medium text-slate-700 hover:text-slate-900"
                      >
                        Срок годности
                        <SortMark
                          active={placeSortKey === "expiryDate"}
                          dir={placeFilters.sortDir}
                        />
                      </button>
                    </th>
                    <th className="px-4 py-3 font-medium whitespace-nowrap text-right">
                      <button
                        type="button"
                        onClick={() => togglePlaceSort("quantity")}
                        className="inline-flex items-center gap-1 font-medium text-slate-700 hover:text-slate-900"
                      >
                        Кол-во
                        <SortMark
                          active={placeSortKey === "quantity"}
                          dir={placeFilters.sortDir}
                        />
                      </button>
                    </th>
                    <th className="px-4 py-3 font-medium whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => togglePlaceSort("place")}
                        className="inline-flex items-center gap-1 font-medium text-slate-700 hover:text-slate-900"
                      >
                        Место хранения
                        <SortMark
                          active={placeSortKey === "place"}
                          dir={placeFilters.sortDir}
                        />
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pageData.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-4 py-12 text-center text-slate-500"
                      >
                        Нет строк по текущим условиям.
                      </td>
                    </tr>
                  ) : (
                    (pageData as BalanceRow[]).map((row) => (
                      <PlaceTableRow
                        key={`${row.nomenclatureId}-${row.lotCode}-${row.place}`}
                        row={row}
                      />
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <Footer
              total={currentTotal}
              page={safePage}
              totalPages={totalPages}
              hasActiveFilters={placeFilters.hasActiveFilters}
              onOpenFilters={() => placeFilters.setFiltersOpen(true)}
              onPrev={() => placeFilters.setPage((p) => Math.max(1, p - 1))}
              onNext={() =>
                placeFilters.setPage((p) => Math.min(totalPages, p + 1))
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}

function SortMark({ active, dir }: { active: boolean; dir: SortDir }) {
  if (!active) {
    return (
      <span className="text-slate-300" aria-hidden>
        ↕
      </span>
    );
  }
  return (
    <span className="text-slate-800" aria-hidden>
      {dir === "asc" ? "↑" : "↓"}
    </span>
  );
}

function SummaryTableRow({ row }: { row: SummaryRow }) {
  const now = new Date();
  const expDate = new Date(row.minExpiryDate + "T00:00:00");
  const isExpired = expDate < now;
  const thirtyDaysFromNow = new Date(now);
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  const isExpiringSoon = !isExpired && expDate <= thirtyDaysFromNow;

  const expiryClassName = isExpired
    ? "text-red-700 font-medium bg-red-50 rounded px-1.5 py-0.5"
    : isExpiringSoon
      ? "text-amber-700 font-medium bg-amber-50 rounded px-1.5 py-0.5"
      : "text-slate-600";

  return (
    <tr className="border-b border-slate-100 last:border-0 hover:bg-slate-50/80">
      <td className="align-top px-4 py-3 text-slate-800">
        <Link
          to={`/sklad/nomenklatura/${row.nomenclatureId}`}
          className="font-medium text-emerald-700 hover:text-emerald-800 hover:underline"
        >
          {row.name}
        </Link>
      </td>
      <td className="align-top px-4 py-3 font-mono text-xs text-slate-600 whitespace-nowrap">
        {row.catalogNumber}
      </td>
      <td className="align-top px-4 py-3 text-slate-700 whitespace-nowrap">
        {row.group}
      </td>
      <td className="align-top px-4 py-3 tabular-nums text-right whitespace-nowrap font-medium text-slate-800">
        {row.totalQty}
      </td>
      <td className="align-top px-4 py-3 text-center text-slate-600 whitespace-nowrap tabular-nums">
        {row.lotCount}
      </td>
      <td className="align-top px-4 py-3 whitespace-nowrap">
        <span className={expiryClassName}>
          {formatRuDate(row.minExpiryDate)}
          {isExpired && (
            <span className="ml-1.5 inline-block rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-700 ring-1 ring-red-200">
              просрочен
            </span>
          )}
          {isExpiringSoon && (
            <span className="ml-1.5 inline-block rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 ring-1 ring-amber-200">
              скоро истекает
            </span>
          )}
        </span>
      </td>
    </tr>
  );
}

function PlaceTableRow({ row }: { row: BalanceRow }) {
  const now = new Date();
  const expDate = new Date(row.expiryDate + "T00:00:00");
  const isExpired = expDate < now;
  const thirtyDaysFromNow = new Date(now);
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
  const isExpiringSoon = !isExpired && expDate <= thirtyDaysFromNow;

  const expiryClassName = isExpired
    ? "text-red-700 font-medium bg-red-50 rounded px-1.5 py-0.5"
    : isExpiringSoon
      ? "text-amber-700 font-medium bg-amber-50 rounded px-1.5 py-0.5"
      : "text-slate-600";

  return (
    <tr className="border-b border-slate-100 last:border-0 hover:bg-slate-50/80">
      <td className="align-top px-4 py-3 text-slate-800">
        <Link
          to={`/sklad/nomenklatura/${row.nomenclatureId}`}
          className={`font-medium text-emerald-700 hover:text-emerald-800 hover:underline ${isExpired ? "decoration-red-400 decoration-2 underline-offset-2" : ""}`}
        >
          {row.name}
        </Link>
      </td>
      <td className="align-top px-4 py-3 font-mono text-xs text-slate-600 whitespace-nowrap">
        {row.catalogNumber}
      </td>
      <td className="align-top px-4 py-3 text-slate-700 whitespace-nowrap">
        {row.group}
      </td>
      <td className="align-top px-4 py-3 font-mono text-xs text-slate-700 whitespace-nowrap">
        {row.lotCode}
      </td>
      <td className="align-top px-4 py-3 text-slate-600 tabular-nums whitespace-nowrap">
        {row.receiptDate ? formatRuDate(row.receiptDate) : "—"}
      </td>
      <td className="align-top px-4 py-3 whitespace-nowrap">
        <span className={expiryClassName}>
          {formatRuDate(row.expiryDate)}
          {isExpired && (
            <span className="ml-1.5 inline-block rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-700 ring-1 ring-red-200">
              просрочен
            </span>
          )}
          {isExpiringSoon && (
            <span className="ml-1.5 inline-block rounded bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700 ring-1 ring-amber-200">
              скоро истекает
            </span>
          )}
        </span>
      </td>
      <td className="align-top px-4 py-3 tabular-nums text-right whitespace-nowrap font-medium text-slate-800">
        {row.quantity}
      </td>
      <td className="align-top px-4 py-3 text-slate-700 whitespace-nowrap">
        {row.place}
      </td>
    </tr>
  );
}

function Footer({
  total,
  page,
  totalPages,
  hasActiveFilters,
  onOpenFilters,
  onPrev,
  onNext,
}: {
  total: number;
  page: number;
  totalPages: number;
  hasActiveFilters: boolean;
  onOpenFilters: () => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-600">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenFilters}
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
            <span className="absolute bottom-1 right-1 size-1.5 rounded-full bg-emerald-500"></span>
          )}
        </button>
        <span>
          Показано{" "}
          <strong className="font-medium text-slate-800">
            {total === 0
              ? 0
              : `${(page - 1) * PAGE_SIZE + 1}–${Math.min(
                  page * PAGE_SIZE,
                  total,
                )}`}
          </strong>{" "}
          из <strong className="font-medium text-slate-800">{total}</strong>
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={onPrev}
          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Назад
        </button>
        <span className="tabular-nums text-slate-700">
          Стр. {page} / {totalPages}
        </span>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={onNext}
          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Вперёд
        </button>
      </div>
    </footer>
  );
}
