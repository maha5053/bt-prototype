import { Combobox } from "@headlessui/react";
import { useMemo, useState } from "react";
import { ACTION_CONSUMABLE_CATALOG } from "../mocks/constructorV2Catalog";
import type { MaterialTypeBalanceItem } from "../mocks/productionData";

type Props = {
  items: MaterialTypeBalanceItem[];
  disabled?: boolean;
  onAdd: (item: { id: string; name: string }) => void;
  onPatch: (
    itemId: string,
    updater: (prev: MaterialTypeBalanceItem) => MaterialTypeBalanceItem,
  ) => void;
  onRemove: (itemId: string) => void;
};

export function RegistrationMaterialBalanceEditor({
  items,
  disabled = false,
  onAdd,
  onPatch,
  onRemove,
}: Props) {
  const [isAdding, setIsAdding] = useState(false);
  const [search, setSearch] = useState("");
  const selectedIds = useMemo(() => new Set(items.map((item) => item.id)), [items]);
  const filteredCatalog = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ACTION_CONSUMABLE_CATALOG.filter(
      (item) => !selectedIds.has(item.id) && (!q || item.name.toLowerCase().includes(q)),
    );
  }, [search, selectedIds]);

  const closePicker = () => {
    setIsAdding(false);
    setSearch("");
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50/40 p-3">
      <div className="mb-2 text-sm font-semibold text-slate-800">
        Расходники и материалы
      </div>

      {items.length === 0 ? (
        <div className="rounded-md border border-dashed border-slate-200 bg-white px-3 py-4 text-sm text-slate-600">
          Расходные материалы не добавлены.
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-3 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 md:flex-row md:items-center md:justify-start md:gap-6"
            >
              <span className="min-w-0 font-medium md:w-64 md:shrink-0">{item.name}</span>
              <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
                <label className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="whitespace-nowrap">По умолчанию</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    step={1}
                    disabled={disabled}
                    value={
                      typeof item.defaultQuantity === "number" &&
                      Number.isFinite(item.defaultQuantity)
                        ? item.defaultQuantity
                        : ""
                    }
                    onKeyDown={(e) => {
                      if (e.key === "-" || e.key === "e" || e.key === "E" || e.key === "+") {
                        e.preventDefault();
                      }
                    }}
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (raw === "") {
                        onPatch(item.id, (prev) => ({ ...prev, defaultQuantity: null }));
                        return;
                      }
                      const next = Number(raw);
                      if (!Number.isFinite(next) || next < 0) return;
                      onPatch(item.id, (prev) => ({
                        ...prev,
                        defaultQuantity: Math.floor(next),
                      }));
                    }}
                    className="w-20 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-800 outline-none transition focus:border-blue-400 disabled:bg-slate-50 disabled:text-slate-500"
                    aria-label={`Значение по умолчанию: ${item.name}`}
                  />
                  <span className="whitespace-nowrap">{item.unit}</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-600">
                  <input
                    type="checkbox"
                    disabled={disabled}
                    checked={Boolean(item.writeOffOnRegistrationComplete)}
                    onChange={(e) =>
                      onPatch(item.id, (prev) => ({
                        ...prev,
                        writeOffOnRegistrationComplete: e.target.checked,
                      }))
                    }
                    className="size-4 rounded border-slate-300 text-blue-600"
                  />
                  <span>Списывать при завершении регистрации</span>
                </label>
                {!disabled ? (
                  <button
                    type="button"
                    className="self-start rounded-md border border-red-300 bg-white p-2 text-red-700 hover:bg-red-50 md:self-auto"
                    onClick={() => onRemove(item.id)}
                    aria-label="Удалить расходный материал"
                    title="Удалить"
                  >
                    <svg
                      className="size-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <path d="M3 6h18" />
                      <path d="M8 6V4h8v2" />
                      <path d="M19 6l-1 14H6L5 6" />
                      <path d="M10 11v6" />
                      <path d="M14 11v6" />
                    </svg>
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      {!disabled && isAdding ? (
        <div className="mt-3">
          <Combobox
            value={null}
            onChange={(catalogItem: { id: string; name: string } | null) => {
              if (!catalogItem) return;
              onAdd(catalogItem);
              closePicker();
            }}
          >
            <div className="relative">
              <Combobox.Input
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 pr-9 text-sm outline-none transition focus:border-blue-400"
                placeholder="Начните вводить…"
                onChange={(e) => setSearch(e.target.value)}
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
                  <div className="px-3 py-2 text-slate-500">Ничего не найдено.</div>
                ) : (
                  filteredCatalog.map((catalogItem) => (
                    <Combobox.Option
                      key={catalogItem.id}
                      value={catalogItem}
                      className={({ active }) =>
                        `cursor-pointer select-none px-3 py-2 ${
                          active ? "bg-blue-600 text-white" : "text-slate-700"
                        }`
                      }
                    >
                      <span className="font-medium">{catalogItem.name}</span>
                    </Combobox.Option>
                  ))
                )}
              </Combobox.Options>
            </div>
          </Combobox>

          <div className="mt-2">
            <button
              type="button"
              className="text-sm font-medium text-slate-600 underline decoration-slate-300 underline-offset-2 hover:text-slate-900"
              onClick={closePicker}
            >
              Отмена
            </button>
          </div>
        </div>
      ) : !disabled ? (
        <div className="mt-3">
          <button
            type="button"
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            onClick={() => {
              setIsAdding(true);
              setSearch("");
            }}
          >
            + Добавить расходный материал
          </button>
        </div>
      ) : null}
    </div>
  );
}
