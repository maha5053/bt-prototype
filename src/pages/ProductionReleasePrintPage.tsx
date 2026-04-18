import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { ProductionProvider, useProduction } from "../context/ProductionContext";
import {
  getReleaseIssueConfirmSummary,
  getReleaseStageForPrint,
  isReleaseStageCompleted,
} from "../lib/productionReleaseAct";
import { PrototypeDisclaimer } from "../components/PrototypeDisclaimer";
import { usePrototypeDisclaimerBottomPad } from "../hooks/usePrototypeDisclaimerBottomPad";

export function ProductionReleasePrintPage() {
  return (
    <ProductionProvider>
      <ProductionReleasePrintContent />
    </ProductionProvider>
  );
}

function ProductionReleasePrintContent() {
  const { orderId } = useParams<{ orderId: string }>();
  const { getOrderById } = useProduction();
  const reserveDisclaimerPad = usePrototypeDisclaimerBottomPad();

  const order = orderId ? getOrderById(orderId) : null;
  const { stage: releaseStage, step: releaseStep } = order
    ? getReleaseStageForPrint(order)
    : { stage: undefined, step: undefined };

  const printable = Boolean(
    order &&
      order.status !== "rejected" &&
      isReleaseStageCompleted(order) &&
      releaseStep,
  );

  const summary =
    order && releaseStep
      ? getReleaseIssueConfirmSummary(order, releaseStep)
      : null;

  useEffect(() => {
    if (!printable || !summary) return;
    const timer = window.setTimeout(() => {
      window.print();
    }, 300);
    return () => window.clearTimeout(timer);
  }, [printable, summary]);

  const shellCls = reserveDisclaimerPad
    ? "flex min-h-screen flex-col bg-white pb-24"
    : "flex min-h-screen flex-col bg-white";

  if (!order || !printable || !summary || !releaseStage) {
    return (
      <div className={shellCls}>
        <div className="flex flex-1 items-center justify-center p-8 text-center text-slate-500">
          {!order
            ? "Заказ не найден."
            : order.status === "rejected"
              ? "Печать акта недоступна для забракованного заказа."
              : !isReleaseStageCompleted(order)
                ? "Печать акта доступна после завершения этапа «Выдача»."
                : "Документ не найден."}
        </div>
        <PrototypeDisclaimer />
      </div>
    );
  }

  const actNumber = order.id.replace(/^po-?/i, "");
  const actDateIso =
    releaseStage.completedAt ?? order.completedAt ?? order.createdAt;
  const actDate = formatRuDate(actDateIso);
  const issuedBy = releaseStage.completedBy ?? "—";

  return (
    <div className={shellCls}>
      <div className="print-container mx-auto max-w-3xl flex-1 bg-white p-8 font-serif text-sm leading-relaxed text-black">
        <div className="mb-6 text-center">
          <p className="text-base font-semibold">
            Акт выдачи готового продукта № {actNumber} от {actDate}
          </p>
          <p className="mt-2 text-xs text-slate-700">
            (прототип; данные из журнала заказа)
          </p>
        </div>

        <div className="mb-6 space-y-3">
          <p>
            Подразделение: Лаборатория разработки и изучения новых технологий
            лечения заболеваний
          </p>
          <p>
            Настоящий акт составлен о выдаче готовой лекарственной формы /
            продукта пациенту (в структурное подразделение) по заказу на
            производство.
          </p>
        </div>

        <table className="mb-6 w-full border-collapse border border-black text-left text-xs">
          <tbody>
            <tr>
              <th className="border border-black px-3 py-2 font-normal w-[32%]">
                Наименование продукта
              </th>
              <td className="border border-black px-3 py-2">{summary.productName}</td>
            </tr>
            <tr>
              <th className="border border-black px-3 py-2 font-normal">
                ID продукта
              </th>
              <td className="border border-black px-3 py-2">{summary.productId}</td>
            </tr>
            <tr>
              <th className="border border-black px-3 py-2 font-normal">
                ФИО пациента
              </th>
              <td className="border border-black px-3 py-2">{summary.patientName}</td>
            </tr>
            <tr>
              <th className="border border-black px-3 py-2 font-normal">№ ИБ</th>
              <td className="border border-black px-3 py-2">{summary.caseNumber}</td>
            </tr>
            <tr>
              <th className="border border-black px-3 py-2 font-normal">
                Выдано (подразделение)
              </th>
              <td className="border border-black px-3 py-2">{summary.destination}</td>
            </tr>
            <tr>
              <th className="border border-black px-3 py-2 font-normal align-top">
                Отклонения (сводка)
              </th>
              <td className="border border-black px-3 py-2 whitespace-pre-wrap">
                {summary.deviations}
              </td>
            </tr>
            <tr>
              <th className="border border-black px-3 py-2 font-normal">
                Технологический процесс выполнил
              </th>
              <td className="border border-black px-3 py-2">{summary.processBy}</td>
            </tr>
            <tr>
              <th className="border border-black px-3 py-2 font-normal">
                Технологический процесс одобрил
              </th>
              <td className="border border-black px-3 py-2">{summary.approvedBy}</td>
            </tr>
            <tr>
              <th className="border border-black px-3 py-2 font-normal">
                Этап «Выдача» завершил
              </th>
              <td className="border border-black px-3 py-2">{issuedBy}</td>
            </tr>
          </tbody>
        </table>

        <div className="mt-12 space-y-8">
          <div className="flex flex-wrap items-end gap-4">
            <span className="min-w-[220px] flex-1 border-b border-black">&nbsp;</span>
            <span className="text-slate-600">(подпись уполномоченного лица / ФИО)</span>
          </div>
          <div className="flex flex-wrap items-end gap-4">
            <span className="min-w-[220px] flex-1 border-b border-black">&nbsp;</span>
            <span className="text-slate-600">(подпись получателя / ФИО)</span>
          </div>
        </div>
      </div>
      <PrototypeDisclaimer />
    </div>
  );
}

function formatRuDate(iso: string): string {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}
