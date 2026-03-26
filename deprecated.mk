# deprecated.mk — catch-all shim for renamed Makefile targets
#
# Included via variable path so shell tab-completion parsers
# cannot resolve the file and the old names stay hidden.
#
# Make itself resolves the variable and processes this file normally,
# so typing an old target name still produces a helpful message.

.DEFAULT:
	@case "$@" in \
		build-frontend)  echo "RENAMED: use 'make build frontend'" >&2 ;; \
		build-backend)   echo "RENAMED: use 'make build backend'" >&2 ;; \
		build-backend-all) echo "RENAMED: use 'make build backend'" >&2 ;; \
		backend-all)     echo "RENAMED: use 'make build backend'" >&2 ;; \
		package)         echo "RENAMED: use 'make release'" >&2 ;; \
		clean-dev)       echo "RENAMED: use 'make clean'" >&2 ;; \
		clean-deep)      echo "RENAMED: use 'make clean dist'" >&2 ;; \
		clean-all)       echo "RENAMED: use 'make clean dist'" >&2 ;; \
		debug-version)   echo "RENAMED: use 'make dump version'" >&2 ;; \
		fe-version)      echo "RENAMED: use 'make stamp frontend'" >&2 ;; \
		dev-frontend)    echo "RENAMED: use 'make dev frontend'" >&2 ;; \
		dev-backend)     echo "RENAMED: use 'make dev backend'" >&2 ;; \
		*) echo "make: *** No rule to make target '$@'. Stop." >&2; exit 2 ;; \
	esac
