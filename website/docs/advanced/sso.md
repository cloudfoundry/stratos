---
title: Configuring Single Sign On
sidebar_label: Configuring Single Sign On 
---

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

## Adding a Stratos SSO State Allow-list

When SSO has been configured Stratos's log in request will contain a URL that tells SSO where to return to. When using a browser this is automatically populated. To avoid situations where this can be hijacked or called separately an SSO `state` allow-list can be provided via the environment variable `SSO_ALLOWLIST`. This is a comma separated list. For example...

```
SSO_ALLOWLIST=https://your.domain/*
```

```
SSO_ALLOWLIST=https://your.domain/*,https://your.other.domain/*
```

When set, any requests to log in with a different `state` will be denied.

In order for the SSO `state` to match an entry from the allow-list the schema, hostname, port and path must match exactly. A wildcard `*` can be provided for the path to match anything.


## Advanced Configuration

Further configuration of SSO is provided through the `SSO_OPTIONS` environment variable.

Setting this variable to `nosplash` will skip the need for users to press the Login button - users will jump straight to the configured SSO endpoint when accessing Stratos instead of first seeing the Stratos login page.

### Using a dedicated UAA Client for Stratos

In production environments, it's wise to setup a dedicated UAA client for
Stratos SSO, instead of re-using the `cf` client, that already represents by
the `cf` CLI.

In this case, you can duplicate the `cf` client definition and create a
`stratos-console` client, for example. In typical UAA deployment manifest with
BOSH, you would typically add the following configuration properties to the
`uaa` job, in the `uaa` instance group.

```yaml
uaa:
  clients:
    stratos-console:
      authorized-grant-types: authorization_code
      redirect-uri: https://console.((system_domain))/pp/v1/auth/sso_login_callback
      autoapprove: true # Bypass users approval
      # The following properties are copied from those of the default 'cf' client:
      access-token-validity: 600
      authorities: uaa.none
      override: true
      refresh-token-validity: 2592000
      scope: network.admin,network.write,cloud_controller.read,cloud_controller.write,openid,password.write,cloud_controller.admin,scim.read,scim.write,doppler.firehose,uaa.user,routing.router_groups.read,routing.router_groups.write,cloud_controller.admin_read_only,cloud_controller.global_auditor,perm.admin,clients.read
      secret: ""
```

### Listing the Stratos console as a registered application in UAA users home page

With the above UAA client set though, the Stratos Console would still not be
displayed as a registered SSO application in UAA users home page. (This home
page is typically hosted at `https://login.{SYSTEM_DOMAIN}/home`.)

In order to properly list the Stratos Console there, the `show-on-homepage`
property has to be set to `true` and the `app-launch-url` property has to be
perperly provided, with some non-`null` URL.

The example below shows the whole setup, with a simplified PNG image as the
`app-icon` though, to keep is concise.

```
uaa:
  clients:
    stratos-console:
      name: Stratos Console
      show-on-homepage: true
      app-launch-url: https://console.((system_domain))
      app-icon: iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAMAAAAoLQ9TAAAAD1BMVEWZttQvMDEoKisqKywAAAApvvoVAAAAGElEQVQYlWNgYUQBLAxMDCiAeXgLoHsfAD03AHOyfqy1AAAAAElFTkSuQmCC
```

If you need an `app-icon` that properly displays the Stratos logo though, here
is one you could use. This is the Stratos logo, reduced to 68x68 because
that's the size the UAA users home page will display it. This is still 4.91 KB
of PNG data though, as it is Base64-encoded.

```
uaa:
  clients:
    stratos-console:
      app-icon: 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
```

## Troubleshooting

1. User has selected the incorrect application authorities when logging in to Stratos via SSO for the first time.
   - The user can update their permissions and other account settings via https://login.< uaa address >/profile
2. Administrator wants to remove the application authorities selection users see when logging in to Stratos via SSO for the first time
   - This is carried out at the Admins discretion
   - Using the `uaac` cli update the 'autoapprove' property of the client used by Stratos to either `true` for all authorities or a comma separated list for the authorities to be removed.

     ```
     uaac client update <console client> --autoapprove true
     ```
3. User sees the error message `No scopes were granted` when trying to log in to Stratos via SSO
   - User may not have selected any of the application authorities when logging in to Stratos via SSO for the first time
   - Either of the resolutions to 1 and 2 can be made
