import {
  EndpointListDetailsComponent,
} from '../../../core/src/shared/components/list/list-types/endpoint/endpoint-list.helpers';
import { EntitySchema } from '../helpers/entity-schema';
import { endpointEntityType, stratosEntityFactory } from '../helpers/stratos-entity-factory';
import { TestEntityCatalog } from './entity-catalog';
import { StratosCatalogEndpointEntity, StratosCatalogEntity } from './entity-catalog-entity/entity-catalog-entity';
import { EntityCatalogSchemas, IStratosEndpointDefinition } from './entity-catalog.types';

fdescribe('EntityCatalogService', () => {
  let entityCatalog: TestEntityCatalog;
  function getEndpointDefinition() {
    return {
      type: 'endpointType',
      label: 'Cloud Foundry',
      labelPlural: 'Cloud Foundry',
      icon: 'cloud_foundry',
      iconFont: 'stratos-icons',
      logoUrl: '/core/assets/endpoint-icons/cloudfoundry.png',
      authTypes: [],
      listDetailsComponent: EndpointListDetailsComponent,
    } as IStratosEndpointDefinition;
  }
  function getDefaultSchema() {
    return new EntitySchema('entitySchema1', 'endpoint1');
  }
  function getSchema(modifier: string, schemaKey: string = null) {
    return new EntitySchema('entitySchema1' + modifier, 'endpoint1', undefined, undefined, undefined, schemaKey);
  }
  beforeEach(() => entityCatalog = new TestEntityCatalog());

  it('should create correct id', () => {
    const endpoint = getEndpointDefinition();
    const definition = {
      type: 'entity',
      schema: getDefaultSchema(),
      endpoint
    };
    entityCatalog.register(new StratosCatalogEntity(definition));

    const catalogEntity = entityCatalog.getEntity(endpoint.type, definition.type);
    expect(catalogEntity.entityKey).toBe(endpoint.type + 'Entity');
  });

  it('should get default schema from single schema', () => {
    const endpoint = getEndpointDefinition();
    const definition = {
      type: 'entity',
      schema: getDefaultSchema(),
      endpoint
    };
    entityCatalog.register(new StratosCatalogEntity(definition));

    const catalogEntity = entityCatalog.getEntity(endpoint.type, definition.type);
    const schema = catalogEntity.getSchema();
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
    entityCatalog.register(new StratosCatalogEntity(definition));

    const catalogEntity = entityCatalog.getEntity(endpoint.type, definition.type);
    const schema = catalogEntity.getSchema();
    expect(schema).not.toBeUndefined();
    expect(schema).toEqual(defaultSchema);
  });

  it('should get non-default schema from multiple schemas', () => {
    const endpoint = getEndpointDefinition();
    const schemaKey = 'nonDefaultSchema';
    const nonDefaultSchema = getSchema('1', schemaKey);
    expect(nonDefaultSchema).toEqual(nonDefaultSchema);
    const definition = {
      type: 'entity3',
      schema: {
        default: getDefaultSchema(),
        [schemaKey]: nonDefaultSchema
      },
      endpoint
    };
    entityCatalog.register(new StratosCatalogEntity(definition));

    const catalogEntity = entityCatalog.getEntity(endpoint.type, definition.type);
    const schema = catalogEntity.getSchema(schemaKey);
    expect(schema).not.toBeUndefined();
    // This now fails with schema.Entity function equalities... so just stringify instead
    expect(JSON.stringify(schema)).toEqual(JSON.stringify(nonDefaultSchema));
  });

  it('should get endpoint', () => {
    const endpoint = getEndpointDefinition();
    entityCatalog.register(new StratosCatalogEndpointEntity(endpoint));
    const catalogEntity = entityCatalog.getEndpoint(endpoint.type);
    expect(catalogEntity).not.toBeUndefined();
    expect(catalogEntity.definition).toEqual({
      ...endpoint,
      schema: {
        default: stratosEntityFactory(endpointEntityType)
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
      authTypes: []
    };
    const definition = {
      ...endpoint,
      subTypes: [
        subtypeDefinition
      ]
    };
    entityCatalog.register(new StratosCatalogEndpointEntity(definition));
    const expected: IStratosEndpointDefinition<EntityCatalogSchemas> = {
      ...subtypeDefinition,
      icon: 'cloud_foundry',
      iconFont: 'stratos-icons',
      listDetailsComponent: EndpointListDetailsComponent,
      schema: {
        default: stratosEntityFactory(endpointEntityType)
      },
      parentType: endpoint.type
    };
    const catalogEntity = entityCatalog.getEndpoint(endpoint.type, SUBTYPE_TYPE);
    expect(catalogEntity).not.toBeUndefined();
    expect(catalogEntity.definition).toEqual(expected);
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
    entityCatalog.register(new StratosCatalogEntity(definition));
    const expected = {
      ...subtypeDefinition,
      endpoint,
      schema: {
        default: schema,
      },
      parentType: TYPE
    };
    const catalogEntity = entityCatalog.getEntity(endpoint.type, TYPE, SUBTYPE_TYPE);
    expect(catalogEntity).not.toBeUndefined();
    expect(catalogEntity.definition).toEqual(expected);
  });
});
