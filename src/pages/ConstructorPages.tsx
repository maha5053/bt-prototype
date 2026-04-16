import { Link, useParams } from "react-router-dom";
import { ProductionProvider, useProduction } from "../context/ProductionContext";

export function ConstructorListPage() {
  return (
    <ProductionProvider>
      <ConstructorListContent />
    </ProductionProvider>
  );
}

function ConstructorListContent() {
  const { templates } = useProduction();

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-800">
          Конструктор процессов
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Список шаблонов (каркас).
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
        Шаблонов (mock):{" "}
        <span className="font-medium tabular-nums text-slate-800">
          {templates.length}
        </span>
      </div>

      <div className="mt-4">
        <Link
          to="/admin/konstruktor/novyy"
          className="inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          Создать шаблон
        </Link>
      </div>
    </div>
  );
}

export function ConstructorEditorPage() {
  return (
    <ProductionProvider>
      <ConstructorEditorContent />
    </ProductionProvider>
  );
}

function ConstructorEditorContent() {
  const { templateId } = useParams<{ templateId: string }>();
  const isNew = !templateId;

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/konstruktor"
            className="text-sm text-slate-500 transition hover:text-slate-700"
            title="К списку шаблонов"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </Link>
          <h1 className="text-xl font-semibold text-slate-800">
            {isNew ? "Новый шаблон" : `Шаблон ${templateId}`}
          </h1>
        </div>
        <p className="mt-1 text-sm text-slate-500">
          Редактор шаблона (каркас).
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
        Тут будет редактор этапов/шагов/полей.
      </div>
    </div>
  );
}

