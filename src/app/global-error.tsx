"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global route error", {
      message: error.message,
      digest: error.digest,
    });
  }, [error]);

  return (
    <html lang="th">
      <body>
        <main
          style={{
            minHeight: "100vh",
            display: "grid",
            placeItems: "center",
            padding: "24px",
            fontFamily:
              'Geist, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
          }}
        >
          <section
            style={{
              width: "100%",
              maxWidth: "520px",
              border: "1px solid #e5e7eb",
              borderRadius: "12px",
              padding: "28px",
            }}
          >
            <p style={{ color: "#dc2626", fontWeight: 600, margin: 0 }}>
              Something went wrong
            </p>
            <h1 style={{ fontSize: "28px", margin: "12px 0" }}>
              Engleet could not load
            </h1>
            <p style={{ color: "#64748b", lineHeight: 1.7 }}>
              The error has been logged. Please try again.
            </p>
            <button
              type="button"
              onClick={reset}
              style={{
                marginTop: "16px",
                border: 0,
                borderRadius: "8px",
                background: "#111827",
                color: "white",
                cursor: "pointer",
                fontWeight: 600,
                padding: "10px 14px",
              }}
            >
              Try again
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
