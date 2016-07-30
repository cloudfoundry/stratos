#!/bin/bash
set -e

# Step 1 - Set the lock file on the shared volume
UPGRADE_VOLUME=hsc-upgrade-volume
UPGRADE_LOCK_FILE=upgrade.lock
echo "Adding $UPGRADE_LOCK_FILE file to the shared upgrade volume $UPGRADE_VOLUME."
touch /$UPGRADE_VOLUME/$UPGRADE_LOCK_FILE

echo "Created the upgrade lock file."

exit 0
