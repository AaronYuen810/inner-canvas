import assert from "node:assert/strict";
import test from "node:test";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { AppShell } from "@/components/AppShell";

test("app shell progress nav only shows Reflect and Canvas", () => {
  const html = renderToStaticMarkup(
    createElement(
      AppShell,
      {
        stage: "result",
        subtitle: "Turn a short reflection into a quiet visual companion.",
      },
      createElement("div", null, "content")
    )
  );

  assert.match(html, />Reflect</);
  assert.match(html, />Canvas</);
  assert.doesNotMatch(html, />Review</);
});
