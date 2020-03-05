#!/bin/bash

###########################################################################################################
#
# This is the entrypoint script taken from here: https://github.com/docker-library/mariadb/tree/master/10.2
#
# There is one change - which is clearly marked below
#
###########################################################################################################

set -eo pipefail
shopt -s nullglob

# if command starts with an option, prepend mysqld
if [ "${1:0:1}" = '-' ]; then
	set -- mysqld "$@"
fi

# skip setup if they want an option that stops mysqld
wantHelp=
for arg; do
	case "$arg" in
		-'?'|--help|--print-defaults|-V|--version)
			wantHelp=1
			break
			;;
	esac
done

# usage: file_env VAR [DEFAULT]
#    ie: file_env 'XYZ_DB_PASSWORD' 'example'
# (will allow for "$XYZ_DB_PASSWORD_FILE" to fill in the value of
#  "$XYZ_DB_PASSWORD" from a file, especially for Docker's secrets feature)
file_env() {
	local var="$1"
	local fileVar="${var}_FILE"
	local def="${2:-}"
	if [ "${!var:-}" ] && [ "${!fileVar:-}" ]; then
		echo >&2 "error: both $var and $fileVar are set (but are exclusive)"
		exit 1
	fi
	local val="$def"
	if [ "${!var:-}" ]; then
		val="${!var}"
	elif [ "${!fileVar:-}" ]; then
		val="$(< "${!fileVar}")"
	fi
	export "$var"="$val"
	unset "$fileVar"
}

_check_config() {
	toRun=( "$@" --verbose --help --log-bin-index="$(mktemp -u)" )
	if ! errors="$("${toRun[@]}" 2>&1 >/dev/null)"; then
		cat >&2 <<-EOM

			ERROR: mysqld failed while attempting to check config
			command was: "${toRun[*]}"

			$errors
		EOM
		exit 1
	fi
}

# Fetch value from server config
# We use mysqld --verbose --help instead of my_print_defaults because the
# latter only show values present in config files, and not server defaults
_get_config() {
	local conf="$1"; shift
	"$@" --verbose --help --log-bin-index="$(mktemp -u)" 2>/dev/null \
		| awk '$1 == "'"$conf"'" && /^[^ \t]/ { sub(/^[^ \t]+[ \t]+/, ""); print; exit }'
	# match "datadir      /some/path with/spaces in/it here" but not "--xyz=abc\n     datadir (xyz)"
}

# Stratos Changes to reset password
reset_passwords() {
	mysqld --skip-grant-tables --skip-networking --socket="${SOCKET}" &
	pid="$!"

	mysql=( mysql --protocol=socket -uroot -hlocalhost --socket="${SOCKET}" )
	for i in {30..0}; do
		if echo 'SELECT 1' | "${mysql[@]}" &> /dev/null; then
			break
		fi
		echo '[Password Change] MySQL startup in progress...'
		sleep 1
	done
	if [ "$i" = 0 ]; then
		echo >&2 '[Password Changed] MySQL startup failed.'
		exit 1
	fi

	echo '[Password Change] MySQL ready for password changes ...'

	"${mysql[@]}"  <<-EOSQL
	FLUSH PRIVILEGES;
	ALTER USER 'root'@'localhost' IDENTIFIED BY '${MYSQL_ROOT_PASSWORD}';
	ALTER USER '$MYSQL_USER'@'%' IDENTIFIED BY '${MYSQL_PASSWORD}';
	FLUSH PRIVILEGES;
EOSQL

	if ! kill -s TERM "$pid" || ! wait "$pid"; then
		echo >&2 '[Password Change] MySQL => Password update failed.'
		echo "[Password Change] Failed"
		exit 1
	fi

	echo "[Password Change] Passwords updated okay"
}

