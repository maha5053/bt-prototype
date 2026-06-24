import { useState } from "react";
import type {
  ConfigurableMaterialCatalogCode,
  ConfigurableMaterialField,
  ConfigurableMaterialFieldType,
  FieldValue,
  MaterialTypeBalanceItem,
  MaterialTypeCode,
  MaterialTypeSettings,
  ProductStorageSettings,
  ProcessTemplate,
} from "../mocks/productionData";
import {
  CONFIGURABLE_MATERIAL_CATALOG_LABELS,
  DEFAULT_PRODUCT_STORAGE_SETTINGS,
  getConfigurableMaterialCatalogOptions,
  normalizeConfigurableMaterialCatalogCode,
  normalizeProductStorageSettings,
} from "../mocks/productionData";
import { RegistrationMaterialBalanceEditor } from "./RegistrationMaterialBalanceEditor";

const FIELD_TYPE_LABEL: Record<ConfigurableMaterialFieldType, string> = {
  text: "Текст",
  number: "Число",
  date: "Дата",
  checkbox: "Чекбокс",
  select: "Список",
  catalog: "Справочник",
};

type PanelProps = {
  template: ProcessTemplate;
  materialTypes: MaterialTypeSettings[];
  disabled: boolean;
  onPatch: (updater: (prev: ProcessTemplate) => ProcessTemplate) => void;
};

type DropPosition = "before" | "after";

function normalizeBalanceItems(
  items: MaterialTypeBalanceItem[] | undefined,
): MaterialTypeBalanceItem[] {
  return (items ?? []).map((item) => ({
    id: item.id,
    name: item.name,
    unit: item.unit?.trim() ? item.unit.trim() : "шт",
    defaultQuantity:
      typeof item.defaultQuantity === "number" && Number.isFinite(item.defaultQuantity)
        ? Math.max(0, Math.floor(item.defaultQuantity))
        : null,
    writeOffOnRegistrationComplete: Boolean(item.writeOffOnRegistrationComplete),
  }));
}

