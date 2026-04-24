import { Link } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { ALL_GROUPS, type CatalogItem } from "../mocks/balancesData";
import {
  NomenclatureProvider,
  useNomenclature,
} from "../context/NomenclatureContext";

const PAGE_SIZE = 10;

type SortKey = "name" | "catalogNumber" | "group" | "manufacturer";
type SortDir = "asc" | "desc";

export function NomenklaturaPage() {
  return (
    <NomenclatureProvider>
      <NomenklaturaContent />
    </NomenclatureProvider>
  );
}

function NomenklaturaContent() {
  const { entries, updateItem } = useNomenclature();
  const [searchQuery, setSearchQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [page, setPage] = useState(1);

  // Row actions menu (like quarantine)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ left: number; top: number } | null>(
    null,
  );
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  type ModalState =
    | { type: "edit"; id: string }
    | null;
  const [modal, setModal] = useState<ModalState>(null);
  const [activeTab, setActiveTab] = useState<"general" | "spec">("general");

  const [editDraft, setEditDraft] = useState<{
    name: string;
    catalogNumber: string;
    group: CatalogItem["group"];
    unit: string;
    manufacturer: string;
  } | null>(null);

  const filtered = useMemo(() => {
    const sq = searchQuery.trim().toLowerCase();
    if (!sq) return entries;
    return entries.filter(
      (item) =>
        item.name.toLowerCase().includes(sq) ||
        item.catalogNumber.toLowerCase().includes(sq) ||
        item.manufacturer.toLowerCase().includes(sq) ||
        item.group.toLowerCase().includes(sq),
    );
  }, [entries, searchQuery]);

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

  const openEditModal = (id: string) => {
    const item = entries.find((e) => e.id === id);
    if (!item) return;
    setModal({ type: "edit", id });
    setActiveTab("general");
    setEditDraft({
      name: item.name,
      catalogNumber: item.catalogNumber,
      group: item.group,
      unit: item.unit,
      manufacturer: item.manufacturer,
    });
  };

  const closeEditModal = () => {
    setModal(null);
    setEditDraft(null);
  };

  const submitEdit = () => {
    if (!modal || modal.type !== "edit" || !editDraft) return;
    updateItem(modal.id, {
      name: editDraft.name.trim(),
      catalogNumber: editDraft.catalogNumber.trim(),
      group: editDraft.group,
      unit: editDraft.unit.trim(),
      manufacturer: editDraft.manufacturer.trim(),
    });
    closeEditModal();
  };

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Номенклатура
        </h1>
      </div>

      {/* Edit modal */}
      {modal && modal.type === "edit" && editDraft && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 pt-16"
          onClick={closeEditModal}
        >
          <div
            className="relative w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Редактирование номенклатуры"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                Редактирование номенклатуры
              </h2>
              <button
                type="button"
                onClick={closeEditModal}
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

            <div className="mb-4 flex gap-2 border-b border-slate-200">
              <button
                type="button"
                onClick={() => setActiveTab("general")}
                className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium ${
                  activeTab === "general"
                    ? "border-emerald-600 text-emerald-700"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                Общее
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("spec")}
                className={`-mb-px border-b-2 px-3 py-2 text-sm font-medium ${
                  activeTab === "spec"
                    ? "border-emerald-600 text-emerald-700"
                    : "border-transparent text-slate-600 hover:text-slate-900"
                }`}
              >
                Спецификация
              </button>
            </div>

            {activeTab === "general" ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
                    Имя
                  </label>
                  <input
                    value={editDraft.name}
                    onChange={(e) =>
                      setEditDraft((d) => (d ? { ...d, name: e.target.value } : d))
                    }
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
                    Каталожный номер
                  </label>
                  <input
                    value={editDraft.catalogNumber}
                    onChange={(e) =>
                      setEditDraft((d) =>
                        d ? { ...d, catalogNumber: e.target.value } : d,
                      )
                    }
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-mono outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
                    Группа
                  </label>
                  <select
                    value={editDraft.group}
                    onChange={(e) =>
                      setEditDraft((d) =>
                        d
                          ? { ...d, group: e.target.value as CatalogItem["group"] }
                          : d,
                      )
                    }
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  >
                    {ALL_GROUPS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
                    Ед. измерения
                  </label>
                  <input
                    value={editDraft.unit}
                    onChange={(e) =>
                      setEditDraft((d) => (d ? { ...d, unit: e.target.value } : d))
                    }
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
                    Производитель
                  </label>
                  <input
                    value={editDraft.manufacturer}
                    onChange={(e) =>
                      setEditDraft((d) =>
                        d ? { ...d, manufacturer: e.target.value } : d,
                      )
                    }
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  />
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                Скоро будет
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
              <button
                type="button"
                onClick={closeEditModal}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={submitEdit}
                className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-emerald-500"
              >
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}

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
                <th className="px-4 py-3 font-medium w-10"></th>
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
                    colSpan={columns.length + 1}
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
                    <td className="px-2 py-3 align-top">
                      <button
                        type="button"
                        ref={(el) => {
                          buttonRefs.current[item.id] = el;
                        }}
                        onClick={(ev) => {
                          ev.stopPropagation();
                          if (openMenuId === item.id) {
                            setOpenMenuId(null);
                            setMenuPosition(null);
                          } else {
                            handleMenuOpen(item.id, ev.currentTarget);
                          }
                        }}
                        className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                        aria-label="Действия"
                        title="Действия"
                      >
                        <svg className="size-5" viewBox="0 0 24 24" fill="currentColor">
                          <circle cx="12" cy="6" r="2" />
                          <circle cx="12" cy="12" r="2" />
                          <circle cx="12" cy="18" r="2" />
                        </svg>
                      </button>
                      {openMenuId === item.id && menuPosition && (
                        <div
                          ref={menuRef}
                          className="fixed z-50 mt-1 w-56 rounded-lg border border-slate-200 bg-white py-1 shadow-xl"
                          style={{
                            left: `${menuPosition.left}px`,
                            top: `${menuPosition.top}px`,
                          }}
                        >
                          <button
                            type="button"
                            onClick={() => {
                              setOpenMenuId(null);
                              setMenuPosition(null);
                              openEditModal(item.id);
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
                            Редактировать
                          </button>
                        </div>
                      )}
                    </td>
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
