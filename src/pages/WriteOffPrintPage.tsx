import { useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { WriteOffProvider, useWriteOff } from "../context/WriteOffContext";
import {
  getReasonLabel,
  MOCK_CATALOG,
  WRITE_OFF_ACTIONS,
} from "../mocks/writeOffData";
import { PrototypeDisclaimer } from "../components/PrototypeDisclaimer";
import { usePrototypeDisclaimerBottomPad } from "../hooks/usePrototypeDisclaimerBottomPad";

export function WriteOffPrintPage() {
  return (
    <WriteOffProvider>
      <WriteOffPrintContent />
    </WriteOffProvider>
  );
}

function WriteOffPrintContent() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { sessions } = useWriteOff();
  const reserveDisclaimerPad = usePrototypeDisclaimerBottomPad();

  const session = sessions.find((s) => s.id === sessionId) ?? null;

  const getExpiryDate = useCallback(
    (nomenclatureId: string, lotCode: string): string | null => {
      const item = MOCK_CATALOG.find((c) => c.id === nomenclatureId);
      if (!item) return null;
      const lot = item.lots.find((l) => l.code === lotCode);
      return lot?.expiryDate ?? null;
    },
    [],
  );

  useEffect(() => {
    // Auto-trigger print when component mounts
    const timer = setTimeout(() => {
      window.print();
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  if (!session) {
    return (
      <div
        className={
          reserveDisclaimerPad
            ? "flex min-h-screen flex-col bg-white pb-24"
            : "flex min-h-screen flex-col bg-white"
        }
      >
        <div className="flex flex-1 items-center justify-center p-8 text-center text-slate-500">
          Документ не найден.
        </div>
        <PrototypeDisclaimer />
      </div>
    );
  }

  const sessionNumber = session.id.replace("wo-", "");
  const sessionDate = formatRuDate(session.createdAt);

  return (
    <div
      className={
        reserveDisclaimerPad
          ? "flex min-h-screen flex-col bg-white pb-24"
          : "flex min-h-screen flex-col bg-white"
      }
    >
      <div className="print-container mx-auto max-w-4xl flex-1 bg-white p-8 font-serif text-sm leading-relaxed text-black">
      {/* Header */}
      <div className="mb-6 text-center">
        <p className="text-base font-semibold">
          Акт №{sessionNumber} от {sessionDate}
        </p>
        <p className="mt-2 font-semibold">о списании брака</p>
      </div>

      {/* Commission info */}
      <div className="mb-6 space-y-2">
        <p>
          Подразделение: Лаборатория разработки и изучения новых технологий
          лечения заболеваний
        </p>
        <p>Комиссия в составе:</p>
        <p>
          руководитель производственной площадки (Зав. Лабораторией){" "}
          <span className="inline-block min-w-[200px] border-b border-black">
            {session.commission.headOfProduction || "\u00A0"}
          </span>{" "}
          .
        </p>
        <p>
          Руководитель ОКК{" "}
          <span className="inline-block min-w-[200px] border-b border-black">
            {session.commission.headOfQuality || "\u00A0"}
          </span>
        </p>
        <p>
          Сотрудник ОКК{" "}
          <span className="inline-block min-w-[200px] border-b border-black">
            {session.commission.qualityEmployee || "\u00A0"}
          </span>{" "}
          .
        </p>
        <p>
          Уполномоченное лицо{" "}
          <span className="inline-block min-w-[200px] border-b border-black">
            {session.commission.authorizedPerson || "\u00A0"}
          </span>{" "}
          .
        </p>
      </div>

      {/* Table header */}
      <p className="mb-2">
        Составила настоящий акт о списании и уничтожении забракованного
        расходного материала/реагента
      </p>

      <table className="mb-4 w-full border-collapse border border-black text-xs">
        <thead>
          <tr>
            <th className="border border-black px-2 py-1.5 text-left font-normal">
              №
            </th>
            <th className="border border-black px-2 py-1.5 text-left font-normal">
              Наименование
            </th>
            <th className="border border-black px-2 py-1.5 text-left font-normal">
              Наименование производителя
            </th>
            <th className="border border-black px-2 py-1.5 text-left font-normal">
              Кат. номер (REF)
            </th>
            <th className="border border-black px-2 py-1.5 text-left font-normal">
              Серия (LOT)
            </th>
            <th className="border border-black px-2 py-1.5 text-left font-normal">
              Срок годности
            </th>
            <th className="border border-black px-2 py-1.5 text-left font-normal">
              Объём поставки
            </th>
            <th className="border border-black px-2 py-1.5 text-left font-normal">
              Единица измерения
            </th>
            <th className="border border-black px-2 py-1.5 text-left font-normal">
              СПЦ №
            </th>
            <th className="border border-black px-2 py-1.5 text-left font-normal">
              Место хранение
            </th>
          </tr>
        </thead>
        <tbody>
          {session.lines.map((line, index) => (
            <tr key={index}>
              <td className="border border-black px-2 py-1.5">{index + 1}</td>
              <td className="border border-black px-2 py-1.5">
                {line.nomenclatureName}
              </td>
              <td className="border border-black px-2 py-1.5">
                {line.manufacturer}
              </td>
              <td className="border border-black px-2 py-1.5">
                {line.nomenclatureId}
              </td>
              <td className="border border-black px-2 py-1.5">{line.lot}</td>
              <td className="border border-black px-2 py-1.5">
                {getExpiryDate(line.nomenclatureId, line.lot) || "—"}
              </td>
              <td className="border border-black px-2 py-1.5">
                {line.quantity}
              </td>
              <td className="border border-black px-2 py-1.5">шт.</td>
              <td className="border border-black px-2 py-1.5">—</td>
              <td className="border border-black px-2 py-1.5">{line.place}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Footer info */}
      <div className="mb-6 space-y-1">
        <p>
          Причина списания:{" "}
          {session.lines.length > 0
            ? session.lines
                .map((l) =>
                  l.reason ? getReasonLabel(l.reason) : "не указана",
                )
                .filter((v, i, a) => a.indexOf(v) === i)
                .join(", ")
            : "—"}
          .
        </p>
        <p>
          Место списание брака:{" "}
          {session.lines.length > 0
            ? [...new Set(session.lines.map((l) => l.place))].join(", ")
            : "—"}
          .
        </p>
        <p>
          Действие:{" "}
          {WRITE_OFF_ACTIONS.find((a) => a.id === session.action)?.label || "—"}
          .
        </p>
      </div>

      {/* Signatures */}
      <div className="mt-12">
        <p className="mb-4">Подписи членов комиссии:</p>
        <div className="space-y-6">
          <div className="flex items-end gap-4">
            <span className="min-w-[200px] border-b border-black">&nbsp;</span>
            <span className="text-slate-500">(подпись / ФИО)</span>
          </div>
          <div className="flex items-end gap-4">
            <span className="min-w-[200px] border-b border-black">&nbsp;</span>
            <span className="text-slate-500">(подпись / ФИО)</span>
          </div>
          <div className="flex items-end gap-4">
            <span className="min-w-[200px] border-b border-black">&nbsp;</span>
            <span className="text-slate-500">(подпись / ФИО)</span>
          </div>
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
