import {
  createBrowserRouter,
  Navigate,
  redirect,
  RouterProvider,
} from "react-router-dom";
import { AppLayout } from "./layouts/AppLayout";
import { NomenklaturaDetailPage } from "./pages/NomenklaturaDetailPage";
import { NomenklaturaPage } from "./pages/NomenklaturaPage";
import { BalancePage } from "./pages/BalancePage";
import {
  PeremeshcheniyaCreatePage,
  PeremeshcheniyaDetailPage,
  PeremeshcheniyaListPage,
  TransfersLayout,
} from "./pages/Peremeshcheniya";
import { SectionPage } from "./pages/SectionPage";
import { KarantinPage } from "./pages/KarantinPage";
import {
  InventoryListPage,
  InventorySessionPage,
} from "./pages/InventoryPages";

/** Root loader: intercept SPA redirect from GitHub Pages 404.html
 *  before any route renders, preventing race with index <Navigate>. */
function rootLoader() {
  const redirectUrl = localStorage.getItem("spa-redirect");
  if (redirectUrl) {
    localStorage.removeItem("spa-redirect");
    // The router uses basename="/bt-prototype/", so we must strip it
    // from the path before redirecting to avoid double-prefixing.
    const origin = window.location.origin;
    const path = redirectUrl.replace(origin, "").replace("/bt-prototype", "");
    throw redirect(path || "/");
  }
  return null;
}

const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <AppLayout />,
      loader: rootLoader,
      children: [
        { index: true, element: <Navigate to="/sklad/nomenklatura" replace /> },
        {
          path: "sklad",
          children: [
            { index: true, element: <Navigate to="nomenklatura" replace /> },
            {
              path: "nomenklatura/:nomenclatureId",
              element: <NomenklaturaDetailPage />,
            },
            {
              path: "nomenklatura",
              element: <NomenklaturaPage />,
            },
            {
              path: "postupleniya",
              element: <SectionPage title="Поступления" />,
            },
            { path: "balance", element: <BalancePage /> },
            {
              path: "karantin",
              element: <KarantinPage />,
            },
            {
              path: "inventarizatsiya",
              element: <InventoryListPage />,
            },
            {
              path: "inventarizatsiya/:sessionId",
              element: <InventorySessionPage />,
            },
            {
              path: "peremeshcheniya",
              element: <TransfersLayout />,
              children: [
                { index: true, element: <PeremeshcheniyaListPage /> },
                { path: "novoe", element: <PeremeshcheniyaCreatePage /> },
                { path: ":transferId", element: <PeremeshcheniyaDetailPage /> },
              ],
            },
          ],
        },
        {
          path: "spravochniki",
          children: [
            {
              index: true,
              element: <Navigate to="raskhodniki-i-materialy" replace />,
            },
            {
              path: "raskhodniki-i-materialy",
              element: <SectionPage title="Расходники и материалы" />,
            },
            {
              path: "oborudovaniya",
              element: <SectionPage title="Оборудования" />,
            },
            {
              path: "pomeshcheniya",
              element: <SectionPage title="Помещения" />,
            },
          ],
        },
        {
          path: "admin",
          children: [
            { index: true, element: <Navigate to="polzovateli" replace /> },
            {
              path: "polzovateli",
              element: <SectionPage title="Пользователи" />,
            },
          ],
        },
      ],
    },
  ],
  { basename: import.meta.env.BASE_URL },
);

export default function App() {
  return <RouterProvider router={router} />;
}
