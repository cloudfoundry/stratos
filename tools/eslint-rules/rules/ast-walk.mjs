// Depth-first walk over an ESTree subtree using the parser's visitor keys,
// so parser-added back-references (parent, etc.) are never followed.
export function walk(root, visitorKeys, visit) {
  const queue = [root];
  while (queue.length) {
    const node = queue.pop();
    if (!node || typeof node.type !== "string") {
      continue;
    }
    if (visit(node) === false) {
      return;
    }
    const keys = visitorKeys[node.type] || [];
    for (const key of keys) {
      const child = node[key];
      if (Array.isArray(child)) {
        for (const item of child) {
          if (item && typeof item.type === "string") {
            queue.push(item);
          }
        }
      } else if (child && typeof child.type === "string") {
        queue.push(child);
      }
    }
  }
}
