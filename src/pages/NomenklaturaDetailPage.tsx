import { Link, useParams } from "react-router-dom";
import { useMemo, useState, useEffect } from "react";
import {
  formatRuDate,
  getEnrichedStockLinesByNomenclature,
  getTransactionsByNomenclature,
} from "../mocks/balancesData";
import {
  NomenclatureProvider,
  useNomenclature,
  type SpecificationItem,
  type SpecResultType,
} from "../context/NomenclatureContext";

type TabId = "stock" | "info" | "spec" | "journal";

const tabs: { id: TabId; label: string }[] = [
  { id: "stock", label: "Остаток" },
  { id: "info", label: "Информация" },
  { id: "spec", label: "Спецификация" },
  { id: "journal", label: "Журнал" },
];

export function NomenklaturaDetailPage() {
  return (
    <NomenclatureProvider>
      <NomenklaturaDetailContent />
    </NomenclatureProvider>
  );
}

function NomenklaturaDetailContent() {
  const { nomenclatureId } = useParams<{ nomenclatureId: string }>();
  const [tab, setTab] = useState<TabId>("stock");

  const { entries, updateItem } = useNomenclature();
  const catalog = nomenclatureId ? entries.find((e) => e.id === nomenclatureId) : undefined;
  const transactions = useMemo(
    () => (nomenclatureId ? getTransactionsByNomenclature(nomenclatureId) : []),
    [nomenclatureId],
  );

  if (!nomenclatureId || !catalog) {
    return (
      <div className="p-8">
        <p className="text-slate-600">Элемент номенклатуры не найден.</p>
        <Link
          to="/sklad/ostatki"
          className="mt-4 inline-block text-sm font-medium text-emerald-700 hover:underline"
        >
          ← К остаткам
        </Link>
      </div>
    );
  }

  const stockLines = getEnrichedStockLinesByNomenclature(nomenclatureId);

  const [specDraft, setSpecDraft] = useState<SpecificationItem[]>(
    catalog.specification ? [...catalog.specification] : [],
  );
  const [specError, setSpecError] = useState("");
  const [specToast, setSpecToast] = useState<string | null>(null);

  useEffect(() => {
    setSpecDraft(catalog.specification ? [...catalog.specification] : []);
    setSpecError("");
  }, [catalog.id, catalog.specification]);

  const addSpecRow = () => {
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : String(Math.random());
    setSpecDraft((rows) => [
      ...rows,
      { id, name: "", requirement: "", resultType: "Да", comment: "" },
    ]);
    setSpecError("");
  };

  const updateSpecRow = (id: string, patch: Partial<SpecificationItem>) => {
    setSpecDraft((rows) => rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    if (specError) setSpecError("");
  };

  const removeSpecRow = (id: string) => {
    setSpecDraft((rows) => rows.filter((r) => r.id !== id));
    if (specError) setSpecError("");
  };

  const validateSpec = (rows: SpecificationItem[]): string | null => {
    for (const [idx, r] of rows.entries()) {
      const pos = idx + 1;
      if (!r.name.trim()) return `Заполните «Наименование» в строке ${pos}.`;
      if (r.name.trim().length > 128)
        return `«Наименование» в строке ${pos} не должно превышать 128 символов.`;
      if (!r.requirement.trim()) return `Заполните «Требование» в строке ${pos}.`;
      if (r.requirement.trim().length > 1024)
        return `«Требование» в строке ${pos} не должно превышать 1024 символа.`;
      if (!r.resultType) return `Укажите «Тип результата» в строке ${pos}.`;
      if (r.comment && r.comment.length > 1024)
        return `«Комментарий» в строке ${pos} не должен превышать 1024 символа.`;
      if (r.sortOrder !== undefined && !Number.isFinite(r.sortOrder))
        return `«Поле сортировки» в строке ${pos} должно быть числом.`;
    }
    return null;
  };

  const saveSpec = () => {
    const bad = validateSpec(specDraft);
    if (bad) {
      setSpecError(bad);
      return;
    }
    updateItem(catalog.id, { specification: specDraft });
    setSpecToast("Спецификация сохранена");
    setTimeout(() => setSpecToast(null), 2500);
  };

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            to="/sklad/balance"
            className="mb-2 inline-flex text-sm font-medium text-emerald-700 hover:underline"
          >
            ← К остаткам
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            {catalog.name}
          </h1>
          <p className="mt-1 font-mono text-sm text-slate-500">
            {catalog.catalogNumber} · {catalog.group}
          </p>
        </div>
      </div>

      <div
        className="mb-6 flex flex-wrap gap-1 rounded-lg bg-slate-100 p-1"
        role="tablist"
        aria-label="Разделы карточки"
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.id
                ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
                : "text-slate-600 hover:bg-white/60 hover:text-slate-900"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "stock" ? (
        <section aria-labelledby="stock-heading" className="space-y-3">
          <h2 id="stock-heading" className="sr-only">
            Остаток по местам и партиям
          </h2>
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-[800px] w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                    <th className="px-4 py-3 font-medium">Наименование</th>
                    <th className="px-4 py-3 font-medium">Место хранения</th>
                    <th className="px-4 py-3 font-medium">Лот</th>
                    <th className="px-4 py-3 font-medium whitespace-nowrap">
                      Количество
                    </th>
                    <th className="px-4 py-3 font-medium whitespace-nowrap">
                      Срок годности
                    </th>
                    <th className="px-4 py-3 font-medium whitespace-nowrap">
                      Дата поступления
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {stockLines.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-10 text-center text-slate-500"
                      >
                        Нет строк остатков по выбранной номенклатуре.
                      </td>
                    </tr>
                  ) : (
                    stockLines.map((line, idx) => {
                      const now = new Date();
                      const expDate = new Date(line.expiryDate + "T00:00:00");
                      const isExpired = expDate < now;
                      const thirtyDaysFromNow = new Date(now);
                      thirtyDaysFromNow.setDate(
                        thirtyDaysFromNow.getDate() + 30,
                      );
                      const isExpiringSoon =
                        !isExpired && expDate <= thirtyDaysFromNow;

                      const expiryClassName = isExpired
                        ? "text-red-700 font-medium bg-red-50 rounded px-1.5 py-0.5"
                        : isExpiringSoon
                          ? "text-amber-700 font-medium bg-amber-50 rounded px-1.5 py-0.5"
                          : "text-slate-600";

                      return (
                        <tr
                          key={`${line.lot}-${line.place}-${idx}`}
                          className="border-b border-slate-100 last:border-0 hover:bg-slate-50/80"
                        >
                          <td className="px-4 py-3 text-slate-800">
                            {catalog.name}
                          </td>
                          <td className="px-4 py-3">{line.place}</td>
                          <td className="px-4 py-3 font-mono text-xs">
                            {line.lot}
                          </td>
                          <td className="px-4 py-3 tabular-nums">
                            {line.quantity}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={expiryClassName}>
                              {formatRuDate(line.expiryDate)}
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
                          <td className="px-4 py-3 tabular-nums whitespace-nowrap">
                            {formatRuDate(line.receiptDate)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      ) : null}

      {tab === "info" ? (
        <section aria-labelledby="info-heading">
          <h2
            id="info-heading"
            className="mb-3 text-lg font-semibold text-slate-900"
          >
            Информация (справочник)
          </h2>
          <dl className="grid max-w-3xl gap-x-6 gap-y-3 sm:grid-cols-2">
            <InfoRow label="Наименование" value={catalog.name} />
            <InfoRow label="Каталожный номер" value={catalog.catalogNumber} />
            <InfoRow label="Группа" value={catalog.group} />
            <InfoRow label="Ед. изм." value={catalog.unit} />
            <InfoRow label="Производитель" value={catalog.manufacturer} />
            <div className="sm:col-span-2">
              <InfoRow label="Описание" value={catalog.description} />
            </div>
            <div className="sm:col-span-2">
              <InfoRow
                label="Условия хранения"
                value={catalog.storageConditions}
              />
            </div>
            <div className="sm:col-span-2">
              <InfoRow label="Примечания" value={catalog.notes || "—"} />
            </div>
          </dl>
        </section>
      ) : null}

      {tab === "journal" ? (
        <section aria-labelledby="journal-heading" className="space-y-3">
          <h2
            id="journal-heading"
            className="text-lg font-semibold text-slate-900"
          >
            Журнал движений
          </h2>
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-[1000px] w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                    <th className="px-3 py-3 font-medium whitespace-nowrap">
                      ID
                    </th>
                    <th className="px-3 py-3 font-medium whitespace-nowrap">
                      Время
                    </th>
                    <th className="px-3 py-3 font-medium">Тип</th>
                    <th className="px-3 py-3 font-medium">Инициатор</th>
                    <th className="px-3 py-3 font-medium whitespace-nowrap">
                      Кол-во
                    </th>
                    <th className="px-3 py-3 font-medium">Лот</th>
                    <th className="px-3 py-3 font-medium">Контекст</th>
                    <th className="px-3 py-3 font-medium">Комментарий</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-4 py-10 text-center text-slate-500"
                      >
                        Нет операций.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx) => (
                      <tr
                        key={tx.id}
                        className="border-b border-slate-100 last:border-0 hover:bg-slate-50/80"
                      >
                        <td className="px-3 py-2.5 font-mono text-xs whitespace-nowrap">
                          {tx.id}
                        </td>
                        <td className="px-3 py-2.5 tabular-nums text-xs whitespace-nowrap text-slate-700">
                          {new Date(tx.timestamp).toLocaleString("ru-RU")}
                        </td>
                        <td className="px-3 py-2.5 capitalize">{tx.type}</td>
                        <td className="px-3 py-2.5">{tx.initiator}</td>
                        <td className="px-3 py-2.5 tabular-nums whitespace-nowrap">
                          {tx.quantity}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-xs">
                          {tx.lot}
                        </td>
                        <td className="px-3 py-2.5 text-slate-700">
                          {tx.context}
                        </td>
                        <td
                          className="max-w-[200px] px-3 py-2.5 text-slate-600 truncate"
                          title={tx.comment}
                        >
                          {tx.comment || "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      ) : null}

      {tab === "spec" ? (
        <section aria-labelledby="spec-heading" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="spec-heading" className="text-lg font-semibold text-slate-900">
              Спецификация
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={addSpecRow}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
              >
                Добавить элемент
              </button>
              <button
                type="button"
                onClick={saveSpec}
                className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-emerald-500"
              >
                Сохранить
              </button>
            </div>
          </div>

          {specError && (
            <p className="text-xs text-red-600" role="alert">
              {specError}
            </p>
          )}

          {specDraft.length === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-white px-4 py-10 text-center text-sm text-slate-500">
              Пока нет элементов спецификации.
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="min-w-[1100px] w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                      <th className="px-4 py-3 font-medium">Наименование *</th>
                      <th className="px-4 py-3 font-medium">Требование *</th>
                      <th className="px-4 py-3 font-medium whitespace-nowrap">
                        Тип результата *
                      </th>
                      <th className="px-4 py-3 font-medium">Комментарий</th>
                      <th className="px-4 py-3 font-medium whitespace-nowrap">
                        Поле сортировки
                      </th>
                      <th className="px-4 py-3 font-medium w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {specDraft.map((row) => (
                      <tr key={row.id} className="align-top">
                        <td className="px-4 py-3">
                          <input
                            value={row.name}
                            maxLength={128}
                            onChange={(e) => updateSpecRow(row.id, { name: e.target.value })}
                            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                            placeholder="Наименование…"
                          />
                          <div className="mt-1 text-[10px] text-slate-400">
                            {row.name.length}/128
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <textarea
                            value={row.requirement}
                            maxLength={1024}
                            onChange={(e) =>
                              updateSpecRow(row.id, { requirement: e.target.value })
                            }
                            rows={3}
                            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                            placeholder="Требование…"
                          />
                          <div className="mt-1 text-[10px] text-slate-400">
                            {row.requirement.length}/1024
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={row.resultType}
                            onChange={(e) =>
                              updateSpecRow(row.id, {
                                resultType: e.target.value as SpecResultType,
                              })
                            }
                            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                          >
                            {(["Да", "Нет", "Не применимо", "В работе"] as const).map(
                              (v) => (
                                <option key={v} value={v}>
                                  {v}
                                </option>
                              ),
                            )}
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          <textarea
                            value={row.comment}
                            maxLength={1024}
                            onChange={(e) =>
                              updateSpecRow(row.id, { comment: e.target.value })
                            }
                            rows={3}
                            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                            placeholder="Комментарий…"
                          />
                          <div className="mt-1 text-[10px] text-slate-400">
                            {row.comment.length}/1024
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <input
                            type="number"
                            value={row.sortOrder ?? ""}
                            onChange={(e) =>
                              updateSpecRow(row.id, {
                                sortOrder:
                                  e.target.value === "" ? undefined : Number(e.target.value),
                              })
                            }
                            className="w-28 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                            placeholder="—"
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => removeSpecRow(row.id)}
                            className="rounded-md p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                            title="Удалить"
                            aria-label="Удалить"
                          >
                            <svg
                              className="size-4"
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
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>
      ) : null}

      {specToast && (
        <div className="fixed bottom-4 right-4 z-50 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900 shadow-lg">
            {specToast}
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-100 bg-slate-50/50 px-3 py-2">
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm text-slate-900">{value}</dd>
    </div>
  );
}
