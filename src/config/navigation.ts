export type TopSectionKey = "sklad" | "proizvodstvo" | "spravochniki" | "admin";

export const TOP_NAV: {
  key: TopSectionKey;
  label: string;
  basePath: string;
}[] = [
  { key: "sklad", label: "Склад", basePath: "/sklad" },
  { key: "proizvodstvo", label: "Заказы", basePath: "/proizvodstvo" },
  { key: "spravochniki", label: "Справочники", basePath: "/spravochniki" },
  { key: "admin", label: "Администрирование", basePath: "/admin" },
];

export const SIDEBAR_BY_SECTION: Record<
  TopSectionKey,
  { path: string; label: string }[]
> = {
  sklad: [
    { path: "/sklad/balance", label: "Остатки" },
    { path: "/sklad/postupleniya", label: "Поступления" },
    { path: "/sklad/peremeshcheniya", label: "Перемещения" },
    { path: "/sklad/karantin", label: "Карантин" },
    { path: "/sklad/inventarizatsiya", label: "Инвентаризация" },
    { path: "/sklad/spisaniya", label: "Списания" },
    { path: "/sklad/nomenklatura", label: "Номенклатура" },
  ],
  proizvodstvo: [
    { path: "/proizvodstvo", label: "Журнал" },
  ],
  spravochniki: [
    {
      path: "/spravochniki/raskhodniki-i-materialy",
      label: "Расходники и материалы",
    },
    { path: "/spravochniki/oborudovaniya", label: "Оборудования" },
    { path: "/spravochniki/pomeshcheniya", label: "Помещения" },
  ],
  admin: [
    { path: "/admin/polzovateli", label: "Пользователи" },
    { path: "/admin/konstruktor-ver2", label: "Конструктор ver2" },
  ],
};

export function topSectionFromPath(pathname: string): TopSectionKey | null {
  if (pathname.startsWith("/sklad")) return "sklad";
  if (pathname.startsWith("/proizvodstvo")) return "proizvodstvo";
  if (pathname.startsWith("/spravochniki")) return "spravochniki";
  if (pathname.startsWith("/admin")) return "admin";
  return null;
}
