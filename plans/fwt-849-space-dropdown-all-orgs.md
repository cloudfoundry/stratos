# FWT-849: Space Dropdown Shows All Spaces When Org Is "All"

## Problem

When the Organization filter is set to "All", the Space dropdown is disabled.
`createSpace()` depends on a selected org GUID to find spaces — with no org
selected, the space list is empty and `filterIsReady$` disables the dropdown.

## Design

### Label convention

Dropdown labels follow **primary dimension first, qualifier in parentheses**:

| Dropdown | When parent is "All" | Label format |
|----------|---------------------|--------------|
| Space | Org = "All" | `space (org)` |
| Org | CF endpoint = "All" | `org (endpoint)` (future) |

The acted-upon dimension leads; the disambiguator follows in parentheses.
This groups by the primary dimension when sorted alphabetically, matching
the operator's mental model: "I'm looking for a space, the org is context."

### Implementation

**File:** `cf-org-space-service.service.ts` — `createSpace()` method

When `selectedOrgGuid` is falsy ("All"):
1. Iterate all orgs from `allOrgs.entities$`
2. Collect spaces from each org, deduplicate by GUID (first occurrence wins)
3. Set `entity.name = "${space.entity.name} (${org.entity.name})"`
4. Sort alphabetically — groups by space name, then by org within ties

When `selectedOrgGuid` has a value: existing behavior (plain space name).

No other files changed — `filterIsReady$` already enables the dropdown when
`hasItems$` is true, and `space_guid` q-param filter works regardless of org.

### GUID deduplication

Spaces are deduplicated by GUID using a `Set`. In CF deployments, the same
space GUID never appears under multiple orgs, but the guard prevents
duplicates if the org list contains stale data from multiple pagination pages.

## Use cases

**Operator — incident triage:** Filter by space name to see a service tier
across all orgs/regions (e.g., "production" across us-east, eu-central).

**Developer — discovery:** "Where's my app? I know it's in 'development'
but forget which org." Select space, see all matches.

**Fleet overview:** Count apps in a named space across all orgs without
switching org dropdown repeatedly.

## Phase 2: "View by" preset filter

Future ticket under FWT-811. A 4th dropdown at the start of the filter bar
that controls the dimension order of the other three dropdowns. Six presets
from the permutations of endpoint/org/space. Inspired by OLAP pivot
dimension switching.

## Verification

1. Set Organization to "All" → Space dropdown enabled
2. Spaces listed as `space (org)` sorted alphabetically
3. Select a space → list filters by that space GUID
4. Select an org → space dropdown shows plain space names
5. Back to "All" → `space (org)` labels return
6. No duplicate spaces (deduplicated by GUID)
