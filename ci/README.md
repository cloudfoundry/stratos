## Running Tests for the Stackato Console

### Overview
Our project uses [Concourse](http://concourseci.com) to run linting and unit tests. The pipeline runs on PR creation and on new commits to the PR.

### Our real pipelines
Our pipelines run in the HPE shared Concourse environment, located at:
`https://concourse.helion.lol`. You should be able to use your GitHub credentials to get in, assuming you have been granted proper access.

### Preparation for pipeline development
Your environment should be prepared to develop and test Concourse pipelines. The best preparation for a newcomer to Concourse is to go thru the [Concourse Tutorial](https://github.com/starkandwayne/concourse-tutorial).

You can always follow the Concourse Tutorial README and use VirtualBox ([local VM with Vagrant](https://concourse.ci/vagrant.html)). Be aware that if you are using Docker, this creates a second VM on your development machine, a non-optimal consideration. An easier solution is to bring Concourse up on your local development machine using Docker. Fortunately, this is super easy:

1. Fork Greg Arcara's [concourse-docker](https://github.com/gregarcara/concourse-docker) repo.

2. Follow the README in the forked repo to stand up Concourse in a series of three Docker containers.

Now you should be able to follow the tutorial.

### Create a secrets.yml file
Create a secrets file, using the `secrets.yml.template`; rename it to `secrets.yml`. The following placeholders should be updated as noted.

#### github-access-token
This should be a Github access token with `repo:status` (public repos) or `repo` access (private repos).

#### github-private-key
This should be a private SSH key properly authorized to interact against the GitHub repos your pipeline with operate against.

#### Shared Concourse environment for HPE

Login to the shared Concourse environment:
```
fly -t helion-console login -c https://concourse.helion.lol
```

Set a pipeline:
```
fly -t helion-console set-pipeline -p console-ui-tests -c console-ui-tests.yml -l secrets.yml
```

Destroy a pipeline:
```
fly -t helion-console destroy-pipeline -p console-ui-tests
```
