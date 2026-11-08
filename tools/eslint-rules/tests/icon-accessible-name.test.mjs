import { describe, it } from "node:test";
import { RuleTester } from "eslint";
import templateParser from "@angular-eslint/template-parser";
import rule from "../rules/icon-accessible-name.mjs";

RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester({
  languageOptions: { parser: templateParser },
});

ruleTester.run("icon-accessible-name", rule, {
  valid: [
    // decoration, hidden
    { code: `<span class="material-icons" aria-hidden="true">warning</span> Disk full` },
    // an image with a name
    { code: `<span class="material-icons" role="img" aria-label="Warning">warning</span>` },
    { code: `<span class="material-icons" role="img" [attr.aria-label]="reason">warning</span>` },
    // inside something already hidden
    { code: `<a aria-hidden="true" tabindex="-1" href="/x"><span class="material-icons">launch</span></a>` },
    // a control named by its text or its label
    { code: `<button><span class="material-icons" aria-hidden="true">add</span> Add</button>` },
    { code: `<button aria-label="Delete"><span class="material-icons" aria-hidden="true">delete</span></button>` },
    { code: `<button [attr.aria-label]="label"><app-custom-icon>delete</app-custom-icon></button>` },
    { code: `<a routerLink="/x">{{ name }}<app-custom-icon>launch</app-custom-icon></a>` },
    // the icon is the control and has a name
    { code: `<span class="material-icons" role="button" tabindex="0" aria-label="Copy">content_copy</span>` },
    // not an icon
    { code: `<span class="material-iconsets">x</span>` },
  ],
  invalid: [
    {
      code: `<span class="material-icons text-warning">warning</span>`,
      errors: [{ messageId: "iconNeedsLabelOrHidden" }],
    },
    {
      code: `<span [ngClass]="font || 'material-icons'">{{ icon }}</span>`,
      errors: [{ messageId: "iconNeedsLabelOrHidden" }],
    },
    {
      // a title or tooltip is not a name
      code: `<button title="Delete" matTooltip="Delete"><span class="material-icons" aria-hidden="true">delete</span></button>`,
      errors: [{ messageId: "controlNeedsName" }],
    },
    {
      code: `<a href="/x">@if (open) {<app-custom-icon>expand_less</app-custom-icon>} @else {<app-custom-icon>expand_more</app-custom-icon>}</a>`,
      errors: [{ messageId: "controlNeedsName" }],
    },
  ],
});
