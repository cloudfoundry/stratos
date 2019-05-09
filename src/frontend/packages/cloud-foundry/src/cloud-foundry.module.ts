import { NgModule } from '@angular/core';
import { IAppFavMetadata, IOrgFavMetadata, ISpaceFavMetadata } from '../../core/src/cf-favourite-types';
import { IApp, IOrganization, ISpace } from '../../core/src/core/cf-api.types';
import { EntityCatalogueService } from '../../core/src/core/entity-catalogue/entity-catalogue.service';
import {
  IStratosEndpointDefinition,
  StratosCatalogueEndpointEntity,
  StratosCatalogueEntity
} from '../../core/src/core/entity-catalogue/entity-catalogue.types';
import { StratosExtension } from '../../core/src/core/extension/extension-service';
import { EndpointTypeExtensionConfig } from '../../core/src/core/extension/extension-types';
import { urlValidationExpression } from '../../core/src/core/utils.service';
import { EndpointAuthTypeNames, getFullEndpointApiUrl } from '../../core/src/features/endpoints/endpoint-helpers';
import {
  applicationSchemaKey,
  endpointSchemaKey,
  entityFactory,
  organizationSchemaKey,
  spaceSchemaKey
} from '../../store/src/helpers/entity-factory';
import { APIResource } from '../../store/src/types/api.types';
import { EndpointModel } from '../../store/src/types/endpoint.types';
import { IEndpointFavMetadata } from '../../store/src/types/user-favorites.types';
import {
  CfEndpointDetailsComponent
} from './shared/components/cf-endpoint-details/cf-endpoint-details.component';
import {
  CloudFoundryComponentsModule
} from './shared/components/components.module';
import { BaseEndpointAuth } from '../../core/src/features/endpoints/endpoint-auth';



export const cloudFoundryEndpointTypes: EndpointTypeExtensionConfig[] = [{
  type: 'cf',
  label: 'Cloud Foundry',
  urlValidation: urlValidationExpression,
  icon: 'cloud_foundry',
  iconFont: 'stratos-icons',
  imagePath: '/core/assets/endpoint-icons/cloudfoundry.png',
  homeLink: (guid) => ['/cloud-foundry', guid],
  listDetailsComponent: CfEndpointDetailsComponent,
  order: 0,
  authTypes: [EndpointAuthTypeNames.CREDS, EndpointAuthTypeNames.SSO]
}];

@StratosExtension({
  endpointTypes: cloudFoundryEndpointTypes,
})
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
    // favoritesConfigMapper.registerFavoriteConfig<APIResource<IApp>, IAppFavMetadata>(new FavoriteConfig({
    //   endpointType,
    //   entityType: applicationSchemaKey
    // },
    //   'Application',
    //   (app: IAppFavMetadata) => {
    //     return {
    //       type: applicationSchemaKey,
    //       routerLink: `/applications/${app.cfGuid}/${app.guid}/summary`,
    //       name: app.name
    //     };
    //   },
    //   app => ({
    //     guid: app.metadata.guid,
    //     cfGuid: app.entity.cfGuid,
    //     name: app.entity.name,
    //   })
    // ));
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
    // favoritesConfigMapper.registerFavoriteConfig<APIResource<ISpace>, ISpaceFavMetadata>(new FavoriteConfig({
    //   endpointType,
    //   entityType: spaceSchemaKey
    // },
    //   'Space',
    //   (space: ISpaceFavMetadata) => {
    //     return {
    //       type: spaceSchemaKey,
    //       routerLink: `/cloud-foundry/${space.cfGuid}/organizations/${space.orgGuid}/spaces/${space.guid}/summary`,
    //       name: space.name
    //     };
    //   },
    //   space => ({
    //     guid: space.metadata.guid,
    //     orgGuid: space.entity.organization_guid ? space.entity.organization_guid : space.entity.organization.metadata.guid,
    //     name: space.entity.name,
    //     cfGuid: space.entity.cfGuid,
    //   })
    // ));
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
    // favoritesConfigMapper.registerFavoriteConfig<APIResource<IOrganization>, IOrgFavMetadata>(new FavoriteConfig({
    //   endpointType,
    //   entityType: organizationSchemaKey
    // },
    //   'Organization',
    //   (org: IOrgFavMetadata) => ({
    //     type: organizationSchemaKey,
    //     routerLink: `/cloud-foundry/${org.cfGuid}/organizations/${org.guid}`,
    //     name: org.name
    //   }),
    //   org => ({
    //     guid: org.metadata.guid,
    //     status: this.getOrgStatus(org),
    //     name: org.entity.name,
    //     cfGuid: org.entity.cfGuid,
    //   })
    // ));
  }
  private getOrgStatus(org: APIResource<IOrganization>) {
    if (!org || !org.entity || !org.entity.status) {
      return 'Unknown';
    }
    return org.entity.status.charAt(0).toUpperCase() + org.entity.status.slice(1);
  }
}
