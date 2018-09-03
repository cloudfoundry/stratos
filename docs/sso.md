# Single-Sign On

By default, Stratos will authenticate against a UAA using username and password, for both logging into Stratos and when connecting Cloud Foundry endpoints.

UAA can support richer login mechanisms than username and password. To accommodate this, you can configure Stratos to use the UAA's Single-sing on UI for login.

This can be enabled by setting the config setting SSO_LOGIN to true.

Most importantly, you will need to ensure that the Client used when communicating with your UAA is configured to allow Stratos to use Single-Sign On - i.e. that the Stratos SSO Login callback URI is registered with the UAA.

## Adding the Stratos SSO Callback URI

You'll need the `uaac` CLI to configure your Client to accept the Stratos SSO Callback URI - see [here](https://github.com/cloudfoundry/cf-uaac).

> NOTE: The Stratos SSO Redirect URI that you'll need is:
> `https://HOST.DOMAIN/pp/v1/auth/sso_login_callback`
> where `HOST` and `DOMAIN` depend on your Stratos installation.

Login to your UAA with the `admin` client:

```
uaac client token get admin -s <ADMIN_CLIENT_SECRET> 
```

Next, check the configuration of your Client - for example, for the `cf` client:

```
uaac client get cf
```

You'll get the current configuration - the property of interest is the `redirect_uri`.

If not already configured, update the Client with:

```
uaac client update cf --redirect_uri https://HOST.DOMAIN/pp/v1/auth/sso_login_callback
```

> Note: If you already have values in the `redirect_uri`, you will need to specify these when performing the update,
by placing them as a comma-separated list, as update will over-write the existing value.





