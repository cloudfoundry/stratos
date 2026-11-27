[Accessibility: 1.3.1 Info and Relationships]
- The endpoint error page shows "No recent errors" as a message. It
  was marked as a list item with no list around it.

[Accessibility: 1.4.3 Contrast (Minimum)]
- Warning text meets 4.5:1 in both modes: the notice on the
  diagnostics and foundation shape pages, warning pills and chips
  ("User Provided" in the services list, certificate pills), the
  revisions and schema form notices, and the text inside warning
  alerts ("Domain mismatch", the metrics page's unknown endpoint
  note). They measured 2.1 to 3.5:1.
- The risk chips on the diagnostics counts page (Low, Medium, High)
  meet 4.5:1. "Low" measured 3.06:1.
- The token endpoint link on the endpoint metrics page meets 4.5:1
  in both modes. It measured 3.67:1.
- "Failed to load" on a metrics chart and on a home page Cloud
  Foundry card meet 4.5:1 in dark mode. They measured 2.93:1.

[Accessibility: 2.1.1 Keyboard]
- A list body that scrolls is a tab stop, so the arrow keys can
  scroll it when its rows hold nothing focusable (the feature flags
  and buildpacks lists).

[Accessibility: 2.5.8 Target Size (Minimum)]
- The controls in a list card header (copy, favourite star, select,
  actions) are spaced so the small ones meet the 24 px spacing rule.
  The copy button and the select checkbox cut into the star before.

[Accessibility: 4.1.2 Name, Role, Value]
- Checkboxes in a table cell have a name: "Back up <endpoint>" on
  the backup page, "Skip SSL validation for <cluster>" in the kube
  config import.
- The route and service instance checkboxes on the delete app page
  are named by their route or instance, and a click on the text ticks
  the box.
- A favourite card on the home page no longer holds its star inside a
  button: the name and type are the button, and the star sits beside
  it. A click anywhere on the card still opens the favourite.
- Progress bars have a name: "Loading", or "Time before sign-out" in
  the "Are you still there?" dialog.
