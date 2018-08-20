# Accessing Stratos

Depending on the deployment mode, you may require access to an UAA.

## Deploying in Docker-Compose

In Docker Compose a UAA instance is deployed.
The default login credentials for the Console admin user are:

 - username: `admin`,
 - password: `hscadmin`

The Console admin scope in this environment is `stratos.admin`. Any user with this scope will be identified as a user.


## Cloud Foundry deployment

In a Cloud Foundry deployment, the Console will be configured to use the UAA used by the Cloud Foundry instance.
Therefore, the login credentials will be the CF credentials for the user. A Cloud Foundry administrator (a user with the `cloud_controller.admin` scope) will also be a Console administrator.

## Kubernetes deployment

In a Kubernetes deployment using Helm, no UAA instance is deployed. Therefore users need to provide their own UAA to against.

The Console will start in a setup mode and users will be need to provide the following to complete the setup:
1. UAA Endpoint
2. Is SSL Validation should be enforced
3. Username and password for a user who has required Console administrator scope
4. The UAA Client ID and client secret

Once the user provides this information, the user will be able to select the scope which should be used to identify a Console admin.

# Docker, single container deployment

The single container deployment does not contain a UAA, and all the instructions specified for a Kubernetes deployment apply to this.

# Quickly setting up a UAA for development

1. We will setup two containers that are linked to each other
```
$ docker network create --driver=bridge dev-bridge
```

1. Bring up the single container Console
```
$ docker run -p 4443:443 --net=dev-bridge splatform/stratos --name console
```

2. Bring up the UAA
```
$ docker run --net=dev-bridge --name=uaa --rm splatform/stratos-uaa
```

3. Access the Console at `http://localhost:4443/` and provide the following information:
UAA Endpoint API URL:  `http://uaa:8080`
Client ID: `console`
Client Secret: Leave this blank
Admin Account: `admin`
Password: `hscadmin`

4. Click enter and select the following from the list:
`stratos.admon`

5. The Console is now ready to be used
