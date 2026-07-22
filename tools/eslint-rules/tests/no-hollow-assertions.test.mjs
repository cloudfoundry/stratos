import { describe, it } from "node:test";
import { RuleTester } from "eslint";
import tseslint from "typescript-eslint";
import rule from "../rules/no-hollow-assertions.mjs";

RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester({
  languageOptions: { parser: tseslint.parser },
});

ruleTester.run("no-hollow-assertions", rule, {
  valid: [
    // real assertions
    { code: `expect(count).toBe(3);` },
    { code: `await expect(row).toBeVisible();` },
    { code: `expect(name).toContain('app');` },
    // not.toBeDefined asserts absence — can fail, leave it alone
    { code: `expect(x).not.toBeDefined();` },
    // catch as a conditional guard (not an assertion) is out of scope
    { code: `if (await el.isVisible().catch(() => false)) { await el.click(); }` },
    // catch that rethrows or does work is fine even inside expect
    { code: `expect(await load().catch(e => defaults(e))).toEqual(defaults());` },
    // undefined comparison outside expect is not an assertion
    { code: `const has = x !== undefined;` },
    // expect() not the global matcher entry (member call) untouched
    { code: `foo.expect(x !== undefined);` },
  ],
  invalid: [
    // can never go red
    { code: `expect(page).toBeDefined();`, errors: [{ messageId: "hollowMatcher" }] },
    {
      code: `expect(result !== undefined).toBeTruthy();`,
      errors: [{ messageId: "undefinedComparison" }],
    },
    {
      code: `expect(undefined === result).toBe(false);`,
      errors: [{ messageId: "undefinedComparison" }],
    },
    {
      code: `expect(result != undefined).toBeTruthy();`,
      errors: [{ messageId: "undefinedComparison" }],
    },
    // error swallowed on the way into the assert
    {
      code: `expect(await el.isVisible().catch(() => false)).toBe(true);`,
      errors: [{ messageId: "swallowedCatch" }],
    },
    {
      code: `expect(await el.count().catch(() => 0)).toBeGreaterThan(0);`,
      errors: [{ messageId: "swallowedCatch" }],
    },
    // two hollow patterns in one expect argument both report in one pass
    {
      code: `expect(x !== undefined && (await p.catch(() => false))).toBeTruthy();`,
      errors: [{ messageId: "undefinedComparison" }, { messageId: "swallowedCatch" }],
    },
  ],
});
