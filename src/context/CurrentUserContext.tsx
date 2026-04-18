import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  MOCK_USERS,
  getDefaultProductionPermissions,
  getPermissionsForUser,
  loadPermissionOverrides,
  savePermissionOverrides,
  type PermissionOverrides,
  type ProductionPermissions,
} from "../mocks/usersMock";

const CURRENT_USER_STORAGE_KEY = "bio-current-user";

function loadStoredUserId(): string {
  try {
    const raw = localStorage.getItem(CURRENT_USER_STORAGE_KEY);
    if (raw && MOCK_USERS.some((u) => u.id === raw)) return raw;
  } catch {
    /* ignore */
  }
  return MOCK_USERS[0]!.id;
}

function persistUserId(userId: string) {
  try {
    localStorage.setItem(CURRENT_USER_STORAGE_KEY, userId);
  } catch {
    /* ignore */
  }
}

function compactOverrideFromFull(
  full: ProductionPermissions,
): Partial<ProductionPermissions> {
  const defaults = getDefaultProductionPermissions();
  const partial: Partial<ProductionPermissions> = {};
  (Object.keys(full) as (keyof ProductionPermissions)[]).forEach((k) => {
    if (full[k] !== defaults[k]) partial[k] = full[k];
  });
  return partial;
}

type CurrentUserContextValue = {
  currentUserId: string;
  currentUser: (typeof MOCK_USERS)[number];
  permissions: ProductionPermissions;
  permissionOverrides: PermissionOverrides;
  setCurrentUserId: (userId: string) => void;
  setUserPermission: (
    userId: string,
    key: keyof ProductionPermissions,
    value: boolean,
  ) => void;
};

const CurrentUserContext = createContext<CurrentUserContextValue | null>(null);

export function CurrentUserProvider({ children }: { children: ReactNode }) {
  const [currentUserId, setCurrentUserIdState] = useState(loadStoredUserId);
  const [permissionOverrides, setPermissionOverrides] = useState(
    loadPermissionOverrides,
  );

  const setCurrentUserId = useCallback((userId: string) => {
    if (!MOCK_USERS.some((u) => u.id === userId)) return;
    setCurrentUserIdState(userId);
    persistUserId(userId);
  }, []);

  const setUserPermission = useCallback(
    (userId: string, key: keyof ProductionPermissions, value: boolean) => {
      setPermissionOverrides((prev) => {
        const prevMerged = getPermissionsForUser(userId, prev);
        const nextFull = { ...prevMerged, [key]: value };
        const partial = compactOverrideFromFull(nextFull);
        const next: PermissionOverrides = { ...prev };
        if (Object.keys(partial).length === 0) delete next[userId];
        else next[userId] = partial;
        savePermissionOverrides(next);
        return next;
      });
    },
    [],
  );

  const value = useMemo(() => {
    const currentUser =
      MOCK_USERS.find((u) => u.id === currentUserId) ?? MOCK_USERS[0]!;
    const permissions = getPermissionsForUser(currentUserId, permissionOverrides);
    return {
      currentUserId,
      currentUser,
      permissions,
      permissionOverrides,
      setCurrentUserId,
      setUserPermission,
    };
  }, [
    currentUserId,
    permissionOverrides,
    setCurrentUserId,
    setUserPermission,
  ]);

  return (
    <CurrentUserContext.Provider value={value}>
      {children}
    </CurrentUserContext.Provider>
  );
}

export function useCurrentUser() {
  const ctx = useContext(CurrentUserContext);
  if (!ctx) {
    throw new Error("useCurrentUser must be used within CurrentUserProvider");
  }
  return ctx;
}
