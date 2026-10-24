[Security Updates]
- `github.com/labstack/echo/v5` moved from 5.4.0 to 5.4.2 in the backend
  and all six of its plugin and API modules. 5.4.1 fixes these; 5.4.2
  adds hardening with no advisory:

| Advisory              | What it fixes                                                          |
|-----------------------|------------------------------------------------------------------------|
| [GHSA-cxf3-9h37-7rr8] | Rejected WebSocket upgrades can bypass route-level access controls     |
| [GHSA-9969-6676-49h5] | WebSocket proxy keeps connections and handlers after client disconnect |
| [GHSA-h53f-rm2w-w7rg] | X-Real-IP extractor trusts the header instead of the sending peer      |
| [GHSA-x9ff-22gv-65f4] | BodyDump can discard BodyLimit overflow errors                         |

- `happy-dom` moved from 20.14.5 to 21.0.4 in the unit-test tooling.
  Nothing in the shipped console uses it:

| Advisory              | What it fixes                                                     |
|-----------------------|-------------------------------------------------------------------|
| [GHSA-834v-8h66-3h79] | Incomplete fix for CVE-2026-33943: an import alias runs host code |

- `body-parser` 2.3.0 → 2.4.0, `fast-uri` 3.1.8 → 3.1.9 and
  `serialize-javascript` 7.0.5 → 7.1.4 in the devkit:

| Advisory              | What it fixes                                                                  |
|-----------------------|--------------------------------------------------------------------------------|
| [GHSA-27r3-jxmh-p828] | body-parser: denial of service via trailing bytes after a compressed body      |
| [GHSA-w74x-v6f9-j3xg] | fast-uri: URI scheme spoofing via percent-encoded scheme decoding              |
| [GHSA-wjr9-j795-jxcr] | fast-uri: host confusion via unchecked WHATWG host canonicalization            |
| [GHSA-333x-w4r6-6crp] | fast-uri: scheme injection via an unescaped first-segment colon                |
| [GHSA-xhq7-xmqj-769h] | fast-uri: improper path equivalence in relative reference normalization        |
| [GHSA-m5mm-p8h7-m29v] | serialize-javascript: XSS via an unescaped `</script` in a serialized function |

[GHSA-cxf3-9h37-7rr8]: https://github.com/advisories/GHSA-cxf3-9h37-7rr8
[GHSA-9969-6676-49h5]: https://github.com/advisories/GHSA-9969-6676-49h5
[GHSA-h53f-rm2w-w7rg]: https://github.com/advisories/GHSA-h53f-rm2w-w7rg
[GHSA-x9ff-22gv-65f4]: https://github.com/advisories/GHSA-x9ff-22gv-65f4
[GHSA-834v-8h66-3h79]: https://github.com/advisories/GHSA-834v-8h66-3h79
[GHSA-27r3-jxmh-p828]: https://github.com/advisories/GHSA-27r3-jxmh-p828
[GHSA-w74x-v6f9-j3xg]: https://github.com/advisories/GHSA-w74x-v6f9-j3xg
[GHSA-wjr9-j795-jxcr]: https://github.com/advisories/GHSA-wjr9-j795-jxcr
[GHSA-333x-w4r6-6crp]: https://github.com/advisories/GHSA-333x-w4r6-6crp
[GHSA-xhq7-xmqj-769h]: https://github.com/advisories/GHSA-xhq7-xmqj-769h
[GHSA-m5mm-p8h7-m29v]: https://github.com/advisories/GHSA-m5mm-p8h7-m29v

[Chores]
- Dependency updates:

| Package                  | From         | To           |
|--------------------------|--------------|--------------|
| sass                     | 1.105.1      | 1.106.1      |
| pixelmatch               | 7.2.0        | 8.0.0        |
| caniuse-lite (docs site) | 1.0.30001816 | 1.0.30001817 |
| lucide-react (docs site) | 1.59.0       | 1.61.0       |

- pixelmatch 8 compares colors in OKLab, so screenshot diff counts
  change; the threshold scale does not.
