# Architecture

This framework is composed of three layers (View, Model and API) and an event bus that spans all three layers.

![layers](docs/images/greenbox_architecture.png "Three layers and an event bus")

Each layer only has access to the layer directly below.

Allowed:
* Model layer -> API layer
* View (MVVC) layer -> Model layer

Not Allowed:
* View (MVVC) layer -> API layer
* Model layer -> View (MVVC) layer
* API layer -> View (MVVC) layer or Model layer

### Event Bus

Event bus spans all layers; therefore, each layer has access to the event bus. The event bus provides a loose-coupling approach to allow communication between:

* View (MVVC) layer -> API layer
* Model layer -> View (MVVC) layer
* API layer -> View (MVVC) layer or Model layer