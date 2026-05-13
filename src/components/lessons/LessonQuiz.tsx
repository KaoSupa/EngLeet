"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { CheckCircle2, Loader2, Lock, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { trackQuizSubmit } from "@/lib/analytics/events";
import type { LessonQuizQuestion } from "@/lib/learning/lessons";

type QuizResult = {
  attempt_id: string;
  score: number;
  max_score: number;
  percentage: number;
  passed: boolean;
  xp_earned: number;
};

export default function LessonQuiz({
  lessonId,
  questions,
  passingScore,
  isAuthenticated,
}: {
  lessonId: string;
  questions: LessonQuizQuestion[];
  passingScore: number;
  isAuthenticated: boolean;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const answeredCount = useMemo(
    () => questions.filter((question) => answers[question.id]).length,
    [answers, questions],
  );
  const canSubmit = answeredCount === questions.length && questions.length > 0;

  if (questions.length === 0) {
    return null;
  }

  if (!isAuthenticated) {
    return (
      <section className="rounded-lg border bg-card p-6">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-muted p-2">
            <Lock className="size-5" />
          </div>
          <div className="space-y-3">
            <div>
              <h2 className="text-lg font-semibold">Quiz</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                เข้าสู่ระบบเพื่อทำ quiz และบันทึก XP
              </p>
            </div>
            <Button asChild>
              <Link href="/login?next=/learn/lessons">Login</Link>
            </Button>
          </div>
        </div>
      </section>
    );
  }

  function setAnswer(questionId: string, optionId: string) {
    setAnswers((current) => ({ ...current, [questionId]: optionId }));
    setResult(null);
    setError(null);
  }

  function resetQuiz() {
    setAnswers({});
    setResult(null);
    setError(null);
  }

  function submitQuiz() {
    if (!canSubmit) {
      return;
    }

    startTransition(async () => {
      setError(null);

      const response = await fetch(`/api/learning/lessons/${lessonId}/quiz`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: Object.entries(answers).map(
            ([question_id, selected_option_id]) => ({
              question_id,
              selected_option_id,
            }),
          ),
        }),
      });

      const payload = (await response.json()) as {
        data?: QuizResult;
        error?: string;
      };

      if (!response.ok || !payload.data) {
        setError(payload.error ?? "ส่งคำตอบไม่สำเร็จ");
        return;
      }

      setResult(payload.data);
      trackQuizSubmit({
        lessonId,
        score: payload.data.score,
        percentage: payload.data.percentage,
        passed: payload.data.passed,
      });
    });
  }

  return (
    <section className="space-y-5 rounded-lg border bg-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold">Quiz</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {answeredCount}/{questions.length} questions · pass {passingScore}%
          </p>
        </div>
        <Button type="button" variant="outline" onClick={resetQuiz}>
          <RotateCcw />
          Reset
        </Button>
      </div>

      <div className="space-y-5">
        {questions.map((question, index) => (
          <fieldset key={question.id} className="space-y-3">
            <legend className="text-sm font-semibold">
              {index + 1}. {question.question}
            </legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {question.options.map((option) => {
                const optionId = option.id ?? "";
                return (
                  <label
                    key={optionId}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border bg-background p-3 text-sm transition-colors hover:bg-muted"
                  >
                    <input
                      type="radio"
                      name={question.id}
                      value={optionId}
                      checked={answers[question.id] === optionId}
                      onChange={() => setAnswer(question.id, optionId)}
                      className="size-4 accent-primary"
                    />
                    <span>{option.content}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        ))}
      </div>

      {error && (
        <p className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      {result && (
        <div className="rounded-lg border bg-muted/40 p-4">
          <div className="flex items-center gap-2 font-semibold">
            <CheckCircle2 className="size-5 text-primary" />
            {result.passed ? "ผ่านแล้ว" : "ยังไม่ผ่าน"}
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            Score {result.score}/{result.max_score} ({result.percentage}%)
            {result.xp_earned > 0 ? ` · +${result.xp_earned} XP` : ""}
          </p>
        </div>
      )}

      <Button
        type="button"
        disabled={!canSubmit || isPending}
        onClick={submitQuiz}
        className="w-full sm:w-auto"
      >
        {isPending && <Loader2 className="animate-spin" />}
        Submit Quiz
      </Button>
    </section>
  );
}
