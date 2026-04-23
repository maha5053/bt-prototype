import { useCurrentUser } from "../context/CurrentUserContext";
import {
  USER_GROUP_LABELS,
  MOCK_USERS,
  PERMISSION_MATRIX_COLUMN_LABELS,
} from "../mocks/usersMock";

export function UsersAdminPage() {
  const {
    groupPermissionMatrix,
    setGroupPermission,
    userGroupMembership,
    setUserGroups,
  } = useCurrentUser();

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
              <th className="px-4 py-3 font-medium">Группа</th>
              {PERMISSION_MATRIX_COLUMN_LABELS.map((col) => (
                <th key={col.key} className="px-3 py-3 text-center font-medium">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {USER_GROUP_LABELS.map((group) => {
              const row = groupPermissionMatrix[group.id];
              return (
                <tr key={group.id} className="hover:bg-slate-50/80">
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-900">{group.label}</div>
                    <div className="text-xs text-slate-500">{group.id}</div>
                  </td>
                  {PERMISSION_MATRIX_COLUMN_LABELS.map((col) => (
                    <td key={col.key} className="px-3 py-3 text-center">
                      <select
                        className="rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-slate-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        value={row?.[col.key] ?? "none"}
                        onChange={(e) =>
                          setGroupPermission(
                            group.id,
                            col.key,
                            e.target.value as "none" | "read" | "write",
                          )
                        }
                        aria-label={`${group.label}: ${col.label}`}
                      >
                        <option value="none">нет</option>
                        <option value="read">чтение</option>
                        <option value="write">запись</option>
                      </select>
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-semibold text-slate-900">
          Пользователи и группы
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Пользователь может состоять в одной или нескольких группах. Итоговый доступ
          рассчитывается как максимум по выбранным группам: запись &gt; чтение &gt;
          нет.
        </p>

        <div className="mt-4 space-y-3">
          {MOCK_USERS.map((u) => {
            const selected = new Set(userGroupMembership[u.id] ?? []);
            return (
              <div
                key={u.id}
                className="rounded-lg border border-slate-200 bg-slate-50/40 p-3"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-medium text-slate-900">{u.displayName}</div>
                    <div className="text-xs text-slate-500">{u.id}</div>
                  </div>
                  <div className="text-xs text-slate-500">
                    Выбрано: {selected.size}
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {USER_GROUP_LABELS.map((g) => {
                    const checked = selected.has(g.id);
                    return (
                      <label
                        key={`${u.id}:${g.id}`}
                        className={[
                          "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium",
                          checked
                            ? "border-blue-200 bg-blue-50 text-blue-900"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
                        ].join(" ")}
                      >
                        <input
                          type="checkbox"
                          className="size-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          checked={checked}
                          onChange={(e) => {
                            const next = new Set(selected);
                            if (e.target.checked) next.add(g.id);
                            else next.delete(g.id);
                            setUserGroups(u.id, [...next]);
                          }}
                          aria-label={`${u.displayName}: ${g.label}`}
                        />
                        {g.label}
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
