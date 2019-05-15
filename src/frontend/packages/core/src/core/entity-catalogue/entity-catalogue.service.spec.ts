import { TestBed } from '@angular/core/testing';

import { EntitySchema } from '../../../../store/src/helpers/entity-factory';
import { BaseEndpointAuth } from '../../features/endpoints/endpoint-auth';
import {
  CfEndpointDetailsComponent
} from '../../../../cloud-foundry/src/shared/components/cf-endpoint-details/cf-endpoint-details.component';
import { IStratosEndpointDefinition, StratosCatalogueEntity } from './entity-catalogue.types';
import { entityCatalogue } from './entity-catalogue.service';

fdescribe('EntityCatalogueService', () => {
  function getEndpointDefinition() {
    return {
      type: 'endpointType',
      label: 'Cloud Foundry',
      labelPlural: 'Cloud Foundry',
      icon: 'cloud_foundry',
      iconFont: 'stratos-icons',
      logoUrl: '/core/assets/endpoint-icons/cloudfoundry.png',
      authTypes: [BaseEndpointAuth.UsernamePassword, BaseEndpointAuth.SSO],
      listDetailsComponent: CfEndpointDetailsComponent,
    } as IStratosEndpointDefinition;
  }
  function getDefaultSchema() {
    return new EntitySchema('entitySchema1');
  }
  function getSchema(modifier: string) {
    return new EntitySchema('entitySchema1' + modifier);
  }
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should create correct id', () => {
    const endpoint = getEndpointDefinition();
    const definition = {
      type: 'entity',
      schema: getDefaultSchema(),
      endpoint
    };
    entityCatalogue.register(new StratosCatalogueEntity(definition));

    const catalogueEntity = entityCatalogue.getEntity(endpoint.type, definition.type);
    expect(catalogueEntity.id).toBe(endpoint.type + 'Entity');
  });

  it('should get default schema from single schema', () => {
    const endpoint = getEndpointDefinition();
    const definition = {
      type: 'entity',
      schema: getDefaultSchema(),
      endpoint
    };
    entityCatalogue.register(new StratosCatalogueEntity(definition));

    const catalogueEntity = entityCatalogue.getEntity(endpoint.type, definition.type);
    const schema = catalogueEntity.getSchema();
    expect(schema).not.toBeUndefined();
    expect(schema.key).toEqual(getDefaultSchema().key);
  });

  it('should get default schema from multiple schemas', () => {
    const endpoint = getEndpointDefinition();
    const defaultSchema = getDefaultSchema();
    const definition = {
      type: 'entity2',
      schema: {
        default: defaultSchema,
        entitySchema2: getSchema('1')
      },
      endpoint
    };
    entityCatalogue.register(new StratosCatalogueEntity(definition));

    const catalogueEntity = entityCatalogue.getEntity(endpoint.type, definition.type);
    const schema = catalogueEntity.getSchema();
    expect(schema).not.toBeUndefined();
    expect(schema).toEqual(defaultSchema);
  });

  it('should get non-default schema from multiple schemas', () => {
    const endpoint = getEndpointDefinition();
    const nonDefaultSchema = getSchema('1');
    const definition = {
      type: 'entity3',
      schema: {
        default: getDefaultSchema(),
        nonDefaultSchema
      },
      endpoint
    };
    entityCatalogue.register(new StratosCatalogueEntity(definition));

    const catalogueEntity = entityCatalogue.getEntity(endpoint.type, definition.type);
    const schema = catalogueEntity.getSchema('nonDefaultSchema');
    expect(schema).not.toBeUndefined();
    expect(schema).toEqual(nonDefaultSchema);
  });
});
