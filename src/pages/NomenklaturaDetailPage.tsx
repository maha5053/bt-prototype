import { Link, useParams } from 'react-router-dom'
import { useMemo, useState } from 'react'
import {
  formatRuDate,
  getCatalogById,
  getStockLinesByNomenclature,
  getTransactionsByNomenclature,
} from '../mocks/balancesData'

type TabId = 'stock' | 'info' | 'journal'

const tabs: { id: TabId; label: string }[] = [
  { id: 'stock', label: 'Остаток' },
  { id: 'info', label: 'Информация' },
  { id: 'journal', label: 'Журнал' },
]

export function NomenklaturaDetailPage() {
  const { nomenclatureId } = useParams<{ nomenclatureId: string }>()
  const [tab, setTab] = useState<TabId>('stock')

  const catalog = nomenclatureId ? getCatalogById(nomenclatureId) : undefined
  const transactions = useMemo(
    () => (nomenclatureId ? getTransactionsByNomenclature(nomenclatureId) : []),
    [nomenclatureId],
  )

  if (!nomenclatureId || !catalog) {
    return (
      <div className="p-8">
        <p className="text-slate-600">Элемент номенклатуры не найден.</p>
        <Link
          to="/sklad/ostatki"
          className="mt-4 inline-block text-sm font-medium text-emerald-700 hover:underline"
        >
          ← К остаткам
        </Link>
      </div>
    )
  }

  const stockLines = getStockLinesByNomenclature(nomenclatureId)

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            to="/sklad/balance"
            className="mb-2 inline-flex text-sm font-medium text-emerald-700 hover:underline"
          >
            ← К остаткам
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            {catalog.name}
          </h1>
          <p className="mt-1 font-mono text-sm text-slate-500">
            {catalog.catalogNumber} · {catalog.group}
          </p>
        </div>
      </div>

      <div
        className="mb-6 flex flex-wrap gap-1 rounded-lg bg-slate-100 p-1"
        role="tablist"
        aria-label="Разделы карточки"
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.id
                ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200'
                : 'text-slate-600 hover:bg-white/60 hover:text-slate-900'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'stock' ? (
        <section aria-labelledby="stock-heading" className="space-y-3">
          <h2 id="stock-heading" className="sr-only">
            Остаток по местам и партиям
          </h2>
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-[800px] w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                    <th className="px-4 py-3 font-medium">Наименование</th>
                    <th className="px-4 py-3 font-medium">Место хранения</th>
                    <th className="px-4 py-3 font-medium">Лот</th>
                    <th className="px-4 py-3 font-medium whitespace-nowrap">
                      Количество
                    </th>
                    <th className="px-4 py-3 font-medium whitespace-nowrap">
                      Срок годности
                    </th>
                    <th className="px-4 py-3 font-medium whitespace-nowrap">
                      Дата поступления
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {stockLines.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-slate-500">
                        Нет строк остатков по выбранной номенклатуре.
                      </td>
                    </tr>
                  ) : (
                    stockLines.map((line, idx) => (
                      <tr
                        key={`${line.lot}-${line.place}-${idx}`}
                        className="border-b border-slate-100 last:border-0 hover:bg-slate-50/80"
                      >
                        <td className="px-4 py-3 text-slate-800">{catalog.name}</td>
                        <td className="px-4 py-3">{line.place}</td>
                        <td className="px-4 py-3 font-mono text-xs">{line.lot}</td>
                        <td className="px-4 py-3 tabular-nums">{line.quantity}</td>
                        <td className="px-4 py-3 tabular-nums whitespace-nowrap">
                          {formatRuDate(line.expiryDate)}
                        </td>
                        <td className="px-4 py-3 tabular-nums whitespace-nowrap">
                          {formatRuDate(line.receiptDate)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      ) : null}

      {tab === 'info' ? (
        <section aria-labelledby="info-heading">
          <h2 id="info-heading" className="mb-3 text-lg font-semibold text-slate-900">
            Информация (справочник)
          </h2>
          <dl className="grid max-w-3xl gap-x-6 gap-y-3 sm:grid-cols-2">
            <InfoRow label="Наименование" value={catalog.name} />
            <InfoRow label="Каталожный номер" value={catalog.catalogNumber} />
            <InfoRow label="Группа" value={catalog.group} />
            <InfoRow label="Ед. изм." value={catalog.unit} />
            <InfoRow label="Производитель" value={catalog.manufacturer} />
            <InfoRow label="Код поставщика" value={catalog.vendorCode} />
            <InfoRow label="Код счёта" value={catalog.accountCode} />
            <InfoRow
              label="Мин. остаток"
              value={String(catalog.minStockLevel)}
            />
            <div className="sm:col-span-2">
              <InfoRow label="Описание" value={catalog.description} />
            </div>
            <div className="sm:col-span-2">
              <InfoRow
                label="Условия хранения"
                value={catalog.storageConditions}
              />
            </div>
            <div className="sm:col-span-2">
              <InfoRow label="Примечания" value={catalog.notes || '—'} />
            </div>
          </dl>
        </section>
      ) : null}

      {tab === 'journal' ? (
        <section aria-labelledby="journal-heading" className="space-y-3">
          <h2 id="journal-heading" className="text-lg font-semibold text-slate-900">
            Журнал движений
          </h2>
          <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-[1000px] w-full border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                    <th className="px-3 py-3 font-medium whitespace-nowrap">ID</th>
                    <th className="px-3 py-3 font-medium whitespace-nowrap">
                      Время
                    </th>
                    <th className="px-3 py-3 font-medium">Тип</th>
                    <th className="px-3 py-3 font-medium">Инициатор</th>
                    <th className="px-3 py-3 font-medium whitespace-nowrap">
                      Кол-во
                    </th>
                    <th className="px-3 py-3 font-medium">Лот</th>
                    <th className="px-3 py-3 font-medium">Контекст</th>
                    <th className="px-3 py-3 font-medium">Комментарий</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length === 0 ? (
                    <tr>
                      <td
                        colSpan={8}
                        className="px-4 py-10 text-center text-slate-500"
                      >
                        Нет операций.
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx) => (
                      <tr
                        key={tx.id}
                        className="border-b border-slate-100 last:border-0 hover:bg-slate-50/80"
                      >
                        <td className="px-3 py-2.5 font-mono text-xs whitespace-nowrap">
                          {tx.id}
                        </td>
                        <td className="px-3 py-2.5 tabular-nums text-xs whitespace-nowrap text-slate-700">
                          {new Date(tx.timestamp).toLocaleString('ru-RU')}
                        </td>
                        <td className="px-3 py-2.5 capitalize">{tx.type}</td>
                        <td className="px-3 py-2.5">{tx.initiator}</td>
                        <td className="px-3 py-2.5 tabular-nums whitespace-nowrap">
                          {tx.quantity}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-xs">{tx.lot}</td>
                        <td className="px-3 py-2.5 text-slate-700">{tx.context}</td>
                        <td className="max-w-[200px] px-3 py-2.5 text-slate-600 truncate" title={tx.comment}>
                          {tx.comment || '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-slate-100 bg-slate-50/50 px-3 py-2">
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm text-slate-900">{value}</dd>
    </div>
  )
}
