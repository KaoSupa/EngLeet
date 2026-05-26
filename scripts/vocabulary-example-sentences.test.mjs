import { describe, expect, it } from "vitest";

import {
  exampleSentenceForVocabularyEntry,
  isVerbTemplateExample,
} from "./vocabulary-example-sentences.mjs";

describe("vocabulary example sentences", () => {
  it("detects the old verb template", () => {
    expect(
      isVerbTemplateExample(
        'Learners often practice the verb "run" in short conversations.',
      ),
    ).toBe(true);
    expect(isVerbTemplateExample("She runs around the park every morning.")).toBe(
      false,
    );
  });

  it("prefers clean contextual examples for common verbs", () => {
    expect(
      exampleSentenceForVocabularyEntry({
        word: "give",
        part_of_speech: "verb",
        definition: "cause to have, in the abstract sense or physical sense",
        wordnetExample: "She gave him a black eye",
      }),
    ).toBe("Can you give me a moment to think?");
  });

  it("uses suitable WordNet examples when they contain the target word", () => {
    expect(
      exampleSentenceForVocabularyEntry({
        word: "play",
        part_of_speech: "verb",
        definition: "participate in games or sport",
        wordnetExample: "We played hockey all afternoon",
      }),
    ).toBe("We play basketball after class on Fridays.");

    expect(
      exampleSentenceForVocabularyEntry({
        word: "retire",
        part_of_speech: "verb",
        definition: "go into retirement",
        wordnetExample: "He retired at age 68",
      }),
    ).toBe("He retired at age 68.");
  });
});
