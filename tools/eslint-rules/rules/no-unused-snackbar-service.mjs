import { walk } from "./ast-walk.mjs";

const SERVICE = "TailwindSnackBarService";

// Flags a class that injects TailwindSnackBarService (inject() initializer or
// constructor parameter) but never references the injected value again. Any
// reference counts as use — a method call, optional chaining, or passing the
// service to a helper — so components using error()/showWithLink() are not
// false positives the way a show()-only check would be.
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
      // kind 'this': reachable as this.<name>; kind 'local': a plain
      // constructor parameter, reachable as a bare identifier.
      const injections = [];

      for (const el of node.body.body) {
        if (el.type === "PropertyDefinition" && isInjectCall(el.value)) {
          const name = keyName(el.key);
          if (name) {
            injections.push({ name, kind: "this", reportNode: el.key, declNode: el.key });
          }
        }
        if (el.type === "MethodDefinition" && el.kind === "constructor") {
          for (const rawParam of el.value.params) {
            let param = rawParam;
            let isProperty = false;
            if (param.type === "TSParameterProperty") {
              isProperty = true;
              param = param.parameter;
            }
            if (param.type === "AssignmentPattern") {
              param = param.left;
            }
            if (param.type === "Identifier" && isServiceType(param.typeAnnotation?.typeAnnotation)) {
              injections.push({
                name: param.name,
                kind: isProperty ? "this" : "local",
                reportNode: param,
                declNode: param,
                used: false,
              });
            }
          }
        }
      }

      if (!injections.length) {
        return;
      }

      walk(node.body, context.sourceCode.visitorKeys, (current) => {
        if (
          current.type === "MemberExpression" &&
          !current.computed &&
          current.object.type === "ThisExpression" &&
          current.property.type === "Identifier"
        ) {
          for (const inj of injections) {
            if (inj.kind === "this" && inj.name === current.property.name) {
              inj.used = true;
            }
          }
        }
        if (current.type === "Identifier") {
          for (const inj of injections) {
            if (inj.kind === "local" && inj.name === current.name && current !== inj.declNode) {
              inj.used = true;
            }
          }
        }
        return undefined;
      });

      for (const inj of injections) {
        if (!inj.used) {
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
