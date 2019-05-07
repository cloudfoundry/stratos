# Automation Scripts

This folder contains script to help with automated testing in CI environments.

The Stratos team uses these scripts with a Jenkins instance to monitor systems and verify the deployment of Stratos.

- cfpushtest.sh - Pushes Stratos to a local PCF Dev instance and runs the E2E tests. This can also run MySQL or Postgres in a docker container and bind these are services in order to validate running Stratos with these databases.

- cfallinonetest.sh - Builds the Docker All-in-One image, runs it locally and then runs the E2E tests.

- check-cf.sh - Simple check that a CF System is responding to API requests.

- check-docker-images.sh - Checks that the Stratos nightly docker images have been updated. We use this to ensure the nightly jobs are operational.

- check-stratos.sh - Checks a deployed Stratos system is up and can be logged into.

- runandrecord,sh - Helper script to run E2E tests and record video

- cfutils.sh - Helper script providing common functions
