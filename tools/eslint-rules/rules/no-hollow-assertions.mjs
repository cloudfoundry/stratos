import { walk } from "./ast-walk.mjs";

// Flags assertions that cannot go red:
//   expect(x).toBeDefined()                       — locators/objects are always defined
//   expect(x !== undefined).toBeTruthy()          — same, one step removed
//   expect(await p.catch(() => false)).toBe(true) — the failure path is swallowed
//     before the matcher ever sees it
// A catch used as a conditional guard (if (...)) is not an assertion and is
// deliberately out of scope. Block-bodied catch callbacks and boolean-typed
// toBeGreaterThan need type information and are not detected.
export default {
  meta: {
    type: "problem",
    docs: {
      description: "Disallow e2e assertions that can never fail",
    },
    schema: [],
    messages: {
      hollowMatcher: "toBeDefined() on an expect() subject can never fail; assert visibility, text, or count instead.",
      undefinedComparison: "Comparing against undefined inside expect() asserts nothing about the page; assert the real condition.",
      swallowedCatch: ".catch(() => <literal>) swallows the failure before the matcher sees it; let the assertion observe the error.",
    },
  },
  create(context) {
    const isExpectCall = (node) =>
      node?.type === "CallExpression" &&
      node.callee.type === "Identifier" &&
      node.callee.name === "expect";

    const isUndefinedOperand = (node) =>
      node?.type === "Identifier" && node.name === "undefined";

    const isSwallowingCatch = (node) => {
      if (
        node?.type !== "CallExpression" ||
        node.callee.type !== "MemberExpression" ||
        node.callee.computed ||
        node.callee.property.name !== "catch"
      ) {
        return false;
      }
      const handler = node.arguments[0];
      if (handler?.type !== "ArrowFunctionExpression" && handler?.type !== "FunctionExpression") {
        return false;
      }
      const body = handler.body;
      return body.type === "Literal" || isUndefinedOperand(body);
    };

    return {
      CallExpression(node) {
        // expect(x).toBeDefined()
        if (
          node.callee.type === "MemberExpression" &&
          !node.callee.computed &&
          node.callee.property.name === "toBeDefined" &&
          isExpectCall(node.callee.object)
        ) {
          context.report({ node: node.callee.property, messageId: "hollowMatcher" });
          return;
        }

        if (!isExpectCall(node) || !node.arguments.length) {
          return;
        }

        walk(node.arguments[0], context.sourceCode.visitorKeys, (current) => {
          if (
            current.type === "BinaryExpression" &&
            ["==", "===", "!=", "!=="].includes(current.operator) &&
            (isUndefinedOperand(current.left) || isUndefinedOperand(current.right))
          ) {
            context.report({ node: current, messageId: "undefinedComparison" });
          }
          if (isSwallowingCatch(current)) {
            context.report({ node: current.callee.property, messageId: "swallowedCatch" });
          }
        });
      },
    };
  },
};
