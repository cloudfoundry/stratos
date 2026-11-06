#!/usr/bin/env node
// Lint docs/**/*.md against the GFM-intersection subset: markdown that
// renders identically on GitHub and in the website generator (MDX).
// Rules:
//   no-directive   ::: admonitions (use > [!NOTE] GitHub alerts)
//   no-mdx         import/export statements outside code fences
//   no-html        raw HTML outside code fences, except a whitelist of
//                  well-formed elements that render in both GitHub and
//                  MDX (details/summary collapsibles, ul/li in table
//                  cells). HTML comments are not valid MDX.
//   link-resolves  relative links/images must point at existing files
//   link-md-ext    relative doc links need an explicit .md extension
//                  (extensionless doc-id links do not navigate on GitHub)

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'

const DOCS_DIR = 'docs'
// Well-formed elements both GitHub and MDX render.
const ALLOWED_TAGS = new Set(['details', 'summary', 'ul', 'li'])
// GitHub issue/PR templates, not documentation pages.
const EXCLUDE = new Set(['docs/issue_template.md', 'docs/pull_request_template.md'])
const problems = []

function mdFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) return mdFiles(p)
    return name.endsWith('.md') ? [p] : []
  })
}

// Blank out fenced code blocks and inline code spans, preserving line
// numbers, so their content is exempt from all checks.
function maskCode(text) {
  const lines = text.split('\n')
  let fence = null
  const out = lines.map((line) => {
    const open = line.match(/^\s*(```+|~~~+)/)
    if (fence) {
      // A closing fence has no info string (CommonMark): "```bash" inside
      // an open block is content, not a close.
      const close = line.match(/^\s*(```+|~~~+)\s*$/)
      if (close && close[1][0] === fence[0] && close[1].length >= fence.length) fence = null
      return ''
    }
    if (open) {
      fence = open[1]
      return ''
    }
    return line.replace(/`[^`]*`/g, (m) => ' '.repeat(m.length))
  })
  return out
}

function lintFile(file) {
  const raw = readFileSync(file, 'utf8')
  const lines = maskCode(raw)
  let inFrontmatter = false

  lines.forEach((line, i) => {
    const no = i + 1
    if (no === 1 && line.trim() === '---') {
      inFrontmatter = true
      return
    }
    if (inFrontmatter) {
      if (line.trim() === '---') inFrontmatter = false
      return
    }

    if (/^\s*:::/.test(line)) {
      problems.push([file, no, 'no-directive', 'use "> [!NOTE]" GitHub alerts instead of ::: admonitions'])
    }
    if (/^(import\s.+\sfrom\s|export\s)/.test(line)) {
      problems.push([file, no, 'no-mdx', 'MDX import/export is not plain markdown'])
    }
    const expr = line.match(/\{[^}]*\}/)
    if (expr) {
      problems.push([file, no, 'no-mdx', `"${expr[0].slice(0, 30)}" parses as an MDX expression - wrap it in backticks`])
    }
    const lt = line.match(/<[0-9]/)
    if (lt) {
      problems.push([file, no, 'no-mdx', `bare "${lt[0]}" fails MDX parsing - escape it or reword`])
    }
    for (const html of line.matchAll(/<\/?([a-zA-Z][a-zA-Z0-9-]*)[^>]*>|<!--/g)) {
      if (/^<(https?:|mailto:)/.test(html[0])) continue
      if (html[1] && ALLOWED_TAGS.has(html[1].toLowerCase())) continue
      problems.push([file, no, 'no-html', `raw HTML "${html[0].slice(0, 30)}" does not render in MDX`])
    }

    for (const m of line.matchAll(/(!?)\[[^\]]*\]\(([^)#\s]+)(#[^)\s]*)?\)/g)) {
      const [, bang, target] = m
      if (/^(https?:|mailto:|\/)/.test(target)) continue
      const abs = resolve(dirname(file), target)
      if (!existsSync(abs)) {
        problems.push([file, no, 'link-resolves', `"${target}" does not exist`])
      } else if (!bang && statSync(abs).isFile() && !/\.[a-z]+$/i.test(target)) {
        problems.push([file, no, 'link-md-ext', `"${target}" needs an explicit file extension`])
      }
    }
  })
}

const files = mdFiles(DOCS_DIR).filter((f) => !EXCLUDE.has(f))
files.forEach(lintFile)

for (const [file, line, rule, msg] of problems) {
  console.error(`${file}:${line} [${rule}] ${msg}`)
}
console.error(`${files.length} files checked, ${problems.length} problem(s)`)
process.exit(problems.length ? 1 : 0)
