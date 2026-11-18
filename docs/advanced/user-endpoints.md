---
title: Configuring User Endpoints
sidebar_label: Configuring User Endpoints
---

Normally only a Stratos administrator registers endpoints, and every user
sees the same list. User endpoints let trusted users who are not
administrators register endpoints of their own, such as their own Cloud
Foundry, Kubernetes cluster or Helm repository, without asking an
administrator to add each one. An endpoint a user registers this way is
personal: it is listed only for that user and for administrators.

The feature first shipped in Stratos 4.4.1. It is off by default, and the
setting `USER_ENDPOINTS_ENABLED` turns it on. The setting changes who may
register, see, connect to, edit and unregister endpoints for **every** user
of the console, not only the users who will register their own.
[User Endpoints in Detail](user-endpoints-details.md) lists every rule.

## Who may register their own endpoints

Stratos decides who may register endpoints from the token of the
**UAA that users log in to Stratos with**. A user whose token carries the
scope `stratos.endpointadmin` is an *endpoint admin* and may register
personal endpoints. Setting this up is a change to that UAA (a group and a
client scope), not a setting inside Stratos.

This has two consequences:

- A console without a UAA login cannot have endpoint admins. With a local
  login (the Helm chart's `console.localAdminPassword`), the only user is
  the administrator, so the feature adds nothing.
- The endpoints themselves do not need a UAA. The scope comes from the
  console's login, so an endpoint admin may register a Kubernetes cluster
  or a Helm repository as well as a Cloud Foundry.

## The three settings

- `disabled` (the default): only administrators register endpoints, and
  everyone sees the same list.
- `enabled`: endpoint admins register personal endpoints. Administrators
  choose, for each endpoint they register, whether it is a system endpoint
  (listed for everyone) or a personal one.
- `admin_only`: for winding the feature down. Users no longer register
  endpoints and no longer see their personal ones, but administrators still
  see every endpoint, so they can review and unregister them before the
  feature is turned off.

Turning the feature off does not delete personal endpoints. They stay in the
database, hidden from everyone.

## Several endpoints at one address

Earlier versions of Stratos refused a second endpoint at an address that was
already registered, apart from one personal endpoint beside a system one.
The reason was the endpoint ID: it was derived from the address, so a link
into the console that carries the ID always led to the same endpoint.

Endpoint IDs are now random, and any number of endpoints may share an
address. This is needed when:

- an operator connects as a user's account to look into that user's problem,
  without touching the user's own connection;
- several Cloud Foundry environments differ only by port (a different port is
  a different address);
- someone debugging Stratos keeps one connection for each of several admin
  accounts.

Connecting to one endpoint never disconnects another. When a pair at the same
address includes a personal endpoint, Stratos says so after the connect and
offers to disconnect the others.

## When to use it

Use it when trusted users need their own endpoints, the endpoints should stay
private to them, and you can change the UAA that users log in to Stratos with.

Do not turn it on just for a test on a shared console: while it is on, its
rules apply to every user.

See [User Endpoints in Detail](user-endpoints-details.md) for the full rules,
the UAA commands, and how to turn the feature on and off.
