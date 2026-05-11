"use client";

import { useActionState, useState, useTransition } from "react";
import type { ChangeEvent, ReactNode } from "react";
import { ImageUp, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { LessonFormState } from "@/app/(admin)/admin/lessons/actions";

type QuestionDraft = {
  id: string;
  text: string;
  type: "multiple_choice" | "true_false";
  points: number;
  correctIndex: number;
  explanation: string;
  options: string[];
};

export type LessonEditorInitialData = {
  lessonId?: string;
  title?: string;
  slug?: string;
  description?: string;
  thumbnailUrl?: string;
  category?: string;
  cefrLevel?: string;
  status?: string;
  estimatedMinutes?: number;
  xpReward?: number;
  passingScore?: number;
  metaTitle?: string;
  metaDescription?: string;
  courseTitle?: string;
  unitTitle?: string;
  body?: string;
  callout?: string;
  imageUrl?: string;
  imageAlt?: string;
  imageCaption?: string;
  videoUrl?: string;
  videoCaption?: string;
  questions?: QuestionDraft[];
};

const CATEGORY_OPTIONS = [
  "vocabulary",
  "grammar",
  "pronunciation",
  "listening",
  "reading",
  "writing",
  "speaking",
  "conversation",
];
const LEVEL_OPTIONS = ["A1", "A2", "B1", "B2", "C1", "C2"];
const STATUS_OPTIONS = ["draft", "published", "archived"];

function createQuestion(): QuestionDraft {
  return {
    id: crypto.randomUUID(),
    text: "",
    type: "multiple_choice",
    points: 1,
    correctIndex: 0,
    explanation: "",
    options: ["", "", "", ""],
  };
}

export default function LessonEditorForm({
  action,
  initialData = {},
}: {
  action: (
    state: LessonFormState,
    formData: FormData,
  ) => Promise<LessonFormState>;
  initialData?: LessonEditorInitialData;
}) {
  const [state, formAction, isPending] = useActionState(action, {
    error: null,
  });
  const [questions, setQuestions] = useState<QuestionDraft[]>(
    initialData.questions?.length ? initialData.questions : [createQuestion()],
  );
  const [thumbnailUrl, setThumbnailUrl] = useState(
    initialData.thumbnailUrl ?? "",
  );
  const [imageUrl, setImageUrl] = useState(initialData.imageUrl ?? "");

  function updateQuestion(
    id: string,
    updater: (question: QuestionDraft) => QuestionDraft,
  ) {
    setQuestions((current) =>
      current.map((question) => (question.id === id ? updater(question) : question)),
    );
  }

  function removeQuestion(id: string) {
    setQuestions((current) => current.filter((question) => question.id !== id));
  }

  return (
    <form action={formAction} className="space-y-8">
      <input type="hidden" name="lessonId" value={initialData.lessonId ?? ""} />
      <input type="hidden" name="questionCount" value={questions.length} />

      {state.error && (
        <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <section className="space-y-5 rounded-lg border bg-card p-5">
        <h2 className="text-lg font-semibold">Lesson</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Title">
            <input
              name="title"
              defaultValue={initialData.title}
              required
              className={inputClass}
            />
          </Field>
          <Field label="Slug">
            <input
              name="slug"
              defaultValue={initialData.slug}
              className={inputClass}
            />
          </Field>
          <Field label="Course">
            <input
              name="courseTitle"
              defaultValue={initialData.courseTitle ?? "Engleet Core"}
              className={inputClass}
            />
          </Field>
          <Field label="Unit">
            <input
              name="unitTitle"
              defaultValue={initialData.unitTitle ?? "Foundation"}
              className={inputClass}
            />
          </Field>
          <Field label="Category">
            <select
              name="category"
              defaultValue={initialData.category ?? "vocabulary"}
              className={inputClass}
            >
              {CATEGORY_OPTIONS.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </Field>
          <Field label="CEFR">
            <select
              name="cefrLevel"
              defaultValue={initialData.cefrLevel ?? "A1"}
              className={inputClass}
            >
              {LEVEL_OPTIONS.map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Status">
            <select
              name="status"
              defaultValue={initialData.status ?? "draft"}
              className={inputClass}
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              Published lessons are visible on /learn/lessons. Draft lessons stay
              hidden from learners.
            </p>
          </Field>
          <Field label="Thumbnail URL">
            <input
              name="thumbnailUrl"
              value={thumbnailUrl}
              className={inputClass}
              onChange={(event) => setThumbnailUrl(event.target.value)}
            />
            <ImageUploadButton onUploaded={setThumbnailUrl} />
          </Field>
          <Field label="Minutes">
            <input
              name="estimatedMinutes"
              type="number"
              min={1}
              defaultValue={initialData.estimatedMinutes ?? 10}
              className={inputClass}
            />
          </Field>
          <Field label="XP">
            <input
              name="xpReward"
              type="number"
              min={0}
              defaultValue={initialData.xpReward ?? 25}
              className={inputClass}
            />
          </Field>
          <Field label="Passing score">
            <input
              name="passingScore"
              type="number"
              min={0}
              max={100}
              defaultValue={initialData.passingScore ?? 70}
              className={inputClass}
            />
          </Field>
        </div>
        <Field label="Description">
          <textarea
            name="description"
            defaultValue={initialData.description}
            rows={3}
            className={inputClass}
          />
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="SEO title">
            <input
              name="metaTitle"
              defaultValue={initialData.metaTitle}
              className={inputClass}
            />
          </Field>
          <Field label="SEO description">
            <input
              name="metaDescription"
              defaultValue={initialData.metaDescription}
              className={inputClass}
            />
          </Field>
        </div>
      </section>

      <section className="space-y-5 rounded-lg border bg-card p-5">
        <h2 className="text-lg font-semibold">Content</h2>
        <Field label="Body">
          <textarea
            name="body"
            defaultValue={initialData.body}
            rows={12}
            className={inputClass}
          />
        </Field>
        <Field label="Callout">
          <textarea
            name="callout"
            defaultValue={initialData.callout}
            rows={3}
            className={inputClass}
          />
        </Field>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Image URL">
            <input
              name="imageUrl"
              value={imageUrl}
              className={inputClass}
              onChange={(event) => setImageUrl(event.target.value)}
            />
            <ImageUploadButton onUploaded={setImageUrl} />
          </Field>
          <Field label="Image alt">
            <input
              name="imageAlt"
              defaultValue={initialData.imageAlt}
              className={inputClass}
            />
          </Field>
          <Field label="Image caption">
            <input
              name="imageCaption"
              defaultValue={initialData.imageCaption}
              className={inputClass}
            />
          </Field>
          <Field label="Video embed URL">
            <input
              name="videoUrl"
              defaultValue={initialData.videoUrl}
              className={inputClass}
            />
          </Field>
          <Field label="Video caption">
            <input
              name="videoCaption"
              defaultValue={initialData.videoCaption}
              className={inputClass}
            />
          </Field>
        </div>
      </section>

      <section className="space-y-5 rounded-lg border bg-card p-5">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">Quiz</h2>
          <Button
            type="button"
            variant="outline"
            onClick={() => setQuestions((current) => [...current, createQuestion()])}
          >
            <Plus />
            Question
          </Button>
        </div>

        <div className="space-y-4">
          {questions.map((question, index) => (
            <div key={question.id} className="space-y-4 rounded-lg border p-4">
              <input
                type="hidden"
                name={`question.${index}.type`}
                value={question.type}
              />
              <div className="flex items-center justify-between gap-3">
                <p className="font-medium">Question {index + 1}</p>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeQuestion(question.id)}
                >
                  <Trash2 />
                </Button>
              </div>
              <Field label="Prompt">
                <textarea
                  name={`question.${index}.text`}
                  value={question.text}
                  rows={2}
                  className={inputClass}
                  onChange={(event) =>
                    updateQuestion(question.id, (current) => ({
                      ...current,
                      text: event.target.value,
                    }))
                  }
                />
              </Field>
              <div className="grid gap-4 md:grid-cols-3">
                <Field label="Type">
                  <select
                    value={question.type}
                    className={inputClass}
                    onChange={(event) =>
                      updateQuestion(question.id, (current) => ({
                        ...current,
                        type: event.target.value as QuestionDraft["type"],
                        options:
                          event.target.value === "true_false"
                            ? ["True", "False", "", ""]
                            : current.options,
                        correctIndex: 0,
                      }))
                    }
                  >
                    <option value="multiple_choice">multiple_choice</option>
                    <option value="true_false">true_false</option>
                  </select>
                </Field>
                <Field label="Points">
                  <input
                    name={`question.${index}.points`}
                    type="number"
                    min={1}
                    value={question.points}
                    className={inputClass}
                    onChange={(event) =>
                      updateQuestion(question.id, (current) => ({
                        ...current,
                        points: Number.parseInt(event.target.value, 10) || 1,
                      }))
                    }
                  />
                </Field>
                <Field label="Correct">
                  <select
                    name={`question.${index}.correctIndex`}
                    value={question.correctIndex}
                    className={inputClass}
                    onChange={(event) =>
                      updateQuestion(question.id, (current) => ({
                        ...current,
                        correctIndex: Number.parseInt(event.target.value, 10),
                      }))
                    }
                  >
                    {question.options.slice(0, question.type === "true_false" ? 2 : 4).map(
                      (_option, optionIndex) => (
                        <option key={optionIndex} value={optionIndex}>
                          Option {optionIndex + 1}
                        </option>
                      ),
                    )}
                  </select>
                </Field>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {question.options
                  .slice(0, question.type === "true_false" ? 2 : 4)
                  .map((option, optionIndex) => (
                    <Field key={optionIndex} label={`Option ${optionIndex + 1}`}>
                      <input
                        name={`question.${index}.option.${optionIndex}`}
                        value={option}
                        readOnly={question.type === "true_false"}
                        className={inputClass}
                        onChange={(event) =>
                          updateQuestion(question.id, (current) => {
                            const nextOptions = [...current.options];
                            nextOptions[optionIndex] = event.target.value;
                            return { ...current, options: nextOptions };
                          })
                        }
                      />
                    </Field>
                  ))}
              </div>
              <Field label="Explanation">
                <textarea
                  name={`question.${index}.explanation`}
                  value={question.explanation}
                  rows={2}
                  className={inputClass}
                  onChange={(event) =>
                    updateQuestion(question.id, (current) => ({
                      ...current,
                      explanation: event.target.value,
                    }))
                  }
                />
              </Field>
            </div>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <Button
          type="submit"
          name="intent"
          value="save"
          size="lg"
          variant="outline"
          disabled={isPending}
        >
          {isPending ? "Saving..." : "Save draft"}
        </Button>
        <Button
          type="submit"
          name="intent"
          value="publish"
          size="lg"
          disabled={isPending}
        >
          {isPending ? "Publishing..." : "Publish lesson"}
        </Button>
      </div>
    </form>
  );
}

function ImageUploadButton({
  onUploaded,
}: {
  onUploaded: (url: string) => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function uploadImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    startTransition(async () => {
      setError(null);
      const formData = new FormData();
      formData.set("file", file);

      const response = await fetch("/api/admin/lesson-media", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as {
        data?: { url?: string };
        error?: string;
      };

      if (!response.ok || !payload.data?.url) {
        setError(payload.error ?? "Upload failed");
        return;
      }

      onUploaded(payload.data.url);
    });
  }

  return (
    <div className="space-y-2">
      <label className="inline-flex h-8 cursor-pointer items-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors hover:bg-muted">
        <ImageUp className="size-4" />
        {isPending ? "Uploading..." : "Upload image"}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="sr-only"
          disabled={isPending}
          onChange={uploadImage}
        />
      </label>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border bg-background px-3 py-2 text-sm outline-none transition-colors focus:border-primary focus:ring-3 focus:ring-primary/15";

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}
