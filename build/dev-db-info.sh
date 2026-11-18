#!/usr/bin/env bash
# Prints which database a backend started in <jetstream dir> will use, before
# it starts. With SQLite, jetstream opens $SQLITE_DB_DIR/console-database.db
# relative to the directory it runs in, so every worktree has its own
# endpoints, tokens and favourites, and nothing in the console says which one
# is open.
#
# Settings resolve as jetstream reads them for a dev run: the environment
# first, then <jetstream dir>/config.properties.
#
# Usage: build/dev-db-info.sh src/jetstream

set -u

dir=${1:?usage: $0 <jetstream dir>}

setting() {
  local value
  value=$(printenv "$1")
  if [ -z "$value" ] && [ -f "$dir/config.properties" ]; then
    value=$(sed -n "s/^$1=//p" "$dir/config.properties" | tail -1)
  fi
  printf '%s' "$value"
}

provider=$(setting DATABASE_PROVIDER)
case "$provider" in
  pgsql | mysql)
    echo "Backend database: $provider ($(setting DB_HOST)/$(setting DB_DATABASE_NAME))"
    exit 0
    ;;
esac

db_dir=$(setting SQLITE_DB_DIR)
db_dir=${db_dir:-.}
if abs=$(cd "$dir" && cd "$db_dir" 2>/dev/null && pwd); then
  db="$abs/console-database.db"
else
  case "$db_dir" in
    /*) db="$db_dir/console-database.db" ;;
    *) db="$dir/$db_dir/console-database.db" ;;
  esac
  db="$db (directory does not exist yet)"
fi

# jetstream parses SQLITE_KEEP_DB with strconv.ParseBool; unset means false.
case "$(setting SQLITE_KEEP_DB)" in
  1 | t | T | true | TRUE | True) keep="kept between restarts" ;;
  *) keep="RESET at startup: the endpoints below will be removed" ;;
esac

echo "Backend database: $db"
echo "  SQLite, $keep"
if [ ! -f "$db" ]; then
  echo "  (no file yet: starts empty)"
  exit 0
fi
if ! command -v sqlite3 >/dev/null 2>&1; then
  echo "  (install sqlite3 to list its endpoints)"
  exit 0
fi
endpoints=$(sqlite3 -readonly -separator '|' "$db" "select name, cnsi_type, api_endpoint from cnsis order by name;" 2>/dev/null)
if [ -z "$endpoints" ]; then
  echo "  No endpoints registered"
  exit 0
fi
echo "  Endpoints ($(printf '%s\n' "$endpoints" | wc -l | tr -d ' ')):"
printf '%s\n' "$endpoints" | awk -F'|' '{ printf "    %-28s %-10s %s\n", $1, $2, $3 }'
