import { Link } from 'react-router-dom'
import { useMemo, useState } from 'react'
import {
  ALL_GROUPS,
  type BalanceRow,
  buildBalanceRows,
  formatRuDate,
  getAllStoragePlaces,
  isOverdue,
  type NomenclatureGroup,
  MOCK_STOCK_LINES,
} from '../mocks/balancesData'

const PAGE_SIZE = 7

type SortKey = 'name' | 'totalQty'
type SortDir = 'asc' | 'desc'

export function BalancePage() {
  const allRows = useMemo(() => buildBalanceRows(), [])
  const storagePlaces = useMemo(() => getAllStoragePlaces(), [])

  const [nameQuery, setNameQuery] = useState('')
  const [catalogQuery, setCatalogQuery] = useState('')
  const [onlyPositive, setOnlyPositive] = useState(true)
  const [selectedPlaces, setSelectedPlaces] = useState<Set<string>>(() => new Set())
  const [expiryBefore, setExpiryBefore] = useState('')
  const [group, setGroup] = useState<NomenclatureGroup | 'all'>('all')
  const [overdueOnly, setOverdueOnly] = useState(false)

  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [page, setPage] = useState(1)

  const filtered = useMemo(() => {
    const nq = nameQuery.trim().toLowerCase()
    const cq = catalogQuery.trim().toLowerCase()
    const now = new Date()

    let rows = allRows
    if (onlyPositive) rows = rows.filter((r) => r.totalQty > 0)
    if (nq) rows = rows.filter((r) => r.name.toLowerCase().includes(nq))
    if (cq) rows = rows.filter((r) => r.catalogNumber.toLowerCase().includes(cq))
    if (group !== 'all') rows = rows.filter((r) => r.group === group)
    if (selectedPlaces.size > 0) {
      rows = rows.filter((r) => {
        const lines = MOCK_STOCK_LINES.filter(
          (l) => l.nomenclatureId === r.nomenclatureId && l.quantity > 0,
        )
        return lines.some((l) => selectedPlaces.has(l.place))
      })
    }
    if (expiryBefore) {
      rows = rows.filter((r) => r.expiryDates.some((d) => d <= expiryBefore))
    }
    if (overdueOnly) {
      rows = rows.filter((r) => {
        const lines = MOCK_STOCK_LINES.filter(
          (l) => l.nomenclatureId === r.nomenclatureId && l.quantity > 0,
        )
        return lines.some((l) => isOverdue(l.expiryDate, now))
      })
    }

    const sorted = [...rows].sort((a, b) => {
      const mul = sortDir === 'asc' ? 1 : -1
      if (sortKey === 'name') {
        return mul * a.name.localeCompare(b.name, 'ru')
      }
      return mul * (a.totalQty - b.totalQty)
    })
    return sorted
  }, [
    allRows,
    onlyPositive,
    nameQuery,
    catalogQuery,
    group,
    selectedPlaces,
    expiryBefore,
    overdueOnly,
    sortKey,
    sortDir,
  ])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const pageRows = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  )

  const toggleSort = (key: SortKey) => {
    setPage(1)
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir(key === 'name' ? 'asc' : 'desc')
    }
  }

  const togglePlace = (place: string) => {
    setPage(1)
    setSelectedPlaces((prev) => {
      const next = new Set(prev)
      if (next.has(place)) next.delete(place)
      else next.add(place)
      return next
    })
  }

  const resetFilters = () => {
    setNameQuery('')
    setCatalogQuery('')
    setOnlyPositive(true)
    setSelectedPlaces(new Set())
    setExpiryBefore('')
    setGroup('all')
    setOverdueOnly(false)
    setPage(1)
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Остатки (balance)
        </h1>
      </div>

      <section
        className="mb-6 rounded-lg border border-slate-200 bg-slate-50/80 p-4 shadow-sm"
        aria-label="Поиск и фильтры"
      >
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
              Наименование
            </label>
            <input
              type="search"
              value={nameQuery}
              onChange={(e) => {
                setPage(1)
                setNameQuery(e.target.value)
              }}
              placeholder="Часть наименования…"
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
              Каталожный номер
            </label>
            <input
              type="search"
              value={catalogQuery}
              onChange={(e) => {
                setPage(1)
                setCatalogQuery(e.target.value)
              }}
              placeholder="Часть номера…"
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            />
          </div>
          <div className="flex flex-col justify-end md:col-span-2 lg:col-span-1">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={onlyPositive}
                onChange={(e) => {
                  setPage(1)
                  setOnlyPositive(e.target.checked)
                }}
                className="size-4 rounded border-slate-300 text-slate-800 focus:ring-slate-400"
              />
              Отображать остаток &gt; 0
            </label>
          </div>
        </div>

        <div className="mt-4 grid gap-4 border-t border-slate-200/80 pt-4 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
              Группа
            </span>
            <select
              value={group}
              onChange={(e) => {
                setPage(1)
                setGroup(e.target.value as NomenclatureGroup | 'all')
              }}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            >
              <option value="all">Все группы</option>
              {ALL_GROUPS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
              Срок годности (есть партия не позднее)
            </label>
            <input
              type="date"
              value={expiryBefore}
              onChange={(e) => {
                setPage(1)
                setExpiryBefore(e.target.value)
              }}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            />
          </div>
          <div className="md:col-span-2 lg:col-span-2">
            <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-500">
              Места хранения
            </span>
            <div className="flex flex-wrap gap-2">
              {storagePlaces.map((p) => (
                <label
                  key={p}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-md border border-slate-200 bg-white px-2 py-1 text-sm text-slate-700 shadow-sm hover:bg-slate-50 has-[:checked]:border-slate-400 has-[:checked]:bg-slate-100"
                >
                  <input
                    type="checkbox"
                    checked={selectedPlaces.has(p)}
                    onChange={() => togglePlace(p)}
                    className="size-3.5 rounded border-slate-300"
                  />
                  {p}
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/80 pt-4">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={overdueOnly}
              onChange={(e) => {
                setPage(1)
                setOverdueOnly(e.target.checked)
              }}
              className="size-4 rounded border-slate-300 text-red-600 focus:ring-slate-400"
            />
            Только просроченные (срок &lt; сегодня)
          </label>
          <button
            type="button"
            onClick={resetFilters}
            className="text-sm font-medium text-slate-600 underline decoration-slate-300 underline-offset-2 hover:text-slate-900"
          >
            Сбросить фильтры
          </button>
        </div>
      </section>

      <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                <th className="px-4 py-3 font-medium">
                  <button
                    type="button"
                    onClick={() => toggleSort('name')}
                    className="inline-flex items-center gap-1 font-medium text-slate-700 hover:text-slate-900"
                  >
                    Наименование номенклатуры
                    <SortMark active={sortKey === 'name'} dir={sortDir} />
                  </button>
                </th>
                <th className="px-4 py-3 font-medium whitespace-nowrap">
                  Каталожный номер
                </th>
                <th className="px-4 py-3 font-medium whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => toggleSort('totalQty')}
                    className="inline-flex items-center gap-1 font-medium text-slate-700 hover:text-slate-900"
                  >
                    Остаток
                    <SortMark active={sortKey === 'totalQty'} dir={sortDir} />
                  </button>
                </th>
                <th className="px-4 py-3 font-medium">Срок годности</th>
                <th className="px-4 py-3 font-medium">Место хранения</th>
              </tr>
            </thead>
            <tbody>
              {pageRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-12 text-center text-slate-500"
                  >
                    Нет строк по текущим условиям.
                  </td>
                </tr>
              ) : (
                pageRows.map((row) => (
                  <BalanceTableRow key={row.nomenclatureId} row={row} />
                ))
              )}
            </tbody>
          </table>
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-600">
          <span>
            Показано{' '}
            <strong className="font-medium text-slate-800">
              {filtered.length === 0
                ? 0
                : `${(safePage - 1) * PAGE_SIZE + 1}–${Math.min(
                    safePage * PAGE_SIZE,
                    filtered.length,
                  )}`}
            </strong>{' '}
            из <strong className="font-medium text-slate-800">{filtered.length}</strong>
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Назад
            </button>
            <span className="tabular-nums text-slate-700">
              Стр. {safePage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Вперёд
            </button>
          </div>
        </footer>
      </div>
    </div>
  )
}

function SortMark({
  active,
  dir,
}: {
  active: boolean
  dir: SortDir
}) {
  if (!active) {
    return (
      <span className="text-slate-300" aria-hidden>
        ↕
      </span>
    )
  }
  return (
    <span className="text-slate-800" aria-hidden>
      {dir === 'asc' ? '↑' : '↓'}
    </span>
  )
}

function BalanceTableRow({ row }: { row: BalanceRow }) {
  const now = new Date()
  const hasOverdue = MOCK_STOCK_LINES.some(
    (l) =>
      l.nomenclatureId === row.nomenclatureId &&
      l.quantity > 0 &&
      isOverdue(l.expiryDate, now),
  )

  return (
    <tr className="border-b border-slate-100 last:border-0 hover:bg-slate-50/80">
      <td className="align-top px-4 py-3 text-slate-800">
        <Link
          to={`/sklad/nomenklatura/${row.nomenclatureId}`}
          className={`font-medium text-emerald-700 hover:text-emerald-800 hover:underline ${hasOverdue ? 'decoration-red-400 decoration-2 underline-offset-2' : ''}`}
        >
          {row.name}
        </Link>
        {hasOverdue ? (
          <span className="ml-2 inline-block rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-700 ring-1 ring-red-200">
            есть просрочка
          </span>
        ) : null}
      </td>
      <td className="align-top px-4 py-3 font-mono text-xs text-slate-600 whitespace-nowrap">
        {row.catalogNumber}
      </td>
      <td className="align-top px-4 py-3 tabular-nums whitespace-nowrap">
        {row.totalQty}
      </td>
      <td className="align-top px-4 py-3 text-slate-700">
        {row.expiryDates.length === 0 ? (
          <span className="text-slate-400">—</span>
        ) : (
          <ul className="list-inside list-disc space-y-0.5">
            {row.expiryDates.map((d) => (
              <li key={d} className="text-sm tabular-nums">
                {formatRuDate(d)}
              </li>
            ))}
          </ul>
        )}
      </td>
      <td className="align-top px-4 py-3 text-slate-700">
        {row.places.length === 0 ? (
          <span className="text-slate-400">—</span>
        ) : (
          <ul className="list-inside list-disc space-y-0.5">
            {row.places.map((p) => (
              <li key={p} className="text-sm">
                {p}
              </li>
            ))}
          </ul>
        )}
      </td>
    </tr>
  )
}
