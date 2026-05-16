import { describe, expect, it } from "vitest";

import { parseLessonFilters } from "./lessons";
import { parseVocabularyFilters } from "./vocabulary";

describe("learning filter parsing", () => {
  it("normalizes lesson filters to known enum values", () => {
    expect(
      parseLessonFilters({
        q: "  grammar  ",
        level: "B1",
        category: "reading",
      }),
    ).toEqual({
      q: "grammar",
      level: "B1",
      category: "reading",
    });

    expect(parseLessonFilters({ level: "bad", category: "bad" })).toEqual({
      q: "",
      level: "all",
      category: "all",
    });
  });

  it("normalizes vocabulary filters and clamps invalid values", () => {
    expect(
      parseVocabularyFilters({
        q: " travel ",
        level: "A2",
        part: "noun",
        list: "toeic",
        difficulty: "3",
        saved: "1",
      }),
    ).toEqual({
      q: "travel",
      level: "A2",
      part: "noun",
      tag: "",
      list: "toeic",
      difficulty: 3,
      savedOnly: true,
    });

    expect(
      parseVocabularyFilters({
        level: "bad",
        part: "bad",
        list: "bad",
        difficulty: "9",
      }),
    ).toMatchObject({
      level: "all",
      part: "all",
      list: "all",
      difficulty: null,
      savedOnly: false,
    });
  });
});
