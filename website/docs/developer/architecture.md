---
title: Architecture
sidebar_label: Architecture
---

This document describes the internal architecture of the Stratos Console
frontend. Each section covers a major subsystem. The intent is to give
developers enough context to navigate the codebase, understand design
decisions, and extend Stratos effectively.

All file paths below are relative to `src/frontend/`.

---

## Home Page

The home page displays a grid of cards, one per connected endpoint instance.
A layout selector lets users choose how many columns to use, accommodating
different numbers of endpoints and screen sizes.

### Endpoint Types vs Endpoint Instances

Stratos distinguishes between **endpoint types** and **endpoint instances**:

- An **endpoint type** (e.g. `cf`, `k8s`) is registered once in the entity
  catalog. It defines *how* to render a home card for that type of endpoint.
- An **endpoint instance** is a specific registered connection (e.g.
  "CF Production", "CF Staging") identified by a unique `guid`.

Multiple instances of the same type can coexist. Two Cloud Foundry endpoints
will each get their own card on the home page, each showing independent data.

### Home Card Resolution

Each endpoint type can optionally register a `homeCard` in its entity catalog
definition. The `homeCard` metadata specifies:

| Property | Purpose |
|----------|---------|
| `component` | Factory function that returns the Angular component to render |
| `shortcuts` | Function returning shortcut links for the endpoint |
| `fullView` | Whether favorites should render below content instead of beside it |
| `columnSpan` | Number of grid columns the card should span (default: 1) |

The interface is defined in
`packages/store/src/entity-catalog/entity-catalog.types.ts`.

#### Resolution Flow

For each connected endpoint instance, the home page:

1. Iterates `endpoints$`, an observable of all connected endpoint instances
   that have a home card definition
2. Renders an `app-home-page-endpoint-card` wrapper for each instance
3. The wrapper looks up the endpoint type definition via
   `entityCatalog.getEndpoint(ep.cnsi_type, ep.sub_type)`
4. If the type has a `homeCard.component`, it dynamically compiles and
   instantiates that component
5. If no `homeCard` is registered, it falls back to
   `DefaultEndpointHomeComponent`
6. The specific endpoint instance is passed to the component via its
   `endpoint` input

#### Key Files

| File | Purpose |
|------|---------|
| `packages/core/src/features/home/home/home-page.component.ts` | Builds the endpoint list, manages layout and card loading |
| `packages/core/src/features/home/home/home-page-endpoint-card/home-page-endpoint-card.component.ts` | Wrapper that resolves and instantiates the correct card component |
| `packages/core/src/features/home/home.types.ts` | `HomePageEndpointCard` interface and `HomePageCardLayout` class |
| `packages/store/src/entity-catalog/entity-catalog.types.ts` | `HomeCardMetadata` interface |

### Registered Home Cards

| Endpoint Type | Component | Content | Span | Registration |
|---------------|-----------|---------|------|--------------|
| Cloud Foundry (`cf`) | `CFHomeCardComponent` | App/Org/Route counts, recent apps list, deploy tiles | 2 | `packages/cloud-foundry/src/cf-entity-generator.ts` |
| Kubernetes (`k8s`) | `KubernetesHomeCardComponent` | Node/Namespace/Pod counts, shortcut links | 1 | `packages/kubernetes/src/kubernetes/kubernetes-entity-generator.ts` |
| All others | `DefaultEndpointHomeComponent` | Instance URL with clipboard copy | 1 | Built-in fallback |

### The HomePageEndpointCard Interface

Any component used as a home card must implement this interface
(`packages/core/src/features/home/home.types.ts`):

```typescript
export abstract class HomePageEndpointCard {
  public layout: HomePageCardLayout;
  public endpoint!: EndpointModel;
  public load: () => Observable<boolean>;
}
```

- `layout` -- Receives the current layout configuration from the parent
- `endpoint` -- The specific endpoint instance this card represents
- `load()` -- Called by the parent when the card scrolls into view;
  returns an observable that emits `true` when loading is complete

### Layout System

The home page offers six layout modes:

