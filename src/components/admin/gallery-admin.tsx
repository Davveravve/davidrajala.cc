"use client";

import { useRef, useState, useTransition } from "react";
import Image from "next/image";
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
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Check,
  GripVertical,
  Trash2,
  Upload,
  AlertCircle,
} from "lucide-react";
import {
  addGalleryImages,
  deleteGalleryImage,
  reorderGalleryImages,
  updateGalleryImage,
} from "@/app/admin/gallery/actions";
import { ConfirmDialog } from "./confirm-dialog";

type GalleryItem = {
  id: string;
  url: string;
  alt: string;
  caption: string;
};

export function GalleryAdmin({ images }: { images: GalleryItem[] }) {
  const [items, setItems] = useState(images);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<GalleryItem | null>(null);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isUploading, startUploadTransition] = useTransition();
  const [, startReorderTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  function handleFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    setPreviews(files.map((f) => URL.createObjectURL(f)));
    if (files.length === 0) return;

    setError(null);
    const fd = new FormData(e.currentTarget.form ?? undefined);
    startUploadTransition(async () => {
      try {
        await addGalleryImages(fd);
        setSavedAt(Date.now());
        setPreviews([]);
        if (formRef.current) formRef.current.reset();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      }
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    const next = arrayMove(items, oldIndex, newIndex);
    setItems(next);
    startReorderTransition(async () => {
      await reorderGalleryImages(next.map((i) => i.id));
      setSavedAt(Date.now());
    });
  }

  function handleFieldSave(
    id: string,
    patch: Partial<Pick<GalleryItem, "alt" | "caption">>,
  ) {
    const current = items.find((i) => i.id === id);
    if (!current) return;
    const next = { ...current, ...patch };
    if (next.alt === current.alt && next.caption === current.caption) return;
    setItems((prev) => prev.map((i) => (i.id === id ? next : i)));
    startReorderTransition(async () => {
      await updateGalleryImage(id, next.alt, next.caption);
      setSavedAt(Date.now());
    });
  }

  return (
    <>
      <form ref={formRef} className="mb-8">
        <label className="block">
          <span className="block text-sm font-medium mb-1.5">Upload images</span>
          <div className="relative flex items-center justify-center px-4 py-8 rounded-xl border-2 border-dashed border-[var(--color-border)] bg-[var(--color-bg)] hover:border-[var(--color-accent)] hover:bg-[var(--color-surface-2)] transition-colors cursor-pointer text-sm text-[var(--color-fg-muted)]">
            <Upload size={16} className="mr-2" />
            {isUploading
              ? "Uploading..."
              : "Click or drop images (multiple allowed)"}
            <input
              type="file"
              name="galleryFiles"
              accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
              multiple
              disabled={isUploading}
              onChange={handleFilesChange}
              className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
            />
          </div>
        </label>
        <p className="text-xs text-[var(--color-fg-muted)] mt-2">
          Images up to 10 MB each. Newly uploaded images are appended to the
          end of the gallery.
        </p>

        {previews.length > 0 && (
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mt-4">
            {previews.map((p, i) => (
              <div
                key={i}
                className="relative aspect-square rounded-lg overflow-hidden border border-[var(--color-accent)] bg-[var(--color-bg)]"
              >
                <Image
                  src={p}
                  alt=""
                  fill
                  sizes="200px"
                  className="object-cover"
                  unoptimized
                />
                <span className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full bg-[var(--color-accent)] text-[var(--color-bg)] text-[9px] font-mono uppercase tracking-wider">
                  Uploading
                </span>
              </div>
            ))}
          </div>
        )}
      </form>

      {error && (
        <div className="mb-6 flex items-center gap-2 px-4 py-3 rounded-xl border border-red-500/30 bg-red-500/5 text-red-400 text-sm">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-16 text-center">
          <div className="font-display text-2xl mb-2">No images yet</div>
          <p className="text-[var(--color-fg-muted)] text-sm">
            Upload your first frames using the field above.
          </p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={items.map((i) => i.id)}
            strategy={rectSortingStrategy}
          >
            <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((img) => (
                <SortableTile
                  key={img.id}
                  item={img}
                  onAskDelete={() => setPendingDelete(img)}
                  onSave={(patch) => handleFieldSave(img.id, patch)}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete image"
        description={
          pendingDelete
            ? "This image will be removed from the gallery and the file deleted from disk. This cannot be undone."
            : undefined
        }
        confirmLabel="Delete"
        destructive
        onCancel={() => setPendingDelete(null)}
        onConfirm={async () => {
          if (!pendingDelete) return;
          await deleteGalleryImage(pendingDelete.id);
          setItems((prev) => prev.filter((i) => i.id !== pendingDelete.id));
          setPendingDelete(null);
          setSavedAt(Date.now());
        }}
      />

      {savedAt && (
        <div
          key={savedAt}
          className="fixed bottom-6 right-6 inline-flex items-center gap-2 px-4 py-3 rounded-full bg-[var(--color-accent)] text-[var(--color-bg)] text-sm font-medium shadow-lg animate-in fade-in slide-in-from-bottom-2"
        >
          <Check size={14} />
          Saved
        </div>
      )}
    </>
  );
}

function SortableTile({
  item,
  onAskDelete,
  onSave,
}: {
  item: GalleryItem;
  onAskDelete: () => void;
  onSave: (patch: Partial<Pick<GalleryItem, "alt" | "caption">>) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : "auto" as const,
  };

  const inputCls =
    "w-full px-3 py-2 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-fg)] placeholder:text-[var(--color-fg-dim)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 transition-all text-sm";

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`group flex flex-col rounded-2xl border bg-[var(--color-surface)] overflow-hidden transition-all ${
        isDragging
          ? "border-[var(--color-accent)] shadow-[0_0_30px_var(--color-accent-glow)]"
          : "border-[var(--color-border)] hover:border-[var(--color-border-strong)]"
      }`}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-[var(--color-bg)]">
        <Image
          src={item.url}
          alt={item.alt}
          fill
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover"
          unoptimized={item.url.startsWith("/uploads/")}
        />
        <button
          {...attributes}
          {...listeners}
          type="button"
          className="absolute top-2 left-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing transition-opacity"
          aria-label="Drag to reorder"
        >
          <GripVertical size={14} />
        </button>
        <button
          type="button"
          onClick={onAskDelete}
          className="absolute top-2 right-2 flex h-8 w-8 items-center justify-center rounded-full bg-red-500/90 text-white opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label="Delete image"
        >
          <Trash2 size={13} />
        </button>
      </div>

      <div className="p-3 space-y-2">
        <input
          type="text"
          defaultValue={item.alt}
          placeholder="Alt text (for accessibility)"
          onBlur={(e) => onSave({ alt: e.currentTarget.value })}
          className={inputCls}
        />
        <input
          type="text"
          defaultValue={item.caption}
          placeholder="Caption (shown on hover)"
          onBlur={(e) => onSave({ caption: e.currentTarget.value })}
          className={inputCls}
        />
      </div>
    </li>
  );
}
