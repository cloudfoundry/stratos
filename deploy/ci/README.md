## CI/CD for the Stackato Console

### Overview
The CI/CD process for the Stackato Console is responsible for creating a set of artifacts that can be used to install the Console within the Helion Control Plane (HCP). This process is based on [Concourse](http://concourseci.com), an open source CI/CD platform.

### Our real pipelines
Our pipelines run in the HPE shared Concourse environment, located at:
`https://concourse.helion.lol`. You should be able to use your GitHub credentials to get in, assuming you have been granted proper access.

### Preparation for pipeline development
Your environment should be prepared to develop and test Concourse CI/CD pipelines. The best preparation for a newcomer to Concourse is to go thru the [Concourse Tutorial](https://github.com/starkandwayne/concourse-tutorial)

You can always follow the Concourse Tutorial README and use VirtualBox. Be aware that if you are using Docker, this creates a second VM on your development machine, a non-optimal consideration. An easier solution is to bring Concourse up on your local development machine using Docker. Fortunately, this is super easy:

1. Fork Greg Arcara's [concourse-docker](https://github.com/gregarcara/concourse-docker) repo.

2. Follow the README in the forked repo to stand up Concourse in a series of three Docker containers.

Now you should be able to follow the tutorial.

### Create a secrets file
Create a secrets file, using the `secrets.yml-sample`; rename it to `<whatever>.yml`. The following placeholders should be updated as noted for the pipeline you're running:

Variable | Description | Required by
--- | --- | ---
s3-region-name | This should be the name of the AWS Region your Concourse pipeline will run in. | console-ci-master
s3-access-key | This should be your AWS S3 access key. | console-ci-master
s3-secret | This should be your AWS S3 secret. | console-ci-master
s3-version-bucket | This should be a bucket in S3 that will contain a file that is used to track the current version of the Console. | console-ci-master
s3-version-key | The full path within the noted `s3-version-bucket` to the version file, including the filename. | console-ci-master
registry | The registry used to store the tagged docker images required to install the Console within HCP. Generally this is one of two values: 1) `docker-registry.helion.space:443`, the shared internal HPE registry. 2) the registry url for DockerHub | console-ci-master
github-access-token | This should be a Github access token with `repo:status` (public repos) or `repo` access (private repos). | console-ui-tests
github-private-key | This should be a private SSH key properly authorized to interact against the GitHub repos your pipeline with operate against. | console-ci-master, console-ui-tests
vcs-clients | This should be a list of VCS clients. | console-ui-tests

### Concourse related commands (examples)

#### Shared Concourse environment for HPE

Login to the shared Concourse environment:
```
fly -t helion-console login -c https://concourse.helion.lol
```

Set a pipeline:
```
fly -t helion-console sp -p console-ci-master -c console-ci-master.yml -l helion-creds.yml
```

Unpause a pipeline:
```
fly -t helion-console up -p console-ci-master
```

Destroy a pipeline:
```
fly -t helion-console dp -p console-ci-master
```
