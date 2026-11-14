---
title: User Endpoints in Detail
sidebar_label: User Endpoints in Detail
---

The rules behind [Configuring User Endpoints](user-endpoints.md): what each
value of `USER_ENDPOINTS_ENABLED` allows, what the feature needs in UAA, how
endpoints at the same address behave, and how to turn it on and off.

## What each setting allows

The setting is read when the console starts, so a change needs a restart.

| | `disabled` (default) | `admin_only` | `enabled` |
|---|---|---|---|
| Who may register endpoints | Admins | Admins | Admins and endpoint admins |
| What an admin registers | System endpoints | System or personal ("Create a system endpoint" checkbox) | System or personal (same checkbox) |
| What an endpoint admin registers | — | — | Personal endpoints only |
| What admins see | System endpoints | All endpoints | All endpoints |
| What other users see | System endpoints | System endpoints (not even their own personal ones) | System endpoints and their own personal ones |
| Who may connect to a personal endpoint | Not checked (see below) | Its creator only | Its creator only; admins cannot |
| Who may edit or unregister a personal endpoint | Admins | Admins | Admins and its creator |
| Who may edit or unregister a system endpoint | Admins | Admins | Admins |

Terms:

- A **system endpoint** is listed for all users. Each user connects to it with
  their own credentials, or an admin shares one connection with everyone.
- A **personal endpoint** belongs to the user who registered it.
- An **endpoint admin** is a user whose token carries the UAA scope
  `stratos.endpointadmin`. The name must match exactly;
  `stratos.endpointadmin_read` and similar scopes do not count.

Turning the feature off does not delete personal endpoints. They stay in the
database and are listed for no one. With the setting `disabled`, Stratos no
longer checks who connects to them: a request that names a personal
endpoint's ID is accepted from any user. The ID is random and is not shown
while the endpoint is hidden, but it is not a secret either. Unregister
personal endpoints that should not stay reachable before turning the feature
off.

## What it needs in UAA

UAA puts the scope `stratos.endpointadmin` in a user's token only when
**both** of these hold:

1. the user is a member of the UAA group `stratos.endpointadmin`, and
2. the OAuth client that users log in to the console through lists
   `stratos.endpointadmin` among its scopes.

This is the UAA the console logs users in with, not the UAA of an endpoint
being registered. Users outside the group get nothing new from the client
change. These are changes to the foundation's UAA, shared with everything
that logs in to it (the cf CLI uses the same `cf` client). A user added to the
group must log in to the console again before the change takes effect.

Find the client the console uses (its `CF_CLIENT` setting, `cf` by default),
then run, with the [UAA CLI](https://github.com/cloudfoundry/cf-uaac):

```
uaac client update CLIENT_NAME --scope "OTHER_SCOPES stratos.endpointadmin"
uaac group add stratos.endpointadmin
uaac member add stratos.endpointadmin USER_NAME
```

Replace `CLIENT_NAME` with that client and `OTHER_SCOPES` with the client's
current scopes. To undo: remove the members, remove the scope from the client,
and delete the group.

## Endpoints at the same address

Any number of endpoints may be registered at one address, and each gets its
own random ID. The Register step says when an address is already in use but
does not block it. Pages that list endpoints show a note when two endpoints of
one type share an address.

Two addresses count as the same when they differ only in:

- the case of the scheme or host (`https://API.example.com` and
  `https://api.example.com`);
- a default port written out (`:443` for `https`, `:80` for `http`);
- repeated or trailing slashes in the path.

A different port, or `http` against `https`, is a different address. Stratos
keeps and uses each address as it was registered; these rules are only for the
comparison.

How endpoints at one address behave:

- **In the endpoint list:** with the feature `enabled`, a user's own endpoint
  replaces the system endpoint of the same type at the same address in that
  user's list. An admin sees both. System endpoints never replace each other.
- **When connecting:** connecting never disconnects another endpoint. With
  the feature `enabled` or `admin_only`, when a user connects and is also
  connected to another endpoint of the same type at the same address, and one
  of the pair is a personal endpoint, a message names the other connections
  and offers **Disconnect others**. Dismissing it keeps them all. Two system
  endpoints at one address are not reported: several accounts on one
  foundation is a supported setup.
- **At login:** when the console auto-registers its Cloud Foundry
  (`AUTO_REG_CF_URL`), it connects each user at login to a system Cloud
  Foundry endpoint at that address. When there are several, it prefers one
  that uses the console's own client (`CF_CLIENT`) and carries the
  auto-register name (`AUTO_REG_CF_NAME`, "Cloud Foundry" by default), then
  any that uses the console's own client, then the first one found.

## Turning it on and off

Cloud Foundry:

```
cf set-env console USER_ENDPOINTS_ENABLED enabled
cf restart console
```

To turn it off: `cf unset-env console USER_ENDPOINTS_ENABLED`, then
`cf restart console`.

Kubernetes (Helm): set `console.userEndpointsEnabled` to `disabled`,
`admin_only` or `enabled` and upgrade the release.

Other deployments: set `USER_ENDPOINTS_ENABLED` in the console's configuration
and restart it.
