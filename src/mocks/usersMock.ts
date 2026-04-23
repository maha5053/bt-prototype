/** Справочник пользователей прототипа и права на этапы производства. */

export interface MockUser {
  id: string;
  displayName: string;
  initials: string;
}

export const MOCK_USERS: MockUser[] = [
  { id: "Смирнова А.", displayName: "Анна Смирнова", initials: "АС" },
  { id: "Иванова Е.", displayName: "Елена Иванова", initials: "ЕИ" },
  { id: "Петров С.", displayName: "Сергей Петров", initials: "СП" },
  { id: "Козлова М.", displayName: "Мария Козлова", initials: "МК" },
  { id: "Сидоров В.", displayName: "Виктор Сидоров", initials: "ВС" },
];

export const USERS: string[] = MOCK_USERS.map((u) => u.id);

/** Полное ФИО из мока или исходная строка, если пользователь не из справочника. */
export function displayNameForUserId(id: string): string {
  const t = id.trim();
  if (!t) return t;
  return MOCK_USERS.find((u) => u.id === t)?.displayName ?? t;
}

export type AccessLevel = "none" | "read" | "write";

export type PermissionKey =
  | "registration"
  | "production"
  | "qualityControl"
  | "release"
  | "approval";

/** Группы пользователей (строки матрицы). */
export type UserGroupId = PermissionKey;

export type ProductionPermissions = Record<PermissionKey, AccessLevel>;

export const USER_GROUP_LABELS: { id: UserGroupId; label: string }[] = [
  { id: "registration", label: "Регистрация" },
  { id: "production", label: "Производство" },
  { id: "qualityControl", label: "Контроль" },
  { id: "release", label: "Выдача" },
  { id: "approval", label: "Одобрение" },
];

/** Заголовки колонок матрицы прав (страница «Пользователи»). */
export const PERMISSION_MATRIX_COLUMN_LABELS: {
  key: PermissionKey;
  label: string;
}[] = [
  { key: "registration", label: "Регистрация" },
  { key: "production", label: "Производство" },
  { key: "qualityControl", label: "Контроль" },
  { key: "release", label: "Выдача" },
  { key: "approval", label: "Одобрение" },
];

/** Краткая подпись прав на производство для выпадашки пользователя. */
export function formatProductionAccessSummary(
  perms: ProductionPermissions,
): string {
  const labels = PERMISSION_MATRIX_COLUMN_LABELS.filter((col) => {
    const v = perms[col.key];
    return v === "write";
  }).map((c) => c.label);
  if (labels.length === 0) return "нет доступа к этапам";
  return labels.join(", ");
}

export function getDefaultProductionPermissions(): ProductionPermissions {
  return PERMISSION_MATRIX_COLUMN_LABELS.reduce((acc, c) => {
    acc[c.key] = "write";
    return acc;
  }, {} as ProductionPermissions);
}

export function mergeUserPermissions(
  partial?: Partial<ProductionPermissions>,
): ProductionPermissions {
  return { ...getDefaultProductionPermissions(), ...partial };
}

const LEGACY_USER_PERMISSIONS_STORAGE_KEY = "bio-user-permissions";
const GROUP_PERMISSIONS_STORAGE_KEY = "bio-group-permissions";
const USER_GROUPS_STORAGE_KEY = "bio-user-groups";

export type PermissionOverrides = Record<string, Partial<Record<PermissionKey, boolean>>>;

export type GroupPermissionMatrix = Record<UserGroupId, ProductionPermissions>;
export type UserGroupMembership = Record<string, UserGroupId[]>;

