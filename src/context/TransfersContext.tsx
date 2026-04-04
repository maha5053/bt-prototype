import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  INITIAL_TRANSFERS,
  type TransferDocument,
  type TransferStatus,
} from '../mocks/transfersData'

const STORAGE_KEY = 'bio-transfers'
const STORAGE_SEQ_KEY = 'bio-transfers-seq'

function loadFromStorage(): TransferDocument[] | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as TransferDocument[]
  } catch {
    /* ignore */
  }
  return null
}

function loadSeq(): number | null {
  try {
    const raw = localStorage.getItem(STORAGE_SEQ_KEY)
    if (raw) return Number(raw)
  } catch {
    /* ignore */
  }
  return null
}

function saveToStorage(docs: TransferDocument[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(docs))
  } catch {
    /* ignore */
  }
}

function saveSeq(seq: number) {
  try {
    localStorage.setItem(STORAGE_SEQ_KEY, String(seq))
  } catch {
    /* ignore */
  }
}

type TransfersContextValue = {
  documents: TransferDocument[]
  addDocument: (doc: Omit<TransferDocument, 'id' | 'number' | 'createdAt'>) => {
    id: string
    number: string
  }
  updateStatus: (id: string, status: TransferStatus) => void
}

const TransfersContext = createContext<TransfersContextValue | null>(null)

const storedSeq = loadSeq()
let idSeq = storedSeq ?? INITIAL_TRANSFERS.length + 1

function nextNumber(): string {
  return String(idSeq++)
}

export function TransfersProvider({ children }: { children: ReactNode }) {
  const [documents, setDocuments] = useState<TransferDocument[]>(() => {
    const stored = loadFromStorage()
    return stored ?? [...INITIAL_TRANSFERS]
  })

  const addDocument = useCallback(
    (
      draft: Omit<TransferDocument, 'id' | 'number' | 'createdAt'>,
    ): { id: string; number: string } => {
      const id = `tr-${Date.now()}`
      const number = nextNumber()
      const createdAt = new Date().toISOString()
      const doc: TransferDocument = {
        ...draft,
        id,
        number,
        createdAt,
      }
      setDocuments((prev) => {
        const next = [doc, ...prev]
        saveToStorage(next)
        saveSeq(idSeq)
        return next
      })
      return { id, number }
    },
    [],
  )

  const updateStatus = useCallback((id: string, status: TransferStatus) => {
    setDocuments((prev) => {
      const next = prev.map((d) => (d.id === id ? { ...d, status } : d))
      saveToStorage(next)
      return next
    })
  }, [])

  const value = useMemo(
    () => ({ documents, addDocument, updateStatus }),
    [documents, addDocument, updateStatus],
  )

  return (
    <TransfersContext.Provider value={value}>
      {children}
    </TransfersContext.Provider>
  )
}

export function useTransfers() {
  const ctx = useContext(TransfersContext)
  if (!ctx) {
    throw new Error('useTransfers must be used within TransfersProvider')
  }
  return ctx
}

export type { TransferDocument, TransferStatus }
