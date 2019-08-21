import { EntitySchema } from '../../../../store/src/helpers/entity-schema';
import { endpointEntitySchema } from '../../base-entity-schemas';
import { BaseEndpointAuth } from '../../features/endpoints/endpoint-auth';
import { EndpointListDetailsComponent } from '../../shared/components/list/list-types/endpoint/endpoint-list.helpers';
import { StratosCatalogueEndpointEntity, StratosCatalogueEntity } from './entity-catalogue-entity';
import { TestEntityCatalogue } from './entity-catalogue.service';
import { IStratosEndpointDefinition } from './entity-catalogue.types';

describe('EntityCatalogueService', () => {
  let entityCatalogue: TestEntityCatalogue;
  function getEndpointDefinition() {
    return {
      type: 'endpointType',
      label: 'Cloud Foundry',
      labelPlural: 'Cloud Foundry',
      icon: 'cloud_foundry',
      iconFont: 'stratos-icons',
      logoUrl: '/core/assets/endpoint-icons/cloudfoundry.png',
      authTypes: [BaseEndpointAuth.UsernamePassword, BaseEndpointAuth.SSO],
      listDetailsComponent: EndpointListDetailsComponent,
    } as IStratosEndpointDefinition;
  }
  function getDefaultSchema() {
    return new EntitySchema('entitySchema1', 'endpoint1');
  }
  function getSchema(modifier: string) {
    return new EntitySchema('entitySchema1' + modifier, 'endpoint1');
  }
  beforeEach(() => entityCatalogue = new TestEntityCatalogue());

  it('should create correct id', () => {
    const endpoint = getEndpointDefinition();
    const definition = {
      type: 'entity',
      schema: getDefaultSchema(),
      endpoint
    };
    entityCatalogue.register(new StratosCatalogueEntity(definition));

    const catalogueEntity = entityCatalogue.getEntity(endpoint.type, definition.type);
    expect(catalogueEntity.entityKey).toBe(endpoint.type + 'Entity');
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

  it('should get endpoint', () => {
    const endpoint = getEndpointDefinition();
    entityCatalogue.register(new StratosCatalogueEndpointEntity(endpoint));
    const catalogueEntity = entityCatalogue.getEndpoint(endpoint.type);
    expect(catalogueEntity).not.toBeUndefined();
    expect(catalogueEntity.definition).toEqual({
      ...endpoint,
      schema: {
        default: endpointEntitySchema
      }
    });
  });

  it('should get endpoint subtype', () => {
    const endpoint = getEndpointDefinition();
    const SUBTYPE_TYPE = 'entity3SubType';
    const subtypeDefinition = {
      label: 'SubType',
      labelPlural: 'SubTypes',
      type: SUBTYPE_TYPE,
      logoUrl: 'image/url',
      tokenSharing: true,
      urlValidation: false,
      unConnectable: true,
      urlValidationRegexString: 'redjecks',
      authTypes: [
        BaseEndpointAuth.SSO
      ]
    };
    const definition = {
      ...endpoint,
      subTypes: [
        subtypeDefinition
      ]
    };
    entityCatalogue.register(new StratosCatalogueEndpointEntity(definition));
    const expected = {
      ...subtypeDefinition,
      icon: 'cloud_foundry',
      iconFont: 'stratos-icons',
      listDetailsComponent: EndpointListDetailsComponent,
      schema: {
        default: endpointEntitySchema
      },
    };
    const catalogueEntity = entityCatalogue.getEndpoint(endpoint.type, SUBTYPE_TYPE);
    expect(catalogueEntity).not.toBeUndefined();
    expect(catalogueEntity.definition).toEqual(expected);
  });

  it('should get entity subtype', () => {
    const endpoint = getEndpointDefinition();
    const schema = getDefaultSchema();

    const SUBTYPE_TYPE = 'entity3SubType';
    const TYPE = 'entity3';
    const subtypeDefinition = {
      label: 'SubType',
      labelPlural: 'SubTypes',
      type: SUBTYPE_TYPE,
    };

    const definition = {
      type: TYPE,
      schema: {
        default: schema,
      },
      endpoint,
      subTypes: [
        subtypeDefinition
      ]
    };
    entityCatalogue.register(new StratosCatalogueEntity(definition));
    const expected = {
      ...subtypeDefinition,
      endpoint,
      schema: {
        default: schema,
      }
    };
    const catalogueEntity = entityCatalogue.getEntity(endpoint.type, TYPE, SUBTYPE_TYPE);
    expect(catalogueEntity).not.toBeUndefined();
    expect(catalogueEntity.definition).toEqual(expected);
  });
});
