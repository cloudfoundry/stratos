# Map a database service to the console



1. Enable the endpoint dashboard
    * This is not strickly required, but the only reason for haTODO¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬¬
1. Create the console app and associated a postgres service instance
    * Use the instructions [here]("../README.md")
    * Log into the console and then navigate to the console application
    * In the `Services` tab associate a new postgres service instance to the application
    * Validate in the `Variables` tab that `VCAP_SERVICES` is populated with new postgres credentials
1. Set up the associated db instance. Run the following from the root of the console
    ```
    cf push -c "deploy/cloud-foundry/db-migration/db-migrate.sh" -u "process"
    ```
    > **NOTE** The next time cf push is run it will use the same command as previously (in the above case the incorrect migrate command).
     To reset this simply run with `-c "null"`
1. Restart the app to pick up the new settings
    