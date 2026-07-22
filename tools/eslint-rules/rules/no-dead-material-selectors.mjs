// Angular Material was removed from the app; any selector still targeting a
// mat-* element, a .mat- class, or the retired app-list component matches
// nothing (or the wrong thing) and keeps a spec green while asserting drift.
// Matches only string content, so commented-out code is naturally ignored.
// The '.' of a class selector satisfies the [^\w-] left boundary, so .mat-*
// classes are covered by the same alternative as bare mat-* tags.
const DEAD_TOKEN = /(^|[^\w-])(mat-[a-z][\w-]*|app-list)(?![\w-])/;

export default {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow selectors for removed Angular Material / legacy components in e2e code",
    },
    schema: [],
    messages: {
      deadSelector: "'{{token}}' targets a component removed in the Material migration; bind to a data-test hook or current DOM instead.",
    },
  },
  create(context) {
    const check = (node, text) => {
      const match = DEAD_TOKEN.exec(text);
      if (match) {
        context.report({
          node,
          messageId: "deadSelector",
          data: { token: match[2] },
        });
      }
    };

    return {
      Literal(node) {
        if (typeof node.value === "string") {
          check(node, node.value);
        }
      },
      TemplateLiteral(node) {
        for (const quasi of node.quasis) {
          check(node, quasi.value.cooked ?? quasi.value.raw ?? "");
        }
      },
    };
  },
};
