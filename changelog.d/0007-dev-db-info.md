[Chores]
- `make dev backend` prints which database the backend will open before
  it starts: for SQLite the file's full path, whether it is kept between
  restarts or reset at startup, and the endpoints registered in it. Each
  checkout has its own `console-database.db`, so its endpoints, tokens
  and favourites change with the directory the backend runs from.
