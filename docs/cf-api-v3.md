# Cloud Foundry API v3

See [Cloud Foundry API v2 Feature Usage](cf-api-v2-usage.md) for v2 information

1. [Comparing v2 features to v3](#Comparing-v2-features-to-v3)
1. [V3 Availability](#V3-Availability)
1. [Stratos Adoption of v3](#Stratos-Adoption-of-v3)

## Comparing v2 features to v3

### V3 Docs
- http://v3-apidocs.cloudfoundry.org/
- https://github.com/cloudfoundry/cc-api-v3-style-guide

### Entity Relations... `include-relations` --> `include`
Previously...
- When fetching an entity, any referenced child entity or list of entities were omitted. To have them included the property name was
  provided in an `include-relations` parameter. The covered direct child entities and children of that child entity
- Lists of entities that were bigger than 50 were simply omitted.

Now, from my understanding, ...
- Child entities (single or lists) are referenced by guid in the parent's `relationships` section
  - Pagination of lists is only proposed - https://github.com/cloudfoundry/cc-api-v3-style-guide#proposal-pagination-of-related-resources
- Child entities are also listed, with a url to fetch (like the old `<property>_url` property), in the `links` section.
- An `include` parameter can be supplied which will add an `included` section to the entity
- An entity in the `included` section is in the same format as the parent
- `include` has very limited implementation
  - `/apps` only supports `space` include
  - `/organization` doesn't support any includes
  - `/space` doesn't support any includes
  - (see [Cloud Foundry API v2 Feature Usage - Inline-Relations](cf-api-v2-usage.md#Inline-Relations) for required)
~- Unclear if `include` will cover chained entities aka `inline-relations-depth` from v2~

### Collections - Pagination
- This is covered just fine (fetch a specific page, total page count, total result count, etc)

### Collections - Sorting
- It looks like all entities can be sorted via `created_at` and `updated_at` dates, plus some also have `name`. Given that v2 really only
  supported sorting by `created_at` date this should be fine for feature parity
- However in order for Stratos to leave behind local sorting there are many missing sort fields (see [Cloud Foundry API v2 Feature Usage - Sorting/Filtering](cf-api-v2-usage.md#sortingfiltering))

### Collections - Filtering
- Similar level of filtering is available with the addition of `name`
- In order for Stratos to leave behind local filtering there are still some fields that need to be implemented (see [Cloud Foundry API v2 Feature Usage - Sorting/Filtering](cf-api-v2-usage.md#sortingfiltering))

### Entity Validation
- For v2 info see [Cloud Foundry API v2 Feature Usage - Entity Relations & Validation](cf-api-v2-usage.md#entity-relations--validation)
- It looks like, given that `include` is considerable beefed up, this will still be possible in v3. An update of the entity relations
  process will be required though.

### Application State
- For v2 info see [Cloud Foundry API v2 Feature Usage - Application State](cf-api-v2-usage.md#Application-State)
- The improved application state string that stratos shows will be much harder to determine
  - App `package_state` is from a separate entity that is not `linked` and requires an additional request
  - App `package_updated_at` is from a separate entity that is not `linked` and requires an additional request
  - App instance state should now come form `/processes` and given that instance:process are now not 1:1 harder to summaries state from

## V3 Availability
- Stratos needs to support cloud foundry's with different api versions from many different providers and epochs
- Update, many common CFs we use support some kind of v3 version.
> Note - cf-dev I haven't tested as it's unsupported on linux - see https://github.com/cloudfoundry-incubator/cfdev/issues/18 (major regression from PCFDev there)
- ~~Currently, it looks like neither SCF (2.84.0), IBM Cloud (2.106.0) or PCFDev (2.82.0) support v3 with `includes`. PWS (2.125.0) and
 SAP (2.120.0) however do.~~
> Note - ~~Couldn't find an easy way to determine the version of v3~~

## Stratos Adoption of v3

Given that...
- Endpoints are being converted to v3 iteratively, not all are available at the moment
- Stratos will need to support v2 for a while to come (legacy installs, etc)

Then Stratos should either ..
- Wait until v3 has feature parity with v2, create new Stratos that uses v3 and mothball versions of Stratos that talk to v2
- Support both versions at runtime, switching each endpoint from v2 to v3 at determined cut off dates

### Blocking Issues
- Coverage of `include` is not on par with v2 `include-relations`
  - To meet parity it should support all entities in `relationships` and `links`, whether one to one or one to many
  - Currently not supported on all endpoints and does not cover enough `relationships`/`links` (see [Cloud Foundry API v2 Feature Usage - Inline-Relations](cf-api-v2-usage.md#Inline-Relations))
  - For instance new v3 entities are not `include`s (`/apps` - `package`, `processes`, `route_mappings`, `environment_variables`, `droplets`, `tasks`)
  - ~~Not supported by common CFs used to develop with (SCF, PCFDev)~~.
- Entities do not contain all properties that were in v2 (where functionality has not changed)
  - Covers simple values and entities (one to one and one to many)
  - For instance `/organizations` and `/spaces` endpoints are not completed and contain only guid, create/updated date and name (space additionally has experimental `organization`)  
- Entities returned by v2/v3 endpoints are not consistent
  - For example
    - push an app with `v3-push` and it shows up in `v2/apps`
    - `v3/service_bindings` does not return service bindings that aren't attached to a v3 app
  - Without knowing exactly all these occurrences we won't be able to work in a mixed v2/v3 endpoint state
- ~~Cannot determine if a CF supports v3 or when it does support v3 which endpoints it has~~
  - v3 version and supported endpoints can be determined by response to `<cf api url>` and `<cf api url>/v3`
  - ~~Getting the v2 version is simple, I don't know if there's correlation to v3 version~~
  - ~~Having a v3/info which published which endpoints are supported would help a lot. Including whether `include` is supported~~
- ~~Chained `links`/relations don't appear to be supported (fetch app-->space-->org all in one request)~~
  - It looks like this is achievable by notation, for example `/v3/apps?include=space,space.organization`
  - See https://github.com/cloudfoundry/cc-api-v3-style-guide#including-related-resources
  - ~~Might be wrong on this one due to the lack of current `include` integration~~

### Frustrating Issues
- Fetching a list of users as a non-cf admin involves making a request to every organisation (`organization/${guid}/users`). The response
  of all of these calls contains a lot of overlapping data
  - Ideally making a request to `/users` as a user with 0:M org roles would return a list of users in those organisations
  - Have asked this question in the V3 Users proposal - https://docs.google.com/document/d/1EA65UN3Xsi0EuX-3YfbFNqtJGseFr6FGBt2SR9c4Aqk/edit#heading=h.tyy5zdgqnnt0
- Not all v2 endpoints exist in v3, for instance no `domains`, `events`, `route`, org/space quota definitions, etc
  - This would make our entity validation much more complex
- Cannot utilise v3 pagination due to limited sorting and filtering functionality (see [Cloud Foundry API v2 Feature Usage - Sorting/Filtering](cf-api-v2-usage.md#sortingFiltering) for missing fields)
  - This is currently on par with v2, but causes us a lot of headaches for large data sets
- The Stratos method of calculating application state has become much harder
  - Additional requests to app `/packages` are required. This would be resolved if applications were `link`ed to package
  - Would love a flag in `/apps` to also return the `processes` data. This would mean a longer request time, but we're making that request
    in the frontend anyway.
- No easy way to fetch organisation or space summary information
  - Stratos show summary information such as number of users (see [Cloud Foundry API v2 Feature Usage V2 Specifics - Cloud Foundry, Organisation and Space Summary Information](cf-api-v2-usage.md#cloud-foundry-organisation-and-space-summary-information) for specific stats)
  - In an ideal world we could hit one endpoint that would give us the counts for all of these details. Filters could then limit this to
    an organisation or space

### Stratos Tasks
- Depending on adoption approach, Stratos needs to support v2 and v3 endpoints concurrently
  - Mask the input/output to v3 requests, such that store, pagination, list configuration and entity validation remains mostly unchanged
  - To do this ...
    - Query params need to be converted when making v3 requests
    - v3 responses need to be converted into v2 format (entity/metadata, `<x>_url`, etc).
- Update application deploy/lifecycle process to match new v3 process (https://github.com/cloudfoundry-incubator/stratos/issues/3150)
- Support new 'processes' concept (https://github.com/cloudfoundry-incubator/stratos/issues/3154), including updating how
  we determine application state
- Fully investigate non `get` methods (create an application, delete a space, etc)
- Related Issues
  - https://github.com/cloudfoundry-incubator/stratos/issues/2922
  - https://github.com/cloudfoundry-incubator/stratos/issues/3149 (Container issue for related v3 api process changes)

### Questions
- ~~Will `include` cover children of children? For instance `app` --> `route` --> `domain`~~
  - ~~How will lists be covered? For instance `organization` --> `space` --> `service instances`~~
- How will the deprecation of v2 endpoints happen?
  - One by one?
  - All together once v2 parity is reached?
- Will duplicated `include`ed entities only appear once in a top level (entity or pagination) `included`? For example..conceptually..
  - Fetch an application, the application's space, the application's routes and application routes spaces all in a single request
  - If the application's space appeared in the route's space, would it only appear once in the application's`included` section... or appear twice (once
    in application `included` and again in route `included`)?
- The style guide references a way to fetch one to many relationships as `/v3/apps/:app_guid/relationships/routes` (https://github.com/cloudfoundry/cc-api-v3-style-guide#viewing-1)
  - This doesn't seem to work (404), is it yet to be implemented?
  - `/v3/apps/:app_guid/routes` also does not work (404)
  - `/v3/apps/:app_guid/route_mappings` works, but there doesn't seem to be a way to `include` the `route` such that it appears in the response
- Which version is the `include=space,space.organization` notation supported in?

## v3 Required `include`s, `order_by`, filters, missing properties

### `/apps`
Type | Name | Notes
--- | --- | ---
`include` | `space` |
`include` | Organization via `space.organization` |
`include` | `packages` | Required to determine app state (state, updated_at)
`include` | `processes` | Required to determine app state (instances)
`include` | `processes.stats` | Required to determine app state (state).
`include` | `current_droplet` | Required to determine app state (state).
`include` | `packages.builds` | v3 currently has no link or relation. Required to determine app state (state).
`order_by` | sum of `processes` `instances` count | [See below for notes](#v3-Required-Features)
`order_by` | sum of `processes` `disk_in_mb` count | [See below for notes](#v3-Required-Features)
`order_by` | sum of `processes` `memory_in_mb` count | [See below for notes](#v3-Required-Features)
filter | `processes` state |
filter | organization name | Allows free text search, rather than manual selection of cf and then org
filter | space name | Allows free text search, rather than manual selection of cf, org and then space

### `/app/${guid}`
Type | Name | Notes
--- | --- | ---
`include` | `route_mappings`
`include` | Route via `route_mappings.route` | `/route` has no v3 equivalent
`include` | Route via `route_mappings.route.domain` | `/domain` has no v3 equivalent
links | `service_bindings`
`include` | `service_bindings`
~~`include`~~ | ~~`space`~~
`include` | `space.organization`
`include` | `packages` | Required to determine app state (state, updated_at).
`include` | `processes` | Required to determine app state (instances)
`include` | `processes.stats` | Required to determine app state (state).
`include` | `current_droplet` | Required to determine app state (state).
`include` | `packages.builds` | v3 currently has no link or relation. Required to determine app state (state).
links | `features` | Required to fetch app ssh and revision info
`include` | `features` | v3 currently has no link or relation to features. Required to fetch app ssh and revision info
`include` | `droplets` | Note used at the moment, but it's easy to think that we'll want this info along with the app
`include` | `tasks` | Note used at the moment, but it's easy to think that we'll want this info along with the app
property | stack guid/whole entity | Stack name is included inline in an inlined `lifecycle` object. This placement seems like an odd pattern. It's not an entity on it's own with it's own endpoint... but does contain an inline entity (stack). The inlined stack contains only a name and not guid/rest of stack entity.
property | buildpack guid/whole entity | As per stack guid above
property | `enable_ssh` | .. or similar property to determine if ssh'ing to an instance is allowed at the app level

### `/apps/{guid}/packages`
Type | Name | Notes
--- | --- | ---
`include` | `app`
links | `builds`
`include` | `builds`

### `/apps/{guid}/processes`
Type | Name | Notes
--- | --- | ---
`include` | `stats` |
`order_by` | `state` |
`order_by` | `stats` `usage.time` | [See below for notes](#v3-Required-Features)
`order_by` | `stats` `usage.cpu` | [See below for notes](#v3-Required-Features)
`order_by` | `stats` `usage.mem` | [See below for notes](#v3-Required-Features)
`order_by` | `stats` `usage.disk` | [See below for notes](#v3-Required-Features)
filter | `state`

### `/service_bindings` (functionality for /apps/{guid}/service_bindings only)
Type | Name | Notes
--- | --- | ---
links | `service_instance`
`include` | `service_instance`
links | `service_instance.service`
`include` | `service_instance.service`
links | `service_instance.service_plan`
`include` | `service_instance.service_plan`
links | `service_instance.tags`
`include` | `service_instance.tags`
`order_by` | service instance name
`order_by` | service name
`order_by` | service plan name
filter | service instance name
filter | service name
filter | service plan name

### `/spaces`
Type | Name | Notes
--- | --- | ---
`order_by` | `created_at`
`order_by` | `name`
filter | name
links | `service_instances`
`include` | `service_instances`
links | `space_quota_definition`
`include` | `space_quota_definition`
~`include`~ | ~`applications`~ | Previous requirement pre-scaling change

### `/spaces/${guid}`
Type | Name | Notes
--- | --- | ---
links | `organization`
`include` | `organization`
links | `domains` | `/domains` has no v3 equivalent
`include` | `domains` | `/domains` has no v3 equivalent
links | `routes` | `/routes` has no v3 equivalent
`include` | `routes` | `/routes` has no v3 equivalent
links | `routes.domain` | `/routes` has no v3 equivalent
`include` | `routes.domain` | `/routes` has no v3 equivalent
links | `routes.applications` | `/routes` has no v3 equivalent. We expect these relations to be 1-to-not-many
`include` | `routes.applications` | `/routes` has no v3 equivalent. We expect these relations to be 1-to-not-many
~`include`~ | ~`applications`~ | | Previous requirement pre-scaling change
links | `service_instances`
`include` | `service_instances` |
links | `service_instances.service_bindings` |
`include` | `service_instances.service_bindings`
links | space quota | | space quota has no v3 equivalent
`include` | space quota | | space quota has no v3 equivalent
property | allow_ssh | | .. or similar property to determine if ssh'ing to an instance is allowed at the space level
links | `space.developers` | | we might be able to fetch this via new users endpoints described in https://docs.google.com/document/d/1EA65UN3Xsi0EuX-3YfbFNqtJGseFr6FGBt2SR9c4Aqk/edit#heading=h.n1xhc33y2wyj
`include` | `space.developers` | | we might be able to fetch this via new users endpoints described in https://docs.google.com/document/d/1EA65UN3Xsi0EuX-3YfbFNqtJGseFr6FGBt2SR9c4Aqk/edit#heading=h.n1xhc33y2wyj
links | `space.managers` | | we might be able to fetch this via new users endpoints described in https://docs.google.com/document/d/1EA65UN3Xsi0EuX-3YfbFNqtJGseFr6FGBt2SR9c4Aqk/edit#heading=h.n1xhc33y2wyj
`include` | `space.managers` | | we might be able to fetch this via new users endpoints described in https://docs.google.com/document/d/1EA65UN3Xsi0EuX-3YfbFNqtJGseFr6FGBt2SR9c4Aqk/edit#heading=h.n1xhc33y2wyj
links | `space.auditors` | | we might be able to fetch this via new users endpoints described in https://docs.google.com/document/d/1EA65UN3Xsi0EuX-3YfbFNqtJGseFr6FGBt2SR9c4Aqk/edit#heading=h.n1xhc33y2wyj
`include` | `space.auditors` | | we might be able to fetch this via new users endpoints described in https://docs.google.com/document/d/1EA65UN3Xsi0EuX-3YfbFNqtJGseFr6FGBt2SR9c4Aqk/edit#heading=h.n1xhc33y2wyj


### `/spaces/${guid}/routes` (no `/routes` endpoint)


### `/service_instances` (functionality for /spaces/{guid}/service_instances only)
Type | Name | Notes
--- | --- | --- | ---
`order_by` | `username`
filter | space guid
link | service bindings
`include` | service bindings
link | `service_instance.applications`
`include` | `service_instance.applications`
link | `service_plan`
`include` | `service_plan` | `/service_plan` has no v3 equivalent
link | `service`
`include` | `service` | `/service` has no v3 equivalent


## v3 Required Features

### Single 'included` section per quest
There should hopefully be a single `included` section even if `included` elements have their own `include`s. Not quite a requirement, but a real nice to have.

### `include`d lists
Ability to set `include` for lists of entities. See https://github.com/cloudfoundry/cc-api-v3-style-guide#proposal-pagination-of-related-resources

Use case - Routes, packages, builds, process stats, etc in an application

### `order_by` values in `include`d
Ability to use properties of entities that are from the `included` section in `order_by`.

Covers simple case of sorting by a property in a 1:1 `include` and also summation of numerical properties in 1:M relationship.

Use case - sort applications by instance count. Requires `process` as an `include` and ability to sort applications by sum of `process`s `instance` values

Use case - as above, but instead of instances the sum of memory in a `processes` `memory_in_mb`. Need to consider whether `processes` state value should be taken into account (only include processes that are running)

Use case - as above, but the sum of `processes` `stats` `usage.mem`.

### filter values in `include`d
As per `order_by`, delve into an `included` entity and filter out given a specific path.

Use case - Filter a list of service bindings by service instance name, service name or service plan name

Use case - Filter a list of apps by organization or space
