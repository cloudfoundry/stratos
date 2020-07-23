# Cloud Foundry Scaling - How Stratos Handles Large Lists

Stratos presents collections of entities via the Stratos list component. The list component presents the collection in a paginated, sortable and searchable way in either a set of cards or a table.
In order to achieve this, due to the limitations of the APIs used, the list may fetch all entities (as opposed to fetching entities for the visible page only) and paginate, sort and search locally.

## Protecting Stratos from Large Collections
In some cases the number of entities in a collection can be incredibly high. Stratos can decide to not fetch them all in order to protect the CF from
a substantial number of requests. To do this the first page is fetched and the total number of entities is checked against a limit. If under
the limit the remaining pages are asynchronously fetched. If over then the remaining pages are ignored and the user is informed that the list could not fetch all entities.

Depending on the list, the user can then try to filter the collection such that the number of entities is below the limit. Depending on configuration
the user also has the option to fetch all entities regardless of the limit.

## Applicable Lists
Currently, in 3.1.0, this large collection protection is only applicable to the following lists

- Application Wall
- Marketplace (Services)
- Services (Service & User Provided Service Instances)
- CF, Organisation and Space Users
- CF Routes

In the future we hope to expand this to all lists.

## Determining the List Limit
The limit at which we won't fetch all entities is determined, in least important to most important order, by

1) The global CF default - 600
2) The Jetstream override for all lists - by default not set

In the future we hope to allow each end user of Stratos to determine their own limit (if they have the correct permissions).

## Fetch All feature
If the list hits the limit the user will be presented with a button to `Fetch All` entities. Clicking this button ensures the list reverts
back as if there were no limit and thus fetching all entities. This feature is disabled by default and can be enabled by a Jetstream override.

## Configuration
The Jetstream overrides can be set via environment variable, or if in helm, as values.

Environment Variable|Helm Value|Description|Default|
|---|---|---|---|
|`UI_LIST_MAX_SIZE`|`console.ui.listMaxSize`|Override the default maximum number of entities that a configured list can fetch. When a list meets this amount additional pages are not fetched||
|`UI_LIST_ALLOW_LOAD_MAXED`|`console.ui.listAllowLoadMaxed`|If the maximum list size is met give the user the option to fetch all results|false|