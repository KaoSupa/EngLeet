import { describe, expect, it } from "vitest";

import {
  ApiRequestError,
  getOptionalInteger,
  getRequiredInteger,
  readJsonObject,
} from "./request";

describe("api request helpers", () => {
  it("reads valid JSON objects", async () => {
    const request = new Request("https://engleet.test/api", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studyTimeSeconds: 60 }),
    });

    await expect(readJsonObject(request)).resolves.toEqual({
      studyTimeSeconds: 60,
    });
  });

  it("rejects non-object JSON bodies", async () => {
    const request = new Request("https://engleet.test/api", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(["bad"]),
    });

    await expect(readJsonObject(request)).rejects.toBeInstanceOf(
      ApiRequestError,
    );
  });

  it("validates integer request fields", () => {
    expect(getOptionalInteger({ value: 3 }, "value")).toBe(3);
    expect(getOptionalInteger({}, "value")).toBeUndefined();
    expect(getRequiredInteger({ value: 0 }, "value")).toBe(0);
    expect(() => getRequiredInteger({}, "value")).toThrow(ApiRequestError);
    expect(() => getOptionalInteger({ value: 1.5 }, "value")).toThrow(
      ApiRequestError,
    );
  });
});
