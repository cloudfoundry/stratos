# V2 emulation

## Introduction

The Angular frontend is based on the CF v2 API and the models and views use the v2 objects directly.  To update to the v3 API will be a large rewrite process.

To help with the upgrade to v3 we will be adding an emulation workflow to the Jetstream backend (which is a middleware between the Frontend and the CF API).  By detecting and emulating the v2 calls we can start supporting v3 calls and prepare for the removal of v2.

## Theory of operation

The Frontend will create v2 api calls and pass them to CF via the Jetstream `echo/v4` proxy.  In the proxy code, Jetstream can set additional header before calling CF.  In the Proxy command, we can detect if this is a v2 url and for a Cloud Foundry and call the emulator instead.  The emulator can generate a v3 version of the API call, call the new call with the proxy, and use the results to craft the v2 reponse, and returning that directly to the Frontend.

For many `v2`/`v3` API calls the GUIDs are identical and the JSON layout the the URL's are different.  In cases where the emulation is difficult, we can instead implement the function as a `jetstream/` call that only changes the minimal number of fields to support the v3 information.

For running on a Cloud Foundry with the v2 API disabled or removed, we can use a mix of v3 rewrites in the frontend, v2 emulation in the backend, and replacement `jetstream/` calls across both, to continue to work.

## Configuration

### Environmental Variables


`DISABLE_CF_V2_EMULATION=true` Disable the emulation process and send the v2 requests directly.  This does not disable `jetstream/` API calls

While building, this will default to `true`.  When the v3 coverage is sufficent to run with the v2 API disabled, the default will be switched to `false`.

### Headers

`x-skip-cf-v2-emulation` This can be set for two reasons:
1. The Frontend is calling a v2 API that would still be available when v2 is removed such as `v2/info`
2. The emulation code does not yet support this call, it can set this value to call the proxy with the original url

