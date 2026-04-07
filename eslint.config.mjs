// @ts-check
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import angular from "angular-eslint";

export default tseslint.config(
  {
    linterOptions: {
      reportUnusedDisableDirectives: "warn",
    },
  },
  {
    files: ["**/*.ts"],
    extends: [
      eslint.configs.recommended,
      ...tseslint.configs.recommended,
      ...angular.configs.tsRecommended,
    ],
    processor: angular.processInlineTemplates,
    rules: {
      // Off — not applicable to this codebase
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-empty-function": "off",
      "@angular-eslint/no-empty-lifecycle-method": "off",
      "@angular-eslint/directive-selector": "off",
      "@angular-eslint/component-selector": "off",

      // Warn — migration-period rules to fix over time
      // Ignore underscore-prefixed params (intentionally unused) and common
      // single-letter callback/catch params that are positional placeholders.
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
      "@typescript-eslint/no-unsafe-declaration-merging": "warn",
      "@typescript-eslint/no-wrapper-object-types": "warn",
      "@typescript-eslint/no-empty-object-type": "warn",
      "@angular-eslint/prefer-inject": "warn",
      "@angular-eslint/prefer-standalone": "warn",
      "@angular-eslint/no-input-rename": "warn",
      "@angular-eslint/no-output-native": "warn",
      "@angular-eslint/no-output-on-prefix": "warn",
      "no-case-declarations": "warn",
      "no-extra-boolean-cast": "warn",
      "no-prototype-builtins": "warn",
      "no-useless-escape": "warn",
      "no-empty": "warn",
      "no-unexpected-multiline": "warn",
      "no-var": "warn",
      "no-constant-condition": "warn",
      "@typescript-eslint/no-non-null-asserted-optional-chain": "warn",
      "@typescript-eslint/no-unused-expressions": "warn",
      "@typescript-eslint/no-this-alias": "warn",
      "@typescript-eslint/no-duplicate-enum-values": "warn",
      "prefer-const": "warn",
      "no-irregular-whitespace": "warn",
      "no-duplicate-case": "warn",
      "@typescript-eslint/no-unsafe-function-type": "warn",
    },
  },
  {
    files: ["**/*.spec.ts", "**/test-setup.ts"],
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          varsIgnorePattern: "^(describe|it|test|expect|beforeAll|afterAll|beforeEach|afterEach|vi|fixture|component|provideZonelessChangeDetection|_)$",
          argsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
    },
  },
  {
    files: ["**/*.html"],
    extends: [
      ...angular.configs.templateRecommended,
      ...angular.configs.templateAccessibility,
    ],
    rules: {
      // Warn — migration-period rules to fix over time
      "@angular-eslint/template/no-negated-async": "warn",
      "@angular-eslint/template/eqeqeq": "warn",
      "@angular-eslint/template/prefer-control-flow": "warn",
      "@angular-eslint/template/interactive-supports-focus": "warn",
      "@angular-eslint/template/click-events-have-key-events": "warn",
      "@angular-eslint/template/alt-text": "warn",
      "@angular-eslint/template/label-has-associated-control": "warn",
      "@angular-eslint/template/elements-content": "warn",
    },
  }
);
