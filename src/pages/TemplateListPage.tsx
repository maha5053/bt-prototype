import { ProductionProvider, useProduction } from "../context/ProductionContext";

export function TemplateListPage() {
  return (
    <ProductionProvider>
      <TemplateListContent />
    </ProductionProvider>
  );
}

function TemplateListContent() {
  const { templates } = useProduction();

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-800">Шаблоны</h1>
        <p className="mt-1 text-sm text-slate-500">
          Список шаблонов процессов (read-only, каркас).
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-4 text-sm text-slate-600 shadow-sm">
        Доступно шаблонов (mock):{" "}
        <span className="font-medium tabular-nums text-slate-800">
          {templates.length}
        </span>
      </div>
    </div>
  );
}