export function loadPermissionOverrides(): PermissionOverrides {
  try {
    const raw = localStorage.getItem(LEGACY_USER_PERMISSIONS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as PermissionOverrides;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function savePermissionOverrides(overrides: PermissionOverrides) {
  try {
    localStorage.setItem(LEGACY_USER_PERMISSIONS_STORAGE_KEY, JSON.stringify(overrides));
  } catch {
    /* ignore */
  }
}

export function loadGroupPermissionMatrix(): GroupPermissionMatrix {
  try {
    const raw = localStorage.getItem(GROUP_PERMISSIONS_STORAGE_KEY);
    if (!raw) return getDefaultGroupPermissionMatrix();
    const parsed = JSON.parse(raw) as GroupPermissionMatrix;
    if (!parsed || typeof parsed !== "object") return getDefaultGroupPermissionMatrix();
    return normalizeGroupPermissionMatrix(parsed);
  } catch {
    return getDefaultGroupPermissionMatrix();
  }
}

export function saveGroupPermissionMatrix(matrix: GroupPermissionMatrix) {
  try {
    localStorage.setItem(GROUP_PERMISSIONS_STORAGE_KEY, JSON.stringify(matrix));
  } catch {
    /* ignore */
  }
}

export function loadUserGroupMembership(): UserGroupMembership {
  try {
    const raw = localStorage.getItem(USER_GROUPS_STORAGE_KEY);
    if (!raw) return getDefaultUserGroupMembership();
    const parsed = JSON.parse(raw) as UserGroupMembership;
    if (!parsed || typeof parsed !== "object") return getDefaultUserGroupMembership();
    return normalizeUserGroupMembership(parsed);
  } catch {
    return getDefaultUserGroupMembership();
  }
}

export function saveUserGroupMembership(membership: UserGroupMembership) {
  try {
    localStorage.setItem(USER_GROUPS_STORAGE_KEY, JSON.stringify(membership));
  } catch {
    /* ignore */
  }
}

function accessRank(v: AccessLevel): number {
  if (v === "none") return 0;
  if (v === "read") return 1;
  return 2;
}

export function maxAccess(a: AccessLevel, b: AccessLevel): AccessLevel {
  return accessRank(a) >= accessRank(b) ? a : b;
}

export function getDefaultGroupPermissionMatrix(): GroupPermissionMatrix {
  const full = getDefaultProductionPermissions();
  return USER_GROUP_LABELS.reduce((acc, g) => {
    acc[g.id] = { ...full };
    return acc;
  }, {} as GroupPermissionMatrix);
}

export function getDefaultUserGroupMembership(): UserGroupMembership {
  const all = USER_GROUP_LABELS.map((g) => g.id);
  return MOCK_USERS.reduce((acc, u) => {
    acc[u.id] = [...all];
    return acc;
  }, {} as UserGroupMembership);
}

export function normalizeGroupPermissionMatrix(
  input: GroupPermissionMatrix,
): GroupPermissionMatrix {
  const def = getDefaultGroupPermissionMatrix();
  const out: GroupPermissionMatrix = { ...def };
  for (const g of USER_GROUP_LABELS) {
    const row = input?.[g.id];
    if (!row || typeof row !== "object") continue;
    out[g.id] = mergeUserPermissions(row);
  }
  return out;
}

export function normalizeUserGroupMembership(
  input: UserGroupMembership,
): UserGroupMembership {
  const def = getDefaultUserGroupMembership();
  const valid = new Set(USER_GROUP_LABELS.map((g) => g.id));
  const out: UserGroupMembership = { ...def };
  for (const u of MOCK_USERS) {
    const raw = input?.[u.id];
    if (!Array.isArray(raw)) continue;
    out[u.id] = raw.filter((x): x is UserGroupId => typeof x === "string" && valid.has(x as UserGroupId));
  }
  return out;
}

/** Legacy per-user boolean overrides → access levels. true=write, false=read. */
export function legacyOverridesToAccessPartial(
  legacy?: Partial<Record<PermissionKey, boolean>>,
): Partial<ProductionPermissions> {
  if (!legacy) return {};
  const out: Partial<ProductionPermissions> = {};
  for (const c of PERMISSION_MATRIX_COLUMN_LABELS) {
    const v = legacy[c.key];
    if (v === undefined) continue;
    out[c.key] = v ? "write" : "read";
  }
  return out;
}

export function getEffectivePermissionsForUser(
  userId: string,
  matrix: GroupPermissionMatrix,
  membership: UserGroupMembership,
): ProductionPermissions {
  const groups = membership[userId] ?? [];
  const out = PERMISSION_MATRIX_COLUMN_LABELS.reduce((acc, c) => {
    acc[c.key] = "none";
    return acc;
  }, {} as ProductionPermissions);
  for (const g of groups) {
    const row = matrix[g];
    if (!row) continue;
    for (const c of PERMISSION_MATRIX_COLUMN_LABELS) {
      out[c.key] = maxAccess(out[c.key], row[c.key] ?? "none");
    }
  }
  return out;
}

/** Тип этапа заказа → ключ права (как в матрице админки). */
export type StagePermissionSource =
  | "registration"
  | "production"
  | "quality_control"
  | "release";

export function stageTypeToPermissionKey(
  stageType: StagePermissionSource,
): PermissionKey {
  switch (stageType) {
    case "registration":
      return "registration";
    case "production":
      return "production";
    case "quality_control":
      return "qualityControl";
    case "release":
      return "release";
    default:
      return "registration";
  }
}

export function canViewStage(
  perms: ProductionPermissions,
  stageType: StagePermissionSource,
): boolean {
  const key = stageTypeToPermissionKey(stageType);
  return perms[key] === "read" || perms[key] === "write";
}

export function canEditStage(
  perms: ProductionPermissions,
  stageType: StagePermissionSource,
): boolean {
  const key = stageTypeToPermissionKey(stageType);
  return perms[key] === "write";
}
