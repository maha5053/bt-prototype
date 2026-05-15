import { useEffect, useMemo, useState } from "react";
import { ProductionProvider, useProduction } from "../context/ProductionContext";
import type {
  ConfigurableMaterialField,
  ConfigurableMaterialFieldType,
  FieldValue,
  MaterialTypeCode,
  MaterialTypeSettings,
} from "../mocks/productionData";

const FIELD_TYPE_LABEL: Record<ConfigurableMaterialFieldType, string> = {
  text: "Текст",
  number: "Число",
  date: "Дата",
  checkbox: "Чекбокс",
  select: "Список",
};

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
      <MaterialTypesAdminContent />
    </ProductionProvider>
  );
}

function MaterialTypesAdminContent() {
  const {
    materialTypes,
    updateMaterialTypeSettings,
    resetMaterialTypeSettings,
  } = useProduction();
  const [selectedCode, setSelectedCode] = useState<MaterialTypeCode>(
    materialTypes[0]?.code ?? "blood",
  );
  const selected = useMemo(
    () => materialTypes.find((item) => item.code === selectedCode) ?? materialTypes[0],
    [materialTypes, selectedCode],
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

  if (!draft || materialTypes.length === 0) {
    return (
      <div className="p-6 md:p-8">
        <h1 className="text-xl font-semibold text-slate-800">Типы материала</h1>
        <div className="mt-6 rounded-lg border border-dashed border-slate-200 bg-white p-6">
          <div className="text-sm font-semibold text-slate-800">
            Типы материала не найдены
          </div>
          <p className="mt-1 text-sm text-slate-600">
            Очистите локальные настройки или восстановите стандартные типы материала.
          </p>
          <button
            type="button"
            onClick={resetMaterialTypeSettings}
            className="mt-4 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Восстановить типы
          </button>
        </div>
      </div>
    );
  }

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">Типы материала</h1>
          <p className="mt-1 text-sm text-slate-500">
            Настройка полей регистрации и входного контроля для фиксированных типов материала.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={resetMaterialTypeSettings}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Восстановить типы
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            Сохранить настройки
          </button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(360px,0.85fr)_minmax(0,1.35fr)]">
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="px-4 py-3 font-medium">Тип материала</th>
                <th className="px-4 py-3 font-medium">Поля забора</th>
                <th className="px-4 py-3 font-medium">Входной контроль</th>
                <th className="px-4 py-3 font-medium">Действия</th>
              </tr>
            </thead>
            <tbody>
              {materialTypes.map((item) => {
                const active = item.code === draft.code;
                return (
                  <tr
                    key={item.code}
                    className={[
                      "border-t border-slate-100",
                      active ? "bg-blue-50/40" : "hover:bg-slate-50/80",
                    ].join(" ")}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900">{item.label}</span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                          {item.code}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {item.collectionFields.length}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {item.incomingControlFields.length}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setSelectedCode(item.code)}
                        className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                      >
                        {active ? "Открыто" : "Редактировать"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <div className="text-sm font-semibold text-slate-800">Общее</div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="block text-xs font-medium text-slate-600">
                Код
                <input
                  value={draft.code}
                  readOnly
                  className="mt-1 w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-500"
                />
              </label>
              <label className="block text-xs font-medium text-slate-600">
                Название
                <input
                  value={draft.label}
                  readOnly
                  className="mt-1 w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-2 text-sm text-slate-500"
                />
              </label>
            </div>
            <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              Изменения применяются только к новым заказам. Уже созданные заказы сохраняют свои поля.
            </div>
            {hasErrors ? (
              <div className="mt-3 text-sm text-red-700">
                Проверьте обязательные поля и варианты списков.
              </div>
            ) : savedAt ? (
              <div className="mt-3 text-sm text-emerald-700">
                Сохранено {new Date(savedAt).toLocaleTimeString("ru-RU", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </div>
            ) : null}
          </div>

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
        </div>
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
