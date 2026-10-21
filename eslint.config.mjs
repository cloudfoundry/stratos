// @ts-check
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import angular from "angular-eslint";
import stratos from "./tools/eslint-rules/index.mjs";
import { E2E_LEGACY_FILES } from "./tools/eslint-rules/e2e-legacy-files.mjs";

export default tseslint.config(
  {
    linterOptions: {
      reportUnusedDisableDirectives: "warn",
    },
    plugins: { stratos },
  },
  {
    files: ["**/*.ts"],
    ignores: ["e2e/**"],
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
          caughtErrorsIgnorePattern: "^_",
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

      // A snackbar service injected but never called is dead weight that
      // misleads readers about what the component can do (#5603).
      "stratos/no-unused-snackbar-service": "error",

      // APIs deprecated in RxJS 7 (removed in RxJS 8) and Angular APIs the
      // zoneless app has no use for. All call sites were replaced in #6022;
      // these keep them from coming back.
      "no-restricted-imports": ["error", { paths: [
        ...["rxjs", "rxjs/operators"].map(name => ({
          name,
          importNames: ["publishReplay", "refCount", "publish", "publishLast", "publishBehavior", "multicast"],
          message: "Deprecated in RxJS 7: use shareReplay({ bufferSize: 1, refCount: true }), share() or connectable().",
        })),
        ...["rxjs", "rxjs/operators"].map(name => ({
          name,
          importNames: ["retryWhen"],
          message: "Deprecated in RxJS 7: use retry({ count, delay }).",
        })),
        {
          name: "rxjs/operators",
          importNames: ["combineLatest"],
          message: "Deprecated in RxJS 7: use the combineLatestWith operator.",
        },
        {
          name: "@angular/common/http",
          importNames: ["HttpClientModule"],
          message: "Deprecated: the app configures HttpClient with provideHttpClient() in AppModule.",
        },
        {
          name: "@angular/core",
          importNames: ["NgZone"],
          message: "The app is zoneless: NgZone.run() and runOutsideAngular() only call their callback.",
        },
      ] }],
      "no-restricted-syntax": ["error",
        {
          selector: "CallExpression[callee.property.name='toPromise']",
          message: "Deprecated in RxJS 7: use firstValueFrom() or lastValueFrom().",
        },
        {
          selector: "CallExpression[callee.property.name='subscribe'][arguments.length>1]",
          message: "Deprecated in RxJS 7: pass one observer, subscribe({ next, error, complete }).",
        },
        {
          selector: "CallExpression[callee.name=/^(combineLatest|observableCombineLatest)$/][arguments.length>1]",
          message: "Deprecated in RxJS 7: pass the sources as one array, combineLatest([a, b]).",
        },
        {
          selector: "CallExpression[callee.name='throwError'][arguments.0.type!=/^(ArrowFunctionExpression|FunctionExpression)$/]",
          message: "Deprecated in RxJS 7: pass an inline error factory, throwError(() => error).",
        },
      ],
    },
  },
  {
    files: ["**/*.spec.ts", "**/test-setup.ts"],
    ignores: ["e2e/**"],
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          varsIgnorePattern: "^(describe|it|test|expect|beforeAll|afterAll|beforeEach|afterEach|vi|fixture|component|provideZonelessChangeDetection|_\\w*)$",
          argsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
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
  },
  // e2e specs get only the drift guards (#5619), not the app ruleset: the
  // goal is that DOM drift and can't-fail assertions turn red on the PR
  // that introduces them.
  {
    files: ["e2e/**/*.ts"],
    languageOptions: {
      parser: tseslint.parser,
    },
    rules: {
      "stratos/no-dead-material-selectors": "error",
      "stratos/no-hollow-assertions": "error",
    },
  },
  // Ratchet: files that predate the guards keep their existing violations
  // until they are modernised; new files and cleaned files gate red.
  // Remove entries as files are fixed — never add to this list.
  ...(E2E_LEGACY_FILES.length
    ? [
        {
          files: E2E_LEGACY_FILES,
          rules: {
            "stratos/no-dead-material-selectors": "off",
            "stratos/no-hollow-assertions": "off",
          },
        },
      ]
    : [])
);
