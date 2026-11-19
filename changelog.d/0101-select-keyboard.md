[Accessibility: 2.1.1 Keyboard]
- Drop-down lists (Create App's Cloud Foundry, Organization and Space,
  Create Service's Select Service, and every other select) work from
  the keyboard: Down, Enter or Space opens the list; the arrow keys,
  Home and End move; Enter or Space chooses; typing a letter jumps to a
  match; Escape closes it with no change. A screen reader says which
  option is current.
- A list with more than five options is a text field: typing filters
  the list, and the filter takes the place of the search box that
  opened inside the list.
- A select given focus by the page (Add Route's domain, Choose Service
  Plan) now gets it.

[Chores]
- Added `@angular/aria` 22.2.7, the Angular team's accessible
  building blocks, which the select now uses:

  | Package | From | To |
  |---|---|---|
  | @angular/aria | — | 22.2.7 |
