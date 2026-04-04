import { NavLink, Outlet, useLocation } from "react-router-dom";
import { BioTrackLogo } from "../components/BioTrackLogo";
import {
  SIDEBAR_BY_SECTION,
  TOP_NAV,
  topSectionFromPath,
} from "../config/navigation";

const MOCK_USER = { name: "Анна Смирнова", initials: "АС" };

const navClassName = ({ isActive }: { isActive: boolean }) =>
  [
    "rounded-md px-3 py-2 text-sm font-medium transition-colors",
    isActive
      ? "bg-slate-800 text-white"
      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
  ].join(" ");

const sidebarLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    "block rounded-md px-3 py-2 text-sm transition-colors",
    isActive
      ? "bg-white font-medium text-slate-900 shadow-sm ring-1 ring-slate-200"
      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
  ].join(" ");

export function AppLayout() {
  const { pathname } = useLocation();
  const section = topSectionFromPath(pathname);
  const sidebarItems = section ? SIDEBAR_BY_SECTION[section] : [];

  return (
    <div className="flex min-h-screen flex-col bg-slate-100">
      <header className="flex h-14 shrink-0 items-center gap-4 border-b border-slate-200 bg-white px-4 shadow-sm">
        <BioTrackLogo />
        <nav
          className="flex min-w-0 flex-1 flex-wrap items-center gap-1"
          aria-label="Основное меню"
        >
          {TOP_NAV.map((item) => (
            <NavLink key={item.key} to={item.basePath} className={navClassName}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div
          className="flex shrink-0 items-center gap-3 border-l border-slate-200 pl-4"
          role="group"
          aria-label="Текущий пользователь"
        >
          <span className="hidden max-w-[9rem] truncate text-sm font-medium text-slate-800 sm:inline md:max-w-[14rem]">
            {MOCK_USER.name}
          </span>
          <span
            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 text-xs font-semibold text-white shadow ring-2 ring-white"
            aria-hidden
          >
            {MOCK_USER.initials}
          </span>
          <button
            type="button"
            aria-label="Выйти"
            title="Выйти"
            className="flex size-9 shrink-0 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-600 shadow-sm hover:bg-slate-50 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
            onClick={() => {
              window.alert("Выход (макет)");
            }}
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
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside
          className="w-60 shrink-0 border-r border-slate-200 bg-slate-50 p-3"
          aria-label="Подразделы"
        >
          {sidebarItems.length > 0 ? (
            <nav className="flex flex-col gap-0.5">
              {sidebarItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end
                  className={sidebarLinkClass}
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>
          ) : (
            <p className="px-2 py-3 text-sm text-slate-500">
              Выберите раздел в боковом меню.
            </p>
          )}
        </aside>

        <main className="flex-1 overflow-auto bg-white">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
