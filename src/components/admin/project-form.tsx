"use client";

import { useState, useTransition, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Check, Trash2, Upload, AlertCircle, X } from "lucide-react";
import {
  createProject,
  updateProject,
  deleteProjectImage,
} from "@/app/_actions/projects";
import type { Category } from "@prisma/client";
import { ConfirmDialog } from "./confirm-dialog";
import { isVideoUrl } from "@/lib/media";

type ImageRow = { id: string; url: string; alt: string };

type ProjectInput = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  body: string;
  coverUrl: string;
  liveUrl: string | null;
  repoUrl: string | null;
  techStack: string;
  categoryId: string | null;
  featured: boolean;
  published: boolean;
  status: string;
  hasCaseStudy: boolean;
  caseChallenge: string;
  caseProcess: string;
  caseOutcome: string;
  caseLessons: string;
  beforeUrl: string | null;
  afterUrl: string | null;
  displayDate: Date | string | null;
  viewCount: number;
  images: ImageRow[];
};

type Props =
  | { mode: "create"; project?: undefined; categories: Category[] }
  | { mode: "edit"; project: ProjectInput; categories: Category[] };

export function ProjectForm(props: Props) {
  const { mode, categories } = props;
  const project = mode === "edit" ? props.project : undefined;
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(
    project?.coverUrl ?? null,
  );
  const [galleryPreviews, setGalleryPreviews] = useState<{ url: string; isVideo: boolean }[]>([]);
  const [existingImages, setExistingImages] = useState<ImageRow[]>(
    project?.images ?? [],
  );
  const [pendingDeleteImage, setPendingDeleteImage] = useState<string | null>(null);
  const [hasCase, setHasCase] = useState(project?.hasCaseStudy ?? false);
  const [isPending, startTransition] = useTransition();

  function onCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setCoverPreview(URL.createObjectURL(f));
  }

  function onGalleryChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    setGalleryPreviews(
      files.map((f) => ({
        url: URL.createObjectURL(f),
        isVideo: f.type.startsWith("video/"),
      })),
    );
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        if (mode === "create") {
          await createProject(fd);
        } else {
          await updateProject(project!.id, fd);
          setSavedAt(Date.now());
          setGalleryPreviews([]);
          // re-fetch existing images by router refresh
          router.refresh();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  function askRemoveImage(imgId: string) {
    setPendingDeleteImage(imgId);
  }

  return (
    <>
    <ConfirmDialog
      open={pendingDeleteImage !== null}
      title="Remove image"
      description="This image will be removed from the gallery."
      confirmLabel="Remove"
      destructive
      onCancel={() => setPendingDeleteImage(null)}
      onConfirm={async () => {
        if (!pendingDeleteImage) return;
        await deleteProjectImage(pendingDeleteImage);
        setExistingImages((prev) => prev.filter((i) => i.id !== pendingDeleteImage));
        setPendingDeleteImage(null);
      }}
    />
    <form ref={formRef} onSubmit={onSubmit} className="space-y-8">
      <Card title="Basic info">
        <Field
          label="Title"
          name="title"
          required
          defaultValue={project?.title}
          placeholder="Hälsoapp"
        />
        <Field
          label="Slug (URL-namn)"
          name="slug"
          defaultValue={project?.slug}
          placeholder="leave empty for auto"
          help="Used in the URL. Leave empty to derive from title."
        />
        <Field
          label="Summary"
          name="summary"
          required
          as="textarea"
          rows={3}
          defaultValue={project?.summary}
          placeholder="Short description shown in the list"
        />
        <Field
          label="Body"
          name="body"
          as="textarea"
          rows={10}
          defaultValue={project?.body}
          placeholder="Full description. Use double line breaks for new paragraphs."
        />
      </Card>

      <Card title="Cover image">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <FileInput
              label="Upload new image"
              name="coverFile"
              onChange={onCoverChange}
            />
            <Field
              label="Or URL"
              name="coverUrl"
              defaultValue={project?.coverUrl}
              placeholder="https://..."
            />
          </div>
          <div className="relative aspect-[4/3] rounded-xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-bg)]">
            {coverPreview ? (
              <Image
                src={coverPreview}
                alt="Cover"
                fill
                sizes="50vw"
                className="object-cover"
                unoptimized={coverPreview.startsWith("blob:")}
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-[var(--color-fg-dim)]">
                Ingen bild vald
              </div>
            )}
          </div>
        </div>
      </Card>

      <Card title="Metadata & länkar">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field
            label="Tech stack (comma-separated)"
            name="techStack"
            defaultValue={project?.techStack}
            placeholder="React, Node.js, PostgreSQL"
          />
          <Select
            label="Category"
            name="categoryId"
            defaultValue={project?.categoryId ?? ""}
            options={[
              { label: "— Ingen —", value: "" },
              ...categories.map((c) => ({ label: c.name, value: c.id })),
            ]}
          />
          <Field
            label="Live URL"
            name="liveUrl"
            defaultValue={project?.liveUrl ?? ""}
            placeholder="https://..."
          />
          <Field
            label="Repo URL"
            name="repoUrl"
            defaultValue={project?.repoUrl ?? ""}
            placeholder="https://github.com/..."
          />
          <Field
            label="Date (shipped / published)"
            name="displayDate"
            type="date"
            defaultValue={toDateInput(project?.displayDate ?? new Date())}
            help="Shown on the project page. Defaults to today on create."
          />
          <Field
            label="Views"
            name="viewCount"
            type="number"
            defaultValue={String(project?.viewCount ?? 200)}
            help="Used as the public counter. Auto-increments on each visit."
          />
        </div>
        <div className="flex flex-wrap gap-4 pt-2">
          <Toggle
            label="Published"
            name="published"
            defaultChecked={project?.published ?? true}
            help="Publicly visible"
          />
        </div>
        <p className="text-xs text-[var(--color-fg-muted)] mt-2">
          Mark as <span className="text-[var(--color-accent)]">featured</span> via the star in the project list — only one project can be featured at a time.
        </p>
      </Card>

      <Card title="Status">
        <Select
          label="Project status"
          name="status"
          defaultValue={project?.status ?? "live"}
          options={[
            { label: "Live", value: "live" },
            { label: "WIP", value: "wip" },
            { label: "Archived", value: "archived" },
            { label: "Open source", value: "oss" },
          ]}
        />
      </Card>

      <Card title="Case study">
        <Toggle
          label="Has case study"
          name="hasCaseStudy"
          defaultChecked={project?.hasCaseStudy ?? false}
          help="Show an in-depth case study section on the public page"
          onChange={(e) => setHasCase(e.currentTarget.checked)}
        />
        <div className={hasCase ? "block space-y-5" : "hidden"}>
          <Field
            label="Challenge"
            name="caseChallenge"
            as="textarea"
            rows={5}
            defaultValue={project?.caseChallenge}
            placeholder="What problem did this project solve?"
          />
          <Field
            label="Process"
            name="caseProcess"
            as="textarea"
            rows={5}
            defaultValue={project?.caseProcess}
            placeholder="How did you approach the work?"
          />
          <Field
            label="Outcome"
            name="caseOutcome"
            as="textarea"
            rows={5}
            defaultValue={project?.caseOutcome}
            placeholder="What was the result?"
          />
          <Field
            label="Lessons learned"
            name="caseLessons"
            as="textarea"
            rows={5}
            defaultValue={project?.caseLessons}
            placeholder="Key takeaways from the project"
          />
        </div>
      </Card>

      <Card title="Before / After (optional)">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field
            label="Before URL"
            name="beforeUrl"
            defaultValue={project?.beforeUrl ?? ""}
            placeholder="https://..."
          />
          <Field
            label="After URL"
            name="afterUrl"
            defaultValue={project?.afterUrl ?? ""}
            placeholder="https://..."
          />
        </div>
        <p className="text-xs text-[var(--color-fg-muted)] mt-2">
          Used by the before/after slider on the public page.
        </p>
      </Card>

      <Card title="Gallery">
        {existingImages.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {existingImages.map((img) => {
              const video = isVideoUrl(img.url);
              return (
                <div
                  key={img.id}
                  className="group relative aspect-square rounded-lg overflow-hidden border border-[var(--color-border)] bg-[var(--color-bg)]"
                >
                  {video ? (
                    <video
                      src={img.url}
                      muted
                      loop
                      playsInline
                      preload="metadata"
                      className="absolute inset-0 w-full h-full object-cover"
                      onMouseEnter={(e) => e.currentTarget.play().catch(() => {})}
                      onMouseLeave={(e) => e.currentTarget.pause()}
                    />
                  ) : (
                    <Image src={img.url} alt={img.alt} fill sizes="200px" className="object-cover" />
                  )}
                  {video && (
                    <span className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-black/70 text-white text-[10px] font-mono uppercase tracking-wider">
                      Video
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => askRemoveImage(img.id)}
                    className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-500/90 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={12} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <FileInput
          label={existingImages.length > 0 ? "Add more media" : "Upload images or videos"}
          name="galleryFiles"
          multiple
          accept="image/png,image/jpeg,image/webp,image/gif,image/avif,video/mp4,video/webm,video/quicktime"
          onChange={onGalleryChange}
        />
        <p className="text-xs text-[var(--color-fg-muted)] mt-2">
          Images up to 10 MB · Video up to 100 MB. Videos play on hover in admin and loop on the public page.
        </p>

        {galleryPreviews.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            {galleryPreviews.map((p, i) => (
              <div
                key={i}
                className="relative aspect-square rounded-lg overflow-hidden border border-[var(--color-accent)] bg-[var(--color-bg)]"
              >
                {p.isVideo ? (
                  <video
                    src={p.url}
                    autoPlay
                    muted
                    loop
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                ) : (
                  <Image src={p.url} alt="" fill sizes="200px" className="object-cover" unoptimized />
                )}
                <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-[var(--color-accent)] text-[var(--color-bg)] text-[10px] font-mono uppercase tracking-wider">
                  New {p.isVideo ? "video" : ""}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-red-500/30 bg-red-500/5 text-red-400 text-sm">
          <AlertCircle size={14} />
          {error}
        </div>
      )}

      <div className="flex items-center justify-end gap-3 sticky bottom-6 bg-[var(--color-bg)]/80 backdrop-blur-sm py-4 -mx-2 px-2 rounded-2xl border border-[var(--color-border)]">
        {savedAt && (
          <span
            key={savedAt}
            className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[var(--color-accent)] mr-auto"
          >
            <Check size={12} />
            Saved
          </span>
        )}
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[var(--color-accent)] text-[var(--color-bg)] font-medium text-sm hover:shadow-[0_0_30px_var(--color-accent-glow)] transition-shadow disabled:opacity-60"
        >
          {isPending ? "Saving..." : mode === "create" ? "Create project" : "Save changes"}
        </button>
      </div>
    </form>
    </>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
      <header className="px-6 py-4 border-b border-[var(--color-border)]">
        <h3 className="font-display text-base font-medium">{title}</h3>
      </header>
      <div className="p-6 space-y-5">{children}</div>
    </section>
  );
}

function toDateInput(d: Date | string | null | undefined): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function Field({
  label,
  name,
  defaultValue,
  placeholder,
  required,
  help,
  as = "input",
  type = "text",
  rows,
}: {
  label: string;
  name: string;
  defaultValue?: string | null;
  placeholder?: string;
  required?: boolean;
  help?: string;
  as?: "input" | "textarea";
  type?: string;
  rows?: number;
}) {
  const cls =
    "w-full px-3 py-2.5 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-fg)] placeholder:text-[var(--color-fg-dim)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 transition-all";
  return (
    <label className="block">
      <span className="block text-sm font-medium mb-1.5">
        {label}
        {required && <span className="text-[var(--color-accent)] ml-1">*</span>}
      </span>
      {as === "textarea" ? (
        <textarea
          name={name}
          defaultValue={defaultValue ?? ""}
          placeholder={placeholder}
          required={required}
          rows={rows ?? 4}
          className={`${cls} resize-y`}
        />
      ) : (
        <input
          name={name}
          type={type}
          defaultValue={defaultValue ?? ""}
          placeholder={placeholder}
          required={required}
          className={cls}
        />
      )}
      {help && <span className="block text-xs text-[var(--color-fg-muted)] mt-1.5">{help}</span>}
    </label>
  );
}

function Select({
  label,
  name,
  defaultValue,
  options,
}: {
  label: string;
  name: string;
  defaultValue: string;
  options: { label: string; value: string }[];
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium mb-1.5">{label}</span>
      <select
        name={name}
        defaultValue={defaultValue}
        className="w-full px-3 py-2.5 rounded-lg bg-[var(--color-bg)] border border-[var(--color-border)] text-[var(--color-fg)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 transition-all"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function Toggle({
  label,
  name,
  defaultChecked,
  help,
  onChange,
}: {
  label: string;
  name: string;
  defaultChecked: boolean;
  help?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <label className="inline-flex items-center gap-3 cursor-pointer select-none px-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] hover:border-[var(--color-border-strong)] transition-colors">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        onChange={onChange}
        className="peer sr-only"
      />
      <span className="relative h-5 w-9 rounded-full bg-[var(--color-surface-2)] border border-[var(--color-border)] peer-checked:bg-[var(--color-accent)] peer-checked:border-[var(--color-accent)] transition-colors">
        <span className="absolute top-0.5 left-0.5 h-3.5 w-3.5 rounded-full bg-[var(--color-fg)] peer-checked:translate-x-4 transition-transform" />
      </span>
      <div>
        <div className="text-sm font-medium">{label}</div>
        {help && <div className="text-xs text-[var(--color-fg-muted)]">{help}</div>}
      </div>
    </label>
  );
}

function FileInput({
  label,
  name,
  multiple,
  accept,
  onChange,
}: {
  label: string;
  name: string;
  multiple?: boolean;
  accept?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  const acceptVideo = !!accept && accept.includes("video/");
  return (
    <label className="block">
      <span className="block text-sm font-medium mb-1.5">{label}</span>
      <div className="relative flex items-center justify-center px-4 py-6 rounded-xl border-2 border-dashed border-[var(--color-border)] bg-[var(--color-bg)] hover:border-[var(--color-accent)] hover:bg-[var(--color-surface-2)] transition-colors cursor-pointer text-sm text-[var(--color-fg-muted)]">
        <Upload size={16} className="mr-2" />
        Click or drop {acceptVideo ? "an image or video" : "an image"} {multiple && "(multiple allowed)"}
        <input
          type="file"
          name={name}
          accept={accept ?? "image/png,image/jpeg,image/webp,image/gif,image/avif"}
          multiple={multiple}
          onChange={onChange}
          className="absolute inset-0 opacity-0 cursor-pointer"
        />
      </div>
    </label>
  );
}
