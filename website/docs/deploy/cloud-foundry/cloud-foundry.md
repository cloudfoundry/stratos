---
id: cloud-foundry
title: Deploying as a Cloud Foundry Application
sidebar_label: Deploy as an Application
---

In this case, Stratos is deployed in a manner optimized for the management of a single Cloud Foundry instance. The 'Endpoints Dashboard' that allows multiple Cloud Foundry endpoints to be registered is not deployed. An extra component is deployed that detects that the Console is running as Cloud Foundry which does the following:

- Automatically detects the Cloud Foundry endpoint and located the UAA Endpoint to use for authentication
- Authenticates directly against the UAA for the Clound Foundry where the Console is deployed and assumes that Cloud Foundry admins are also Console admins (the UAA Scope 'cloud_controller.admin' is used to identify admins)
- Uses a SQLite database rather than Postgres
- Automatically connects to the Cloud Foundry endpoint when a user logs in to simplify the user flow when using the Console in this case

In this case, the front-end web application static resources are served by the API Server back-end rather than a separate web server.

By default, a non-persistent SQLite database is used - by automatically registering the cloud foundry endpoint and connecting to it on login, all data stored in the database can be treated as ephemeral, since it will be re-created next time a user logs in. Cloud Foundry Session Affinity is used to ensure that when scaling up the Console Application to multiple instances, the user is also directed to the instance which will know about them and their endpoints (since each Application instance will have its own local SQLite store).

Alternatively, Stratos can be configured [with a persistent Cloud Foundry database service](db-migration), which enables features requiring persistence such as user favorites.

## Deployment Steps

Stratos can be pushed as an application to Cloud Foundry. 

You can do it in two ways:

1. [Deploy Stratos from source](#deploy-stratos-from-source)
1. [Deploy Stratos from docker image](#deploy-stratos-from-docker-image)

You will then be able to open a web browser and navigate to the console URL:

`https://console.<DOMAIN>`

Where `<DOMAIN>` is the default domain configured for your Cloud Foundry cluster.

To login use the following credentials detailed [here](../access).

If you run into issues, please refer to the [Troubleshooting Guide](cf-troubleshooting) below.

> The console will pre-configure the host Cloud Foundry endpoint. No other CF instance should be registered unless the instructions in
 the section [Associate Cloud Foundry database service](#associate-cloud-foundry-database-service) are followed.
 All other deployment methods (helm, docker all-in-one, etc) allow the registration of multiple CF instances by default.

Note:

1. You need the cf CLI command line tool installed and available on the path.
1. You need to have configured the cf cli to point to your Cloud Foundry cluster, to be authenticated with your credentials and to be targeted at the organization and space where you want the console application be created.
1. You may need to configure Application Security Groups on your Cloud Foundry Cluster in order that  Stratos can communicate with the Cloud Foundry API. See [below](#application-security-groups) for more information.
1. The Stratos Console will automatically detect the API endpoint for your Cloud Foundry. To do so, it relies on the `cf_api_url` value inside the `VCAP_APPLICATION` environment variable. If this is not provided by your Cloud Foundry platform, then you must manually update the application manifest as described [below](#console-fails-to-start).

### Running Stratos in Production Environments

Please be aware of the following when running Stratos in a production environment:

#### Configure a Session Store Secret

Stratos uses a Session Store Secret to protect the user session cookie. We recommend that you set your own value for this secret - choosing an alphanumeric string of your choice.

You can configure this secret by editing the application manifest and adding to the `env` section, e.g.

```
applications:
- name: console
  ... memory, disk settings here
  env:
    SESSION_STORE_SECRET: <your session store secret here>
```

#### Pre-configure UAA client used for user invites

> You can skip this step and configure any CFs invite clients via the Stratos UI.

 To set the UAA client for user invites, supply the client id and client secret as environment variables as shown below:

  ```
  INVITE_USER_CLIENT_ID=<UAA_CLIENT_ID>
  INVITE_USER_CLIENT_SECRET=<UAA_CLIENT_SECRET>
  ```

This will set the the UAA client and UAA secret used to invite users for the default CF only.

See the [invite users guide](../../endpoints/cf/invite-user-guide) for more information about user invites in Stratos.

#### Use of the Default Embedded SQLite Database

We do not recommend deploying Stratos to a production environment using the default embedded SQLite Database. Instead we recommend creating
and binding a database service instance to Stratos - for more information see [here](db-migration).

### Deploy Stratos from source

To do so, `clone` the **stratos** repository, `cd` into the newly cloned repository and `push` to Cloud Foundry. This can be done with:

```
git clone https://github.com/cloudfoundry/stratos
cd stratos
git checkout tags/stable -b stable
./build/store-git-metadata.sh
cf push
```

If the cf push exceeds the time allowed see the instructions [here](#pre-building-the-ui)

#### Pre-building the UI

Due to the memory usage of the Angular compiler (see below), when deployed to Cloud Foundry via `cf push`, Stratos does not use AOT (Ahead-of-Time) compilation.

If you wish to enable AOT or reduce the push time, you can pre-build the UI before pushing.

This can be done with:

```
git clone https://github.com/cloudfoundry/stratos
cd stratos
npm install
npm run prebuild-ui
cf push
```

You will need a recent version of Node installed locally to do this.

The `prebuild-ui` npm script performs a build of the front-end UI and then zips up the resulting folder into a package named `stratos-frontend-prebuild.zip`. The Stratos buildpack will unpack this zip file and use its contents instead of building the UI during staging, when this file is present.


#### Memory Usage

The Stratos Cloud Foundry `manifest.yml` states that the application requires
`1512MB` of memory. This is required during the build process of the
application since building an angular2 app is a memory intensive process. The
memory limit can be scaled down after the app has been pushed, using the cf CLI.

### Deploy Stratos from docker image

Deploy Stratos using the [`splatform/stratos`](https://hub.docker.com/r/splatform/stratos) docker image

> **NOTE:** Your Cloud Foundry must have docker support [enabled](https://docs.cloudfoundry.org/adminguide/docker.html#enable).

```
cf push console -o splatform/stratos:stable -m 128M -k 384M
```
> Note: You can replace `console` in the command above with a name of your choice for the application

Alternatively cf push using a manifest

- download [manifest-docker.yml](https://raw.githubusercontent.com/cloudfoundry/stratos/master/manifest-docker.yml) or create your own manifest file:
    ```yaml
    applications:
    - name: console
      docker:
        image: splatform/stratos:stable
      instances: 1
      memory: 128M
      disk_quota: 384M
    ```
- now, you can simply push it to Cloud Foundry:
    ```
    cf push -f manifest-docker.yml
    ```

## Associate Cloud Foundry database service
Follow instructions [here](db-migration).

## Use SSO Login

By default Stratos will present its own login UI and only supports username and password authentication with your UAA. You can configure Stratos to use UAA's login UI by specifying the `SSO_LOGIN` environment variable in the manifest, for example:

```
applications:
- name: console
  ... memory, disk settings here
  env:
    SSO_LOGIN: true
```

When SSO Login is enabled, Stratos will also auto-connect to the Cloud Foundry it is deployed in using the token obtained during the SSO Login flow.

For more information - see [Single-Sign On](../../advanced/sso).
