# Associate a Cloud Foundry database service

As described in the standard `cf push` instructions [here]("../README.md") the console when deployed via `cf push`
 does not contain any way to persist date over application restarts and db entries such as registered endpoints
 and user tokens are lost. To resolve this a Cloud Foundry db service can be bound to the console. Run through 
 the steps below to implement.

> **NOTE** The console supports postgresql. Your Cloud Foundry deployment should contain a service for
 the desired db tagged with 'stratos_postgresql'.

1. Create a Service Instance for the Console Database

    Use `cf create-service` to create a service instance for the Postges DB - for example:
    ```
    cf create-service postgresql v9.4 console_db -t stratos_postgresql
    ```
    * In this example, `postgresql` is the service name for the Postgres DB service, `v9.4` is the service plan and `console_db` is the name for the service instance that will be created.

1. Update the Console's Manifest

   * The the Console `manifest.yml` file and add the following:
    ```
    env:
        FORCE_ENDPOINT_DASHBOARD: true
    services:
    - console_db
    ```

    * This enables the endpoints dashboard UI and specifies that the Console should bind to the service instance named `console_db`

1. Set up the database schema for the Console. Run the following from the root of the console:
    ```
    cf push -c "deploy/cloud-foundry/db-migration/db-migrate.sh" -u "process"
    ```
    > **NOTE** All subsequent pushes, restarts, restaging will use this migration command.
    It's therefore very important to execute the next step in order for the console to start

    Wait for the database setup to complete, by viewing the application log and waiting for the message indicating setup is complete:
    ```
    cf logs console
    ```
   
1. Restart the app via cf push
    ```
    cf push -c "null"
    ```

    