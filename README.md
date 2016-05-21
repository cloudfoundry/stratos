# portal-proxy

## Running portal-proxy in a container

### Running "like production"

We've attempted to create a set of helper scripts to aid in running the portal-proxy in a docker-container.  This avoids a lot of the nonsense normally associated with the GOPATH and also means that your build environment is the same as your running environment.

- Run the build

Starting in the top-level directory of the portal-proxy repo, run the build script
```
tools/build_portal_proxy.sh
```
NOTE: Currently, you MUST be in the top level of the directory.  There's some relative/base/absolute path issues that we (and by "we" I mean me, woodnt) haven't worked out yet.  Hopefully that'll all be solved soon.

- Run the server

Starting in the top-level directory of the portal-proxy repo, run the server script
```
tools/run_portal_proxy.sh
```
See note above about why you must run the code from the top-level directory.

### Running "like a dev"

In order to facilitate a smoother, faster development process, the build script accepts arguments.  If provided these arguments will override the standard "CMD" block for a docker-container.  Here's an example you may find useful:
```
tools/build_portal_proxy.sh bash
... <lots of output here> ...
root@427ed6a1c84b:/go/src/portal-proxy#

# Run the following if you need to re-get dependencies
root@427ed6a1c84b:/go/src/portal-proxy# tools/on_container_get_deps.sh

# Or, to just run the build script:
root@427ed6a1c84b:/go/src/portal-proxy# tools/on_container_build.sh
```

### Plans for the future
At some point, we'll try to provide some sort of "watcher-like" dev tools to make this process even easier.
For example, the development-server script could restart every time the executable is re-made; or the build could be triggered whenever the source-code changes.


## The basics

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

- Run

To run the portal-proxy with expected environment variables set:
```
# basic w/no env vars
go build && ./portal-proxy

# non-SSL
go build && ./portal-proxy

# SSL enabled
go build && ./portal-proxy
```

- Browse the demo app

Browse to `https://localhost:8080`
- Enter username (ask CNAP team member for this for now)
- Enter password (ask CNAP team member for this for now)

Register a cluster:
- Name: Test
- API Endpoint: `https://api.hcf.helion.lol/`
- Click `Register Cluster`

Send a request to the cluster:
- Click `Send Request`


## Testing
### Code Coverage

To run the code coverage tool and kick out the results to a file:
```
go test -coverprofile=coverage.out

PASS
coverage: 71.9% of statements
ok  	portal-proxy	0.046s
```

To display the above results in the browser:
```
go tool cover -html=coverage.out
```

To display the above results directly:
```
src/portal-proxy - [master●] » go tool cover -func=coverage.out
...
github.com/hpcloud/portal-proxy/auth.go:24:		loginToUAA			90.9%
github.com/hpcloud/portal-proxy/auth.go:48:		loginToCNSI			100.0%
github.com/hpcloud/portal-proxy/auth.go:80:		login				90.9%
github.com/hpcloud/portal-proxy/auth.go:101:		logout				100.0%
...
total:					(statements)			71.9%
```

Source: https://blog.golang.org/cover
