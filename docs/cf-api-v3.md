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
- Child entities are also listed, with by url to fetch (like the old `<property>_url` property), in the `links` section.
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
-  How will the deprecation of v2 endpoints happen?
  - One by one?
  - All together once v2 parity is reached?
- Will duplicated `include`ed entities only appear once in a top level (entity or pagination) `included`? For example..conceptually..
  - Fetch an application, the application's space, the application's routes and application routes spaces in a single request
  - If the application space appeared in the route's space, would it only appear once in the application `included`... or appear twice (once 
    in application `included` and again in route `included`)?
- The style guide references a way to fetch one to many relationships as `/v3/apps/:app_guid/relationships/routes` (https://github.com/cloudfoundry/cc-api-v3-style-guide#viewing-1)
  - This doesn't seem to work (404), is it yet to be implemented?
  - `/v3/apps/:app_guid/routes` also does not work (404)
  - `/v3/apps/:app_guid/route_mappings` works, but there doesn't seem to be a way to `include` the `route` such that it appears in the response
- Which version is the `include=space,space.organization` notation supported in?
