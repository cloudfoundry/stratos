# Stratos UI

[![Build Status](https://travis-ci.org/SUSE/stratos-ui.svg?branch=master)](https://travis-ci.org/SUSE/stratos-ui)
[![GitHub release](https://img.shields.io/github/release/SUSE/stratos-ui.svg)](https://github.com/SUSE/stratos-ui/releases/latest)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://github.com/SUSE/stratos-ui/blob/master/LICENSE.md)

Stratos UI is an Open Source Web-based UI (Console) for managing Cloud Foundry. It allows users and administrators to both manage applications running in the Cloud Foundry cluster and perform cluster management tasks.

![Stratos UI Application view](docs/images/screenshots/app-wall.png)

## Deploying Stratos UI

Stratos UI can be deployed in the following environments:

1. Cloud Foundry, as an application. See [guide](deploy/cloud-foundry)
2. Kubernetes, using a Helm chart. See [guide](deploy/kubernetes)
3. Docker, using docker compose. See [guide](deploy/docker-compose)
4. Docker, single container deploying all components. See [guide](deploy/all-in-one)

## Quick Start

To get started quickly, we recommend following the steps to deploy the Stratos UI Console as a Cloud Foundry Application - see [here](deploy/cloud-foundry).

You can also quickly deploy Stratos UI, using the all-in-one container:
```
$ docker run -p 4443:443 splatform/stratos-ui:latest 
```

You can access the UI on `https://localhost:4443`

## Further Reading
 
Take a look at the [Feature Set](docs/features.md) for details on the feature set that Stratos UI provides.
 
Get an [Overview](docs/overview.md) of Stratos UI, its components and the different ways in which it can be deployed.

Take a look at the [Development Roadmap](docs/roadmap.md) to see where we are heading.

## Contributing

We very much welcome developers who would like to get involved and contribute to the development of the Stratos UI project. Please refer to the [Contributing guide](CONTRIBUTING.md) for more information.

For information to help getting started with development, please read the [Developer's Guide](docs/development.md).

## Support and feedback

We have a channel (#stratos) on the Cloud Foundy Slack where you can ask questions, get support or give us feedback. We'd love to hear from you if you are using Stratos.

You can join the Cloud Foundry Slack here - https://slack.cloudfoundry.org/  - and then join the #stratos channel.

## License

The work done has been licensed under Apache License 2.0. The license file can be found [here](LICENSE.md).

