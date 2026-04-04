import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { MOCK_CATALOG } from "../mocks/balancesData";

const PAGE_SIZE = 10;

type SortKey = "name" | "catalogNumber" | "group" | "manufacturer";
type SortDir = "asc" | "desc";

export function NomenklaturaPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const sq = searchQuery.trim().toLowerCase();
    if (!sq) return MOCK_CATALOG;
    return MOCK_CATALOG.filter(
      (item) =>
        item.name.toLowerCase().includes(sq) ||
        item.catalogNumber.toLowerCase().includes(sq) ||
        item.manufacturer.toLowerCase().includes(sq) ||
        item.group.toLowerCase().includes(sq),
    );
  }, [searchQuery]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const mul = sortDir === "asc" ? 1 : -1;
      return mul * String(a[sortKey]).localeCompare(String(b[sortKey]), "ru");
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = sorted.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const toggleSort = (key: string) => {
    setPage(1);
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key as SortKey);
      setSortDir("asc");
    }
  };

  const columns: {
    key: string;
    label: string;
    sortable: boolean;
  }[] = [
    { key: "name", label: "Наименование", sortable: true },
    { key: "catalogNumber", label: "Каталожный номер", sortable: true },
    { key: "group", label: "Группа", sortable: true },
    { key: "unit", label: "Ед. изм.", sortable: false },
    { key: "manufacturer", label: "Производитель", sortable: true },
  ];

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Номенклатура
        </h1>
      </div>

      {/* Поиск */}
      <div className="mb-4">
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => {
            setPage(1);
            setSearchQuery(e.target.value);
          }}
          placeholder="Поиск по наименованию, каталожному номеру, производителю или группе…"
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
        />
      </div>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className="px-4 py-3 font-medium whitespace-nowrap"
                  >
                    {col.sortable ? (
                      <button
                        type="button"
                        onClick={() => toggleSort(col.key)}
                        className="inline-flex items-center gap-1 font-medium text-slate-700 hover:text-slate-900"
                      >
                        {col.label}
                        <SortMark active={sortKey === col.key} dir={sortDir} />
                      </button>
                    ) : (
                      col.label
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-12 text-center text-slate-500"
                  >
                    Нет записей.
                  </td>
                </tr>
              ) : (
                pageRows.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50/80"
                  >
                    <td className="px-4 py-3 align-top">
                      <Link
                        to={`/sklad/nomenklatura/${item.id}`}
                        className="font-medium text-emerald-700 hover:text-emerald-800 hover:underline"
                      >
                        {item.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-600 whitespace-nowrap align-top">
                      {item.catalogNumber}
                    </td>
                    <td className="px-4 py-3 text-slate-700 whitespace-nowrap align-top">
                      {item.group}
                    </td>
                    <td className="px-4 py-3 text-slate-700 whitespace-nowrap align-top">
                      {item.unit}
                    </td>
                    <td className="px-4 py-3 text-slate-700 whitespace-nowrap align-top">
                      {item.manufacturer}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-600">
          <span>
            Показано{" "}
            <strong className="font-medium text-slate-800">
              {sorted.length === 0
                ? 0
                : `${(safePage - 1) * PAGE_SIZE + 1}–${Math.min(
                    safePage * PAGE_SIZE,
                    sorted.length,
                  )}`}
            </strong>{" "}
            из{" "}
            <strong className="font-medium text-slate-800">
              {sorted.length}
            </strong>
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Назад
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
              Вперёд
            </button>
          </div>
        </footer>
      </div>
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
