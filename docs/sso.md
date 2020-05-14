# Single Sign On

By default, Stratos will authenticate against a UAA using username and password, for both logging into Stratos and when connecting Cloud Foundry endpoints.

UAA can support richer login mechanisms than username and password. To accommodate this, you can configure Stratos to use the UAA's Single Sign On UI for login.

This can be enabled by setting the config setting SSO_LOGIN to true.

Most importantly, you will need to ensure that the Client used when communicating with your UAA is configured to allow Stratos to use Single Sign On - i.e. that the Stratos SSO Login callback URI is registered with the UAA.

## Adding the Stratos SSO Callback URI

You'll need the `uaac` CLI to configure your Client to accept the Stratos SSO Callback URI - see [here](https://github.com/cloudfoundry/cf-uaac).

> NOTE: The Stratos SSO Redirect URI that you'll need is:
> `https://HOST.DOMAIN/pp/v1/auth/sso_login_callback`
> where `HOST` and `DOMAIN` depend on your Stratos installation.

Target your UAA

```
uaac target <UAA URL>
```

Login to your UAA with the `admin` client:

```
uaac token client get admin -s <ADMIN_CLIENT_SECRET>
```

Next, check the configuration of your Client - for example, for the `cf` client:

```
uaac client get cf
```

You'll get the current configuration - there are two properties of interest `redirect_uri` and `authorized_grant_types`.

> Note: The following commands will overwrite existing values for the settings specified. To keep the existing values along with the new value include them in the new value as a comma-separated list.

The `redirect_uri` value should contain the Stratos redirect URI. If not update the Client with:

```
uaac client update cf --redirect_uri https://HOST.DOMAIN/pp/v1/auth/sso_login_callback
```

The `authorized_grant_types` value should contain `authorization_code`. If not update the Client with:

```
uaac client update cf --authorized_grant_types authorization_code
```

## Adding a Stratos SSO State Whitelist

When SSO has been configured Stratos's log in request will contain a URL that tells SSO where to return to. When using a browser this is automatically populated. To avoid situations where this can be hijacked or called separately an SSO `state` whitelist can be provided via the environment variable `SSO_WHITELIST`. This is a comma separated list. For example...

```
SSO_WHITELIST=https://your.domain/*
```

```
SSO_WHITELIST=https://your.domain/*,https://your.other.domain/*
```

When set, any requests to log in with a different `state` will be denied.

In order for the SSO `state` to match an entry from the whitelist the schema, hostname, port and path must match exactly. A wildcard `*` can be provided for the path to match anything.