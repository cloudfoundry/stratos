import {
  StratosEndpointExtensionDefinition,
} from '../core/src/core/entity-catalogue/entity-catalogue.types';
import { StratosCatalogueEndpointEntity, StratosCatalogueEntity } from '../core/src/core/entity-catalogue/entity-catalogue-entity';
import { EntitySchema } from '../store/src/helpers/entity-schema';
import { exampleApiPostActionBuilders } from './example-api.action-builders';
import { k8EndpointDefinition } from '../core/src/custom/kubernetes/kubernetes-entity-generator';

const EXAMPLE_API_ENDPOINT_TYPE = 'exampleApi';
// TODO this wont work without a backend extension that allows connecting this endpoint type.
export const exampleApiEndpointDefinition: StratosEndpointExtensionDefinition = {
  type: EXAMPLE_API_ENDPOINT_TYPE,
  label: 'Example Api',
  labelPlural: 'Example Api',
  icon: 'cloud_foundry',
  iconFont: 'stratos-icons',
  renderPriority: 1,
  logoUrl: '',
  authTypes: [],
  unConnectable: true,

  // globalPreRequest: (request, action) => {
  //   return addCfRelationParams(request, action);
  // },
  // globalPrePaginationRequest: (request, action, catalogueEntity, appState) => {
  //   const rWithRelations = addCfRelationParams(request, action);
  //   return addCfQParams(rWithRelations, action, catalogueEntity, appState);
  // },
  // globalSuccessfulRequestDataMapper: (data, endpointGuid, guid) => {
  //   if (data) {
  //     if (data.entity) {
  //       data.entity.cfGuid = endpointGuid;
  //       data.entity.guid = guid;
  //     } else {
  //       data.cfGuid = endpointGuid;
  //       data.guid = guid;
  //     }
  //   }
  //   return data;
  // },
  // globalErrorMessageHandler: (errors: JetstreamError<CfErrorResponse>[]) => {
  //   if (!errors || errors.length === 0) {
  //     return 'No errors in response';
  //   }

  //   if (errors.length === 1) {
  //     return getCfError(errors[0].jetstreamErrorResponse);
  //   }

  //   return errors.reduce((message, error) => {
  //     message += `\n${getCfError(error.jetstreamErrorResponse)}`;
  //     return message;
  //   }, 'Multiple Cloud Foundry Errors. ');
  // },
  paginationConfig: {
    getEntitiesFromResponse: (response) => response,
    getTotalPages: () => 1,
    getTotalEntities: (response) => response.length,
    getPaginationParameters: (page: number) => ({})
  }
};

const generateExampleEndpointEntity = (endpointDefinition: StratosEndpointExtensionDefinition) => {
  return new StratosCatalogueEndpointEntity(
    endpointDefinition
  );
};

const generateExamplePostEntity = (endpointDefinition: StratosEndpointExtensionDefinition) => {
  const entityType = 'post';
  return new StratosCatalogueEntity(
    {
      endpoint: endpointDefinition,
      label: 'Post',
      labelPlural: 'Posts',
      icon: 'book',
      type: entityType,
      nonJetstreamRequest: true,
      schema: new EntitySchema(entityType, endpointDefinition.type, {}, {
        idAttribute: 'id'
      }),
      tableConfig: {
        columnBuilders: [
          ['Id', (post) => post.id],
          ['User Id', (post) => post.userId],
          ['Title', (post) => post.title],
          ['Body', (post) => post.body],
        ],
      },
      paginationConfig: {
        getEntitiesFromResponse: res => res,
        getTotalEntities: res => res.length,
        getPaginationParameters: () => ({}),
        getTotalPages: () => 1,
      }
    },
    {
      actionBuilders: exampleApiPostActionBuilders,
      entityBuilder: {
        getMetadata: ent => ({
          name: ent.title,
          guid: ent.id.toString()
        }),
        getGuid: metadata => metadata.guid,
      }
    }
  );
};

export function generateExampleEntities() {
  return [
    // generateExampleEndpointEntity(k8EndpointDefinition),
    generateExamplePostEntity(k8EndpointDefinition)
  ];
}



