---
id: db-migration
title: Associate a Cloud Foundry database service
sidebar_label: Database service bindings
---

As described in the standard `cf push` instructions [here](../deploy-readme) Stratos, when deployed via `cf push`,
does not contain any way to persist data over application restarts and db entries such as registered endpoints
and user tokens are lost. To resolve this a Cloud Foundry db service can be bound to to it. Run through
the steps below to implement.

1. Create a Database Service Instance

    > **NOTE** Stratos supports postgresql and mysql DBs. Stratos will enumerate the bound service instances to detect the database type - see  [below](#note-on-service-bindings) for more detail.

    Use `cf create-service` to create a service instance for the DB - for example:
    ```
    cf create-service postgresql v9.4 console_db
    ```
    * In this example, `postgresql` is the service name for the Postgres DB service, `v9.4` is the service plan and `console_db` is the name for the service instance that will be created. 
    * To view services and service plans:
      ```
      cf marketplace
      ```

    You can also create an [User-Provided Service Instance](https://docs.cloudfoundry.org/devguide/services/user-provided.html):
    ```bash
    cf cups console_db  -p '{"uri": "postgres://", "username":"console_appuser", "password":"***", "hostname":"192.168.12.34", "port":"5432", "dbname":"console_db" }'
    ```
2. Associate the new service with Stratos via the Manifest

   * Add the service name to the `services` section of Stratos's `manifest.yml`, for example:
    ```
    services:
    - console_db
    ```

    * This specifies that Stratos should bind to the service instance named `console_db`

3. Push the app via cf push
    ```
    cf push
    ```

    
## Note on Service Bindings

Stratos will look through all service instances that are bound to it and filter those to determine which are database services. It determines:

* A Postgres database service if it has a uri field in the credentials object which begins with the string "postgres://" or it has a tag "postgresql"

* A MySQL database service if it has a uri field in the credentials object which begins with the string "mysql://" or it has a tag "mysql"

If there is a single database service instance, Stratos will use that.

If there are multiple database service instances, Stratos will look for one with a tag of "stratos".
