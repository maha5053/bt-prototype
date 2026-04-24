import {
  normalizeSpecResultType,
  type SpecificationItem,
  type SpecResultType,
} from "../context/NomenclatureContext";

export type SpecTemplateItem = {
  name: string;
  requirement: string;
  resultType: SpecResultType;
  comment: string;
  sortOrder?: number;
};

export type SpecTemplate = {
  id: string;
  name: string;
  createdAt: string;
  updatedAt?: string;
  items: SpecTemplateItem[];
};

const STORAGE_KEY = "bio-spec-templates";

function safeParseTemplates(raw: string): SpecTemplate[] | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    return parsed as SpecTemplate[];
  } catch {
    return null;
  }
}

export function listSpecTemplates(): SpecTemplate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return safeParseTemplates(raw) ?? [];
  } catch {
    return [];
  }
}

export function saveSpecTemplates(templates: SpecTemplate[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
  } catch {
    /* ignore */
  }
}

export function upsertSpecTemplate(input: {
  id?: string;
  name: string;
  items: SpecificationItem[];
}): SpecTemplate {
  const now = new Date().toISOString();
  const normalizedItems: SpecTemplateItem[] = [...input.items]
    .map((r, idx) => ({
      name: r.name,
      requirement: r.requirement,
      resultType: normalizeSpecResultType(r.resultType),
      comment: r.comment,
      sortOrder: idx + 1,
    }))
    .filter((r) => r.name.trim() || r.requirement.trim() || r.comment.trim());

  const templates = listSpecTemplates();
  const existingIdx = input.id
    ? templates.findIndex((t) => t.id === input.id)
    : templates.findIndex((t) => t.name.trim().toLowerCase() === input.name.trim().toLowerCase());

  if (existingIdx >= 0) {
    const existing = templates[existingIdx]!;
    const updated: SpecTemplate = {
      ...existing,
      name: input.name.trim(),
      updatedAt: now,
      items: normalizedItems,
    };
    const next = [...templates];
    next[existingIdx] = updated;
    saveSpecTemplates(next);
    return updated;
  }

  const id =
    input.id ??
    (typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `tpl-${Date.now()}`);

  const created: SpecTemplate = {
    id,
    name: input.name.trim(),
    createdAt: now,
    items: normalizedItems,
  };
  saveSpecTemplates([created, ...templates]);
  return created;
}

export function buildSpecRowsFromTemplate(
  template: SpecTemplate,
): Array<
  Pick<
    SpecificationItem,
    "id" | "name" | "requirement" | "resultType" | "comment" | "sortOrder" | "confirmed"
  >
> {
  const items = [...template.items].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  return items.map((it, idx) => {
    const id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : String(Math.random());
    return {
      id,
      name: it.name,
      requirement: it.requirement,
      resultType: normalizeSpecResultType(it.resultType),
      comment: it.comment ?? "",
      sortOrder: idx + 1,
      confirmed: true,
    };
  });
}

