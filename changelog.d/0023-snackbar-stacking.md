[BugFixes]
- Several pop-up messages can be open at the bottom of the page at
  once, as intended, but each one sat exactly on top of the one
  before: the older message peeked out behind the newer one and could
  catch a click meant for its close button. Stacked messages are now
  usable as tabs. They share one box: when there is more than one,
  numbered tabs along its top switch between them, and a new message
  is shown as it arrives. Each message has one "Dismiss" button, in
  place of a "Dismiss" or "Close" button and a "×" that did the same
  thing; it closes just that message, and the other tabs keep their
  numbers. A "Close all" button beside the tabs closes them all. The
  same message arriving again straight after itself is counted
  instead of getting a new tab: its tab and the start of its text
  show how many times it has been shown. The tabs work with the arrow
  keys and screen readers, and a closed message is also cleared from
  what screen readers can find.
