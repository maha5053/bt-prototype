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
  loadGroupPermissionMatrix,
  loadPermissionOverrides,
  loadUserGroupMembership,
  saveGroupPermissionMatrix,
  saveUserGroupMembership,
  type AccessLevel,
  type GroupPermissionMatrix,
  type PermissionKey,
  type ProductionPermissions,
  type UserGroupId,
  type UserGroupMembership,
  getEffectivePermissionsForUser,
  legacyOverridesToAccessPartial,
  mergeUserPermissions,
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

type CurrentUserContextValue = {
  currentUserId: string;
  currentUser: (typeof MOCK_USERS)[number];
  permissions: ProductionPermissions;
  groupPermissionMatrix: GroupPermissionMatrix;
  userGroupMembership: UserGroupMembership;
  setCurrentUserId: (userId: string) => void;
  setGroupPermission: (groupId: UserGroupId, key: PermissionKey, value: AccessLevel) => void;
  setUserGroups: (userId: string, groups: UserGroupId[]) => void;
};

const CurrentUserContext = createContext<CurrentUserContextValue | null>(null);

export function CurrentUserProvider({ children }: { children: ReactNode }) {
  const [currentUserId, setCurrentUserIdState] = useState(loadStoredUserId);
  const [groupPermissionMatrix, setGroupPermissionMatrix] = useState(loadGroupPermissionMatrix);
  const [userGroupMembership, setUserGroupMembership] = useState(loadUserGroupMembership);
  // Legacy (per-user boolean overrides). Kept for migration only.
  const [legacyPermissionOverrides] = useState(loadPermissionOverrides);

  const setCurrentUserId = useCallback((userId: string) => {
    if (!MOCK_USERS.some((u) => u.id === userId)) return;
    setCurrentUserIdState(userId);
    persistUserId(userId);
  }, []);

  const setGroupPermission = useCallback(
    (groupId: UserGroupId, key: PermissionKey, value: AccessLevel) => {
      setGroupPermissionMatrix((prev) => {
        const next: GroupPermissionMatrix = { ...prev, [groupId]: { ...prev[groupId] } };
        next[groupId] = { ...mergeUserPermissions(next[groupId]), [key]: value };
        saveGroupPermissionMatrix(next);
        return next;
      });
    },
    [],
  );

  const setUserGroups = useCallback((userId: string, groups: UserGroupId[]) => {
    setUserGroupMembership((prev) => {
      const next: UserGroupMembership = { ...prev, [userId]: [...groups] };
      saveUserGroupMembership(next);
      return next;
    });
  }, []);

  const value = useMemo(() => {
    const currentUser =
      MOCK_USERS.find((u) => u.id === currentUserId) ?? MOCK_USERS[0]!;
    const base = getEffectivePermissionsForUser(
      currentUserId,
      groupPermissionMatrix,
      userGroupMembership,
    );
    // If legacy overrides exist, apply them as a last-mile override (true->write, false->read).
    const legacyPartial = legacyOverridesToAccessPartial(
      legacyPermissionOverrides[currentUserId],
    );
    const permissions = mergeUserPermissions({ ...base, ...legacyPartial });
    return {
      currentUserId,
      currentUser,
      permissions,
      groupPermissionMatrix,
      userGroupMembership,
      setCurrentUserId,
      setGroupPermission,
      setUserGroups,
    };
  }, [
    currentUserId,
    groupPermissionMatrix,
    legacyPermissionOverrides,
    userGroupMembership,
    setCurrentUserId,
    setGroupPermission,
    setUserGroups,
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
