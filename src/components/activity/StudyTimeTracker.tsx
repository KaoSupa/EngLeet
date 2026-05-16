"use client";

import { useEffect, useRef } from "react";

const HEARTBEAT_SECONDS = 60;
const MAX_IDLE_MS = 60_000;
const TICK_MS = 1_000;
const MIN_FLUSH_SECONDS = 5;
const MAX_FLUSH_SECONDS = 300;

function clampStudySeconds(seconds: number) {
  return Math.min(MAX_FLUSH_SECONDS, Math.max(0, Math.floor(seconds)));
}

function isPageActive(lastInteractionAt: number) {
  return (
    document.visibilityState === "visible" &&
    Date.now() - lastInteractionAt <= MAX_IDLE_MS
  );
}

function sendStudyTime(seconds: number, keepalive = false) {
  const studyTimeSeconds = clampStudySeconds(seconds);
  if (studyTimeSeconds < MIN_FLUSH_SECONDS) {
    return Promise.resolve<Response | null>(null);
  }

  return fetch("/api/learning/activity", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    keepalive,
    body: JSON.stringify({ studyTimeSeconds }),
  });
}

export default function StudyTimeTracker() {
  const bufferedSecondsRef = useRef(0);
  const lastTickAtRef = useRef<number | null>(null);
  const lastInteractionAtRef = useRef(Date.now());
  const disabledRef = useRef(false);
  const pendingRef = useRef(false);

  useEffect(() => {
    function markInteraction() {
      lastInteractionAtRef.current = Date.now();
    }

    async function flush(keepalive = false) {
      if (pendingRef.current || disabledRef.current) {
        return;
      }

      const seconds = clampStudySeconds(bufferedSecondsRef.current);
      if (seconds < MIN_FLUSH_SECONDS) {
        return;
      }

      bufferedSecondsRef.current = 0;
      pendingRef.current = true;

      try {
        const response = await sendStudyTime(seconds, keepalive);
        if (response?.status === 401 || response?.status === 403) {
          disabledRef.current = true;
        }
      } catch {
        bufferedSecondsRef.current += seconds;
      } finally {
        pendingRef.current = false;
      }
    }

    function flushOnPageHide() {
      const seconds = clampStudySeconds(bufferedSecondsRef.current);
      if (seconds < MIN_FLUSH_SECONDS || disabledRef.current) {
        return;
      }

      bufferedSecondsRef.current = 0;
      const body = new Blob([JSON.stringify({ studyTimeSeconds: seconds })], {
        type: "application/json",
      });
      navigator.sendBeacon?.("/api/learning/activity", body);
    }

    const activityEvents = [
      "keydown",
      "pointerdown",
      "pointermove",
      "scroll",
      "touchstart",
    ] as const;

    activityEvents.forEach((eventName) => {
      window.addEventListener(eventName, markInteraction, { passive: true });
    });
    window.addEventListener("focus", markInteraction);
    window.addEventListener("pagehide", flushOnPageHide);

    const intervalId = window.setInterval(() => {
      const now = Date.now();
      const lastTickAt = lastTickAtRef.current ?? now;
      lastTickAtRef.current = now;

      if (disabledRef.current || !isPageActive(lastInteractionAtRef.current)) {
        return;
      }

      const deltaSeconds = Math.min(5, Math.max(0, (now - lastTickAt) / 1000));
      bufferedSecondsRef.current += deltaSeconds;

      if (bufferedSecondsRef.current >= HEARTBEAT_SECONDS) {
        void flush();
      }
    }, TICK_MS);

    return () => {
      window.clearInterval(intervalId);
      activityEvents.forEach((eventName) => {
        window.removeEventListener(eventName, markInteraction);
      });
      window.removeEventListener("focus", markInteraction);
      window.removeEventListener("pagehide", flushOnPageHide);
      flushOnPageHide();
    };
  }, []);

  return null;
}
