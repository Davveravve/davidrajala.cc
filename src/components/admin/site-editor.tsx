"use client";

import { useState, useTransition } from "react";
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
import {
  GripVertical,
  Eye,
  EyeOff,
  RotateCcw,
  Check,
  Sparkles,
  Layout,
  ImageIcon,
  Briefcase,
  User,
  MessageCircle,
  Copy,
  Trash2,
  Plus,
  ShoppingBag,
} from "lucide-react";
import {
  updateHomeSection,
  toggleHomeSectionVisible,
  reorderHomeSections,
  resetHomeSection,
  updateSiteSettings,
  addHomeSection,
  duplicateHomeSection,
  deleteHomeSection,
  setHomeSectionProject,
  setHomeSectionStoreProduct,
} from "@/app/admin/site-editor/actions";
import { ConfirmDialog } from "./confirm-dialog";
import type { HomeSection, SiteSettings } from "@prisma/client";

type ProjectOption = {
  id: string;
  title: string;
  slug: string;
  coverUrl: string;
};

type StoreProductOption = {
  id: string;
  title: string;
  slug: string;
  coverUrl: string;
};

type SectionWithProject = HomeSection & {
  project?: { id: string; title: string; slug: string; coverUrl: string } | null;
  storeProduct?: { id: string; title: string; slug: string; coverUrl: string } | null;
};

const SECTION_META: Record<
  string,
  { label: string; icon: React.ComponentType<{ size?: number }>; description: string }
> = {
  hero: { label: "Hero", icon: Layout, description: "Top of the homepage — name, subline, primary CTA" },
  featured: { label: "Featured project", icon: Sparkles, description: "Spotlight for a specific project" },
  latest: { label: "Latest projects", icon: Briefcase, description: "Recent project grid" },
  "store-featured": { label: "Featured store item", icon: ShoppingBag, description: "Spotlight for a store product" },
  about: { label: "About snippet", icon: User, description: "Bio + skills teaser" },
  contact: { label: "Contact CTA", icon: MessageCircle, description: "Big CTA at the bottom" },
};