upgrade_database() {
	mysqld --skip-grant-tables --skip-networking --socket="${SOCKET}" &
	pid="$!"

	mysql=( mysql --protocol=socket -uroot -hlocalhost --socket="${SOCKET}" )
	for i in {30..0}; do
		if echo 'SELECT 1' | "${mysql[@]}" &> /dev/null; then
			break
		fi
		echo '[Upgrade] MySQL startup in progress...'
		sleep 1
	done
	if [ "$i" = 0 ]; then
		echo >&2 '[Upgrade] MySQL startup failed.'
		exit 1
	fi

	echo '[Upgrade] MySQL ready for upgrade ...'

	# Change the root password so that we can log in afetr the upgrade
	#echo "UPDATE mysql.user SET Password=PASSWORD('root') WHERE USER='root';" | "${mysql[@]}"
	echo "UPDATE mysql.user SET host='localhost' WHERE USER='root';" | "${mysql[@]}"

	mysql_upgrade "${@:2}"

	if ! kill -s TERM "$pid" || ! wait "$pid"; then
		echo >&2 '[Upgrade ] MySQL => DB upgrade failed.'
		echo "[Upgrade] Failed"
		exit 1
	fi

	echo "[Upgrade] DB upgraded OK"
}

# allow the container to be started with `--user`
if [ "$1" = 'mysqld' -a -z "$wantHelp" -a "$(id -u)" = '0' ]; then
	_check_config "$@"
	DATADIR="$(_get_config 'datadir' "$@")"
	mkdir -p "$DATADIR"
	find "$DATADIR" \! -user mysql -exec chown mysql '{}' +
	exec gosu mysql "$BASH_SOURCE" "$@"
fi

SOCKET="$(_get_config 'socket' "$@")"

