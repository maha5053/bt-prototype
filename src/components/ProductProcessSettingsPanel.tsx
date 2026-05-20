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

type PanelProps = {
  template: ProcessTemplate;
  materialTypes: MaterialTypeSettings[];
  disabled: boolean;
  onPatch: (updater: (prev: ProcessTemplate) => ProcessTemplate) => void;
};

function balanceItemFromMaterialType(
  items: MaterialTypeBalanceItem[],
  productItems: MaterialTypeBalanceItem[] | undefined,
): MaterialTypeBalanceItem[] {
  const overrideById = new Map((productItems ?? []).map((item) => [item.id, item]));
  return items.map((item) => {
    const override = overrideById.get(item.id);
    return {
      ...item,
      defaultQuantity:
        override?.defaultQuantity !== undefined
          ? override.defaultQuantity
          : item.defaultQuantity,
      writeOffOnRegistrationComplete:
        override?.writeOffOnRegistrationComplete ??
        item.writeOffOnRegistrationComplete,
    };
  });
}

/** Вкладка «Регистрация»: тип материала и матбаланс. */
export function ProductRegistrationTabContent({
  template,
  materialTypes,
  disabled,
  onPatch,
}: PanelProps) {
  const materialTypeCode = (template.materialTypeCode ?? "blood") as MaterialTypeCode;
  const materialType =
    materialTypes.find((item) => item.code === materialTypeCode) ?? null;
  const balanceRows = balanceItemFromMaterialType(
    materialType?.materialBalanceItems ?? [],
    template.registrationMaterialBalance,
  );

  const patchBalance = (
    itemId: string,
    updater: (row: MaterialTypeBalanceItem) => MaterialTypeBalanceItem,
  ) => {
    onPatch((prev) => {
      const base = balanceItemFromMaterialType(
        materialType?.materialBalanceItems ?? [],
        prev.registrationMaterialBalance,
      );
      return {
        ...prev,
        registrationMaterialBalance: base.map((row) =>
          row.id === itemId ? updater(row) : row,
        ),
      };
    });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <label className="block text-xs font-medium text-slate-600">
          Тип материала
          <select
            value={materialTypeCode}
            disabled={disabled}
            onChange={(e) => {
              const nextCode = e.target.value as MaterialTypeCode;
              const nextMaterialType =
                materialTypes.find((item) => item.code === nextCode) ?? null;
              onPatch((prev) => ({
                ...prev,
                materialTypeCode: nextCode,
                registrationMaterialBalance: nextMaterialType
                  ? JSON.parse(JSON.stringify(nextMaterialType.materialBalanceItems))
                  : [],
              }));
            }}
            className="mt-1 w-full max-w-sm rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 disabled:bg-slate-50 disabled:text-slate-500"
          >
            {materialTypes.map((item) => (
              <option key={item.code} value={item.code}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <p className="mt-2 text-sm text-slate-500">
          Используется для полей регистрации и входного контроля в новых заказах. Уже
          созданные заказы не изменяются.
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-800">
          Материальный баланс регистрации
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Строки берутся из типа материала «{materialType?.label ?? "—"}». Здесь задаются
          количества по умолчанию для новых заказов.
        </p>
        {balanceRows.length === 0 ? (
          <p className="mt-3 text-sm text-slate-600">
            В типе материала нет строк матбаланса. Добавьте их в{" "}
            <span className="font-medium">Типы материала → Материальный баланс</span>.
          </p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-3 py-2 font-medium">Наименование</th>
                  <th className="px-3 py-2 font-medium">Кол-во по умолчанию</th>
                  <th className="px-3 py-2 font-medium">Ед.</th>
                  <th className="px-3 py-2 font-medium">
                    Списание при завершении регистрации
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {balanceRows.map((row) => (
                  <tr key={row.id}>
                    <td className="px-3 py-2 text-slate-800">{row.name}</td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min={0}
                        step={1}
                        disabled={disabled}
                        value={
                          typeof row.defaultQuantity === "number" &&
                          Number.isFinite(row.defaultQuantity)
                            ? row.defaultQuantity
                            : ""
                        }
                        onChange={(e) => {
                          const raw = e.target.value;
                          const defaultQuantity =
                            raw === "" ? null : Math.max(0, Math.floor(Number(raw)));
                          patchBalance(row.id, (prev) => ({ ...prev, defaultQuantity }));
                        }}
                        className="w-24 rounded-md border border-slate-300 px-2 py-1.5 text-sm"
                      />
                    </td>
                    <td className="px-3 py-2 text-slate-600">{row.unit}</td>
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        disabled={disabled}
                        checked={Boolean(row.writeOffOnRegistrationComplete)}
                        onChange={(e) => {
                          patchBalance(row.id, (prev) => ({
                            ...prev,
                            writeOffOnRegistrationComplete: e.target.checked,
                          }));
                        }}
                        className="size-4 rounded border-slate-300 text-blue-600"
                        aria-label={`Списание: ${row.name}`}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
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
            Этап хранения после производства
          </span>
          <span className="mt-1 block text-sm text-slate-500">
            Если включено, в новых заказах после производства появится этап «Хранение» с
            настраиваемыми полями.
          </span>
        </span>
      </label>

      {storage.enabled ? (
        <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
              <tr>
                <th className="px-3 py-2 font-medium">Поле</th>
                <th className="px-3 py-2 font-medium">Тип</th>
                <th className="px-3 py-2 font-medium">Обяз.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {storage.fields.map((field, idx) => (
                <tr key={field.id}>
                  <td className="px-3 py-2 text-slate-800">{field.label}</td>
                  <td className="px-3 py-2 text-slate-600">{field.type}</td>
                  <td className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={Boolean(field.required)}
                      disabled={disabled}
                      onChange={(e) => {
                        const required = e.target.checked;
                        patchStorage((prev) => ({
                          ...prev,
                          fields: prev.fields.map((row, rowIdx) =>
                            rowIdx === idx ? { ...row, required } : row,
                          ),
                        }));
                      }}
                      className="size-4 rounded border-slate-300 text-blue-600"
                      aria-label={`Обязательное: ${field.label}`}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
