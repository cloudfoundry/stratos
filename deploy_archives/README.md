## Deploy Archives

This folder contains the last few deploys of the Helion Stackato v4.0 Console. Each deploy is tagged with a ISO-8601-like timestamp, of `YYYYmmddTHHMMSSZ`

In order to use one of these builds to stand up the Console in an HCP environment, you will need to:

1. Grab the service and instance definition (json) files for a specific timestamp.

2. The service definition file is ready to be used without changes.

3. You will need to register your instance of the Console with GitHub. This REQUIRES you to have a stable URL where the Console will be available. Once your application is registered with GitHub, you should have a GitHub client id, client secret, and a state.

4. Open the instance definition file, scroll to the bottom and:

  a. Replace "\__REPLACE_WITH_OAUTH_CLIENT_ID\__" with your GitHub registered client id.

  b. Replace "\__REPLACE_WITH_OAUTH_CLIENT_SECRET\__" with your GitHub registered client secret.

  c. Replace "\__REPLACE_WITH_OAUTH_STATE\__" with a random test string.
