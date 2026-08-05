[BugFixes]
- The Events tabs no longer drain a foundation's entire audit-event history into browser memory. The frontend loader fetches a bounded newest-first window — 50 pages of 500, the same 25k ceiling the pre-rewrite backend handler enforced — and the comments that still described the departed backend cap now describe the real mechanism (#5536).
