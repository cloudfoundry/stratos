[BugFixes]
- Fixed the Foundational Shape "Users & roles" measure silently keeping only
  the first 50 users on foundations with more than 50 — the same server-paged
  truncation the summary tiles had. The measure now drains every page of the
  users endpoint, so the detail export's role grants cover the whole
  foundation, and its stated cost reads "1 request per 500 users".
