type SectionPageProps = {
  title: string;
};

const UNDER_CONSTRUCTION = new Set([
  "Пользователи",
  "Расходники и материалы",
  "Помещения",
  "Оборудования",
]);

export function SectionPage({ title }: SectionPageProps) {
  return (
    <div className="p-8">
      <p className="text-2xl font-semibold tracking-tight text-slate-900">
        {title}
      </p>
      {UNDER_CONSTRUCTION.has(title) && (
        <p className="mt-3 text-sm text-slate-500">В разработке</p>
      )}
    </div>
  );
}
