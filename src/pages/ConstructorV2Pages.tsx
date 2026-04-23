import { Link, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { ProductionProvider, useProduction } from "../context/ProductionContext";
import type { StageTemplate } from "../mocks/productionData";
import { ConstructorEditorView } from "./ConstructorPages";
import { ProductionTemplatesDevTools } from "../components/ProductionTemplatesDevTools";

/** Стабильные ссылки — иначе у `ConstructorEditorView` каждый рендер новые пропсы и эффекты срабатывают постоянно. */
const CONSTRUCTOR_V2_STAGE_ORDER: StageTemplate["type"][] = [
  "production",
  "quality_control",
];

const CONSTRUCTOR_V2_STAGE_LABEL: Partial<
  Record<StageTemplate["type"], string>
> = {
  production: "Настройки производства",
  quality_control: "Настройки контроля качества",
};

const CONSTRUCTOR_V2_ALLOW_GROUPS: Partial<
  Record<StageTemplate["type"], boolean>
> = {
  production: false,
  quality_control: false,
};

const CONSTRUCTOR_V2_ALLOW_STEPS: Partial<
  Record<StageTemplate["type"], boolean>
> = {
  quality_control: false,
};

export function ConstructorV2ListPage() {
  return (
    <ProductionProvider>
      <ConstructorV2ListContent />
    </ProductionProvider>
  );
}

export function ConstructorV2EditorPage() {
  return (
    <ProductionProvider>
      <ConstructorEditorView
        headerTitle="Продукты"
        basePath="/admin/konstruktor-ver2"
        stageTypeOrder={CONSTRUCTOR_V2_STAGE_ORDER}
        stageTypeLabel={CONSTRUCTOR_V2_STAGE_LABEL}
        allowGroupsByStageType={CONSTRUCTOR_V2_ALLOW_GROUPS}
        allowStepsByStageType={CONSTRUCTOR_V2_ALLOW_STEPS}
      />
    </ProductionProvider>
  );
}

export function ConstructorV2ViewerPage() {
  return (
    <ProductionProvider>
      <ConstructorEditorView
        headerTitle="Продукты · Просмотр"
        basePath="/admin/konstruktor-ver2"
        stageTypeOrder={CONSTRUCTOR_V2_STAGE_ORDER}
        stageTypeLabel={CONSTRUCTOR_V2_STAGE_LABEL}
        allowGroupsByStageType={CONSTRUCTOR_V2_ALLOW_GROUPS}
        allowStepsByStageType={CONSTRUCTOR_V2_ALLOW_STEPS}
        readOnly
      />
    </ProductionProvider>
  );
}

function ConstructorV2ListContent() {
  const { templates, deleteTemplate, archiveTemplate, orders } = useProduction();
  const navigate = useNavigate();
  const visibleTemplates = templates.filter((t) => !t.id.startsWith("tpl-runtime-v2-"));

  // Row actions menu (kebab)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ left: number; top: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

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

  return (
    <div className="relative p-6 md:p-8">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">
            Продукты
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Управление шаблонами производственных процессов.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            navigate("/admin/konstruktor-ver2/novyy");
          }}
          className="inline-flex shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          Создать шаблон
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="w-10 px-2 py-3 font-medium" aria-label="Действия" />
              <th className="px-4 py-3 font-medium">ID</th>
              <th className="px-4 py-3 font-medium">Название</th>
              <th className="px-4 py-3 font-medium">Связанных заказов</th>
            </tr>
          </thead>
          <tbody>
            {visibleTemplates.map((tpl) => {
              const used = orders.filter((o) => o.templateId === tpl.id).length;
              const isArchived = Boolean(tpl.archivedAt);
              const isBaseline = tpl.id === "tpl-thrombogel";
              const locked = isBaseline || isArchived || used > 0;
              const archiveEnabled = !isArchived && !isBaseline;
              const deleteEnabled = !isBaseline && used === 0 && !isArchived;
              return (
                <tr key={tpl.id} className="border-t border-slate-100">
                  <td className="w-10 px-2 py-3 align-middle">
                    <button
                      type="button"
                      ref={(el) => {
                        buttonRefs.current[tpl.id] = el;
                      }}
                      onClick={(ev) => {
                        ev.stopPropagation();
                        if (openMenuId === tpl.id) {
                          setOpenMenuId(null);
                          setMenuPosition(null);
                        } else {
                          handleMenuOpen(tpl.id, ev.currentTarget);
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

                    {openMenuId === tpl.id && menuPosition ? (
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
                          to={`/admin/konstruktor-ver2/${tpl.id}/prosmotr`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                          title="Открыть шаблон в режиме просмотра"
                          onClick={() => {
                            setOpenMenuId(null);
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
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8S1 12 1 12Z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                          Просмотреть
                        </Link>

                        <Link
                          to={locked ? "#" : `/admin/konstruktor-ver2/${tpl.id}`}
                          onClick={(e) => {
                            if (locked) {
                              e.preventDefault();
                              return;
                            }
                            setOpenMenuId(null);
                            setMenuPosition(null);
                          }}
                          className={[
                            "flex w-full items-center gap-2 px-3 py-2 text-sm",
                            locked
                              ? "cursor-not-allowed text-slate-300"
                              : "text-slate-700 hover:bg-slate-50",
                          ].join(" ")}
                          title={
                            locked
                              ? isBaseline
                                ? "Эталонный шаблон: редактирование запрещено"
                                : isArchived
                                  ? "Шаблон в архиве: редактирование запрещено"
                                  : "Шаблон используется в заказах: редактирование запрещено"
                              : "Редактировать"
                          }
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

                        {archiveEnabled ? (
                          <button
                            type="button"
                            onClick={() => {
                              if (
                                !window.confirm(
                                  "Убрать шаблон в архив? Он станет недоступен для старта производства и будет только для просмотра.",
                                )
                              )
                                return;
                              archiveTemplate(tpl.id);
                              setOpenMenuId(null);
                              setMenuPosition(null);
                            }}
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-amber-800 hover:bg-amber-50"
                            title="Убрать в архив"
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
                              <rect x="3" y="3" width="18" height="7" rx="2" />
                              <path d="M7 10v10a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V10" />
                              <path d="M10 14h4" />
                            </svg>
                            В архив
                          </button>
                        ) : null}

                        <button
                          type="button"
                          disabled={!deleteEnabled}
                          onClick={() => {
                            if (!deleteEnabled) return;
                            if (!window.confirm("Удалить шаблон?")) return;
                            deleteTemplate(tpl.id);
                            setOpenMenuId(null);
                            setMenuPosition(null);
                          }}
                          className={[
                            "flex w-full items-center gap-2 px-3 py-2 text-sm",
                            deleteEnabled
                              ? "text-red-700 hover:bg-red-50"
                              : "cursor-not-allowed text-slate-300",
                          ].join(" ")}
                          title={
                            deleteEnabled
                              ? "Удалить шаблон"
                              : isBaseline
                                ? "Нельзя удалить эталонный шаблон"
                                : used > 0
                                  ? "Нельзя удалить шаблон, связанный с заказами"
                                  : isArchived
                                    ? "Нельзя удалить шаблон из архива"
                                    : "Удалить шаблон"
                          }
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
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                          Удалить
                        </button>
                      </div>
                    ) : null}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">
                    {tpl.id}
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-800">
                    <div className="flex items-center gap-2">
                      <span>{tpl.name}</span>
                      {isBaseline ? (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                          Эталон
                        </span>
                      ) : isArchived ? (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                          В архиве
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{used}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ProductionTemplatesDevTools />
    </div>
  );
}

