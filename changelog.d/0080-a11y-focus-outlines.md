[BugFixes: Accessibility]
- The keyboard focus outline is no longer cut off where a control
  touches the window edge or sits in a box that clips: it is drawn
  inside these controls:
  - the side nav links
  - the app tabs (Summary, Log Stream and the others)
  - the Instances bar on an application's summary
  - the recent app names on the home page
- The count cards on the home page (Applications, Orgs, Routes) show
  keyboard focus; before, they showed none.
