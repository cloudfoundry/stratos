[Features]
- The diagnostics resource waterfall now draws the document request itself
  as its first row, segmented by phase (stall, DNS, TCP, TLS, server wait,
  download). Previously the document was invisible — it is a navigation
  entry, not a resource entry — so on a high-latency connection the chart
  showed an unexplained void until the HTML arrived. Under the Stratos
  clock the row collapses to just server wait + download, the part the
  app can influence.
