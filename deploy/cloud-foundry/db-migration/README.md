# Associated a Cloud Foundry database service

As mentioned in the standard cf push instructions [here]("../README.md") the console as deployed via cf push
 does not contain any way to persist date over application restarts and db entries such as registered endpoints
 and user tokens are lost. To resolve this a Cloud Foundry db service can be binded to the console. Run through 
 the steps below to implement.

> **NOTE** The console supports postgresql. Your Cloud Foundry deployment should contain a service for
 the desired db tagged with 'postgresql'.

1. Enable the endpoint dashboard
    * This is not strictly required, but at the moment is the only motivator to follow the next steps
    * Add the following to the manifest
    ```
    env:
        FORCE_ENDPOINT_DASHBOARD: true
    ```
1. Create the console app and associated a postgres service instance
    * Use the instructions [here]("../README.md")
    * Log into the console and then navigate to the console application
    * In the `Services` tab associate a new postgres service instance to the application
    * Validate in the `Variables` tab that `VCAP_SERVICES` is populated with new postgres credentials
    * Remember to update the manifest with the services section
1. Set up the associated db instance. Run the following from the root of the console
    ```
    cf push -c "deploy/cloud-foundry/db-migration/db-migrate.sh" -u "process"
    ```
    > **NOTE** All subsequent pushes, restarts, restaging will use this migration command.
    It's therefore very important to execute the next step in order for the console to start
1. Restart the app via cf push
    ```
    cf push -c "null"
    ```

    