if [ "$1" = 'mysqld' -a -z "$wantHelp" ]; then
	# still need to check config, container may have started with --user
	_check_config "$@"
	# Get config
	DATADIR="$(_get_config 'datadir' "$@")"

	echo "Data dir is: ${DATADIR}"

	# Stratos change
	RESET_PASSWORDS="true"
	
	if [ ! -d "$DATADIR/mysql" ]; then
		file_env 'MYSQL_ROOT_PASSWORD'
		if [ -z "$MYSQL_ROOT_PASSWORD" -a -z "$MYSQL_ALLOW_EMPTY_PASSWORD" -a -z "$MYSQL_RANDOM_ROOT_PASSWORD" ]; then
			echo >&2 'error: database is uninitialized and password option is not specified '
			echo >&2 '  You need to specify one of MYSQL_ROOT_PASSWORD, MYSQL_ALLOW_EMPTY_PASSWORD and MYSQL_RANDOM_ROOT_PASSWORD'
			exit 1
		fi

		mkdir -p "$DATADIR"
		# ========================================
		# Stratos changes
		RESET_PASSWORDS="false"
		chown -R mysql:mysql "$DATADIR"
		# ========================================

		echo 'Initializing database'
		installArgs=( --datadir="$DATADIR" --rpm )
		if { mysql_install_db --help || :; } | grep -q -- '--auth-root-authentication-method'; then
			# beginning in 10.4.3, install_db uses "socket" which only allows system user root to connect, switch back to "normal" to allow mysql root without a password
			# see https://github.com/MariaDB/server/commit/b9f3f06857ac6f9105dc65caae19782f09b47fb3
			# (this flag doesn't exist in 10.0 and below)
			installArgs+=( --auth-root-authentication-method=normal )
		fi
		# "Other options are passed to mysqld." (so we pass all "mysqld" arguments directly here)
		mysql_install_db "${installArgs[@]}" "${@:2}"
		echo 'Database initialized'

		"$@" --skip-networking --socket="${SOCKET}" &
		pid="$!"

		mysql=( mysql --protocol=socket -uroot -hlocalhost --socket="${SOCKET}" )

		for i in {30..0}; do
			if echo 'SELECT 1' | "${mysql[@]}" &> /dev/null; then
				break
			fi
			echo 'MySQL init process in progress...'
			sleep 1
		done
		if [ "$i" = 0 ]; then
			echo >&2 'MySQL init process failed.'
			exit 1
		fi

		if [ -z "$MYSQL_INITDB_SKIP_TZINFO" ]; then
			# sed is for https://bugs.mysql.com/bug.php?id=20545
			mysql_tzinfo_to_sql /usr/share/zoneinfo | sed 's/Local time zone must be set--see zic manual page/FCTY/' | "${mysql[@]}" mysql
		fi

		if [ ! -z "$MYSQL_RANDOM_ROOT_PASSWORD" ]; then
			export MYSQL_ROOT_PASSWORD="$(pwgen -1 32)"
			echo "GENERATED ROOT PASSWORD: $MYSQL_ROOT_PASSWORD"
		fi

		rootCreate=
		# default root to listen for connections from anywhere
		#file_env 'MYSQL_ROOT_HOST' '%'
		file_env 'MYSQL_ROOT_HOST' 'localhost'
		if [ ! -z "$MYSQL_ROOT_HOST" -a "$MYSQL_ROOT_HOST" != 'localhost' ]; then
			# no, we don't care if read finds a terminating character in this heredoc
			# https://unix.stackexchange.com/questions/265149/why-is-set-o-errexit-breaking-this-read-heredoc-expression/265151#265151
			read -r -d '' rootCreate <<-EOSQL || true
				CREATE USER 'root'@'${MYSQL_ROOT_HOST}' IDENTIFIED BY '${MYSQL_ROOT_PASSWORD}' ;
				GRANT ALL ON *.* TO 'root'@'${MYSQL_ROOT_HOST}' WITH GRANT OPTION ;
			EOSQL
		fi

		"${mysql[@]}" <<-EOSQL
			-- What's done in this file shouldn't be replicated
			--  or products like mysql-fabric won't work
			SET @@SESSION.SQL_LOG_BIN=0;

			DELETE FROM mysql.user WHERE user NOT IN ('mysql.sys', 'mysqlxsys', 'root') OR host NOT IN ('localhost') ;
			SET PASSWORD FOR 'root'@'localhost'=PASSWORD('${MYSQL_ROOT_PASSWORD}') ;
			GRANT ALL ON *.* TO 'root'@'localhost' WITH GRANT OPTION ;
			${rootCreate}
			DROP DATABASE IF EXISTS test ;
			FLUSH PRIVILEGES ;
		EOSQL

		if [ ! -z "$MYSQL_ROOT_PASSWORD" ]; then
			mysql+=( -p"${MYSQL_ROOT_PASSWORD}" )
		fi

		file_env 'MYSQL_DATABASE'
		if [ "$MYSQL_DATABASE" ]; then
			echo "CREATE DATABASE IF NOT EXISTS \`$MYSQL_DATABASE\` ;" | "${mysql[@]}"
			mysql+=( "$MYSQL_DATABASE" )
		fi

		file_env 'MYSQL_USER'
		file_env 'MYSQL_PASSWORD'
		if [ "$MYSQL_USER" -a "$MYSQL_PASSWORD" ]; then
			echo "CREATE USER '$MYSQL_USER'@'%' IDENTIFIED BY '$MYSQL_PASSWORD' ;" | "${mysql[@]}"

			if [ "$MYSQL_DATABASE" ]; then
				echo "GRANT ALL ON \`$MYSQL_DATABASE\`.* TO '$MYSQL_USER'@'%' ;" | "${mysql[@]}"
			fi
		fi

		echo
		for f in /docker-entrypoint-initdb.d/*; do
			case "$f" in
				*.sh)     echo "$0: running $f"; . "$f" ;;
				*.sql)    echo "$0: running $f"; "${mysql[@]}" < "$f"; echo ;;
				*.sql.gz) echo "$0: running $f"; gunzip -c "$f" | "${mysql[@]}"; echo ;;
				*)        echo "$0: ignoring $f" ;;
			esac
			echo
		done

		if ! kill -s TERM "$pid" || ! wait "$pid"; then
			echo >&2 'MySQL init process failed.'
			exit 1
		fi

		echo
		echo 'MySQL init process done. Ready for start up.'
		echo
	else
		echo "Data directory already exists..."
		# Data folder already exists, so check for marker file		
		if [ ! -f "$DATADIR/.stratos_10.2" ]; then
			echo "Upgrading database to 10.2 ...."
			upgrade_database
		else
			echo "No need to upgrade - upgrade has already been applied"
		fi
	fi
fi

# Touch marker file to record that we have upgraded to 10.2
touch "$DATADIR/.stratos_10.2"

if [ "${RESET_PASSWORDS}" == "true" ]; then
	echo "Resetting passwords ..."
  reset_passwords
fi

echo "Starting MariaDB ..."
exec "$@"
