import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { BioTrackLogo } from "../components/BioTrackLogo";
import { PrototypeDisclaimer } from "../components/PrototypeDisclaimer";
import { usePrototypeDisclaimerBottomPad } from "../hooks/usePrototypeDisclaimerBottomPad";
import { SpaRedirect } from "../components/SpaRedirect";
import {
  SIDEBAR_BY_SECTION,
  TOP_NAV,
  type TopSectionKey,
  topSectionFromPath,
} from "../config/navigation";
import { useCurrentUser } from "../context/CurrentUserContext";
import {
  MOCK_USERS,
  formatProductionAccessSummary,
  getPermissionsForUser,
} from "../mocks/usersMock";
import { appHeaderClasses } from "./appLayoutHeaderStyles";

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

function initialMobileOpenSections(
  pathname: string,
): Record<TopSectionKey, boolean> {
  const active = topSectionFromPath(pathname);
  return {
    sklad: active === "sklad",
    proizvodstvo: active === "proizvodstvo",
    spravochniki: active === "spravochniki",
    admin: active === "admin",
  };
}

export function AppLayout() {
  const { pathname } = useLocation();
  const { currentUser, currentUserId, setCurrentUserId, permissionOverrides } =
    useCurrentUser();
  const section = topSectionFromPath(pathname);
  const sidebarItems = section ? SIDEBAR_BY_SECTION[section] : [];

  const reserveDisclaimerPad = usePrototypeDisclaimerBottomPad();

  const isSidebarItemActive = (itemPath: string) =>
    pathname === itemPath ||
    (pathname.startsWith(itemPath) &&
      pathname.charAt(itemPath.length) === "/");

  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [userPickerOpen, setUserPickerOpen] = useState(false);
  const [mobileOpenSections, setMobileOpenSections] = useState<
    Record<TopSectionKey, boolean>
  >(() => initialMobileOpenSections(pathname));
  const userPickerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname]);

  useEffect(() => {
    const s = topSectionFromPath(pathname);
    if (!s) return;
    setMobileOpenSections((prev) => ({ ...prev, [s]: true }));
  }, [pathname]);

  useEffect(() => {
    if (!mobileSidebarOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [mobileSidebarOpen]);

  useEffect(() => {
    if (!userPickerOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!userPickerRef.current) return;
      const target = event.target as Node;
      if (!userPickerRef.current.contains(target)) {
        setUserPickerOpen(false);
      }
    };
    const onEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setUserPickerOpen(false);
    };
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onEscape);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onEscape);
    };
  }, [userPickerOpen]);

  const closeMobileSidebar = () => setMobileSidebarOpen(false);

  const sidebarContent =
    sidebarItems.length > 0 ? (
      <nav className="flex flex-col gap-0.5">
        {sidebarItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={sidebarLinkClass({ isActive: isSidebarItemActive(item.path) })}
            onClick={closeMobileSidebar}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
    ) : (
      <p className="px-2 py-3 text-sm text-slate-500">
        Выберите раздел в верхнем меню.
      </p>
    );

  const mobileNavTree = (
    <nav className="flex flex-col gap-2" aria-label="Разделы приложения">
      {TOP_NAV.map((top) => {
        const open = mobileOpenSections[top.key];
        const children = SIDEBAR_BY_SECTION[top.key];
        return (
          <div
            key={top.key}
            className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm"
          >
            <button
              type="button"
              className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
              aria-expanded={open}
              onClick={() =>
                setMobileOpenSections((p) => ({ ...p, [top.key]: !p[top.key] }))
              }
            >
              {top.label}
              <svg
                className={[
                  "size-4 shrink-0 text-slate-500 transition-transform",
                  open ? "rotate-180" : "",
                ].join(" ")}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
            {open ? (
              <div className="flex flex-col gap-0.5 border-t border-slate-100 px-2 py-2">
                {children.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={sidebarLinkClass({
                      isActive: isSidebarItemActive(item.path),
                    })}
                    onClick={closeMobileSidebar}
                  >
                    {item.label}
                  </NavLink>
                ))}
              </div>
            ) : null}
          </div>
        );
      })}
    </nav>
  );

  const asideClassName = [
    "w-72 shrink-0 flex-col border-r border-slate-200 bg-slate-50 p-3 md:w-60",
    mobileSidebarOpen
      ? "flex fixed left-0 top-14 bottom-0 z-40 overflow-y-auto shadow-lg"
      : "hidden",
    "md:flex md:static md:inset-auto md:z-auto md:overflow-visible md:shadow-none",
  ].join(" ");

  return (
    <div className="flex min-h-screen max-md:h-[100dvh] max-md:max-h-[100dvh] flex-col overflow-hidden bg-slate-100 md:max-h-none md:overflow-visible">
      <header className={appHeaderClasses.root}>
        <div className={appHeaderClasses.leftBlock}>
          <button
            type="button"
            className={appHeaderClasses.burgerButton}
            aria-expanded={mobileSidebarOpen}
            aria-controls="app-sidebar"
            aria-label={
              mobileSidebarOpen
                ? "Закрыть меню навигации"
                : "Открыть меню навигации"
            }
            onClick={() => setMobileSidebarOpen((open) => !open)}
          >
            <svg
              className={appHeaderClasses.burgerIcon}
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
          <BioTrackLogo className="hidden min-w-0 shrink-0 md:flex" />
          <nav className={appHeaderClasses.topNav} aria-label="Основное меню">
            {TOP_NAV.map((item) => (
              <NavLink key={item.key} to={item.basePath} className={navClassName}>
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div
          className={appHeaderClasses.rightBlock}
          role="group"
          aria-label="Текущий пользователь"
        >
          <div ref={userPickerRef} className={appHeaderClasses.userPickerWrap}>
            {userPickerOpen ? (
              <div className={appHeaderClasses.userPickerMenu}>
                <p className="mb-1.5 text-xs font-semibold text-slate-600">
                  Выберите пользователя
                </p>
                <label className="block min-w-0">
                  <span className="sr-only">Сменить пользователя</span>
                  <select
                    value={currentUserId}
                    onChange={(e) => setCurrentUserId(e.target.value)}
                    className={appHeaderClasses.userSelect}
                  >
                    {MOCK_USERS.map((u) => {
                      const access = formatProductionAccessSummary(
                        getPermissionsForUser(u.id, permissionOverrides),
                      );
                      const label = `${u.displayName} (${access})`;
                      return (
                        <option key={u.id} value={u.id} title={label}>
                          {label}
                        </option>
                      );
                    })}
                  </select>
                </label>
              </div>
            ) : null}
            <button
              type="button"
              className={appHeaderClasses.initialsButton}
              aria-label="Выбрать пользователя"
              aria-expanded={userPickerOpen}
              onClick={() => setUserPickerOpen((open) => !open)}
            >
              {currentUser.initials}
            </button>
          </div>
          <button
            type="button"
            aria-label="Выйти"
            title="Выйти"
            className={appHeaderClasses.logoutButton}
            onClick={() => {
              window.alert("Выход (макет)");
            }}
          >
            <svg
              className={appHeaderClasses.logoutIcon}
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
          aria-label="Навигация по разделам"
        >
          <div className="mb-3 border-b border-slate-200 pb-3 md:hidden">
            <BioTrackLogo
              wordmark="always"
              onClick={closeMobileSidebar}
              className="w-full min-w-0"
            />
          </div>
          <div className="md:hidden">{mobileNavTree}</div>
          <div className="hidden md:block">{sidebarContent}</div>
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
