---
title: Backend Plugins
sidebar_label: Backend Plugins
---

This document provides a brief outline for extending the Stratos backend (Jetstream).

Currently, to create an extension to the backend:

1. Create a folder for your plugin, in the folder `src/jetstream/plugins`
1. Edit `src/jetstream/load_plugins.go` and:
   - Add your plugin's package to the `import` block at the top of the file
   - Add your plugin to the list of plugins to be initialized in the `loadPlugins` function, e.g.

   ```
    {"myplugin", myplugin.Init},
   ```

1. Build Jetstream

> Note: There are a few plugins in the `src/jetstream/plugins` folder that should help serve as examples of how to write a plugin.

> Note: Jetstream uses the [Echo web server](https://echo.labstack.com/) from Labstack - some familiarity with this is required when developing backend plugins.
## Plugin Interface

All plugins must implement the interface `interfaces.StratosPlugin` - this is defined in `src/jetstream/repository/interfaces/plugin.go`.

A plugin can implement one or all of the following plugin interfaces - Middleware, Endpoint and Route.

This interface defines 4 functions:

- `Init() error` - This is called to initialize the plugin. If an error is returned then the plugin will not be added to the backend.

- `GetMiddlewarePlugin() (MiddlewarePlugin, error)` - Provides the middleware that this plugin wishes to add to Stratos, if any. Return an error if your plugin does not need to add middleware.

- `GetEndpointPlugin() (EndpointPlugin, error)` - Provides the endpoint that this plugin wishes to add to Stratos, if any. Return an error if your plugin does not need to add middleware.

- `GetRoutePlugin() (RoutePlugin, error)` - Provides the route that this plugin wishes to add to Stratos, if any. Return an error if your plugin does not need to add middleware.

Each of the three plugin interfaces are described below.

### Middleware

The `MiddlewarePlugin` interface provides a plugin with a mechanism to add custom middleware to the Jetstream web server (Echo). This allows it to add upfront processing/filtering/handling of all API requests to the backend. There are two handlers that are required to be provided:

- `EchoMiddleware` - This is added as middleware to the echo web server for all requests that are not guarded by the session gate - i.e. requests that a non-logged-in user can access

- `SessionEchoMiddleware `- This is added as middleware to the echo web server for all requests that are  guarded by the session gate - i.e. requests that only a logged-in user can access

This interface is defined in the file `src/jetstream/repository/interfaces/general.go`:

```golang
type MiddlewarePlugin interface {
	EchoMiddleware(middleware echo.HandlerFunc) echo.HandlerFunc
	SessionEchoMiddleware(middleware echo.HandlerFunc) echo.HandlerFunc
}
```

### Endpoint

The `EndpointPlugin` should be used when a plugin wishes to add a new type of Endpoint. An example of this is the Metrics plugin in the folder `src/jetstream/plugins/metrics`.

This interface is defined in the file `src/jetstream/repository/interfaces/endpoints.go`:

```golang
type EndpointPlugin interface {
	Info(apiEndpoint string, skipSSLValidation bool) (CNSIRecord, interface{}, error)
	GetType() string
	Register(echoContext echo.Context) error
	Connect(echoContext echo.Context, cnsiRecord CNSIRecord, userId string) (*TokenRecord, bool, error)
	UpdateMetadata(info *Info, userGUID string, echoContext echo.Context)
}
```

Adding a new Endpoint type is more involved than other plugin types and will be documented in more detail later.

For now, briefly:

- `GetType` is used to return the endpoint type - a unique ID for the endpoint type - e.g. "metrics"
- `Info` is used to obtain information for the given endpoint URL
- `Register` is called when the user wants to register a new Endpoint of this type
- `Connect` is called when the user wants to connect a new Endpoint of this type
- `UpdateMetadata` is called when the `info` request is made to the backend and gives each endpoint plugin the opportunity to update the metadata returned. For example, in the case of metrics, the plugin will update endpoints to indicate which have metrics metadata available.

### Routes

The `RoutePlugin` interface provides a plugin with a mechanism to add custom handlers to the Jetstream web server (Echo). This allows it to add any custom API processing. There are two handlers that are required to be provided:

- `AddSessionGroupRoutes` - This is added as a handler to the echo web server and is guarded so that only logged-in users can access.

- `AddAdminGroupRoutes `- This is added as a handler to the echo web server and is guarded so that only logged-in users who are Stratos Administrators can access.

This interface is defined in the file `src/jetstream/repository/interfaces/endpoints.go`:

```golang
type RoutePlugin interface {
	AddSessionGroupRoutes(echoContext *echo.Group)
	AddAdminGroupRoutes(echoContext *echo.Group)
}
```

The primary purpose of the RoutePlugin is to add new APIs to Jetstream.

All handlers are added under the `/v1` URL prefix.

