import { Link, useParams } from "react-router-dom";
import { useMemo, useState, useEffect } from "react";
import { Combobox } from "@headlessui/react";
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
import {
  buildSpecRowsFromTemplate,
  listSpecTemplates,
  upsertSpecTemplate,
  type SpecTemplate,
} from "../lib/specTemplatesStorage";

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
  const [specDraggingId, setSpecDraggingId] = useState<string | null>(null);
  const [specDragOverId, setSpecDragOverId] = useState<string | null>(null);

  const [specTemplates, setSpecTemplates] = useState<SpecTemplate[]>([]);
  const [openSaveTemplate, setOpenSaveTemplate] = useState(false);
  const [openLoadTemplate, setOpenLoadTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateError, setTemplateError] = useState("");
  const [saveOverwritePrompt, setSaveOverwritePrompt] = useState(false);

  const [selectedTemplate, setSelectedTemplate] = useState<SpecTemplate | null>(null);
  const [templateSearch, setTemplateSearch] = useState("");
  const [loadConfirm, setLoadConfirm] = useState<{
    templateId: string;
    templateName: string;
  } | null>(null);

  useEffect(() => {
    setSpecDraft(catalog.specification ? [...catalog.specification] : []);
    setSpecError("");
  }, [catalog.id, catalog.specification]);

  useEffect(() => {
    if (!openSaveTemplate && !openLoadTemplate) return;
    setSpecTemplates(listSpecTemplates());
  }, [openSaveTemplate, openLoadTemplate]);

  const addSpecRow = () => {
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : String(Math.random());
    setSpecDraft((rows) => [
      ...rows,
      {
        id,
        name: "",
        requirement: "",
        resultType: "Да/нет",
        comment: "",
        confirmed: false,
      },
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

  const persistSpecDraft = (nextRows: SpecificationItem[], validate = true) => {
    if (validate) {
      const bad = validateSpec(nextRows);
      if (bad) {
        setSpecError(bad);
        return false;
      }
    }
    updateItem(catalog.id, { specification: nextRows });
    setSpecToast("Спецификация сохранена");
    setTimeout(() => setSpecToast(null), 2500);
    return true;
  };

  const confirmSpecRow = (id: string) => {
    const nextRows = specDraft.map((r) => (r.id === id ? { ...r, confirmed: true } : r));
    if (!persistSpecDraft(nextRows, true)) return;
    setSpecDraft(nextRows);
  };

  const reorderSpecRows = (fromId: string, toId: string) => {
    if (fromId === toId) return;
    const fromIdx = specDraft.findIndex((r) => r.id === fromId);
    const toIdx = specDraft.findIndex((r) => r.id === toId);
    if (fromIdx < 0 || toIdx < 0) return;

    const next = [...specDraft];
    const [moved] = next.splice(fromIdx, 1);
    if (!moved) return;
    next.splice(toIdx, 0, moved);

    const normalized = next.map((r, idx) => ({ ...r, sortOrder: idx + 1 }));
    persistSpecDraft(normalized, false);
    setSpecDraft(normalized);
  };

  const openSaveTemplateModal = () => {
    setTemplateName("");
    setTemplateError("");
    setSaveOverwritePrompt(false);
    setOpenSaveTemplate(true);
  };

  const openLoadTemplateModal = () => {
    setSelectedTemplate(null);
    setTemplateSearch("");
    setLoadConfirm(null);
    setTemplateError("");
    setOpenLoadTemplate(true);
  };

  const saveCurrentSpecAsTemplate = (overwrite: boolean) => {
    const name = templateName.trim();
    if (!name) {
      setTemplateError("Укажите название шаблона.");
      return;
    }

    const existing = specTemplates.find(
      (t) => t.name.trim().toLowerCase() === name.toLowerCase(),
    );
    if (existing && !overwrite) {
      setSaveOverwritePrompt(true);
      setTemplateError(
        "Шаблон с таким названием уже существует. Перезаписать его?",
      );
      return;
    }

    upsertSpecTemplate({
      id: existing?.id,
      name,
      items: specDraft,
    });
    setSpecTemplates(listSpecTemplates());
    setOpenSaveTemplate(false);
    setSpecToast("Шаблон спецификации сохранён");
    setTimeout(() => setSpecToast(null), 2500);
  };

  const applyTemplate = (mode: "replace" | "append", templateId: string) => {
    const tpl = specTemplates.find((t) => t.id === templateId) ?? null;
    if (!tpl) return;

    const rows = buildSpecRowsFromTemplate(tpl) as SpecificationItem[];
    const next =
      mode === "replace"
        ? rows
        : [...specDraft, ...rows].map((r, idx) => ({ ...r, sortOrder: idx + 1 }));

    setSpecError("");
    persistSpecDraft(next, false);
    setSpecDraft(next);
    setOpenLoadTemplate(false);
    setLoadConfirm(null);
  };

  const filteredTemplates = useMemo(() => {
    const q = templateSearch.trim().toLowerCase();
    if (!q) return specTemplates;
    return specTemplates.filter((t) => t.name.toLowerCase().includes(q));
  }, [specTemplates, templateSearch]);

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
                onClick={openLoadTemplateModal}
                className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
              >
                Загрузить из шаблона
              </button>
              <button
                type="button"
                onClick={openSaveTemplateModal}
                className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-emerald-500"
              >
                Сохранить как шаблон
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
              <div className="mt-4">
                <button
                  type="button"
                  onClick={addSpecRow}
                  className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                >
                  Добавить элемент
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                  <table className="min-w-[1100px] w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                        <th className="px-4 py-3 font-medium w-10" aria-label="Порядок" />
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
                        <tr
                          key={row.id}
                          className={[
                            "align-top",
                            specDragOverId === row.id && specDraggingId
                              ? "bg-emerald-50/40"
                              : "",
                          ].join(" ")}
                          onDragOver={(e) => {
                            if (!specDraggingId) return;
                            e.preventDefault();
                            setSpecDragOverId(row.id);
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            const fromId =
                              e.dataTransfer.getData("text/plain") || specDraggingId;
                            if (!fromId) return;
                            reorderSpecRows(fromId, row.id);
                            setSpecDraggingId(null);
                            setSpecDragOverId(null);
                          }}
                        >
                          <td className="px-4 py-3">
                            <span
                              className="inline-flex cursor-grab rounded-md border border-slate-200 bg-white p-1.5 text-slate-500 hover:bg-slate-50 hover:text-slate-800 active:cursor-grabbing"
                              title="Перетащите, чтобы изменить порядок"
                              aria-label="Перетащить показатель"
                              role="button"
                              tabIndex={0}
                              draggable
                              onDragStart={(e) => {
                                setSpecDraggingId(row.id);
                                e.dataTransfer.effectAllowed = "move";
                                e.dataTransfer.setData("text/plain", row.id);
                              }}
                              onDragEnd={() => {
                                setSpecDraggingId(null);
                                setSpecDragOverId(null);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === " ") e.preventDefault();
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
                                <path d="M10 5h.01" />
                                <path d="M10 12h.01" />
                                <path d="M10 19h.01" />
                                <path d="M14 5h.01" />
                                <path d="M14 12h.01" />
                                <path d="M14 19h.01" />
                              </svg>
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {row.confirmed ? (
                              <button
                                type="button"
                                onClick={() => updateSpecRow(row.id, { confirmed: false })}
                                className="w-full rounded-md border border-transparent bg-transparent px-2 py-1.5 text-left text-sm text-slate-800 hover:border-slate-300 hover:bg-slate-50"
                                title="Редактировать"
                              >
                                {row.name || "—"}
                              </button>
                            ) : (
                              <>
                                <input
                                  value={row.name}
                                  maxLength={128}
                                  onChange={(e) =>
                                    updateSpecRow(row.id, { name: e.target.value })
                                  }
                                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                                  placeholder="Наименование…"
                                />
                                <div className="mt-1 text-[10px] text-slate-400">
                                  {row.name.length}/128
                                </div>
                              </>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {row.confirmed ? (
                              <button
                                type="button"
                                onClick={() => updateSpecRow(row.id, { confirmed: false })}
                                className="w-full rounded-md border border-transparent bg-transparent px-2 py-1.5 text-left text-sm text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                                title="Редактировать"
                              >
                                <span className="line-clamp-3">
                                  {row.requirement || "—"}
                                </span>
                              </button>
                            ) : (
                              <>
                                <textarea
                                  value={row.requirement}
                                  maxLength={1024}
                                  onChange={(e) =>
                                    updateSpecRow(row.id, {
                                      requirement: e.target.value,
                                    })
                                  }
                                  rows={3}
                                  className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                                  placeholder="Требование…"
                                />
                                <div className="mt-1 text-[10px] text-slate-400">
                                  {row.requirement.length}/1024
                                </div>
                              </>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {row.confirmed ? (
                              <button
                                type="button"
                                onClick={() => updateSpecRow(row.id, { confirmed: false })}
                                className="w-full rounded-md border border-transparent bg-transparent px-2 py-1.5 text-left text-sm text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                                title="Редактировать"
                              >
                                {row.resultType}
                              </button>
                            ) : (
                              <select
                                value={row.resultType}
                                onChange={(e) =>
                                  updateSpecRow(row.id, {
                                    resultType: e.target.value as SpecResultType,
                                  })
                                }
                                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                              >
                                {(["Да/нет", "Не применимо", "В работе"] as const).map(
                                  (v) => (
                                    <option key={v} value={v}>
                                      {v}
                                    </option>
                                  ),
                                )}
                              </select>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {row.confirmed ? (
                              <button
                                type="button"
                                onClick={() => updateSpecRow(row.id, { confirmed: false })}
                                className="w-full rounded-md border border-transparent bg-transparent px-2 py-1.5 text-left text-sm text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                                title="Редактировать"
                              >
                                <span className="line-clamp-3">{row.comment || "—"}</span>
                              </button>
                            ) : (
                              <>
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
                              </>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {row.confirmed ? (
                              <button
                                type="button"
                                onClick={() => updateSpecRow(row.id, { confirmed: false })}
                                className="w-28 rounded-md border border-transparent bg-transparent px-2 py-1.5 text-left text-sm text-slate-700 hover:border-slate-300 hover:bg-slate-50"
                                title="Редактировать"
                              >
                                {row.sortOrder ?? "—"}
                              </button>
                            ) : (
                              <input
                                type="number"
                                value={row.sortOrder ?? ""}
                                onChange={(e) =>
                                  updateSpecRow(row.id, {
                                    sortOrder:
                                      e.target.value === ""
                                        ? undefined
                                        : Number(e.target.value),
                                  })
                                }
                                className="w-28 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                                placeholder="—"
                              />
                            )}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              {!row.confirmed && (
                                <button
                                  type="button"
                                  onClick={() => confirmSpecRow(row.id)}
                                  className="rounded-md bg-emerald-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-emerald-500"
                                  title="OK"
                                >
                                  OK
                                </button>
                              )}
                              {row.confirmed && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateSpecRow(row.id, { confirmed: false })
                                  }
                                  className="rounded-md border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                                  title="Редактировать"
                                >
                                  ✎
                                </button>
                              )}
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
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex items-center justify-start">
                <button
                  type="button"
                  onClick={addSpecRow}
                  className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                >
                  Добавить элемент
                </button>
              </div>
            </>
          )}

          {openSaveTemplate ? (
            <div
              className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-black/40 pt-16"
              onClick={() => setOpenSaveTemplate(false)}
            >
              <div
                className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label="Сохранить как шаблон"
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Сохранить как шаблон
                  </h3>
                  <button
                    type="button"
                    onClick={() => setOpenSaveTemplate(false)}
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
                      aria-hidden
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>

                <label className="block text-sm font-medium text-slate-700">
                  Название шаблона
                  <input
                    value={templateName}
                    maxLength={128}
                    onChange={(e) => {
                      setTemplateName(e.target.value);
                      if (templateError) setTemplateError("");
                      if (saveOverwritePrompt) setSaveOverwritePrompt(false);
                    }}
                    className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                    placeholder="Напр. Флаконы 25см²"
                  />
                </label>

                {templateError ? (
                  <p className="mt-2 text-xs text-red-600" role="alert">
                    {templateError}
                  </p>
                ) : null}

                <div className="mt-5 flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
                  <button
                    type="button"
                    onClick={() => setOpenSaveTemplate(false)}
                    className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                  >
                    Отмена
                  </button>
                  {saveOverwritePrompt ? (
                    <button
                      type="button"
                      onClick={() => saveCurrentSpecAsTemplate(true)}
                      className="rounded-md bg-amber-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-amber-500"
                    >
                      Перезаписать
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => saveCurrentSpecAsTemplate(false)}
                      className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-emerald-500"
                    >
                      Сохранить
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : null}

          {openLoadTemplate ? (
            <div
              className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-black/40 pt-16"
              onClick={() => setOpenLoadTemplate(false)}
            >
              <div
                className="w-full max-w-xl rounded-xl bg-white p-6 shadow-xl"
                onClick={(e) => e.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label="Загрузить из шаблона"
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <h3 className="text-lg font-semibold text-slate-900">
                    Загрузить из шаблона
                  </h3>
                  <button
                    type="button"
                    onClick={() => setOpenLoadTemplate(false)}
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
                      aria-hidden
                    >
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </div>

                {specTemplates.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50/40 px-4 py-6 text-sm text-slate-600">
                    Шаблонов пока нет. Сначала сохраните спецификацию как шаблон.
                  </div>
                ) : (
                  <>
                    <label className="block">
                      <div className="mb-1 text-xs font-medium text-slate-600">
                        Шаблон
                      </div>
                      <Combobox
                        value={selectedTemplate}
                        onChange={(tpl: SpecTemplate | null) => {
                          setSelectedTemplate(tpl);
                          setTemplateSearch("");
                          setLoadConfirm(null);
                        }}
                      >
                        <div className="relative">
                          <Combobox.Input
                            className="w-full rounded-lg border border-slate-200 px-3 py-2 pr-9 text-sm outline-none transition focus:border-emerald-400"
                            placeholder="Начните вводить…"
                            displayValue={(tpl: SpecTemplate | null) =>
                              tpl ? tpl.name : ""
                            }
                            onChange={(e) => setTemplateSearch(e.target.value)}
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
                            {filteredTemplates.length === 0 ? (
                              <div className="px-3 py-2 text-slate-500">
                                Ничего не найдено.
                              </div>
                            ) : (
                              filteredTemplates.map((t) => (
                                <Combobox.Option
                                  key={t.id}
                                  value={t}
                                  className={({ active }) =>
                                    `cursor-pointer select-none px-3 py-2 ${
                                      active
                                        ? "bg-emerald-600 text-white"
                                        : "text-slate-700"
                                    }`
                                  }
                                >
                                  <div className="flex items-baseline justify-between gap-3">
                                    <span className="font-medium">{t.name}</span>
                                    <span className="shrink-0 text-xs opacity-80">
                                      {t.items.length} показ.
                                    </span>
                                  </div>
                                  <div className="mt-0.5 text-xs opacity-80">
                                    {t.updatedAt
                                      ? `Обновлён: ${new Date(t.updatedAt).toLocaleString(
                                          "ru-RU",
                                        )}`
                                      : `Создан: ${new Date(t.createdAt).toLocaleString(
                                          "ru-RU",
                                        )}`}
                                  </div>
                                </Combobox.Option>
                              ))
                            )}
                          </Combobox.Options>
                        </div>
                      </Combobox>
                    </label>

                    {loadConfirm ? (
                      <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
                        <div className="font-medium">
                          Как применить шаблон «{loadConfirm.templateName}»?
                        </div>
                        <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => applyTemplate("append", loadConfirm.templateId)}
                            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                          >
                            Добавить в конец списка
                          </button>
                          <button
                            type="button"
                            onClick={() => applyTemplate("replace", loadConfirm.templateId)}
                            className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500"
                          >
                            Заменить текущие элементы
                          </button>
                        </div>
                      </div>
                    ) : null}
                  </>
                )}

                <div className="mt-5 flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
                  <button
                    type="button"
                    onClick={() => setOpenLoadTemplate(false)}
                    className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
                  >
                    Закрыть
                  </button>
                  <button
                    type="button"
                    disabled={!selectedTemplate}
                    onClick={() => {
                      if (!selectedTemplate) return;
                      const tpl = selectedTemplate;
                      if (!tpl) return;
                      if (specDraft.length === 0) {
                        applyTemplate("append", tpl.id);
                        return;
                      }
                      setLoadConfirm({ templateId: tpl.id, templateName: tpl.name });
                    }}
                    className={[
                      "rounded-md px-4 py-2 text-sm font-medium shadow-sm",
                      selectedTemplate
                        ? "bg-emerald-600 text-white hover:bg-emerald-500"
                        : "cursor-not-allowed bg-slate-200 text-slate-500",
                    ].join(" ")}
                  >
                    Выбрать
                  </button>
                </div>
              </div>
            </div>
          ) : null}
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
