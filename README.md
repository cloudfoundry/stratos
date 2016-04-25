# portal-proxy

## The very basics

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

- Run

To run the portal-proxy:
```
go build && ./portal-proxy
```

I attempted to hit a nonexistent URL and the results looks like this:
```
time=2016-04-20T18:32:14-04:00, remote_ip=::1, method=GET, uri=/hce, status=404, took=91.126µs, sent=9 bytes
```


## Viewing Dependencies

If you'd like to visualize all of the dependencies of the project:
```
brew install graphviz
go get github.com/kisielk/godepgraph

~/gop/bin/godepgraph portal-proxy | dot -Tpng -o portal-proxy.png
ls -la
open portal-proxy.png
```

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
