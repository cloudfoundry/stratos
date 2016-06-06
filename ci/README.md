## CI/CD for the Stackato Console

### Overview
The CI/CD process for the Stackato Console is responsible for creating a set of artifacts that can be used to install the Console within the Helion Control Plane (HCP). This process is based on [Concourse](http://concourseci.com), an open source CICD platform.

### Preparation
Your environment should be prepared to develop and test Concourse CICD pipelines. The best preparation for a newcomer to Concourse is to go thru the [Concourse Tutorial](https://github.com/starkandwayne/concourse-tutorial)

You can always follow the Concourse Tutorial README and use VirtualBox. Be aware that if you are using Docker, this creates a second VM on your development machine, a non-optimal consideration. An easier solution is to bring Concourse up on your local development machine using Docker. Fortunately, this is super easy:

1. Fork Greg Arcara's [concourse-docker](https://github.com/gregarcara/concourse-docker) repo.

2. Follow the README in the forked repo to stand up Concourse in a series of three Docker containers.

Now you should be able to follow the tutorial.

### Concourse related commands

Login to the shared Concourse environment:
```
fly --target helion-console login --concourse-url https://concourse.helion.lol
```

Set a pipeline
```
fly -t helion-console sp -p console-ci-master -c console-ci-master.yml -l helion-creds.yml
```

Destroy a pipeline
```
fly -t helion-console dp -p console-ci-master
```
