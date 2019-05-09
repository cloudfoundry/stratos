import { NgModule } from '@angular/core';
import { IAppFavMetadata, IOrgFavMetadata, ISpaceFavMetadata } from '../../core/src/cf-favourite-types';
import { IApp, IOrganization, ISpace } from '../../core/src/core/cf-api.types';
import { EntityCatalogueService } from '../../core/src/core/entity-catalogue/entity-catalogue.service';
import {
  IStratosEndpointDefinition,
  StratosCatalogueEndpointEntity,
  StratosCatalogueEntity
} from '../../core/src/core/entity-catalogue/entity-catalogue.types';
import {
  applicationSchemaKey,
  endpointSchemaKey,
  entityFactory,
  organizationSchemaKey,
  spaceSchemaKey
} from '../../store/src/helpers/entity-factory';
import { APIResource } from '../../store/src/types/api.types';
import {
  CfEndpointDetailsComponent
} from './shared/components/cf-endpoint-details/cf-endpoint-details.component';
import {
  CloudFoundryComponentsModule
} from './shared/components/components.module';
import { BaseEndpointAuth } from '../../core/src/features/endpoints/endpoint-auth';

@NgModule({
  imports: [
    CloudFoundryComponentsModule
  ],
})
export class CloudFoundryModule {

  constructor(
    private entityCatalogueService: EntityCatalogueService
  ) {
    this.registerCfFavoriteMappers();
  }
  private registerCfFavoriteMappers() {
    const endpointDefinition = {
      type: 'cf',
      schema: entityFactory(endpointSchemaKey),
      label: 'Cloud Foundry',
      labelPlural: 'Cloud Foundry',
      icon: 'cloud_foundry',
      iconFont: 'stratos-icons',
      logoUrl: '/core/assets/endpoint-icons/cloudfoundry.png',
      authTypes: [BaseEndpointAuth.UsernamePassword, BaseEndpointAuth.SSO],
      listDetailsComponent: CfEndpointDetailsComponent,
    } as IStratosEndpointDefinition;
    this.registerCfEndpointMapper(endpointDefinition);
    this.registerCfApplicationMapper(endpointDefinition);
    this.registerCfSpaceMapper(endpointDefinition);
    this.registerCfOrgMapper(endpointDefinition);
  }

  private registerCfEndpointMapper(endpointDefinition: IStratosEndpointDefinition) {
    const cfEntity = new StratosCatalogueEndpointEntity(
      endpointDefinition,
      metadata => `/cloud-foundry/${metadata.guid}`,
    );
    this.entityCatalogueService.register(cfEntity);
  }

  private registerCfApplicationMapper(endpointDefinition: IStratosEndpointDefinition) {
    const applicationDefinition = {
      type: applicationSchemaKey,
      schema: entityFactory(applicationSchemaKey),
      label: 'Application',
      labelPlural: 'Applications',
      endpoint: endpointDefinition
    };
    const applicationEntity = new StratosCatalogueEntity<IAppFavMetadata, APIResource<IApp>>(
      applicationDefinition,
      {
        getMetadata: app => ({
          guid: app.metadata.guid,
          cfGuid: app.entity.cfGuid,
          name: app.entity.name,
        }),
        getLink: metadata => `/applications/${metadata.cfGuid}/${metadata.guid}/summary`,
        getGuid: metadata => metadata.guid,
      }
    );
    this.entityCatalogueService.register(applicationEntity);
  }

  private registerCfSpaceMapper(endpointDefinition: IStratosEndpointDefinition) {
    const spaceDefinition = {
      type: spaceSchemaKey,
      schema: entityFactory(spaceSchemaKey),
      label: 'Space',
      labelPlural: 'Spaces',
      endpoint: endpointDefinition
    };
    const spaceEntity = new StratosCatalogueEntity<ISpaceFavMetadata, APIResource<ISpace>>(
      spaceDefinition,
      {
        getMetadata: space => ({
          guid: space.metadata.guid,
          orgGuid: space.entity.organization_guid ? space.entity.organization_guid : space.entity.organization.metadata.guid,
          name: space.entity.name,
          cfGuid: space.entity.cfGuid,
        }),
        getLink: metadata => `/cloud-foundry/${metadata.cfGuid}/organizations/${metadata.orgGuid}/spaces/${metadata.guid}/summary`,
        getGuid: metadata => metadata.guid
      }
    );
    this.entityCatalogueService.register(spaceEntity);
  }
  private registerCfOrgMapper(endpointDefinition: IStratosEndpointDefinition) {
    const orgDefinition = {
      type: organizationSchemaKey,
      schema: entityFactory(organizationSchemaKey),
      label: 'Organization',
      labelPlural: 'Organizations',
      endpoint: endpointDefinition
    };
    const orgEntity = new StratosCatalogueEntity<IOrgFavMetadata, APIResource<IOrganization>>(
      orgDefinition,
      {
        getMetadata: org => ({
          guid: org.metadata.guid,
          status: this.getOrgStatus(org),
          name: org.entity.name,
          cfGuid: org.entity.cfGuid,
        }),
        getLink: metadata => `/cloud-foundry/${metadata.cfGuid}/organizations/${metadata.guid}`,
        getGuid: metadata => metadata.guid
      }
    );
    this.entityCatalogueService.register(orgEntity);
  }
  private getOrgStatus(org: APIResource<IOrganization>) {
    if (!org || !org.entity || !org.entity.status) {
      return 'Unknown';
    }
    return org.entity.status.charAt(0).toUpperCase() + org.entity.status.slice(1);
  }
}
