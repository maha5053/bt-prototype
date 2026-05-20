import { Combobox, Tab } from "@headlessui/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { MaterialTypesDevTools } from "../components/MaterialTypesDevTools";
import { ProductionProvider, useProduction } from "../context/ProductionContext";
import { ACTION_CONSUMABLE_CATALOG } from "../mocks/constructorV2Catalog";
import type {
  ConfigurableMaterialField,
  ConfigurableMaterialFieldType,
  FieldValue,
  MaterialTypeBalanceItem,
  MaterialTypeSettings,
} from "../mocks/productionData";

const FIELD_TYPE_LABEL: Record<ConfigurableMaterialFieldType, string> = {
  text: "Текст",
  number: "Число",
  date: "Дата",
  checkbox: "Чекбокс",
  select: "Список",
};

const MATERIAL_EDITOR_TABS = [
  { key: "collectionFields", label: "Забор" },
  { key: "materialBalance", label: "Материальный баланс" },
  { key: "incomingControlFields", label: "Входной контроль" },
] as const;

type FieldSection = "collectionFields" | "incomingControlFields";
type ErrorMap = Record<string, string>;

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function makeField(): ConfigurableMaterialField {
  return {
    id: `mf-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    label: "",
    type: "text",
    required: false,
    defaultValue: "",
    unit: "",
    helpText: "",
  };
}

function optionsToText(options: string[] | undefined): string {
  return (options ?? []).join("\n");
}

function textToOptions(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim());
}

function normalizeOptions(options: string[] | undefined): string[] {
  const next: string[] = [];
  const seen = new Set<string>();
  for (const raw of options ?? []) {
    const value = raw.trim();
    if (!value) continue;
    const key = value.toLocaleLowerCase("ru");
    if (seen.has(key)) continue;
    seen.add(key);
    next.push(value);
  }
  return next;
}

function normalizeField(field: ConfigurableMaterialField): ConfigurableMaterialField {
  const options = field.type === "select" ? normalizeOptions(field.options) : undefined;
  const okOption =
    typeof field.okOption === "string" ? field.okOption.trim() : undefined;
  const normalizedOkOption =
    field.type === "select" &&
    Boolean(okOption) &&
    options?.some((option) => option === okOption)
      ? okOption
      : undefined;
  const normalized: ConfigurableMaterialField = {
    ...field,
    id: field.id.trim(),
    label: field.label.trim(),
    unit: (field.unit ?? "").trim(),
    helpText: (field.helpText ?? "").trim(),
    options,
    okOption: normalizedOkOption,
  };

  if (field.type === "checkbox") {
    normalized.defaultValue = Boolean(field.defaultValue);
    return normalized;
  }

  if (field.type === "number") {
    const parsed =
      typeof field.defaultValue === "number"
        ? field.defaultValue
        : typeof field.defaultValue === "string" && field.defaultValue.trim() !== ""
          ? Number(field.defaultValue)
          : null;
    normalized.defaultValue = Number.isFinite(parsed) ? parsed : null;
    return normalized;
  }

  if (field.type === "select") {
    if (
      typeof field.defaultValue === "string" &&
      options?.some((option) => option === field.defaultValue)
    ) {
      normalized.defaultValue = field.defaultValue;
    } else {
      normalized.defaultValue = null;
    }
    return normalized;
  }

  normalized.defaultValue =
    typeof field.defaultValue === "string" ? field.defaultValue.trim() : "";
  return normalized;
}

function normalizeSettings(settings: MaterialTypeSettings): MaterialTypeSettings {
  return {
    ...settings,
    collectionFields: settings.collectionFields.map(normalizeField),
    incomingControlFields: settings.incomingControlFields.map(normalizeField),
  };
}

function settingsComparableSignature(settings: MaterialTypeSettings): string {
  const normalized = normalizeSettings(settings);
  return JSON.stringify({
    code: normalized.code,
    label: normalized.label,
    collectionFields: normalized.collectionFields,
    incomingControlFields: normalized.incomingControlFields,
    materialBalanceItems: normalized.materialBalanceItems,
  });
}

function areErrorsEqual(a: ErrorMap, b: ErrorMap): boolean {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  for (const key of aKeys) {
    if (a[key] !== b[key]) return false;
  }
  return true;
}

function defaultValueForType(
  value: FieldValue | undefined,
  type: ConfigurableMaterialFieldType,
): string | boolean {
  if (type === "checkbox") return Boolean(value);
  if (value == null) return "";
  return String(value);
}

function valueFromInput(
  value: string | boolean,
  type: ConfigurableMaterialFieldType,
): FieldValue {
  if (type === "checkbox") return Boolean(value);
  if (type === "number") {
    if (typeof value !== "string" || value.trim() === "") return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return typeof value === "string" ? value : "";
}

function validateSettings(settings: MaterialTypeSettings): ErrorMap {
  const errors: ErrorMap = {};
  (["collectionFields", "incomingControlFields"] as FieldSection[]).forEach(
    (section) => {
      const seenLabels = new Map<string, string>();
      const seenIds = new Map<string, string>();
      settings[section].forEach((field) => {
        const id = field.id.trim();
        const label = field.label.trim();
        const baseKey = `${section}:${field.id}`;
        if (!id) {
          errors[`${baseKey}:label`] = "Поле имеет пустой идентификатор.";
        } else {
          const duplicateId = seenIds.get(id.toLocaleLowerCase("ru"));
          if (duplicateId) {
            errors[`${baseKey}:label`] = "Повторяющийся идентификатор поля.";
            errors[`${section}:${duplicateId}:label`] = "Повторяющийся идентификатор поля.";
          } else {
            seenIds.set(id.toLocaleLowerCase("ru"), field.id);
          }
        }
        if (!label) {
          errors[`${baseKey}:label`] = "Укажите название поля.";
        } else {
          const duplicate = seenLabels.get(label.toLocaleLowerCase("ru"));
          if (duplicate) {
            errors[`${baseKey}:label`] =
              "Поле с таким названием уже есть в этом разделе.";
            errors[`${section}:${duplicate}:label`] =
              "Поле с таким названием уже есть в этом разделе.";
          } else {
            seenLabels.set(label.toLocaleLowerCase("ru"), field.id);
          }
        }
        if (field.type === "select") {
          const normalizedOptions = normalizeOptions(field.options);
          if (!normalizedOptions.length) {
            errors[`${baseKey}:options`] = "Добавьте хотя бы один вариант списка.";
          } else if ((field.options?.length ?? 0) !== normalizedOptions.length) {
            errors[`${baseKey}:options`] =
              "Варианты списка должны быть уникальными и непустыми.";
          }
        }
      });
    },
  );
  return errors;
}

export function MaterialTypesAdminPage() {
  return (
    <ProductionProvider>
      <MaterialTypesListContent />
    </ProductionProvider>
  );
}

export function MaterialTypeEditorPage() {
  return (
    <ProductionProvider>
      <MaterialTypeEditorContent />
    </ProductionProvider>
  );
}

function MaterialTypesListContent() {
  const { materialTypes } = useProduction();
  const [openMenuCode, setOpenMenuCode] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ left: number; top: number } | null>(
    null,
  );
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!openMenuCode) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuCode(null);
        setMenuPosition(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [openMenuCode]);

  const openMenu = (code: string, button: HTMLButtonElement) => {
    const rect = button.getBoundingClientRect();
    setMenuPosition({ left: rect.left, top: rect.bottom });
    setOpenMenuCode(code);
  };

  return (
    <div className="relative p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-800">Типы материала</h1>
        <p className="mt-1 text-sm text-slate-500">
          Настройка фиксированных типов материала для новых заказов.
        </p>
      </div>

      {materialTypes.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 bg-white p-6">
          <div className="text-sm font-semibold text-slate-800">
            Типы материала не найдены
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Используйте инструменты разработчика (шестерёнка внизу справа), чтобы сбросить
            настройки типов материала.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="w-10 px-2 py-3 font-medium" aria-label="Действия" />
                <th className="px-4 py-3 font-medium">Код</th>
                <th className="px-4 py-3 font-medium">Тип материала</th>
                <th className="px-4 py-3 font-medium">Поля забора</th>
                <th className="px-4 py-3 font-medium">Материальный баланс</th>
                <th className="px-4 py-3 font-medium">Входной контроль</th>
              </tr>
            </thead>
            <tbody>
              {materialTypes.map((item) => (
                <tr key={item.code} className="border-t border-slate-100">
                  <td className="w-10 px-2 py-3 align-middle">
                    <button
                      type="button"
                      onClick={(ev) => {
                        ev.stopPropagation();
                        if (openMenuCode === item.code) {
                          setOpenMenuCode(null);
                          setMenuPosition(null);
                        } else {
                          openMenu(item.code, ev.currentTarget);
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
                        aria-hidden
                      >
                        <circle cx="12" cy="6" r="2" />
                        <circle cx="12" cy="12" r="2" />
                        <circle cx="12" cy="18" r="2" />
                      </svg>
                    </button>

                    {openMenuCode === item.code && menuPosition ? (
                      <div
                        ref={menuRef}
                        className="fixed z-50 mt-1 w-56 rounded-lg border border-slate-200 bg-white py-1 shadow-xl"
                        style={{
                          left: `${menuPosition.left}px`,
                          top: `${menuPosition.top}px`,
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Link
                          to={`/admin/tipy-materiala/${item.code}`}
                          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                          title="Редактировать тип материала"
                          onClick={() => {
                            setOpenMenuCode(null);
                            setMenuPosition(null);
                          }}
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
                            <path d="M12 20h9" />
                            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                          </svg>
                          Редактировать
                        </Link>
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                      {item.code}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-900">{item.label}</td>
                  <td className="px-4 py-3 text-slate-700">
                    {item.collectionFields.length}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {item.materialBalanceItems.length}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    {item.incomingControlFields.length}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <MaterialTypesDevTools />
    </div>
  );
}

function MaterialTypeEditorContent() {
  const { materialTypeCode } = useParams<{ materialTypeCode: string }>();
  const { materialTypes, updateMaterialTypeSettings } = useProduction();
  const selected = useMemo(
    () => materialTypes.find((item) => item.code === materialTypeCode) ?? null,
    [materialTypes, materialTypeCode],
  );
  const [draft, setDraft] = useState<MaterialTypeSettings | null>(
    selected ? clone(selected) : null,
  );
  const [errors, setErrors] = useState<ErrorMap>({});
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    if (!selected) return;
    setDraft(clone(selected));
    setErrors({});
    setSavedAt(null);
  }, [materialTypeCode, selected?.code]);

  useEffect(() => {
    if (!draft || !selected) return;
    const normalizedDraft = normalizeSettings(draft);
    const nextErrors = validateSettings(normalizedDraft);
    setErrors((prev) => (areErrorsEqual(prev, nextErrors) ? prev : nextErrors));
    if (Object.keys(nextErrors).length > 0) return;
    if (settingsComparableSignature(normalizedDraft) === settingsComparableSignature(selected)) {
      return;
    }
    const timer = window.setTimeout(() => {
      updateMaterialTypeSettings(normalizedDraft);
      setSavedAt(new Date().toISOString());
    }, 250);
    return () => window.clearTimeout(timer);
  }, [draft, selected, updateMaterialTypeSettings]);

  const patchDraft = (updater: (prev: MaterialTypeSettings) => MaterialTypeSettings) => {
    setDraft((prev) => (prev ? updater(prev) : prev));
  };

  const patchField = (
    section: FieldSection,
    fieldId: string,
    updater: (prev: ConfigurableMaterialField) => ConfigurableMaterialField,
  ) => {
    patchDraft((prev) => ({
      ...prev,
      [section]: prev[section].map((field) =>
        field.id === fieldId ? updater(field) : field,
      ),
    }));
  };

  const addField = (section: FieldSection) => {
    patchDraft((prev) => ({
      ...prev,
      [section]: [...prev[section], makeField()],
    }));
  };

  const addBalanceItem = (item: { id: string; name: string }) => {
    patchDraft((prev) => {
      if (prev.materialBalanceItems.some((balanceItem) => balanceItem.id === item.id)) {
        return prev;
      }
      const nextItem: MaterialTypeBalanceItem = {
        id: item.id,
        name: item.name,
        unit: "шт",
        defaultQuantity: null,
        writeOffOnRegistrationComplete: false,
      };
      return {
        ...prev,
        materialBalanceItems: [...prev.materialBalanceItems, nextItem],
      };
    });
  };

  const patchBalanceItem = (
    itemId: string,
    updater: (prev: MaterialTypeBalanceItem) => MaterialTypeBalanceItem,
  ) => {
    patchDraft((prev) => ({
      ...prev,
      materialBalanceItems: prev.materialBalanceItems.map((item) =>
        item.id === itemId ? updater(item) : item,
      ),
    }));
  };

  const removeBalanceItem = (itemId: string) => {
    patchDraft((prev) => ({
      ...prev,
      materialBalanceItems: prev.materialBalanceItems.filter((item) => item.id !== itemId),
    }));
  };

  const deleteField = (section: FieldSection, field: ConfigurableMaterialField) => {
    const name = field.label.trim() || "Без названия";
    if (
      !window.confirm(
        `Удалить поле «${name}»? Оно исчезнет только из настроек для новых заказов.`,
      )
    ) {
      return;
    }
    patchDraft((prev) => ({
      ...prev,
      [section]: prev[section].filter((item) => item.id !== field.id),
    }));
  };

  if (!selected || !draft) {
    return (
      <div className="p-6 md:p-8">
        <div className="mb-4">
          <Link
            to="/admin/tipy-materiala"
            className="text-sm text-slate-500 transition hover:text-slate-700"
            title="К списку типов материала"
          >
            ← Назад
          </Link>
        </div>
        <p className="text-sm text-slate-500">Тип материала не найден.</p>
      </div>
    );
  }

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-medium text-slate-500">
            <Link
              to="/admin/tipy-materiala"
              className="inline-flex items-center gap-2 rounded-md px-1.5 py-1 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              title="К списку типов материала"
              aria-label="Назад к списку типов материала"
            >
              <span aria-hidden>←</span>
              <span>Назад</span>
            </Link>
            <span>Администрирование</span>
            <span className="text-slate-300">›</span>
            <Link
              to="/admin/tipy-materiala"
              className="rounded-sm underline decoration-slate-300 underline-offset-2 transition hover:text-slate-700"
              title="К списку типов материала"
            >
              Типы материала
            </Link>
            <span className="text-slate-300">›</span>
            <span className="max-w-[60ch] truncate text-slate-700">
              {draft.label}
            </span>
          </div>

          <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
            <div className="flex min-w-0 flex-wrap items-center gap-3">
              <div className="max-w-2xl px-1 py-0.5 text-left text-2xl font-bold leading-tight text-slate-900 md:text-3xl">
                <span className="min-w-0 truncate">{draft.label}</span>
              </div>
              <span
                className="inline-flex shrink-0 items-center rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold text-slate-700 ring-1 ring-slate-600/10"
                title="Код фиксированного типа материала"
              >
                {draft.code}
              </span>
              {savedAt ? (
                <span className="inline-flex shrink-0 items-center rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-900 ring-1 ring-emerald-600/20">
                  Сохранено {new Date(savedAt).toLocaleTimeString("ru-RU", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Изменения применяются только к новым заказам. Уже созданные заказы сохраняют свои поля.
        </div>
        {hasErrors ? (
          <div className="mt-3 text-sm text-red-700">
            Проверьте обязательные поля и варианты списков.
          </div>
        ) : null}
      </div>

      <Tab.Group>
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-2">
          <Tab.List className="flex flex-wrap gap-2">
            {MATERIAL_EDITOR_TABS.map((tab) => (
              <Tab
                key={tab.key}
                className={({ selected: isSelected }) =>
                  [
                    "rounded-md px-3 py-2 text-sm font-medium outline-none transition",
                    isSelected
                      ? "bg-blue-600 text-white"
                      : "text-slate-700 hover:bg-slate-100",
                  ].join(" ")
                }
              >
                {tab.label}
              </Tab>
            ))}
          </Tab.List>
        </div>

        <Tab.Panels className="pt-4">
          <Tab.Panel>
            <FieldSectionEditor
              title="Забор"
              emptyButtonLabel="Добавить поле забора"
              section="collectionFields"
              fields={draft.collectionFields}
              errors={errors}
              onAdd={addField}
              onDelete={deleteField}
              onPatch={patchField}
            />
          </Tab.Panel>
          <Tab.Panel>
            <MaterialBalanceEditor
              items={draft.materialBalanceItems}
              onAdd={addBalanceItem}
              onPatch={patchBalanceItem}
              onRemove={removeBalanceItem}
            />
          </Tab.Panel>
          <Tab.Panel>
            <FieldSectionEditor
              title="Входной контроль"
              emptyButtonLabel="Добавить показатель ВК"
              section="incomingControlFields"
              fields={draft.incomingControlFields}
              errors={errors}
              onAdd={addField}
              onDelete={deleteField}
              onPatch={patchField}
            />
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
}

function MaterialBalanceEditor({
  items,
  onAdd,
  onPatch,
  onRemove,
}: {
  items: MaterialTypeBalanceItem[];
  onAdd: (item: { id: string; name: string }) => void;
  onPatch: (
    itemId: string,
    updater: (prev: MaterialTypeBalanceItem) => MaterialTypeBalanceItem,
  ) => void;
  onRemove: (itemId: string) => void;
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [search, setSearch] = useState("");
  const selectedIds = useMemo(() => new Set(items.map((item) => item.id)), [items]);
  const filteredCatalog = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ACTION_CONSUMABLE_CATALOG.filter(
      (item) => !selectedIds.has(item.id) && (!q || item.name.toLowerCase().includes(q)),
    );
  }, [search, selectedIds]);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-sm font-semibold text-slate-800">
            Материальный баланс
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Флаг списания хранится как настройка для регистрации; фактического складского списания в прототипе нет.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setIsAdding(true);
            setSearch("");
          }}
          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          + Добавить расходный материал
        </button>
      </div>

      {items.length === 0 ? (
        <div className="mt-3 rounded-md border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-sm text-slate-600">
          Расходные материалы не добавлены.
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex flex-col gap-3 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 xl:flex-row xl:items-center xl:justify-between"
            >
              <span className="min-w-0 font-medium xl:w-64 xl:shrink-0">
                {item.name}
              </span>
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-end">
                <label className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="whitespace-nowrap">По умолчанию</span>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    step={1}
                    value={
                      typeof item.defaultQuantity === "number"
                        ? item.defaultQuantity
                        : ""
                    }
                    onKeyDown={(e) => {
                      if (
                        e.key === "-" ||
                        e.key === "e" ||
                        e.key === "E" ||
                        e.key === "+"
                      ) {
                        e.preventDefault();
                      }
                    }}
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (raw === "") {
                        onPatch(item.id, (prev) => ({
                          ...prev,
                          defaultQuantity: null,
                        }));
                        return;
                      }
                      const next = Number(raw);
                      if (!Number.isFinite(next) || next < 0) return;
                      onPatch(item.id, (prev) => ({
                        ...prev,
                        defaultQuantity: Math.floor(next),
                      }));
                    }}
                    className="w-24 rounded-md border border-slate-200 bg-white px-2 py-1.5 text-sm text-slate-800 outline-none transition focus:border-blue-400"
                    aria-label={`Значение по умолчанию: ${item.name}`}
                  />
                  <span className="whitespace-nowrap">{item.unit}</span>
                </label>
                <label className="flex items-center gap-2 text-xs text-slate-600">
                  <input
                    type="checkbox"
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
              </div>
            </div>
          ))}
        </div>
      )}

      {isAdding ? (
        <div className="mt-3">
          <Combobox
            value={null}
            onChange={(item: { id: string; name: string } | null) => {
              if (!item) return;
              onAdd(item);
              setIsAdding(false);
              setSearch("");
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
                  filteredCatalog.map((item) => (
                    <Combobox.Option
                      key={item.id}
                      value={item}
                      className={({ active }) =>
                        `cursor-pointer select-none px-3 py-2 ${
                          active ? "bg-blue-600 text-white" : "text-slate-700"
                        }`
                      }
                    >
                      <span className="font-medium">{item.name}</span>
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
              onClick={() => {
                setIsAdding(false);
                setSearch("");
              }}
            >
              Отмена
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function FieldSectionEditor({
  title,
  emptyButtonLabel,
  section,
  fields,
  errors,
  onAdd,
  onDelete,
  onPatch,
}: {
  title: string;
  emptyButtonLabel: string;
  section: FieldSection;
  fields: ConfigurableMaterialField[];
  errors: ErrorMap;
  onAdd: (section: FieldSection) => void;
  onDelete: (section: FieldSection, field: ConfigurableMaterialField) => void;
  onPatch: (
    section: FieldSection,
    fieldId: string,
    updater: (prev: ConfigurableMaterialField) => ConfigurableMaterialField,
  ) => void;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-sm font-semibold text-slate-800">{title}</div>
        <button
          type="button"
          onClick={() => onAdd(section)}
          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          {emptyButtonLabel}
        </button>
      </div>

      {fields.length === 0 ? (
        <div className="mt-3 rounded-md border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-sm text-slate-600">
          <div className="font-medium text-slate-800">Поля не настроены</div>
          <p className="mt-1">
            Добавьте поле, чтобы оно появилось в новых заказах для этого типа материала.
          </p>
        </div>
      ) : (
        <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200">
          <table className="min-w-[980px] w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-3 py-2 font-medium">Название поля</th>
                <th className="px-3 py-2 font-medium">Тип</th>
                <th className="px-3 py-2 font-medium">Обязательное</th>
                <th className="px-3 py-2 font-medium">Значение по умолчанию</th>
                {section === "incomingControlFields" ? (
                  <th className="px-3 py-2 font-medium">Опция ОК</th>
                ) : null}
                <th className="px-3 py-2 font-medium">Ед. изм.</th>
                <th className="px-3 py-2 font-medium">Подсказка</th>
                <th className="px-3 py-2 font-medium text-right">Действия</th>
              </tr>
            </thead>
            <tbody>
              {fields.map((field) => (
                <FieldRow
                  key={field.id}
                  section={section}
                  field={field}
                  errors={errors}
                  onDelete={onDelete}
                  onPatch={onPatch}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function FieldRow({
  section,
  field,
  errors,
  onDelete,
  onPatch,
}: {
  section: FieldSection;
  field: ConfigurableMaterialField;
  errors: ErrorMap;
  onDelete: (section: FieldSection, field: ConfigurableMaterialField) => void;
  onPatch: (
    section: FieldSection,
    fieldId: string,
    updater: (prev: ConfigurableMaterialField) => ConfigurableMaterialField,
  ) => void;
}) {
  const baseKey = `${section}:${field.id}`;
  const labelError = errors[`${baseKey}:label`];
  const optionsError = errors[`${baseKey}:options`];

  return (
    <tr className="border-t border-slate-100 align-top">
      <td className="px-3 py-2">
        <input
          value={field.label}
          onChange={(e) =>
            onPatch(section, field.id, (prev) => ({
              ...prev,
              label: e.target.value,
            }))
          }
          className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800"
          placeholder="Напр. Целостность"
        />
        {labelError ? <div className="mt-1 text-xs text-red-700">{labelError}</div> : null}
      </td>
      <td className="px-3 py-2">
        <select
          value={field.type}
          onChange={(e) => {
            const nextType = e.target.value as ConfigurableMaterialFieldType;
            onPatch(section, field.id, (prev) => ({
              ...prev,
              type: nextType,
              defaultValue: valueFromInput("", nextType),
              options:
                nextType === "select" ? prev.options?.length ? prev.options : [""] : undefined,
              okOption: undefined,
            }));
          }}
          className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800"
        >
          {(Object.keys(FIELD_TYPE_LABEL) as ConfigurableMaterialFieldType[]).map((type) => (
            <option key={type} value={type}>
              {FIELD_TYPE_LABEL[type]}
            </option>
          ))}
        </select>
        {field.type === "select" ? (
          <div className="mt-2">
            <textarea
              value={optionsToText(field.options)}
              onChange={(e) =>
                onPatch(section, field.id, (prev) => ({
                  ...prev,
                  options: textToOptions(e.target.value),
                }))
              }
              className="h-20 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800"
              placeholder="Каждый вариант с новой строки."
            />
            <div className="mt-1 text-xs text-slate-500">
              Каждый вариант с новой строки.
            </div>
            {optionsError ? (
              <div className="mt-1 text-xs text-red-700">{optionsError}</div>
            ) : null}
          </div>
        ) : null}
      </td>
      <td className="px-3 py-2">
        <input
          type="checkbox"
          checked={field.required}
          onChange={(e) =>
            onPatch(section, field.id, (prev) => ({
              ...prev,
              required: e.target.checked,
            }))
          }
          className="size-4 rounded border-slate-300 text-blue-600"
          aria-label="Обязательное поле"
        />
      </td>
      <td className="px-3 py-2">
        {field.type === "checkbox" ? (
          <input
            type="checkbox"
            checked={Boolean(defaultValueForType(field.defaultValue, field.type))}
            onChange={(e) =>
              onPatch(section, field.id, (prev) => ({
                ...prev,
                defaultValue: e.target.checked,
              }))
            }
            className="size-4 rounded border-slate-300 text-blue-600"
            aria-label="Значение по умолчанию"
          />
        ) : (
          <input
            type={
              field.type === "number" ? "number" : field.type === "date" ? "date" : "text"
            }
            value={String(defaultValueForType(field.defaultValue, field.type))}
            onChange={(e) =>
              onPatch(section, field.id, (prev) => ({
                ...prev,
                defaultValue: valueFromInput(e.target.value, field.type),
              }))
            }
            className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800"
          />
        )}
      </td>
      {section === "incomingControlFields" ? (
        <td className="px-3 py-2">
          {field.type === "select" ? (
            <select
              value={field.okOption ?? ""}
              onChange={(e) =>
                onPatch(section, field.id, (prev) => ({
                  ...prev,
                  okOption: e.target.value || undefined,
                }))
              }
              className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800"
            >
              <option value="">Не выбрано</option>
              {normalizeOptions(field.options).map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-xs text-slate-400">—</span>
          )}
        </td>
      ) : null}
      <td className="px-3 py-2">
        <input
          value={field.unit ?? ""}
          onChange={(e) =>
            onPatch(section, field.id, (prev) => ({
              ...prev,
              unit: e.target.value,
            }))
          }
          className="w-20 rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800"
          placeholder="мл"
        />
      </td>
      <td className="px-3 py-2">
        <input
          value={field.helpText ?? ""}
          onChange={(e) =>
            onPatch(section, field.id, (prev) => ({
              ...prev,
              helpText: e.target.value,
            }))
          }
          className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800"
          placeholder="Короткая подсказка"
        />
      </td>
      <td className="px-3 py-2 text-right">
        <button
          type="button"
          onClick={() => onDelete(section, field)}
          className="rounded-md border border-red-300 bg-white p-2 text-red-700 hover:bg-red-50"
          aria-label="Удалить поле"
          title="Удалить поле"
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
      </td>
    </tr>
  );
}
