[BugFixes: Core]
- A metrics endpoint's page draws each endpoint's icon in the right
  font. A Cloud Foundry card showed a cloud and a hand with a gap
  between them, which pushed its title to the right.
- Home's "Card layout" menu closes on Escape, which returns focus to
  its button, and on a click outside it. Its tick is 20px, so each
  option is 36px tall, not 40px.
