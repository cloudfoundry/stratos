[BugFixes]
- The Helm release resource graph (Workloads, a release, Overview) stayed on
  "Loading resources" after the resources had arrived. The component runs
  OnPush under zoneless change detection and wrote the nodes and links into
  plain fields from its socket subscription, so nothing ever marked the view
  dirty; they are signals now. The graph also fitted itself on a timer that
  fired before the first layout existed, leaving the right-hand nodes clipped,
  so it now fits on ngx-graph's `drawComplete`. And the standalone
  `GraphComponent` that ngx-graph 12 steers consumers toward needs a
  `LayoutService` only its deprecated module provided, which the component
  now supplies itself.
