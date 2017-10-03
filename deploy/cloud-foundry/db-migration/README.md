# Associate a Cloud Foundry database service

As described in the standard `cf push` instructions [here]("../README.md") the console when deployed via `cf push`
 does not contain any way to persist date over application restarts and db entries such as registered endpoints
 and user tokens are lost. To resolve this a Cloud Foundry db service can be bound to the console. Run through 
 the steps below to implement.

1. Create a Service Instance for the Console Database

    > **NOTE** The console supports postgresql and mysql DBs. Your service instance must be tagged with either `stratos_postgresql` for postgresql or `stratos_mysql` for mysql.

    Use `cf create-service` to create a service instance for the DB - for example for postgresql:
    ```
    cf create-service postgresql v9.4 console_db -t stratos_postgresql
    ```
    * In this example, `postgresql` is the service name for the Postgres DB service, `v9.4` is the service plan and `console_db` is the name for the service instance that will be created. 
    * To view services and service plans:
      ```
      cf marketplace
      ```

1. Update the Console's Manifest

   * The the Console `manifest.yml` file and add the following:
    ```
    env:
        FORCE_ENDPOINT_DASHBOARD: true
    services:
    - console_db
    ```

    * This enables the endpoints dashboard UI and specifies that the Console should bind to the service instance named `console_db`

1. Push the app via cf push
    ```
    cf push
    ```

    
