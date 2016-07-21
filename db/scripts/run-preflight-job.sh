#!/bin/bash
set -e

# Step 1 - Set the lock file on the shared volume
MIGRATION_VOLUME=hsc-migration-volume
UPGRADE_LOCK_FILE=upgrade.lock
echo "Adding $UPGRADE_LOCK_FILE file to the shared migration volume $MIGRATION_VOLUME."
touch /$MIGRATION_VOLUME/$UPGRADE_LOCK_FILE

echo "Created the upgrade lock file."

exit 0
