import { Tab } from "@headlessui/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ProductionProvider, useProduction } from "../context/ProductionContext";
import type {
  ConfigurableMaterialField,
  ConfigurableMaterialFieldType,
  FieldValue,
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
    .map((line) => line.trim())
    .filter(Boolean);
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
      const seen = new Map<string, string>();
      settings[section].forEach((field) => {
        const label = field.label.trim();
        const baseKey = `${section}:${field.id}`;
        if (!label) {
          errors[`${baseKey}:label`] = "Укажите название поля.";
        } else {
          const duplicate = seen.get(label.toLocaleLowerCase("ru"));
          if (duplicate) {
            errors[`${baseKey}:label`] =
              "Поле с таким названием уже есть в этом разделе.";
            errors[`${section}:${duplicate}:label`] =
              "Поле с таким названием уже есть в этом разделе.";
          } else {
            seen.set(label.toLocaleLowerCase("ru"), field.id);
          }
        }
        if (field.type === "select" && !field.options?.length) {
          errors[`${baseKey}:options`] = "Добавьте хотя бы один вариант списка.";
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
  const { materialTypes, resetMaterialTypeSettings } = useProduction();
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
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Типы материала</h1>
          <p className="mt-1 text-sm text-slate-500">
            Настройка фиксированных типов материала для новых заказов.
          </p>
        </div>
        <button
          type="button"
          onClick={resetMaterialTypeSettings}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Восстановить типы
        </button>
      </div>

      {materialTypes.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-200 bg-white p-6">
          <div className="text-sm font-semibold text-slate-800">
            Типы материала не найдены
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Очистите локальные настройки или восстановите стандартные типы материала.
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
                  <td className="px-4 py-3 text-slate-500">Не настроен</td>
                  <td className="px-4 py-3 text-slate-700">
                    {item.incomingControlFields.length}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function MaterialTypeEditorContent() {
  const { materialTypeCode } = useParams<{ materialTypeCode: string }>();
  const navigate = useNavigate();
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
  }, [selected]);

  const patchDraft = (updater: (prev: MaterialTypeSettings) => MaterialTypeSettings) => {
    setDraft((prev) => (prev ? updater(prev) : prev));
    setErrors({});
    setSavedAt(null);
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

  const handleSave = () => {
    if (!draft) return;
    const nextErrors = validateSettings(draft);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    updateMaterialTypeSettings(draft);
    setSavedAt(new Date().toISOString());
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

            <button
              type="button"
              onClick={handleSave}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
            >
              Сохранить настройки
            </button>
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
            <MaterialBalancePlaceholder
              onBackToProducts={() => navigate("/admin/konstruktor-ver2")}
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

function MaterialBalancePlaceholder({
  onBackToProducts,
}: {
  onBackToProducts: () => void;
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-sm font-semibold text-slate-800">Материальный баланс</div>
      <div className="mt-3 rounded-md border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-sm text-slate-600">
        <div className="font-medium text-slate-800">Раздел пока пуст.</div>
        <p className="mt-1">
          Настройки списания и расходников будут задаваться в настройках продукта.
        </p>
        <button
          type="button"
          onClick={onBackToProducts}
          className="mt-3 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Перейти к продуктам
        </button>
      </div>
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
            type={field.type === "number" ? "number" : field.type === "date" ? "date" : "text"}
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
