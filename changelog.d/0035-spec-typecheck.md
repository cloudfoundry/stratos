[Chores]
- `make check gate` and CI now type-check the frontend spec files.
  Vitest strips types when it runs a spec, so a spec could call a
  method that does not exist and still pass. Three specs that did not
  test what they claimed now do.
