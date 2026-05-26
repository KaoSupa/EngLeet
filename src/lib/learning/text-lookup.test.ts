import { describe, expect, it } from "vitest";

import {
  getTextLookupCandidates,
  getTextLookupTokens,
  normalizeLookupText,
} from "./text-lookup";

describe("text selection lookup helpers", () => {
  it("normalizes selected English text", () => {
    expect(normalizeLookupText("  Running, quickly!  ")).toBe(
      "running quickly",
    );
    expect(normalizeLookupText("student’s book")).toBe("student's book");
  });

  it("extracts useful candidates for a selected sentence", () => {
    expect(
      getTextLookupCandidates("Learners are running to appointments."),
    ).toEqual([
      "learners",
      "learner",
      "running",
      "run",
      "appointments",
      "appointment",
    ]);
  });

  it("keeps short words when a single word is selected", () => {
    expect(getTextLookupTokens("I")).toEqual(["i"]);
    expect(getTextLookupCandidates("I")).toEqual(["i"]);
  });
});
