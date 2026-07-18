import { describe, it } from "node:test";
import { RuleTester } from "eslint";
import tseslint from "typescript-eslint";
import rule from "../rules/no-dead-material-selectors.mjs";

RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester({
  languageOptions: { parser: tseslint.parser },
});

ruleTester.run("no-dead-material-selectors", rule, {
  valid: [
    // modern selectors are fine
    { code: `page.locator('[data-test="row-actions"]');` },
    { code: `page.locator('table tbody tr');` },
    // "mat" inside a word is not a Material token
    { code: `const x = 'format-date';` },
    { code: `const x = 'automat-ic';` },
    // legit words containing "app-list" as substring boundary-checked
    { code: `const x = 'app-listing-page';` },
    // template literal without dead tokens
    { code: "page.locator(`#app-\\${id}`);" },
  ],
  invalid: [
    { code: `page.locator('mat-table');`, errors: [{ messageId: "deadSelector" }] },
    { code: `page.locator('mat-icon.warn');`, errors: [{ messageId: "deadSelector" }] },
    { code: `page.locator('.mat-error');`, errors: [{ messageId: "deadSelector" }] },
    { code: `page.locator('app-list');`, errors: [{ messageId: "deadSelector" }] },
    { code: `page.locator('app-list.app-wall');`, errors: [{ messageId: "deadSelector" }] },
    // dead token buried in a selector list
    {
      code: `page.locator('button, mat-button-toggle');`,
      errors: [{ messageId: "deadSelector" }],
    },
    // attribute-contains form
    {
      code: `page.locator('[class*="mat-card"]');`,
      errors: [{ messageId: "deadSelector" }],
    },
    // template literal with a dead token
    {
      code: "page.locator(`mat-select >> nth=\\${i}`);",
      errors: [{ messageId: "deadSelector" }],
    },
  ],
});
