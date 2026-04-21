import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Combobox, Tab } from "@headlessui/react";
import { ProductionStorageDevTools } from "../components/ProductionStorageDevTools";
import { ProductionProvider, useProduction } from "../context/ProductionContext";
import {
  ACTION_CONSUMABLE_CATALOG,
  STEP_EQUIPMENT_CATALOG,
} from "../mocks/constructorV2Catalog";
import type {
  ProcessTemplate,
  StageTemplate,
  StepTemplate,
  StepGroupTemplate,
  StepActionTemplate,
  FieldDefinition,
  FieldType,
} from "../mocks/productionData";

type ActionInputConfig = {
  label: string;
  type: "text" | "number";
};

type EditableStepActionTemplate = StepActionTemplate & {
  required?: boolean;
  input?: ActionInputConfig | null;
};

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("read"));
    r.readAsDataURL(file);
  });
}

function formatStepCount(n: number): string {
  const m10 = n % 10;
  const m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return `${n} шаг`;
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return `${n} шага`;
  return `${n} шагов`;
}

function uid(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

const GROUP_FIELD_TYPE_OPTIONS: Array<{ value: FieldType; label: string }> = [
  { value: "text", label: "Текст" },
  { value: "number", label: "Число" },
  { value: "checkbox", label: "Чекбокс" },
  { value: "select", label: "Выпадающий список" },
];

function parseOptionsFromText(raw: string): string[] {
  return raw
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

function optionsToText(opts: string[] | undefined): string {
  return (opts ?? []).join("\n");
}

export function ConstructorListPage() {
  return (
    <ProductionProvider>
      <ConstructorListContent />
    </ProductionProvider>
  );
}

function ConstructorListContent() {
  const { templates, deleteTemplate, archiveTemplate, orders } = useProduction();
  const navigate = useNavigate();
  const visibleTemplates = templates.filter((t) => !t.id.startsWith("tpl-runtime-v2-"));

  return (
    <div className="relative p-6 md:p-8">
      <div className="mb-6 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-800">
            Конструктор процессов
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Управление шаблонами производственных процессов.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            navigate("/admin/konstruktor/novyy");
          }}
          className="inline-flex shrink-0 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
        >
          Создать шаблон
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-3 font-medium">Название</th>
              <th className="px-4 py-3 font-medium">Этапов</th>
              <th className="px-4 py-3 font-medium">Связанных заказов</th>
              <th className="px-4 py-3 font-medium text-right">Действия</th>
            </tr>
          </thead>
          <tbody>
            {visibleTemplates.map((tpl) => {
              const used = orders.filter((o) => o.templateId === tpl.id).length;
              const isArchived = Boolean(tpl.archivedAt);
              const isBaseline = tpl.id === "tpl-thrombogel";
              const locked = isBaseline || isArchived || used > 0;
              return (
                <tr key={tpl.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-800">
                    <div className="flex items-center gap-2">
                      <span>{tpl.name}</span>
                      {isBaseline ? (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                          Эталон
                        </span>
                      ) : isArchived ? (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                          В архиве
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{tpl.stages.length}</td>
                  <td className="px-4 py-3 text-slate-600">{used}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      {locked ? (
                        <span
                          className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-medium text-slate-400"
                          title={
                            isBaseline
                              ? "Эталонный шаблон: редактирование запрещено"
                              : isArchived
                              ? "Шаблон в архиве: редактирование запрещено"
                              : "Шаблон используется в заказах: редактирование запрещено"
                          }
                        >
                          Редактировать
                        </span>
                      ) : (
                        <Link
                          to={`/admin/konstruktor/${tpl.id}`}
                          className="rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Редактировать
                        </Link>
                      )}

                      {!isArchived && !isBaseline ? (
                        <button
                          type="button"
                          className="rounded-md border border-amber-300 px-3 py-1.5 text-xs font-medium text-amber-800 hover:bg-amber-50"
                          onClick={() => {
                            if (
                              !window.confirm(
                                "Убрать шаблон в архив? Он станет недоступен для старта производства и будет только для просмотра.",
                              )
                            )
                              return;
                            archiveTemplate(tpl.id);
                          }}
                          title="Убрать в архив"
                        >
                          В архив
                        </button>
                      ) : null}

                      <button
                        type="button"
                        disabled={isBaseline || used > 0 || isArchived}
                        className="rounded-md border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        onClick={() => {
                          if (!window.confirm("Удалить шаблон?")) return;
                          deleteTemplate(tpl.id);
                        }}
                        title={
                          isBaseline
                            ? "Нельзя удалить эталонный шаблон"
                            : used > 0
                            ? "Нельзя удалить шаблон, связанный с заказами"
                            : isArchived
                              ? "Нельзя удалить шаблон из архива"
                              : "Удалить шаблон"
                        }
                      >
                        Удалить
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ProductionStorageDevTools />
    </div>
  );
}

export function ConstructorEditorPage() {
  return (
    <ProductionProvider>
      <ConstructorEditorView
        headerTitle="Конструктор ver1"
        basePath="/admin/konstruktor"
      />
    </ProductionProvider>
  );
}

const STAGE_TYPE_ORDER: Array<StageTemplate["type"]> = [
  "registration",
  "production",
  "quality_control",
  "release",
];

const STAGE_TYPE_LABEL: Record<StageTemplate["type"], string> = {
  registration: "Регистрация биоматериала",
  production: "Производство",
  quality_control: "Контроль качества",
  release: "Выдача",
};

export function ConstructorEditorView({
  headerTitle,
  basePath,
  stageTypeOrder = STAGE_TYPE_ORDER,
  stageTypeLabel = STAGE_TYPE_LABEL,
  allowGroupsByStageType,
}: {
  headerTitle: string;
  basePath: string;
  stageTypeOrder?: Array<StageTemplate["type"]>;
  stageTypeLabel?: Partial<Record<StageTemplate["type"], string>>;
  allowGroupsByStageType?: Partial<Record<StageTemplate["type"], boolean>>;
}) {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const { templates, updateTemplate, createTemplate, orders } = useProduction();
  const didAutoCreateRef = useRef(false);
  const [editingStepById, setEditingStepById] = useState<Record<string, boolean>>(
    {},
  );
  const [editingGroupById, setEditingGroupById] = useState<Record<string, boolean>>(
    {},
  );
  const [editingFieldById, setEditingFieldById] = useState<Record<string, boolean>>(
    {},
  );
  const [editingActionById, setEditingActionById] = useState<Record<string, boolean>>(
    {},
  );
  const [collapsedStepById, setCollapsedStepById] = useState<
    Record<string, boolean>
  >({});
  const [addConsumableByStepId, setAddConsumableByStepId] = useState<
    Record<string, boolean>
  >({});
  const [consumableSearchByStepId, setConsumableSearchByStepId] = useState<
    Record<string, string>
  >({});
  const [addEquipmentByStepId, setAddEquipmentByStepId] = useState<
    Record<string, boolean>
  >({});
  const [equipmentSearchByStepId, setEquipmentSearchByStepId] = useState<
    Record<string, string>
  >({});
  const [activeStageType, setActiveStageType] = useState<
    StageTemplate["type"]
  >("registration");

  useEffect(() => {
    if (templateId) return;
    if (didAutoCreateRef.current) return;
    didAutoCreateRef.current = true;
    const created = createTemplate("Новый шаблон");
    navigate(`${basePath}/${created.id}`, { replace: true });
  }, [templateId, createTemplate, navigate, basePath]);

  const template = useMemo(
    () => templates.find((t) => t.id === templateId) ?? null,
    [templates, templateId],
  );

  const orderedStages = useMemo(() => {
    if (!template) return [] as StageTemplate[];
    const byType = new Map(template.stages.map((s) => [s.type, s]));
    return stageTypeOrder.map((type) => byType.get(type)).filter(
      Boolean,
    ) as StageTemplate[];
  }, [template, stageTypeOrder]);

  const allowGroups = (type: StageTemplate["type"]) =>
    allowGroupsByStageType?.[type] ?? true;

  useEffect(() => {
    if (!template) return;
    const allowed = new Set(orderedStages.map((s) => s.type));
    if (!allowed.has(activeStageType)) {
      setActiveStageType(orderedStages[0]?.type ?? "registration");
    }
  }, [template?.id, orderedStages, activeStageType, template]);

  if (!template) {
    return (
      <div className="p-6 md:p-8">
        <p className="text-sm text-slate-500">Шаблон не найден.</p>
      </div>
    );
  }

  const used = orders.filter((o) => o.templateId === template.id).length;
  const isArchived = Boolean(template.archivedAt);
  const locked = isArchived || used > 0;
  if (locked) {
    return (
      <div className="p-6 md:p-8">
        <div className="mb-4 flex items-center gap-3">
          <Link
            to={basePath}
            className="text-sm text-slate-500 transition hover:text-slate-700"
            title="К списку шаблонов"
          >
            ← Назад
          </Link>
        </div>
        <div className="max-w-2xl rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-sm font-semibold text-slate-800">
            {template.name}
          </div>
          <div className="mt-1 text-sm text-slate-600">
            {isArchived
              ? "Шаблон находится в архиве — редактирование и удаление запрещены."
              : `Шаблон используется в заказах (${used}) — редактирование и удаление запрещены. При необходимости уберите его в архив из списка шаблонов.`}
          </div>
        </div>
      </div>
    );
  }

  const patchTemplate = (updater: (prev: ProcessTemplate) => ProcessTemplate) => {
    updateTemplate(updater(template));
  };

  const patchStage = (stageId: string, updater: (prev: StageTemplate) => StageTemplate) => {
    patchTemplate((prev) => ({
      ...prev,
      stages: prev.stages.map((s) => (s.id === stageId ? updater(s) : s)),
    }));
  };

  const patchStep = (
    stageId: string,
    stepId: string,
    updater: (prev: StepTemplate) => StepTemplate,
  ) => {
    patchStage(stageId, (prev) => ({
      ...prev,
      steps: prev.steps.map((s) => (s.id === stepId ? updater(s) : s)),
    }));
  };

  const addStep = (stage: StageTemplate) => {
    const newStepId = uid("step");
    patchStage(stage.id, (prev) => {
      const nextStep: StepTemplate = {
        id: newStepId,
        name: "",
        sopActions: [],
        actions: [],
        groups: [],
        fields: [],
        consumables: [],
        equipment: [],
        hasDeviations: true,
      };
      return { ...prev, steps: [...prev.steps, nextStep] };
    });
    setEditingStepById((prev) => ({ ...prev, [newStepId]: true }));
  };

  const removeStep = (stage: StageTemplate, stepId: string) => {
    patchStage(stage.id, (prev) => ({
      ...prev,
      steps: prev.steps.filter((s) => s.id !== stepId),
    }));
    setEditingStepById((prev) => {
      if (!(stepId in prev)) return prev;
      const next = { ...prev };
      delete next[stepId];
      return next;
    });
  };

  const renameStep = (stage: StageTemplate, stepId: string, name: string) => {
    patchStep(stage.id, stepId, (prev) => ({ ...prev, name }));
  };

  const setStepPdf = async (stage: StageTemplate, stepId: string, file: File) => {
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      window.alert("Можно прикрепить только PDF-файл.");
      return;
    }
    const dataUrl = await readFileAsDataUrl(file);
    patchStep(stage.id, stepId, (prev) => ({
      ...prev,
      attachmentPdf: { fileName: file.name, dataUrl },
    }));
  };

  const removeStepPdf = (stage: StageTemplate, stepId: string) => {
    patchStep(stage.id, stepId, (prev) => ({ ...prev, attachmentPdf: undefined }));
  };

  const setStepEditing = (stepId: string, editing: boolean) => {
    setEditingStepById((prev) => {
      if ((prev[stepId] ?? false) === editing) return prev;
      return { ...prev, [stepId]: editing };
    });
  };

  const addGroup = (stage: StageTemplate, step: StepTemplate) => {
    const groupId = uid("grp");
    patchStep(stage.id, step.id, (prev) => {
      const nextGroups = [...(prev.groups ?? [])];
      const nextIndex = nextGroups.length + 1;
      const nextGroup: StepGroupTemplate = {
        id: groupId,
        name: `Группа ${nextIndex}`,
        attachmentPdf: undefined,
        fields: [],
      };
      nextGroups.push(nextGroup);
      return { ...prev, groups: nextGroups };
    });
    setEditingGroupById((prev) => ({ ...prev, [groupId]: true }));
  };

  const setGroupEditing = (groupId: string, editing: boolean) => {
    setEditingGroupById((prev) => {
      if ((prev[groupId] ?? false) === editing) return prev;
      return { ...prev, [groupId]: editing };
    });
  };

  const removeGroup = (stage: StageTemplate, stepId: string, groupId: string) => {
    patchStep(stage.id, stepId, (prev) => ({
      ...prev,
      groups: (prev.groups ?? []).filter((g) => g.id !== groupId),
    }));
    setEditingGroupById((prev) => {
      if (!(groupId in prev)) return prev;
      const next = { ...prev };
      delete next[groupId];
      return next;
    });
    setEditingFieldById((prev) => {
      // Best-effort cleanup: if no fields for removed group are in map, noop.
      // (We don't have a reverse index here; leaving extra keys is harmless.)
      return prev;
    });
  };

  const renameGroup = (
    stage: StageTemplate,
    stepId: string,
    groupId: string,
    name: string,
  ) => {
    patchStep(stage.id, stepId, (prev) => ({
      ...prev,
      groups: (prev.groups ?? []).map((g) => (g.id === groupId ? { ...g, name } : g)),
    }));
  };

  const setGroupPdf = async (
    stage: StageTemplate,
    stepId: string,
    groupId: string,
    file: File,
  ) => {
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      window.alert("Можно прикрепить только PDF-файл.");
      return;
    }
    const dataUrl = await readFileAsDataUrl(file);
    patchStep(stage.id, stepId, (prev) => ({
      ...prev,
      groups: (prev.groups ?? []).map((g) =>
        g.id === groupId ? { ...g, attachmentPdf: { fileName: file.name, dataUrl } } : g,
      ),
    }));
  };

  const removeGroupPdf = (stage: StageTemplate, stepId: string, groupId: string) => {
    patchStep(stage.id, stepId, (prev) => ({
      ...prev,
      groups: (prev.groups ?? []).map((g) =>
        g.id === groupId ? { ...g, attachmentPdf: undefined } : g,
      ),
    }));
  };

  const addGroupField = (stage: StageTemplate, stepId: string, groupId: string) => {
    const fieldId = uid("fld");
    patchStep(stage.id, stepId, (prev) => ({
      ...prev,
      groups: (prev.groups ?? []).map((g) => {
        if (g.id !== groupId) return g;
        const nextField: FieldDefinition = {
          id: fieldId,
          label: "",
          type: "text",
          required: false,
        };
        return { ...g, fields: [...(g.fields ?? []), nextField] };
      }),
    }));
    setEditingFieldById((prev) => ({ ...prev, [fieldId]: true }));
  };

  const patchGroupField = (
    stage: StageTemplate,
    stepId: string,
    groupId: string,
    fieldId: string,
    updater: (prev: FieldDefinition) => FieldDefinition,
  ) => {
    patchStep(stage.id, stepId, (prev) => ({
      ...prev,
      groups: (prev.groups ?? []).map((g) => {
        if (g.id !== groupId) return g;
        return {
          ...g,
          fields: (g.fields ?? []).map((f) => (f.id === fieldId ? updater(f) : f)),
        };
      }),
    }));
  };

  const removeGroupField = (
    stage: StageTemplate,
    stepId: string,
    groupId: string,
    fieldId: string,
  ) => {
    patchStep(stage.id, stepId, (prev) => ({
      ...prev,
      groups: (prev.groups ?? []).map((g) => {
        if (g.id !== groupId) return g;
        return { ...g, fields: (g.fields ?? []).filter((f) => f.id !== fieldId) };
      }),
    }));
    setEditingFieldById((prev) => {
      if (!(fieldId in prev)) return prev;
      const next = { ...prev };
      delete next[fieldId];
      return next;
    });
  };

  const setFieldEditing = (fieldId: string, editing: boolean) => {
    setEditingFieldById((prev) => {
      if ((prev[fieldId] ?? false) === editing) return prev;
      return { ...prev, [fieldId]: editing };
    });
  };

  const addAction = (stage: StageTemplate, stepId: string) => {
    const actionId = uid("act");
    patchStep(stage.id, stepId, (prev) => {
      const nextAction: EditableStepActionTemplate = {
        id: actionId,
        text: "",
        required: true,
        input: null,
      };
      return {
        ...prev,
        actions: [...((prev.actions ?? []) as EditableStepActionTemplate[]), nextAction],
      };
    });
    setEditingActionById((prev) => ({ ...prev, [actionId]: true }));
  };

  const patchAction = (
    stage: StageTemplate,
    stepId: string,
    actionId: string,
    updater: (prev: EditableStepActionTemplate) => EditableStepActionTemplate,
  ) => {
    patchStep(stage.id, stepId, (prev) => ({
      ...prev,
      actions: ((prev.actions ?? []) as EditableStepActionTemplate[]).map((a) =>
        a.id === actionId ? updater(a) : a,
      ),
    }));
  };

  const removeAction = (stage: StageTemplate, stepId: string, actionId: string) => {
    patchStep(stage.id, stepId, (prev) => ({
      ...prev,
      actions: (prev.actions ?? []).filter((a) => a.id !== actionId),
    }));
    setEditingActionById((prev) => {
      if (!(actionId in prev)) return prev;
      const next = { ...prev };
      delete next[actionId];
      return next;
    });
  };

  const setActionEditing = (actionId: string, editing: boolean) => {
    setEditingActionById((prev) => {
      if ((prev[actionId] ?? false) === editing) return prev;
      return { ...prev, [actionId]: editing };
    });
  };

  const toggleStepConsumable = (
    stage: StageTemplate,
    stepId: string,
    consumableId: string,
    checked: boolean,
  ) => {
    const item = ACTION_CONSUMABLE_CATALOG.find((c) => c.id === consumableId);
    if (!item) return;
    patchStep(stage.id, stepId, (prev) => {
      const list = prev.consumables ?? [];
      const exists = list.some((x) => x.id === consumableId);
      const next = checked
        ? exists
          ? list
          : [...list, { id: item.id, name: item.name, unit: "шт" }]
        : list.filter((x) => x.id !== consumableId);
      return { ...prev, consumables: next };
    });
  };

  const toggleStepEquipment = (
    stage: StageTemplate,
    stepId: string,
    equipmentId: string,
    checked: boolean,
  ) => {
    const item = STEP_EQUIPMENT_CATALOG.find((c) => c.id === equipmentId);
    if (!item) return;
    patchStep(stage.id, stepId, (prev) => {
      const list = prev.equipment ?? [];
      const exists = list.some((x) => x.id === equipmentId);
      const next = checked
        ? exists
          ? list
          : [...list, { id: item.id, name: item.name }]
        : list.filter((x) => x.id !== equipmentId);
      return { ...prev, equipment: next };
    });
  };

  const openConsumablePicker = (stepId: string) => {
    setAddConsumableByStepId((prev) => ({ ...prev, [stepId]: true }));
    setConsumableSearchByStepId((prev) => ({ ...prev, [stepId]: "" }));
  };

  const closeConsumablePicker = (stepId: string) => {
    setAddConsumableByStepId((prev) => ({ ...prev, [stepId]: false }));
    setConsumableSearchByStepId((prev) => ({ ...prev, [stepId]: "" }));
  };

  const openEquipmentPicker = (stepId: string) => {
    setAddEquipmentByStepId((prev) => ({ ...prev, [stepId]: true }));
    setEquipmentSearchByStepId((prev) => ({ ...prev, [stepId]: "" }));
  };

  const closeEquipmentPicker = (stepId: string) => {
    setAddEquipmentByStepId((prev) => ({ ...prev, [stepId]: false }));
    setEquipmentSearchByStepId((prev) => ({ ...prev, [stepId]: "" }));
  };

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <Link
            to={basePath}
            className="text-sm text-slate-500 transition hover:text-slate-700"
            title="К списку шаблонов"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </Link>
          <h1 className="text-xl font-semibold text-slate-800">
            {headerTitle}
          </h1>
        </div>
        <div className="mt-3 max-w-xl">
          <label className="text-xs font-medium text-slate-600">
            Название шаблона
            <input
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-800"
              value={template.name}
              onChange={(e) =>
                patchTemplate((prev) => ({ ...prev, name: e.target.value }))
              }
            />
          </label>
        </div>
      </div>

      <Tab.Group
        selectedIndex={Math.max(
          0,
          orderedStages.findIndex((s) => s.type === activeStageType),
        )}
        onChange={(idx) => {
          const next = orderedStages[idx];
          if (next) setActiveStageType(next.type);
        }}
      >
        <Tab.List className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
          {orderedStages.map((stage) => (
            <Tab
              key={stage.id}
              className={({ selected }) =>
                [
                  "rounded-md px-3 py-2 text-sm font-medium outline-none transition",
                  selected
                    ? "bg-blue-600 text-white"
                    : "text-slate-700 hover:bg-slate-100",
                ].join(" ")
              }
            >
              <span>{stageTypeLabel[stage.type] ?? stage.name}</span>
              <span className="ml-2 text-xs opacity-80">
                {formatStepCount(stage.steps.length)}
              </span>
            </Tab>
          ))}
        </Tab.List>

        <Tab.Panels className="pt-4">
          {orderedStages.map((stage) => (
            <Tab.Panel key={stage.id}>
              <div className="space-y-3">
                {stage.steps.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-600">
                    Добавьте первый шаг.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {stage.steps.map((step, idx) => (
                      <div
                        key={step.id}
                        className="rounded-lg border border-slate-200 bg-white p-3"
                      >
                        {(() => {
                          const isEditing = editingStepById[step.id] ?? false;
                          const isCollapsed = collapsedStepById[step.id] ?? false;
                          return (
                            <div className="space-y-3">
                              <div
                                role="button"
                                tabIndex={0}
                                className={[
                                  "flex flex-wrap items-center justify-between gap-2 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60",
                                  isEditing ? "cursor-default" : "cursor-pointer",
                                ].join(" ")}
                                aria-expanded={!isCollapsed || isEditing}
                                onClick={() => {
                                  if (isEditing) return;
                                  setCollapsedStepById((prev) => ({
                                    ...prev,
                                    [step.id]: !(prev[step.id] ?? false),
                                  }));
                                }}
                                onKeyDown={(e) => {
                                  if (isEditing) return;
                                  if (e.key !== "Enter" && e.key !== " ") return;
                                  e.preventDefault();
                                  setCollapsedStepById((prev) => ({
                                    ...prev,
                                    [step.id]: !(prev[step.id] ?? false),
                                  }));
                                }}
                                title="Свернуть/развернуть шаг"
                              >
                                <div className="flex min-w-0 items-center gap-2 text-sm font-semibold text-slate-800">
                                  <svg
                                    className={[
                                      "size-4 shrink-0 text-slate-400 transition",
                                      isCollapsed && !isEditing ? "-rotate-90" : "",
                                    ].join(" ")}
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                    aria-hidden="true"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                  <span className="text-xs font-semibold text-slate-500">
                                    Шаг {idx + 1}
                                  </span>
                                  <span className="min-w-0 truncate">{step.name}</span>
                                  {step.attachmentPdf ? (
                                    <a
                                      href={step.attachmentPdf.dataUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="ml-1 inline-flex items-center text-xs font-medium text-blue-700 underline decoration-blue-300 underline-offset-2 hover:text-blue-900"
                                      onClick={(e) => e.stopPropagation()}
                                      title="Открыть PDF в новой вкладке"
                                    >
                                      {step.attachmentPdf.fileName}
                                    </a>
                                  ) : null}
                                </div>

                                    <div className="flex items-center gap-2">
                                      <button
                                        type="button"
                                        className="rounded-md border border-slate-300 bg-white p-2 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setStepEditing(step.id, !isEditing);
                                        }}
                                        aria-label={isEditing ? "Скрыть редактирование шага" : "Редактировать шаг"}
                                        title={isEditing ? "Скрыть" : "Редактировать"}
                                      >
                                        <svg
                                          className="size-4"
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          stroke="currentColor"
                                          strokeWidth="2"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          aria-hidden
                                        >
                                          <path d="M12 20h9" />
                                          <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                                        </svg>
                                      </button>
                                      <button
                                        type="button"
                                        className="rounded-md border border-red-300 bg-white p-2 text-red-700 hover:bg-red-50"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          removeStep(stage, step.id);
                                        }}
                                        aria-label="Удалить шаг"
                                        title="Удалить"
                                      >
                                        <svg
                                          className="size-4"
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          stroke="currentColor"
                                          strokeWidth="2"
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          aria-hidden
                                        >
                                          <path d="M3 6h18" />
                                          <path d="M8 6V4h8v2" />
                                          <path d="M19 6l-1 14H6L5 6" />
                                          <path d="M10 11v6" />
                                          <path d="M14 11v6" />
                                        </svg>
                                      </button>
                                    </div>
                                  </div>

                                  {isCollapsed && !isEditing ? null : isEditing ? (
                                    <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3">
                                      <div className="grid gap-3 md:grid-cols-2">
                                        <label className="block text-xs font-medium text-slate-600">
                                          Наименование шага
                                          <input
                                            className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
                                            value={step.name}
                                            placeholder="Введите наименование…"
                                            onChange={(e) =>
                                              renameStep(stage, step.id, e.target.value)
                                            }
                                          />
                                        </label>

                                        <div>
                                          <div className="text-xs font-medium text-slate-600">
                                            Вложение (PDF)
                                          </div>
                                          {step.attachmentPdf ? (
                                            <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                                              <div className="min-w-0 text-sm text-slate-700">
                                                <a
                                                  href={step.attachmentPdf.dataUrl}
                                                  target="_blank"
                                                  rel="noreferrer"
                                                  className="truncate text-blue-700 underline decoration-blue-300 underline-offset-2 hover:text-blue-900"
                                                  title="Открыть PDF в новой вкладке"
                                                >
                                                  {step.attachmentPdf.fileName}
                                                </a>
                                              </div>
                                              <div className="flex items-center gap-2">
                                                <button
                                                  type="button"
                                                  className="rounded-md border border-red-300 bg-white p-2 text-red-700 hover:bg-red-50"
                                                  onClick={() => removeStepPdf(stage, step.id)}
                                                  aria-label="Удалить PDF"
                                                  title="Удалить PDF"
                                                >
                                                  <svg
                                                    className="size-4"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    aria-hidden
                                                  >
                                                    <path d="M3 6h18" />
                                                    <path d="M8 6V4h8v2" />
                                                    <path d="M19 6l-1 14H6L5 6" />
                                                    <path d="M10 11v6" />
                                                    <path d="M14 11v6" />
                                                  </svg>
                                                </button>
                                              </div>
                                            </div>
                                          ) : (
                                            <input
                                              type="file"
                                              accept="application/pdf,.pdf"
                                              className="mt-1 block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border file:border-slate-300 file:bg-white file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-slate-700 hover:file:bg-slate-50"
                                              onChange={(e) => {
                                                const f = e.target.files?.[0];
                                                if (!f) return;
                                                void setStepPdf(stage, step.id, f);
                                                e.currentTarget.value = "";
                                              }}
                                            />
                                          )}
                                        </div>
                                      </div>

                                      <div className="mt-3 flex justify-end">
                                        <button
                                          type="button"
                                          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                                          onClick={() => setStepEditing(step.id, false)}
                                        >
                                          Сохранить
                                        </button>
                                      </div>
                                    </div>
                                  ) : stage.type === "production" ? (
                                    <div className="space-y-3">
                                      <div className="rounded-lg border border-slate-200 bg-slate-50/40 p-3">
                                        <div className="mb-2 text-sm font-semibold text-slate-800">
                                          Действия
                                        </div>
                                        {(step.actions ?? []).length === 0 ? (
                                        <div className="mt-3 rounded-md border border-dashed border-slate-200 bg-white px-3 py-4 text-sm text-slate-600">
                                          Действий пока нет.
                                        </div>
                                      ) : (
                                        <div className="mt-3 space-y-2">
                                          {(step.actions ?? []).map((action, aIdx) => {
                                            const a = action as EditableStepActionTemplate;
                                            const isActionEditing =
                                              editingActionById[action.id] ?? false;
                                            return (
                                              <div
                                                key={action.id}
                                                className="rounded-md border border-slate-200 bg-white p-3"
                                              >
                                                <div className="flex flex-wrap items-center justify-between gap-2">
                                                  <div className="min-w-0 text-sm font-semibold text-slate-800">
                                                    <span className="mr-2 text-xs font-semibold text-slate-500">
                                                      Действие {aIdx + 1}
                                                    </span>
                                                    <span className="truncate">
                                                      {a.text.trim() ? a.text : "—"}
                                                    </span>
                                                    {a.input ? (
                                                      <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
                                                        поле:{" "}
                                                        {a.input.label.trim()
                                                          ? a.input.label.trim()
                                                          : "без названия"}
                                                      </span>
                                                    ) : null}
                                                  </div>

                                                  <div className="flex items-center gap-2">
                                                    <button
                                                      type="button"
                                                      className="rounded-md border border-slate-300 bg-white p-2 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                                      onClick={() =>
                                                        setActionEditing(
                                                          action.id,
                                                          !isActionEditing,
                                                        )
                                                      }
                                                      aria-label={
                                                        isActionEditing
                                                          ? "Скрыть редактирование действия"
                                                          : "Редактировать действие"
                                                      }
                                                      title={
                                                        isActionEditing
                                                          ? "Скрыть"
                                                          : "Редактировать"
                                                      }
                                                    >
                                                      <svg
                                                        className="size-4"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="2"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        aria-hidden
                                                      >
                                                        <path d="M12 20h9" />
                                                        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                                                      </svg>
                                                    </button>
                                                    <button
                                                      type="button"
                                                      className="rounded-md border border-red-300 bg-white p-2 text-red-700 hover:bg-red-50"
                                                      onClick={() =>
                                                        removeAction(
                                                          stage,
                                                          step.id,
                                                          action.id,
                                                        )
                                                      }
                                                      aria-label="Удалить действие"
                                                      title="Удалить"
                                                    >
                                                      <svg
                                                        className="size-4"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="2"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        aria-hidden
                                                      >
                                                        <path d="M3 6h18" />
                                                        <path d="M8 6V4h8v2" />
                                                        <path d="M19 6l-1 14H6L5 6" />
                                                        <path d="M10 11v6" />
                                                        <path d="M14 11v6" />
                                                      </svg>
                                                    </button>
                                                  </div>
                                                </div>

                                                {isActionEditing ? (
                                                  <div className="mt-3 rounded-md border border-slate-200 bg-slate-50/50 p-3">
                                                    <label className="block text-xs font-medium text-slate-600">
                                                      Текст действия
                                                      <textarea
                                                        className="mt-1 min-h-[4.5rem] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
                                                        value={a.text}
                                                        placeholder="Введите текст действия…"
                                                        onChange={(e) =>
                                                          patchAction(
                                                            stage,
                                                            step.id,
                                                            action.id,
                                                            (prev) => ({
                                                              ...prev,
                                                              text: e.target.value,
                                                            }),
                                                          )
                                                        }
                                                      />
                                                    </label>

                                                    <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
                                                      <div className="flex flex-col items-start gap-2">
                                                        <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                                                      <input
                                                        type="checkbox"
                                                        className="h-4 w-4 rounded border-slate-300 text-blue-600"
                                                        checked={a.required ?? true}
                                                        onChange={(e) =>
                                                          patchAction(
                                                            stage,
                                                            step.id,
                                                            action.id,
                                                            (prev) => ({
                                                              ...prev,
                                                              required: e.target.checked,
                                                            }),
                                                          )
                                                        }
                                                      />
                                                      Обязательное
                                                    </label>

                                                        {!a.input ? (
                                                          <button
                                                            type="button"
                                                            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                                                            onClick={() =>
                                                              patchAction(
                                                                stage,
                                                                step.id,
                                                                action.id,
                                                                (prev) => ({
                                                                  ...prev,
                                                                  input: {
                                                                    label:
                                                                      prev.input
                                                                        ?.label ??
                                                                      "",
                                                                    type:
                                                                      prev.input
                                                                        ?.type ??
                                                                      "text",
                                                                  },
                                                                }),
                                                              )
                                                            }
                                                          >
                                                            + Поле ввода
                                                          </button>
                                                        ) : null}
                                                      </div>

                                                    </div>

                                                    {a.input ? (
                                                      <div className="mt-3 grid gap-3 md:grid-cols-2">
                                                        <label className="block text-xs font-medium text-slate-600">
                                                          Label поля
                                                          <input
                                                            className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
                                                            value={a.input.label}
                                                            placeholder="Например: Объём"
                                                            onChange={(e) =>
                                                              patchAction(
                                                                stage,
                                                                step.id,
                                                                action.id,
                                                                (prev) => ({
                                                                  ...prev,
                                                                  input: prev.input
                                                                    ? {
                                                                        ...prev.input,
                                                                        label:
                                                                          e.target
                                                                            .value,
                                                                      }
                                                                    : {
                                                                        label:
                                                                          e.target
                                                                            .value,
                                                                        type: "text",
                                                                      },
                                                                }),
                                                              )
                                                            }
                                                          />
                                                        </label>

                                                        <div>
                                                          <div className="text-xs font-medium text-slate-600">
                                                            Тип
                                                          </div>
                                                          <div className="mt-1 flex items-center gap-2">
                                                            <select
                                                              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
                                                              value={a.input.type}
                                                              onChange={(e) =>
                                                                patchAction(
                                                                  stage,
                                                                  step.id,
                                                                  action.id,
                                                                  (prev) => ({
                                                                    ...prev,
                                                                    input: prev.input
                                                                      ? {
                                                                          ...prev.input,
                                                                          type: e.target
                                                                            .value as ActionInputConfig["type"],
                                                                        }
                                                                      : {
                                                                          label: "",
                                                                          type: e.target
                                                                            .value as ActionInputConfig["type"],
                                                                        },
                                                                  }),
                                                                )
                                                              }
                                                            >
                                                              <option value="text">
                                                                text
                                                              </option>
                                                              <option value="number">
                                                                number
                                                              </option>
                                                            </select>
                                                            <button
                                                              type="button"
                                                              className="rounded-md border border-red-300 bg-white p-2 text-red-700 hover:bg-red-50"
                                                              onClick={() =>
                                                                patchAction(
                                                                  stage,
                                                                  step.id,
                                                                  action.id,
                                                                  (prev) => ({
                                                                    ...prev,
                                                                    input: null,
                                                                  }),
                                                                )
                                                              }
                                                              aria-label="Удалить поле ввода"
                                                              title="Удалить поле ввода"
                                                            >
                                                              <svg
                                                                className="size-4"
                                                                viewBox="0 0 24 24"
                                                                fill="none"
                                                                stroke="currentColor"
                                                                strokeWidth="2"
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                aria-hidden
                                                              >
                                                                <path d="M3 6h18" />
                                                                <path d="M8 6V4h8v2" />
                                                                <path d="M19 6l-1 14H6L5 6" />
                                                                <path d="M10 11v6" />
                                                                <path d="M14 11v6" />
                                                              </svg>
                                                            </button>
                                                          </div>
                                                        </div>
                                                      </div>
                                                    ) : null}

                                                    <div className="mt-3 flex justify-end">
                                                      <button
                                                        type="button"
                                                        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                                                        onClick={() =>
                                                          setActionEditing(
                                                            action.id,
                                                            false,
                                                          )
                                                        }
                                                      >
                                                        Сохранить
                                                      </button>
                                                    </div>
                                                  </div>
                                                ) : null}
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}

                                      <div className="mt-3">
                                        <button
                                          type="button"
                                          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                                          onClick={() => addAction(stage, step.id)}
                                        >
                                          + Действие
                                        </button>
                                      </div>
                                      </div>

                                      <div className="rounded-lg border border-slate-200 bg-slate-50/40 p-3">
                                        <div className="mb-2 text-sm font-semibold text-slate-800">
                                          Расходные материалы и материалы
                                        </div>
                                        {step.consumables.length === 0 ? (
                                          <div className="rounded-md border border-dashed border-slate-200 bg-white px-3 py-4 text-sm text-slate-600">
                                            Расходные материалы не добавлены.
                                          </div>
                                        ) : (
                                          <div className="space-y-2">
                                            {step.consumables.map((c) => (
                                              <div
                                                key={c.id}
                                                className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                                              >
                                                <span className="truncate">{c.name}</span>
                                                <button
                                                  type="button"
                                                  className="rounded-md border border-red-300 bg-white p-2 text-red-700 hover:bg-red-50"
                                                  onClick={() =>
                                                    toggleStepConsumable(
                                                      stage,
                                                      step.id,
                                                      c.id,
                                                      false,
                                                    )
                                                  }
                                                  aria-label="Удалить расходный материал"
                                                  title="Удалить"
                                                >
                                                  <svg
                                                    className="size-4"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    aria-hidden
                                                  >
                                                    <path d="M3 6h18" />
                                                    <path d="M8 6V4h8v2" />
                                                    <path d="M19 6l-1 14H6L5 6" />
                                                    <path d="M10 11v6" />
                                                    <path d="M14 11v6" />
                                                  </svg>
                                                </button>
                                              </div>
                                            ))}
                                          </div>
                                        )}

                                        {addConsumableByStepId[step.id] ? (
                                          <div className="mt-3">
                                            <Combobox
                                              value={null}
                                              onChange={(item: { id: string; name: string } | null) => {
                                                if (!item) return;
                                                toggleStepConsumable(
                                                  stage,
                                                  step.id,
                                                  item.id,
                                                  true,
                                                );
                                                closeConsumablePicker(step.id);
                                              }}
                                            >
                                              <div className="relative">
                                                <Combobox.Input
                                                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 pr-9 text-sm outline-none transition focus:border-blue-400"
                                                  placeholder="Начните вводить…"
                                                  onChange={(e) =>
                                                    setConsumableSearchByStepId((prev) => ({
                                                      ...prev,
                                                      [step.id]: e.target.value,
                                                    }))
                                                  }
                                                />
                                                <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600">
                                                  <svg
                                                    className="h-4 w-4"
                                                    viewBox="0 0 20 20"
                                                    fill="currentColor"
                                                    aria-hidden="true"
                                                  >
                                                    <path
                                                      fillRule="evenodd"
                                                      d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
                                                      clipRule="evenodd"
                                                    />
                                                  </svg>
                                                </Combobox.Button>
                                                <Combobox.Options className="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 text-sm shadow-lg focus:outline-none">
                                                  {(() => {
                                                    const q =
                                                      (consumableSearchByStepId[step.id] ?? "")
                                                        .trim()
                                                        .toLowerCase();
                                                    const selected = new Set(
                                                      step.consumables.map((x) => x.id),
                                                    );
                                                    const filtered = ACTION_CONSUMABLE_CATALOG.filter(
                                                      (c) =>
                                                        !selected.has(c.id) &&
                                                        (!q ||
                                                          c.name.toLowerCase().includes(q)),
                                                    );
                                                    if (filtered.length === 0) {
                                                      return (
                                                        <div className="px-3 py-2 text-slate-500">
                                                          Ничего не найдено.
                                                        </div>
                                                      );
                                                    }
                                                    return filtered.map((c) => (
                                                      <Combobox.Option
                                                        key={c.id}
                                                        value={c}
                                                        className={({ active }) =>
                                                          `cursor-pointer select-none px-3 py-2 ${
                                                            active
                                                              ? "bg-blue-600 text-white"
                                                              : "text-slate-700"
                                                          }`
                                                        }
                                                      >
                                                        <span className="font-medium">
                                                          {c.name}
                                                        </span>
                                                      </Combobox.Option>
                                                    ));
                                                  })()}
                                                </Combobox.Options>
                                              </div>
                                            </Combobox>

                                            <div className="mt-2">
                                              <button
                                                type="button"
                                                className="text-sm font-medium text-slate-600 underline decoration-slate-300 underline-offset-2 hover:text-slate-900"
                                                onClick={() => closeConsumablePicker(step.id)}
                                              >
                                                Отмена
                                              </button>
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="mt-3">
                                            <button
                                              type="button"
                                              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                                              onClick={() => openConsumablePicker(step.id)}
                                            >
                                              + Добавить расходный материал
                                            </button>
                                          </div>
                                        )}
                                      </div>

                                      <div className="rounded-lg border border-slate-200 bg-slate-50/40 p-3">
                                        <div className="mb-2 text-sm font-semibold text-slate-800">
                                          Оборудование
                                        </div>
                                        {step.equipment.length === 0 ? (
                                          <div className="rounded-md border border-dashed border-slate-200 bg-white px-3 py-4 text-sm text-slate-600">
                                            Оборудование не добавлено.
                                          </div>
                                        ) : (
                                          <div className="space-y-2">
                                            {step.equipment.map((eq) => (
                                              <div
                                                key={eq.id}
                                                className="flex items-center justify-between gap-3 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                                              >
                                                <span className="truncate">{eq.name}</span>
                                                <button
                                                  type="button"
                                                  className="rounded-md border border-red-300 bg-white p-2 text-red-700 hover:bg-red-50"
                                                  onClick={() =>
                                                    toggleStepEquipment(
                                                      stage,
                                                      step.id,
                                                      eq.id,
                                                      false,
                                                    )
                                                  }
                                                  aria-label="Удалить оборудование"
                                                  title="Удалить"
                                                >
                                                  <svg
                                                    className="size-4"
                                                    viewBox="0 0 24 24"
                                                    fill="none"
                                                    stroke="currentColor"
                                                    strokeWidth="2"
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    aria-hidden
                                                  >
                                                    <path d="M3 6h18" />
                                                    <path d="M8 6V4h8v2" />
                                                    <path d="M19 6l-1 14H6L5 6" />
                                                    <path d="M10 11v6" />
                                                    <path d="M14 11v6" />
                                                  </svg>
                                                </button>
                                              </div>
                                            ))}
                                          </div>
                                        )}

                                        {addEquipmentByStepId[step.id] ? (
                                          <div className="mt-3">
                                            <Combobox
                                              value={null}
                                              onChange={(item: { id: string; name: string } | null) => {
                                                if (!item) return;
                                                toggleStepEquipment(
                                                  stage,
                                                  step.id,
                                                  item.id,
                                                  true,
                                                );
                                                closeEquipmentPicker(step.id);
                                              }}
                                            >
                                              <div className="relative">
                                                <Combobox.Input
                                                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 pr-9 text-sm outline-none transition focus:border-blue-400"
                                                  placeholder="Начните вводить…"
                                                  onChange={(e) =>
                                                    setEquipmentSearchByStepId((prev) => ({
                                                      ...prev,
                                                      [step.id]: e.target.value,
                                                    }))
                                                  }
                                                />
                                                <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600">
                                                  <svg
                                                    className="h-4 w-4"
                                                    viewBox="0 0 20 20"
                                                    fill="currentColor"
                                                    aria-hidden="true"
                                                  >
                                                    <path
                                                      fillRule="evenodd"
                                                      d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.24 4.25a.75.75 0 01-1.06 0L5.21 8.29a.75.75 0 01.02-1.08z"
                                                      clipRule="evenodd"
                                                    />
                                                  </svg>
                                                </Combobox.Button>
                                                <Combobox.Options className="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-slate-200 bg-white py-1 text-sm shadow-lg focus:outline-none">
                                                  {(() => {
                                                    const q =
                                                      (equipmentSearchByStepId[step.id] ?? "")
                                                        .trim()
                                                        .toLowerCase();
                                                    const selected = new Set(
                                                      step.equipment.map((x) => x.id),
                                                    );
                                                    const filtered = STEP_EQUIPMENT_CATALOG.filter(
                                                      (c) =>
                                                        !selected.has(c.id) &&
                                                        (!q ||
                                                          c.name.toLowerCase().includes(q)),
                                                    );
                                                    if (filtered.length === 0) {
                                                      return (
                                                        <div className="px-3 py-2 text-slate-500">
                                                          Ничего не найдено.
                                                        </div>
                                                      );
                                                    }
                                                    return filtered.map((c) => (
                                                      <Combobox.Option
                                                        key={c.id}
                                                        value={c}
                                                        className={({ active }) =>
                                                          `cursor-pointer select-none px-3 py-2 ${
                                                            active
                                                              ? "bg-blue-600 text-white"
                                                              : "text-slate-700"
                                                          }`
                                                        }
                                                      >
                                                        <span className="font-medium">
                                                          {c.name}
                                                        </span>
                                                      </Combobox.Option>
                                                    ));
                                                  })()}
                                                </Combobox.Options>
                                              </div>
                                            </Combobox>

                                            <div className="mt-2">
                                              <button
                                                type="button"
                                                className="text-sm font-medium text-slate-600 underline decoration-slate-300 underline-offset-2 hover:text-slate-900"
                                                onClick={() => closeEquipmentPicker(step.id)}
                                              >
                                                Отмена
                                              </button>
                                            </div>
                                          </div>
                                        ) : (
                                          <div className="mt-3">
                                            <button
                                              type="button"
                                              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                                              onClick={() => openEquipmentPicker(step.id)}
                                            >
                                              + Добавить оборудование
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ) : allowGroups(stage.type) ? (
                                    <div className="rounded-lg border border-slate-200 bg-slate-50/40 p-3">
                                      {(step.groups ?? []).length === 0 ? (
                                        <div className="mt-3 rounded-md border border-dashed border-slate-200 bg-white px-3 py-4 text-sm text-slate-600">
                                          Групп пока нет.
                                        </div>
                                      ) : (
                                        <div className="mt-3 space-y-2">
                                          {(step.groups ?? []).map((group, gIdx) => {
                                            const groupEditing =
                                              editingGroupById[group.id] ?? false;
                                            return (
                                              <div
                                                key={group.id}
                                                className="rounded-md border border-slate-200 bg-white p-3"
                                              >
                                                <div className="flex flex-wrap items-center justify-between gap-2">
                                                  <div className="min-w-0 text-sm font-semibold text-slate-800">
                                                    <span className="mr-2 text-xs font-semibold text-slate-500">
                                                      Группа {gIdx + 1}
                                                    </span>
                                                    <span className="truncate">
                                                      {group.name}
                                                    </span>
                                                    {group.attachmentPdf ? (
                                                      <a
                                                        href={group.attachmentPdf.dataUrl}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="ml-3 inline-flex items-center text-xs font-medium text-blue-700 underline decoration-blue-300 underline-offset-2 hover:text-blue-900"
                                                        title="Открыть PDF в новой вкладке"
                                                      >
                                                        {group.attachmentPdf.fileName}
                                                      </a>
                                                    ) : null}
                                                  </div>

                                                  <div className="flex items-center gap-2">
                                                    <button
                                                      type="button"
                                                      className="rounded-md border border-slate-300 bg-white p-2 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                                      onClick={() =>
                                                        setGroupEditing(
                                                          group.id,
                                                          !groupEditing,
                                                        )
                                                      }
                                                      aria-label={
                                                        groupEditing
                                                          ? "Скрыть редактирование группы"
                                                          : "Редактировать группу"
                                                      }
                                                      title={
                                                        groupEditing
                                                          ? "Скрыть"
                                                          : "Редактировать"
                                                      }
                                                    >
                                                      <svg
                                                        className="size-4"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="2"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        aria-hidden
                                                      >
                                                        <path d="M12 20h9" />
                                                        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                                                      </svg>
                                                    </button>
                                                    <button
                                                      type="button"
                                                      className="rounded-md border border-red-300 bg-white p-2 text-red-700 hover:bg-red-50"
                                                      onClick={() =>
                                                        removeGroup(
                                                          stage,
                                                          step.id,
                                                          group.id,
                                                        )
                                                      }
                                                      aria-label="Удалить группу"
                                                      title="Удалить"
                                                    >
                                                      <svg
                                                        className="size-4"
                                                        viewBox="0 0 24 24"
                                                        fill="none"
                                                        stroke="currentColor"
                                                        strokeWidth="2"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                        aria-hidden
                                                      >
                                                        <path d="M3 6h18" />
                                                        <path d="M8 6V4h8v2" />
                                                        <path d="M19 6l-1 14H6L5 6" />
                                                        <path d="M10 11v6" />
                                                        <path d="M14 11v6" />
                                                      </svg>
                                                    </button>
                                                  </div>
                                                </div>

                                                {groupEditing ? (
                                                  <div className="mt-3 rounded-md border border-slate-200 bg-slate-50/50 p-3">
                                                    <div className="grid gap-3 md:grid-cols-2">
                                                      <label className="block text-xs font-medium text-slate-600">
                                                        Наименование группы
                                                        <input
                                                          className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
                                                          value={group.name}
                                                          onChange={(e) =>
                                                            renameGroup(
                                                              stage,
                                                              step.id,
                                                              group.id,
                                                              e.target.value,
                                                            )
                                                          }
                                                        />
                                                      </label>

                                                      <div>
                                                        <div className="text-xs font-medium text-slate-600">
                                                          Вложение (PDF)
                                                        </div>
                                                        {group.attachmentPdf ? (
                                                          <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                                                            <div className="min-w-0 text-sm text-slate-700">
                                                              <a
                                                                href={group.attachmentPdf.dataUrl}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                className="truncate text-blue-700 underline decoration-blue-300 underline-offset-2 hover:text-blue-900"
                                                                title="Открыть PDF в новой вкладке"
                                                              >
                                                                {group.attachmentPdf.fileName}
                                                              </a>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                              <button
                                                                type="button"
                                                                className="rounded-md border border-red-300 bg-white p-2 text-red-700 hover:bg-red-50"
                                                                onClick={() =>
                                                                  removeGroupPdf(
                                                                    stage,
                                                                    step.id,
                                                                    group.id,
                                                                  )
                                                                }
                                                                aria-label="Удалить PDF"
                                                                title="Удалить PDF"
                                                              >
                                                                <svg
                                                                  className="size-4"
                                                                  viewBox="0 0 24 24"
                                                                  fill="none"
                                                                  stroke="currentColor"
                                                                  strokeWidth="2"
                                                                  strokeLinecap="round"
                                                                  strokeLinejoin="round"
                                                                  aria-hidden
                                                                >
                                                                  <path d="M3 6h18" />
                                                                  <path d="M8 6V4h8v2" />
                                                                  <path d="M19 6l-1 14H6L5 6" />
                                                                  <path d="M10 11v6" />
                                                                  <path d="M14 11v6" />
                                                                </svg>
                                                              </button>
                                                            </div>
                                                          </div>
                                                        ) : (
                                                          <input
                                                            type="file"
                                                            accept="application/pdf,.pdf"
                                                            className="mt-1 block w-full text-sm text-slate-600 file:mr-3 file:rounded-md file:border file:border-slate-300 file:bg-white file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-slate-700 hover:file:bg-slate-50"
                                                            onChange={(e) => {
                                                              const f = e.target.files?.[0];
                                                              if (!f) return;
                                                              void setGroupPdf(
                                                                stage,
                                                                step.id,
                                                                group.id,
                                                                f,
                                                              );
                                                              e.currentTarget.value = "";
                                                            }}
                                                          />
                                                        )}
                                                      </div>
                                                    </div>

                                                    <div className="mt-3 flex justify-end">
                                                      <button
                                                        type="button"
                                                        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                                                        onClick={() =>
                                                          setGroupEditing(
                                                            group.id,
                                                            false,
                                                          )
                                                        }
                                                      >
                                                        Сохранить
                                                      </button>
                                                    </div>
                                                  </div>
                                                ) : (
                                                  <div className="mt-3 rounded-md border border-slate-200 bg-slate-50/40 p-3">
                                                    <div className="flex items-center justify-between gap-3">
                                                      <div className="text-sm font-semibold text-slate-800">
                                                        Поля группы
                                                      </div>
                                                      <button
                                                        type="button"
                                                        className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                                                        onClick={() =>
                                                          addGroupField(
                                                            stage,
                                                            step.id,
                                                            group.id,
                                                          )
                                                        }
                                                      >
                                                        + Поле
                                                      </button>
                                                    </div>

                                                    {(group.fields ?? []).length === 0 ? (
                                                      <div className="mt-3 rounded-md border border-dashed border-slate-200 bg-white px-3 py-4 text-sm text-slate-600">
                                                        Полей пока нет.
                                                      </div>
                                                    ) : (
                                                      <div className="mt-3 space-y-2">
                                                        {(group.fields ?? []).map((field, fieldIdx) => {
                                                          const isFieldEditing =
                                                            editingFieldById[field.id] ?? false;
                                                          const typeLabel =
                                                            GROUP_FIELD_TYPE_OPTIONS.find(
                                                              (x) => x.value === field.type,
                                                            )?.label ?? field.type;
                                                          return (
                                                          <div
                                                            key={field.id}
                                                            className="rounded-md border border-slate-200 bg-white p-3"
                                                          >
                                                            <div className="flex flex-wrap items-center justify-between gap-2">
                                                              <div className="min-w-0 text-sm font-semibold text-slate-800">
                                                                <span className="mr-2 text-xs font-semibold text-slate-500">
                                                                  Поле {fieldIdx + 1}
                                                                </span>
                                                                <span className="truncate">
                                                                  {field.label || "—"}
                                                                </span>
                                                                <span className="ml-2 text-xs font-semibold text-slate-500">
                                                                  · {typeLabel}
                                                                </span>
                                                              </div>

                                                              <div className="flex items-center gap-2">
                                                                <button
                                                                  type="button"
                                                                  className="rounded-md border border-slate-300 bg-white p-2 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                                                  onClick={() =>
                                                                    setFieldEditing(
                                                                      field.id,
                                                                      !isFieldEditing,
                                                                    )
                                                                  }
                                                                  aria-label={
                                                                    isFieldEditing
                                                                      ? "Скрыть редактирование поля"
                                                                      : "Редактировать поле"
                                                                  }
                                                                  title={
                                                                    isFieldEditing
                                                                      ? "Скрыть"
                                                                      : "Редактировать"
                                                                  }
                                                                >
                                                                  <svg
                                                                    className="size-4"
                                                                    viewBox="0 0 24 24"
                                                                    fill="none"
                                                                    stroke="currentColor"
                                                                    strokeWidth="2"
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    aria-hidden
                                                                  >
                                                                    <path d="M12 20h9" />
                                                                    <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                                                                  </svg>
                                                                </button>
                                                                <button
                                                                  type="button"
                                                                  className="rounded-md border border-red-300 bg-white p-2 text-red-700 hover:bg-red-50"
                                                                  onClick={() =>
                                                                    removeGroupField(
                                                                      stage,
                                                                      step.id,
                                                                      group.id,
                                                                      field.id,
                                                                    )
                                                                  }
                                                                  aria-label="Удалить поле"
                                                                  title="Удалить поле"
                                                                >
                                                                  <svg
                                                                    className="size-4"
                                                                    viewBox="0 0 24 24"
                                                                    fill="none"
                                                                    stroke="currentColor"
                                                                    strokeWidth="2"
                                                                    strokeLinecap="round"
                                                                    strokeLinejoin="round"
                                                                    aria-hidden
                                                                  >
                                                                    <path d="M3 6h18" />
                                                                    <path d="M8 6V4h8v2" />
                                                                    <path d="M19 6l-1 14H6L5 6" />
                                                                    <path d="M10 11v6" />
                                                                    <path d="M14 11v6" />
                                                                  </svg>
                                                                </button>
                                                              </div>
                                                            </div>

                                                            {isFieldEditing ? (
                                                              <div className="mt-3 rounded-md border border-slate-200 bg-slate-50/50 p-3">
                                                                <div className="grid gap-3 md:grid-cols-2">
                                                                  <label className="block text-xs font-medium text-slate-600">
                                                                    Наименование поля
                                                                    <input
                                                                      className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
                                                                      value={field.label}
                                                                      placeholder="Например: ФИО"
                                                                      onChange={(e) =>
                                                                        patchGroupField(
                                                                          stage,
                                                                          step.id,
                                                                          group.id,
                                                                          field.id,
                                                                          (prev) => ({
                                                                            ...prev,
                                                                            label: e.target.value,
                                                                          }),
                                                                        )
                                                                      }
                                                                    />
                                                                  </label>

                                                                  <label className="block text-xs font-medium text-slate-600">
                                                                    Тип
                                                                    <select
                                                                      className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
                                                                      value={field.type}
                                                                      onChange={(e) => {
                                                                        const nextType =
                                                                          e.target.value as FieldType;
                                                                        patchGroupField(
                                                                          stage,
                                                                          step.id,
                                                                          group.id,
                                                                          field.id,
                                                                          (prev) => {
                                                                            const next: FieldDefinition = {
                                                                              ...prev,
                                                                              type: nextType,
                                                                            };
                                                                            if (nextType !== "select")
                                                                              delete next.options;
                                                                            if (nextType !== "text")
                                                                              delete next.multiline;
                                                                            if (nextType !== "number") {
                                                                              delete next.unit;
                                                                              delete next.referenceRange;
                                                                            }
                                                                            return next;
                                                                          },
                                                                        );
                                                                      }}
                                                                    >
                                                                      {GROUP_FIELD_TYPE_OPTIONS.map(
                                                                        (opt) => (
                                                                          <option
                                                                            key={opt.value}
                                                                            value={opt.value}
                                                                          >
                                                                            {opt.label}
                                                                          </option>
                                                                        ),
                                                                      )}
                                                                    </select>
                                                                  </label>
                                                                </div>

                                                                {field.type === "select" ? (
                                                                  <label className="mt-3 block text-xs font-medium text-slate-600">
                                                                    Варианты (по одному в строке)
                                                                    <textarea
                                                                      className="mt-1 min-h-[5rem] w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800"
                                                                      value={optionsToText(
                                                                        field.options,
                                                                      )}
                                                                      onChange={(e) =>
                                                                        patchGroupField(
                                                                          stage,
                                                                          step.id,
                                                                          group.id,
                                                                          field.id,
                                                                          (prev) => ({
                                                                            ...prev,
                                                                            options: parseOptionsFromText(
                                                                              e.target.value,
                                                                            ),
                                                                          }),
                                                                        )
                                                                      }
                                                                    />
                                                                  </label>
                                                                ) : null}

                                                                <div className="mt-3 flex justify-end">
                                                                  <button
                                                                    type="button"
                                                                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                                                                    onClick={() =>
                                                                      setFieldEditing(
                                                                        field.id,
                                                                        false,
                                                                      )
                                                                    }
                                                                  >
                                                                    Сохранить
                                                                  </button>
                                                                </div>
                                                              </div>
                                                            ) : null}
                                                          </div>
                                                          );
                                                        })}
                                                      </div>
                                                    )}
                                                  </div>
                                                )}
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}

                                      <div className="mt-3">
                                        <button
                                          type="button"
                                          className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                                          onClick={() => addGroup(stage, step)}
                                        >
                                          + Группа полей
                                        </button>
                                      </div>
                                    </div>
                                  ) : null}
                                </div>
                          );
                        })()}
                      </div>
                    ))}
                  </div>
                )}

                <div className="pt-1">
                  <button
                    type="button"
                    className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                    onClick={() => addStep(stage)}
                  >
                    + Шаг
                  </button>
                </div>
              </div>
            </Tab.Panel>
          ))}
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
}
