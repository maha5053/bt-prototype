import type {
  MaterialTypeBalanceItem,
  MaterialTypeCode,
  MaterialTypeSettings,
  ProductStorageSettings,
  ProcessTemplate,
} from "../mocks/productionData";
import {
  DEFAULT_PRODUCT_STORAGE_SETTINGS,
  normalizeProductStorageSettings,
} from "../mocks/productionData";
import { RegistrationMaterialBalanceEditor } from "./RegistrationMaterialBalanceEditor";

type PanelProps = {
  template: ProcessTemplate;
  materialTypes: MaterialTypeSettings[];
  disabled: boolean;
  onPatch: (updater: (prev: ProcessTemplate) => ProcessTemplate) => void;
};

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

  return (
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
                  : DEFAULT_PRODUCT_STORAGE_SETTINGS.fields.map((field) => ({ ...field })),
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
  );
}
