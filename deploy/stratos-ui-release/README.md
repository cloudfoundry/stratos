## Deploying the BOSH release

**Note:** BOSH release is currently experimental. It currently has only been tested in a BOSH Lite environment, any suggestions for improvements to support other BOSH environments are welcome.

To build and deploy the BOSH release you will require a BOSH director. If you don't have one available follow these instructions to setup BOSH lite [here](https://bosh.io/docs/bosh-lite.html).
The rest of the instruction assume that a BOSH lite environment is being used to deploy the chart.


### Deploying in a BOSH lite environment

1. To upload a cloud-config execute the following:
    ```
    $ bosh -e vbox update-cloud-config ~/workspace/bosh-deployment/warden/cloud-config.yml
    ```

2. Upload a stemcell (using the `bosh-warden-boshlite-ubuntu-trusty`)
    ```
    bosh -e vbox upload-stemcell https://bosh.io/d/stemcells/bosh-warden-boshlite-ubuntu-trusty-go_agent?v=3421.9 \
      --sha1 1396d7877204e630b9e77ae680f492d26607461d
    ```

3. Create a symlink to the root of the repository in `deploy/stratos-ui-release/src/`

    ```
    $ cd deploy/stratos-ui-release/src
    $ ln -s ../../../ stratos
    ```

4. Build the Stratos UI BOSH release from `deploy/stratos-ui-release`
    ```
    $ bosh create-release
    ```

    If you have outstanding changes locally add the `--force` flag.

5. After a successful build, upload the release to your director.
    ```
    $ bosh -e vbox upload-release -d stratos
    ```

6. Deploy the release

    A sample bosh-lite deployment manifest has been provided in `bosh-lite/deployment.yaml`. The following will use that command to deploy the Console.

    5.1. Provide UAA settings in the deployment manifest if known. In the following some sample values have been provided.
    ```
    uaa_address: https://my-uaa:8080
    console_admin_scope: cloud_controller.admin
    console_uaa_client: cf
    ```

    5.2. Select the database you want to use. The Stratos UI Console can be deployed using a MySQL/MariaDB store or SQLite. The following are sample values for a mysql configuration. This assumes a MySQL server has been deployed locally on the host.

    ```
    use_mysql: true
    use_sqlite: false
    mysql_user: stratos
    mysql_admin_user: root
    mysql_admin_password: changeme
    mysql_user_password: strat0s
    mysql_db: stratos-db
    mysql_host: 127.0.0.1
    mysql_port: 3306

    ```

    To use SQLite, use the following and comment out the mysql parameters.
    ```
    # use_mysql: true
    use_sqlite: true
    # mysql_user: stratos
    # mysql_admin_user: root
    # mysql_admin_password: changeme
    # mysql_user_password: strat0s
    # mysql_db: stratos-db
    # mysql_host: 127.0.0.1
    # mysql_port: 3306
    ```

    To deploy you deployment manifest execute the following.

    ```
    $ bosh -e vbox -d stratos deploy bosh-lite/deployment.yml
    ```

7. List deployment

    List deployment to get the IP address of the frontend to access the Console. In the following example to access the Console the address is `https://10.0.16.4`.
    If you are unable to reach the IP 10.0.16.4, a route may have to be setup.
    ```
     sudo ip route add   10.244.0.0/16 via 192.168.50.6 
    ```

    ```
    09:10 $ bosh -e vbox -d stratos instances
    Using environment '192.168.50.6' as client 'admin'

    Task 22. Done

    Deployment 'stratos'

    Instance                                       Process State  AZ  IPs
    backend/68580d76-a241-4de2-b246-82d0a184c9bb   running        -   10.0.16.103
    frontend/477c94ef-3138-416c-97d7-c09682e6d5dd  running        -   10.0.16.4                      

    2 instances

    Succeeded
    ```