function makeStorageField(): ConfigurableMaterialField {
  return {
    id: `storage-field-${Date.now()}-${Math.random().toString(16).slice(2)}`,
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
  return value.split("\n").map((line) => line.trim());
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

function normalizeStorageField(field: ConfigurableMaterialField): ConfigurableMaterialField {
  const options = field.type === "select" ? normalizeOptions(field.options) : undefined;
  const catalogCode =
    field.type === "catalog"
      ? normalizeConfigurableMaterialCatalogCode(field.catalogCode)
      : undefined;
  const valueOptions =
    field.type === "catalog" ? getConfigurableMaterialCatalogOptions(catalogCode) : options;
  const normalized: ConfigurableMaterialField = {
    ...field,
    id: field.id.trim(),
    label: field.label.trim(),
    unit: (field.unit ?? "").trim(),
    helpText: (field.helpText ?? "").trim(),
    options,
    catalogCode,
    okOption: undefined,
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

  if (field.type === "select" || field.type === "catalog") {
    if (
      typeof field.defaultValue === "string" &&
      valueOptions?.some((option) => option === field.defaultValue)
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

function normalizeStorageFields(
  fields: ConfigurableMaterialField[],
): ConfigurableMaterialField[] {
  return fields.map(normalizeStorageField);
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

/** Вкладка «Регистрация»: тип материала и матбаланс. */
export function ProductRegistrationTabContent({
  template,
  materialTypes,
  disabled,
  onPatch,
}: PanelProps) {
  const materialTypeCode = (template.materialTypeCode ?? "blood") as MaterialTypeCode;
  const balanceRows = normalizeBalanceItems(template.registrationMaterialBalance);

  const patchBalanceList = (
    updater: (rows: MaterialTypeBalanceItem[]) => MaterialTypeBalanceItem[],
  ) => {
    onPatch((prev) => ({
      ...prev,
      registrationMaterialBalance: updater(
        normalizeBalanceItems(prev.registrationMaterialBalance),
      ),
    }));
  };

  const addBalanceItem = (item: { id: string; name: string }) => {
    patchBalanceList((rows) => {
      if (rows.some((row) => row.id === item.id)) return rows;
      return [
        ...rows,
        {
          id: item.id,
          name: item.name,
          unit: "шт",
          defaultQuantity: null,
          writeOffOnRegistrationComplete: false,
        },
      ];
    });
  };

  const patchBalanceItem = (
    itemId: string,
    updater: (row: MaterialTypeBalanceItem) => MaterialTypeBalanceItem,
  ) => {
    patchBalanceList((rows) =>
      rows.map((row) => (row.id === itemId ? updater(row) : row)),
    );
  };

  const removeBalanceItem = (itemId: string) => {
    patchBalanceList((rows) => rows.filter((row) => row.id !== itemId));
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <label
          htmlFor="product-material-type"
          className="block text-xs font-medium text-slate-600"
        >
          Тип материала
        </label>
        <select
          id="product-material-type"
          value={materialTypeCode}
          disabled={disabled}
          onChange={(e) => {
            const nextCode = e.target.value as MaterialTypeCode;
            onPatch((prev) => ({
              ...prev,
              materialTypeCode: nextCode,
            }));
          }}
          className="mt-1 block w-full max-w-sm rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 disabled:bg-slate-50 disabled:text-slate-500"
        >
          {materialTypes.map((item) => (
            <option key={item.code} value={item.code}>
              {item.label}
            </option>
          ))}
        </select>
        <p className="mt-2 text-sm text-slate-500">
          Используется для полей регистрации и входного контроля в новых заказах. Уже
          созданные заказы не изменяются.
        </p>
      </div>

      <RegistrationMaterialBalanceEditor
        items={balanceRows}
        disabled={disabled}
        onAdd={addBalanceItem}
        onPatch={patchBalanceItem}
        onRemove={removeBalanceItem}
      />
    </div>
  );
}

/** Вкладка «Хранение»: включение этапа и поля хранения. */
export function ProductStorageTabContent({
  template,
  disabled,
  onPatch,
}: Omit<PanelProps, "materialTypes">) {
  const storage = normalizeProductStorageSettings(template.storageStage);

  const patchStorage = (updater: (prev: ProductStorageSettings) => ProductStorageSettings) => {
    onPatch((prev) => ({
      ...prev,
      storageStage: updater(normalizeProductStorageSettings(prev.storageStage)),
    }));
  };

  const patchField = (
    fieldId: string,
    updater: (prev: ConfigurableMaterialField) => ConfigurableMaterialField,
  ) => {
    patchStorage((prev) => ({
      ...prev,
      fields: normalizeStorageFields(
        prev.fields.map((field) => (field.id === fieldId ? updater(field) : field)),
      ),
    }));
  };

  const addField = () => {
    patchStorage((prev) => ({
      ...prev,
      fields: [...prev.fields, makeStorageField()],
    }));
  };

  const deleteField = (field: ConfigurableMaterialField) => {
    const name = field.label.trim() || "Без названия";
    if (
      !window.confirm(
        `Удалить поле «${name}»? Оно исчезнет только из настроек для новых заказов.`,
      )
    ) {
      return;
    }
    patchStorage((prev) => ({
      ...prev,
      deletedFieldIds: DEFAULT_PRODUCT_STORAGE_SETTINGS.fields.some(
        (defaultField) => defaultField.id === field.id,
      )
        ? Array.from(new Set([...(prev.deletedFieldIds ?? []), field.id]))
        : prev.deletedFieldIds,
      fields: prev.fields.filter((item) => item.id !== field.id),
    }));
  };

  const reorderField = (
    fromFieldId: string,
    toFieldId: string,
    position: DropPosition = "before",
  ) => {
    if (fromFieldId === toFieldId) return;
    patchStorage((prev) => {
      const fields = [...prev.fields];
      const fromIdx = fields.findIndex((field) => field.id === fromFieldId);
      const toIdx = fields.findIndex((field) => field.id === toFieldId);
      if (fromIdx < 0 || toIdx < 0) return prev;
      const [moved] = fields.splice(fromIdx, 1);
      if (!moved) return prev;
      const targetIdxAfterRemoval = fields.findIndex((field) => field.id === toFieldId);
      if (targetIdxAfterRemoval < 0) return prev;
      const insertIdx =
        position === "after" ? targetIdxAfterRemoval + 1 : targetIdxAfterRemoval;
      fields.splice(insertIdx, 0, moved);
      return { ...prev, fields };
    });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={storage.enabled}
            disabled={disabled}
            onChange={(e) => {
              const enabled = e.target.checked;
              patchStorage((prev) => ({
                ...prev,
                enabled,
                fields:
                  prev.fields.length > 0
                    ? prev.fields
                    : DEFAULT_PRODUCT_STORAGE_SETTINGS.fields.map((field) => ({
                        ...field,
                      })),
              }));
            }}
            className="mt-0.5 size-4 rounded border-slate-300 text-blue-600"
          />
          <span>
            <span className="block text-sm font-semibold text-slate-800">
              Включить хранение
            </span>
            <span className="mt-1 block text-sm text-slate-500">
              Если включено, в новых заказах после производства появится этап «Хранение».
            </span>
          </span>
        </label>
      </div>

      <StorageFieldsEditor
        fields={storage.fields}
        disabled={disabled}
        onAdd={addField}
        onDelete={deleteField}
        onPatch={patchField}
        onReorder={reorderField}
      />
    </div>
  );
}

function StorageFieldsEditor({
  fields,
  disabled,
  onAdd,
  onDelete,
  onPatch,
  onReorder,
}: {
  fields: ConfigurableMaterialField[];
  disabled: boolean;
  onAdd: () => void;
  onDelete: (field: ConfigurableMaterialField) => void;
  onPatch: (
    fieldId: string,
    updater: (prev: ConfigurableMaterialField) => ConfigurableMaterialField,
  ) => void;
  onReorder: (
    fromFieldId: string,
    toFieldId: string,
    position: DropPosition,
  ) => void;
}) {
  const [draggingFieldId, setDraggingFieldId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<{
    fieldId: string;
    position: DropPosition;
  } | null>(null);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-sm font-semibold text-slate-800">Настройка полей</div>
          <p className="mt-1 text-sm text-slate-500">
            Эти поля появятся в этапе «Хранение» для новых заказов.
          </p>
        </div>
        <button
          type="button"
          onClick={onAdd}
          disabled={disabled}
          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
        >
          Добавить поле
        </button>
      </div>

      {fields.length === 0 ? (
        <div className="mt-3 rounded-md border border-dashed border-slate-200 bg-slate-50 px-3 py-4 text-sm text-slate-600">
          <div className="font-medium text-slate-800">Поля не настроены</div>
          <p className="mt-1">Добавьте поле, чтобы оно появилось в новых заказах.</p>
        </div>
      ) : (
        <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200">
          <table className="min-w-[720px] w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-600">
              <tr>
                <th className="w-10 px-3 py-2 font-medium" aria-label="Порядок" />
                <th className="px-3 py-2 font-medium">Название поля</th>
                <th className="px-3 py-2 font-medium">Тип</th>
                <th className="px-3 py-2 font-medium">Обязательное</th>
                <th className="px-3 py-2 font-medium">Значение по умолчанию</th>
                <th className="px-3 py-2 font-medium text-right">Действия</th>
              </tr>
            </thead>
            <tbody>
              {fields.map((field) => (
                <StorageFieldRow
                  key={field.id}
                  field={field}
                  disabled={disabled}
                  draggingFieldId={draggingFieldId}
                  dropTarget={dropTarget}
                  onDelete={onDelete}
                  onPatch={onPatch}
                  onReorder={onReorder}
                  onDragStart={setDraggingFieldId}
                  onDragOver={setDropTarget}
                  onDragEnd={() => {
                    setDraggingFieldId(null);
                    setDropTarget(null);
                  }}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function StorageFieldRow({
  field,
  disabled,
  draggingFieldId,
  dropTarget,
  onDelete,
  onPatch,
  onReorder,
  onDragStart,
  onDragOver,
  onDragEnd,
}: {
  field: ConfigurableMaterialField;
  disabled: boolean;
  draggingFieldId: string | null;
  dropTarget: { fieldId: string; position: DropPosition } | null;
  onDelete: (field: ConfigurableMaterialField) => void;
  onPatch: (
    fieldId: string,
    updater: (prev: ConfigurableMaterialField) => ConfigurableMaterialField,
  ) => void;
  onReorder: (
    fromFieldId: string,
    toFieldId: string,
    position: DropPosition,
  ) => void;
  onDragStart: (fieldId: string) => void;
  onDragOver: (target: { fieldId: string; position: DropPosition } | null) => void;
  onDragEnd: () => void;
}) {
  const isDragging = draggingFieldId === field.id;
  const currentDropPosition =
    dropTarget?.fieldId === field.id ? dropTarget.position : null;

  return (
    <tr
      className={[
        "relative border-t border-slate-100 align-top transition-colors",
        isDragging ? "bg-slate-50 opacity-60 shadow-inner" : "",
        currentDropPosition ? "bg-blue-50/50" : "",
      ].join(" ")}
      onDragOver={(e) => {
        if (disabled || !draggingFieldId) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        const rect = e.currentTarget.getBoundingClientRect();
        const position: DropPosition =
          e.clientY < rect.top + rect.height / 2 ? "before" : "after";
        onDragOver({ fieldId: field.id, position });
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          onDragOver(null);
        }
      }}
      onDrop={(e) => {
        if (disabled) return;
        e.preventDefault();
        const fromFieldId = e.dataTransfer.getData("text/plain") || draggingFieldId;
        if (!fromFieldId) return;
        onReorder(fromFieldId, field.id, currentDropPosition ?? "before");
        onDragEnd();
      }}
    >
      <td className="relative px-3 py-2">
        {currentDropPosition ? (
          <span
            className={[
              "pointer-events-none absolute left-2 right-0 z-10 h-0.5 rounded-full bg-blue-500",
              currentDropPosition === "before" ? "top-0" : "bottom-0",
            ].join(" ")}
            aria-hidden
          />
        ) : null}
        <span
          draggable={!disabled}
          onDragStart={(e) => {
            onDragStart(field.id);
            e.dataTransfer.effectAllowed = "move";
            e.dataTransfer.setData("text/plain", field.id);
          }}
          onDragEnd={onDragEnd}
          onKeyDown={(e) => {
            if (e.key === " ") e.preventDefault();
          }}
          className={[
            "inline-flex items-center gap-1 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs font-medium text-slate-600 shadow-sm hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 active:cursor-grabbing",
            isDragging ? "border-blue-400 bg-blue-50 text-blue-700 shadow" : "",
            disabled ? "cursor-not-allowed opacity-50" : "cursor-grab",
          ].join(" ")}
          aria-label="Перетащить поле"
          title="Перетащите поле вверх или вниз"
          role="button"
          tabIndex={disabled ? -1 : 0}
        >
          <span aria-hidden>☰</span>
          <span className="sr-only">Перетащить</span>
        </span>
      </td>
      <td className="px-3 py-2">
        <input
          value={field.label}
          disabled={disabled}
          onChange={(e) =>
            onPatch(field.id, (prev) => ({
              ...prev,
              label: e.target.value,
            }))
          }
          className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800 disabled:bg-slate-50 disabled:text-slate-500"
          placeholder="Напр. Целостность упаковки"
        />
      </td>
      <td className="px-3 py-2">
        <select
          value={field.type}
          disabled={disabled}
          onChange={(e) => {
            const nextType = e.target.value as ConfigurableMaterialFieldType;
            onPatch(field.id, (prev) => ({
              ...prev,
              type: nextType,
              defaultValue: valueFromInput("", nextType),
              options:
                nextType === "select" ? prev.options?.length ? prev.options : [""] : undefined,
              catalogCode: nextType === "catalog" ? "temperatureRegime" : undefined,
              okOption: undefined,
            }));
          }}
          className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800 disabled:bg-slate-50 disabled:text-slate-500"
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
              disabled={disabled}
              onChange={(e) =>
                onPatch(field.id, (prev) => ({
                  ...prev,
                  options: textToOptions(e.target.value),
                }))
              }
              className="h-20 w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800 disabled:bg-slate-50 disabled:text-slate-500"
              placeholder="Каждый вариант с новой строки."
            />
            <div className="mt-1 text-xs text-slate-500">
              Каждый вариант с новой строки.
            </div>
          </div>
        ) : null}
        {field.type === "catalog" ? (
          <div className="mt-2">
            <select
              value={normalizeConfigurableMaterialCatalogCode(field.catalogCode)}
              disabled={disabled}
              onChange={(e) => {
                const catalogCode = e.target.value as ConfigurableMaterialCatalogCode;
                onPatch(field.id, (prev) => ({
                  ...prev,
                  catalogCode,
                  defaultValue: null,
                }));
              }}
              className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800 disabled:bg-slate-50 disabled:text-slate-500"
            >
              {(
                Object.keys(
                  CONFIGURABLE_MATERIAL_CATALOG_LABELS,
                ) as ConfigurableMaterialCatalogCode[]
              ).map((catalogCode) => (
                <option key={catalogCode} value={catalogCode}>
                  {CONFIGURABLE_MATERIAL_CATALOG_LABELS[catalogCode]}
                </option>
              ))}
            </select>
            <div className="mt-1 text-xs text-slate-500">Источник значений поля.</div>
          </div>
        ) : null}
      </td>
      <td className="px-3 py-2">
        <input
          type="checkbox"
          checked={field.required}
          disabled={disabled}
          onChange={(e) =>
            onPatch(field.id, (prev) => ({
              ...prev,
              required: e.target.checked,
            }))
          }
          className="size-4 rounded border-slate-300 text-blue-600 disabled:opacity-60"
          aria-label="Обязательное поле"
        />
      </td>
      <td className="px-3 py-2">
        {field.type === "checkbox" ? (
          <input
            type="checkbox"
            checked={Boolean(defaultValueForType(field.defaultValue, field.type))}
            disabled={disabled}
            onChange={(e) =>
              onPatch(field.id, (prev) => ({
                ...prev,
                defaultValue: e.target.checked,
              }))
            }
            className="size-4 rounded border-slate-300 text-blue-600 disabled:opacity-60"
            aria-label="Значение по умолчанию"
          />
        ) : field.type === "catalog" ? (
          <select
            value={String(defaultValueForType(field.defaultValue, field.type))}
            disabled={disabled}
            onChange={(e) =>
              onPatch(field.id, (prev) => ({
                ...prev,
                defaultValue: e.target.value || null,
              }))
            }
            className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800 disabled:bg-slate-50 disabled:text-slate-500"
          >
            <option value="">Не выбрано</option>
            {getConfigurableMaterialCatalogOptions(field.catalogCode).map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        ) : (
          <input
            type={
              field.type === "number" ? "number" : field.type === "date" ? "date" : "text"
            }
            value={String(defaultValueForType(field.defaultValue, field.type))}
            disabled={disabled}
            onChange={(e) =>
              onPatch(field.id, (prev) => ({
                ...prev,
                defaultValue: valueFromInput(e.target.value, field.type),
              }))
            }
            className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800 disabled:bg-slate-50 disabled:text-slate-500"
          />
        )}
      </td>
      <td className="px-3 py-2 text-right">
        <button
          type="button"
          onClick={() => onDelete(field)}
          disabled={disabled}
          className="rounded-md border border-red-300 bg-white p-2 text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
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
