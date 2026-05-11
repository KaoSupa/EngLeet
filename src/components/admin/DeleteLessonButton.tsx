"use client";

import { useFormStatus } from "react-dom";
import { Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function DeleteLessonButton({
  action,
  lessonId,
  lessonTitle,
}: {
  action: (formData: FormData) => Promise<void>;
  lessonId: string;
  lessonTitle: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        const confirmed = window.confirm(
          `ลบ lesson "${lessonTitle}" ใช่ไหม? การลบนี้จะลบ quiz, options, progress และคำตอบที่เกี่ยวข้องด้วย`,
        );

        if (!confirmed) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="lessonId" value={lessonId} />
      <DeleteButton />
    </form>
  );
}

function DeleteButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" variant="destructive" disabled={pending}>
      <Trash2 />
      {pending ? "Deleting..." : "Delete lesson"}
    </Button>
  );
}
