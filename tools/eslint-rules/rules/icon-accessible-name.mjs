// Material icons are ligatures: the text "mode_edit" draws the glyph, and a
// screen reader reads that text into the name of whatever holds it. So:
// - a material-icons element is either hidden (aria-hidden) or an image with
//   a name (role + aria-label); app-custom-icon does this itself.
// - a button or link whose only content is icons needs aria-label: a title
//   is unreliable and a tooltip is a description, not a name.
const ICON_CLASS = /(^|\s)material-icons(-outlined)?(\s|$)/;
const LABEL = ["aria-label", "aria-labelledby"];

const attr = (el, name) => el.attributes?.find((a) => a.name === name);
const bound = (el, name) => el.inputs?.find((i) => i.name === name);
const has = (el, name) => !!attr(el, name) || !!bound(el, name);

const isMaterialIcon = (el) =>
  ICON_CLASS.test(attr(el, "class")?.value ?? "") ||
  !!el.inputs?.some((i) => (i.name === "ngClass" || i.name === "class") && /material-icons/.test(i.value?.source ?? ""));
const isIcon = (el) => el.name === "app-custom-icon" || isMaterialIcon(el);
const isHidden = (el) => attr(el, "aria-hidden")?.value === "true" || has(el, "aria-hidden");

function hiddenAbove(node) {
  for (let p = node.parent; p; p = p.parent) {
    if (p.attributes && isHidden(p)) return true;
  }
  return false;
}

const kids = (n) => [...(n.children ?? []), ...(n.branches ?? []), ...(n.cases ?? []), ...(n.empty ? [n.empty] : [])];

// Text a control shows besides its icons: static text or an interpolation.
function hasText(n) {
  return kids(n).some((c) => {
    if (c.type === "BoundText") return true;
    if (typeof c.value === "string" && !c.name) return c.value.trim() !== "";
    if (c.attributes && (isIcon(c) || isHidden(c))) return false;
    return hasText(c);
  });
}
const hasIcon = (n) => kids(n).some((c) => (c.attributes && isIcon(c)) || hasIcon(c));

export default {
  meta: {
    type: "problem",
    docs: {
      description: "Keep icon ligature text out of accessible names, and name icon-only buttons and links",
    },
    schema: [],
    messages: {
      iconNeedsLabelOrHidden:
        "Icon text is read aloud: add aria-hidden=\"true\" if it is decoration, or role=\"img\" with an aria-label if it means something.",
      controlNeedsName:
        "This {{tag}} shows only icons: give it an aria-label (a title or tooltip is not a name).",
    },
  },
  create(context) {
    return {
      Element(node) {
        if (node.name !== "app-custom-icon" && isMaterialIcon(node)) {
          const ok = isHidden(node) || LABEL.some((n) => has(node, n)) || has(node, "role") || hiddenAbove(node);
          if (!ok) context.report({ node, messageId: "iconNeedsLabelOrHidden" });
        }
        if ((node.name === "button" || node.name === "a") && hasIcon(node) && !hasText(node)) {
          const ok = LABEL.some((n) => has(node, n)) || isHidden(node) || hiddenAbove(node);
          if (!ok) context.report({ node, messageId: "controlNeedsName", data: { tag: node.name === "a" ? "link" : "button" } });
        }
      },
    };
  },
};
