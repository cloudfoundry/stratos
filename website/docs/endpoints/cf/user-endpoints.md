---
title: Configuring User Endpoints
sidebar_label: Configuring User Endpoints
---

Stratos provides a way for users to create endpoints without the need to be an administrator.

> Note: Admin endpoint-ID's are generated through a SHA-1 encryption of the URL. Endpoints created by a user will differ in their ID, by using the URL + user-ID for encryption. This should pose no problem in the usual Stratos workflow, but if you depend on the ID to be based solely on the URL, then use this feature with caution.

## Set up

In order to enable User Endpoints support in Stratos:

1. The environment variable `USER_ENDPOINTS_ENABLED` must be set
2. The UAA client used by Stratos needs an additional scope `stratos.endpointadmin`
3. Users need to have the `stratos.endpointadmin` group attached to them

Once all steps have been completed, user within the `stratos.endpointadmin` group are allowed to create endpoints. Endpoints created by users are only visible to their respective user and all admins.

## Environment variable

`USER_ENDPOINTS_ENABLED` can be set to three different states:

1. `disabled` (default) will disable this feature. Neither admins nor users will see user endpoints.
2. `admin_only` will hide user endpoints from users. Admins can still see all endpoints created by users.
3. `enabled` will allow users within the `stratos.endpointadmin` group to create endpoints. The endpoints will only be visible to them or admins.


## Adding scopes to the UAA client

To add the scope to a client, modify the following [UAA CLI](https://github.com/cloudfoundry/cf-uaac) command:

```
uaac client update CLIENT_NAME --scope "OTHER_SCOPES stratos.endpointadmin"
```

Replace `CLIENT_NAME` with the used client and `OTHER_SCOPES` with the current configured scopes.

To add the group and add users to it, use:

```
uaac group add stratos.endpointadmin
uaac member add stratos.endpointadmin USER_NAME
```
