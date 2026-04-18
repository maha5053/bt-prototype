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

export type ProductionPermissions = {
  registration: boolean;
  production: boolean;
  qualityControl: boolean;
  release: boolean;
  approval: boolean;
};

/** Заголовки колонок матрицы прав (страница «Пользователи»). */
export const PERMISSION_MATRIX_COLUMN_LABELS: {
  key: keyof ProductionPermissions;
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
  const labels = PERMISSION_MATRIX_COLUMN_LABELS.filter(
    (col) => perms[col.key],
  ).map((c) => c.label);
  if (labels.length === 0) return "нет доступа к этапам";
  return labels.join(", ");
}

export function getDefaultProductionPermissions(): ProductionPermissions {
  return {
    registration: true,
    production: true,
    qualityControl: true,
    release: true,
    approval: true,
  };
}

export function mergeUserPermissions(
  partial?: Partial<ProductionPermissions>,
): ProductionPermissions {
  return { ...getDefaultProductionPermissions(), ...partial };
}

const PERMISSIONS_STORAGE_KEY = "bio-user-permissions";

export type PermissionOverrides = Record<string, Partial<ProductionPermissions>>;

export function loadPermissionOverrides(): PermissionOverrides {
  try {
    const raw = localStorage.getItem(PERMISSIONS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as PermissionOverrides;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function savePermissionOverrides(overrides: PermissionOverrides) {
  try {
    localStorage.setItem(PERMISSIONS_STORAGE_KEY, JSON.stringify(overrides));
  } catch {
    /* ignore */
  }
}

export function getPermissionsForUser(
  userId: string,
  overrides: PermissionOverrides,
): ProductionPermissions {
  return mergeUserPermissions(overrides[userId]);
}

/** Тип этапа заказа → ключ права (как в матрице админки). */
export type StagePermissionSource =
  | "registration"
  | "production"
  | "quality_control"
  | "release";

export function stageTypeToPermissionKey(
  stageType: StagePermissionSource,
): keyof ProductionPermissions {
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

export function userHasStageEditPermission(
  perms: ProductionPermissions,
  stageType: StagePermissionSource,
): boolean {
  return perms[stageTypeToPermissionKey(stageType)];
}