export function SiteEditor({
  sections: initialSections,
  settings,
  projects,
  storeProducts,
}: {
  sections: SectionWithProject[];
  settings: SiteSettings;
  projects: ProjectOption[];
  storeProducts: StoreProductOption[];
}) {
  const [sections, setSections] = useState(initialSections);
  const [openId, setOpenId] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<SectionWithProject | null>(null);
  const [, startTransition] = useTransition();

  function refreshFromServer() {
    // Trigger a server refetch by calling router.refresh on the parent —
    // we don't have it here, so we simulate by mutating local state. The
    // server actions revalidate "/admin/site-editor" so a manual refresh
    // (or any router transition) will sync. For instant feedback we just
    // mutate locally.
  }
  void refreshFromServer;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = sections.findIndex((s) => s.id === active.id);
    const newIndex = sections.findIndex((s) => s.id === over.id);
    const next = arrayMove(sections, oldIndex, newIndex);
    setSections(next);
    startTransition(async () => {
      await reorderHomeSections(next.map((s) => s.id));
      setSavedAt(Date.now());
    });
  }

  function handleToggleVisible(id: string) {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, visible: !s.visible } : s)),
    );
    const target = sections.find((s) => s.id === id);
    if (!target) return;
    startTransition(async () => {
      await toggleHomeSectionVisible(id, !target.visible);
      setSavedAt(Date.now());
    });
  }

  function handleAddSection(type: string) {
    startTransition(async () => {
      const newId = await addHomeSection(type);
      // Optimistic insert at the end. The server action will revalidate so
      // a router refresh will reconcile any drift (e.g. order normalization).
      const lastOrder = sections.reduce((m, s) => Math.max(m, s.order), -1);
      setSections((prev) => [
        ...prev,
        {
          id: newId,
          type,
          order: lastOrder + 1,
          visible: true,
          eyebrow: null,
          title: null,
          titleMuted: null,
          body: null,
          ctaLabel: null,
          ctaHref: null,
          projectId: null,
          updatedAt: new Date(),
          project: null,
        } as SectionWithProject,
      ]);
      setOpenId(newId);
      setSavedAt(Date.now());
    });
  }

  function handleDuplicate(id: string) {
    const original = sections.find((s) => s.id === id);
    if (!original) return;
    startTransition(async () => {
      await duplicateHomeSection(id);
      // Server action shifted orders. We can't easily get the new id without
      // a refetch — just optimistically insert a clone next to the original
      // with a placeholder id; on next page interaction it'll reconcile.
      const placeholderId = `tmp-${Date.now()}`;
      setSections((prev) => {
        const idx = prev.findIndex((s) => s.id === id);
        if (idx === -1) return prev;
        const clone: SectionWithProject = {
          ...original,
          id: placeholderId,
          order: original.order + 1,
        };
        const shifted = prev.map((s) =>
          s.order > original.order ? { ...s, order: s.order + 1 } : s,
        );
        const next = [...shifted];
        next.splice(idx + 1, 0, clone);
        return next.sort((a, b) => a.order - b.order);
      });
      setSavedAt(Date.now());
    });
  }

  function handleDelete(section: SectionWithProject) {
    setPendingDelete(section);
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    const id = pendingDelete.id;
    setSections((prev) => prev.filter((s) => s.id !== id));
    setPendingDelete(null);
    if (openId === id) setOpenId(null);
    await deleteHomeSection(id);
    setSavedAt(Date.now());
  }

  function handleSetProject(id: string, projectId: string | null) {
    const project = projectId ? projects.find((p) => p.id === projectId) ?? null : null;
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, projectId, project } : s)),
    );
    startTransition(async () => {
      await setHomeSectionProject(id, projectId);
      setSavedAt(Date.now());
    });
  }

  function handleSetStoreProduct(id: string, storeProductId: string | null) {
    const storeProduct = storeProductId
      ? storeProducts.find((p) => p.id === storeProductId) ?? null
      : null;
    setSections((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, storeProductId, storeProduct } : s,
      ),
    );
    startTransition(async () => {
      await setHomeSectionStoreProduct(id, storeProductId);
      setSavedAt(Date.now());
    });
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_1fr] gap-6">
      {/* Sections list */}
      <div>
        <PanelHeader
          title="Home page sections"
          subtitle="Drag to reorder · click to edit · toggle to hide"
        />
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            <ul className="space-y-2">
              {sections.map((s) => (
                <SortableRow
                  key={s.id}
                  section={s}
                  projects={projects}
                  storeProducts={storeProducts}
                  open={openId === s.id}
                  onToggle={() => setOpenId(openId === s.id ? null : s.id)}
                  onToggleVisible={() => handleToggleVisible(s.id)}
                  onDuplicate={() => handleDuplicate(s.id)}
                  onDelete={() => handleDelete(s)}
                  onSetProject={(pid) => handleSetProject(s.id, pid)}
                  onSetStoreProduct={(pid) => handleSetStoreProduct(s.id, pid)}
                  onSaved={() => {
                    setSavedAt(Date.now());
                  }}
                  onUpdated={(updated) => {
                    setSections((prev) =>
                      prev.map((x) => (x.id === updated.id ? { ...x, ...updated } : x)),
                    );
                  }}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>

        <AddSectionPicker onAdd={handleAddSection} />
      </div>

      {/* Global settings */}
      <div>
        <PanelHeader title="Global" subtitle="Theme · footer · hero subline" />
        <SettingsForm settings={settings} onSaved={() => setSavedAt(Date.now())} />
      </div>

      {savedAt && (
        <div
          key={savedAt}
          className="fixed bottom-6 right-6 inline-flex items-center gap-2 px-4 py-3 rounded-full bg-[var(--color-accent)] text-[var(--color-bg)] text-sm font-medium shadow-lg animate-in fade-in slide-in-from-bottom-2 z-50"
        >
          <Check size={14} />
          Saved
        </div>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete section"
        description={
          pendingDelete
            ? `Remove this ${SECTION_META[pendingDelete.type]?.label ?? pendingDelete.type} section from the home page?`
            : undefined
        }
        confirmLabel="Delete"
        destructive
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}

function AddSectionPicker({ onAdd }: { onAdd: (type: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="mt-3">
      {open ? (
        <div className="rounded-2xl border border-[var(--color-accent)]/30 bg-[var(--color-surface)] p-3">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-[10px] uppercase tracking-[0.1em] font-medium text-[var(--color-fg-muted)]">
              Pick a section type
            </span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-[10px] text-[var(--color-fg-muted)] hover:text-[var(--color-fg)]"
            >
              Cancel
            </button>
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {Object.entries(SECTION_META).map(([type, meta]) => {
              const Icon = meta.icon;
              return (
                <li key={type}>
                  <button
                    type="button"
                    onClick={() => {
                      onAdd(type);
                      setOpen(false);
                    }}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-[var(--color-border)] hover:border-[var(--color-accent)] hover:bg-[var(--color-surface-2)] text-left transition-colors"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-surface-2)] text-[var(--color-accent)] flex-shrink-0">
                      <Icon size={14} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{meta.label}</div>
                      <div className="text-xs text-[var(--color-fg-muted)] truncate mt-0.5">
                        {meta.description}
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl border border-dashed border-[var(--color-border)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] text-sm text-[var(--color-fg-muted)] transition-colors"
        >
          <Plus size={14} />
          Add section
        </button>
      )}
    </div>
  );
}

function PanelHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <h2 className="font-display text-lg font-medium">{title}</h2>
      {subtitle && (
        <p className="text-xs text-[var(--color-fg-muted)] mt-0.5">{subtitle}</p>
      )}
    </div>
  );
}

function SortableRow({
  section,
  projects,
  storeProducts,
  open,
  onToggle,
  onToggleVisible,
  onDuplicate,
  onDelete,
  onSetProject,
  onSetStoreProduct,
  onSaved,
  onUpdated,
}: {
  section: SectionWithProject;
  projects: ProjectOption[];
  storeProducts: StoreProductOption[];
  open: boolean;
  onToggle: () => void;
  onToggleVisible: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onSetProject: (projectId: string | null) => void;
  onSetStoreProduct: (storeProductId: string | null) => void;
  onSaved: () => void;
  onUpdated: (s: HomeSection) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : "auto",
  };

  const meta = SECTION_META[section.type] ?? {
    label: section.type,
    icon: ImageIcon,
    description: "",
  };
  const Icon = meta.icon;

  const hasOverrides = !!(
    section.eyebrow ||
    section.title ||
    section.titleMuted ||
    section.body ||
    section.ctaLabel ||
    section.ctaHref
  );

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`rounded-2xl border bg-[var(--color-surface)] transition-all ${
        isDragging
          ? "border-[var(--color-accent)] shadow-[0_0_30px_var(--color-accent-glow)]"
          : section.visible
            ? "border-[var(--color-border)]"
            : "border-[var(--color-border)] opacity-60"
      }`}
    >
      <div className="flex items-center gap-2 p-3">
        <button
          {...attributes}
          {...listeners}
          className="flex h-9 w-7 items-center justify-center text-[var(--color-fg-muted)] hover:text-[var(--color-accent)] cursor-grab active:cursor-grabbing"
          aria-label="Drag"
        >
          <GripVertical size={16} />
        </button>
        <button
          type="button"
          onClick={onToggle}
          className="flex flex-1 items-center gap-3 min-w-0 text-left"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--color-surface-2)] text-[var(--color-accent)] flex-shrink-0">
            <Icon size={14} />
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">{meta.label}</span>
              {section.type === "featured" && section.project && (
                <span className="text-[10px] text-[var(--color-fg-muted)] truncate">
                  · {section.project.title}
                </span>
              )}
              {section.type === "featured" && !section.project && (
                <span className="text-[9px] font-mono uppercase tracking-wider text-orange-300 border border-orange-300/40 px-1.5 py-0.5 rounded">
                  no project
                </span>
              )}
              {section.type === "store-featured" && section.storeProduct && (
                <span className="text-[10px] text-[var(--color-fg-muted)] truncate">
                  · {section.storeProduct.title}
                </span>
              )}
              {section.type === "store-featured" && !section.storeProduct && (
                <span className="text-[9px] font-mono uppercase tracking-wider text-orange-300 border border-orange-300/40 px-1.5 py-0.5 rounded">
                  no product
                </span>
              )}
              {hasOverrides && (
                <span className="text-[9px] font-mono uppercase tracking-wider text-[var(--color-accent)] border border-[var(--color-accent)]/40 px-1.5 py-0.5 rounded">
                  custom
                </span>
              )}
              {!section.visible && (
                <span className="text-[9px] font-mono uppercase tracking-wider text-orange-300 border border-orange-300/40 px-1.5 py-0.5 rounded">
                  hidden
                </span>
              )}
            </div>
            <div className="text-xs text-[var(--color-fg-muted)] truncate mt-0.5">
              {meta.description}
            </div>
          </div>
        </button>
        <button
          type="button"
          onClick={onDuplicate}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--color-fg-muted)] hover:text-[var(--color-accent)] hover:bg-[var(--color-surface-2)] transition-colors"
          title="Duplicate section"
        >
          <Copy size={13} />
        </button>
        <button
          type="button"
          onClick={onToggleVisible}
          className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${
            section.visible
              ? "text-[var(--color-fg-muted)] hover:text-[var(--color-fg)] hover:bg-[var(--color-surface-2)]"
              : "text-orange-300 bg-orange-500/10 hover:bg-orange-500/20"
          }`}
          title={section.visible ? "Hide section" : "Show section"}
        >
          {section.visible ? <Eye size={14} /> : <EyeOff size={14} />}
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-[var(--color-fg-muted)] hover:text-red-400 hover:bg-red-500/10 transition-colors"
          title="Delete section"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {open && (
        <SectionEditForm
          section={section}
          projects={projects}
          storeProducts={storeProducts}
          onSetProject={onSetProject}
          onSetStoreProduct={onSetStoreProduct}
          onSaved={(updated) => {
            onUpdated(updated);
            onSaved();
          }}
        />
      )}
    </li>
  );
}

function SectionEditForm({
  section,
  projects,
  storeProducts,
  onSetProject,
  onSetStoreProduct,
  onSaved,
}: {
  section: SectionWithProject;
  projects: ProjectOption[];
  storeProducts: StoreProductOption[];
  onSetProject: (projectId: string | null) => void;
  onSetStoreProduct: (storeProductId: string | null) => void;
  onSaved: (updated: HomeSection) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await updateHomeSection(section.id, fd);
        onSaved({
          ...section,
          eyebrow: nullable(fd.get("eyebrow")),
          title: nullable(fd.get("title")),
          titleMuted: nullable(fd.get("titleMuted")),
          body: nullable(fd.get("body")),
          ctaLabel: nullable(fd.get("ctaLabel")),
          ctaHref: nullable(fd.get("ctaHref")),
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save");
      }
    });
  }

  function onReset() {
    startTransition(async () => {
      await resetHomeSection(section.id);
      onSaved({
        ...section,
        eyebrow: null,
        title: null,
        titleMuted: null,
        body: null,
        ctaLabel: null,
        ctaHref: null,
      });
    });
  }

  // Per-section field configuration so we only show fields that the section actually uses.
  const showEyebrow = ["featured", "latest", "store-featured", "about", "contact"].includes(section.type);
  const showTitle = ["latest", "about", "contact"].includes(section.type);
  const showTitleMuted = ["hero", "latest", "about", "contact"].includes(section.type);
  const showBody = ["contact"].includes(section.type);
  const showCta = ["hero", "featured", "latest", "store-featured", "about"].includes(section.type);
  const showCtaHref = ["hero", "latest", "about"].includes(section.type);

  return (
    <form
      onSubmit={onSubmit}
      className="border-t border-[var(--color-border)] p-4 bg-[var(--color-bg)]/50 space-y-4"
    >
      {section.type === "featured" && (
        <FeaturedProjectPicker
          projects={projects}
          selectedId={section.projectId}
          onChange={onSetProject}
        />
      )}
      {section.type === "store-featured" && (
        <FeaturedStorePicker
          products={storeProducts}
          selectedId={section.storeProductId}
          onChange={onSetStoreProduct}
        />
      )}
      {showEyebrow && (
        <Field
          label="Eyebrow (small label above title)"
          name="eyebrow"
          defaultValue={section.eyebrow ?? ""}
          placeholder={defaultFor(section.type, "eyebrow")}
        />
      )}
      {showTitle && (
        <Field
          label="Title"
          name="title"
          defaultValue={section.title ?? ""}
          placeholder={defaultFor(section.type, "title")}
        />
      )}
      {showTitleMuted && (
        <Field
          label={section.type === "hero" ? "Secondary CTA label" : "Title (second line, muted)"}
          name="titleMuted"
          defaultValue={section.titleMuted ?? ""}
          placeholder={defaultFor(section.type, "titleMuted")}
        />
      )}
      {showBody && (
        <Field
          label="Body"
          name="body"
          defaultValue={section.body ?? ""}
          as="textarea"
          rows={2}
          placeholder={defaultFor(section.type, "body")}
        />
      )}
      {showCta && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field
            label="CTA label"
            name="ctaLabel"
            defaultValue={section.ctaLabel ?? ""}
            placeholder={defaultFor(section.type, "ctaLabel")}
          />
          {showCtaHref && (
            <Field
              label="CTA link (path or URL)"
              name="ctaHref"
              defaultValue={section.ctaHref ?? ""}
              placeholder={defaultFor(section.type, "ctaHref")}
            />
          )}
        </div>
      )}

      {error && (
        <div className="px-3 py-2 rounded-lg border border-red-500/30 bg-red-500/5 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between gap-2 pt-2">
        <button
          type="button"
          onClick={onReset}
          disabled={isPending}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-full text-xs text-[var(--color-fg-muted)] hover:text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <RotateCcw size={12} />
          Reset to defaults
        </button>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[var(--color-accent)] text-[var(--color-bg)] font-medium text-sm hover:shadow-[0_0_24px_var(--color-accent-glow)] transition-shadow disabled:opacity-60"
        >
          {isPending ? "Saving..." : "Save"}
        </button>
      </div>
    </form>
  );
}

function SettingsForm({
  settings,
  onSaved,
}: {
  settings: SiteSettings;
  onSaved: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [accent, setAccent] = useState(settings.accentColor);
  const [accent2, setAccent2] = useState(settings.accentColor2);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    startTransition(async () => {
      try {
        await updateSiteSettings(fd);
        onSaved();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to save");
      }
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 space-y-5"
    >
      <div>
        <div className="text-[10px] uppercase tracking-[0.1em] font-medium text-[var(--color-fg-muted)] mb-3">
          Theme
        </div>
        <div className="grid grid-cols-2 gap-3">
          <ColorField
            label="Accent"
            name="accentColor"
            value={accent}
            onChange={setAccent}
          />
          <ColorField
            label="Accent (glow / 2nd)"
            name="accentColor2"
            value={accent2}
            onChange={setAccent2}
          />
        </div>
        <div className="mt-3 px-4 py-3 rounded-lg border border-[var(--color-border)] flex items-center gap-3">
          <span
            className="h-3 w-3 rounded-full"
            style={{ background: accent, boxShadow: `0 0 8px ${accent}` }}
          />
          <span className="text-xs text-[var(--color-fg-muted)]">Preview accent</span>
        </div>
      </div>

      <div>
        <div className="text-[10px] uppercase tracking-[0.1em] font-medium text-[var(--color-fg-muted)] mb-3">
          Hero
        </div>
        <Field
          label="Hero subline (use {location} for city placeholder)"
          name="heroSubline"
          defaultValue={settings.heroSubline}
          as="textarea"
          rows={3}
        />
      </div>

      <div>
        <div className="text-[10px] uppercase tracking-[0.1em] font-medium text-[var(--color-fg-muted)] mb-3">
          Footer
        </div>
        <div className="space-y-3">
          <Field
            label="Tagline"
            name="footerTagline"
            defaultValue={settings.footerTagline}
            as="textarea"
            rows={2}
          />
          <Field
            label="Copyright (leave empty for auto)"
            name="footerCopyright"
            defaultValue={settings.footerCopyright}
            placeholder={`© ${new Date().getFullYear()} David Rajala. All rights reserved.`}
          />
          <Field
            label="Status text (right side of footer)"
            name="footerStatusText"
            defaultValue={settings.footerStatusText}
            placeholder="SYSTEM ONLINE"
          />
        </div>
      </div>

      {error && (
        <div className="px-3 py-2 rounded-lg border border-red-500/30 bg-red-500/5 text-red-400 text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[var(--color-accent)] text-[var(--color-bg)] font-medium text-sm hover:shadow-[0_0_24px_var(--color-accent-glow)] transition-shadow disabled:opacity-60"
      >
        {isPending ? "Saving..." : "Save global settings"}
      </button>
    </form>
  );
}

function FeaturedStorePicker({
  products,
  selectedId,
  onChange,
}: {
  products: StoreProductOption[];
  selectedId: string | null;
  onChange: (id: string | null) => void;
}) {
  return (
    <div>
      <span className="block text-xs font-medium text-[var(--color-fg-muted)] mb-1.5">
        Store product
      </span>
      <select
        value={selectedId ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        className="w-full px-3 py-2 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-fg)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 transition-all text-sm"
      >
        <option value="">— Pick a published product —</option>
        {products.map((p) => (
          <option key={p.id} value={p.id}>
            {p.title}
          </option>
        ))}
      </select>
      <p className="mt-1.5 text-[11px] text-[var(--color-fg-muted)]">
        Spotlight one of your published store products on the home page.
        The section stays hidden until you pick one.
      </p>
    </div>
  );
}

function FeaturedProjectPicker({
  projects,
  selectedId,
  onChange,
}: {
  projects: ProjectOption[];
  selectedId: string | null;
  onChange: (id: string | null) => void;
}) {
  return (
    <div>
      <span className="block text-xs font-medium text-[var(--color-fg-muted)] mb-1.5">
        Featured project
      </span>
      <select
        value={selectedId ?? ""}
        onChange={(e) => onChange(e.target.value || null)}
        className="w-full px-3 py-2 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-fg)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 transition-all text-sm"
      >
        <option value="">— Use globally starred project —</option>
        {projects.map((p) => (
          <option key={p.id} value={p.id}>
            {p.title}
          </option>
        ))}
      </select>
      <p className="mt-1.5 text-[11px] text-[var(--color-fg-muted)]">
        Pick a specific project to spotlight in this section. Leave empty to use whichever project is starred in the projects list.
      </p>
    </div>
  );
}

function Field({
  label,
  name,
  defaultValue,
  placeholder,
  as = "input",
  rows,
}: {
  label: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  as?: "input" | "textarea";
  rows?: number;
}) {
  const cls =
    "w-full px-3 py-2 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-fg)] placeholder:text-[var(--color-fg-dim)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 transition-all text-sm";
  return (
    <label className="block">
      <span className="block text-xs font-medium text-[var(--color-fg-muted)] mb-1.5">
        {label}
      </span>
      {as === "textarea" ? (
        <textarea
          name={name}
          defaultValue={defaultValue}
          placeholder={placeholder}
          rows={rows ?? 3}
          className={`${cls} resize-y`}
        />
      ) : (
        <input
          name={name}
          defaultValue={defaultValue}
          placeholder={placeholder}
          className={cls}
        />
      )}
    </label>
  );
}

function ColorField({
  label,
  name,
  value,
  onChange,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-[var(--color-fg-muted)] mb-1.5">
        {label}
      </span>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-10 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] cursor-pointer"
        />
        <input
          type="text"
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-3 py-2 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-fg)] focus:border-[var(--color-accent)] focus:outline-none font-mono text-sm"
        />
      </div>
    </label>
  );
}

function nullable(v: FormDataEntryValue | null): string | null {
  const s = String(v ?? "").trim();
  return s.length === 0 ? null : s;
}

const DEFAULTS: Record<string, Record<string, string>> = {
  hero: {
    ctaLabel: "View work",
    ctaHref: "/projects",
    titleMuted: "Contact me",
  },
  featured: {
    eyebrow: "Featured",
    ctaLabel: "View case study",
  },
  latest: {
    eyebrow: "Recent work",
    title: "Recent projects,",
    titleMuted: "hand-crafted and tuned.",
    ctaLabel: "All projects",
    ctaHref: "/projects",
  },
  about: {
    eyebrow: "About",
    title: "Experienced developer.",
    titleMuted: "Detail-obsessed designer.",
    ctaLabel: "More about me",
    ctaHref: "/about",
  },
  contact: {
    eyebrow: "Get in touch",
    title: "Got a project",
    titleMuted: "in mind?",
    body: "Open the chat and tell me about your project. I'll get back to you as soon as I can.",
  },
};

function defaultFor(type: string, field: string) {
  return DEFAULTS[type]?.[field] ?? "";
}