| Layout | Columns (x) | Density (y) | Use Case |
|--------|-------------|-------------|----------|
| Automatic | varies | varies | Picks layout based on endpoint count |
| Single Column | 1 | 1 | 1-2 endpoints, full detail |
| Compact Single | 1 | 2 | 1-2 endpoints, reduced detail |
| Two Column | 2 | 1 | 3-4 endpoints side by side |
| Compact Two Column | 2 | 2 | 3-4 endpoints, reduced detail |
| Three Column | 3 | 2 | 5+ endpoints, minimal detail |

The `HomePageCardLayout` class carries `x` (columns) and `y` (density) values.
Child card components use these to adapt their display -- hiding sections,
adjusting row counts, or changing sidebar widths.

#### Automatic Layout Selection

When set to "Automatic", the layout is chosen based on how many connected
endpoints have home cards:

| Endpoint Count | Selected Layout |
|----------------|-----------------|
| 1 | Single Column (1,1) |
| 2 | Compact Single (1,2) |
| 3-4 | Compact Two Column (2,2) |
| 5+ (mostly wide) | Compact Two Column (2,2) |
| 5+ (mostly compact) | Three Column (3,2) |

When more than half the endpoints declare `columnSpan > 1`, automatic mode
caps at 2 columns to avoid empty gaps in the grid.

#### Card Loading Strategy

Cards are not loaded all at once. The home page monitors scroll position and
only calls `load()` on cards that are visible in the viewport. This prevents
unnecessary API calls for endpoints whose cards are off-screen.

### Adding a Home Card for a New Endpoint Type

To add a custom home card for a new endpoint type:

1. Create a component that implements `HomePageEndpointCard`
2. In your endpoint's entity catalog definition, add a `homeCard` property:

```typescript
homeCard: {
  component: () => import('./home/my-home-card.component').then(m => m.MyHomeCardComponent),
  fullView: false,
  columnSpan: 2
}
```

3. Your component will receive:
   - `endpoint` -- the specific endpoint instance
   - `layout` -- the current layout, updated when the user changes it
   - A call to `load()` when the card becomes visible

4. Use `layout.x` and `layout.y` to adapt your display for different
   column counts and density modes

If no `homeCard` is registered, endpoints will still appear on the home page
using the default card, which shows the instance URL.

### Column Spanning

Cards can declare `columnSpan` in their `homeCard` registration to request
more horizontal space in multi-column layouts. The grid applies
`grid-column: span N` to each card's container, clamped to the available
column count so a span-2 card in a 1-column layout simply fills the full
width.

The CSS grid uses `grid-auto-flow: dense` to backfill gaps. When a span-2
card leaves an empty cell in a row, smaller cards fill forward into the gap
rather than leaving whitespace.

#### Behavior by Layout

| Declared Span | 1-col grid | 2-col grid | 3-col grid |
|---------------|-----------|-----------|-----------|
| 1 | Full width | Half width | Third width |
| 2 | Full width (clamped) | Full width | Two-thirds width |
| 3 | Full width (clamped) | Full width (clamped) | Full width |

#### Composition Edge Cases

When most cards are wide, column count matters:

- 3 CF instances (all span 2) in a 3-column grid: each spans 2 columns,
  column 3 is permanently empty. Automatic mode avoids this by capping at
  2 columns when more than half the cards are wide.
- Manual layout modes are not capped — users can still select 3-column if
  they want to, accepting the trade-off.

### Design Considerations

The CF home card is notably more complex than others. It displays summary
metrics (apps, orgs, routes), a variable-length recent apps list, and deploy
action tiles. This density means it benefits from wider column widths,
particularly in single-column and two-column layouts. CF declares
`columnSpan: 2` so it spans the full width in multi-column grids.

When designing a new home card, aim for content that scales gracefully across
all layout modes. The K8s card is a good model -- summary counts and shortcut
links that work well at any width. Cards with scrolling lists or tables
(like CF's recent apps) should declare a wider `columnSpan` and include
layout-aware logic to adjust row counts and hide sections in compact modes.
