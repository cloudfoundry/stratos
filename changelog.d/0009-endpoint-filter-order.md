[BugFixes]
- The endpoint filter on the Applications, Marketplace and Services
  toolbars lists endpoints by name. It was built by walking the endpoint
  list in arrival order, which no query orders, so with more than one
  endpoint of a kind the dropdown showed whatever order the rows came
  back in. "All" stays at the top. The comparator is the one the sibling
  dropdowns on those toolbars already use, so cf10 sorts after cf2.
