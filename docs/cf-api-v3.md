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
- Update application deploy/lifecycle process to match new v3 process (https://github.com/cloudfoundry/stratos/issues/3150)
- Support new 'processes' concept (https://github.com/cloudfoundry/stratos/issues/3154), including updating how
  we determine application state
- Fully investigate non `get` methods (create an application, delete a space, etc)
- Related Issues
  - https://github.com/cloudfoundry/stratos/issues/2922
  - https://github.com/cloudfoundry/stratos/issues/3149 (Container issue for related v3 api process changes)

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

A few UX examples have been provided, however it's quite hard to list all requirements without a deep dive into the code. Most requirements
for existing endpoints come from the need to either ..

- Fetch properties, properties of properties, etc inline instead of making additional request. For the application wall's application list
this can be the difference between making 21 calls and then a subsequent 18 calls.. rather than receive everything with the apps request.
- Switch from a local list (sorting and filtering done locally due to lack of support in v2) to a non-local list (pagination, sorting and
filtering done via v3 api)

### `/apps`
Type | Name | Priority | UX Example | Notes
--- | --- | --- | --- | ---
~~`include`~~ | ~~`space`~~  |  | |
`include` | Organization via `space.organization` | [HIGH] | Used in application wall's application list to filter local lists by org, show org name on app wall app entries, upfront fetch leading to quicker navigation to app summary | See ([non-local lists](cf-api-v2-usage.md#Lists) for more detail on local and non-local lists).
`include` | `packages` | [HIGH] | See [1] | Required to determine application state (state, updated_at)
`include` | `processes` | [HIGH] | See [1] | Required to determine application state (instances)
`include` | Stats via `processes.stats` | [HIGH] | See [1] | Required to determine application state (state).
`include` | `current_droplet` | [HIGH] | See [1] | Required to determine application state (state).
`include` | Builds via `packages.builds` | [HIGH] | See [1] | v3 currently has no link or relation. Required to determine application state (state).
`order_by` | sum of `processes` `instances` count [See below for notes](#v3-Required-Features) | [MEDIUM] | See [2] |
`order_by` | sum of `processes` `disk_in_mb` count [See below for notes](#v3-Required-Features) | [MEDIUM]  | See [2] |
`order_by` | sum of `processes` `memory_in_mb` count [See below for notes](#v3-Required-Features) | [MEDIUM]  | See [2] |
filter | `processes` state | [MEDIUM] | User wishes to find all apps that have errored processes
filter | organization name | [MEDIUM] | See [3] |
filter | space name | [MEDIUM] | See [3] |

[1] Property/s used to determine application state without spamming requests ([app state](#Application-State)). On the application wall
page we determine the state of up to 9 apps at a time. Returning this information in a single request, or during the initial request, will
save apps x missing property's endpoints (packages, process, process stats, current_droplet, etc). This could lead to 21 concurrent calls
followed by another 18 (given the results of the first run).

[2] Enables sorting by instance count in tables. See ([non-local lists](cf-api-v2-usage.md#Lists) for more information on local and non-local list sorting).

[3] Allows free text search by org or space name in application wall (rather than manual selection of cf, org and then space). For instance a user types part of an org name in a
special org drop down and is presented with list of apps in matching orgs. This is a short cut for the user having to scroll down a list in a
drop down.

### `/app/${guid}`
Type | Name | Priority | UX Example | Notes
--- | --- | --- | --- | ---
`include` | `route_mappings` | [HIGH] | See [1] | See [2]
`include` | Route via `route_mappings.route` | [HIGH] | See [1] | See [2]. `/route` has no v3 equivalent
`include` | Domain via `route_mappings.route.domain` | [HIGH] | See [1] | See [2]. `/domain` has no v3 equivalent. Required to display complete route url. From Greg `We are thinking about adding a fqdn on the routes object, which may be another way to achieve the same objective.`
links | `service_bindings` | [HIGH] | See [3] | See [2]
`include` | `service_bindings` | [HIGH] | See [3] | See [2]
~~`include`~~ | ~~`space`~~
`include` | `space.organization` | [HIGH] | Display the name of the organisation | See [2]
`include` | `packages` | [HIGH] | See [4] | See [2]. Required to determine application state (state, updated_at)
`include` | `processes` | [HIGH] | See [4] | See [2]. Required to determine app state (instances)
`include` | `processes.stats` | [HIGH] | See [4] | See [2]. Required to determine app state (state).
`include` | `current_droplet` | [HIGH] | See [4] | See [2]. Required to determine app state (state).
`include` | `packages.builds` | [HIGH] | See [4] | See [2]. v3 currently has no link or relation. Required to determine app state (state).
links | `features` | [MEDIUM] | Display current app settings (ssh enabled and revisions enabled). | See [2]. There's a top level ssh enabled flag, however this will show if at the app level ssh is enabled
`include` | `features` | [MEDIUM] | See above | See above
`include` | `droplets` | [MEDIUM] | We don't currently use this, however displaying these in a list to the user would be beneficial. | See [2]
`include` | `tasks` |  [MEDIUM] | We don't currently use this, however displaying these in a list to the user would be beneficial. | See [2]
~~property~~ | ~~stack guid/whole entity~~ | | | Stack name is included inline in an inlined `lifecycle` object. This placement seems like an odd pattern. It's not an entity on it's own with it's own endpoint... but does contain an inline entity (stack). The inlined stack contains only a name and not guid/rest of stack entity. From Greg `Stack is referenced by name rather than guid due to some windows usage patterns. The window's stacks are not associated with a rootfs like the linux ones are, so they can add new stacks without having to update the stacks of all windows apps.`.
~~property~~ | ~~buildpack guid/whole entity~~ | | | As per stack guid above. From Greg `Similarly with buildpacks, having associations by name rather than guid allows for upgrades across stack versions (for example the recent upgrade from cflinuxfs2 -> cflinuxfs3) without having to re-associated apps with the new stack's version of the buildpack.`
~~property~~ | ~~`enable_ssh`~~  | | | ~~.. or similar property to determine if ssh'ing to an instance is allowed at the app level~~. See `/v3/apps/:guid/ssh_enabled`

[1] Display bound route count & list of routes

[2] Display information quicker on the Application pages without having to make additional requests (either once for a single entity or
multiple times in the case of 1:M, for example `route_mappings` would require multiple requests to `routes` to fetch each one)

[3] Display bound service instance count & list of services, determine if a service is already bound when user is binding existing service to app, etc

[4] Property/s used to determine application state without spamming endpoints ([app state](#Application-State)).


### `/apps/{guid}/packages`
Type | Name | Priority | UX Example | Notes
--- | --- | --- | --- | ---
links | `builds` | [HIGH] | See explanation in `/app/${guid}` - `packages.builds` | See [1]
`include` | `builds` | [HIGH] | See above | See above
`include` | `app` | [LOW] | This might come in handy in the future, more specifically if we list all `packages` |

[1] If at some point we've fetched an app without this property we will make a separate request to fetch it, so the same includes/links are required

### `/apps/{guid}/processes`
Type | Name | Priority | UX Example | Notes
--- | --- | --- | --- | ---
`include` | `stats` | [HIGH] | See explanation in `/app/${guid}` - `processes.stats` | See [1]
`order_by` | `state` | [MEDIUM] | In the app summary page instances tab we show a list of instances and their properties. This needs updating, but it's easy to imagine that we will display a list of processes in v3 | See [2]
`order_by` | `stats` `usage.time` | [MEDIUM] | See above | See [2] [See below for notes](#v3-Required-Features)
`order_by` | `stats` `usage.cpu` | [MEDIUM] | See above | See [2] [See below for notes](#v3-Required-Features)
`order_by` | `stats` `usage.mem` | [MEDIUM] | See above | See [2] [See below for notes](#v3-Required-Features)
`order_by` | `stats` `usage.disk` | [MEDIUM] | See above | See [2] [See below for notes](#v3-Required-Features)
filter | `state` | [MEDIUM] | See above |

[1] If at some point we've fetched an app without this property we will make a separate request to fetch it, so the same includes/links are required

[2] This will be required in order to switch from local (fetch allll entities in a list and sort locally) to non-local (use CF api pagination including sorting). See ([non-local lists](cf-api-v2-usage.md#Lists) for more detail on local and non-local lists.

### `/service_bindings` (functionality for missing /apps/{guid}/service_bindings only)

Type | Name | Priority | UX Example | Notes
--- | --- | --- | --- | ---
links | `service_instance` | [HIGH] | See [1] | See [2]
`include` | `service_instance` | [HIGH] | See above | See above
links | `service_instance.service` | [HIGH] | See above | See above
`include` | `service_instance.service` | [HIGH] | See above | See above
links | `service_instance.service_plan` | [HIGH] | See above | See above
`include` | `service_instance.service_plan` | [HIGH] | See above | See above
links | `service_instance.tags` | [HIGH] | See above | See above
`include` | `service_instance.tags` | [HIGH] | See above | See above
`order_by` | service instance name | [MEDIUM] | See [1] | See [3]
`order_by` | service name | [MEDIUM] | See above | See above
`order_by` | service plan name | [MEDIUM] | See above | See above
filter | service instance name | [MEDIUM] | See above | See above
filter | service name | [MEDIUM] | See above | See above
filter | service plan name | [MEDIUM] | See above | See above

[1] Display a list of service instances associated with a specific application

[2] Fetching this information inline avoids making lots of additional requests

[3] This will be required in order to switch from local (fetch allll entities in a list and sort locally) to non-local (use CF api pagination including sorting). See ([non-local lists](cf-api-v2-usage.md#Lists) for more detail on local and non-local lists).


### `/spaces`
Type | Name | Priority | UX Example | Notes
--- | --- | --- | --- | ---
links | `service_instances` | [LOW] | Show the count of service instances in the space | In the medium to long term we will determine this another way
`include` | `service_instances` | [LOW] | See above | See above
links | `space_quota_definition` | [HIGH] | Display the space quota information information per space | See [3]
`include` | `space_quota_definition` | [HIGH] | See above | See above
~~`include`~~ | ~~`applications`~~ |  | | Previous requirement pre-scaling change
`order_by` | `created_at` | [MEDIUM] | See [1] | See [2]
`order_by` | `name` | [MEDIUM] | See [1] | See [2]
filter | name | [MEDIUM] | See [1]. Pre-check to ensure a space name is not taken before attempting to create. | See [2]

[1] Display a list of spaces in an organisation

[2] This will be required in order to switch from local (fetch allll entities in a list and sort locally) to non-local (use CF api pagination including sorting). See ([non-local lists](cf-api-v2-usage.md#Lists) for more detail on local and non-local lists).

[3] Avoids making additional requests. Particularly important when viewing multiple spaces at the same time.


### `/spaces/${guid}`
Type | Name | Priority | UX Example | Notes
--- | --- | --- | --- | ---
links | `organization` | [HIGH] | Basic location information, display name and other information | Avoids making additional requests
`include` | `organization` | [HIGH] | See above | See above
links | `domains` | [MEDIUM] | Efficiency request, better to get these here than separately | `/domains` has no v3 equivalent
`include` | `domains` | [MEDIUM] | See above  | See above
links | `routes` | [LOW] | Display the number of routes in this organisation | `/routes` has no v3 equivalent. See [1]
`include` | `routes` | [LOW] | See above | See above
~~links~~ | ~~`routes.domain`~~ | | | Depending on the list of routes is bad due to scaling. We're removing this functionality
~~`include`~~ | ~~`routes.domain`~~ | | | See above
~~links~~ | ~~`routes.applications`~~ | | | See above
~~`include`~~ | ~~`routes.applications`~~ | | | See above
~~`include`~~ | ~~`applications`~~ | | | Previous requirement pre-scaling change
links | `service_instances` | [LOW] | Display the number of service instances in this organisation | See [1]
`include` | `service_instances` | [LOW] | See above | See above
~~links~~ | ~~`service_instances.service_bindings`~~ | | | Depending on the list of service instances is bad due to scaling. We're removing this functionality
~~`include~~` | ~~`service_instances.service_bindings`~~
links | space quota | [HIGH] | Display quota information, when possible how close user is to various quotas, etc | space quota has no v3 equivalent
`include` | space quota | [HIGH] | See above | See above
property | allow_ssh | [HIGH] | Display value to user. Important from an admin sense |
links | `space.developers` | [HIGH] | See [2] | we might be able to fetch this via new users endpoints described in https://docs.google.com/document/d/1EA65UN3Xsi0EuX-3YfbFNqtJGseFr6FGBt2SR9c4Aqk/edit#heading=h.n1xhc33y2wyj
`include` | `space.developers` | [HIGH] | See [2] | we might be able to fetch this via new users endpoints described in https://docs.google.com/document/d/1EA65UN3Xsi0EuX-3YfbFNqtJGseFr6FGBt2SR9c4Aqk/edit#heading=h.n1xhc33y2wyj
links | `space.managers` | [HIGH] | See [2] | we might be able to fetch this via new users endpoints described in https://docs.google.com/document/d/1EA65UN3Xsi0EuX-3YfbFNqtJGseFr6FGBt2SR9c4Aqk/edit#heading=h.n1xhc33y2wyj
`include` | `space.managers` | [HIGH] | See [2] | we might be able to fetch this via new users endpoints described in https://docs.google.com/document/d/1EA65UN3Xsi0EuX-3YfbFNqtJGseFr6FGBt2SR9c4Aqk/edit#heading=h.n1xhc33y2wyj
links | `space.auditors` | [HIGH] | See [2] | we might be able to fetch this via new users endpoints described in https://docs.google.com/document/d/1EA65UN3Xsi0EuX-3YfbFNqtJGseFr6FGBt2SR9c4Aqk/edit#heading=h.n1xhc33y2wyj
`include` | `space.auditors` | [HIGH] | See [2] | we might be able to fetch this via new users endpoints described in https://docs.google.com/document/d/1EA65UN3Xsi0EuX-3YfbFNqtJGseFr6FGBt2SR9c4Aqk/edit#heading=h.n1xhc33y2wyj

[1] Pre-scaling change. We just want the total count of entities. In the medium to long term we will determine this another way

[2] Display a list of users and their roles

### `/routes` (functionality for `/spaces/${guid}/routes only)

> Note - There doesn't seem to be a way to list routes in a space. This is separate to the concept of listing them inline in a space (with
some overlap though). This endpoint would be used to fetch a list of routes for a specific space and display them to the user.
> The `/v3/route_mappings` endpoint provides a way to search for routes by app or route but not by space.

Type | Name | Priority | UX Example | Notes
--- | --- | --- | --- | ---
filter | space guid | [HIGH] | Display a list of routes that are in a space
links | `domain` | [LOW] | Display the url of the route | Not required if the fqdn is returned in the base route
`include` | `domain` | [LOW] | See above | See above
links | `applications` | [HIGH] | Display a list of the apps that are bound to the route | Avoids making a request to `/v3/route_mappings` for each route (could be a massive amount). We expect these relations to be 1-to-not-many
`include` | `applications` | [HIGH] | See above | See above

### `/service_instances` (functionality for /spaces/{guid}/service_instances only)

> There's lots more that could be added here when taking into account our service instance lists in places other than the space details page
(mainly including space and space.organisation).


Type | Name | Priority | UX Example | Notes
--- | --- | --- | --- | ---
link | `service_instance.applications`| [HIGH] | Display bound applications in a list of service instances | Not sure if this will be implemented the same as routes and route mappings, but would need similar functionality to fetch list inline. This could be replaced with a link to `service_bindings` and then the `app` for that binding 
`include` | `service_instance.applications`| [HIGH] | See above | See above
link | `service_plan`| [HIGH] | Display service plan information per SI in a list of SI | See [2]. `/service_plan` has no v3 equivalent
`include` | `service_plan` | [HIGH] | See above | See above
link | `service`| [HIGH] | Display service information per SI in a list of SI | See [2] `/service` has no v3 equivalent
`include` | `service` | [HIGH] | See above | See above
filter | space guid | [MEDIUM] | | See [3]
filter | org guid | [MEDIUM] | | See [3]
filter | `name` | [MEDIUM] | | See [3]
`include` | space | [HIGH] | When showing all SI in a CF fetch inlined space to space name and allow local filtering by space and org

[1] Display list of service instances in a space

[2] Avoids making additional requests per service instance

[3] This will be required in order to switch from local (fetch allll entities in a list and sort locally) to non-local (use CF api pagination including sorting). See ([non-local lists](cf-api-v2-usage.md#Lists) for more detail on local and non-local lists).

### `/user_provided_service_instances`

We've recently integrated user provided service instances into Stratos. There doesn't seem to be any current support for this in v3. We'd
need similar functionality to `/service_instances` (where there's cross over).

### `/services`

> Comparison of missing functionality as per proposed spec in https://docs.google.com/document/d/1bDsEiZRwQJNUI41cQlUaioaY7JA1fnv_AThOI2ekPXNM/edit#
> For simplicity have kept the `services` name instead of the proposed new name of  `service_offerings`

Type | Name | Priority | UX Example | Notes
--- | --- | --- | --- | ---
link | `service.service_plans`| [HIGH] | Show a count of service plans for a service when showing a list of services | Depends on implementation of 'included' pagination - see https://github.com/cloudfoundry/cc-api-v3-style-guide#proposal-pagination-of-related-resources
`include` | `service.service_plans` | [HIGH] | See above | See above
link | `service.service_broker` | [MEDIUM] | Not currently used, but would be very nice to display the broker where a service is coming from | Note - whole service broker entity (not just name), would be nice
`include` | `service.service_broker` | [MEDIUM] | See above | See above
filter | `name` | [MEDIUM] | | See [1]
`order_by` | `name` | [MEDIUM] | | see [1]
`order_by` | `active` | [MEDIUM] | | see [1]
`order_by` | `bindable` | [MEDIUM] | | see [1]

[1] As other situations where we fetch lists this will help us from switching from local (fetch allll entities in a list and sort locally) to non-local (use CF api pagination including sorting). See ([non-local lists](cf-api-v2-usage.md#Lists) for more detail on local and non-local lists).

### `/service/${guid}`

See `/services` above

### `spaces/${guid}/services`

To be replaced with `/services`

### `services/${guid}/service_plans`

Currently missing in v3 docs. If implemented would need the same link/includes as `service_bindings` section below

### `service_bindings` (POST)

This looks good

### `service_bindings/${guid}` (DELETE)

This looks good

### `service_bindings`

We don't currently use this, but in order for us to we would need the following

Type | Name | Priority | UX Example | Notes
--- | --- | --- | --- | ---
`include` | `service_binding.service_instance` | [HIGH] |  |
`include` | `service_binding.app` | [HIGH] |  |
filter | service instance name | [MEDIUM] | | See [1]
filter | application name | [MEDIUM] | | See [1]
`order_by` | service instance name | [MEDIUM] | | see [1]
`order_by` | application name | [MEDIUM] | | see [1]

[1] As other situations where we fetch lists this will help us from switching from local (fetch allll entities in a list and sort locally) to non-local (use CF api pagination including sorting). See ([non-local lists](cf-api-v2-usage.md#Lists) for more detail on local and non-local lists).

### `service_bindings/${guid}`

We don't currently use this, but in order for us to we would need the same as above (list service_bindings)

### `service_brokers`

We don't currently use this but it would be very nice to. In order for us to though we would need the following

Type | Name | Priority | UX Example | Notes
--- | --- | --- | --- | ---
link | `service_broker.space`| [HIGH] | |
`include` | `service_broker.space` | [HIGH] | |
link | `service_broker.service_offerings`| [HIGH] | For a given broker show a list of service offerings without making multiple requests |
`include` | `service_broker.service_offerings` | [HIGH] | See above |
filter | service broker name | [MEDIUM] | | See [1]
filter | space guid | [MEDIUM] | | See [1]
`order_by` | service broker name | [MEDIUM] | | see [1]

[1] As other situations where we fetch lists this will help us from switching from local (fetch allll entities in a list and sort locally) to non-local (use CF api pagination including sorting). See ([non-local lists](cf-api-v2-usage.md#Lists) for more detail on local and non-local lists).

### `service_brokers/{guid}`

We don't currently use this, but in order for us to we would need the same as above (list service_bindings)

## v3 Required Features

### Single 'included` section per request
There should hopefully be a single `included` section even if `included` elements have their own `include`s. Not quite a requirement, but a real nice to have.

### `include`d lists
Ability to set `include` for lists of entities. See https://github.com/cloudfoundry/cc-api-v3-style-guide#proposal-pagination-of-related-resources

Use case - Routes, packages, builds, process stats, etc in an application

### `order_by` values in `include`d entities
Ability to use properties of entities that are from the `included` section in `order_by`.

Covers simple case of sorting by a property in a 1:1 `include` and also summation of numerical properties in 1:M relationship.

Use case - sort applications by instance count. Requires `process` as an `include` and ability to sort applications by sum of `process`s `instance` values

Use case - as above, but instead of instances the sum of memory in a `processes` `memory_in_mb`. Need to consider whether `processes` state value should be taken into account (only include processes that are running)

Use case - as above, but the sum of `processes` `stats` `usage.mem`.

### filter values in `include`d
As per `order_by`, delve into an `included` entity and filter out given a specific path.

Use case - Filter a list of service bindings by service instance name, service name or service plan name

Use case - Filter a list of apps by organization or space
