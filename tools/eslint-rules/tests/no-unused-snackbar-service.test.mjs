import { describe, it } from "node:test";
import { RuleTester } from "eslint";
import tseslint from "typescript-eslint";
import rule from "../rules/no-unused-snackbar-service.mjs";

RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester({
  languageOptions: { parser: tseslint.parser },
});

ruleTester.run("no-unused-snackbar-service", rule, {
  valid: [
    // inject() property, used via method call
    {
      code: `
        class A {
          private snackBar = inject(TailwindSnackBarService);
          save() { this.snackBar.show('saved'); }
        }`,
    },
    // used via a method other than show
    {
      code: `
        class A {
          private snackBar = inject(TailwindSnackBarService);
          fail() { this.snackBar.error('boom'); }
        }`,
    },
    // passed through to a helper — still a use
    {
      code: `
        class A {
          private snackBar = inject(TailwindSnackBarService);
          wire() { helper(this.snackBar); }
        }`,
    },
    // constructor parameter property, used
    {
      code: `
        class A {
          constructor(private snackBar: TailwindSnackBarService) {}
          go() { this.snackBar.show('x'); }
        }`,
    },
    // plain constructor param used locally
    {
      code: `
        class A {
          constructor(snackBar: TailwindSnackBarService) { snackBar.show('x'); }
        }`,
    },
    // parameter property used by its bare name inside the constructor body —
    // legal TS, must not be a false positive
    {
      code: `
        class A {
          constructor(private snackBar: TailwindSnackBarService) { snackBar.show('saved'); }
        }`,
    },
    // optional chaining use
    {
      code: `
        class A {
          private snackBar = inject(TailwindSnackBarService);
          go() { this.snackBar?.show('x'); }
        }`,
    },
    // no injection at all
    { code: `class A { go() {} }` },
    // other injected services are not this rule's business
    {
      code: `
        class A {
          private http = inject(HttpClient);
        }`,
    },
  ],
  invalid: [
    // inject() property never referenced again
    {
      code: `
        class A {
          private snackBar = inject(TailwindSnackBarService);
          go() {}
        }`,
      errors: [{ messageId: "unusedInjection" }],
    },
    // constructor parameter property never referenced
    {
      code: `
        class A {
          constructor(private snackBar: TailwindSnackBarService) {}
          go() {}
        }`,
      errors: [{ messageId: "unusedInjection" }],
    },
    // plain constructor param never referenced
    {
      code: `
        class A {
          constructor(snackBar: TailwindSnackBarService) {}
        }`,
      errors: [{ messageId: "unusedInjection" }],
    },
    // a different this.property with the same-ish name does not count
    {
      code: `
        class A {
          private snackBar = inject(TailwindSnackBarService);
          private snackBarConfig = { x: 1 };
          go() { return this.snackBarConfig; }
        }`,
      errors: [{ messageId: "unusedInjection" }],
    },
    // an unrelated identifier with the same name elsewhere in the class must
    // not mask an unused injection (scope-aware resolution)
    {
      code: `
        class A {
          constructor(snackBar: TailwindSnackBarService) {}
          other(snackBar: string) { return snackBar.length; }
        }`,
      errors: [{ messageId: "unusedInjection" }],
    },
    // two classes in one file: only the unused one is flagged
    {
      code: `
        class Used {
          private snackBar = inject(TailwindSnackBarService);
          go() { this.snackBar.show('x'); }
        }
        class Unused {
          private snackBar = inject(TailwindSnackBarService);
        }`,
      errors: [{ messageId: "unusedInjection" }],
    },
  ],
});
