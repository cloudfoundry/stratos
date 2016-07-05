# portal-proxy

## Running portal-proxy in a container

### Running "like production"

We've attempted to create a set of helper scripts to aid in running the portal-proxy in a docker-container.  This avoids a lot of the nonsense normally associated with the GOPATH and also means that your build environment is the same as your running environment.

- Run the build

Starting in the top-level directory of the portal-proxy repo, run the build script like so:
```
tools/build_portal_proxy.sh
```
NOTE: Currently, you MUST be in the top level of the directory.  There's some relative/base/absolute path issues that we (and by "we" I mean me, woodnt) haven't worked out yet.  Hopefully that'll all be solved soon.

- Run the server

Starting in the top-level directory of the portal-proxy repo, run the server script:
```
tools/run_portal_proxy.sh
```
See note above about why you must run the code from the top-level directory.

### Running "like a dev"

In order to facilitate a smoother, faster development process, the build script accepts arguments.  If provided these arguments will override the standard "CMD" block for a docker-container.  Here's an example you may find useful:
```
tools/build_portal_proxy.sh bash
... <lots of output here> ...
root@427ed6a1c84b:/go/src/github.com/hpcloud/portal-proxy#

# Or, just build:
root@427ed6a1c84b:/go/src/github.com/hpcloud/portal-proxy# go build
```

### Plans for the future
At some point, we'll try to provide some sort of "watcher-like" dev tools to make this process even easier. For example, the development-server script could restart every time the executable is re-made; or the build could be triggered whenever the source-code changes.


## Getting started

- Set GOPATH to ~/gop
```
export GOPATH=~/gop
```

- Clone project into ~/gop/src
```
mkdir -p ~/gop/src
cd ~/gop/src
git clone git@github.com:hpcloud/portal-proxy.git
```

- Install required package dependencies

We use [Glide](https://glide.sh), [docs](http://glide.readthedocs.io/en/latest/), [GitHub](https://github.com/Masterminds/glide) for dependency management.

Use the installation method appropriate for your development platform.

Once installed, first time use with the proxy project:
```
glide install
```

Updating over time
```
glide update
```

- Set environment variables

The portal proxy is run using a series of environment variables. The best approach for development is to add a .rc file to export all of these. Copy the `development.rc.sample` file to `development.rc` as a start.

- Set up developer certs

The proxy requires certs to run. When running in production or in the dev harness, the cert will come from environment variables, but since docker-compose can't handle multi-line variables in it's env_files, the proxy will first look for pproxy.crt and pproxy.key files in a dev-certs directory.  You can set the CERT and CERT_KEY variables in your .rc file to be random short strings. They won't be used, but must be present for the proxy to run.

- Run

To run the portal-proxy with expected environment variables set:
```
go build && ./portal-proxy
```

- Browse the demo app

Browse to `https://localhost:8080`
- Enter username & password (ask CNAP team member for this for now)

Register a cluster:
- Name: Test
- API Endpoint: `https://api.hcf.helion.lol/`
- Click `Register Cluster`

Send a request to the cluster:
- Click `Send Request`


## Testing

### Unit Testing

Standard Golang unit testing approach and conventions apply.

Consider adopting GoConvey to run your unit tests as you write them:
http://goconvey.co

```
# You may need to install these two libraries
go get gopkg.in/DATA-DOG/go-sqlmock.v1
go get github.com/stretchr/testify

# The actual install and run
go get github.com/smartystreets/goconvey
$GOPATH/bin/goconvey -port 9999
```
