# Cloud Foundry API v2 Feature Usage

1. [High Level Stratos Concepts](#High-Level-Stratos-Concepts)
2. [API Parameters](#API-Parameters)
3. [API Examples](#API-Examples)
3. [Summary](#Summary)

## High Level Stratos Concepts

Stratos exercises many features of the Cloud Foundry v2 API, in order to understand these a general knowledge of Stratos concepts is required

### Lists

- Collections of entities are presenting using a list component, which covers table and card grid views.
- Lists can be
  - Sorted by a number of fields
  - Filtered by text or Cloud Foundry, Organisation or Space (some lists contain entities from multiple cloud foundries)
  - Paginated
- Example 1 - Applications List
  - Applications sorting by application name, instances, disk quota, memory and creation date
  - Applications filtered by name, cf, organisation or space
- Example 2 - Organisation List
  - Orgs sorted by name or creation date
  - Orgs filtered by name
- In order to support a decent level of filtering and sorting we often fetch all entities and store them locally (these are referred to as local lists)
- Alternatively, in places where we don't need as much rich filtering and sorting, or the amount of entities are too high, we use standard
  page requests and whatever sorting and filtering is available (these are referred to as non-local lists)


### Entity Relations & Validation
- Cloud Foundry entities (organisation, route, service plan, etc) are stored client side in an entity store
- The console provides methods to fetch an entity or collection of entities from the store. At this time the console states if any of the
  entity's relations are required, for instance when fetching an organisation the spaces and services properties are required
- The console checks if the required entity/s exist in the store.
  - If they're missing they're then fetched via the API, including any required relationships
  - If they exist in the store their relations are checked. Any missing relations are fetched using the `<relation name>_url` property
- This means we fetch the minimum amount of data, and can ensure we have the required data when it's needed
- If the relationship is one to many then all of the missing entities are fetched, even if this involved more than one request.
- Example 1
  - To filter the applications in the applications list by cf/org/space we fetch a list of organisations and state each org must have it's
    spaces property
      - The resulting org entity will only have the spaces relation, each space will have no other relation
  - The user navigates to a space summary screen
  - The space summary screen states the space should applications, service instances, space quoata, service binding, etc
  - Entity validation will fetch the missing relations using the `_url` of the relation
- Examples 2
  - To show the applications in the applications list we fetch a list of apps with the following relations
    - application - space
    - space - organisation
    - application - route
  - The user navigates to a application summary screen
  - The application summary screen states the application should have
    - application - route
    - application - space
    - application - stack
    - application - service binding
    - route - domain
    - space - organisation
  - Entity validation will then usually* fetch the two missing entities stack and domain
    * Depending on what entities currently exist in the store having been fetched by other calls

### Summary Stats
- Some pages show summary information to do with an entity (Application, Organisation, Service, etc)
- Some of these will show stats where only the count of entities are required
- Example 1 - Service Summary
  - No# of service instances
  - No# of service plans
- Example 2 - Organisation Summary
  - No# of spaces in organisation
  - No# of applications in organisation
  - No# of application instances in organisation
  - No# of User in organisation
  - Memory usage (total memory of running apps) out of organisation memory quota
  - Routes in organisation out of organisation root quota
  - Private domains out of organisation private domain quota
  - Service instance count out of organisation instance quota

### Application State

- In most places where we present an application we show a summary state
- Examples
  - `Pending`
  - `Offline while Updating`
  - `Deployed - No Instances`
  - `Deployed - Scaling App`
  - `Deployed - Crashing`
- Summary state is a combination of
  - App `state`
  - App `package_state`
  - App `package_updated_at`
  - App `instances`
  - App Stats instances collection
- To present these kind of states we need to call the `/stats` endpoint for each app. This means on the Applications list we cannot sort by
  app state (there could be thousands of apps).

### Users, Roles and Permissions

The console user will connect to a CF with their personal CF credentials. These credentials dictate not only what they're allowed to do in
the console but also how we have to fetch data.

#### Listing users & their roles
- We provide a way for users of all types to view a list of users (at the cf, organisation and space levels) and their roles
- We have to fetch this information differently between CF administrators with certain scopes and non-cf administrators
- CF Admins can list users via `/users`
- Non-CF admins have to fetch users via each org endpoint `/organization/<guid>/users`.
  - We hide this feature if there are too many organisations.
  - We have to extract user roles from the `organization` response rather than the user's relations, as the `<x>_url` referenced by the
    entities in `/users` is only allowed for the connected user. Calls to fetch `<x>_url` for entities other than the connected user result
    in a api permission error.

#### Permissions

- Permissions are dictated by the admin/non-admin state of the connected user, cf feature flags and all of the users organisation and space roles
- For CF admins we skip fetching roles, as there admin state overrides roles
- For non-admins we hit each `users/<non-admin's guid>/<role>` endpoint, there's a lot of duplicated data here


## API Parameters

### Relations (`inline-relations-depth`, `include-relations`)

In order to support the entity validation process described above we make heavy use of the generic `inline-relations-depth` and `include-relations` parameters

> Note - `exclude-relations` is not used.

When we show the Space summary page the following space relations are required
- space - routes
- space - quota
- space - service instances
- service instance - service bindings
- service bindings - application
- space - applications

#### include-relations

Given the space summary example, on a fresh load of the console directly to a space summary page equates to

```
include-relations=routes,space_quota_definition,service_instances,service_bindings,app,apps
```

- As there's only one way to define the parent in a include-relations string any child relation with the same name in both parent and
child will be fetched. For example if space contained an `apps` property and one of it's children also had an `apps` property both will be
fetched.

- If a relationship contains a list of entities, and that list contains more than 50, the collection is missing in the API response. As per
non-list entities we use the `<x>_url` value to fetch these, however will automatically fetch all values and not just the first page (just
like a local-list).

#### inline-relations-depth

The inline depth, up to 2, is calculated by the number of chained relations. In the space summary example above the actual depth is 3
(space --> service instance --> service binding --> application). As 2 is the maximum the last relation of binding --> application is
missing in the api response. If the missing application is not already in the store it's fetched by the `<x>_url` value.

### Pagination (`page`, `results-per-page`)

- Pagination is either controlled
  - locally (local lists)
    - We fetch all entities by setting results-per-page to maximum and iterate through every page
    - Paging is then handled client side
  - remotely (non-local lists)
    - We fetch pages that haven't been fetched before in a page size determined by the user

### Sorting (`order-direction`)

- The CF API only supports sorting on a very small subset of properties such as creation_date and event timestamp
- This is only used when sorting non-local lists (see pagination section above)

### Queries (`q`)
- We have the functionality to use these per list, however are rarely used
  - The Application Events non-local list uses these to define the actee (the app)
  - The Applications list uses these to filter by org/space when there are too many applications to handle locally
  - Fetch all service instances with a service bindings
  - Fetch all service instances with a service plan
- Using `q` to filter via org and space is sometimes possible, sometimes not
  - A route is created in a space, however cannot filter routes via space
  - Service brokers can be filtered by space, however not by organisation


## API Examples

### User visits applications lists... and then views an application summary page
<details>
  <summary>
    Applications List
  </summary>

  ```
  organizations?page=1&results-per-page=100&order-direction=desc&order-direction-field=name&order-by=name&inline-relations-depth=1&include-relations=spaces
  apps?order-direction=asc&order-direction-field=creation&page=1&results-per-page=100&inline-relations-depth=2&include-relations=space,organization,routes
  organizations/54e0be87-02f6-4b5d-b67d-40036a80f4c6/spaces?results-per-page=100&page=1
  apps/ca47f757-caf7-4142-803b-a577c995869f/stats?order-direction=desc&order-direction-field=index&results-per-page=5
  apps/d953e846-2a6f-4570-9697-df95f789e8a0/stats?order-direction=desc&order-direction-field=index&results-per-page=5
  apps/b1e1da9b-9c20-475b-9ad8-2f838eb6daa9/stats?order-direction=desc&order-direction-field=index&results-per-page=5
  apps/fe72bac0-6d22-495c-a1d8-67180461f52f/stats?order-direction=desc&order-direction-field=index&results-per-page=5
  ```

</details>

<details>
  <summary>
    Nav to Application Summary
  </summary>

```
apps/ca47f757-caf7-4142-803b-a577c995869f/env?order-direction=desc&order-direction-field=name&results-per-page=5&page=1
stacks/83eaeaa0-dbd0-4ff9-bb28-50adbbce4e78
shared_domains/a09e5ec7-ddc4-476d-a431-a45af446d2f2
apps/ca47f757-caf7-4142-803b-a577c995869f/service_bindings?results-per-page=100&page=1
apps/ca47f757-caf7-4142-803b-a577c995869f/summary
```
</details>



### User directly visits application summary page

<details>
  <summary>
    Calls
  </summary>

```
apps/ca47f757-caf7-4142-803b-a577c995869f/env?order-direction=desc&order-direction-field=name&results-per-page=5&page=1
apps/ca47f757-caf7-4142-803b-a577c995869f?inline-relations-depth=2&include-relations=stack,space,organization,routes,domain,service_bindings
apps/ca47f757-caf7-4142-803b-a577c995869f/summary
apps/ca47f757-caf7-4142-803b-a577c995869f/stats?order-direction=desc&order-direction-field=index&results-per-page=5&page=1
```
</details>


### User sits on application summary view

<details>
  <summary>
    The following is repeated
  </summary>

```
apps/ca47f757-caf7-4142-803b-a577c995869f?inline-relations-depth=2&include-relations=stack,space,organization,routes,domain,service_bindings
apps/ca47f757-caf7-4142-803b-a577c995869f/summary
apps/ca47f757-caf7-4142-803b-a577c995869f/stats?order-direction=desc&order-direction-field=index&results-per-page=5&page=1
```
</details>

### User navigates to space summary view from cf summary view and org summary view

<details>
  <summary>
    Cf Summary View
  </summary>

```
shared_domains?results-per-page=100&page=1
organizations?page=1&results-per-page=100&order-direction=desc&order-direction-field=name&order-by=name&inline-relations-depth=2&include-relations=domains,quota_definition,private_domains,spaces,routes,service_instances,apps
users?page=1&results-per-page=100&order-direction=desc&order-direction-field=username&inline-relations-depth=1&include-relations=organizations,audited_organizations,managed_organizations,billing_managed_organizations,spaces,managed_spaces,audited_spaces
users/ec7c596c-1b75-4e66-aad8-2376e03dccce/organizations?results-per-page=100&page=1
users/4ea175a6-418d-45d6-933f-5597ab34510c/organizations?results-per-page=100&page=1
users/ec7c596c-1b75-4e66-aad8-2376e03dccce/managed_organizations?results-per-page=100&page=1
users/4ea175a6-418d-45d6-933f-5597ab34510c/managed_organizations?results-per-page=100&page=1
users/f2d71b96-4268-4a29-b8a1-88c856ee7f75/spaces?results-per-page=100&page=1
users/4ea175a6-418d-45d6-933f-5597ab34510c/spaces?results-per-page=100&page=1
users/4ea175a6-418d-45d6-933f-5597ab34510c/managed_spaces?results-per-page=100&page=1
users/4ea175a6-418d-45d6-933f-5597ab34510c/spaces?results-per-page=100&page=2
users/4ea175a6-418d-45d6-933f-5597ab34510c/spaces?results-per-page=100&page=3
users/4ea175a6-418d-45d6-933f-5597ab34510c/managed_spaces?results-per-page=100&page=2
users/4ea175a6-418d-45d6-933f-5597ab34510c/managed_spaces?results-per-page=100&page=3
organizations?page=2&results-per-page=100&order-direction=desc&order-direction-field=name&order-by=name&inline-relations-depth=2&include-relations=domains,quota_definition,private_domains,spaces,routes,service_instances,apps
users/ec7c596c-1b75-4e66-aad8-2376e03dccce/managed_organizations?results-per-page=100&page=2
users/4ea175a6-418d-45d6-933f-5597ab34510c/organizations?results-per-page=100&page=2
users/4ea175a6-418d-45d6-933f-5597ab34510c/managed_organizations?results-per-page=100&page=2
users/ec7c596c-1b75-4e66-aad8-2376e03dccce/organizations?results-per-page=100&page=2
organizations/54e0be87-02f6-4b5d-b67d-40036a80f4c6/spaces?results-per-page=100&page=1&inline-relations-depth=1&include-relations=routes,service_instances,apps
```
</details>


<details>
  <summary>
    Nav to Org Summary View
  </summary>

```
organizations/78ee5f44-0a33-4544-9fa8-acb0de7155ce/users?page=1&results-per-page=100&order-direction=desc&order-direction-field=username&inline-relations-depth=2&include-relations=organizations,audited_organizations,managed_organizations,billing_managed_organizations,spaces,managed_spaces,audited_spaces
apps/ca47f757-caf7-4142-803b-a577c995869f/stats?order-direction=desc&order-direction-field=index&results-per-page=5
apps/d953e846-2a6f-4570-9697-df95f789e8a0/stats?order-direction=desc&order-direction-field=index&results-per-page=5
apps/54bd54cb-2937-49b0-9369-a8e501c405e1/stats?order-direction=desc&order-direction-field=index&results-per-page=5
apps/7660ce91-f381-4528-ba01-267d55703323/stats?order-direction=desc&order-direction-field=index&results-per-page=5
apps/8468ba80-d501-4197-8c33-e7df6a9555e4/stats?order-direction=desc&order-direction-field=index&results-per-page=5
apps/ca47f757-caf7-4142-803b-a577c995869f/stats?order-direction=desc&order-direction-field=index&page=1&results-per-page=5
apps/d953e846-2a6f-4570-9697-df95f789e8a0/stats?order-direction=desc&order-direction-field=index&page=1&results-per-page=5
apps/54bd54cb-2937-49b0-9369-a8e501c405e1/stats?order-direction=desc&order-direction-field=index&page=1&results-per-page=5
apps/7660ce91-f381-4528-ba01-267d55703323/stats?order-direction=desc&order-direction-field=index&page=1&results-per-page=5
apps/8468ba80-d501-4197-8c33-e7df6a9555e4/stats?order-direction=desc&order-direction-field=index&page=1&results-per-page=5
users/ec7c596c-1b75-4e66-aad8-2376e03dccce/organizations?results-per-page=100&page=1
users/4ea175a6-418d-45d6-933f-5597ab34510c/organizations?results-per-page=100&page=1
users/ec7c596c-1b75-4e66-aad8-2376e03dccce/managed_organizations?results-per-page=100&page=1
users/4ea175a6-418d-45d6-933f-5597ab34510c/managed_organizations?results-per-page=100&page=1
users/f2d71b96-4268-4a29-b8a1-88c856ee7f75/spaces?results-per-page=100&page=1
users/4ea175a6-418d-45d6-933f-5597ab34510c/spaces?results-per-page=100&page=1
users/4ea175a6-418d-45d6-933f-5597ab34510c/managed_spaces?results-per-page=100&page=1
users/ec7c596c-1b75-4e66-aad8-2376e03dccce/organizations?results-per-page=100&page=2
users/ec7c596c-1b75-4e66-aad8-2376e03dccce/managed_organizations?results-per-page=100&page=2
users/4ea175a6-418d-45d6-933f-5597ab34510c/managed_organizations?results-per-page=100&page=2
users/4ea175a6-418d-45d6-933f-5597ab34510c/organizations?results-per-page=100&page=2
users/4ea175a6-418d-45d6-933f-5597ab34510c/spaces?results-per-page=100&page=2
users/4ea175a6-418d-45d6-933f-5597ab34510c/spaces?results-per-page=100&page=3
users/4ea175a6-418d-45d6-933f-5597ab34510c/managed_spaces?results-per-page=100&page=2
users/4ea175a6-418d-45d6-933f-5597ab34510c/managed_spaces?results-per-page=100&page=3
```
</details>

<details>
  <summary>
    Nav to Space Summary View
  </summary>

```
service_instances/f2656532-e77c-46fa-a2cb-595e6957e6f6/service_bindings?results-per-page=100&page=1&inline-relations-depth=1&include-relations=app
service_instances/99e91478-b485-469f-a653-a3dd5bc84b4f/service_bindings?results-per-page=100&page=1&inline-relations-depth=2&include-relations=app
service_instances/3db6b84a-71eb-4c16-b9ff-6e71f7981dab/service_bindings?results-per-page=100&page=1&inline-relations-depth=2&include-relations=app
service_instances/b7d411a1-5ab4-4159-a34a-73b9a9b4e733/service_bindings?results-per-page=100&page=1&inline-relations-depth=2&include-relations=app
spaces/d81b4685-e04f-41f3-bc07-63a1d0ba7fa9/user_roles?page=1&results-per-page=100&order-direction=desc&order-direction-field=username&inline-relations-depth=2&include-relations=organizations,audited_organizations,managed_organizations,billing_managed_organizations,spaces,managed_spaces,audited_spaces
apps/ca47f757-caf7-4142-803b-a577c995869f/stats?order-direction=desc&order-direction-field=index&page=1&results-per-page=5
apps/d953e846-2a6f-4570-9697-df95f789e8a0/stats?order-direction=desc&order-direction-field=index&page=1&results-per-page=5
apps/54bd54cb-2937-49b0-9369-a8e501c405e1/stats?order-direction=desc&order-direction-field=index&page=1&results-per-page=5
apps/7660ce91-f381-4528-ba01-267d55703323/stats?order-direction=desc&order-direction-field=index&page=1&results-per-page=5
apps/8468ba80-d501-4197-8c33-e7df6a9555e4/stats?order-direction=desc&order-direction-field=index&page=1&results-per-page=5
apps/ca47f757-caf7-4142-803b-a577c995869f/stats?order-direction=desc&order-direction-field=index&page=1&results-per-page=5
apps/d953e846-2a6f-4570-9697-df95f789e8a0/stats?order-direction=desc&order-direction-field=index&page=1&results-per-page=5
apps/54bd54cb-2937-49b0-9369-a8e501c405e1/stats?order-direction=desc&order-direction-field=index&page=1&results-per-page=5
apps/7660ce91-f381-4528-ba01-267d55703323/stats?order-direction=desc&order-direction-field=index&page=1&results-per-page=5
apps/8468ba80-d501-4197-8c33-e7df6a9555e4/stats?order-direction=desc&order-direction-field=index&page=1&results-per-page=5
users/ec7c596c-1b75-4e66-aad8-2376e03dccce/organizations?results-per-page=100&page=1
users/4ea175a6-418d-45d6-933f-5597ab34510c/organizations?results-per-page=100&page=1
users/ec7c596c-1b75-4e66-aad8-2376e03dccce/managed_organizations?results-per-page=100&page=1
users/4ea175a6-418d-45d6-933f-5597ab34510c/managed_organizations?results-per-page=100&page=1
users/f2d71b96-4268-4a29-b8a1-88c856ee7f75/spaces?results-per-page=100&page=1
users/4ea175a6-418d-45d6-933f-5597ab34510c/spaces?results-per-page=100&page=1
users/4ea175a6-418d-45d6-933f-5597ab34510c/managed_spaces?results-per-page=100&page=1
users/ec7c596c-1b75-4e66-aad8-2376e03dccce/organizations?results-per-page=100&page=2
users/4ea175a6-418d-45d6-933f-5597ab34510c/organizations?results-per-page=100&page=2
users/ec7c596c-1b75-4e66-aad8-2376e03dccce/managed_organizations?results-per-page=100&page=2
users/4ea175a6-418d-45d6-933f-5597ab34510c/managed_organizations?results-per-page=100&page=2
users/4ea175a6-418d-45d6-933f-5597ab34510c/spaces?results-per-page=100&page=2
users/4ea175a6-418d-45d6-933f-5597ab34510c/spaces?results-per-page=100&page=3
users/4ea175a6-418d-45d6-933f-5597ab34510c/managed_spaces?results-per-page=100&page=2
users/4ea175a6-418d-45d6-933f-5597ab34510c/managed_spaces?results-per-page=100&page=3
```
</details>


### User directly visits an space summary view

<details>
  <summary>
    Calls
  </summary>

```
shared_domains?results-per-page=100&page=1
spaces/d81b4685-e04f-41f3-bc07-63a1d0ba7fa9?inline-relations-depth=2&include-relations=routes,space_quota_definition,service_instances,service_bindings,app,apps
organizations/78ee5f44-0a33-4544-9fa8-acb0de7155ce?inline-relations-depth=2&include-relations=domains,quota_definition,private_domains,spaces,routes,service_instances,apps
spaces/d81b4685-e04f-41f3-bc07-63a1d0ba7fa9/user_roles?page=1&results-per-page=100&order-direction=desc&order-direction-field=username&inline-relations-depth=1&include-relations=organizations,audited_organizations,managed_organizations,billing_managed_organizations,spaces,managed_spaces,audited_spaces
organizations?page=1&results-per-page=100&order-direction=desc&order-direction-field=name&order-by=name&inline-relations-depth=2&include-relations=domains,quota_definition,private_domains,spaces,routes,service_instances,apps
users?page=1&results-per-page=100&order-direction=desc&order-direction-field=username&inline-relations-depth=2&include-relations=organizations,audited_organizations,managed_organizations,billing_managed_organizations,spaces,managed_spaces,audited_spaces
users/ec7c596c-1b75-4e66-aad8-2376e03dccce/organizations?results-per-page=100&page=1
users/4ea175a6-418d-45d6-933f-5597ab34510c/organizations?results-per-page=100&page=1
users/ec7c596c-1b75-4e66-aad8-2376e03dccce/managed_organizations?results-per-page=100&page=1
users/4ea175a6-418d-45d6-933f-5597ab34510c/managed_organizations?results-per-page=100&page=1
users/f2d71b96-4268-4a29-b8a1-88c856ee7f75/spaces?results-per-page=100&page=1
users/4ea175a6-418d-45d6-933f-5597ab34510c/spaces?results-per-page=100&page=1
users/4ea175a6-418d-45d6-933f-5597ab34510c/managed_spaces?results-per-page=100&page=1
users/4ea175a6-418d-45d6-933f-5597ab34510c/spaces?results-per-page=100&page=2
users/4ea175a6-418d-45d6-933f-5597ab34510c/spaces?results-per-page=100&page=3
users/4ea175a6-418d-45d6-933f-5597ab34510c/managed_spaces?results-per-page=100&page=2
users/4ea175a6-418d-45d6-933f-5597ab34510c/managed_spaces?results-per-page=100&page=3
users/4ea175a6-418d-45d6-933f-5597ab34510c/organizations?results-per-page=100&page=2
users/4ea175a6-418d-45d6-933f-5597ab34510c/managed_organizations?results-per-page=100&page=2
users/ec7c596c-1b75-4e66-aad8-2376e03dccce/managed_organizations?results-per-page=100&page=2
users/ec7c596c-1b75-4e66-aad8-2376e03dccce/organizations?results-per-page=100&page=2
users/ec7c596c-1b75-4e66-aad8-2376e03dccce/organizations?results-per-page=100&page=1
users/4ea175a6-418d-45d6-933f-5597ab34510c/organizations?results-per-page=100&page=1
users/ec7c596c-1b75-4e66-aad8-2376e03dccce/managed_organizations?results-per-page=100&page=1
users/4ea175a6-418d-45d6-933f-5597ab34510c/managed_organizations?results-per-page=100&page=1
users/f2d71b96-4268-4a29-b8a1-88c856ee7f75/spaces?results-per-page=100&page=1
users/4ea175a6-418d-45d6-933f-5597ab34510c/spaces?results-per-page=100&page=1
users/4ea175a6-418d-45d6-933f-5597ab34510c/managed_spaces?results-per-page=100&page=1
users/4ea175a6-418d-45d6-933f-5597ab34510c/managed_organizations?results-per-page=100&page=2
users/4ea175a6-418d-45d6-933f-5597ab34510c/organizations?results-per-page=100&page=2
users/ec7c596c-1b75-4e66-aad8-2376e03dccce/organizations?results-per-page=100&page=2
users/ec7c596c-1b75-4e66-aad8-2376e03dccce/managed_organizations?results-per-page=100&page=2
users/4ea175a6-418d-45d6-933f-5597ab34510c/spaces?results-per-page=100&page=2
users/4ea175a6-418d-45d6-933f-5597ab34510c/spaces?results-per-page=100&page=3
users/4ea175a6-418d-45d6-933f-5597ab34510c/managed_spaces?results-per-page=100&page=2
users/4ea175a6-418d-45d6-933f-5597ab34510c/managed_spaces?results-per-page=100&page=3
organizations?page=2&results-per-page=100&order-direction=desc&order-direction-field=name&order-by=name&inline-relations-depth=2&include-relations=domains,quota_definition,private_domains,spaces,routes,service_instances,apps
organizations/54e0be87-02f6-4b5d-b67d-40036a80f4c6/spaces?results-per-page=100&page=1&inline-relations-depth=1&include-relations=routes,service_instances,apps
apps/ca47f757-caf7-4142-803b-a577c995869f/stats?order-direction=desc&order-direction-field=index&results-per-page=5
apps/d953e846-2a6f-4570-9697-df95f789e8a0/stats?order-direction=desc&order-direction-field=index&results-per-page=5
apps/54bd54cb-2937-49b0-9369-a8e501c405e1/stats?order-direction=desc&order-direction-field=index&results-per-page=5
apps/7660ce91-f381-4528-ba01-267d55703323/stats?order-direction=desc&order-direction-field=index&results-per-page=5
apps/8468ba80-d501-4197-8c33-e7df6a9555e4/stats?order-direction=desc&order-direction-field=index&results-per-page=5
apps/ca47f757-caf7-4142-803b-a577c995869f/stats?order-direction=desc&order-direction-field=index&page=1&results-per-page=5
apps/d953e846-2a6f-4570-9697-df95f789e8a0/stats?order-direction=desc&order-direction-field=index&page=1&results-per-page=5
apps/54bd54cb-2937-49b0-9369-a8e501c405e1/stats?order-direction=desc&order-direction-field=index&page=1&results-per-page=5
apps/7660ce91-f381-4528-ba01-267d55703323/stats?order-direction=desc&order-direction-field=index&page=1&results-per-page=5
apps/8468ba80-d501-4197-8c33-e7df6a9555e4/stats?order-direction=desc&order-direction-field=index&page=1&results-per-page=5
```
</details>


### Random click around (fetching data)


<details>
  <summary>
    This shows a whole range of calls we make, all `GET`s
  </summary>

```
organizations?page=1&results-per-page=100&order-direction=desc&order-direction-field=name&order-by=name&inline-relations-depth=1&include-relations=spaces
apps?order-direction=asc&order-direction-field=creation&page=1&results-per-page=100&inline-relations-depth=2&include-relations=space,organization,routes
organizations?page=2&results-per-page=100&order-direction=desc&order-direction-field=name&order-by=name&inline-relations-depth=1&include-relations=spaces
organizations/54e0be87-02f6-4b5d-b67d-40036a80f4c6/spaces?results-per-page=100&page=1
apps?order-direction=asc&order-direction-field=creation&page=2&results-per-page=100&inline-relations-depth=2&include-relations=space,organization,routes
apps/ca47f757-caf7-4142-803b-a577c995869f/stats?order-direction=desc&order-direction-field=index&results-per-page=5
apps/d953e846-2a6f-4570-9697-df95f789e8a0/stats?order-direction=desc&order-direction-field=index&results-per-page=5
apps/b1e1da9b-9c20-475b-9ad8-2f838eb6daa9/stats?order-direction=desc&order-direction-field=index&results-per-page=5
apps/fe72bac0-6d22-495c-a1d8-67180461f52f/stats?order-direction=desc&order-direction-field=index&results-per-page=5
apps/ca47f757-caf7-4142-803b-a577c995869f/env?order-direction=desc&order-direction-field=name&results-per-page=5&page=1
stacks/83eaeaa0-dbd0-4ff9-bb28-50adbbce4e78
shared_domains/a09e5ec7-ddc4-476d-a431-a45af446d2f2
apps/ca47f757-caf7-4142-803b-a577c995869f/service_bindings?results-per-page=100&page=1
apps/ca47f757-caf7-4142-803b-a577c995869f/summary
shared_domains?results-per-page=100&page=1
apps/ca47f757-caf7-4142-803b-a577c995869f/service_bindings?results-per-page=100&page=1&order-direction=asc&order-direction-field=creation&inline-relations-depth=2&include-relations=app,service_instance,service,service_plan
services/aebc001e-cf51-4d09-b5cd-d1d024685797
service_instances/b7d411a1-5ab4-4159-a34a-73b9a9b4e733/service_bindings?results-per-page=100&page=1&inline-relations-depth=1&include-relations=app
services/aebc001e-cf51-4d09-b5cd-d1d024685797/service_plans?results-per-page=100&page=1
apps/ca47f757-caf7-4142-803b-a577c995869f?inline-relations-depth=2&include-relations=stack,space,organization,routes,domain,service_bindings
events?q=actee:ca47f757-caf7-4142-803b-a577c995869f&q=actee:ca47f757-caf7-4142-803b-a577c995869f&order-direction=desc&order-direction-field=timestamp&results-per-page=5&page=1
events?order-direction=desc&order-direction-field=timestamp&q=actee:ca47f757-caf7-4142-803b-a577c995869f&results-per-page=9&page=1
services?page=1&results-per-page=100&order-direction=desc&order-direction-field=label&inline-relations-depth=2&include-relations=service_plans
service_brokers?page=1&results-per-page=100&order-direction=desc&order-direction-field=name
service_instances?page=1&results-per-page=100&order-direction=asc&order-direction-field=creation&inline-relations-depth=2&include-relations=service_plan,service_bindings,app,space,service
service_instances?page=1&results-per-page=100&order-direction=asc&order-direction-field=creation&inline-relations-depth=2&include-relations=service_plan,service_bindings,app,space,service
organizations?page=1&results-per-page=100&order-direction=desc&order-direction-field=name&order-by=name&inline-relations-depth=2&include-relations=domains,quota_definition,private_domains,spaces,routes,service_instances,apps
users?page=1&results-per-page=100&order-direction=desc&order-direction-field=username&inline-relations-depth=1&include-relations=organizations,audited_organizations,managed_organizations,billing_managed_organizations,spaces,managed_spaces,audited_spaces
organizations?page=2&results-per-page=100&order-direction=desc&order-direction-field=name&order-by=name&inline-relations-depth=2&include-relations=domains,quota_definition,private_domains,spaces,routes,service_instances,apps
users/ec7c596c-1b75-4e66-aad8-2376e03dccce/organizations?results-per-page=100&page=1
users/4ea175a6-418d-45d6-933f-5597ab34510c/organizations?results-per-page=100&page=1
users/ec7c596c-1b75-4e66-aad8-2376e03dccce/managed_organizations?results-per-page=100&page=1
users/4ea175a6-418d-45d6-933f-5597ab34510c/managed_organizations?results-per-page=100&page=1
users/f2d71b96-4268-4a29-b8a1-88c856ee7f75/spaces?results-per-page=100&page=1
users/4ea175a6-418d-45d6-933f-5597ab34510c/spaces?results-per-page=100&page=1
users/4ea175a6-418d-45d6-933f-5597ab34510c/managed_spaces?results-per-page=100&page=1
users/ec7c596c-1b75-4e66-aad8-2376e03dccce/organizations?results-per-page=100&page=2
users/ec7c596c-1b75-4e66-aad8-2376e03dccce/managed_organizations?results-per-page=100&page=2
users/4ea175a6-418d-45d6-933f-5597ab34510c/organizations?results-per-page=100&page=2
users/4ea175a6-418d-45d6-933f-5597ab34510c/managed_organizations?results-per-page=100&page=2
organizations/54e0be87-02f6-4b5d-b67d-40036a80f4c6/spaces?results-per-page=100&page=1&inline-relations-depth=1&include-relations=routes,service_instances,apps
users/4ea175a6-418d-45d6-933f-5597ab34510c/spaces?results-per-page=100&page=2
users/4ea175a6-418d-45d6-933f-5597ab34510c/spaces?results-per-page=100&page=3
users/4ea175a6-418d-45d6-933f-5597ab34510c/managed_spaces?results-per-page=100&page=2
users/4ea175a6-418d-45d6-933f-5597ab34510c/managed_spaces?results-per-page=100&page=3
apps/b1e1da9b-9c20-475b-9ad8-2f838eb6daa9/stats?order-direction=desc&order-direction-field=index&page=1&results-per-page=5
apps/0e5ac1ac-d84e-4a05-8583-0ac7621622a1/stats?order-direction=desc&order-direction-field=index&results-per-page=5
apps/243d3d8b-74da-4241-af55-ce10f1e24002/stats?order-direction=desc&order-direction-field=index&results-per-page=5
apps/ad346d4d-64de-424c-8d4f-48c0602c365e/stats?order-direction=desc&order-direction-field=index&results-per-page=5
apps/b1e1da9b-9c20-475b-9ad8-2f838eb6daa9/stats?order-direction=desc&order-direction-field=index&page=1&results-per-page=5
apps/0e5ac1ac-d84e-4a05-8583-0ac7621622a1/stats?order-direction=desc&order-direction-field=index&page=1&results-per-page=5
apps/243d3d8b-74da-4241-af55-ce10f1e24002/stats?order-direction=desc&order-direction-field=index&page=1&results-per-page=5
apps/ad346d4d-64de-424c-8d4f-48c0602c365e/stats?order-direction=desc&order-direction-field=index&page=1&results-per-page=5
config/feature_flags?page=1&order-direction=desc&order-direction-field=name&results-per-page=25
buildpacks?page=1&results-per-page=100&order-direction=desc&order-direction-field=position
stacks?page=1&results-per-page=100&order-direction=desc&order-direction-field=name
security_groups?page=1&results-per-page=100&order-direction=desc&order-direction-field=name&inline-relations-depth=1&include-relations=spaces
apps/b1e1da9b-9c20-475b-9ad8-2f838eb6daa9/stats?order-direction=desc&order-direction-field=index&page=1&results-per-page=5
apps/0e5ac1ac-d84e-4a05-8583-0ac7621622a1/stats?order-direction=desc&order-direction-field=index&page=1&results-per-page=5
apps/243d3d8b-74da-4241-af55-ce10f1e24002/stats?order-direction=desc&order-direction-field=index&page=1&results-per-page=5
apps/ad346d4d-64de-424c-8d4f-48c0602c365e/stats?order-direction=desc&order-direction-field=index&page=1&results-per-page=5
apps/b1e1da9b-9c20-475b-9ad8-2f838eb6daa9/stats?order-direction=desc&order-direction-field=index&page=1&results-per-page=5
apps/0e5ac1ac-d84e-4a05-8583-0ac7621622a1/stats?order-direction=desc&order-direction-field=index&page=1&results-per-page=5
apps/243d3d8b-74da-4241-af55-ce10f1e24002/stats?order-direction=desc&order-direction-field=index&page=1&results-per-page=5
apps/ad346d4d-64de-424c-8d4f-48c0602c365e/stats?order-direction=desc&order-direction-field=index&page=1&results-per-page=5
organizations/78ee5f44-0a33-4544-9fa8-acb0de7155ce/users?page=1&results-per-page=100&order-direction=desc&order-direction-field=username&inline-relations-depth=2&include-relations=organizations,audited_organizations,managed_organizations,billing_managed_organizations,spaces,managed_spaces,audited_spaces
apps/ca47f757-caf7-4142-803b-a577c995869f/stats?order-direction=desc&order-direction-field=index&results-per-page=5&page=1
apps/d953e846-2a6f-4570-9697-df95f789e8a0/stats?order-direction=desc&order-direction-field=index&page=1&results-per-page=5
apps/54bd54cb-2937-49b0-9369-a8e501c405e1/stats?order-direction=desc&order-direction-field=index&results-per-page=5
apps/7660ce91-f381-4528-ba01-267d55703323/stats?order-direction=desc&order-direction-field=index&results-per-page=5
apps/8468ba80-d501-4197-8c33-e7df6a9555e4/stats?order-direction=desc&order-direction-field=index&results-per-page=5
apps/ca47f757-caf7-4142-803b-a577c995869f/stats?order-direction=desc&order-direction-field=index&results-per-page=5&page=1
apps/d953e846-2a6f-4570-9697-df95f789e8a0/stats?order-direction=desc&order-direction-field=index&page=1&results-per-page=5
apps/54bd54cb-2937-49b0-9369-a8e501c405e1/stats?order-direction=desc&order-direction-field=index&page=1&results-per-page=5
apps/7660ce91-f381-4528-ba01-267d55703323/stats?order-direction=desc&order-direction-field=index&page=1&results-per-page=5
apps/8468ba80-d501-4197-8c33-e7df6a9555e4/stats?order-direction=desc&order-direction-field=index&page=1&results-per-page=5
users/ec7c596c-1b75-4e66-aad8-2376e03dccce/organizations?results-per-page=100&page=1
users/4ea175a6-418d-45d6-933f-5597ab34510c/organizations?results-per-page=100&page=1
users/ec7c596c-1b75-4e66-aad8-2376e03dccce/managed_organizations?results-per-page=100&page=1
users/4ea175a6-418d-45d6-933f-5597ab34510c/managed_organizations?results-per-page=100&page=1
users/f2d71b96-4268-4a29-b8a1-88c856ee7f75/spaces?results-per-page=100&page=1
users/4ea175a6-418d-45d6-933f-5597ab34510c/spaces?results-per-page=100&page=1
users/4ea175a6-418d-45d6-933f-5597ab34510c/managed_spaces?results-per-page=100&page=1
users/ec7c596c-1b75-4e66-aad8-2376e03dccce/organizations?results-per-page=100&page=2
users/ec7c596c-1b75-4e66-aad8-2376e03dccce/managed_organizations?results-per-page=100&page=2
users/4ea175a6-418d-45d6-933f-5597ab34510c/organizations?results-per-page=100&page=2
users/4ea175a6-418d-45d6-933f-5597ab34510c/managed_organizations?results-per-page=100&page=2
users/4ea175a6-418d-45d6-933f-5597ab34510c/spaces?results-per-page=100&page=2
users/4ea175a6-418d-45d6-933f-5597ab34510c/spaces?results-per-page=100&page=3
users/4ea175a6-418d-45d6-933f-5597ab34510c/managed_spaces?results-per-page=100&page=2
users/4ea175a6-418d-45d6-933f-5597ab34510c/managed_spaces?results-per-page=100&page=3
spaces/d81b4685-e04f-41f3-bc07-63a1d0ba7fa9/user_roles?page=1&results-per-page=100&order-direction=desc&order-direction-field=username&inline-relations-depth=2&include-relations=organizations,audited_organizations,managed_organizations,billing_managed_organizations,spaces,managed_spaces,audited_spaces
apps/ca47f757-caf7-4142-803b-a577c995869f/stats?order-direction=desc&order-direction-field=index&results-per-page=5&page=1
apps/d953e846-2a6f-4570-9697-df95f789e8a0/stats?order-direction=desc&order-direction-field=index&page=1&results-per-page=5
apps/54bd54cb-2937-49b0-9369-a8e501c405e1/stats?order-direction=desc&order-direction-field=index&page=1&results-per-page=5
apps/7660ce91-f381-4528-ba01-267d55703323/stats?order-direction=desc&order-direction-field=index&page=1&results-per-page=5
apps/8468ba80-d501-4197-8c33-e7df6a9555e4/stats?order-direction=desc&order-direction-field=index&page=1&results-per-page=5
apps/ca47f757-caf7-4142-803b-a577c995869f/stats?order-direction=desc&order-direction-field=index&results-per-page=5&page=1
apps/d953e846-2a6f-4570-9697-df95f789e8a0/stats?order-direction=desc&order-direction-field=index&page=1&results-per-page=5
apps/54bd54cb-2937-49b0-9369-a8e501c405e1/stats?order-direction=desc&order-direction-field=index&page=1&results-per-page=5
apps/7660ce91-f381-4528-ba01-267d55703323/stats?order-direction=desc&order-direction-field=index&page=1&results-per-page=5
apps/8468ba80-d501-4197-8c33-e7df6a9555e4/stats?order-direction=desc&order-direction-field=index&page=1&results-per-page=5
spaces/d81b4685-e04f-41f3-bc07-63a1d0ba7fa9/apps?page=1&results-per-page=5&order-direction=desc&order-direction-field=creation
users/ec7c596c-1b75-4e66-aad8-2376e03dccce/organizations?results-per-page=100&page=1
users/4ea175a6-418d-45d6-933f-5597ab34510c/organizations?results-per-page=100&page=1
users/ec7c596c-1b75-4e66-aad8-2376e03dccce/managed_organizations?results-per-page=100&page=1
users/4ea175a6-418d-45d6-933f-5597ab34510c/managed_organizations?results-per-page=100&page=1
users/f2d71b96-4268-4a29-b8a1-88c856ee7f75/spaces?results-per-page=100&page=1
users/4ea175a6-418d-45d6-933f-5597ab34510c/spaces?results-per-page=100&page=1
users/4ea175a6-418d-45d6-933f-5597ab34510c/managed_spaces?results-per-page=100&page=1
users/ec7c596c-1b75-4e66-aad8-2376e03dccce/organizations?results-per-page=100&page=2
users/4ea175a6-418d-45d6-933f-5597ab34510c/organizations?results-per-page=100&page=2
users/4ea175a6-418d-45d6-933f-5597ab34510c/managed_organizations?results-per-page=100&page=2
users/ec7c596c-1b75-4e66-aad8-2376e03dccce/managed_organizations?results-per-page=100&page=2
users/4ea175a6-418d-45d6-933f-5597ab34510c/spaces?results-per-page=100&page=2
users/4ea175a6-418d-45d6-933f-5597ab34510c/spaces?results-per-page=100&page=3
users/4ea175a6-418d-45d6-933f-5597ab34510c/managed_spaces?results-per-page=100&page=2
users/4ea175a6-418d-45d6-933f-5597ab34510c/managed_spaces?results-per-page=100&page=3
spaces/d81b4685-e04f-41f3-bc07-63a1d0ba7fa9/apps?page=2&results-per-page=5&order-direction=desc&order-direction-field=creation
spaces/d81b4685-e04f-41f3-bc07-63a1d0ba7fa9/apps?page=1&results-per-page=5&order-direction=asc&order-direction-field=creation
spaces/d81b4685-e04f-41f3-bc07-63a1d0ba7fa9/service_instances?page=1&results-per-page=5&order-direction=desc&order-direction-field=creation&inline-relations-depth=2&include-relations=service_plan,service_bindings,app,space,service
spaces/d81b4685-e04f-41f3-bc07-63a1d0ba7fa9/service_instances?page=1&results-per-page=5&order-direction=asc&order-direction-field=creation&inline-relations-depth=2&include-relations=service_plan,service_bindings,app,space,service
spaces/d81b4685-e04f-41f3-bc07-63a1d0ba7fa9/routes?results-per-page=5&page=1&order-direction=desc&order-direction-field=creation&inline-relations-depth=1&include-relations=domain,apps
spaces/d81b4685-e04f-41f3-bc07-63a1d0ba7fa9/routes?results-per-page=5&page=2&order-direction=desc&order-direction-field=creation&inline-relations-depth=2&include-relations=domain,apps
spaces/d81b4685-e04f-41f3-bc07-63a1d0ba7fa9/routes?results-per-page=5&page=1&order-direction=asc&order-direction-field=creation&inline-relations-depth=2&include-relations=domain,apps
```
</details>

<details>
  <summary>
    Same as above but sorted
  </summary>

```
apps?order-direction=asc&order-direction-field=creation&page=1&results-per-page=100&inline-relations-depth=2&include-relations=space,organization,routes
apps?order-direction=asc&order-direction-field=creation&page=2&results-per-page=100&inline-relations-depth=2&include-relations=space,organization,routes
apps/0e5ac1ac-d84e-4a05-8583-0ac7621622a1/stats?order-direction=desc&order-direction-field=index&page=1&results-per-page=5
apps/0e5ac1ac-d84e-4a05-8583-0ac7621622a1/stats?order-direction=desc&order-direction-field=index&page=1&results-per-page=5
apps/0e5ac1ac-d84e-4a05-8583-0ac7621622a1/stats?order-direction=desc&order-direction-field=index&page=1&results-per-page=5
apps/0e5ac1ac-d84e-4a05-8583-0ac7621622a1/stats?order-direction=desc&order-direction-field=index&results-per-page=5
apps/243d3d8b-74da-4241-af55-ce10f1e24002/stats?order-direction=desc&order-direction-field=index&page=1&results-per-page=5
apps/243d3d8b-74da-4241-af55-ce10f1e24002/stats?order-direction=desc&order-direction-field=index&page=1&results-per-page=5
apps/243d3d8b-74da-4241-af55-ce10f1e24002/stats?order-direction=desc&order-direction-field=index&page=1&results-per-page=5
apps/243d3d8b-74da-4241-af55-ce10f1e24002/stats?order-direction=desc&order-direction-field=index&results-per-page=5
apps/54bd54cb-2937-49b0-9369-a8e501c405e1/stats?order-direction=desc&order-direction-field=index&page=1&results-per-page=5
apps/54bd54cb-2937-49b0-9369-a8e501c405e1/stats?order-direction=desc&order-direction-field=index&page=1&results-per-page=5
apps/54bd54cb-2937-49b0-9369-a8e501c405e1/stats?order-direction=desc&order-direction-field=index&page=1&results-per-page=5
apps/54bd54cb-2937-49b0-9369-a8e501c405e1/stats?order-direction=desc&order-direction-field=index&results-per-page=5
apps/7660ce91-f381-4528-ba01-267d55703323/stats?order-direction=desc&order-direction-field=index&page=1&results-per-page=5
apps/7660ce91-f381-4528-ba01-267d55703323/stats?order-direction=desc&order-direction-field=index&page=1&results-per-page=5
apps/7660ce91-f381-4528-ba01-267d55703323/stats?order-direction=desc&order-direction-field=index&page=1&results-per-page=5
apps/7660ce91-f381-4528-ba01-267d55703323/stats?order-direction=desc&order-direction-field=index&results-per-page=5
apps/8468ba80-d501-4197-8c33-e7df6a9555e4/stats?order-direction=desc&order-direction-field=index&page=1&results-per-page=5
apps/8468ba80-d501-4197-8c33-e7df6a9555e4/stats?order-direction=desc&order-direction-field=index&page=1&results-per-page=5
apps/8468ba80-d501-4197-8c33-e7df6a9555e4/stats?order-direction=desc&order-direction-field=index&page=1&results-per-page=5
apps/8468ba80-d501-4197-8c33-e7df6a9555e4/stats?order-direction=desc&order-direction-field=index&results-per-page=5
apps/ad346d4d-64de-424c-8d4f-48c0602c365e/stats?order-direction=desc&order-direction-field=index&page=1&results-per-page=5
apps/ad346d4d-64de-424c-8d4f-48c0602c365e/stats?order-direction=desc&order-direction-field=index&page=1&results-per-page=5
apps/ad346d4d-64de-424c-8d4f-48c0602c365e/stats?order-direction=desc&order-direction-field=index&page=1&results-per-page=5
apps/ad346d4d-64de-424c-8d4f-48c0602c365e/stats?order-direction=desc&order-direction-field=index&results-per-page=5
apps/b1e1da9b-9c20-475b-9ad8-2f838eb6daa9/stats?order-direction=desc&order-direction-field=index&page=1&results-per-page=5
apps/b1e1da9b-9c20-475b-9ad8-2f838eb6daa9/stats?order-direction=desc&order-direction-field=index&page=1&results-per-page=5
apps/b1e1da9b-9c20-475b-9ad8-2f838eb6daa9/stats?order-direction=desc&order-direction-field=index&page=1&results-per-page=5
apps/b1e1da9b-9c20-475b-9ad8-2f838eb6daa9/stats?order-direction=desc&order-direction-field=index&page=1&results-per-page=5
apps/b1e1da9b-9c20-475b-9ad8-2f838eb6daa9/stats?order-direction=desc&order-direction-field=index&results-per-page=5
apps/ca47f757-caf7-4142-803b-a577c995869f?inline-relations-depth=2&include-relations=stack,space,organization,routes,domain,service_bindings
apps/ca47f757-caf7-4142-803b-a577c995869f/env?order-direction=desc&order-direction-field=name&results-per-page=5&page=1
apps/ca47f757-caf7-4142-803b-a577c995869f/service_bindings?results-per-page=100&page=1
apps/ca47f757-caf7-4142-803b-a577c995869f/service_bindings?results-per-page=100&page=1&order-direction=asc&order-direction-field=creation&inline-relations-depth=2&include-relations=app,service_instance,service,service_plan
apps/ca47f757-caf7-4142-803b-a577c995869f/stats?order-direction=desc&order-direction-field=index&results-per-page=5
apps/ca47f757-caf7-4142-803b-a577c995869f/stats?order-direction=desc&order-direction-field=index&results-per-page=5&page=1
apps/ca47f757-caf7-4142-803b-a577c995869f/stats?order-direction=desc&order-direction-field=index&results-per-page=5&page=1
apps/ca47f757-caf7-4142-803b-a577c995869f/stats?order-direction=desc&order-direction-field=index&results-per-page=5&page=1
apps/ca47f757-caf7-4142-803b-a577c995869f/stats?order-direction=desc&order-direction-field=index&results-per-page=5&page=1
apps/ca47f757-caf7-4142-803b-a577c995869f/summary
apps/d953e846-2a6f-4570-9697-df95f789e8a0/stats?order-direction=desc&order-direction-field=index&page=1&results-per-page=5
apps/d953e846-2a6f-4570-9697-df95f789e8a0/stats?order-direction=desc&order-direction-field=index&page=1&results-per-page=5
apps/d953e846-2a6f-4570-9697-df95f789e8a0/stats?order-direction=desc&order-direction-field=index&page=1&results-per-page=5
apps/d953e846-2a6f-4570-9697-df95f789e8a0/stats?order-direction=desc&order-direction-field=index&page=1&results-per-page=5
apps/d953e846-2a6f-4570-9697-df95f789e8a0/stats?order-direction=desc&order-direction-field=index&results-per-page=5
apps/fe72bac0-6d22-495c-a1d8-67180461f52f/stats?order-direction=desc&order-direction-field=index&results-per-page=5
buildpacks?page=1&results-per-page=100&order-direction=desc&order-direction-field=position
config/feature_flags?page=1&order-direction=desc&order-direction-field=name&results-per-page=25
events?order-direction=desc&order-direction-field=timestamp&q=actee:ca47f757-caf7-4142-803b-a577c995869f&results-per-page=9&page=1
events?q=actee:ca47f757-caf7-4142-803b-a577c995869f&q=actee:ca47f757-caf7-4142-803b-a577c995869f&order-direction=desc&order-direction-field=timestamp&results-per-page=5&page=1
organizations?page=1&results-per-page=100&order-direction=desc&order-direction-field=name&order-by=name&inline-relations-depth=1&include-relations=spaces
organizations?page=1&results-per-page=100&order-direction=desc&order-direction-field=name&order-by=name&inline-relations-depth=2&include-relations=domains,quota_definition,private_domains,spaces,routes,service_instances,apps
organizations?page=2&results-per-page=100&order-direction=desc&order-direction-field=name&order-by=name&inline-relations-depth=1&include-relations=spaces
organizations?page=2&results-per-page=100&order-direction=desc&order-direction-field=name&order-by=name&inline-relations-depth=2&include-relations=domains,quota_definition,private_domains,spaces,routes,service_instances,apps
organizations/54e0be87-02f6-4b5d-b67d-40036a80f4c6/spaces?results-per-page=100&page=1
organizations/54e0be87-02f6-4b5d-b67d-40036a80f4c6/spaces?results-per-page=100&page=1&inline-relations-depth=1&include-relations=routes,service_instances,apps
organizations/78ee5f44-0a33-4544-9fa8-acb0de7155ce/users?page=1&results-per-page=100&order-direction=desc&order-direction-field=username&inline-relations-depth=2&include-relations=organizations,audited_organizations,managed_organizations,billing_managed_organizations,spaces,managed_spaces,audited_spaces
security_groups?page=1&results-per-page=100&order-direction=desc&order-direction-field=name&inline-relations-depth=1&include-relations=spaces
service_brokers?page=1&results-per-page=100&order-direction=desc&order-direction-field=name
service_instances?page=1&results-per-page=100&order-direction=asc&order-direction-field=creation&inline-relations-depth=2&include-relations=service_plan,service_bindings,app,space,service
service_instances?page=1&results-per-page=100&order-direction=asc&order-direction-field=creation&inline-relations-depth=2&include-relations=service_plan,service_bindings,app,space,service
service_instances/b7d411a1-5ab4-4159-a34a-73b9a9b4e733/service_bindings?results-per-page=100&page=1&inline-relations-depth=1&include-relations=app
services?page=1&results-per-page=100&order-direction=desc&order-direction-field=label&inline-relations-depth=2&include-relations=service_plans
services/aebc001e-cf51-4d09-b5cd-d1d024685797
services/aebc001e-cf51-4d09-b5cd-d1d024685797/service_plans?results-per-page=100&page=1
shared_domains?results-per-page=100&page=1
shared_domains/a09e5ec7-ddc4-476d-a431-a45af446d2f2
spaces/d81b4685-e04f-41f3-bc07-63a1d0ba7fa9/apps?page=1&results-per-page=5&order-direction=asc&order-direction-field=creation
spaces/d81b4685-e04f-41f3-bc07-63a1d0ba7fa9/apps?page=1&results-per-page=5&order-direction=desc&order-direction-field=creation
spaces/d81b4685-e04f-41f3-bc07-63a1d0ba7fa9/apps?page=2&results-per-page=5&order-direction=desc&order-direction-field=creation
spaces/d81b4685-e04f-41f3-bc07-63a1d0ba7fa9/routes?results-per-page=5&page=1&order-direction=asc&order-direction-field=creation&inline-relations-depth=2&include-relations=domain,apps
spaces/d81b4685-e04f-41f3-bc07-63a1d0ba7fa9/routes?results-per-page=5&page=1&order-direction=desc&order-direction-field=creation&inline-relations-depth=1&include-relations=domain,apps
spaces/d81b4685-e04f-41f3-bc07-63a1d0ba7fa9/routes?results-per-page=5&page=2&order-direction=desc&order-direction-field=creation&inline-relations-depth=2&include-relations=domain,apps
spaces/d81b4685-e04f-41f3-bc07-63a1d0ba7fa9/service_instances?page=1&results-per-page=5&order-direction=asc&order-direction-field=creation&inline-relations-depth=2&include-relations=service_plan,service_bindings,app,space,service
spaces/d81b4685-e04f-41f3-bc07-63a1d0ba7fa9/service_instances?page=1&results-per-page=5&order-direction=desc&order-direction-field=creation&inline-relations-depth=2&include-relations=service_plan,service_bindings,app,space,service
spaces/d81b4685-e04f-41f3-bc07-63a1d0ba7fa9/user_roles?page=1&results-per-page=100&order-direction=desc&order-direction-field=username&inline-relations-depth=2&include-relations=organizations,audited_organizations,managed_organizations,billing_managed_organizations,spaces,managed_spaces,audited_spaces
stacks?page=1&results-per-page=100&order-direction=desc&order-direction-field=name
stacks/83eaeaa0-dbd0-4ff9-bb28-50adbbce4e78
users?page=1&results-per-page=100&order-direction=desc&order-direction-field=username&inline-relations-depth=1&include-relations=organizations,audited_organizations,managed_organizations,billing_managed_organizations,spaces,managed_spaces,audited_spaces
users/4ea175a6-418d-45d6-933f-5597ab34510c/managed_organizations?results-per-page=100&page=1
users/4ea175a6-418d-45d6-933f-5597ab34510c/managed_organizations?results-per-page=100&page=1
users/4ea175a6-418d-45d6-933f-5597ab34510c/managed_organizations?results-per-page=100&page=1
users/4ea175a6-418d-45d6-933f-5597ab34510c/managed_organizations?results-per-page=100&page=2
users/4ea175a6-418d-45d6-933f-5597ab34510c/managed_organizations?results-per-page=100&page=2
users/4ea175a6-418d-45d6-933f-5597ab34510c/managed_organizations?results-per-page=100&page=2
users/4ea175a6-418d-45d6-933f-5597ab34510c/managed_spaces?results-per-page=100&page=1
users/4ea175a6-418d-45d6-933f-5597ab34510c/managed_spaces?results-per-page=100&page=1
users/4ea175a6-418d-45d6-933f-5597ab34510c/managed_spaces?results-per-page=100&page=1
users/4ea175a6-418d-45d6-933f-5597ab34510c/managed_spaces?results-per-page=100&page=2
users/4ea175a6-418d-45d6-933f-5597ab34510c/managed_spaces?results-per-page=100&page=2
users/4ea175a6-418d-45d6-933f-5597ab34510c/managed_spaces?results-per-page=100&page=2
users/4ea175a6-418d-45d6-933f-5597ab34510c/managed_spaces?results-per-page=100&page=3
users/4ea175a6-418d-45d6-933f-5597ab34510c/managed_spaces?results-per-page=100&page=3
users/4ea175a6-418d-45d6-933f-5597ab34510c/managed_spaces?results-per-page=100&page=3
users/4ea175a6-418d-45d6-933f-5597ab34510c/organizations?results-per-page=100&page=1
users/4ea175a6-418d-45d6-933f-5597ab34510c/organizations?results-per-page=100&page=1
users/4ea175a6-418d-45d6-933f-5597ab34510c/organizations?results-per-page=100&page=1
users/4ea175a6-418d-45d6-933f-5597ab34510c/organizations?results-per-page=100&page=2
users/4ea175a6-418d-45d6-933f-5597ab34510c/organizations?results-per-page=100&page=2
users/4ea175a6-418d-45d6-933f-5597ab34510c/organizations?results-per-page=100&page=2
users/4ea175a6-418d-45d6-933f-5597ab34510c/spaces?results-per-page=100&page=1
users/4ea175a6-418d-45d6-933f-5597ab34510c/spaces?results-per-page=100&page=1
users/4ea175a6-418d-45d6-933f-5597ab34510c/spaces?results-per-page=100&page=1
users/4ea175a6-418d-45d6-933f-5597ab34510c/spaces?results-per-page=100&page=2
users/4ea175a6-418d-45d6-933f-5597ab34510c/spaces?results-per-page=100&page=2
users/4ea175a6-418d-45d6-933f-5597ab34510c/spaces?results-per-page=100&page=2
users/4ea175a6-418d-45d6-933f-5597ab34510c/spaces?results-per-page=100&page=3
users/4ea175a6-418d-45d6-933f-5597ab34510c/spaces?results-per-page=100&page=3
users/4ea175a6-418d-45d6-933f-5597ab34510c/spaces?results-per-page=100&page=3
users/ec7c596c-1b75-4e66-aad8-2376e03dccce/managed_organizations?results-per-page=100&page=1
users/ec7c596c-1b75-4e66-aad8-2376e03dccce/managed_organizations?results-per-page=100&page=1
users/ec7c596c-1b75-4e66-aad8-2376e03dccce/managed_organizations?results-per-page=100&page=1
users/ec7c596c-1b75-4e66-aad8-2376e03dccce/managed_organizations?results-per-page=100&page=2
users/ec7c596c-1b75-4e66-aad8-2376e03dccce/managed_organizations?results-per-page=100&page=2
users/ec7c596c-1b75-4e66-aad8-2376e03dccce/managed_organizations?results-per-page=100&page=2
users/ec7c596c-1b75-4e66-aad8-2376e03dccce/organizations?results-per-page=100&page=1
users/ec7c596c-1b75-4e66-aad8-2376e03dccce/organizations?results-per-page=100&page=1
users/ec7c596c-1b75-4e66-aad8-2376e03dccce/organizations?results-per-page=100&page=1
users/ec7c596c-1b75-4e66-aad8-2376e03dccce/organizations?results-per-page=100&page=2
users/ec7c596c-1b75-4e66-aad8-2376e03dccce/organizations?results-per-page=100&page=2
users/ec7c596c-1b75-4e66-aad8-2376e03dccce/organizations?results-per-page=100&page=2
users/f2d71b96-4268-4a29-b8a1-88c856ee7f75/spaces?results-per-page=100&page=1
users/f2d71b96-4268-4a29-b8a1-88c856ee7f75/spaces?results-per-page=100&page=1
users/f2d71b96-4268-4a29-b8a1-88c856ee7f75/spaces?results-per-page=100&page=1
```
</details>

## Summary

### Current v2 Issues

- Most lists fetch all entities up front to provide a reasonable level of sorting and filtering
  - API provides limited sorting and filtering capabilities
  - Sorting is mostly just on `creation_date`
  - Filtering sometimes contains org, space and name, but not all
  > Desired - Lists of entities can be sorted or filtered on any top level property
- Calculated numerical summary stats (number of applications in an organisation, cumulative total of memory from running apps in an
  organisation, number of users etc) requires fetching all entities of a certain type. This can be quite a costly set of requests.
  > Desired - `counts` API which, given a filter, could sum up a selection of numerical properties of collection of entities. Some of this
    may already be possible by making individual requests with `results-per-page=1` & `total_results` and `q` filters, however a neat way to
    combine these into a single request would be awesome
- Determining an informative application state requires an additional request to the `application/<guid>/stats` endpoint.
  > Desired - It would massively improve Stratos performance if the APIs to list applications and retrieve a specific application could
    return the app stats for the application(s). If this is not possibly, an app stats call that can return stats for all running
    applications would help.
- Fetching a list of users for non-admins can be expensive if there are many organizations.
  > Desired - In an ideal world non-admins would be able to hit `/users` and get the same response as hitting all if their visible
    `organization/guid/users` endpoints.
- The user entities that are returned by the `/users` request contain a lot of duplicated organisation and space entities.
  > Desired - Entities are listed in a common bucket and referenced by guid inline. Think this might be how v3 works
- The `<role>_url` in a user entity can only be called by an administrator or by the same user
  > Desired - URL behaves as per the `/users` suggestion above the response contains the organisaitons that are visible to the user that
    calls the url
- `include-relations` works by specifying the name of the child property. If the inline-depth is greater than one this can lead relations being fetched that might not actually be required
  > Desired - Minor nice to have. Be able to specify relations like `include-relations=application-route,route-domain`

### Critical v2 Features

- Where exposed, sort order and filtering via `q`
- Arbitrary entity relations can be fetched or not fetched. The way we store and retrieve entity/s would break down without this generic process
- The API provides a url (`<property name>_url`) to fetch missing entity relations. As per relations, without this we'd need a process to
  generically make up the url for any given relationships
