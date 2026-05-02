"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Star, Eye, EyeOff, Trash2, Check } from "lucide-react";
import { reorderProjects, deleteProject, setFeaturedProject } from "@/app/_actions/projects";
import { ConfirmDialog } from "./confirm-dialog";

type AdminProject = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  coverUrl: string;
  categoryName: string | null;
  featured: boolean;
  published: boolean;
  status: string;
};

const STATUS_LABELS: Record<string, string> = {
  live: "Live",
  wip: "WIP",
  archived: "Archived",
  oss: "Open source",
};

const STATUS_CLASSES: Record<string, string> = {
  live: "bg-[var(--color-accent)]/10 text-[var(--color-accent)]",
  wip: "bg-orange-500/10 text-orange-300",
  archived: "bg-[var(--color-surface-2)] text-[var(--color-fg-muted)]",
  oss: "bg-green-500/10 text-green-300",
};

export function ProjectsAdminList({ projects }: { projects: AdminProject[] }) {
  const [items, setItems] = useState(projects);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [, startTransition] = useTransition();
  const [pendingDelete, setPendingDelete] = useState<AdminProject | null>(null);

  function handleSetFeatured(projectId: string, currentlyFeatured: boolean) {
    const next = currentlyFeatured ? null : projectId;
    setItems((prev) =>
      prev.map((p) => ({ ...p, featured: p.id === projectId ? !currentlyFeatured : false })),
    );
    startTransition(async () => {
      await setFeaturedProject(next);
      setSavedAt(Date.now());
    });
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    const next = arrayMove(items, oldIndex, newIndex);
    setItems(next);

    startTransition(async () => {
      await reorderProjects(next.map((i) => i.id));
      setSavedAt(Date.now());
    });
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-16 text-center">
        <div className="font-display text-2xl mb-2">No projects yet</div>
        <p className="text-[var(--color-fg-muted)] text-sm mb-6">
          Create your first project to get started.
        </p>
        <Link
          href="/admin/projects/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--color-accent)] text-[var(--color-bg)] font-medium text-sm"
        >
          Add project
        </Link>
      </div>
    );
  }

  return (
    <>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          <ul className="space-y-3">
            {items.map((p) => (
              <SortableRow
                key={p.id}
                project={p}
                onAskDelete={(proj) => setPendingDelete(proj)}
                onToggleFeatured={() => handleSetFeatured(p.id, p.featured)}
              />
            ))}
          </ul>
        </SortableContext>
      </DndContext>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete project"
        description={
          pendingDelete
            ? `You're about to delete "${pendingDelete.title}". This cannot be undone.`
            : undefined
        }
        confirmLabel="Delete"
        destructive
        onCancel={() => setPendingDelete(null)}
        onConfirm={async () => {
          if (!pendingDelete) return;
          await deleteProject(pendingDelete.id);
          setItems((prev) => prev.filter((i) => i.id !== pendingDelete.id));
          setPendingDelete(null);
        }}
      />

      {savedAt && (
        <div
          key={savedAt}
          className="fixed bottom-6 right-6 inline-flex items-center gap-2 px-4 py-3 rounded-full bg-[var(--color-accent)] text-[var(--color-bg)] text-sm font-medium shadow-lg animate-in fade-in slide-in-from-bottom-2"
        >
          <Check size={14} />
          Order saved
        </div>
      )}
    </>
  );
}

function SortableRow({
  project,
  onAskDelete,
  onToggleFeatured,
}: {
  project: AdminProject;
  onAskDelete: (p: AdminProject) => void;
  onToggleFeatured: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: project.id });
  const isPending = false;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : "auto",
  };

  function onDelete() {
    onAskDelete(project);
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-4 rounded-2xl border bg-[var(--color-surface)] p-3 pr-4 transition-all ${
        isDragging
          ? "border-[var(--color-accent)] shadow-[0_0_30px_var(--color-accent-glow)]"
          : "border-[var(--color-border)] hover:border-[var(--color-border-strong)]"
      } ${isPending ? "opacity-50" : ""}`}
    >
      <button
        {...attributes}
        {...listeners}
        className="flex h-10 w-8 items-center justify-center text-[var(--color-fg-muted)] hover:text-[var(--color-accent)] cursor-grab active:cursor-grabbing"
        aria-label="Drag to reorder"
      >
        <GripVertical size={18} />
      </button>

      <div className="relative h-16 w-24 flex-shrink-0 rounded-lg overflow-hidden border border-[var(--color-border)]">
        <Image
          src={project.coverUrl}
          alt={project.title}
          fill
          sizes="96px"
          className="object-cover"
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium truncate">{project.title}</span>
          {project.featured && (
            <Star size={12} className="text-[var(--color-accent)] flex-shrink-0" fill="currentColor" />
          )}
          <span
            className={`text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded ${
              STATUS_CLASSES[project.status] ?? STATUS_CLASSES.live
            }`}
          >
            {STATUS_LABELS[project.status] ?? project.status}
          </span>
          {!project.published && (
            <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-fg-dim)] border border-[var(--color-border)] px-1.5 py-0.5 rounded">
              draft
            </span>
          )}
        </div>
        <p className="text-xs text-[var(--color-fg-muted)] line-clamp-1">
          {project.categoryName && (
            <span className="font-mono uppercase tracking-wider mr-2">
              {project.categoryName}
            </span>
          )}
          {project.summary}
        </p>
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={onToggleFeatured}
          className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
            project.featured
              ? "text-[var(--color-accent)] bg-[var(--color-accent)]/10"
              : "text-[var(--color-fg-muted)] hover:text-[var(--color-accent)] hover:bg-[var(--color-surface-2)]"
          }`}
          title={project.featured ? "Featured — click to unmark" : "Set as featured"}
        >
          <Star size={14} fill={project.featured ? "currentColor" : "transparent"} />
        </button>
        <Link
          href={`/projects/${project.slug}`}
          target="_blank"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--color-fg-muted)] hover:text-[var(--color-accent)] hover:bg-[var(--color-surface-2)] transition-colors"
          title="View publicly"
        >
          {project.published ? <Eye size={16} /> : <EyeOff size={16} />}
        </Link>
        <Link
          href={`/admin/projects/${project.id}`}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--color-fg-muted)] hover:text-[var(--color-accent)] hover:bg-[var(--color-surface-2)] transition-colors"
          title="Edit"
        >
          <Pencil size={14} />
        </Link>
        <button
          onClick={onDelete}
          disabled={isPending}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--color-fg-muted)] hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
          title="Delete"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </li>
  );
}
