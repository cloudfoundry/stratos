# Services

GitHub issue: [\#1391](https://github.com/cloudfoundry-incubator/stratos/issues/1391)

The goal with this feature is to provide first-class Services support in Stratos. Up until now, Services support was limited to:

- Viewing the service instances in a space and being able to delete these
- Creating a service instance an bind it to an application

Going forward, we want to be able to expose all fo the concepts around Services that are exposed via the API, namely:

- Services
- Service Instances
- Service Keys
- Service Plans (and plan visibility)
- User-provided Service Instances
- Service brokers

We also want to track the Open Service Request Broker work and ensure that thi sis reflected in Stratos.

## First Class Support

By "First class Support" we mean that Services will become a top-level item in the side-navigation menu, much like Applications is today.

Since Stratos allows multiple Cloud Foundry deployments to be manged, this means that the Services views we add will need to aggregate service information in the same was that the Applications view does, including being able ot filter by a specific Cloud Foundry deployment, org and space.

Unlike the Application view, where we only have one entity to display (i.e. Applications), for Services, there are a number of entities that we may wish to choose from:

- Services (i.e. the marketplace or catalog)
- Service Instances (the actual instances that have been created from the catalog)
- Service Plans
- Service Keys
- Service Plan Visibilities
- User-provided Service Instances

## UX

(Thanks to Guillaume Berche and team for their input)

To distinguish between the Service Catalog (Marketplace) and Service Instances, we will break-out two top-level navigation items that will appear in the left-hand nav bar:

1. Marketplace - showing the Service Catalog

1. Services - showing Service Instances

### Marketplace

This will show the Service Catalog. When multiple Cloud Foundry deployments are connected, we will show a filter control to filter the view by CF/Org/Space as we do with applications.

Provides both a card and list view.

Clicking on a card or name in the list will take the user to a more detailed Service Definition View.


#### Service Definition View

This shows:

- Metadata as per the card/list
- Service long description (although)
- Service plans (and not the aggregated number of service plans) as depending on the current logged in user, the visible service plans differ) along with their description and meta-data (including price)
- Button to enable a service instance to be created for this service

(ref: https://apidocs.cloudfoundry.org/1.27.0/services/retrieve_a_particular_service.html)

### Services

This will show Service Instances. When multiple Cloud Foundry deployments are connected, we will show a filter control to filter the view by CF/Org/Space as we do with applications.

Provides both a card and list view.

This shows:

- General metadata
- Which space the service belongs to
- Which spaces the service has been shared with

Clicking of a Service Instance will drill down into a Service Instance Detail view.

#### Service Instance Detail View

Shows:

- General Metadata
- Service plan
- Service parameters (in the future thanks to OSB GET endpoints see [servicebroker/issues/159](https://github.com/openservicebrokerapi/servicebroker/issues/159)
- Service keys for this instance

Enable updates:
- in service plans
- in parameters

Enable delete

### Service Instance Creation

Selection of service plan
Selection of org and space
Supports parameters with generated form created from JSON schema, see [stratos/issues/1434](https://github.com/cloudfoundry-incubator/stratos/issues/1434) 


### Services Binding Detail view

This will show a Service Binding.

Shows:

- Service Instance 
- Bound Application (optional)
- Service binding parameters (in the future thanks to OSB GET endpoints see [servicebroker/issues/159](https://github.com/openservicebrokerapi/servicebroker/issues/159)
- Credentials (using JSON or in the future generated form thanks to binding credentials output JSON schemas [servicebroker/issues/116](https://github.com/openservicebrokerapi/servicebroker/issues/116)

Enables updates:
- in parameters (in future OSB spec version)

Enables delete (i.e. unbind service from app)
