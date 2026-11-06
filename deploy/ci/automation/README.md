# Automation Scripts

This folder contains script to help with automated testing in CI environments.

The Stratos team uses these scripts with a Jenkins instance to monitor systems and verify the deployment of Stratos.

- cfallinonetest.sh - Builds the Docker All-in-One image, runs it locally and then runs the E2E tests.

- check-cf.sh - Simple check that a CF System is responding to API requests.

- check-docker-images.sh - Checks that the Stratos nightly docker images have been updated. We use this to ensure the nightly jobs are operational.

- check-stratos.sh - Checks a deployed Stratos system is up and can be logged into.

- runandrecord,sh - Helper script to run E2E tests and record video

- cfutils.sh - Helper script providing common functions
