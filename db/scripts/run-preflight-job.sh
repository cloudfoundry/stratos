#!/bin/bash
set -e

# Step 1 - Set the lock file on the shared volume
# UPGRADE_VOLUME=hsc-upgrade-volume
# UPGRADE_LOCK_FILENAME=upgrade.lock
echo "Adding $UPGRADE_LOCK_FILENAME file to the shared upgrade volume $UPGRADE_VOLUME."
touch /$UPGRADE_VOLUME/$UPGRADE_LOCK_FILENAME
chmod 440 /$UPGRADE_VOLUME/$UPGRADE_LOCK_FILENAME

echo "Created the upgrade lock file."

# Step 2 - Create an AES-256 compliant encryption key
# in a file on a shared volume.
# ENCRYPTION_KEY_VOLUME=hsc-encryption-key-volume
# ENCRYPTION_KEY_FILENAME=key
echo "Checking to see if we need to generate the encryption key $ENCRYPTION_KEY_FILENAME file:"
if [ ! -e /$ENCRYPTION_KEY_VOLUME/$ENCRYPTION_KEY_FILENAME ]; then
  echo "-- Adding $ENCRYPTION_KEY_FILENAME file to the shared volume $ENCRYPTION_KEY_VOLUME."
  keyfile=$(openssl enc -aes-256-cbc -k secret -P -md sha1 | grep key | cut -d '=' -f2)
  printf "%s" "$keyfile" > /$ENCRYPTION_KEY_VOLUME/$ENCRYPTION_KEY_FILENAME
  chmod 440 /$ENCRYPTION_KEY_VOLUME/$ENCRYPTION_KEY_FILENAME
  echo "-- Done."
fi

exit 0
