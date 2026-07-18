import { walk } from "./ast-walk.mjs";

const SERVICE = "TailwindSnackBarService";

// Flags a class that injects TailwindSnackBarService (inject() initializer or
// constructor parameter) but never references the injected value again. Any
// read counts as use — a method call, optional chaining, or passing the
// service to a helper — so components using error()/showWithLink() are not
// false positives the way a show()-only check would be.
//
// Constructor parameters (including parameter properties, which are legally
// readable by bare name inside the constructor body) are resolved through
// ESLint's scope analysis, so an unrelated identifier with the same name
// elsewhere in the class neither masks a dead injection nor causes a false
// positive.
export default {
  meta: {
    type: "problem",
    docs: {
      description: `Disallow injecting ${SERVICE} without ever using it`,
    },
    schema: [],
    messages: {
      unusedInjection: `${SERVICE} is injected as '{{name}}' but never used in this class.`,
    },
  },
  create(context) {
    const isInjectCall = (node) =>
      node?.type === "CallExpression" &&
      node.callee.type === "Identifier" &&
      node.callee.name === "inject" &&
      node.arguments[0]?.type === "Identifier" &&
      node.arguments[0].name === SERVICE;

    const isServiceType = (typeNode) =>
      typeNode?.type === "TSTypeReference" &&
      typeNode.typeName.type === "Identifier" &&
      typeNode.typeName.name === SERVICE;

    const keyName = (key) => {
      if (key?.type === "Identifier") {
        return key.name;
      }
      if (key?.type === "Literal" && typeof key.value === "string") {
        return key.value;
      }
      return null;
    };

    function checkClass(node) {
      // { name, reportNode, needThis, variable }
      // needThis: reachable as this.<name> (property or parameter property).
      // variable: the scope Variable for constructor params — its read
      // references are bare-name uses.
      const injections = [];

      for (const el of node.body.body) {
        if (el.type === "PropertyDefinition" && isInjectCall(el.value)) {
          const name = keyName(el.key);
          if (name) {
            injections.push({ name, reportNode: el.key, needThis: true, variable: null });
          }
        }
        if (el.type === "MethodDefinition" && el.kind === "constructor") {
          const ctorVariables = context.sourceCode.getDeclaredVariables(el.value);
          for (const rawParam of el.value.params) {
            let param = rawParam;
            const isProperty = param.type === "TSParameterProperty";
            if (isProperty) {
              param = param.parameter;
            }
            if (param.type === "AssignmentPattern") {
              param = param.left;
            }
            if (param.type === "Identifier" && isServiceType(param.typeAnnotation?.typeAnnotation)) {
              injections.push({
                name: param.name,
                reportNode: param,
                needThis: isProperty,
                variable: ctorVariables.find((v) => v.name === param.name) ?? null,
              });
            }
          }
        }
      }

      if (!injections.length) {
        return;
      }

      const thisUsed = new Set();
      walk(node.body, context.sourceCode.visitorKeys, (current) => {
        if (
          current.type === "MemberExpression" &&
          !current.computed &&
          current.object.type === "ThisExpression" &&
          current.property.type === "Identifier"
        ) {
          thisUsed.add(current.property.name);
        }
      });

      for (const inj of injections) {
        const usedViaThis = inj.needThis && thisUsed.has(inj.name);
        const usedByName = inj.variable?.references.some((ref) => ref.isRead()) ?? false;
        if (!usedViaThis && !usedByName) {
          context.report({
            node: inj.reportNode,
            messageId: "unusedInjection",
            data: { name: inj.name },
          });
        }
      }
    }

    return {
      "ClassDeclaration:exit": checkClass,
      "ClassExpression:exit": checkClass,
    };
  },
};
