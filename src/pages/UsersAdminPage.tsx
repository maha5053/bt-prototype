import { useCurrentUser } from "../context/CurrentUserContext";
import {
  MOCK_USERS,
  PERMISSION_MATRIX_COLUMN_LABELS,
  getPermissionsForUser,
} from "../mocks/usersMock";

export function UsersAdminPage() {
  const { permissionOverrides, setUserPermission } = useCurrentUser();

  return (
    <div className="p-6 md:p-8">
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
        Пользователи
      </h1>
      <p className="mt-2 max-w-3xl text-sm text-slate-600">
        Права применяются к карточке заказа в производстве: без отметки —
        только просмотр соответствующего этапа; «Одобрение» — кнопка одобрения
        технологического процесса на выдаче.
      </p>

      <div className="mt-6 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">Пользователь</th>
              {PERMISSION_MATRIX_COLUMN_LABELS.map((col) => (
                <th key={col.key} className="px-3 py-3 text-center font-medium">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {MOCK_USERS.map((user) => {
              const perms = getPermissionsForUser(user.id, permissionOverrides);
              return (
                <tr key={user.id} className="hover:bg-slate-50/80">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">
                      {user.displayName}
                    </div>
                    <div className="text-xs text-slate-500">{user.id}</div>
                  </td>
                  {PERMISSION_MATRIX_COLUMN_LABELS.map((col) => (
                    <td key={col.key} className="px-3 py-3 text-center">
                      <input
                        type="checkbox"
                        className="size-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        checked={perms[col.key]}
                        onChange={(e) =>
                          setUserPermission(user.id, col.key, e.target.checked)
                        }
                        aria-label={`${user.displayName}: ${col.label}`}
                      />
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
