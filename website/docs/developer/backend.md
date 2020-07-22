---
title: Backend Development
sidebar_label: Overview
---


## Backend Development

Jetstream is the back-end for Stratos. It is written in Go.

We use Go Modules for dependency management.

### Pre-requisites

You will need the following installed/available:

* go 1.12 or later.

*For authentication, **either***

* A UAA instance
* A local user account 

### Building the back-end


#### Build

From the `src/jetstream` folder, build the Stratos back-end with:

```
npm run build-backend
```

The back-end executable is named `jetstream` and should be created within the `src/jetstream` folder.

### Configuration

Configuration can either be done via
- Environment Variable and/or Config File
- In the UI when you first use a front end with this backend

In all cases the configuration is saved to the database on first run. Any subsequent changes require the db to be reset. For the default sqlite
db provider this can be done by deleting `src/jetstream/console-database.db`

#### Configure by Environment Variables and/or Config File

By default, the configuration in file `src/jetstream/default.config.properties` will be used. These can be changed by environment variables
or an overrides file.

##### Environment variable

If you wish to use a local user account, ensure you have set the following environment variables:

- `AUTH_ENDPOINT_TYPE=local`
- `LOCAL_USER` - The username for the local user
- `LOCAL_USER_PASSWORD` - The password for the local user
- `LOCAL_USER_SCOPE=stratos.admin` - This gives the local user admin permissions. Currently other roles are not available.

If you have a custom uaa, ensure you have set the following environment variables:

- `UAA_ENDPOINT`- the URL of your UAA
  - If you have an existing CF and want to use the same UAA use the `authorization_endpoint` value from `[cf url]/v2/info`
    For example for PCF Dev, use: `UAA_ENDPOINT=https://login.local.pcfdev.io`.
- `CONSOLE_CLIENT` - the Client ID to use when authenticating against your UAA (defaults to: 'cf')
- `CONSOLE_CLIENT_SECRET` - the Client ID to use when authenticating against your UAA (defaults to empty)
- `CONSOLE_ADMIN_SCOPE` - an existing UAA scope that will be used to identify users as `Stratos Admins`

> To use a pre-built Stratos UAA container execute `docker run --name=uaa --rm -p 8080:8080 -P splatform/stratos-uaa`. The UAA will be
  available at `http://localhost:8080` with a `CONSOLE_CLIENT` value of `console`

##### Config File

To easily persist configuration settings copy `src/jetstream/default.config.properties` to `src/jetstream/config.properties`. The backend will load its
configuration from this file in preference to the default config file, if it exists. You can also modify individual configuration settings
by setting the corresponding environment variable.

##### To configure a local user account via config file

In `src/jetstream/config.properties` uncomment the following lines:

```
AUTH_ENDPOINT_TYPE=local
LOCAL_USER=localuser
LOCAL_USER_PASSWORD=localuserpass
LOCAL_USER_SCOPE=stratos.admin
```

Load the Stratos UI and proceed to log in using the configured credentials.

#### To configure UAA via Stratos

1. Go through the `Config File` step above and comment out the `UAA_ENDPOINT` with a `#` in the new `config.properties` file.
1. If any previous configuration attempt has been made reset your database as described above.
1. Continue these steps from [Run](#run).
   - You should see the line `Will add setup route and middleware` in the logs
1. Load the Stratos UI as usual and you should be immediately directed to the setup wizard

The setup wizard that allows you to enter the values normally fetched from environment variables or files. The UI will assist you through
this process, validating that the UAA address and credentials are correct. It will also provide a list of possible scopes for the Stratos Admin

#### Run

Execute the following file from `src/jetstream`

```
jetstream
```

You should see the log as the backend starts up. You can press CTRL+C to stop the backend.


#### Automatically register and connect to an existing endpoint
To automatically register a Cloud Foundry add the environment variable/config setting below:

```
AUTO_REG_CF_URL=<api url of cf>
```

Jetstream will then attempt to auto-connect to it with the credentials supplied when logging into Stratos.

#### Running Jetstream in a container

We recommend running Stratos using the Docker All-In-One image.

* Follow instructions in the deploy/all-in-one docs

