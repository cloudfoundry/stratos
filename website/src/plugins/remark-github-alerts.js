// Remark plugin: convert GitHub alert blockquotes ("> [!NOTE]") into
// Docusaurus admonition directives. The docs tree is authored in the
// GFM subset so it renders on GitHub; this bridges the one construct
// where the two dialects diverge. Must run in
// beforeDefaultRemarkPlugins so the admonition plugin sees the
// directive nodes.

const KIND = {
  NOTE: 'note',
  TIP: 'tip',
  IMPORTANT: 'info',
  WARNING: 'warning',
  CAUTION: 'danger'
}

const MARKER = /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*/

module.exports = function remarkGithubAlerts() {
  return async (tree) => {
    const { visit } = await import('unist-util-visit')
    visit(tree, 'blockquote', (node) => {
      const first = node.children?.[0]
      if (first?.type !== 'paragraph') return
      const text = first.children?.[0]
      if (text?.type !== 'text') return
      const m = text.value.match(MARKER)
      if (!m) return

      text.value = text.value.slice(m[0].length).replace(/^\n/, '')
      if (!text.value) first.children.shift()
      if (!first.children.length) node.children.shift()

      node.type = 'containerDirective'
      node.name = KIND[m[1]]
      delete node.position
    })
  }
}
