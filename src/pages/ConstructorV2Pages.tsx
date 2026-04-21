import { Link, useNavigate } from "react-router-dom";
import { ProductionProvider, useProduction } from "../context/ProductionContext";
import { ConstructorEditorView } from "./ConstructorPages";

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
        headerTitle="Конструктор ver2"
        basePath="/admin/konstruktor-ver2"
        stageTypeOrder={["production", "quality_control"]}
        stageTypeLabel={{
          production: "Настройки производства",
          quality_control: "Настройки контроля качества",
        }}
        allowGroupsByStageType={{ production: false }}
      />
    </ProductionProvider>
  );
}

function ConstructorV2ListContent() {
  const { templates, deleteTemplate, archiveTemplate, orders } = useProduction();
  const navigate = useNavigate();
  const visibleTemplates = templates.filter((t) => !t.id.startsWith("tpl-runtime-v2-"));

  return (
    <div className="relative p-6 md:p-8">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">
            Конструктор ver2
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
              <th className="px-4 py-3 font-medium">Название</th>
              <th className="px-4 py-3 font-medium">Этапов</th>
              <th className="px-4 py-3 font-medium">Связанных заказов</th>
              <th className="px-4 py-3 font-medium text-right">Действия</th>
            </tr>
          </thead>
          <tbody>
            {visibleTemplates.map((tpl) => {
              const used = orders.filter((o) => o.templateId === tpl.id).length;
              const isArchived = Boolean(tpl.archivedAt);
              const isBaseline = tpl.id === "tpl-thrombogel";
              const locked = isBaseline || isArchived || used > 0;
              return (
                <tr key={tpl.id} className="border-t border-slate-100">
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
                  <td className="px-4 py-3 text-slate-600">{tpl.stages.length}</td>
                  <td className="px-4 py-3 text-slate-600">{used}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      {locked ? (
                        <span
                          className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-400"
                          title={
                            isBaseline
                              ? "Эталонный шаблон: редактирование запрещено"
                              : isArchived
                              ? "Шаблон в архиве: редактирование запрещено"
                              : "Шаблон используется в заказах: редактирование запрещено"
                          }
                        >
                          Редактировать
                        </span>
                      ) : (
                        <Link
                          to={`/admin/konstruktor-ver2/${tpl.id}`}
                          className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Редактировать
                        </Link>
                      )}

                      {!isArchived && !isBaseline ? (
                        <button
                          type="button"
                          className="rounded-md border border-amber-300 px-3 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-50"
                          onClick={() => {
                            if (
                              !window.confirm(
                                "Убрать шаблон в архив? Он станет недоступен для старта производства и будет только для просмотра.",
                              )
                            )
                              return;
                            archiveTemplate(tpl.id);
                          }}
                          title="Убрать в архив"
                        >
                          В архив
                        </button>
                      ) : null}

                      <button
                        type="button"
                        disabled={isBaseline || used > 0 || isArchived}
                        className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={() => {
                          if (!window.confirm("Удалить шаблон?")) return;
                          deleteTemplate(tpl.id);
                        }}
                        title={
                          isBaseline
                            ? "Нельзя удалить эталонный шаблон"
                            : used > 0
                            ? "Нельзя удалить шаблон, связанный с заказами"
                            : isArchived
                              ? "Нельзя удалить шаблон из архива"
                              : "Удалить шаблон"
                        }
                      >
                        Удалить
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

