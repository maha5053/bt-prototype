import {
  createBrowserRouter,
  Navigate,
  RouterProvider,
} from "react-router-dom";
import { AppLayout } from "./layouts/AppLayout";
import { NomenklaturaDetailPage } from "./pages/NomenklaturaDetailPage";
import { BalancePage } from "./pages/BalancePage";
import {
  PeremeshcheniyaCreatePage,
  PeremeshcheniyaDetailPage,
  PeremeshcheniyaListPage,
  TransfersLayout,
} from "./pages/Peremeshcheniya";
import { SectionPage } from "./pages/SectionPage";

const router = createBrowserRouter([
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
            element: <SectionPage title="Номенклатура" />,
          },
          {
            path: "postupleniya",
            element: <SectionPage title="Поступления" />,
          },
          { path: "balance", element: <BalancePage /> },
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
]);

export default function App() {
  return <RouterProvider router={router} />;
}
