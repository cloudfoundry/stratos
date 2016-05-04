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

- Create a config file

There is an example config file in the project named `portal-config.toml.example`. Create a file in the project, name it `portal-config.toml`, and add (at minimum) the following to it:
```
skip_tls_verification = true
tls_address           = ":8080"
```

- Source ENV variables for mysql

Touch a new files called `database_password` in the root of your project. Enter the password for the stratos-db into that file. The default for this file is `stratos`.

Then run the `portal-proxy.rc` file to create environment variables that will be used to establilsh a connection to the mysql database.

```
. ./portal-proxy.rc
```

_NOTE: The latest mysql database schema is located in the `stratos-identity-db` project, in case you want to create a local mysql instance to dev/test the proxy against._

- Run

To run the portal-proxy:
```
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

To parse the above output file and display the results:
```
src/portal-proxy - [master●] » go tool cover -func=coverage.out
portal-proxy/auth.go:24:		loginToUAA			90.9%
portal-proxy/auth.go:48:		loginToCNSI			100.0%
portal-proxy/auth.go:80:		login				90.9%
portal-proxy/auth.go:101:		logout				100.0%
portal-proxy/auth.go:114:		getUAATokenWithCreds		100.0%
portal-proxy/auth.go:124:		getUAATokenWithRefreshToken	100.0%
portal-proxy/auth.go:133:		getUAAToken			85.7%
portal-proxy/auth.go:159:		mkTokenRecordKey		100.0%
portal-proxy/auth.go:163:		saveUAAToken			100.0%
portal-proxy/auth.go:175:		saveCNSIToken			100.0%
portal-proxy/auth.go:186:		getUAATokenRecord		0.0%
portal-proxy/auth.go:194:		setUAATokenRecord		100.0%
portal-proxy/cnsi.go:20:		registerHCFCluster		100.0%
portal-proxy/cnsi.go:55:		listRegisteredCNSIs		87.5%
portal-proxy/cnsi.go:72:		getHCFv2Info			88.2%
portal-proxy/cnsi.go:103:		getCNSIRecord			100.0%
portal-proxy/cnsi.go:111:		setCNSIRecord			100.0%
portal-proxy/cnsi.go:117:		getCNSITokenRecord		100.0%
portal-proxy/cnsi.go:126:		setCNSITokenRecord		100.0%
portal-proxy/errors.go:22:		Error				0.0%
portal-proxy/errors.go:26:		newHTTPShadowError		100.0%
portal-proxy/errors.go:33:		Error				75.0%
portal-proxy/errors.go:41:		logHTTPError			100.0%
portal-proxy/jwt.go:15:			getUserTokenInfo		90.0%
portal-proxy/main.go:22:		main				0.0%
portal-proxy/main.go:43:		newPortalProxy			100.0%
portal-proxy/main.go:54:		initializeHTTPClient		100.0%
portal-proxy/main.go:63:		start				0.0%
portal-proxy/main.go:81:		initCookieStore			100.0%
portal-proxy/main.go:85:		registerRoutes			0.0%
portal-proxy/middleware.go:12:		sessionMiddleware		0.0%
portal-proxy/middleware.go:24:		sessionCleanupMiddleware	0.0%
portal-proxy/middleware.go:34:		errorLoggingMiddleware		0.0%
portal-proxy/oauth_requests.go:16:	getCNSIRequestRecords		85.7%
portal-proxy/oauth_requests.go:31:	doOauthFlowRequest		81.0%
portal-proxy/oauth_requests.go:66:	refreshToken			69.2%
portal-proxy/passthrough.go:5:		hcf				0.0%
portal-proxy/passthrough.go:9:		hce				0.0%
portal-proxy/session.go:12:		getSessionValue			0.0%
portal-proxy/session.go:25:		setSessionValues		100.0%
total:					(statements)			71.9%
```

To parse the above output file and allow you to drill into the results:
```
go tool cover -html=coverage.out
```

Source: https://blog.golang.org/cover
