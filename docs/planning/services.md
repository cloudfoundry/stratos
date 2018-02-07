# Services

The goal with this feature is to provide first-class Services support in Stratos. Up to now, Services support was limited to:

- Viewing the service instances in a space and being able to delete these
- Creating a service instance an bind it to an application

Going forward, we want to be able to expose all fo the concepts around Services that are exposed via the API, namely:

- Services
- Service Instances
- Service Keys
- Service Plans (and plan visibility)
- User-provided Service Instances
- Service brokers

## First Class Support

By "First class Support" we mean that Services will become a top-level item in the side-navigation menu, much like Applications is today.

Since Stratos allows multiple CLoud Foundry deployments to be manged, this means that the Services views we add will need to aggregate service information in the same was that the Applciations view does, including being able ot filter by a specific Cloud Foundry deployment, org and space.

Unlike the Appliction view, where we only have one entity to display (i.e. Applications), for Services, there are a number of entities that we may wish to choose from:

- Services (i.e. the marketplace or catalog)
- Service Instances (the actual instances that have been created form the cataalog)
- Service Plans
- Service Keys
- User-provided Service Instances



