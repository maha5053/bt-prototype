import {
  createBrowserRouter,
  Navigate,
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
import { WriteOffListPage, WriteOffSessionPage } from "./pages/WriteOffPages";
import { WriteOffPrintPage } from "./pages/WriteOffPrintPage";
import {
  ProductionListPage,
  ProductionOrderPage,
} from "./pages/ProductionPages";
import {
  ConstructorEditorPage,
  ConstructorListPage,
} from "./pages/ConstructorPages";
import { TemplateListPage } from "./pages/TemplateListPage";

const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <AppLayout />,
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
              path: "spisaniya",
              element: <WriteOffListPage />,
            },
            {
              path: "spisaniya/:sessionId",
              element: <WriteOffSessionPage />,
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
            { path: "konstruktor", element: <ConstructorListPage /> },
            { path: "konstruktor/novyy", element: <ConstructorEditorPage /> },
            {
              path: "konstruktor/:templateId",
              element: <ConstructorEditorPage />,
            },
          ],
        },
        {
          path: "proizvodstvo",
          children: [
            { index: true, element: <ProductionListPage /> },
            { path: "shablony", element: <TemplateListPage /> },
            { path: ":orderId", element: <ProductionOrderPage /> },
          ],
        },
      ],
    },
    {
      path: "sklad/spisaniya/:sessionId/print",
      element: <WriteOffPrintPage />,
    },
  ],
  { basename: import.meta.env.BASE_URL },
);

export default function App() {
  return <RouterProvider router={router} />;
}
