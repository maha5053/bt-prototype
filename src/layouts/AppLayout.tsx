import { useEffect, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { BioTrackLogo } from "../components/BioTrackLogo";
import { PrototypeDisclaimer } from "../components/PrototypeDisclaimer";
import { usePrototypeDisclaimerBottomPad } from "../hooks/usePrototypeDisclaimerBottomPad";
import { SpaRedirect } from "../components/SpaRedirect";
import {
  SIDEBAR_BY_SECTION,
  TOP_NAV,
  topSectionFromPath,
} from "../config/navigation";

const MOCK_USER = { name: "Анна Смирнова", initials: "АС" };

const navClassName = ({ isActive }: { isActive: boolean }) =>
  [
    "rounded-md px-2 py-1.5 text-xs font-medium transition-colors md:px-3 md:py-2 md:text-sm",
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

  const reserveDisclaimerPad = usePrototypeDisclaimerBottomPad();

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileSidebarOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [mobileSidebarOpen]);

  const closeMobileSidebar = () => setMobileSidebarOpen(false);

  const sidebarContent =
    sidebarItems.length > 0 ? (
      <nav className="flex flex-col gap-0.5">
        {sidebarItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end
            className={sidebarLinkClass}
            onClick={closeMobileSidebar}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    ) : (
      <p className="px-2 py-3 text-sm text-slate-500">
        Выберите раздел в боковом меню.
      </p>
    );

  const asideClassName = [
    "w-60 shrink-0 flex-col border-r border-slate-200 bg-slate-50 p-3",
    mobileSidebarOpen
      ? "flex fixed left-0 top-14 bottom-0 z-40 overflow-y-auto shadow-lg"
      : "hidden",
    "md:flex md:static md:inset-auto md:z-auto md:overflow-visible md:shadow-none",
  ].join(" ");

  return (
    <div className="flex min-h-screen max-md:h-[100dvh] max-md:max-h-[100dvh] flex-col overflow-hidden bg-slate-100 md:max-h-none md:overflow-visible">
      <header className="sticky top-0 z-50 flex h-14 shrink-0 items-center gap-2 border-b border-slate-200 bg-white px-3 shadow-sm md:gap-4 md:px-4">
        {sidebarItems.length > 0 ? (
          <button
            type="button"
            className="flex size-10 shrink-0 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 shadow-sm hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 md:hidden"
            aria-expanded={mobileSidebarOpen}
            aria-controls="app-sidebar"
            aria-label={
              mobileSidebarOpen
                ? "Закрыть меню подразделов"
                : "Открыть меню подразделов"
            }
            onClick={() => setMobileSidebarOpen((open) => !open)}
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
              {mobileSidebarOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="4" y1="6" x2="20" y2="6" />
                  <line x1="4" y1="12" x2="20" y2="12" />
                  <line x1="4" y1="18" x2="20" y2="18" />
                </>
              )}
            </svg>
          </button>
        ) : (
          <span className="size-10 shrink-0 md:hidden" aria-hidden />
        )}
        <BioTrackLogo
          className={sidebarItems.length > 0 ? "hidden md:flex" : ""}
        />
        <nav
          className="flex min-w-0 flex-1 flex-wrap items-center gap-0.5 md:gap-1"
          aria-label="Основное меню"
        >
          {TOP_NAV.map((item) => (
            <NavLink key={item.key} to={item.basePath} className={navClassName}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div
          className="flex shrink-0 items-center gap-2 border-l border-slate-200 pl-3 md:gap-3 md:pl-4"
          role="group"
          aria-label="Текущий пользователь"
        >
          <span className="hidden max-w-[9rem] truncate text-sm font-medium text-slate-800 md:inline md:max-w-[14rem]">
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

      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        {mobileSidebarOpen ? (
          <div
            className="fixed inset-0 z-30 bg-slate-900/40 md:hidden"
            aria-hidden
            onClick={closeMobileSidebar}
          />
        ) : null}

        <aside
          id="app-sidebar"
          className={asideClassName}
          aria-label="Подразделы"
        >
          {sidebarItems.length > 0 ? (
            <div className="mb-3 border-b border-slate-200 pb-3 md:hidden">
              <BioTrackLogo
                wordmark="always"
                onClick={closeMobileSidebar}
                className="w-full min-w-0"
              />
            </div>
          ) : null}
          {sidebarContent}
        </aside>

        <main
          className={
            reserveDisclaimerPad
              ? "min-h-0 flex-1 overflow-auto bg-white pb-24"
              : "min-h-0 flex-1 overflow-auto bg-white"
          }
        >
          <SpaRedirect />
          <Outlet />
        </main>
      </div>

      <PrototypeDisclaimer />
    </div>
  );
}
