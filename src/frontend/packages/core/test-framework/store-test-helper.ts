import { ModuleWithProviders } from '@angular/core';
import { StoreModule } from '@ngrx/store';

import { AppState } from '../../store/src/app-state';
import { addEntityToCache, EntitySchema, userProvidedServiceInstanceSchemaKey } from '../../store/src/helpers/entity-factory';
import { appReducers } from '../../store/src/reducers.module';
import { registerAPIRequestEntity } from '../../store/src/reducers/api-request-reducers.generator';
import { getDefaultEndpointRoles, getDefaultRolesRequestState } from '../../store/src/types/current-user-roles.types';
import { defaultCfEntitiesState } from '../../store/src/types/entity.types';
import { createUserRoleInOrg } from '../../store/src/types/user.types';
import { getEntitiesFromExtensions } from '../src/core/extension/extension-service';

export const testSCFGuid = '01ccda9d-8f40-4dd0-bc39-08eea68e364f';

/* tslint:disable */
export function getInitialTestStoreState(): AppState {
  const entities = getEntitiesFromExtensions();
  const state = getDefaultInitialTestStoreState();
  entities.forEach(entity => {
    state.pagination[entity.entityKey] = {};
    state.request[entity.entityKey] = {};
    state.requestData[entity.entityKey] = {};
  });

  return state;
}

function getDefaultInitialTestStoreState(): AppState {

  return {
    recentlyVisited: {
      entities: {},
      hits: []
    },
    userFavoritesGroups: {
      busy: false,
      error: false,
      message: '',
      groups: {}
    },
    auth: {
      loggedIn: true,
      loggingIn: false,
      user: null,
      error: false,
      errorResponse: '',
      sessionData: {
        version: {
          proxy_version: '0.9.5-a77102d6',
          database_version: 20170818162837
        },
        user: {
          guid: '530170c7-5042-40ed-8654-c4a79e4d1302',
          name: 'admin',
          admin: true,
          scopes: []
        },
        endpoints: {
          cf: {
            [testSCFGuid]: {
              guid: testSCFGuid,
              name: 'SCF-2.2.0-beta',
              version: '',
              user: {
                scopes: [],
                guid: 'a6254a42-a218-4f41-b77e-35a8d53d9dd1',
                name: 'admin',
                admin: true
              },
              type: ''
            },
            '521a9d96-2d6c-4d94-a555-807437ab106d': {
              guid: '521a9d96-2d6c-4d94-a555-807437ab106d',
              name: 'SCF',
              version: '',
              user: {
                scopes: [],
                guid: 'ded8a59b-b21d-4da6-a07a-0d865a9b16e2',
                name: 'admin',
                admin: true
              },
              type: ''
            },
            '663a363e-1faf-4359-ac96-b8c24ec1a4ab': {
              guid: '663a363e-1faf-4359-ac96-b8c24ec1a4ab',
              name: 'TEST',
              version: '',
              user: {
                scopes: [],
                guid: 'b2a8ed5c-5c63-4b5b-bdf8-04ea66a9db00',
                name: 'admin',
                admin: true
              },
              type: ''
            },
            'b24923d0-f1ad-4534-bb02-f609a1667bb1': {
              guid: 'b24923d0-f1ad-4534-bb02-f609a1667bb1',
              name: 'SAP',
              version: '',
              user: {
                scopes: [],
                guid: '7965e2cc-ef57-4373-bb0d-b45025355883',
                name: 'macdougall.neil@gmail.com',
                admin: false
              },
              type: ''
            },
            'e2f91bca-38e8-435a-9f72-7a8f8de0ee17': {
              guid: 'e2f91bca-38e8-435a-9f72-7a8f8de0ee17',
              name: 'SCF 2.1.0-beta',
              version: '',
              user: {
                scopes: [],
                guid: 'a1e15ade-2f3d-4354-8935-0553973afb2c',
                name: 'admin',
                admin: true
              },
              type: ''
            }
          }
        },
        valid: true,
        uaaError: false,
        upgradeInProgress: false,
        sessionExpiresOn: 1000,
      },
      verifying: false
    },
    uaaSetup: {
      payload: null,
      setup: false,
      error: false,
      message: '',
      settingUp: false
    },
    endpoints: {
      loading: false,
      error: false,
      message: ''
    },
    pagination: {
      featureFlag: {},
      serviceBroker: {},
      securityGroup: {},
      servicePlanVisibility: {},
      buildpack: {},
      application: {
        applicationWall: {
          pageCount: 1,
          currentPage: 1,
          totalResults: 0,
          params: {
            key: 'a'
          },
          ids: {
            '1': [
              '4e4858c4-24ab-4caf-87a8-7703d1da58a0',
              '40a8cd59-956c-483c-ba7d-a7161e39e5eb',
              '8b501d9e-4e27-4d7d-bdf5-8b20975137c0',
              '1463eda1-e0e1-4c70-ae5f-4c408dc098f6',
              '77c0759f-e857-4f4c-9785-299acf7b3f48',
              'c5026174-fcf7-413b-bc9a-ac3419e30a91',
              'b87f92ee-bcaa-4430-96d5-ef5b7a80214f',
              'e629c3be-e5cc-4f24-bd6e-57a83c3e4f2e',
              'a82554fb-6e81-48ba-839a-c52b55d8e37c',
              'f5f40768-7416-4400-8026-832a43e3653e',
              'e1b7b5e3-a33c-4bc2-b14d-ca7731988a7d',
              'b862b599-7e32-43da-9956-b717d85e2f33',
              '8f13b7ea-fe92-4bb4-a0e9-4c0effdf945c',
              '13321c2f-9156-498f-a4e8-318f414e8817',
              '44a63e90-8075-4708-90d9-262a81dcc77c',
              'eb0fabf1-0f49-4840-b9fb-a78f2f5433b5',
              'fd125f54-60dd-4cf3-b966-5a4391abf5fa',
              '0af78017-8c76-4d09-ae08-003c4b297fa5',
              '1b16f469-127b-440f-88ef-d4960c098bf6',
              '1b4c9820-e648-4bd9-80c8-6b5a870938c4',
              '83278b7e-feb9-41f1-ad03-06d08f9ce824',
              '610fd394-2323-45da-91e6-36b83357ad54',
              '98260847-6844-4674-8cbf-2d899171da2e',
              'c58cb952-b75d-4ed6-9ca6-426daf13570b',
              '6c6d0951-80f8-4420-b2b5-1ff404072ed6',
              'f916c732-cce2-4500-bc88-e3ca19f1394b',
              '7d046ff5-68af-4ed9-8a69-8e74b011563e',
              'ea8220f9-fd47-4c88-9e12-9fb0611f3260',
              '70b1b77f-71e2-4c06-8f4b-66486cff44af',
              '122f72b1-4c63-45f4-a607-34fc152fc551',
              '9830d869-e8c3-4ac7-b838-1e7927c4ee5f',
              '34fea963-076b-48f6-9928-11b075c1c822',
              '0fe1de5d-8e53-4f67-aafa-0c16228dc182',
              '74980881-a122-469d-9acc-a2b965abd5e9',
              '1532e7d5-643d-436e-bb74-7b60fd76265d',
              'ca76c3a6-44c4-4d7e-9ae6-d8ced5e99c44',
              '0fb015ed-a743-42e4-be08-9f09f05378bb',
              '5d5f3b86-f50b-46b3-9ed8-64f1276f99a0',
              'c6a7751f-182e-4b28-8c53-ca28243ee501',
              'a54e9401-a7d9-4a36-b548-d78507057e69',
              '658e24d6-da5f-4faa-a6ae-95bc787faa25',
              'd27915f7-55b9-427e-969b-6b0ce5a67803',
              'cdbe2006-8311-451c-aec1-72c36afd384d',
              '278ba371-59ad-4504-9b58-47f67b0fde42',
              'cb20a937-d20e-4f37-8d8a-0ec2a2a40599',
              '7c324e6f-b9fc-4cd7-a977-48276413a805',
              '29b09812-0b9c-4d10-9181-26436461914a',
              '79dbd97e-0887-49f9-80c0-444cf1f16a96',
              '683b899c-6235-406c-82dd-176db0404369',
              'c9b34793-4b14-45ae-bd1f-15e005db8583',
              '1511062e-7099-4dfb-9fa3-08d699bbd0ab',
              'eb86d68d-fd31-42c1-a711-74691775c2d8',
              '9daab4bc-6a94-401e-8456-730cf516d4c9',
              '4fbec12e-b310-42c3-831c-e70c21cccc96',
              'c5c8a9f2-a770-4ee5-8f7a-0eb6015dfe3a',
              '8c92a1ca-b7ec-4811-883c-d33ac65fce73',
              'de78601d-49ec-4ebe-9bd9-9cc104207f72',
              '14016a5f-0509-47c7-852a-98ba05ab5da8',
              '03b8edb2-bab9-47d2-89f8-0ca2dcfbb9fd',
              '44ad1092-3247-4bf1-857e-644961506f7d',
              'a9363ef2-78dc-43bf-9d15-c0c7a08a4f69',
              'cfdd8369-e88e-4648-a7dd-69b9b09dddcf',
              '2b5eb25a-e4bd-4316-a5c7-47adcba9f3f0',
              '885f1a87-e465-4826-abdc-fd8beb6564da',
              '994591c8-4f2a-4775-ad23-79ed33b99f62',
              '8a02a394-e899-4eab-97d1-dee092fbdb57',
              '85c42418-81c2-4ef5-bb4d-b1991f8f4f95',
              '687f2c3b-c10c-4aee-bf70-b5525fd585b8',
              'a63178d7-d123-4059-9976-74b7234318e6',
              'fa48e6b4-9091-40bb-9e53-2159f1cc9782',
              '365a890d-1e13-40eb-937f-d2f2ab9403eb',
              '09543d4e-73ed-4e59-b3b5-727b841a5684',
              'c318322d-8187-41a8-a1fd-bdae1ed1d24c',
              '15c480aa-8215-4bc3-959a-0814967c091e',
              'ab9c9db3-cb7d-4248-b53b-9d185b0555f6',
              '4716e251-5af8-4144-a179-1871c7217dc0',
              '6ce08a19-f87b-497c-bc93-3b5616ae40c2',
              'ee165a5e-0f37-43c1-9744-4027b5144c3a',
              '38081245-299e-42d3-847b-b08444da4553',
              'a5ff68cd-baa2-4fa4-a688-e7b840af5073',
              'db5ecb02-e05c-4742-9ad6-6f78b77d3dca',
              '9111c1c9-04b9-4d71-b494-66a68bdeef52',
              'f88c311c-4cd8-4bd5-a044-72b3d449690e',
              '76ec34ca-61b8-4a75-8abc-4a800874a851',
              'da42afa1-0bf6-4ad7-b644-40ac216efce5',
              '90adbf54-bc68-487f-b60a-3967083c7b4e',
              'c54e3d96-d4aa-441f-9b84-c313fedc06e3',
              '17e397a7-fae2-40ee-93ef-70e428932a73',
              '6c9ab603-c038-4b4b-b29e-7b440f8d2916',
              'f4091dbe-2aff-492e-b476-1b14219fdaf8',
              'c5ede50a-6787-4628-b379-848d55ee914e',
              'b18c3b6f-87bf-48c4-a8b9-48749ab63d05',
              '0e14fcb7-4a13-48bd-8d5e-fc52cbe19d2c',
              '53d2f48c-48ec-4ece-9775-d8932f77e2db',
              '879d3e3b-72df-455f-83d7-7c1183db150f',
              'cf717053-f8e6-4cd3-9bd3-9c1b0701ed45',
              'bce5e758-768d-4e92-b8d0-a3580752ddf5',
              'ef33c4d2-104b-4e04-9635-dac7a6b2face',
              '84a7f331-41c3-474f-9d3c-e8108f4702a6',
              '34026306-3b74-4405-a489-d85ec67d7860',
              '66aee61b-cf69-4a9d-966a-4dbc9ee981f1',
              '92abdead-5c38-46fd-a4c7-6fc8a0ff8176',
              '6141d1b5-1f9c-4fec-8511-3ad2f6ab71b0',
              '10e5e215-dfc1-4bad-a3bf-5a191e5466b0',
              'f06af5ef-bbf9-4285-a72a-67598cb62708',
              '6f82f89d-7900-4cf8-8e91-50c78f968628',
              '750f7bc2-c3f6-4bee-a743-9ad92a2df704',
              'e6697556-a5e2-4d03-88e6-973e1351ed0b',
              '689a218b-1b31-4d49-8766-84573372d77a',
              '0195cbb8-2d1c-4e98-bef7-19287c643ff2',
              '876b2f13-38fe-4925-bf3e-e0eccbcbb3a0',
              '7ee817ad-770d-41b9-85f7-2a7c05ec7012',
              'f6f5db80-c020-430a-ab11-d9fe5dfe925f',
              'b08ea7b4-688e-48d9-a8d9-2d04b06efcdb',
              'ef1c514f-5b19-4ce0-b840-6fe8d5f5bb46',
              '0da9d02b-93b4-4828-8058-04ff243f43b9',
              'e2a17f54-d0c3-4660-919b-b1ff585e6c05',
              'a4e2cbfd-d11e-4b5f-a5f5-3739dfdc7d1d',
              'a222dcfe-8a0d-4207-b049-14de5da5b0ae',
              'aa33e150-c962-4982-a602-d9a149ddc61b',
              '921aefc2-0bbc-4d8b-a438-1cc6dd6673e1',
              '197bef61-1a81-44ed-8d96-028a88baa4b5',
              'c73943a7-6e56-423b-b0c2-d5720f8ef9fc',
              '02325b75-1199-4269-ba0a-8366a64b91af',
              '3f3cd4e0-9cc8-41f6-9e6a-fce36ca839ae',
              '6fa0182c-2b31-4b9a-ae05-11f766fadd31',
              'e49a16ad-3afd-4320-a301-745eda859f36',
              '219d24fd-77fa-402b-98c6-085e5ce5cedd',
              '1c6acc17-5275-486f-84f2-f5c14b4afd7d',
              'ce653e40-bd26-4278-85c9-773d0ed806a2',
              '6c29687b-e2b0-4ba5-b17a-ed3b99c54f79',
              '980877d5-ff09-400d-87d3-2db36ea763d6',
              '1df7da98-ba42-4c95-af2a-3e1be5ce9824',
              '7d2981da-6ee5-47ce-948f-4769a63be5ee',
              '0c47e5fe-4b84-42b7-9ac7-6f4d52596a7f',
              'af405ff9-2da6-47c0-af4d-1e72f55e621f',
              'dbc5f72a-8703-4c9a-8919-b9e900392acb'
            ]
          },
          pageRequests: {
          },
          clientPagination: {
            pageSize: 5,
            currentPage: 1,
            totalResults: 50,
            filter: {
              string: '',
              items: {}
            },
          }
        },
      },
      stack: {},
      space: {},
      userFavorites: {},
      organization: {
        endpointOrgSpaceService: {
          pageCount: 1,
          currentPage: 1,
          totalResults: 4,
          ids: {
            '1': [
              '1ddbd64b-59a3-411f-a2b9-66e128b08be1',
              '815a79fa-58dc-433f-b4a6-b3e06c4dda77',
              'bd46bccd-6a1e-441a-b107-8969785054e0',
              '4e229771-2d4d-4765-aed4-419cd937d1f8'
            ]
          },
          pageRequests: {
            '1': {
              busy: false,
              error: false,
              message: ''
            }
          },
          params: {
            'results-per-page': 100,
            page: 1,
            'inline-relations-depth': 2,
            q: []
          },
          clientPagination: {
            pageSize: 9,
            currentPage: 1,
            filter: {
              string: '',
              items: {}
            },
            totalResults: 4
          }
        },
        'cf-organizations': {
          pageCount: 1,
          currentPage: 1,
          totalResults: 4,
          ids: {
            '1': [
              '1ddbd64b-59a3-411f-a2b9-66e128b08be1',
              '815a79fa-58dc-433f-b4a6-b3e06c4dda77',
              'bd46bccd-6a1e-441a-b107-8969785054e0',
              '4e229771-2d4d-4765-aed4-419cd937d1f8'
            ]
          },
          pageRequests: {
            '1': {
              busy: false,
              error: false,
              message: ''
            }
          },
          params: {
            'results-per-page': 100,
            page: 1,
            'inline-relations-depth': 2,
            q: []
          },
          clientPagination: {
            pageSize: 9,
            currentPage: 1,
            filter: {
              string: '',
              items: {}
            },
            totalResults: 4
          },
        }
      },
      route: {},
      event: {
        'app-events:01ccda9d-8f40-4dd0-bc39-08eea68e364f4e4858c4-24ab-4caf-87a8-7703d1da58a0': {
          pageCount: 1,
          currentPage: 1,
          totalResults: 0,
          params: {
            key: 'a'
          },
          ids: {
            '1': [
              '4e4858c4-24ab-4caf-87a8-7703d1da58a0',
              '40a8cd59-956c-483c-ba7d-a7161e39e5eb',
              '8b501d9e-4e27-4d7d-bdf5-8b20975137c0',
              '1463eda1-e0e1-4c70-ae5f-4c408dc098f6',
              '77c0759f-e857-4f4c-9785-299acf7b3f48',
              'c5026174-fcf7-413b-bc9a-ac3419e30a91',
              'b87f92ee-bcaa-4430-96d5-ef5b7a80214f',
              'e629c3be-e5cc-4f24-bd6e-57a83c3e4f2e',
              'a82554fb-6e81-48ba-839a-c52b55d8e37c',
              'f5f40768-7416-4400-8026-832a43e3653e',
              'e1b7b5e3-a33c-4bc2-b14d-ca7731988a7d',
              'b862b599-7e32-43da-9956-b717d85e2f33',
              '8f13b7ea-fe92-4bb4-a0e9-4c0effdf945c',
              '13321c2f-9156-498f-a4e8-318f414e8817',
              '44a63e90-8075-4708-90d9-262a81dcc77c',
              'eb0fabf1-0f49-4840-b9fb-a78f2f5433b5',
              'fd125f54-60dd-4cf3-b966-5a4391abf5fa',
              '0af78017-8c76-4d09-ae08-003c4b297fa5',
              '1b16f469-127b-440f-88ef-d4960c098bf6',
              '1b4c9820-e648-4bd9-80c8-6b5a870938c4',
              '83278b7e-feb9-41f1-ad03-06d08f9ce824',
              '610fd394-2323-45da-91e6-36b83357ad54',
              '98260847-6844-4674-8cbf-2d899171da2e',
              'c58cb952-b75d-4ed6-9ca6-426daf13570b',
              '6c6d0951-80f8-4420-b2b5-1ff404072ed6',
              'f916c732-cce2-4500-bc88-e3ca19f1394b',
              '7d046ff5-68af-4ed9-8a69-8e74b011563e',
              'ea8220f9-fd47-4c88-9e12-9fb0611f3260',
              '70b1b77f-71e2-4c06-8f4b-66486cff44af',
              '122f72b1-4c63-45f4-a607-34fc152fc551',
              '9830d869-e8c3-4ac7-b838-1e7927c4ee5f',
              '34fea963-076b-48f6-9928-11b075c1c822',
              '0fe1de5d-8e53-4f67-aafa-0c16228dc182',
              '74980881-a122-469d-9acc-a2b965abd5e9',
              '1532e7d5-643d-436e-bb74-7b60fd76265d',
              'ca76c3a6-44c4-4d7e-9ae6-d8ced5e99c44',
              '0fb015ed-a743-42e4-be08-9f09f05378bb',
              '5d5f3b86-f50b-46b3-9ed8-64f1276f99a0',
              'c6a7751f-182e-4b28-8c53-ca28243ee501',
              'a54e9401-a7d9-4a36-b548-d78507057e69',
              '658e24d6-da5f-4faa-a6ae-95bc787faa25',
              'd27915f7-55b9-427e-969b-6b0ce5a67803',
              'cdbe2006-8311-451c-aec1-72c36afd384d',
              '278ba371-59ad-4504-9b58-47f67b0fde42',
              'cb20a937-d20e-4f37-8d8a-0ec2a2a40599',
              '7c324e6f-b9fc-4cd7-a977-48276413a805',
              '29b09812-0b9c-4d10-9181-26436461914a',
              '79dbd97e-0887-49f9-80c0-444cf1f16a96',
              '683b899c-6235-406c-82dd-176db0404369',
              'c9b34793-4b14-45ae-bd1f-15e005db8583',
              '1511062e-7099-4dfb-9fa3-08d699bbd0ab',
              'eb86d68d-fd31-42c1-a711-74691775c2d8',
              '9daab4bc-6a94-401e-8456-730cf516d4c9',
              '4fbec12e-b310-42c3-831c-e70c21cccc96',
              'c5c8a9f2-a770-4ee5-8f7a-0eb6015dfe3a',
              '8c92a1ca-b7ec-4811-883c-d33ac65fce73',
              'de78601d-49ec-4ebe-9bd9-9cc104207f72',
              '14016a5f-0509-47c7-852a-98ba05ab5da8',
              '03b8edb2-bab9-47d2-89f8-0ca2dcfbb9fd',
              '44ad1092-3247-4bf1-857e-644961506f7d',
              'a9363ef2-78dc-43bf-9d15-c0c7a08a4f69',
              'cfdd8369-e88e-4648-a7dd-69b9b09dddcf',
              '2b5eb25a-e4bd-4316-a5c7-47adcba9f3f0',
              '885f1a87-e465-4826-abdc-fd8beb6564da',
              '994591c8-4f2a-4775-ad23-79ed33b99f62',
              '8a02a394-e899-4eab-97d1-dee092fbdb57',
              '85c42418-81c2-4ef5-bb4d-b1991f8f4f95',
              '687f2c3b-c10c-4aee-bf70-b5525fd585b8',
              'a63178d7-d123-4059-9976-74b7234318e6',
              'fa48e6b4-9091-40bb-9e53-2159f1cc9782',
              '365a890d-1e13-40eb-937f-d2f2ab9403eb',
              '09543d4e-73ed-4e59-b3b5-727b841a5684',
              'c318322d-8187-41a8-a1fd-bdae1ed1d24c',
              '15c480aa-8215-4bc3-959a-0814967c091e',
              'ab9c9db3-cb7d-4248-b53b-9d185b0555f6',
              '4716e251-5af8-4144-a179-1871c7217dc0',
              '6ce08a19-f87b-497c-bc93-3b5616ae40c2',
              'ee165a5e-0f37-43c1-9744-4027b5144c3a',
              '38081245-299e-42d3-847b-b08444da4553',
              'a5ff68cd-baa2-4fa4-a688-e7b840af5073',
              'db5ecb02-e05c-4742-9ad6-6f78b77d3dca',
              '9111c1c9-04b9-4d71-b494-66a68bdeef52',
              'f88c311c-4cd8-4bd5-a044-72b3d449690e',
              '76ec34ca-61b8-4a75-8abc-4a800874a851',
              'da42afa1-0bf6-4ad7-b644-40ac216efce5',
              '90adbf54-bc68-487f-b60a-3967083c7b4e',
              'c54e3d96-d4aa-441f-9b84-c313fedc06e3',
              '17e397a7-fae2-40ee-93ef-70e428932a73',
              '6c9ab603-c038-4b4b-b29e-7b440f8d2916',
              'f4091dbe-2aff-492e-b476-1b14219fdaf8',
              'c5ede50a-6787-4628-b379-848d55ee914e',
              'b18c3b6f-87bf-48c4-a8b9-48749ab63d05',
              '0e14fcb7-4a13-48bd-8d5e-fc52cbe19d2c',
              '53d2f48c-48ec-4ece-9775-d8932f77e2db',
              '879d3e3b-72df-455f-83d7-7c1183db150f',
              'cf717053-f8e6-4cd3-9bd3-9c1b0701ed45',
              'bce5e758-768d-4e92-b8d0-a3580752ddf5',
              'ef33c4d2-104b-4e04-9635-dac7a6b2face',
              '84a7f331-41c3-474f-9d3c-e8108f4702a6',
              '34026306-3b74-4405-a489-d85ec67d7860',
              '66aee61b-cf69-4a9d-966a-4dbc9ee981f1',
              '92abdead-5c38-46fd-a4c7-6fc8a0ff8176',
              '6141d1b5-1f9c-4fec-8511-3ad2f6ab71b0',
              '10e5e215-dfc1-4bad-a3bf-5a191e5466b0',
              'f06af5ef-bbf9-4285-a72a-67598cb62708',
              '6f82f89d-7900-4cf8-8e91-50c78f968628',
              '750f7bc2-c3f6-4bee-a743-9ad92a2df704',
              'e6697556-a5e2-4d03-88e6-973e1351ed0b',
              '689a218b-1b31-4d49-8766-84573372d77a',
              '0195cbb8-2d1c-4e98-bef7-19287c643ff2',
              '876b2f13-38fe-4925-bf3e-e0eccbcbb3a0',
              '7ee817ad-770d-41b9-85f7-2a7c05ec7012',
              'f6f5db80-c020-430a-ab11-d9fe5dfe925f',
              'b08ea7b4-688e-48d9-a8d9-2d04b06efcdb',
              'ef1c514f-5b19-4ce0-b840-6fe8d5f5bb46',
              '0da9d02b-93b4-4828-8058-04ff243f43b9',
              'e2a17f54-d0c3-4660-919b-b1ff585e6c05',
              'a4e2cbfd-d11e-4b5f-a5f5-3739dfdc7d1d',
              'a222dcfe-8a0d-4207-b049-14de5da5b0ae',
              'aa33e150-c962-4982-a602-d9a149ddc61b',
              '921aefc2-0bbc-4d8b-a438-1cc6dd6673e1',
              '197bef61-1a81-44ed-8d96-028a88baa4b5',
              'c73943a7-6e56-423b-b0c2-d5720f8ef9fc',
              '02325b75-1199-4269-ba0a-8366a64b91af',
              '3f3cd4e0-9cc8-41f6-9e6a-fce36ca839ae',
              '6fa0182c-2b31-4b9a-ae05-11f766fadd31',
              'e49a16ad-3afd-4320-a301-745eda859f36',
              '219d24fd-77fa-402b-98c6-085e5ce5cedd',
              '1c6acc17-5275-486f-84f2-f5c14b4afd7d',
              'ce653e40-bd26-4278-85c9-773d0ed806a2',
              '6c29687b-e2b0-4ba5-b17a-ed3b99c54f79',
              '980877d5-ff09-400d-87d3-2db36ea763d6',
              '1df7da98-ba42-4c95-af2a-3e1be5ce9824',
              '7d2981da-6ee5-47ce-948f-4769a63be5ee',
              '0c47e5fe-4b84-42b7-9ac7-6f4d52596a7f',
              'af405ff9-2da6-47c0-af4d-1e72f55e621f',
              'dbc5f72a-8703-4c9a-8919-b9e900392acb'
            ]
          },
          pageRequests: {
          },
          clientPagination: {
            pageSize: 5,
            currentPage: 1,
            totalResults: 50,
            filter: {
              string: '',
              items: {}
            },
          }
        }
      },
      endpoint: {
        "endpoint-list": {
          pageCount: 1,
          currentPage: 1,
          totalResults: 0,
          params: {
            key: 'a'
          },
          pageRequests: {
          },
          ids: {},
          clientPagination: {
            pageSize: 5,
            currentPage: 1,
            totalResults: 50,
            filter: {
              string: '',
              items: {}
            },
          }
        }
      },
      environmentVars: {},
      stats: {},
      summary: {},
      user: {
        endpointUsersService: {
          pageCount: 1,
          currentPage: 1,
          totalResults: 3,
          ids: {
            '1': [
              'bcf78136-6225-4515-bf8e-a32243deea0c',
              'hcf_auto_config',
              'b950b10c-c360-4bec-83c9-333c76cbbbe1'
            ]
          },
          pageRequests: {
            '1': {
              busy: false,
              error: false,
              message: ''
            }
          },
          params: {
            'results-per-page': 100,
            page: 1,
            'inline-relations-depth': 1,
            q: []
          },
          clientPagination: {
            pageSize: 9,
            currentPage: 1,
            filter: {
              string: '',
              items: {}
            },
            totalResults: 3
          }
        }
      },
      serviceInstance: {},
      serviceBinding: {},
      service: {},
      gitCommits: {},
      domain: {},
      metrics: {},
      servicePlan: {},
      [userProvidedServiceInstanceSchemaKey]: {}
    },
    dashboard: {
      sidenavOpen: true,
      sideNavMode: 'side',
      headerEventMinimized: false,
      sideHelpOpen: false,
      sideHelpDocument: ''
    },
    createApplication: {
      cloudFoundryDetails: null,
      name: '',
      nameCheck: {
        checking: false,
        available: true,
        name: ''
      }
    },
    createServiceInstance: {
      name: '',
      servicePlanGuid: '',
      spaceGuid: '',
      orgGuid: '',
      spaceScoped: false
    },
    deployApplication: {
      cloudFoundryDetails: null,
      applicationSource: {
        type: {
          id: '',
          name: ''
        }
      },
      projectExists: {
        checking: false,
        exists: false,
        name: '',
        error: false
      }
    },
    request: {
      servicePlanVisibility: {},
      serviceBroker: {},
      serviceInstance: {},
      servicePlan: {},
      service: {},
      serviceBinding: {},
      securityGroup: {},
      featureFlag: {},
      securityRule: {},
      buildpack: {},
      userFavorites: {},
      user: {
        'bcf78136-6225-4515-bf8e-a32243deea0c': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          creating: false,
          error: false,
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          response: null,
          message: ''
        },
        hcf_auto_config: {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          creating: false,
          error: false,
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          response: null,
          message: ''
        },
        'b950b10c-c360-4bec-83c9-333c76cbbbe1': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          creating: false,
          error: false,
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          response: null,
          message: ''
        }
      },
      domain: {},
      gitBranches: {},
      cloudFoundryInfo: {},
      gitCommits: {},
      endpoint: {
        '57ab08d8-86cc-473a-8818-25d5e8d0ea23': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        }
      },
      application: {
        '4e4858c4-24ab-4caf-87a8-7703d1da58a0': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            },
            updating: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        '40a8cd59-956c-483c-ba7d-a7161e39e5eb': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        '8b501d9e-4e27-4d7d-bdf5-8b20975137c0': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        '1463eda1-e0e1-4c70-ae5f-4c408dc098f6': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        '77c0759f-e857-4f4c-9785-299acf7b3f48': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        'c5026174-fcf7-413b-bc9a-ac3419e30a91': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        'b87f92ee-bcaa-4430-96d5-ef5b7a80214f': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        'e629c3be-e5cc-4f24-bd6e-57a83c3e4f2e': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        'a82554fb-6e81-48ba-839a-c52b55d8e37c': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        'f5f40768-7416-4400-8026-832a43e3653e': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        'e1b7b5e3-a33c-4bc2-b14d-ca7731988a7d': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        'b862b599-7e32-43da-9956-b717d85e2f33': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        '8f13b7ea-fe92-4bb4-a0e9-4c0effdf945c': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        '13321c2f-9156-498f-a4e8-318f414e8817': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        '44a63e90-8075-4708-90d9-262a81dcc77c': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        'eb0fabf1-0f49-4840-b9fb-a78f2f5433b5': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        'fd125f54-60dd-4cf3-b966-5a4391abf5fa': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        '0af78017-8c76-4d09-ae08-003c4b297fa5': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        '1b16f469-127b-440f-88ef-d4960c098bf6': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        '1b4c9820-e648-4bd9-80c8-6b5a870938c4': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        '83278b7e-feb9-41f1-ad03-06d08f9ce824': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        '610fd394-2323-45da-91e6-36b83357ad54': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        '98260847-6844-4674-8cbf-2d899171da2e': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        'c58cb952-b75d-4ed6-9ca6-426daf13570b': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        '6c6d0951-80f8-4420-b2b5-1ff404072ed6': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        'f916c732-cce2-4500-bc88-e3ca19f1394b': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        '7d046ff5-68af-4ed9-8a69-8e74b011563e': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        'ea8220f9-fd47-4c88-9e12-9fb0611f3260': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        '70b1b77f-71e2-4c06-8f4b-66486cff44af': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        '122f72b1-4c63-45f4-a607-34fc152fc551': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        '9830d869-e8c3-4ac7-b838-1e7927c4ee5f': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        '34fea963-076b-48f6-9928-11b075c1c822': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        '0fe1de5d-8e53-4f67-aafa-0c16228dc182': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        '74980881-a122-469d-9acc-a2b965abd5e9': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        '1532e7d5-643d-436e-bb74-7b60fd76265d': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        'ca76c3a6-44c4-4d7e-9ae6-d8ced5e99c44': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        '0fb015ed-a743-42e4-be08-9f09f05378bb': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        '5d5f3b86-f50b-46b3-9ed8-64f1276f99a0': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        'c6a7751f-182e-4b28-8c53-ca28243ee501': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        'a54e9401-a7d9-4a36-b548-d78507057e69': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        '658e24d6-da5f-4faa-a6ae-95bc787faa25': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        'd27915f7-55b9-427e-969b-6b0ce5a67803': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        'cdbe2006-8311-451c-aec1-72c36afd384d': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        '278ba371-59ad-4504-9b58-47f67b0fde42': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        'cb20a937-d20e-4f37-8d8a-0ec2a2a40599': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        '7c324e6f-b9fc-4cd7-a977-48276413a805': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        '29b09812-0b9c-4d10-9181-26436461914a': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        '79dbd97e-0887-49f9-80c0-444cf1f16a96': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        '683b899c-6235-406c-82dd-176db0404369': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        'c9b34793-4b14-45ae-bd1f-15e005db8583': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        '1511062e-7099-4dfb-9fa3-08d699bbd0ab': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        'eb86d68d-fd31-42c1-a711-74691775c2d8': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        '9daab4bc-6a94-401e-8456-730cf516d4c9': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        '4fbec12e-b310-42c3-831c-e70c21cccc96': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        'c5c8a9f2-a770-4ee5-8f7a-0eb6015dfe3a': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        '8c92a1ca-b7ec-4811-883c-d33ac65fce73': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        'de78601d-49ec-4ebe-9bd9-9cc104207f72': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        '14016a5f-0509-47c7-852a-98ba05ab5da8': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        '03b8edb2-bab9-47d2-89f8-0ca2dcfbb9fd': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        '44ad1092-3247-4bf1-857e-644961506f7d': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        'a9363ef2-78dc-43bf-9d15-c0c7a08a4f69': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        'cfdd8369-e88e-4648-a7dd-69b9b09dddcf': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        '2b5eb25a-e4bd-4316-a5c7-47adcba9f3f0': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        '885f1a87-e465-4826-abdc-fd8beb6564da': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        '994591c8-4f2a-4775-ad23-79ed33b99f62': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        '8a02a394-e899-4eab-97d1-dee092fbdb57': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        '85c42418-81c2-4ef5-bb4d-b1991f8f4f95': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        '687f2c3b-c10c-4aee-bf70-b5525fd585b8': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        'a63178d7-d123-4059-9976-74b7234318e6': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        'fa48e6b4-9091-40bb-9e53-2159f1cc9782': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        '365a890d-1e13-40eb-937f-d2f2ab9403eb': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        '09543d4e-73ed-4e59-b3b5-727b841a5684': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        'c318322d-8187-41a8-a1fd-bdae1ed1d24c': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        '15c480aa-8215-4bc3-959a-0814967c091e': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        'ab9c9db3-cb7d-4248-b53b-9d185b0555f6': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        '4716e251-5af8-4144-a179-1871c7217dc0': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        '6ce08a19-f87b-497c-bc93-3b5616ae40c2': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        'ee165a5e-0f37-43c1-9744-4027b5144c3a': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        '38081245-299e-42d3-847b-b08444da4553': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        'a5ff68cd-baa2-4fa4-a688-e7b840af5073': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        'db5ecb02-e05c-4742-9ad6-6f78b77d3dca': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        '9111c1c9-04b9-4d71-b494-66a68bdeef52': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        'f88c311c-4cd8-4bd5-a044-72b3d449690e': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        '76ec34ca-61b8-4a75-8abc-4a800874a851': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        'da42afa1-0bf6-4ad7-b644-40ac216efce5': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        '90adbf54-bc68-487f-b60a-3967083c7b4e': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        'c54e3d96-d4aa-441f-9b84-c313fedc06e3': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        '17e397a7-fae2-40ee-93ef-70e428932a73': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        '6c9ab603-c038-4b4b-b29e-7b440f8d2916': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        'f4091dbe-2aff-492e-b476-1b14219fdaf8': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        'c5ede50a-6787-4628-b379-848d55ee914e': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        'b18c3b6f-87bf-48c4-a8b9-48749ab63d05': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        '0e14fcb7-4a13-48bd-8d5e-fc52cbe19d2c': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        '53d2f48c-48ec-4ece-9775-d8932f77e2db': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        '879d3e3b-72df-455f-83d7-7c1183db150f': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        'cf717053-f8e6-4cd3-9bd3-9c1b0701ed45': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        'bce5e758-768d-4e92-b8d0-a3580752ddf5': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        'ef33c4d2-104b-4e04-9635-dac7a6b2face': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        '84a7f331-41c3-474f-9d3c-e8108f4702a6': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        '34026306-3b74-4405-a489-d85ec67d7860': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        '66aee61b-cf69-4a9d-966a-4dbc9ee981f1': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        '92abdead-5c38-46fd-a4c7-6fc8a0ff8176': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        '6141d1b5-1f9c-4fec-8511-3ad2f6ab71b0': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        '10e5e215-dfc1-4bad-a3bf-5a191e5466b0': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        'f06af5ef-bbf9-4285-a72a-67598cb62708': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        '6f82f89d-7900-4cf8-8e91-50c78f968628': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        '750f7bc2-c3f6-4bee-a743-9ad92a2df704': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        'e6697556-a5e2-4d03-88e6-973e1351ed0b': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        '689a218b-1b31-4d49-8766-84573372d77a': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        '0195cbb8-2d1c-4e98-bef7-19287c643ff2': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        '876b2f13-38fe-4925-bf3e-e0eccbcbb3a0': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        '7ee817ad-770d-41b9-85f7-2a7c05ec7012': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        'f6f5db80-c020-430a-ab11-d9fe5dfe925f': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        'b08ea7b4-688e-48d9-a8d9-2d04b06efcdb': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        'ef1c514f-5b19-4ce0-b840-6fe8d5f5bb46': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        '0da9d02b-93b4-4828-8058-04ff243f43b9': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        'e2a17f54-d0c3-4660-919b-b1ff585e6c05': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        'a4e2cbfd-d11e-4b5f-a5f5-3739dfdc7d1d': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        'a222dcfe-8a0d-4207-b049-14de5da5b0ae': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        'aa33e150-c962-4982-a602-d9a149ddc61b': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        '921aefc2-0bbc-4d8b-a438-1cc6dd6673e1': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        '197bef61-1a81-44ed-8d96-028a88baa4b5': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        'c73943a7-6e56-423b-b0c2-d5720f8ef9fc': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        '02325b75-1199-4269-ba0a-8366a64b91af': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        '3f3cd4e0-9cc8-41f6-9e6a-fce36ca839ae': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        '6fa0182c-2b31-4b9a-ae05-11f766fadd31': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        'e49a16ad-3afd-4320-a301-745eda859f36': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        '219d24fd-77fa-402b-98c6-085e5ce5cedd': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        '1c6acc17-5275-486f-84f2-f5c14b4afd7d': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        'ce653e40-bd26-4278-85c9-773d0ed806a2': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        '6c29687b-e2b0-4ba5-b17a-ed3b99c54f79': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        '980877d5-ff09-400d-87d3-2db36ea763d6': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        '1df7da98-ba42-4c95-af2a-3e1be5ce9824': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        '7d2981da-6ee5-47ce-948f-4769a63be5ee': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        '0c47e5fe-4b84-42b7-9ac7-6f4d52596a7f': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        'af405ff9-2da6-47c0-af4d-1e72f55e621f': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        'dbc5f72a-8703-4c9a-8919-b9e900392acb': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        }
      },
      stack: {
        '57ab08d8-86cc-473a-8818-25d5e8d0ea23': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        '73f00c1a-0ddc-43fd-8384-4b8971609874': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        'd644d75e-fe53-492f-ba19-27e5d304413a': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        '3371958e-2de6-481f-9a6d-0198b42dea6e': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        '97a1b1e4-c307-48fd-b6a5-97cc621a9bda': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        '18813ebb-8907-4c3b-8ba7-26a1632e16e9': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        'a360f093-c64d-4631-9b5e-a4a87cc47991': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        '2f93057d-9a36-4f46-bd6e-87ddb8f574a2': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        '133ce0c7-44a0-4951-bbc8-b885c2b3cd53': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        }
      },
      space: {
        'd87ba175-51ec-4cc9-916c-bee26d00e498': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        '8071af91-4b2f-4569-b76e-12a21e71d701': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        'f5e6affb-8b7b-4fa8-aea3-24df8b682a85': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        '61391638-57a8-4185-b91c-495b8869125e': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        'a59b770c-2b51-46d8-a16d-bfc0322b2e12': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        'aa775168-7be8-4006-81e5-647d59f8ee22': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        'd91c3bf0-3ab0-4372-8b08-75de137eeaf8': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        'a01435cd-3468-44de-9f0c-242afdd4ef36': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        '8da86308-f3e6-4196-b5e7-b03865b973d3': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        '78bd7c96-c182-4371-bc71-15a49eb5c5bc': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        },
        '3625beef-09b3-420c-b11b-a7bb2b1fe978': {
          fetching: false,
          updating: {
            _root_: {
              busy: false,
              error: false,
              message: ''
            }
          },
          deleting: {
            busy: false,
            error: false,
            message: '',
            deleted: false
          },
          creating: false,
          error: false,
          response: null,
          message: ''
        }
      },
      organization: {},
      route: {},
      event: {},
      system: {},
      private_domains: {},
      space_quota_definition: {},
      [userProvidedServiceInstanceSchemaKey]: {}
    },
    requestData: {
      userFavorites: {},
      servicePlanVisibility: {},
      serviceBroker: {
        'a55f1a04-e3a3-4a89-92ee-94e3f96103f3': {
          entity: {
            name: 'app-autoscaler',
            broker_url: 'https://app-autoscaler-broker.cf-dev.io',
            auth_username: 'admin',
            space_guid: null,
            guid: 'a55f1a04-e3a3-4a89-92ee-94e3f96103f3',
            cfGuid: '7d5e510b-8396-4db0-a91c-6abdc390c9d1'
          },
          metadata: {
            guid: 'a55f1a04-e3a3-4a89-92ee-94e3f96103f3',
            url: '/v2/service_brokers/a55f1a04-e3a3-4a89-92ee-94e3f96103f3',
            created_at: '2017-11-27T17:07:02Z',
            updated_at: '2017-11-27T17:07:02Z'
          }
        },
      },
      serviceInstance: {
        '250d8795-d49e-4669-acd5-b5cf94f97c7b': {
          entity: {
            name: 'Ntahtntest',
            credentials: {},
            service_plan_guid: '35f97198-390b-4d88-be93-dc917794b12d',
            space_guid: 'fa4b5a9e-8324-48d9-9de5-491892ec1cb8',
            gateway_data: null,
            dashboard_url: 'https://cf-dev.io/manage/instances/250d8795-d49e-4669-acd5-b5cf94f97c7b',
            type: 'managed_service_instance',
            last_operation: {
              type: 'create',
              state: 'succeeded',
              description: '',
              updated_at: '2018-05-22T14:53:29Z',
              created_at: '2018-05-22T14:53:29Z'
            },
            tags: [
              'sd',
              'asd',
              'asf'
            ],
            service_guid: 'd10101a2-6faf-4468-a9db-1d65eb334fab',
            space_url: '/v2/spaces/fa4b5a9e-8324-48d9-9de5-491892ec1cb8',
            service_plan_url: '/v2/service_plans/35f97198-390b-4d88-be93-dc917794b12d',
            service_bindings_url: '/v2/service_instances/250d8795-d49e-4669-acd5-b5cf94f97c7b/service_bindings',
            service_keys_url: '/v2/service_instances/250d8795-d49e-4669-acd5-b5cf94f97c7b/service_keys',
            routes_url: '/v2/service_instances/250d8795-d49e-4669-acd5-b5cf94f97c7b/routes',
            service_url: '/v2/services/d10101a2-6faf-4468-a9db-1d65eb334fab',
            guid: '250d8795-d49e-4669-acd5-b5cf94f97c7b',
            cfGuid: '7d5e510b-8396-4db0-a91c-6abdc390c9d1'
          },
          metadata: {
            guid: '250d8795-d49e-4669-acd5-b5cf94f97c7b',
            url: '/v2/service_instances/250d8795-d49e-4669-acd5-b5cf94f97c7b',
            created_at: '2018-05-22T14:53:29Z',
            updated_at: '2018-05-22T14:53:29Z'
          }
        }
      },
      servicePlan: {
        '00da4974-5037-485a-96f0-cbbbf98dc8e9': {
          entity: {
            name: 'shared',
            free: true,
            description: 'Shared service for public-service',
            service_guid: '977b0c26-9f39-46be-93f8-c33c0b37dcb0',
            extra: null,
            unique_id: '31f1eddd-af72-44bd-98d5-7ad8915c5852-plan-shared',
            'public': true,
            bindable: true,
            active: true,
            service_url: '/v2/services/977b0c26-9f39-46be-93f8-c33c0b37dcb0',
            service_instances_url: '/v2/service_plans/00da4974-5037-485a-96f0-cbbbf98dc8e9/service_instances',
            guid: '00da4974-5037-485a-96f0-cbbbf98dc8e9',
            cfGuid: '293a18c7-1504-410f-b59d-9536a5098d66'
          },
          metadata: {
            guid: '00da4974-5037-485a-96f0-cbbbf98dc8e9',
            url: '/v2/service_plans/00da4974-5037-485a-96f0-cbbbf98dc8e9',
            created_at: '2018-05-04T15:58:44Z',
            updated_at: '2018-05-04T15:58:45Z'
          }
        }
      },
      service: {
        '977b0c26-9f39-46be-93f8-c33c0b37dcb0': {
          entity: {
            label: 'public-service',
            provider: null,
            url: null,
            description: 'Shared service for public-service',
            long_description: null,
            version: null,
            info_url: null,
            active: true,
            bindable: true,
            unique_id: '31f1eddd-af72-44bd-98d5-7ad8915c5852-service-public-service',
            extra: '{"displayName":"public-service","imageUrl":"","longDescription":"","providerDisplayName":"","documentationUrl":"","supportUrl":""}',
            tags: [
              'simple',
              'shared'
            ],
            requires: [],
            documentation_url: null,
            service_broker_guid: '57eddf09-8b4a-484e-9a41-c006d219a57c',
            plan_updateable: false,
            service_plans_url: '/v2/services/977b0c26-9f39-46be-93f8-c33c0b37dcb0/service_plans',
            service_plans: [],
            guid: '977b0c26-9f39-46be-93f8-c33c0b37dcb0',
            cfGuid: '293a18c7-1504-410f-b59d-9536a5098d66'
          },
          metadata: {
            guid: '977b0c26-9f39-46be-93f8-c33c0b37dcb0',
            url: '/v2/services/977b0c26-9f39-46be-93f8-c33c0b37dcb0',
            created_at: '2018-05-04T15:58:44Z',
            updated_at: '2018-05-04T15:58:44Z'
          }
        },
      },
      serviceBinding: {},
      securityGroup: {},
      featureFlag: {},
      securityRule: {},
      buildpack: {},
      user: {
        'bcf78136-6225-4515-bf8e-a32243deea0c': {
          entity: {
            admin: false,
            active: true,
            default_space_guid: null,
            username: 'admin',
            spaces_url: '/v2/users/bcf78136-6225-4515-bf8e-a32243deea0c/spaces',
            organizations_url: '/v2/users/bcf78136-6225-4515-bf8e-a32243deea0c/organizations',
            organizations: [
              {
                metadata: {
                  guid: '815a79fa-58dc-433f-b4a6-b3e06c4dda77',
                  url: '/v2/organizations/815a79fa-58dc-433f-b4a6-b3e06c4dda77',
                  created_at: '2018-01-03T15:22:10Z',
                  updated_at: '2018-01-03T15:22:10Z'
                },
                entity: {
                  name: 'e2e',
                  billing_enabled: false,
                  quota_definition_guid: 'e1480546-27e0-45a2-9bf1-e445e1b06b28',
                  status: 'active',
                  default_isolation_segment_guid: null,
                  quota_definition_url: '/v2/quota_definitions/e1480546-27e0-45a2-9bf1-e445e1b06b28',
                  spaces_url: '/v2/organizations/815a79fa-58dc-433f-b4a6-b3e06c4dda77/spaces',
                  domains_url: '/v2/organizations/815a79fa-58dc-433f-b4a6-b3e06c4dda77/domains',
                  private_domains_url: '/v2/organizations/815a79fa-58dc-433f-b4a6-b3e06c4dda77/private_domains',
                  users_url: '/v2/organizations/815a79fa-58dc-433f-b4a6-b3e06c4dda77/users',
                  managers_url: '/v2/organizations/815a79fa-58dc-433f-b4a6-b3e06c4dda77/managers',
                  billing_managers_url: '/v2/organizations/815a79fa-58dc-433f-b4a6-b3e06c4dda77/billing_managers',
                  auditors_url: '/v2/organizations/815a79fa-58dc-433f-b4a6-b3e06c4dda77/auditors',
                  app_events_url: '/v2/organizations/815a79fa-58dc-433f-b4a6-b3e06c4dda77/app_events',
                  space_quota_definitions_url: '/v2/organizations/815a79fa-58dc-433f-b4a6-b3e06c4dda77/space_quota_definitions'
                }
              },
              {
                metadata: {
                  guid: 'bd46bccd-6a1e-441a-b107-8969785054e0',
                  url: '/v2/organizations/bd46bccd-6a1e-441a-b107-8969785054e0',
                  created_at: '2018-01-03T15:22:21Z',
                  updated_at: '2018-01-03T15:22:21Z'
                },
                entity: {
                  name: 'SUSE',
                  billing_enabled: false,
                  quota_definition_guid: 'e1480546-27e0-45a2-9bf1-e445e1b06b28',
                  status: 'active',
                  default_isolation_segment_guid: null,
                  quota_definition_url: '/v2/quota_definitions/e1480546-27e0-45a2-9bf1-e445e1b06b28',
                  spaces_url: '/v2/organizations/bd46bccd-6a1e-441a-b107-8969785054e0/spaces',
                  domains_url: '/v2/organizations/bd46bccd-6a1e-441a-b107-8969785054e0/domains',
                  private_domains_url: '/v2/organizations/bd46bccd-6a1e-441a-b107-8969785054e0/private_domains',
                  users_url: '/v2/organizations/bd46bccd-6a1e-441a-b107-8969785054e0/users',
                  managers_url: '/v2/organizations/bd46bccd-6a1e-441a-b107-8969785054e0/managers',
                  billing_managers_url: '/v2/organizations/bd46bccd-6a1e-441a-b107-8969785054e0/billing_managers',
                  auditors_url: '/v2/organizations/bd46bccd-6a1e-441a-b107-8969785054e0/auditors',
                  app_events_url: '/v2/organizations/bd46bccd-6a1e-441a-b107-8969785054e0/app_events',
                  space_quota_definitions_url: '/v2/organizations/bd46bccd-6a1e-441a-b107-8969785054e0/space_quota_definitions'
                }
              },
              {
                metadata: {
                  guid: '4e229771-2d4d-4765-aed4-419cd937d1f8',
                  url: '/v2/organizations/4e229771-2d4d-4765-aed4-419cd937d1f8',
                  created_at: '2018-02-14T10:25:42Z',
                  updated_at: '2018-02-14T10:25:42Z'
                },
                entity: {
                  name: 'TestCases',
                  billing_enabled: false,
                  quota_definition_guid: 'e1480546-27e0-45a2-9bf1-e445e1b06b28',
                  status: 'active',
                  default_isolation_segment_guid: null,
                  quota_definition_url: '/v2/quota_definitions/e1480546-27e0-45a2-9bf1-e445e1b06b28',
                  spaces_url: '/v2/organizations/4e229771-2d4d-4765-aed4-419cd937d1f8/spaces',
                  domains_url: '/v2/organizations/4e229771-2d4d-4765-aed4-419cd937d1f8/domains',
                  private_domains_url: '/v2/organizations/4e229771-2d4d-4765-aed4-419cd937d1f8/private_domains',
                  users_url: '/v2/organizations/4e229771-2d4d-4765-aed4-419cd937d1f8/users',
                  managers_url: '/v2/organizations/4e229771-2d4d-4765-aed4-419cd937d1f8/managers',
                  billing_managers_url: '/v2/organizations/4e229771-2d4d-4765-aed4-419cd937d1f8/billing_managers',
                  auditors_url: '/v2/organizations/4e229771-2d4d-4765-aed4-419cd937d1f8/auditors',
                  app_events_url: '/v2/organizations/4e229771-2d4d-4765-aed4-419cd937d1f8/app_events',
                  space_quota_definitions_url: '/v2/organizations/4e229771-2d4d-4765-aed4-419cd937d1f8/space_quota_definitions'
                }
              }
            ],
            managed_organizations_url: '/v2/users/bcf78136-6225-4515-bf8e-a32243deea0c/managed_organizations',
            managed_organizations: [
              {
                metadata: {
                  guid: '815a79fa-58dc-433f-b4a6-b3e06c4dda77',
                  url: '/v2/organizations/815a79fa-58dc-433f-b4a6-b3e06c4dda77',
                  created_at: '2018-01-03T15:22:10Z',
                  updated_at: '2018-01-03T15:22:10Z'
                },
                entity: {
                  name: 'e2e',
                  billing_enabled: false,
                  quota_definition_guid: 'e1480546-27e0-45a2-9bf1-e445e1b06b28',
                  status: 'active',
                  default_isolation_segment_guid: null,
                  quota_definition_url: '/v2/quota_definitions/e1480546-27e0-45a2-9bf1-e445e1b06b28',
                  spaces_url: '/v2/organizations/815a79fa-58dc-433f-b4a6-b3e06c4dda77/spaces',
                  domains_url: '/v2/organizations/815a79fa-58dc-433f-b4a6-b3e06c4dda77/domains',
                  private_domains_url: '/v2/organizations/815a79fa-58dc-433f-b4a6-b3e06c4dda77/private_domains',
                  users_url: '/v2/organizations/815a79fa-58dc-433f-b4a6-b3e06c4dda77/users',
                  managers_url: '/v2/organizations/815a79fa-58dc-433f-b4a6-b3e06c4dda77/managers',
                  billing_managers_url: '/v2/organizations/815a79fa-58dc-433f-b4a6-b3e06c4dda77/billing_managers',
                  auditors_url: '/v2/organizations/815a79fa-58dc-433f-b4a6-b3e06c4dda77/auditors',
                  app_events_url: '/v2/organizations/815a79fa-58dc-433f-b4a6-b3e06c4dda77/app_events',
                  space_quota_definitions_url: '/v2/organizations/815a79fa-58dc-433f-b4a6-b3e06c4dda77/space_quota_definitions'
                }
              },
              {
                metadata: {
                  guid: 'bd46bccd-6a1e-441a-b107-8969785054e0',
                  url: '/v2/organizations/bd46bccd-6a1e-441a-b107-8969785054e0',
                  created_at: '2018-01-03T15:22:21Z',
                  updated_at: '2018-01-03T15:22:21Z'
                },
                entity: {
                  name: 'SUSE',
                  billing_enabled: false,
                  quota_definition_guid: 'e1480546-27e0-45a2-9bf1-e445e1b06b28',
                  status: 'active',
                  default_isolation_segment_guid: null,
                  quota_definition_url: '/v2/quota_definitions/e1480546-27e0-45a2-9bf1-e445e1b06b28',
                  spaces_url: '/v2/organizations/bd46bccd-6a1e-441a-b107-8969785054e0/spaces',
                  domains_url: '/v2/organizations/bd46bccd-6a1e-441a-b107-8969785054e0/domains',
                  private_domains_url: '/v2/organizations/bd46bccd-6a1e-441a-b107-8969785054e0/private_domains',
                  users_url: '/v2/organizations/bd46bccd-6a1e-441a-b107-8969785054e0/users',
                  managers_url: '/v2/organizations/bd46bccd-6a1e-441a-b107-8969785054e0/managers',
                  billing_managers_url: '/v2/organizations/bd46bccd-6a1e-441a-b107-8969785054e0/billing_managers',
                  auditors_url: '/v2/organizations/bd46bccd-6a1e-441a-b107-8969785054e0/auditors',
                  app_events_url: '/v2/organizations/bd46bccd-6a1e-441a-b107-8969785054e0/app_events',
                  space_quota_definitions_url: '/v2/organizations/bd46bccd-6a1e-441a-b107-8969785054e0/space_quota_definitions'
                }
              },
              {
                metadata: {
                  guid: '4e229771-2d4d-4765-aed4-419cd937d1f8',
                  url: '/v2/organizations/4e229771-2d4d-4765-aed4-419cd937d1f8',
                  created_at: '2018-02-14T10:25:42Z',
                  updated_at: '2018-02-14T10:25:42Z'
                },
                entity: {
                  name: 'TestCases',
                  billing_enabled: false,
                  quota_definition_guid: 'e1480546-27e0-45a2-9bf1-e445e1b06b28',
                  status: 'active',
                  default_isolation_segment_guid: null,
                  quota_definition_url: '/v2/quota_definitions/e1480546-27e0-45a2-9bf1-e445e1b06b28',
                  spaces_url: '/v2/organizations/4e229771-2d4d-4765-aed4-419cd937d1f8/spaces',
                  domains_url: '/v2/organizations/4e229771-2d4d-4765-aed4-419cd937d1f8/domains',
                  private_domains_url: '/v2/organizations/4e229771-2d4d-4765-aed4-419cd937d1f8/private_domains',
                  users_url: '/v2/organizations/4e229771-2d4d-4765-aed4-419cd937d1f8/users',
                  managers_url: '/v2/organizations/4e229771-2d4d-4765-aed4-419cd937d1f8/managers',
                  billing_managers_url: '/v2/organizations/4e229771-2d4d-4765-aed4-419cd937d1f8/billing_managers',
                  auditors_url: '/v2/organizations/4e229771-2d4d-4765-aed4-419cd937d1f8/auditors',
                  app_events_url: '/v2/organizations/4e229771-2d4d-4765-aed4-419cd937d1f8/app_events',
                  space_quota_definitions_url: '/v2/organizations/4e229771-2d4d-4765-aed4-419cd937d1f8/space_quota_definitions'
                }
              }
            ],
            billing_managed_organizations_url: '/v2/users/bcf78136-6225-4515-bf8e-a32243deea0c/billing_managed_organizations',
            billing_managed_organizations: [],
            audited_organizations_url: '/v2/users/bcf78136-6225-4515-bf8e-a32243deea0c/audited_organizations',
            audited_organizations: [],
            managed_spaces_url: '/v2/users/bcf78136-6225-4515-bf8e-a32243deea0c/managed_spaces',
            audited_spaces_url: '/v2/users/bcf78136-6225-4515-bf8e-a32243deea0c/audited_spaces',
            audited_spaces: [],
            guid: 'bcf78136-6225-4515-bf8e-a32243deea0c',
            cfGuid: testSCFGuid
          },
          metadata: {
            guid: 'bcf78136-6225-4515-bf8e-a32243deea0c',
            url: '/v2/users/bcf78136-6225-4515-bf8e-a32243deea0c',
            created_at: '2018-01-03T15:22:09Z',
            updated_at: '2018-01-03T15:22:09Z'
          }
        },
        hcf_auto_config: {
          entity: {
            admin: false,
            active: true,
            default_space_guid: null,
            spaces_url: '/v2/users/hcf_auto_config/spaces',
            spaces: [],
            organizations_url: '/v2/users/hcf_auto_config/organizations',
            organizations: [],
            managed_organizations_url: '/v2/users/hcf_auto_config/managed_organizations',
            managed_organizations: [],
            billing_managed_organizations_url: '/v2/users/hcf_auto_config/billing_managed_organizations',
            billing_managed_organizations: [],
            audited_organizations_url: '/v2/users/hcf_auto_config/audited_organizations',
            audited_organizations: [],
            managed_spaces_url: '/v2/users/hcf_auto_config/managed_spaces',
            managed_spaces: [],
            audited_spaces_url: '/v2/users/hcf_auto_config/audited_spaces',
            audited_spaces: [],
            guid: 'hcf_auto_config',
            cfGuid: testSCFGuid
          },
          metadata: {
            guid: 'hcf_auto_config',
            url: '/v2/users/hcf_auto_config',
            created_at: '2018-01-03T15:22:13Z',
            updated_at: '2018-01-03T15:22:13Z'
          }
        },
        'b950b10c-c360-4bec-83c9-333c76cbbbe1': {
          entity: {
            admin: false,
            active: false,
            default_space_guid: null,
            username: 'e2e',
            spaces_url: '/v2/users/b950b10c-c360-4bec-83c9-333c76cbbbe1/spaces',
            spaces: [
              {
                metadata: {
                  guid: 'd612962c-ce25-4c4f-87f6-2821e466eb4e',
                  url: '/v2/spaces/d612962c-ce25-4c4f-87f6-2821e466eb4e',
                  created_at: '2018-01-03T15:22:13Z',
                  updated_at: '2018-01-03T15:22:13Z'
                },
                entity: {
                  name: 'e2e',
                  organization_guid: '815a79fa-58dc-433f-b4a6-b3e06c4dda77',
                  space_quota_definition_guid: null,
                  isolation_segment_guid: null,
                  allow_ssh: true,
                  organization_url: '/v2/organizations/815a79fa-58dc-433f-b4a6-b3e06c4dda77',
                  developers_url: '/v2/spaces/d612962c-ce25-4c4f-87f6-2821e466eb4e/developers',
                  managers_url: '/v2/spaces/d612962c-ce25-4c4f-87f6-2821e466eb4e/managers',
                  auditors_url: '/v2/spaces/d612962c-ce25-4c4f-87f6-2821e466eb4e/auditors',
                  apps_url: '/v2/spaces/d612962c-ce25-4c4f-87f6-2821e466eb4e/apps',
                  routes_url: '/v2/spaces/d612962c-ce25-4c4f-87f6-2821e466eb4e/routes',
                  domains_url: '/v2/spaces/d612962c-ce25-4c4f-87f6-2821e466eb4e/domains',
                  service_instances_url: '/v2/spaces/d612962c-ce25-4c4f-87f6-2821e466eb4e/service_instances',
                  app_events_url: '/v2/spaces/d612962c-ce25-4c4f-87f6-2821e466eb4e/app_events',
                  events_url: '/v2/spaces/d612962c-ce25-4c4f-87f6-2821e466eb4e/events',
                  security_groups_url: '/v2/spaces/d612962c-ce25-4c4f-87f6-2821e466eb4e/security_groups',
                  staging_security_groups_url: '/v2/spaces/d612962c-ce25-4c4f-87f6-2821e466eb4e/staging_security_groups'
                }
              }
            ],
            organizations_url: '/v2/users/b950b10c-c360-4bec-83c9-333c76cbbbe1/organizations',
            organizations: [
              {
                metadata: {
                  guid: '815a79fa-58dc-433f-b4a6-b3e06c4dda77',
                  url: '/v2/organizations/815a79fa-58dc-433f-b4a6-b3e06c4dda77',
                  created_at: '2018-01-03T15:22:10Z',
                  updated_at: '2018-01-03T15:22:10Z'
                },
                entity: {
                  name: 'e2e',
                  billing_enabled: false,
                  quota_definition_guid: 'e1480546-27e0-45a2-9bf1-e445e1b06b28',
                  status: 'active',
                  default_isolation_segment_guid: null,
                  quota_definition_url: '/v2/quota_definitions/e1480546-27e0-45a2-9bf1-e445e1b06b28',
                  spaces_url: '/v2/organizations/815a79fa-58dc-433f-b4a6-b3e06c4dda77/spaces',
                  domains_url: '/v2/organizations/815a79fa-58dc-433f-b4a6-b3e06c4dda77/domains',
                  private_domains_url: '/v2/organizations/815a79fa-58dc-433f-b4a6-b3e06c4dda77/private_domains',
                  users_url: '/v2/organizations/815a79fa-58dc-433f-b4a6-b3e06c4dda77/users',
                  managers_url: '/v2/organizations/815a79fa-58dc-433f-b4a6-b3e06c4dda77/managers',
                  billing_managers_url: '/v2/organizations/815a79fa-58dc-433f-b4a6-b3e06c4dda77/billing_managers',
                  auditors_url: '/v2/organizations/815a79fa-58dc-433f-b4a6-b3e06c4dda77/auditors',
                  app_events_url: '/v2/organizations/815a79fa-58dc-433f-b4a6-b3e06c4dda77/app_events',
                  space_quota_definitions_url: '/v2/organizations/815a79fa-58dc-433f-b4a6-b3e06c4dda77/space_quota_definitions'
                }
              }
            ],
            managed_organizations_url: '/v2/users/b950b10c-c360-4bec-83c9-333c76cbbbe1/managed_organizations',
            managed_organizations: [],
            billing_managed_organizations_url: '/v2/users/b950b10c-c360-4bec-83c9-333c76cbbbe1/billing_managed_organizations',
            billing_managed_organizations: [],
            audited_organizations_url: '/v2/users/b950b10c-c360-4bec-83c9-333c76cbbbe1/audited_organizations',
            audited_organizations: [],
            managed_spaces_url: '/v2/users/b950b10c-c360-4bec-83c9-333c76cbbbe1/managed_spaces',
            managed_spaces: [],
            audited_spaces_url: '/v2/users/b950b10c-c360-4bec-83c9-333c76cbbbe1/audited_spaces',
            audited_spaces: [],
            guid: 'b950b10c-c360-4bec-83c9-333c76cbbbe1',
            cfGuid: testSCFGuid
          },
          metadata: {
            guid: 'b950b10c-c360-4bec-83c9-333c76cbbbe1',
            url: '/v2/users/b950b10c-c360-4bec-83c9-333c76cbbbe1',
            created_at: '2018-01-03T15:22:18Z',
            updated_at: '2018-01-03T15:22:18Z'
          }
        }
      },
      domain: {},
      cloudFoundryInfo: {},
      gitBranches: {},
      gitCommits: {},
      application: {
        '4e4858c4-24ab-4caf-87a8-7703d1da58a0': {
          entity: {
            name: 'go-env',
            production: false,
            space_guid: 'd87ba175-51ec-4cc9-916c-bee26d00e498',
            stack_guid: '57ab08d8-86cc-473a-8818-25d5e8d0ea23',
            buildpack: null,
            detected_buildpack: 'Go',
            detected_buildpack_guid: '4775ecbe-494f-4f1f-a0ea-24a8a816e05f',
            environment_json: {
              BASE_GUID: '826fcda4-80e1-11e7-aead-9372473ff564',
              CREDENTIALS: '{"port": "4000", "host": "1.2.3.4"}',
              SERVICE_NAME: 'app-autoscaler',
              SERVICE_PLAN_NAME: 'shared',
              TAGS: 'simple,shared'
            },
            memory: 16,
            instances: 1,
            disk_quota: 16,
            state: 'STARTED',
            version: '2dc814c5-2dbf-4bb0-9203-78ec06ef465c',
            command: null,
            console: false,
            debug: null,
            staging_task_id: 'e7736632-0cde-4dbb-b660-195d99dda9c9',
            package_state: 'STAGED',
            health_check_type: 'process',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: '2017-10-10T09:30:15Z',
            detected_start_command: 'go-env',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/d87ba175-51ec-4cc9-916c-bee26d00e498',
            space: 'd87ba175-51ec-4cc9-916c-bee26d00e498',
            stack_url: '/v2/stacks/57ab08d8-86cc-473a-8818-25d5e8d0ea23',
            stack: '57ab08d8-86cc-473a-8818-25d5e8d0ea23',
            routes_url: '/v2/apps/4e4858c4-24ab-4caf-87a8-7703d1da58a0/routes',
            routes: [],
            events_url: '/v2/apps/4e4858c4-24ab-4caf-87a8-7703d1da58a0/events',
            service_bindings_url: '/v2/apps/4e4858c4-24ab-4caf-87a8-7703d1da58a0/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/4e4858c4-24ab-4caf-87a8-7703d1da58a0/route_mappings',
            guid: '4e4858c4-24ab-4caf-87a8-7703d1da58a0',
            cfGuid: testSCFGuid
          },
          metadata: {
            guid: '4e4858c4-24ab-4caf-87a8-7703d1da58a0',
            url: '/v2/apps/4e4858c4-24ab-4caf-87a8-7703d1da58a0',
            created_at: '2017-10-10T09:30:15Z',
            updated_at: '2017-10-10T09:30:21Z'
          }
        },
        '40a8cd59-956c-483c-ba7d-a7161e39e5eb': {
          entity: {
            name: 'app-autoscaler-broker',
            production: false,
            space_guid: 'd87ba175-51ec-4cc9-916c-bee26d00e498',
            stack_guid: '73f00c1a-0ddc-43fd-8384-4b8971609874',
            buildpack: null,
            detected_buildpack: 'Go',
            detected_buildpack_guid: '4775ecbe-494f-4f1f-a0ea-24a8a816e05f',
            environment_json: {
              BASE_GUID: '826fcda4-80e1-11e7-aead-9372473ff564',
              CREDENTIALS: '{"port": "4000", "host": "1.2.3.4"}',
              SERVICE_NAME: 'app-autoscaler',
              SERVICE_PLAN_NAME: 'shared',
              TAGS: 'simple,shared'
            },
            memory: 128,
            instances: 1,
            disk_quota: 256,
            state: 'STARTED',
            version: '1ee3bcb9-d53f-4694-a4f6-20d672dd8602',
            command: null,
            console: false,
            debug: null,
            staging_task_id: '210e1285-bc70-4377-a098-afb3b639b02e',
            package_state: 'STAGED',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: '2017-10-10T09:32:00Z',
            detected_start_command: 'worlds-simplest-service-broker',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/d87ba175-51ec-4cc9-916c-bee26d00e498',
            space: 'd87ba175-51ec-4cc9-916c-bee26d00e498',
            stack_url: '/v2/stacks/73f00c1a-0ddc-43fd-8384-4b8971609874',
            stack: '73f00c1a-0ddc-43fd-8384-4b8971609874',
            routes_url: '/v2/apps/40a8cd59-956c-483c-ba7d-a7161e39e5eb/routes',
            routes: [
              {
                metadata: {
                  guid: '255dd039-2a61-440b-a1d1-3cac1d6784da',
                  url: '/v2/routes/255dd039-2a61-440b-a1d1-3cac1d6784da',
                  created_at: '2017-10-10T09:31:59Z',
                  updated_at: '2017-10-10T09:31:59Z'
                },
                entity: {
                  host: 'app-autoscaler-broker',
                  path: '',
                  domain_guid: 'ffaa691e-2092-4ed4-8cb2-eb97fa5b34f1',
                  space_guid: 'd87ba175-51ec-4cc9-916c-bee26d00e498',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/ffaa691e-2092-4ed4-8cb2-eb97fa5b34f1',
                  domain: {
                    metadata: {
                      guid: 'ffaa691e-2092-4ed4-8cb2-eb97fa5b34f1',
                      url: '/v2/shared_domains/ffaa691e-2092-4ed4-8cb2-eb97fa5b34f1',
                      created_at: '2017-10-10T09:16:50Z',
                      updated_at: '2017-10-10T09:16:50Z'
                    },
                    entity: {
                      name: 'cf-dev.io',
                      router_group_guid: null,
                      router_group_type: null
                    }
                  },
                  space_url: '/v2/spaces/d87ba175-51ec-4cc9-916c-bee26d00e498',
                  space: {
                    metadata: {
                      guid: 'd87ba175-51ec-4cc9-916c-bee26d00e498',
                      url: '/v2/spaces/d87ba175-51ec-4cc9-916c-bee26d00e498',
                      created_at: '2017-10-10T09:28:48Z',
                      updated_at: '2017-10-10T09:28:48Z'
                    },
                    entity: {
                      name: 'dev',
                      organization_guid: 'a63027a8-e160-4e71-ad59-6675aa94a886',
                      space_quota_definition_guid: null,
                      isolation_segment_guid: null,
                      allow_ssh: true,
                      organization_url: '/v2/organizations/a63027a8-e160-4e71-ad59-6675aa94a886',
                      developers_url: '/v2/spaces/d87ba175-51ec-4cc9-916c-bee26d00e498/developers',
                      managers_url: '/v2/spaces/d87ba175-51ec-4cc9-916c-bee26d00e498/managers',
                      auditors_url: '/v2/spaces/d87ba175-51ec-4cc9-916c-bee26d00e498/auditors',
                      apps_url: '/v2/spaces/d87ba175-51ec-4cc9-916c-bee26d00e498/apps',
                      routes_url: '/v2/spaces/d87ba175-51ec-4cc9-916c-bee26d00e498/routes',
                      domains_url: '/v2/spaces/d87ba175-51ec-4cc9-916c-bee26d00e498/domains',
                      service_instances_url: '/v2/spaces/d87ba175-51ec-4cc9-916c-bee26d00e498/service_instances',
                      app_events_url: '/v2/spaces/d87ba175-51ec-4cc9-916c-bee26d00e498/app_events',
                      events_url: '/v2/spaces/d87ba175-51ec-4cc9-916c-bee26d00e498/events',
                      security_groups_url: '/v2/spaces/d87ba175-51ec-4cc9-916c-bee26d00e498/security_groups',
                      staging_security_groups_url: '/v2/spaces/d87ba175-51ec-4cc9-916c-bee26d00e498/staging_security_groups'
                    }
                  },
                  apps_url: '/v2/routes/255dd039-2a61-440b-a1d1-3cac1d6784da/apps',
                  route_mappings_url: '/v2/routes/255dd039-2a61-440b-a1d1-3cac1d6784da/route_mappings'
                }
              }
            ],
            events_url: '/v2/apps/40a8cd59-956c-483c-ba7d-a7161e39e5eb/events',
            service_bindings_url: '/v2/apps/40a8cd59-956c-483c-ba7d-a7161e39e5eb/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/40a8cd59-956c-483c-ba7d-a7161e39e5eb/route_mappings',
            guid: '40a8cd59-956c-483c-ba7d-a7161e39e5eb',
            cfGuid: testSCFGuid
          },
          metadata: {
            guid: '40a8cd59-956c-483c-ba7d-a7161e39e5eb',
            url: '/v2/apps/40a8cd59-956c-483c-ba7d-a7161e39e5eb',
            created_at: '2017-10-10T09:31:58Z',
            updated_at: '2017-10-10T09:32:11Z'
          }
        },
        '8b501d9e-4e27-4d7d-bdf5-8b20975137c0': {
          entity: {
            name: 'go-env',
            production: false,
            space_guid: '8071af91-4b2f-4569-b76e-12a21e71d701',
            stack_guid: 'd644d75e-fe53-492f-ba19-27e5d304413a',
            buildpack: null,
            detected_buildpack: 'Go',
            detected_buildpack_guid: '184826e2-57f6-4dec-a09d-3af3cdc81646',
            environment_json: {
              STRATOS_PROJECT: '{"deploySource":{"type":"github","timestamp":1506186204,"project":"nwmac/cf-demo-app"' +
                ',"branch":"master","url":"https://github.com/nwmac/cf-demo-app","commit":"9249fe2f739b93770e0d85ce5578df0cd22355b8\\n"}}'
            },
            memory: 64,
            instances: 1,
            disk_quota: 16,
            state: 'STARTED',
            version: '6f2a8f4d-84dd-4da5-a236-b246a300f655',
            command: null,
            console: false,
            debug: null,
            staging_task_id: 'ce38f1ac-f2aa-4ce7-a312-5d1f8cb3c136',
            package_state: 'STAGED',
            health_check_type: 'process',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: '2017-08-10T13:47:33Z',
            detected_start_command: 'go-env',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/8071af91-4b2f-4569-b76e-12a21e71d701',
            space: '8071af91-4b2f-4569-b76e-12a21e71d701',
            stack_url: '/v2/stacks/d644d75e-fe53-492f-ba19-27e5d304413a',
            stack: 'd644d75e-fe53-492f-ba19-27e5d304413a',
            routes_url: '/v2/apps/8b501d9e-4e27-4d7d-bdf5-8b20975137c0/routes',
            routes: [],
            events_url: '/v2/apps/8b501d9e-4e27-4d7d-bdf5-8b20975137c0/events',
            service_bindings_url: '/v2/apps/8b501d9e-4e27-4d7d-bdf5-8b20975137c0/service_bindings',
            service_bindings: [
              {
                metadata: {
                  guid: '92148eea-7d7a-4e3f-8938-f67837b8e316',
                  url: '/v2/service_bindings/92148eea-7d7a-4e3f-8938-f67837b8e316',
                  created_at: '2017-08-22T14:49:06Z',
                  updated_at: '2017-08-22T14:49:06Z'
                },
                entity: {
                  app_guid: '8b501d9e-4e27-4d7d-bdf5-8b20975137c0',
                  service_instance_guid: 'bfae68fb-b981-4ee2-88ec-70176f7a7c93',
                  credentials: {
                    hostname: 'mysql-proxy.cf.svc.cluster.local',
                    port: 3306,
                    name: 'cf_bfae68fb_b981_4ee2_88ec_70176f7a7c93',
                    username: 'Ylgy7uLdvkyzTMKe',
                    password: 'wScrF2EvIdScRHgW',
                    uri: 'mysql://Ylgy7uLdvkyzTMKe:wScrF2EvIdScRHgW@mysql-proxy.cf.svc.cluster.local'
                      +
                      ':3306/cf_bfae68fb_b981_4ee2_88ec_70176f7a7c93?reconnect=true',
                    jdbcUrl: 'jdbc:mysql://mysql-proxy.cf.svc.cluster.local:3306/cf_bfae68fb_b981_4ee2_88ec_70176f7a7c93?user=Ylgy7uLdvkyzTMKe&password=wScrF2EvIdScRHgW'
                  },
                  binding_options: {},
                  gateway_data: null,
                  gateway_name: '',
                  syslog_drain_url: null,
                  volume_mounts: [],
                  app_url: '/v2/apps/8b501d9e-4e27-4d7d-bdf5-8b20975137c0',
                  service_instance_url: '/v2/service_instances/bfae68fb-b981-4ee2-88ec-70176f7a7c93',
                  service_instance: {
                    metadata: {
                      guid: 'bfae68fb-b981-4ee2-88ec-70176f7a7c93',
                      url: '/v2/service_instances/bfae68fb-b981-4ee2-88ec-70176f7a7c93',
                      created_at: '2017-08-22T14:49:05Z',
                      updated_at: '2017-08-22T14:49:05Z'
                    },
                    entity: {
                      name: 'NathanTest123',
                      credentials: {},
                      service_plan_guid: '3c1b3320-d1a9-40e4-91b4-5841c3239cce',
                      space_guid: '8071af91-4b2f-4569-b76e-12a21e71d701',
                      gateway_data: null,
                      dashboard_url: 'https://cf-dev.io/manage/instances/bfae68fb-b981-4ee2-88ec-70176f7a7c93',
                      type: 'managed_service_instance',
                      last_operation: {
                        type: 'create',
                        state: 'succeeded',
                        description: '',
                        updated_at: '2017-08-22T14:49:05Z',
                        created_at: '2017-08-22T14:49:05Z'
                      },
                      tags: [],
                      service_guid: '606e5ecd-eea1-47df-b4f0-dc833642e1ac',
                      space_url: '/v2/spaces/8071af91-4b2f-4569-b76e-12a21e71d701',
                      service_plan_url: '/v2/service_plans/3c1b3320-d1a9-40e4-91b4-5841c3239cce',
                      service_bindings_url: '/v2/service_instances/bfae68fb-b981-4ee2-88ec-70176f7a7c93/service_bindings',
                      service_keys_url: '/v2/service_instances/bfae68fb-b981-4ee2-88ec-70176f7a7c93/service_keys',
                      routes_url: '/v2/service_instances/bfae68fb-b981-4ee2-88ec-70176f7a7c93/routes',
                      service_url: '/v2/services/606e5ecd-eea1-47df-b4f0-dc833642e1ac'
                    }
                  }
                }
              },
              {
                metadata: {
                  guid: 'a65efb8f-d748-4abe-a879-d2da4d64e289',
                  url: '/v2/service_bindings/a65efb8f-d748-4abe-a879-d2da4d64e289',
                  created_at: '2017-08-24T11:03:36Z',
                  updated_at: '2017-08-24T11:03:36Z'
                },
                entity: {
                  app_guid: '8b501d9e-4e27-4d7d-bdf5-8b20975137c0',
                  service_instance_guid: 'd88b9115-139e-43a7-9d80-a1f4953fdd10',
                  credentials: {
                    host: '1.2.3.4',
                    port: '4000'
                  },
                  binding_options: {},
                  gateway_data: null,
                  gateway_name: '',
                  syslog_drain_url: null,
                  volume_mounts: [],
                  app_url: '/v2/apps/8b501d9e-4e27-4d7d-bdf5-8b20975137c0',
                  service_instance_url: '/v2/service_instances/d88b9115-139e-43a7-9d80-a1f4953fdd10',
                  service_instance: {
                    metadata: {
                      guid: 'd88b9115-139e-43a7-9d80-a1f4953fdd10',
                      url: '/v2/service_instances/d88b9115-139e-43a7-9d80-a1f4953fdd10',
                      created_at: '2017-08-18T14:51:43Z',
                      updated_at: '2017-08-18T14:51:43Z'
                    },
                    entity: {
                      name: 'test',
                      credentials: {},
                      service_plan_guid: '549409b6-b754-4643-a83b-885dbcfd2dfb',
                      space_guid: '8071af91-4b2f-4569-b76e-12a21e71d701',
                      gateway_data: null,
                      dashboard_url: 'https://app-autoscaler-broker.cf-dev.io/dashboard',
                      type: 'managed_service_instance',
                      last_operation: {
                        type: 'create',
                        state: 'succeeded',
                        description: '',
                        updated_at: '2017-08-18T14:51:43Z',
                        created_at: '2017-08-18T14:51:43Z'
                      },
                      tags: [],
                      service_guid: '43b1c1bd-0a26-4986-adcc-700d56559f1e',
                      space_url: '/v2/spaces/8071af91-4b2f-4569-b76e-12a21e71d701',
                      service_plan_url: '/v2/service_plans/549409b6-b754-4643-a83b-885dbcfd2dfb',
                      service_bindings_url: '/v2/service_instances/d88b9115-139e-43a7-9d80-a1f4953fdd10/service_bindings',
                      service_keys_url: '/v2/service_instances/d88b9115-139e-43a7-9d80-a1f4953fdd10/service_keys',
                      routes_url: '/v2/service_instances/d88b9115-139e-43a7-9d80-a1f4953fdd10/routes',
                      service_url: '/v2/services/43b1c1bd-0a26-4986-adcc-700d56559f1e'
                    }
                  }
                }
              }
            ],
            route_mappings_url: '/v2/apps/8b501d9e-4e27-4d7d-bdf5-8b20975137c0/route_mappings',
            guid: '8b501d9e-4e27-4d7d-bdf5-8b20975137c0',
            cfGuid: '521a9d96-2d6c-4d94-a555-807437ab106d'
          },
          metadata: {
            guid: '8b501d9e-4e27-4d7d-bdf5-8b20975137c0',
            url: '/v2/apps/8b501d9e-4e27-4d7d-bdf5-8b20975137c0',
            created_at: '2017-08-10T13:47:33Z',
            updated_at: '2017-10-06T14:32:08Z'
          }
        },
        '1463eda1-e0e1-4c70-ae5f-4c408dc098f6': {
          entity: {
            name: 'app-autoscaler-broker',
            production: false,
            space_guid: 'f5e6affb-8b7b-4fa8-aea3-24df8b682a85',
            stack_guid: 'd644d75e-fe53-492f-ba19-27e5d304413a',
            buildpack: null,
            detected_buildpack: 'Go',
            detected_buildpack_guid: '184826e2-57f6-4dec-a09d-3af3cdc81646',
            environment_json: {
              BASE_GUID: 'b55b3024-80e0-11e7-b32f-9b5097a5de1e',
              CREDENTIALS: '{"port": "4000", "host": "1.2.3.4"}',
              SERVICE_NAME: 'app-autoscaler',
              SERVICE_PLAN_NAME: 'shared',
              TAGS: 'simple,shared'
            },
            memory: 128,
            instances: 1,
            disk_quota: 256,
            state: 'STARTED',
            version: 'c8d61415-e405-4518-bbb0-ffec00e9477b',
            command: null,
            console: false,
            debug: null,
            staging_task_id: '0e86c850-3e0c-4d4d-89a8-d952cae998fe',
            package_state: 'STAGED',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: '2017-08-14T11:07:04Z',
            detected_start_command: 'worlds-simplest-service-broker',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/f5e6affb-8b7b-4fa8-aea3-24df8b682a85',
            space: 'f5e6affb-8b7b-4fa8-aea3-24df8b682a85',
            stack_url: '/v2/stacks/d644d75e-fe53-492f-ba19-27e5d304413a',
            stack: 'd644d75e-fe53-492f-ba19-27e5d304413a',
            routes_url: '/v2/apps/1463eda1-e0e1-4c70-ae5f-4c408dc098f6/routes',
            routes: [
              {
                metadata: {
                  guid: '9a88f5de-517b-4360-a843-0e7345ad4da5',
                  url: '/v2/routes/9a88f5de-517b-4360-a843-0e7345ad4da5',
                  created_at: '2017-08-14T11:07:00Z',
                  updated_at: '2017-08-14T11:07:00Z'
                },
                entity: {
                  host: 'app-autoscaler-broker',
                  path: '',
                  domain_guid: '0da3e819-8be9-47f3-b9a1-8329ab649d63',
                  space_guid: 'f5e6affb-8b7b-4fa8-aea3-24df8b682a85',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/0da3e819-8be9-47f3-b9a1-8329ab649d63',
                  domain: {
                    metadata: {
                      guid: '0da3e819-8be9-47f3-b9a1-8329ab649d63',
                      url: '/v2/shared_domains/0da3e819-8be9-47f3-b9a1-8329ab649d63',
                      created_at: '2017-08-10T13:38:02Z',
                      updated_at: '2017-08-10T13:38:02Z'
                    },
                    entity: {
                      name: 'cf-dev.io',
                      router_group_guid: null,
                      router_group_type: null
                    }
                  },
                  space_url: '/v2/spaces/f5e6affb-8b7b-4fa8-aea3-24df8b682a85',
                  space: {
                    metadata: {
                      guid: 'f5e6affb-8b7b-4fa8-aea3-24df8b682a85',
                      url: '/v2/spaces/f5e6affb-8b7b-4fa8-aea3-24df8b682a85',
                      created_at: '2017-08-14T11:02:29Z',
                      updated_at: '2017-08-14T11:02:29Z'
                    },
                    entity: {
                      name: 'services',
                      organization_guid: '48f9c989-8215-4164-8d1f-d3aa754fdcb5',
                      space_quota_definition_guid: null,
                      isolation_segment_guid: null,
                      allow_ssh: true,
                      organization_url: '/v2/organizations/48f9c989-8215-4164-8d1f-d3aa754fdcb5',
                      developers_url: '/v2/spaces/f5e6affb-8b7b-4fa8-aea3-24df8b682a85/developers',
                      managers_url: '/v2/spaces/f5e6affb-8b7b-4fa8-aea3-24df8b682a85/managers',
                      auditors_url: '/v2/spaces/f5e6affb-8b7b-4fa8-aea3-24df8b682a85/auditors',
                      apps_url: '/v2/spaces/f5e6affb-8b7b-4fa8-aea3-24df8b682a85/apps',
                      routes_url: '/v2/spaces/f5e6affb-8b7b-4fa8-aea3-24df8b682a85/routes',
                      domains_url: '/v2/spaces/f5e6affb-8b7b-4fa8-aea3-24df8b682a85/domains',
                      service_instances_url: '/v2/spaces/f5e6affb-8b7b-4fa8-aea3-24df8b682a85/service_instances',
                      app_events_url: '/v2/spaces/f5e6affb-8b7b-4fa8-aea3-24df8b682a85/app_events',
                      events_url: '/v2/spaces/f5e6affb-8b7b-4fa8-aea3-24df8b682a85/events',
                      security_groups_url: '/v2/spaces/f5e6affb-8b7b-4fa8-aea3-24df8b682a85/security_groups',
                      staging_security_groups_url: '/v2/spaces/f5e6affb-8b7b-4fa8-aea3-24df8b682a85/staging_security_groups'
                    }
                  },
                  apps_url: '/v2/routes/9a88f5de-517b-4360-a843-0e7345ad4da5/apps',
                  route_mappings_url: '/v2/routes/9a88f5de-517b-4360-a843-0e7345ad4da5/route_mappings'
                }
              }
            ],
            events_url: '/v2/apps/1463eda1-e0e1-4c70-ae5f-4c408dc098f6/events',
            service_bindings_url: '/v2/apps/1463eda1-e0e1-4c70-ae5f-4c408dc098f6/service_bindings',
            service_bindings: [
              {
                metadata: {
                  guid: '8f51afae-6e73-40f3-83aa-cb90de017cf3',
                  url: '/v2/service_bindings/8f51afae-6e73-40f3-83aa-cb90de017cf3',
                  created_at: '2017-08-23T16:22:50Z',
                  updated_at: '2017-08-23T16:22:50Z'
                },
                entity: {
                  app_guid: '1463eda1-e0e1-4c70-ae5f-4c408dc098f6',
                  service_instance_guid: '69b0214c-423e-4bb1-9fca-1b95f87e3228',
                  credentials: {
                    hostname: 'mysql-proxy.cf.svc.cluster.local',
                    port: 3306,
                    name: 'cf_69b0214c_423e_4bb1_9fca_1b95f87e3228',
                    username: 'c3Z1ElaT0LqE6YMl',
                    password: 'SIJdecdXT1RfiUn8',
                    uri: 'mysql://c3Z1ElaT0LqE6YMl:SIJdecdXT1RfiUn8@mysql-proxy.cf.svc.cluster.local:3306/cf_69b0214c_423e_4bb1_9fca_1b95f87e3228?reconnect=true',
                    jdbcUrl: 'jdbc:mysql://mysql-proxy.cf.svc.cluster.local:3306/cf_69b0214c_423e_4bb1_9fca_1b95f87e3228?user=c3Z1ElaT0LqE6YMl&password=SIJdecdXT1RfiUn8'
                  },
                  binding_options: {},
                  gateway_data: null,
                  gateway_name: '',
                  syslog_drain_url: null,
                  volume_mounts: [],
                  app_url: '/v2/apps/1463eda1-e0e1-4c70-ae5f-4c408dc098f6',
                  service_instance_url: '/v2/service_instances/69b0214c-423e-4bb1-9fca-1b95f87e3228',
                  service_instance: {
                    metadata: {
                      guid: '69b0214c-423e-4bb1-9fca-1b95f87e3228',
                      url: '/v2/service_instances/69b0214c-423e-4bb1-9fca-1b95f87e3228',
                      created_at: '2017-08-23T14:48:50Z',
                      updated_at: '2017-08-23T14:48:50Z'
                    },
                    entity: {
                      name: 'New-service123',
                      credentials: {},
                      service_plan_guid: '3c1b3320-d1a9-40e4-91b4-5841c3239cce',
                      space_guid: 'f5e6affb-8b7b-4fa8-aea3-24df8b682a85',
                      gateway_data: null,
                      dashboard_url: 'https://cf-dev.io/manage/instances/69b0214c-423e-4bb1-9fca-1b95f87e3228',
                      type: 'managed_service_instance',
                      last_operation: {
                        type: 'create',
                        state: 'succeeded',
                        description: '',
                        updated_at: '2017-08-23T14:48:50Z',
                        created_at: '2017-08-23T14:48:50Z'
                      },
                      tags: [],
                      service_guid: '606e5ecd-eea1-47df-b4f0-dc833642e1ac',
                      space_url: '/v2/spaces/f5e6affb-8b7b-4fa8-aea3-24df8b682a85',
                      service_plan_url: '/v2/service_plans/3c1b3320-d1a9-40e4-91b4-5841c3239cce',
                      service_bindings_url: '/v2/service_instances/69b0214c-423e-4bb1-9fca-1b95f87e3228/service_bindings',
                      service_keys_url: '/v2/service_instances/69b0214c-423e-4bb1-9fca-1b95f87e3228/service_keys',
                      routes_url: '/v2/service_instances/69b0214c-423e-4bb1-9fca-1b95f87e3228/routes',
                      service_url: '/v2/services/606e5ecd-eea1-47df-b4f0-dc833642e1ac'
                    }
                  }
                }
              },
              {
                metadata: {
                  guid: '28196a5e-0f91-47d3-b948-8edb55b66a65',
                  url: '/v2/service_bindings/28196a5e-0f91-47d3-b948-8edb55b66a65',
                  created_at: '2017-08-23T16:44:23Z',
                  updated_at: '2017-08-23T16:44:23Z'
                },
                entity: {
                  app_guid: '1463eda1-e0e1-4c70-ae5f-4c408dc098f6',
                  service_instance_guid: '8c6f1c1c-819d-4ee1-8170-37777f986037',
                  credentials: {
                    hostname: 'mysql-proxy.cf.svc.cluster.local',
                    port: 3306,
                    name: 'cf_8c6f1c1c_819d_4ee1_8170_37777f986037',
                    username: '91DA4FcteaOCe5zd',
                    password: 'OkoWTtMC6lHFc7Xn',
                    uri: 'mysql://91DA4FcteaOCe5zd:OkoWTtMC6lHFc7Xn@mysql-proxy.cf.svc.cluster.local:3306/cf_8c6f1c1c_819d_4ee1_8170_37777f986037?reconnect=true',
                    jdbcUrl: 'jdbc:mysql://mysql-proxy.cf.svc.cluster.local:3306/cf_8c6f1c1c_819d_4ee1_8170_37777f986037?user=91DA4FcteaOCe5zd&password=OkoWTtMC6lHFc7Xn'
                  },
                  binding_options: {},
                  gateway_data: null,
                  gateway_name: '',
                  syslog_drain_url: null,
                  volume_mounts: [],
                  app_url: '/v2/apps/1463eda1-e0e1-4c70-ae5f-4c408dc098f6',
                  service_instance_url: '/v2/service_instances/8c6f1c1c-819d-4ee1-8170-37777f986037',
                  service_instance: {
                    metadata: {
                      guid: '8c6f1c1c-819d-4ee1-8170-37777f986037',
                      url: '/v2/service_instances/8c6f1c1c-819d-4ee1-8170-37777f986037',
                      created_at: '2017-08-23T15:25:01Z',
                      updated_at: '2017-08-23T15:25:01Z'
                    },
                    entity: {
                      name: 'asdasd',
                      credentials: {},
                      service_plan_guid: '3c1b3320-d1a9-40e4-91b4-5841c3239cce',
                      space_guid: 'f5e6affb-8b7b-4fa8-aea3-24df8b682a85',
                      gateway_data: null,
                      dashboard_url: 'https://cf-dev.io/manage/instances/8c6f1c1c-819d-4ee1-8170-37777f986037',
                      type: 'managed_service_instance',
                      last_operation: {
                        type: 'create',
                        state: 'succeeded',
                        description: '',
                        updated_at: '2017-08-23T15:25:01Z',
                        created_at: '2017-08-23T15:25:01Z'
                      },
                      tags: [],
                      service_guid: '606e5ecd-eea1-47df-b4f0-dc833642e1ac',
                      space_url: '/v2/spaces/f5e6affb-8b7b-4fa8-aea3-24df8b682a85',
                      service_plan_url: '/v2/service_plans/3c1b3320-d1a9-40e4-91b4-5841c3239cce',
                      service_bindings_url: '/v2/service_instances/8c6f1c1c-819d-4ee1-8170-37777f986037/service_bindings',
                      service_keys_url: '/v2/service_instances/8c6f1c1c-819d-4ee1-8170-37777f986037/service_keys',
                      routes_url: '/v2/service_instances/8c6f1c1c-819d-4ee1-8170-37777f986037/routes',
                      service_url: '/v2/services/606e5ecd-eea1-47df-b4f0-dc833642e1ac'
                    }
                  }
                }
              },
              {
                metadata: {
                  guid: '03dd4bfe-5707-47fe-befa-c52aa585a674',
                  url: '/v2/service_bindings/03dd4bfe-5707-47fe-befa-c52aa585a674',
                  created_at: '2017-08-23T16:44:30Z',
                  updated_at: '2017-08-23T16:44:30Z'
                },
                entity: {
                  app_guid: '1463eda1-e0e1-4c70-ae5f-4c408dc098f6',
                  service_instance_guid: '14006228-ac3a-4e70-8c04-563cda966df3',
                  credentials: {
                    host: '1.2.3.4',
                    port: '4000'
                  },
                  binding_options: {},
                  gateway_data: null,
                  gateway_name: '',
                  syslog_drain_url: null,
                  volume_mounts: [],
                  app_url: '/v2/apps/1463eda1-e0e1-4c70-ae5f-4c408dc098f6',
                  service_instance_url: '/v2/service_instances/14006228-ac3a-4e70-8c04-563cda966df3',
                  service_instance: {
                    metadata: {
                      guid: '14006228-ac3a-4e70-8c04-563cda966df3',
                      url: '/v2/service_instances/14006228-ac3a-4e70-8c04-563cda966df3',
                      created_at: '2017-08-23T13:21:21Z',
                      updated_at: '2017-08-23T13:21:21Z'
                    },
                    entity: {
                      name: 'Test1231',
                      credentials: {},
                      service_plan_guid: '549409b6-b754-4643-a83b-885dbcfd2dfb',
                      space_guid: 'f5e6affb-8b7b-4fa8-aea3-24df8b682a85',
                      gateway_data: null,
                      dashboard_url: 'https://app-autoscaler-broker.cf-dev.io/dashboard',
                      type: 'managed_service_instance',
                      last_operation: {
                        type: 'create',
                        state: 'succeeded',
                        description: '',
                        updated_at: '2017-08-23T13:21:22Z',
                        created_at: '2017-08-23T13:21:22Z'
                      },
                      tags: [],
                      service_guid: '43b1c1bd-0a26-4986-adcc-700d56559f1e',
                      space_url: '/v2/spaces/f5e6affb-8b7b-4fa8-aea3-24df8b682a85',
                      service_plan_url: '/v2/service_plans/549409b6-b754-4643-a83b-885dbcfd2dfb',
                      service_bindings_url: '/v2/service_instances/14006228-ac3a-4e70-8c04-563cda966df3/service_bindings',
                      service_keys_url: '/v2/service_instances/14006228-ac3a-4e70-8c04-563cda966df3/service_keys',
                      routes_url: '/v2/service_instances/14006228-ac3a-4e70-8c04-563cda966df3/routes',
                      service_url: '/v2/services/43b1c1bd-0a26-4986-adcc-700d56559f1e'
                    }
                  }
                }
              },
              {
                metadata: {
                  guid: 'ba6fd430-b9a1-46e5-947a-bc2ddf4be36f',
                  url: '/v2/service_bindings/ba6fd430-b9a1-46e5-947a-bc2ddf4be36f',
                  created_at: '2017-08-23T16:44:36Z',
                  updated_at: '2017-08-23T16:44:36Z'
                },
                entity: {
                  app_guid: '1463eda1-e0e1-4c70-ae5f-4c408dc098f6',
                  service_instance_guid: '106a8e80-657a-4b25-ab9c-788a004a59d8',
                  credentials: {
                    host: '1.2.3.4',
                    port: '4000'
                  },
                  binding_options: {},
                  gateway_data: null,
                  gateway_name: '',
                  syslog_drain_url: null,
                  volume_mounts: [],
                  app_url: '/v2/apps/1463eda1-e0e1-4c70-ae5f-4c408dc098f6',
                  service_instance_url: '/v2/service_instances/106a8e80-657a-4b25-ab9c-788a004a59d8',
                  service_instance: {
                    metadata: {
                      guid: '106a8e80-657a-4b25-ab9c-788a004a59d8',
                      url: '/v2/service_instances/106a8e80-657a-4b25-ab9c-788a004a59d8',
                      created_at: '2017-08-23T15:36:30Z',
                      updated_at: '2017-08-23T15:36:30Z'
                    },
                    entity: {
                      name: 'dasdasd',
                      credentials: {},
                      service_plan_guid: '549409b6-b754-4643-a83b-885dbcfd2dfb',
                      space_guid: 'f5e6affb-8b7b-4fa8-aea3-24df8b682a85',
                      gateway_data: null,
                      dashboard_url: 'https://app-autoscaler-broker.cf-dev.io/dashboard',
                      type: 'managed_service_instance',
                      last_operation: {
                        type: 'create',
                        state: 'succeeded',
                        description: '',
                        updated_at: '2017-08-23T15:36:30Z',
                        created_at: '2017-08-23T15:36:30Z'
                      },
                      tags: [],
                      service_guid: '43b1c1bd-0a26-4986-adcc-700d56559f1e',
                      space_url: '/v2/spaces/f5e6affb-8b7b-4fa8-aea3-24df8b682a85',
                      service_plan_url: '/v2/service_plans/549409b6-b754-4643-a83b-885dbcfd2dfb',
                      service_bindings_url: '/v2/service_instances/106a8e80-657a-4b25-ab9c-788a004a59d8/service_bindings',
                      service_keys_url: '/v2/service_instances/106a8e80-657a-4b25-ab9c-788a004a59d8/service_keys',
                      routes_url: '/v2/service_instances/106a8e80-657a-4b25-ab9c-788a004a59d8/routes',
                      service_url: '/v2/services/43b1c1bd-0a26-4986-adcc-700d56559f1e'
                    }
                  }
                }
              },
              {
                metadata: {
                  guid: 'fd27a25a-d831-4a2a-9ec7-2f47349e64fd',
                  url: '/v2/service_bindings/fd27a25a-d831-4a2a-9ec7-2f47349e64fd',
                  created_at: '2017-08-24T13:05:03Z',
                  updated_at: '2017-08-24T13:05:03Z'
                },
                entity: {
                  app_guid: '1463eda1-e0e1-4c70-ae5f-4c408dc098f6',
                  service_instance_guid: '728aab1d-4086-40d7-a41f-2e77ac796977',
                  credentials: {
                    hostname: 'mysql-proxy.cf.svc.cluster.local',
                    port: 3306,
                    name: 'cf_728aab1d_4086_40d7_a41f_2e77ac796977',
                    username: 'uC99hqH3Rg2R5hBq',
                    password: 'iucreyaYM9Z0zQPE',
                    uri: 'mysql://uC99hqH3Rg2R5hBq:iucreyaYM9Z0zQPE@mysql-proxy.cf.svc.cluster.local:3306/cf_728aab1d_4086_40d7_a41f_2e77ac796977?reconnect=true',
                    jdbcUrl: 'jdbc:mysql://mysql-proxy.cf.svc.cluster.local:3306/cf_728aab1d_4086_40d7_a41f_2e77ac796977?user=uC99hqH3Rg2R5hBq&password=iucreyaYM9Z0zQPE'
                  },
                  binding_options: {},
                  gateway_data: null,
                  gateway_name: '',
                  syslog_drain_url: null,
                  volume_mounts: [],
                  app_url: '/v2/apps/1463eda1-e0e1-4c70-ae5f-4c408dc098f6',
                  service_instance_url: '/v2/service_instances/728aab1d-4086-40d7-a41f-2e77ac796977',
                  service_instance: {
                    metadata: {
                      guid: '728aab1d-4086-40d7-a41f-2e77ac796977',
                      url: '/v2/service_instances/728aab1d-4086-40d7-a41f-2e77ac796977',
                      created_at: '2017-08-24T13:04:59Z',
                      updated_at: '2017-08-24T13:04:59Z'
                    },
                    entity: {
                      name: 'New123Test',
                      credentials: {},
                      service_plan_guid: '3c1b3320-d1a9-40e4-91b4-5841c3239cce',
                      space_guid: 'f5e6affb-8b7b-4fa8-aea3-24df8b682a85',
                      gateway_data: null,
                      dashboard_url: 'https://cf-dev.io/manage/instances/728aab1d-4086-40d7-a41f-2e77ac796977',
                      type: 'managed_service_instance',
                      last_operation: {
                        type: 'create',
                        state: 'succeeded',
                        description: '',
                        updated_at: '2017-08-24T13:04:59Z',
                        created_at: '2017-08-24T13:04:59Z'
                      },
                      tags: [],
                      service_guid: '606e5ecd-eea1-47df-b4f0-dc833642e1ac',
                      space_url: '/v2/spaces/f5e6affb-8b7b-4fa8-aea3-24df8b682a85',
                      service_plan_url: '/v2/service_plans/3c1b3320-d1a9-40e4-91b4-5841c3239cce',
                      service_bindings_url: '/v2/service_instances/728aab1d-4086-40d7-a41f-2e77ac796977/service_bindings',
                      service_keys_url: '/v2/service_instances/728aab1d-4086-40d7-a41f-2e77ac796977/service_keys',
                      routes_url: '/v2/service_instances/728aab1d-4086-40d7-a41f-2e77ac796977/routes',
                      service_url: '/v2/services/606e5ecd-eea1-47df-b4f0-dc833642e1ac'
                    }
                  }
                }
              }
            ],
            route_mappings_url: '/v2/apps/1463eda1-e0e1-4c70-ae5f-4c408dc098f6/route_mappings',
            guid: '1463eda1-e0e1-4c70-ae5f-4c408dc098f6',
            cfGuid: '521a9d96-2d6c-4d94-a555-807437ab106d'
          },
          metadata: {
            guid: '1463eda1-e0e1-4c70-ae5f-4c408dc098f6',
            url: '/v2/apps/1463eda1-e0e1-4c70-ae5f-4c408dc098f6',
            created_at: '2017-08-14T11:06:55Z',
            updated_at: '2017-08-18T13:13:11Z'
          }
        },
        '77c0759f-e857-4f4c-9785-299acf7b3f48': {
          entity: {
            name: 'test-app',
            production: false,
            space_guid: '61391638-57a8-4185-b91c-495b8869125e',
            stack_guid: 'd644d75e-fe53-492f-ba19-27e5d304413a',
            buildpack: null,
            detected_buildpack: 'Go',
            detected_buildpack_guid: '184826e2-57f6-4dec-a09d-3af3cdc81646',
            environment_json: {
              STRATOS_PROJECT: '{"deploySource":{"type":"giturl","timestamp":1504277202,"project":"","branch":"master","url":"https://github.com/cloudfoundry-samples/test-app.git","commit":"2c87fa236c81f5203e182bbf0149fc4e93429c86\\n"}}'
            },
            memory: 256,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: '8ccdc483-decc-4c8d-b7d7-788bfc9f047a',
            command: null,
            console: false,
            debug: null,
            staging_task_id: '0557f678-8b61-4bcc-8e55-202bd633f307',
            package_state: 'STAGED',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: '2017-09-01T14:46:56Z',
            detected_start_command: 'test-app',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/61391638-57a8-4185-b91c-495b8869125e',
            space: '61391638-57a8-4185-b91c-495b8869125e',
            stack_url: '/v2/stacks/d644d75e-fe53-492f-ba19-27e5d304413a',
            stack: 'd644d75e-fe53-492f-ba19-27e5d304413a',
            routes_url: '/v2/apps/77c0759f-e857-4f4c-9785-299acf7b3f48/routes',
            routes: [
              {
                metadata: {
                  guid: '7a759392-44db-4669-b50d-cc7f8dd433b9',
                  url: '/v2/routes/7a759392-44db-4669-b50d-cc7f8dd433b9',
                  created_at: '2017-09-01T14:46:50Z',
                  updated_at: '2017-09-01T14:46:50Z'
                },
                entity: {
                  host: 'test-app',
                  path: '',
                  domain_guid: '0da3e819-8be9-47f3-b9a1-8329ab649d63',
                  space_guid: '61391638-57a8-4185-b91c-495b8869125e',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/0da3e819-8be9-47f3-b9a1-8329ab649d63',
                  domain: {
                    metadata: {
                      guid: '0da3e819-8be9-47f3-b9a1-8329ab649d63',
                      url: '/v2/shared_domains/0da3e819-8be9-47f3-b9a1-8329ab649d63',
                      created_at: '2017-08-10T13:38:02Z',
                      updated_at: '2017-08-10T13:38:02Z'
                    },
                    entity: {
                      name: 'cf-dev.io',
                      router_group_guid: null,
                      router_group_type: null
                    }
                  },
                  space_url: '/v2/spaces/61391638-57a8-4185-b91c-495b8869125e',
                  space: {
                    metadata: {
                      guid: '61391638-57a8-4185-b91c-495b8869125e',
                      url: '/v2/spaces/61391638-57a8-4185-b91c-495b8869125e',
                      created_at: '2017-08-24T09:39:42Z',
                      updated_at: '2017-08-24T09:39:42Z'
                    },
                    entity: {
                      name: 'rc1',
                      organization_guid: '306071ee-0cad-4b4b-8fd9-9944d6e65c99',
                      space_quota_definition_guid: null,
                      isolation_segment_guid: null,
                      allow_ssh: true,
                      organization_url: '/v2/organizations/306071ee-0cad-4b4b-8fd9-9944d6e65c99',
                      developers_url: '/v2/spaces/61391638-57a8-4185-b91c-495b8869125e/developers',
                      managers_url: '/v2/spaces/61391638-57a8-4185-b91c-495b8869125e/managers',
                      auditors_url: '/v2/spaces/61391638-57a8-4185-b91c-495b8869125e/auditors',
                      apps_url: '/v2/spaces/61391638-57a8-4185-b91c-495b8869125e/apps',
                      routes_url: '/v2/spaces/61391638-57a8-4185-b91c-495b8869125e/routes',
                      domains_url: '/v2/spaces/61391638-57a8-4185-b91c-495b8869125e/domains',
                      service_instances_url: '/v2/spaces/61391638-57a8-4185-b91c-495b8869125e/service_instances',
                      app_events_url: '/v2/spaces/61391638-57a8-4185-b91c-495b8869125e/app_events',
                      events_url: '/v2/spaces/61391638-57a8-4185-b91c-495b8869125e/events',
                      security_groups_url: '/v2/spaces/61391638-57a8-4185-b91c-495b8869125e/security_groups',
                      staging_security_groups_url: '/v2/spaces/61391638-57a8-4185-b91c-495b8869125e/staging_security_groups'
                    }
                  },
                  apps_url: '/v2/routes/7a759392-44db-4669-b50d-cc7f8dd433b9/apps',
                  route_mappings_url: '/v2/routes/7a759392-44db-4669-b50d-cc7f8dd433b9/route_mappings'
                }
              }
            ],
            events_url: '/v2/apps/77c0759f-e857-4f4c-9785-299acf7b3f48/events',
            service_bindings_url: '/v2/apps/77c0759f-e857-4f4c-9785-299acf7b3f48/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/77c0759f-e857-4f4c-9785-299acf7b3f48/route_mappings',
            guid: '77c0759f-e857-4f4c-9785-299acf7b3f48',
            cfGuid: '521a9d96-2d6c-4d94-a555-807437ab106d'
          },
          metadata: {
            guid: '77c0759f-e857-4f4c-9785-299acf7b3f48',
            url: '/v2/apps/77c0759f-e857-4f4c-9785-299acf7b3f48',
            created_at: '2017-09-01T14:46:44Z',
            updated_at: '2017-09-01T16:28:06Z'
          }
        },
        'c5026174-fcf7-413b-bc9a-ac3419e30a91': {
          entity: {
            name: 'console',
            production: false,
            space_guid: '61391638-57a8-4185-b91c-495b8869125e',
            stack_guid: '3371958e-2de6-481f-9a6d-0198b42dea6e',
            buildpack: 'https://github.com/cloudfoundry-incubator/multi-buildpack',
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {
              GOVERSION: 'go1.9'
            },
            memory: 1024,
            instances: 1,
            disk_quota: 2048,
            state: 'STOPPED',
            version: '03afe3da-3710-49f0-a2db-2185cc1febdf',
            command: null,
            console: false,
            debug: null,
            staging_task_id: 'fae82942-7e76-48f5-861b-e262f2652a16',
            package_state: 'FAILED',
            health_check_type: 'port',
            health_check_timeout: 180,
            health_check_http_endpoint: null,
            staging_failed_reason: 'BuildpackCompileFailed',
            staging_failed_description: 'App staging failed in the buildpack compile phase',
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: '2017-09-07T13:15:06Z',
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/61391638-57a8-4185-b91c-495b8869125e',
            space: '61391638-57a8-4185-b91c-495b8869125e',
            stack_url: '/v2/stacks/3371958e-2de6-481f-9a6d-0198b42dea6e',
            stack: '3371958e-2de6-481f-9a6d-0198b42dea6e',
            routes_url: '/v2/apps/c5026174-fcf7-413b-bc9a-ac3419e30a91/routes',
            routes: [
              {
                metadata: {
                  guid: '0b327348-b0b9-453c-a92c-b9d7d8f42115',
                  url: '/v2/routes/0b327348-b0b9-453c-a92c-b9d7d8f42115',
                  created_at: '2017-09-07T12:55:47Z',
                  updated_at: '2017-09-07T12:55:47Z'
                },
                entity: {
                  host: 'console',
                  path: '',
                  domain_guid: '0da3e819-8be9-47f3-b9a1-8329ab649d63',
                  space_guid: '61391638-57a8-4185-b91c-495b8869125e',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/0da3e819-8be9-47f3-b9a1-8329ab649d63',
                  domain: {
                    metadata: {
                      guid: '0da3e819-8be9-47f3-b9a1-8329ab649d63',
                      url: '/v2/shared_domains/0da3e819-8be9-47f3-b9a1-8329ab649d63',
                      created_at: '2017-08-10T13:38:02Z',
                      updated_at: '2017-08-10T13:38:02Z'
                    },
                    entity: {
                      name: 'cf-dev.io',
                      router_group_guid: null,
                      router_group_type: null
                    }
                  },
                  space_url: '/v2/spaces/61391638-57a8-4185-b91c-495b8869125e',
                  space: {
                    metadata: {
                      guid: '61391638-57a8-4185-b91c-495b8869125e',
                      url: '/v2/spaces/61391638-57a8-4185-b91c-495b8869125e',
                      created_at: '2017-08-24T09:39:42Z',
                      updated_at: '2017-08-24T09:39:42Z'
                    },
                    entity: {
                      name: 'rc1',
                      organization_guid: '306071ee-0cad-4b4b-8fd9-9944d6e65c99',
                      space_quota_definition_guid: null,
                      isolation_segment_guid: null,
                      allow_ssh: true,
                      organization_url: '/v2/organizations/306071ee-0cad-4b4b-8fd9-9944d6e65c99',
                      developers_url: '/v2/spaces/61391638-57a8-4185-b91c-495b8869125e/developers',
                      managers_url: '/v2/spaces/61391638-57a8-4185-b91c-495b8869125e/managers',
                      auditors_url: '/v2/spaces/61391638-57a8-4185-b91c-495b8869125e/auditors',
                      apps_url: '/v2/spaces/61391638-57a8-4185-b91c-495b8869125e/apps',
                      routes_url: '/v2/spaces/61391638-57a8-4185-b91c-495b8869125e/routes',
                      domains_url: '/v2/spaces/61391638-57a8-4185-b91c-495b8869125e/domains',
                      service_instances_url: '/v2/spaces/61391638-57a8-4185-b91c-495b8869125e/service_instances',
                      app_events_url: '/v2/spaces/61391638-57a8-4185-b91c-495b8869125e/app_events',
                      events_url: '/v2/spaces/61391638-57a8-4185-b91c-495b8869125e/events',
                      security_groups_url: '/v2/spaces/61391638-57a8-4185-b91c-495b8869125e/security_groups',
                      staging_security_groups_url: '/v2/spaces/61391638-57a8-4185-b91c-495b8869125e/staging_security_groups'
                    }
                  },
                  apps_url: '/v2/routes/0b327348-b0b9-453c-a92c-b9d7d8f42115/apps',
                  route_mappings_url: '/v2/routes/0b327348-b0b9-453c-a92c-b9d7d8f42115/route_mappings'
                }
              }
            ],
            events_url: '/v2/apps/c5026174-fcf7-413b-bc9a-ac3419e30a91/events',
            service_bindings_url: '/v2/apps/c5026174-fcf7-413b-bc9a-ac3419e30a91/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/c5026174-fcf7-413b-bc9a-ac3419e30a91/route_mappings',
            guid: 'c5026174-fcf7-413b-bc9a-ac3419e30a91',
            cfGuid: '521a9d96-2d6c-4d94-a555-807437ab106d'
          },
          metadata: {
            guid: 'c5026174-fcf7-413b-bc9a-ac3419e30a91',
            url: '/v2/apps/c5026174-fcf7-413b-bc9a-ac3419e30a91',
            created_at: '2017-09-07T12:55:43Z',
            updated_at: '2017-09-07T13:16:29Z'
          }
        },
        'b87f92ee-bcaa-4430-96d5-ef5b7a80214f': {
          entity: {
            name: 'slides',
            production: false,
            space_guid: '8071af91-4b2f-4569-b76e-12a21e71d701',
            stack_guid: 'd644d75e-fe53-492f-ba19-27e5d304413a',
            buildpack: 'staticfile_buildpack',
            detected_buildpack: '',
            detected_buildpack_guid: 'e9635bf5-a0aa-42d6-bdda-b703fb080677',
            environment_json: {
              STRATOS_PROJECT:
                '{"url":"https://github.com/troytop/presentation-template", ' +
                ' "commit":"bcb2cd228ed26fa72f5e029f6979f4e0c971de29\\n","branch":"cap-roadmap","timestamp":1505336909}'
            },
            memory: 64,
            instances: 1,
            disk_quota: 256,
            state: 'STARTED',
            version: 'a2596083-8a79-4856-9011-ccddb7edbdca',
            command: null,
            console: false,
            debug: null,
            staging_task_id: '71280eaa-a4ee-422a-8917-545b576fbafe',
            package_state: 'STAGED',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: '2017-09-13T21:08:34Z',
            detected_start_command: 'sh boot.sh',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/8071af91-4b2f-4569-b76e-12a21e71d701',
            space: '8071af91-4b2f-4569-b76e-12a21e71d701',
            stack_url: '/v2/stacks/d644d75e-fe53-492f-ba19-27e5d304413a',
            stack: 'd644d75e-fe53-492f-ba19-27e5d304413a',
            routes_url: '/v2/apps/b87f92ee-bcaa-4430-96d5-ef5b7a80214f/routes',
            routes: [
              {
                metadata: {
                  guid: '16395d20-4d16-490e-a240-1769771d4ffc',
                  url: '/v2/routes/16395d20-4d16-490e-a240-1769771d4ffc',
                  created_at: '2017-09-13T21:08:31Z',
                  updated_at: '2017-09-13T21:08:31Z'
                },
                entity: {
                  host: 'slides',
                  path: '',
                  domain_guid: '0da3e819-8be9-47f3-b9a1-8329ab649d63',
                  space_guid: '8071af91-4b2f-4569-b76e-12a21e71d701',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/0da3e819-8be9-47f3-b9a1-8329ab649d63',
                  domain: {
                    metadata: {
                      guid: '0da3e819-8be9-47f3-b9a1-8329ab649d63',
                      url: '/v2/shared_domains/0da3e819-8be9-47f3-b9a1-8329ab649d63',
                      created_at: '2017-08-10T13:38:02Z',
                      updated_at: '2017-08-10T13:38:02Z'
                    },
                    entity: {
                      name: 'cf-dev.io',
                      router_group_guid: null,
                      router_group_type: null
                    }
                  },
                  space_url: '/v2/spaces/8071af91-4b2f-4569-b76e-12a21e71d701',
                  space: {
                    metadata: {
                      guid: '8071af91-4b2f-4569-b76e-12a21e71d701',
                      url: '/v2/spaces/8071af91-4b2f-4569-b76e-12a21e71d701',
                      created_at: '2017-08-10T13:45:34Z',
                      updated_at: '2017-08-10T13:45:34Z'
                    },
                    entity: {
                      name: 'dev',
                      organization_guid: '46b16d55-4198-4077-92ff-2c53298648a2',
                      space_quota_definition_guid: null,
                      isolation_segment_guid: null,
                      allow_ssh: true,
                      organization_url: '/v2/organizations/46b16d55-4198-4077-92ff-2c53298648a2',
                      developers_url: '/v2/spaces/8071af91-4b2f-4569-b76e-12a21e71d701/developers',
                      managers_url: '/v2/spaces/8071af91-4b2f-4569-b76e-12a21e71d701/managers',
                      auditors_url: '/v2/spaces/8071af91-4b2f-4569-b76e-12a21e71d701/auditors',
                      apps_url: '/v2/spaces/8071af91-4b2f-4569-b76e-12a21e71d701/apps',
                      routes_url: '/v2/spaces/8071af91-4b2f-4569-b76e-12a21e71d701/routes',
                      domains_url: '/v2/spaces/8071af91-4b2f-4569-b76e-12a21e71d701/domains',
                      service_instances_url: '/v2/spaces/8071af91-4b2f-4569-b76e-12a21e71d701/service_instances',
                      app_events_url: '/v2/spaces/8071af91-4b2f-4569-b76e-12a21e71d701/app_events',
                      events_url: '/v2/spaces/8071af91-4b2f-4569-b76e-12a21e71d701/events',
                      security_groups_url: '/v2/spaces/8071af91-4b2f-4569-b76e-12a21e71d701/security_groups',
                      staging_security_groups_url: '/v2/spaces/8071af91-4b2f-4569-b76e-12a21e71d701/staging_security_groups'
                    }
                  },
                  apps_url: '/v2/routes/16395d20-4d16-490e-a240-1769771d4ffc/apps',
                  route_mappings_url: '/v2/routes/16395d20-4d16-490e-a240-1769771d4ffc/route_mappings'
                }
              }
            ],
            events_url: '/v2/apps/b87f92ee-bcaa-4430-96d5-ef5b7a80214f/events',
            service_bindings_url: '/v2/apps/b87f92ee-bcaa-4430-96d5-ef5b7a80214f/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/b87f92ee-bcaa-4430-96d5-ef5b7a80214f/route_mappings',
            guid: 'b87f92ee-bcaa-4430-96d5-ef5b7a80214f',
            cfGuid: '521a9d96-2d6c-4d94-a555-807437ab106d'
          },
          metadata: {
            guid: 'b87f92ee-bcaa-4430-96d5-ef5b7a80214f',
            url: '/v2/apps/b87f92ee-bcaa-4430-96d5-ef5b7a80214f',
            created_at: '2017-09-13T21:08:31Z',
            updated_at: '2017-09-13T21:08:45Z'
          }
        },
        'e629c3be-e5cc-4f24-bd6e-57a83c3e4f2e': {
          entity: {
            name: 'go-env',
            production: false,
            space_guid: 'f5e6affb-8b7b-4fa8-aea3-24df8b682a85',
            stack_guid: '3371958e-2de6-481f-9a6d-0198b42dea6e',
            buildpack: null,
            detected_buildpack: 'Go',
            detected_buildpack_guid: '184826e2-57f6-4dec-a09d-3af3cdc81646',
            environment_json: {
              STRATOS_PROJECT: '{"url":"https://github.com/cf-stratos/go-env","commit":"f50a5b30d8903722c93a1334f1651e8c0c9e07a1\\n","branch":"master","timestamp":1506073387}'
            },
            memory: 16,
            instances: 2,
            disk_quota: 16,
            state: 'STARTED',
            version: '69194d7a-c435-4e8e-a37d-71e4eeebb3db',
            command: null,
            console: false,
            debug: null,
            staging_task_id: '0f33c9e6-7fdc-4084-b6a9-8da8cfe35dd5',
            package_state: 'STAGED',
            health_check_type: 'process',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: '2017-09-22T09:43:09Z',
            detected_start_command: 'go-env',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/f5e6affb-8b7b-4fa8-aea3-24df8b682a85',
            space: 'f5e6affb-8b7b-4fa8-aea3-24df8b682a85',
            stack_url: '/v2/stacks/3371958e-2de6-481f-9a6d-0198b42dea6e',
            stack: '3371958e-2de6-481f-9a6d-0198b42dea6e',
            routes_url: '/v2/apps/e629c3be-e5cc-4f24-bd6e-57a83c3e4f2e/routes',
            routes: [],
            events_url: '/v2/apps/e629c3be-e5cc-4f24-bd6e-57a83c3e4f2e/events',
            service_bindings_url: '/v2/apps/e629c3be-e5cc-4f24-bd6e-57a83c3e4f2e/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/e629c3be-e5cc-4f24-bd6e-57a83c3e4f2e/route_mappings',
            guid: 'e629c3be-e5cc-4f24-bd6e-57a83c3e4f2e',
            cfGuid: '521a9d96-2d6c-4d94-a555-807437ab106d'
          },
          metadata: {
            guid: 'e629c3be-e5cc-4f24-bd6e-57a83c3e4f2e',
            url: '/v2/apps/e629c3be-e5cc-4f24-bd6e-57a83c3e4f2e',
            created_at: '2017-09-22T08:38:49Z',
            updated_at: '2017-09-22T09:43:15Z'
          }
        },
        'a82554fb-6e81-48ba-839a-c52b55d8e37c': {
          entity: {
            name: 'go-env-rc-123',
            production: false,
            space_guid: '61391638-57a8-4185-b91c-495b8869125e',
            stack_guid: '3371958e-2de6-481f-9a6d-0198b42dea6e',
            buildpack: null,
            detected_buildpack: 'Go',
            detected_buildpack_guid: '184826e2-57f6-4dec-a09d-3af3cdc81646',
            environment_json: {
              dsfsdf: 'dsfsdf'
            },
            memory: 16,
            instances: 2,
            disk_quota: 16,
            state: 'STOPPED',
            version: '675f10ff-e30a-479c-9b8e-3ef3153eba3a',
            command: null,
            console: false,
            debug: null,
            staging_task_id: '04739b6d-90f6-43cd-84fb-bb9e20218294',
            package_state: 'STAGED',
            health_check_type: 'process',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: '2017-09-22T09:33:24Z',
            detected_start_command: 'go-env',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/61391638-57a8-4185-b91c-495b8869125e',
            space: '61391638-57a8-4185-b91c-495b8869125e',
            stack_url: '/v2/stacks/3371958e-2de6-481f-9a6d-0198b42dea6e',
            stack: '3371958e-2de6-481f-9a6d-0198b42dea6e',
            routes_url: '/v2/apps/a82554fb-6e81-48ba-839a-c52b55d8e37c/routes',
            routes: [],
            events_url: '/v2/apps/a82554fb-6e81-48ba-839a-c52b55d8e37c/events',
            service_bindings_url: '/v2/apps/a82554fb-6e81-48ba-839a-c52b55d8e37c/service_bindings',
            service_bindings: [
              {
                metadata: {
                  guid: '8a067379-e01d-4642-ac69-f189c149c317',
                  url: '/v2/service_bindings/8a067379-e01d-4642-ac69-f189c149c317',
                  created_at: '2017-10-05T13:27:38Z',
                  updated_at: '2017-10-05T13:27:38Z'
                },
                entity: {
                  app_guid: 'a82554fb-6e81-48ba-839a-c52b55d8e37c',
                  service_instance_guid: 'afa0cbcc-d12e-4182-ac1d-9354757625a6',
                  credentials: {
                    hostname: 'mysql-proxy.cf.svc.cluster.local',
                    port: 3306,
                    name: 'cf_afa0cbcc_d12e_4182_ac1d_9354757625a6',
                    username: 'MOI1ajKbZO5kLuSE',
                    password: 'jFQJQAKmUWcrj40I',
                    uri: 'mysql://MOI1ajKbZO5kLuSE:jFQJQAKmUWcrj40I@mysql-proxy.cf.svc.cluster.local:3306/cf_afa0cbcc_d12e_4182_ac1d_9354757625a6?reconnect=true',
                    jdbcUrl: 'jdbc:mysql://mysql-proxy.cf.svc.cluster.local:3306/cf_afa0cbcc_d12e_4182_ac1d_9354757625a6?user=MOI1ajKbZO5kLuSE&password=jFQJQAKmUWcrj40I'
                  },
                  binding_options: {},
                  gateway_data: null,
                  gateway_name: '',
                  syslog_drain_url: null,
                  volume_mounts: [],
                  app_url: '/v2/apps/a82554fb-6e81-48ba-839a-c52b55d8e37c',
                  service_instance_url: '/v2/service_instances/afa0cbcc-d12e-4182-ac1d-9354757625a6',
                  service_instance: {
                    metadata: {
                      guid: 'afa0cbcc-d12e-4182-ac1d-9354757625a6',
                      url: '/v2/service_instances/afa0cbcc-d12e-4182-ac1d-9354757625a6',
                      created_at: '2017-10-05T13:27:34Z',
                      updated_at: '2017-10-05T13:27:34Z'
                    },
                    entity: {
                      name: 'rc-my-sql',
                      credentials: {},
                      service_plan_guid: '3c1b3320-d1a9-40e4-91b4-5841c3239cce',
                      space_guid: '61391638-57a8-4185-b91c-495b8869125e',
                      gateway_data: null,
                      dashboard_url: 'https://cf-dev.io/manage/instances/afa0cbcc-d12e-4182-ac1d-9354757625a6',
                      type: 'managed_service_instance',
                      last_operation: {
                        type: 'create',
                        state: 'succeeded',
                        description: '',
                        updated_at: '2017-10-05T13:27:34Z',
                        created_at: '2017-10-05T13:27:34Z'
                      },
                      tags: [],
                      service_guid: '606e5ecd-eea1-47df-b4f0-dc833642e1ac',
                      space_url: '/v2/spaces/61391638-57a8-4185-b91c-495b8869125e',
                      service_plan_url: '/v2/service_plans/3c1b3320-d1a9-40e4-91b4-5841c3239cce',
                      service_bindings_url: '/v2/service_instances/afa0cbcc-d12e-4182-ac1d-9354757625a6/service_bindings',
                      service_keys_url: '/v2/service_instances/afa0cbcc-d12e-4182-ac1d-9354757625a6/service_keys',
                      routes_url: '/v2/service_instances/afa0cbcc-d12e-4182-ac1d-9354757625a6/routes',
                      service_url: '/v2/services/606e5ecd-eea1-47df-b4f0-dc833642e1ac'
                    }
                  }
                }
              }
            ],
            route_mappings_url: '/v2/apps/a82554fb-6e81-48ba-839a-c52b55d8e37c/route_mappings',
            guid: 'a82554fb-6e81-48ba-839a-c52b55d8e37c',
            cfGuid: '521a9d96-2d6c-4d94-a555-807437ab106d'
          },
          metadata: {
            guid: 'a82554fb-6e81-48ba-839a-c52b55d8e37c',
            url: '/v2/apps/a82554fb-6e81-48ba-839a-c52b55d8e37c',
            created_at: '2017-09-22T09:33:24Z',
            updated_at: '2017-10-09T14:51:01Z'
          }
        },
        'f5f40768-7416-4400-8026-832a43e3653e': {
          entity: {
            name: 'node-env',
            production: false,
            space_guid: 'a59b770c-2b51-46d8-a16d-bfc0322b2e12',
            stack_guid: '3371958e-2de6-481f-9a6d-0198b42dea6e',
            buildpack: null,
            detected_buildpack: 'Go',
            detected_buildpack_guid: '184826e2-57f6-4dec-a09d-3af3cdc81646',
            environment_json: {
              STRATOS_PROJECT: '{"url":"https://github.com/cf-stratos/go-env","commit":"f50a5b30d8903722c93a1334f1651e8c0c9e07a1\\n","branch":"master","timestamp":1506073124}'
            },
            memory: 16,
            instances: 1,
            disk_quota: 16,
            state: 'STARTED',
            version: '0a5d3a05-44f3-4bc0-9ae9-d69afd71b49a',
            command: null,
            console: false,
            debug: null,
            staging_task_id: '2aca207e-e5ce-40c6-ad78-a5fa3666451e',
            package_state: 'STAGED',
            health_check_type: 'process',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: '2017-09-22T09:38:45Z',
            detected_start_command: 'go-env',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a59b770c-2b51-46d8-a16d-bfc0322b2e12',
            space: 'a59b770c-2b51-46d8-a16d-bfc0322b2e12',
            stack_url: '/v2/stacks/3371958e-2de6-481f-9a6d-0198b42dea6e',
            stack: '3371958e-2de6-481f-9a6d-0198b42dea6e',
            routes_url: '/v2/apps/f5f40768-7416-4400-8026-832a43e3653e/routes',
            routes: [],
            events_url: '/v2/apps/f5f40768-7416-4400-8026-832a43e3653e/events',
            service_bindings_url: '/v2/apps/f5f40768-7416-4400-8026-832a43e3653e/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/f5f40768-7416-4400-8026-832a43e3653e/route_mappings',
            guid: 'f5f40768-7416-4400-8026-832a43e3653e',
            cfGuid: '521a9d96-2d6c-4d94-a555-807437ab106d'
          },
          metadata: {
            guid: 'f5f40768-7416-4400-8026-832a43e3653e',
            url: '/v2/apps/f5f40768-7416-4400-8026-832a43e3653e',
            created_at: '2017-09-22T09:38:45Z',
            updated_at: '2017-09-29T09:57:21Z'
          }
        },
        'e1b7b5e3-a33c-4bc2-b14d-ca7731988a7d': {
          entity: {
            name: 'dasdasdasdasd',
            production: false,
            space_guid: 'f5e6affb-8b7b-4fa8-aea3-24df8b682a85',
            stack_guid: 'd644d75e-fe53-492f-ba19-27e5d304413a',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: 'e02e2052-096b-464e-b7bb-be9eef5a7b25',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/f5e6affb-8b7b-4fa8-aea3-24df8b682a85',
            space: 'f5e6affb-8b7b-4fa8-aea3-24df8b682a85',
            stack_url: '/v2/stacks/d644d75e-fe53-492f-ba19-27e5d304413a',
            stack: 'd644d75e-fe53-492f-ba19-27e5d304413a',
            routes_url: '/v2/apps/e1b7b5e3-a33c-4bc2-b14d-ca7731988a7d/routes',
            routes: [
              {
                metadata: {
                  guid: '8898cf37-df96-4156-8274-644b835c55f0',
                  url: '/v2/routes/8898cf37-df96-4156-8274-644b835c55f0',
                  created_at: '2017-09-27T11:51:13Z',
                  updated_at: '2017-09-27T11:51:13Z'
                },
                entity: {
                  host: 'asdasd',
                  path: '',
                  domain_guid: '0da3e819-8be9-47f3-b9a1-8329ab649d63',
                  space_guid: 'f5e6affb-8b7b-4fa8-aea3-24df8b682a85',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/0da3e819-8be9-47f3-b9a1-8329ab649d63',
                  domain: {
                    metadata: {
                      guid: '0da3e819-8be9-47f3-b9a1-8329ab649d63',
                      url: '/v2/shared_domains/0da3e819-8be9-47f3-b9a1-8329ab649d63',
                      created_at: '2017-08-10T13:38:02Z',
                      updated_at: '2017-08-10T13:38:02Z'
                    },
                    entity: {
                      name: 'cf-dev.io',
                      router_group_guid: null,
                      router_group_type: null
                    }
                  },
                  space_url: '/v2/spaces/f5e6affb-8b7b-4fa8-aea3-24df8b682a85',
                  space: {
                    metadata: {
                      guid: 'f5e6affb-8b7b-4fa8-aea3-24df8b682a85',
                      url: '/v2/spaces/f5e6affb-8b7b-4fa8-aea3-24df8b682a85',
                      created_at: '2017-08-14T11:02:29Z',
                      updated_at: '2017-08-14T11:02:29Z'
                    },
                    entity: {
                      name: 'services',
                      organization_guid: '48f9c989-8215-4164-8d1f-d3aa754fdcb5',
                      space_quota_definition_guid: null,
                      isolation_segment_guid: null,
                      allow_ssh: true,
                      organization_url: '/v2/organizations/48f9c989-8215-4164-8d1f-d3aa754fdcb5',
                      developers_url: '/v2/spaces/f5e6affb-8b7b-4fa8-aea3-24df8b682a85/developers',
                      managers_url: '/v2/spaces/f5e6affb-8b7b-4fa8-aea3-24df8b682a85/managers',
                      auditors_url: '/v2/spaces/f5e6affb-8b7b-4fa8-aea3-24df8b682a85/auditors',
                      apps_url: '/v2/spaces/f5e6affb-8b7b-4fa8-aea3-24df8b682a85/apps',
                      routes_url: '/v2/spaces/f5e6affb-8b7b-4fa8-aea3-24df8b682a85/routes',
                      domains_url: '/v2/spaces/f5e6affb-8b7b-4fa8-aea3-24df8b682a85/domains',
                      service_instances_url: '/v2/spaces/f5e6affb-8b7b-4fa8-aea3-24df8b682a85/service_instances',
                      app_events_url: '/v2/spaces/f5e6affb-8b7b-4fa8-aea3-24df8b682a85/app_events',
                      events_url: '/v2/spaces/f5e6affb-8b7b-4fa8-aea3-24df8b682a85/events',
                      security_groups_url: '/v2/spaces/f5e6affb-8b7b-4fa8-aea3-24df8b682a85/security_groups',
                      staging_security_groups_url: '/v2/spaces/f5e6affb-8b7b-4fa8-aea3-24df8b682a85/staging_security_groups'
                    }
                  },
                  apps_url: '/v2/routes/8898cf37-df96-4156-8274-644b835c55f0/apps',
                  route_mappings_url: '/v2/routes/8898cf37-df96-4156-8274-644b835c55f0/route_mappings'
                }
              }
            ],
            events_url: '/v2/apps/e1b7b5e3-a33c-4bc2-b14d-ca7731988a7d/events',
            service_bindings_url: '/v2/apps/e1b7b5e3-a33c-4bc2-b14d-ca7731988a7d/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/e1b7b5e3-a33c-4bc2-b14d-ca7731988a7d/route_mappings',
            guid: 'e1b7b5e3-a33c-4bc2-b14d-ca7731988a7d',
            cfGuid: '521a9d96-2d6c-4d94-a555-807437ab106d'
          },
          metadata: {
            guid: 'e1b7b5e3-a33c-4bc2-b14d-ca7731988a7d',
            url: '/v2/apps/e1b7b5e3-a33c-4bc2-b14d-ca7731988a7d',
            created_at: '2017-09-27T11:51:13Z',
            updated_at: '2017-09-27T11:51:14Z'
          }
        },
        'b862b599-7e32-43da-9956-b717d85e2f33': {
          entity: {
            name: 'asdasdasd',
            production: false,
            space_guid: 'f5e6affb-8b7b-4fa8-aea3-24df8b682a85',
            stack_guid: 'd644d75e-fe53-492f-ba19-27e5d304413a',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: '31ef51ef-248f-4f10-bea7-d5d78079d0c4',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/f5e6affb-8b7b-4fa8-aea3-24df8b682a85',
            space: 'f5e6affb-8b7b-4fa8-aea3-24df8b682a85',
            stack_url: '/v2/stacks/d644d75e-fe53-492f-ba19-27e5d304413a',
            stack: 'd644d75e-fe53-492f-ba19-27e5d304413a',
            routes_url: '/v2/apps/b862b599-7e32-43da-9956-b717d85e2f33/routes',
            routes: [
              {
                metadata: {
                  guid: '109aa9a4-f8a0-409a-b416-e93c15591d75',
                  url: '/v2/routes/109aa9a4-f8a0-409a-b416-e93c15591d75',
                  created_at: '2017-09-28T15:07:53Z',
                  updated_at: '2017-09-28T15:07:53Z'
                },
                entity: {
                  host: 'asdasdasdasdasd',
                  path: '',
                  domain_guid: '0da3e819-8be9-47f3-b9a1-8329ab649d63',
                  space_guid: 'f5e6affb-8b7b-4fa8-aea3-24df8b682a85',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/0da3e819-8be9-47f3-b9a1-8329ab649d63',
                  domain: {
                    metadata: {
                      guid: '0da3e819-8be9-47f3-b9a1-8329ab649d63',
                      url: '/v2/shared_domains/0da3e819-8be9-47f3-b9a1-8329ab649d63',
                      created_at: '2017-08-10T13:38:02Z',
                      updated_at: '2017-08-10T13:38:02Z'
                    },
                    entity: {
                      name: 'cf-dev.io',
                      router_group_guid: null,
                      router_group_type: null
                    }
                  },
                  space_url: '/v2/spaces/f5e6affb-8b7b-4fa8-aea3-24df8b682a85',
                  space: {
                    metadata: {
                      guid: 'f5e6affb-8b7b-4fa8-aea3-24df8b682a85',
                      url: '/v2/spaces/f5e6affb-8b7b-4fa8-aea3-24df8b682a85',
                      created_at: '2017-08-14T11:02:29Z',
                      updated_at: '2017-08-14T11:02:29Z'
                    },
                    entity: {
                      name: 'services',
                      organization_guid: '48f9c989-8215-4164-8d1f-d3aa754fdcb5',
                      space_quota_definition_guid: null,
                      isolation_segment_guid: null,
                      allow_ssh: true,
                      organization_url: '/v2/organizations/48f9c989-8215-4164-8d1f-d3aa754fdcb5',
                      developers_url: '/v2/spaces/f5e6affb-8b7b-4fa8-aea3-24df8b682a85/developers',
                      managers_url: '/v2/spaces/f5e6affb-8b7b-4fa8-aea3-24df8b682a85/managers',
                      auditors_url: '/v2/spaces/f5e6affb-8b7b-4fa8-aea3-24df8b682a85/auditors',
                      apps_url: '/v2/spaces/f5e6affb-8b7b-4fa8-aea3-24df8b682a85/apps',
                      routes_url: '/v2/spaces/f5e6affb-8b7b-4fa8-aea3-24df8b682a85/routes',
                      domains_url: '/v2/spaces/f5e6affb-8b7b-4fa8-aea3-24df8b682a85/domains',
                      service_instances_url: '/v2/spaces/f5e6affb-8b7b-4fa8-aea3-24df8b682a85/service_instances',
                      app_events_url: '/v2/spaces/f5e6affb-8b7b-4fa8-aea3-24df8b682a85/app_events',
                      events_url: '/v2/spaces/f5e6affb-8b7b-4fa8-aea3-24df8b682a85/events',
                      security_groups_url: '/v2/spaces/f5e6affb-8b7b-4fa8-aea3-24df8b682a85/security_groups',
                      staging_security_groups_url: '/v2/spaces/f5e6affb-8b7b-4fa8-aea3-24df8b682a85/staging_security_groups'
                    }
                  },
                  apps_url: '/v2/routes/109aa9a4-f8a0-409a-b416-e93c15591d75/apps',
                  route_mappings_url: '/v2/routes/109aa9a4-f8a0-409a-b416-e93c15591d75/route_mappings'
                }
              }
            ],
            events_url: '/v2/apps/b862b599-7e32-43da-9956-b717d85e2f33/events',
            service_bindings_url: '/v2/apps/b862b599-7e32-43da-9956-b717d85e2f33/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/b862b599-7e32-43da-9956-b717d85e2f33/route_mappings',
            guid: 'b862b599-7e32-43da-9956-b717d85e2f33',
            cfGuid: '521a9d96-2d6c-4d94-a555-807437ab106d'
          },
          metadata: {
            guid: 'b862b599-7e32-43da-9956-b717d85e2f33',
            url: '/v2/apps/b862b599-7e32-43da-9956-b717d85e2f33',
            created_at: '2017-09-28T15:07:53Z',
            updated_at: '2017-09-28T15:07:54Z'
          }
        },
        '8f13b7ea-fe92-4bb4-a0e9-4c0effdf945c': {
          entity: {
            name: 'Nathan Test',
            production: false,
            space_guid: 'f5e6affb-8b7b-4fa8-aea3-24df8b682a85',
            stack_guid: 'd644d75e-fe53-492f-ba19-27e5d304413a',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: '5fb6c2b7-1cf7-475b-9fef-0c8a595b3996',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/f5e6affb-8b7b-4fa8-aea3-24df8b682a85',
            space: 'f5e6affb-8b7b-4fa8-aea3-24df8b682a85',
            stack_url: '/v2/stacks/d644d75e-fe53-492f-ba19-27e5d304413a',
            stack: 'd644d75e-fe53-492f-ba19-27e5d304413a',
            routes_url: '/v2/apps/8f13b7ea-fe92-4bb4-a0e9-4c0effdf945c/routes',
            routes: [
              {
                metadata: {
                  guid: '9b6f5788-4b22-42b3-b3d6-91d67bf6d127',
                  url: '/v2/routes/9b6f5788-4b22-42b3-b3d6-91d67bf6d127',
                  created_at: '2017-09-28T15:30:13Z',
                  updated_at: '2017-09-28T15:30:13Z'
                },
                entity: {
                  host: 'Nathan-Test',
                  path: '',
                  domain_guid: '0da3e819-8be9-47f3-b9a1-8329ab649d63',
                  space_guid: 'f5e6affb-8b7b-4fa8-aea3-24df8b682a85',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/0da3e819-8be9-47f3-b9a1-8329ab649d63',
                  domain: {
                    metadata: {
                      guid: '0da3e819-8be9-47f3-b9a1-8329ab649d63',
                      url: '/v2/shared_domains/0da3e819-8be9-47f3-b9a1-8329ab649d63',
                      created_at: '2017-08-10T13:38:02Z',
                      updated_at: '2017-08-10T13:38:02Z'
                    },
                    entity: {
                      name: 'cf-dev.io',
                      router_group_guid: null,
                      router_group_type: null
                    }
                  },
                  space_url: '/v2/spaces/f5e6affb-8b7b-4fa8-aea3-24df8b682a85',
                  space: {
                    metadata: {
                      guid: 'f5e6affb-8b7b-4fa8-aea3-24df8b682a85',
                      url: '/v2/spaces/f5e6affb-8b7b-4fa8-aea3-24df8b682a85',
                      created_at: '2017-08-14T11:02:29Z',
                      updated_at: '2017-08-14T11:02:29Z'
                    },
                    entity: {
                      name: 'services',
                      organization_guid: '48f9c989-8215-4164-8d1f-d3aa754fdcb5',
                      space_quota_definition_guid: null,
                      isolation_segment_guid: null,
                      allow_ssh: true,
                      organization_url: '/v2/organizations/48f9c989-8215-4164-8d1f-d3aa754fdcb5',
                      developers_url: '/v2/spaces/f5e6affb-8b7b-4fa8-aea3-24df8b682a85/developers',
                      managers_url: '/v2/spaces/f5e6affb-8b7b-4fa8-aea3-24df8b682a85/managers',
                      auditors_url: '/v2/spaces/f5e6affb-8b7b-4fa8-aea3-24df8b682a85/auditors',
                      apps_url: '/v2/spaces/f5e6affb-8b7b-4fa8-aea3-24df8b682a85/apps',
                      routes_url: '/v2/spaces/f5e6affb-8b7b-4fa8-aea3-24df8b682a85/routes',
                      domains_url: '/v2/spaces/f5e6affb-8b7b-4fa8-aea3-24df8b682a85/domains',
                      service_instances_url: '/v2/spaces/f5e6affb-8b7b-4fa8-aea3-24df8b682a85/service_instances',
                      app_events_url: '/v2/spaces/f5e6affb-8b7b-4fa8-aea3-24df8b682a85/app_events',
                      events_url: '/v2/spaces/f5e6affb-8b7b-4fa8-aea3-24df8b682a85/events',
                      security_groups_url: '/v2/spaces/f5e6affb-8b7b-4fa8-aea3-24df8b682a85/security_groups',
                      staging_security_groups_url: '/v2/spaces/f5e6affb-8b7b-4fa8-aea3-24df8b682a85/staging_security_groups'
                    }
                  },
                  apps_url: '/v2/routes/9b6f5788-4b22-42b3-b3d6-91d67bf6d127/apps',
                  route_mappings_url: '/v2/routes/9b6f5788-4b22-42b3-b3d6-91d67bf6d127/route_mappings'
                }
              }
            ],
            events_url: '/v2/apps/8f13b7ea-fe92-4bb4-a0e9-4c0effdf945c/events',
            service_bindings_url: '/v2/apps/8f13b7ea-fe92-4bb4-a0e9-4c0effdf945c/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/8f13b7ea-fe92-4bb4-a0e9-4c0effdf945c/route_mappings',
            guid: '8f13b7ea-fe92-4bb4-a0e9-4c0effdf945c',
            cfGuid: '521a9d96-2d6c-4d94-a555-807437ab106d'
          },
          metadata: {
            guid: '8f13b7ea-fe92-4bb4-a0e9-4c0effdf945c',
            url: '/v2/apps/8f13b7ea-fe92-4bb4-a0e9-4c0effdf945c',
            created_at: '2017-09-28T15:30:12Z',
            updated_at: '2017-09-28T15:30:13Z'
          }
        },
        '13321c2f-9156-498f-a4e8-318f414e8817': {
          entity: {
            name: 'acceptance.e2e.root.2017-10-02T12:03:40.267Z',
            production: false,
            space_guid: 'a59b770c-2b51-46d8-a16d-bfc0322b2e12',
            stack_guid: 'd644d75e-fe53-492f-ba19-27e5d304413a',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: '456feca0-cfeb-41cf-8d7b-1007ed551de8',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a59b770c-2b51-46d8-a16d-bfc0322b2e12',
            space: 'a59b770c-2b51-46d8-a16d-bfc0322b2e12',
            stack_url: '/v2/stacks/d644d75e-fe53-492f-ba19-27e5d304413a',
            stack: 'd644d75e-fe53-492f-ba19-27e5d304413a',
            routes_url: '/v2/apps/13321c2f-9156-498f-a4e8-318f414e8817/routes',
            routes: [
              {
                metadata: {
                  guid: '0e3e9789-4850-45e1-abab-3441a03868ac',
                  url: '/v2/routes/0e3e9789-4850-45e1-abab-3441a03868ac',
                  created_at: '2017-10-02T12:07:20Z',
                  updated_at: '2017-10-02T12:07:20Z'
                },
                entity: {
                  host: 'acceptance_e2e_root_2017-10-02T12_03_40_267Z',
                  path: '',
                  domain_guid: '0da3e819-8be9-47f3-b9a1-8329ab649d63',
                  space_guid: 'a59b770c-2b51-46d8-a16d-bfc0322b2e12',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/0da3e819-8be9-47f3-b9a1-8329ab649d63',
                  domain: {
                    metadata: {
                      guid: '0da3e819-8be9-47f3-b9a1-8329ab649d63',
                      url: '/v2/shared_domains/0da3e819-8be9-47f3-b9a1-8329ab649d63',
                      created_at: '2017-08-10T13:38:02Z',
                      updated_at: '2017-08-10T13:38:02Z'
                    },
                    entity: {
                      name: 'cf-dev.io',
                      router_group_guid: null,
                      router_group_type: null
                    }
                  },
                  space_url: '/v2/spaces/a59b770c-2b51-46d8-a16d-bfc0322b2e12',
                  space: {
                    metadata: {
                      guid: 'a59b770c-2b51-46d8-a16d-bfc0322b2e12',
                      url: '/v2/spaces/a59b770c-2b51-46d8-a16d-bfc0322b2e12',
                      created_at: '2017-08-10T13:45:25Z',
                      updated_at: '2017-08-10T13:45:25Z'
                    },
                    entity: {
                      name: 'e2e',
                      organization_guid: '9865ddfb-c5b1-4228-846b-94f662a7f730',
                      space_quota_definition_guid: null,
                      isolation_segment_guid: null,
                      allow_ssh: true,
                      organization_url: '/v2/organizations/9865ddfb-c5b1-4228-846b-94f662a7f730',
                      developers_url: '/v2/spaces/a59b770c-2b51-46d8-a16d-bfc0322b2e12/developers',
                      managers_url: '/v2/spaces/a59b770c-2b51-46d8-a16d-bfc0322b2e12/managers',
                      auditors_url: '/v2/spaces/a59b770c-2b51-46d8-a16d-bfc0322b2e12/auditors',
                      apps_url: '/v2/spaces/a59b770c-2b51-46d8-a16d-bfc0322b2e12/apps',
                      routes_url: '/v2/spaces/a59b770c-2b51-46d8-a16d-bfc0322b2e12/routes',
                      domains_url: '/v2/spaces/a59b770c-2b51-46d8-a16d-bfc0322b2e12/domains',
                      service_instances_url: '/v2/spaces/a59b770c-2b51-46d8-a16d-bfc0322b2e12/service_instances',
                      app_events_url: '/v2/spaces/a59b770c-2b51-46d8-a16d-bfc0322b2e12/app_events',
                      events_url: '/v2/spaces/a59b770c-2b51-46d8-a16d-bfc0322b2e12/events',
                      security_groups_url: '/v2/spaces/a59b770c-2b51-46d8-a16d-bfc0322b2e12/security_groups',
                      staging_security_groups_url: '/v2/spaces/a59b770c-2b51-46d8-a16d-bfc0322b2e12/staging_security_groups'
                    }
                  },
                  apps_url: '/v2/routes/0e3e9789-4850-45e1-abab-3441a03868ac/apps',
                  route_mappings_url: '/v2/routes/0e3e9789-4850-45e1-abab-3441a03868ac/route_mappings'
                }
              }
            ],
            events_url: '/v2/apps/13321c2f-9156-498f-a4e8-318f414e8817/events',
            service_bindings_url: '/v2/apps/13321c2f-9156-498f-a4e8-318f414e8817/service_bindings',
            service_bindings: [
              {
                metadata: {
                  guid: '29bbe51d-ba8c-4072-9020-b029aeb01aae',
                  url: '/v2/service_bindings/29bbe51d-ba8c-4072-9020-b029aeb01aae',
                  created_at: '2017-10-02T12:07:31Z',
                  updated_at: '2017-10-02T12:07:31Z'
                },
                entity: {
                  app_guid: '13321c2f-9156-498f-a4e8-318f414e8817',
                  service_instance_guid: '272e4b3d-1fa6-4eb5-8688-8c305ae129ad',
                  credentials: {
                    host: '1.2.3.4',
                    port: '4000'
                  },
                  binding_options: {},
                  gateway_data: null,
                  gateway_name: '',
                  syslog_drain_url: null,
                  volume_mounts: [],
                  app_url: '/v2/apps/13321c2f-9156-498f-a4e8-318f414e8817',
                  service_instance_url: '/v2/service_instances/272e4b3d-1fa6-4eb5-8688-8c305ae129ad',
                  service_instance: {
                    metadata: {
                      guid: '272e4b3d-1fa6-4eb5-8688-8c305ae129ad',
                      url: '/v2/service_instances/272e4b3d-1fa6-4eb5-8688-8c305ae129ad',
                      created_at: '2017-10-02T12:07:28Z',
                      updated_at: '2017-10-02T12:07:28Z'
                    },
                    entity: {
                      name: 'service_e2e_root_2017-10-02T12_03_40_267Z',
                      credentials: {},
                      service_plan_guid: '549409b6-b754-4643-a83b-885dbcfd2dfb',
                      space_guid: 'a59b770c-2b51-46d8-a16d-bfc0322b2e12',
                      gateway_data: null,
                      dashboard_url: 'https://app-autoscaler-broker.cf-dev.io/dashboard',
                      type: 'managed_service_instance',
                      last_operation: {
                        type: 'create',
                        state: 'succeeded',
                        description: '',
                        updated_at: '2017-10-02T12:07:28Z',
                        created_at: '2017-10-02T12:07:28Z'
                      },
                      tags: [],
                      service_guid: '43b1c1bd-0a26-4986-adcc-700d56559f1e',
                      space_url: '/v2/spaces/a59b770c-2b51-46d8-a16d-bfc0322b2e12',
                      service_plan_url: '/v2/service_plans/549409b6-b754-4643-a83b-885dbcfd2dfb',
                      service_bindings_url: '/v2/service_instances/272e4b3d-1fa6-4eb5-8688-8c305ae129ad/service_bindings',
                      service_keys_url: '/v2/service_instances/272e4b3d-1fa6-4eb5-8688-8c305ae129ad/service_keys',
                      routes_url: '/v2/service_instances/272e4b3d-1fa6-4eb5-8688-8c305ae129ad/routes',
                      service_url: '/v2/services/43b1c1bd-0a26-4986-adcc-700d56559f1e'
                    }
                  }
                }
              }
            ],
            route_mappings_url: '/v2/apps/13321c2f-9156-498f-a4e8-318f414e8817/route_mappings',
            guid: '13321c2f-9156-498f-a4e8-318f414e8817',
            cfGuid: '521a9d96-2d6c-4d94-a555-807437ab106d'
          },
          metadata: {
            guid: '13321c2f-9156-498f-a4e8-318f414e8817',
            url: '/v2/apps/13321c2f-9156-498f-a4e8-318f414e8817',
            created_at: '2017-10-02T12:07:20Z',
            updated_at: '2017-10-02T12:07:21Z'
          }
        },
        '44a63e90-8075-4708-90d9-262a81dcc77c': {
          entity: {
            name: 'acceptance.e2e.root.2017-10-02T12:55:11.087Z',
            production: false,
            space_guid: 'a59b770c-2b51-46d8-a16d-bfc0322b2e12',
            stack_guid: 'd644d75e-fe53-492f-ba19-27e5d304413a',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: 'ec2ecee5-21ed-441e-a4e7-e717fa81514b',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a59b770c-2b51-46d8-a16d-bfc0322b2e12',
            space: 'a59b770c-2b51-46d8-a16d-bfc0322b2e12',
            stack_url: '/v2/stacks/d644d75e-fe53-492f-ba19-27e5d304413a',
            stack: 'd644d75e-fe53-492f-ba19-27e5d304413a',
            routes_url: '/v2/apps/44a63e90-8075-4708-90d9-262a81dcc77c/routes',
            routes: [],
            events_url: '/v2/apps/44a63e90-8075-4708-90d9-262a81dcc77c/events',
            service_bindings_url: '/v2/apps/44a63e90-8075-4708-90d9-262a81dcc77c/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/44a63e90-8075-4708-90d9-262a81dcc77c/route_mappings',
            guid: '44a63e90-8075-4708-90d9-262a81dcc77c',
            cfGuid: '521a9d96-2d6c-4d94-a555-807437ab106d'
          },
          metadata: {
            guid: '44a63e90-8075-4708-90d9-262a81dcc77c',
            url: '/v2/apps/44a63e90-8075-4708-90d9-262a81dcc77c',
            created_at: '2017-10-02T12:58:03Z',
            updated_at: '2017-10-02T12:58:36Z'
          }
        },
        'eb0fabf1-0f49-4840-b9fb-a78f2f5433b5': {
          entity: {
            name: 'Test1234',
            production: false,
            space_guid: 'a59b770c-2b51-46d8-a16d-bfc0322b2e12',
            stack_guid: 'd644d75e-fe53-492f-ba19-27e5d304413a',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: '69c7a886-5373-4bd2-b925-bd573fdebb20',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a59b770c-2b51-46d8-a16d-bfc0322b2e12',
            space: 'a59b770c-2b51-46d8-a16d-bfc0322b2e12',
            stack_url: '/v2/stacks/d644d75e-fe53-492f-ba19-27e5d304413a',
            stack: 'd644d75e-fe53-492f-ba19-27e5d304413a',
            routes_url: '/v2/apps/eb0fabf1-0f49-4840-b9fb-a78f2f5433b5/routes',
            routes: [],
            events_url: '/v2/apps/eb0fabf1-0f49-4840-b9fb-a78f2f5433b5/events',
            service_bindings_url: '/v2/apps/eb0fabf1-0f49-4840-b9fb-a78f2f5433b5/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/eb0fabf1-0f49-4840-b9fb-a78f2f5433b5/route_mappings',
            guid: 'eb0fabf1-0f49-4840-b9fb-a78f2f5433b5',
            cfGuid: '521a9d96-2d6c-4d94-a555-807437ab106d'
          },
          metadata: {
            guid: 'eb0fabf1-0f49-4840-b9fb-a78f2f5433b5',
            url: '/v2/apps/eb0fabf1-0f49-4840-b9fb-a78f2f5433b5',
            created_at: '2017-10-03T08:13:31Z',
            updated_at: '2017-10-03T08:13:31Z'
          }
        },
        'fd125f54-60dd-4cf3-b966-5a4391abf5fa': {
          entity: {
            name: 'Test12342',
            production: false,
            space_guid: 'a59b770c-2b51-46d8-a16d-bfc0322b2e12',
            stack_guid: 'd644d75e-fe53-492f-ba19-27e5d304413a',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: '4caa3e36-9313-4fcb-abef-97bcb506637f',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a59b770c-2b51-46d8-a16d-bfc0322b2e12',
            space: 'a59b770c-2b51-46d8-a16d-bfc0322b2e12',
            stack_url: '/v2/stacks/d644d75e-fe53-492f-ba19-27e5d304413a',
            stack: 'd644d75e-fe53-492f-ba19-27e5d304413a',
            routes_url: '/v2/apps/fd125f54-60dd-4cf3-b966-5a4391abf5fa/routes',
            routes: [],
            events_url: '/v2/apps/fd125f54-60dd-4cf3-b966-5a4391abf5fa/events',
            service_bindings_url: '/v2/apps/fd125f54-60dd-4cf3-b966-5a4391abf5fa/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/fd125f54-60dd-4cf3-b966-5a4391abf5fa/route_mappings',
            guid: 'fd125f54-60dd-4cf3-b966-5a4391abf5fa',
            cfGuid: '521a9d96-2d6c-4d94-a555-807437ab106d'
          },
          metadata: {
            guid: 'fd125f54-60dd-4cf3-b966-5a4391abf5fa',
            url: '/v2/apps/fd125f54-60dd-4cf3-b966-5a4391abf5fa',
            created_at: '2017-10-03T08:15:53Z',
            updated_at: '2017-10-03T08:15:53Z'
          }
        },
        '0af78017-8c76-4d09-ae08-003c4b297fa5': {
          entity: {
            name: 'NathanTest',
            production: false,
            space_guid: 'a59b770c-2b51-46d8-a16d-bfc0322b2e12',
            stack_guid: 'd644d75e-fe53-492f-ba19-27e5d304413a',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: '9df5334f-10ea-4e13-bd4f-9069c60aa69e',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a59b770c-2b51-46d8-a16d-bfc0322b2e12',
            space: 'a59b770c-2b51-46d8-a16d-bfc0322b2e12',
            stack_url: '/v2/stacks/d644d75e-fe53-492f-ba19-27e5d304413a',
            stack: 'd644d75e-fe53-492f-ba19-27e5d304413a',
            routes_url: '/v2/apps/0af78017-8c76-4d09-ae08-003c4b297fa5/routes',
            routes: [],
            events_url: '/v2/apps/0af78017-8c76-4d09-ae08-003c4b297fa5/events',
            service_bindings_url: '/v2/apps/0af78017-8c76-4d09-ae08-003c4b297fa5/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/0af78017-8c76-4d09-ae08-003c4b297fa5/route_mappings',
            guid: '0af78017-8c76-4d09-ae08-003c4b297fa5',
            cfGuid: '521a9d96-2d6c-4d94-a555-807437ab106d'
          },
          metadata: {
            guid: '0af78017-8c76-4d09-ae08-003c4b297fa5',
            url: '/v2/apps/0af78017-8c76-4d09-ae08-003c4b297fa5',
            created_at: '2017-10-03T09:47:40Z',
            updated_at: '2017-10-03T09:47:40Z'
          }
        },
        '1b16f469-127b-440f-88ef-d4960c098bf6': {
          entity: {
            name: 'NathanTestf',
            production: false,
            space_guid: 'a59b770c-2b51-46d8-a16d-bfc0322b2e12',
            stack_guid: 'd644d75e-fe53-492f-ba19-27e5d304413a',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: '0103f106-7202-464d-87c6-0a68177a0138',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a59b770c-2b51-46d8-a16d-bfc0322b2e12',
            space: 'a59b770c-2b51-46d8-a16d-bfc0322b2e12',
            stack_url: '/v2/stacks/d644d75e-fe53-492f-ba19-27e5d304413a',
            stack: 'd644d75e-fe53-492f-ba19-27e5d304413a',
            routes_url: '/v2/apps/1b16f469-127b-440f-88ef-d4960c098bf6/routes',
            routes: [],
            events_url: '/v2/apps/1b16f469-127b-440f-88ef-d4960c098bf6/events',
            service_bindings_url: '/v2/apps/1b16f469-127b-440f-88ef-d4960c098bf6/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/1b16f469-127b-440f-88ef-d4960c098bf6/route_mappings',
            guid: '1b16f469-127b-440f-88ef-d4960c098bf6',
            cfGuid: '521a9d96-2d6c-4d94-a555-807437ab106d'
          },
          metadata: {
            guid: '1b16f469-127b-440f-88ef-d4960c098bf6',
            url: '/v2/apps/1b16f469-127b-440f-88ef-d4960c098bf6',
            created_at: '2017-10-03T09:48:36Z',
            updated_at: '2017-10-03T09:48:36Z'
          }
        },
        '1b4c9820-e648-4bd9-80c8-6b5a870938c4': {
          entity: {
            name: 'Test1234dsfds',
            production: false,
            space_guid: 'a59b770c-2b51-46d8-a16d-bfc0322b2e12',
            stack_guid: 'd644d75e-fe53-492f-ba19-27e5d304413a',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: 'fb86d2e1-46f7-4234-a247-08b787107a33',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a59b770c-2b51-46d8-a16d-bfc0322b2e12',
            space: 'a59b770c-2b51-46d8-a16d-bfc0322b2e12',
            stack_url: '/v2/stacks/d644d75e-fe53-492f-ba19-27e5d304413a',
            stack: 'd644d75e-fe53-492f-ba19-27e5d304413a',
            routes_url: '/v2/apps/1b4c9820-e648-4bd9-80c8-6b5a870938c4/routes',
            routes: [],
            events_url: '/v2/apps/1b4c9820-e648-4bd9-80c8-6b5a870938c4/events',
            service_bindings_url: '/v2/apps/1b4c9820-e648-4bd9-80c8-6b5a870938c4/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/1b4c9820-e648-4bd9-80c8-6b5a870938c4/route_mappings',
            guid: '1b4c9820-e648-4bd9-80c8-6b5a870938c4',
            cfGuid: '521a9d96-2d6c-4d94-a555-807437ab106d'
          },
          metadata: {
            guid: '1b4c9820-e648-4bd9-80c8-6b5a870938c4',
            url: '/v2/apps/1b4c9820-e648-4bd9-80c8-6b5a870938c4',
            created_at: '2017-10-03T09:50:28Z',
            updated_at: '2017-10-03T09:50:28Z'
          }
        },
        '83278b7e-feb9-41f1-ad03-06d08f9ce824': {
          entity: {
            name: 'Test1234asdsadsad',
            production: false,
            space_guid: 'a59b770c-2b51-46d8-a16d-bfc0322b2e12',
            stack_guid: 'd644d75e-fe53-492f-ba19-27e5d304413a',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: '6f2888fb-4362-48db-a4f6-784a9af48d98',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a59b770c-2b51-46d8-a16d-bfc0322b2e12',
            space: 'a59b770c-2b51-46d8-a16d-bfc0322b2e12',
            stack_url: '/v2/stacks/d644d75e-fe53-492f-ba19-27e5d304413a',
            stack: 'd644d75e-fe53-492f-ba19-27e5d304413a',
            routes_url: '/v2/apps/83278b7e-feb9-41f1-ad03-06d08f9ce824/routes',
            routes: [],
            events_url: '/v2/apps/83278b7e-feb9-41f1-ad03-06d08f9ce824/events',
            service_bindings_url: '/v2/apps/83278b7e-feb9-41f1-ad03-06d08f9ce824/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/83278b7e-feb9-41f1-ad03-06d08f9ce824/route_mappings',
            guid: '83278b7e-feb9-41f1-ad03-06d08f9ce824',
            cfGuid: '521a9d96-2d6c-4d94-a555-807437ab106d'
          },
          metadata: {
            guid: '83278b7e-feb9-41f1-ad03-06d08f9ce824',
            url: '/v2/apps/83278b7e-feb9-41f1-ad03-06d08f9ce824',
            created_at: '2017-10-03T09:56:41Z',
            updated_at: '2017-10-03T09:56:41Z'
          }
        },
        '610fd394-2323-45da-91e6-36b83357ad54': {
          entity: {
            name: 'sadfdasf',
            production: false,
            space_guid: 'a59b770c-2b51-46d8-a16d-bfc0322b2e12',
            stack_guid: 'd644d75e-fe53-492f-ba19-27e5d304413a',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: '9b632da0-a10a-4dd6-894e-757f675db3b2',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a59b770c-2b51-46d8-a16d-bfc0322b2e12',
            space: 'a59b770c-2b51-46d8-a16d-bfc0322b2e12',
            stack_url: '/v2/stacks/d644d75e-fe53-492f-ba19-27e5d304413a',
            stack: 'd644d75e-fe53-492f-ba19-27e5d304413a',
            routes_url: '/v2/apps/610fd394-2323-45da-91e6-36b83357ad54/routes',
            routes: [],
            events_url: '/v2/apps/610fd394-2323-45da-91e6-36b83357ad54/events',
            service_bindings_url: '/v2/apps/610fd394-2323-45da-91e6-36b83357ad54/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/610fd394-2323-45da-91e6-36b83357ad54/route_mappings',
            guid: '610fd394-2323-45da-91e6-36b83357ad54',
            cfGuid: '521a9d96-2d6c-4d94-a555-807437ab106d'
          },
          metadata: {
            guid: '610fd394-2323-45da-91e6-36b83357ad54',
            url: '/v2/apps/610fd394-2323-45da-91e6-36b83357ad54',
            created_at: '2017-10-03T09:58:10Z',
            updated_at: '2017-10-03T09:58:10Z'
          }
        },
        '98260847-6844-4674-8cbf-2d899171da2e': {
          entity: {
            name: 'Test1234asdsad',
            production: false,
            space_guid: 'a59b770c-2b51-46d8-a16d-bfc0322b2e12',
            stack_guid: 'd644d75e-fe53-492f-ba19-27e5d304413a',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: 'e2235edc-21be-498f-bb6f-eaabefb4adc3',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a59b770c-2b51-46d8-a16d-bfc0322b2e12',
            space: 'a59b770c-2b51-46d8-a16d-bfc0322b2e12',
            stack_url: '/v2/stacks/d644d75e-fe53-492f-ba19-27e5d304413a',
            stack: 'd644d75e-fe53-492f-ba19-27e5d304413a',
            routes_url: '/v2/apps/98260847-6844-4674-8cbf-2d899171da2e/routes',
            routes: [],
            events_url: '/v2/apps/98260847-6844-4674-8cbf-2d899171da2e/events',
            service_bindings_url: '/v2/apps/98260847-6844-4674-8cbf-2d899171da2e/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/98260847-6844-4674-8cbf-2d899171da2e/route_mappings',
            guid: '98260847-6844-4674-8cbf-2d899171da2e',
            cfGuid: '521a9d96-2d6c-4d94-a555-807437ab106d'
          },
          metadata: {
            guid: '98260847-6844-4674-8cbf-2d899171da2e',
            url: '/v2/apps/98260847-6844-4674-8cbf-2d899171da2e',
            created_at: '2017-10-03T10:04:31Z',
            updated_at: '2017-10-03T10:04:31Z'
          }
        },
        'c58cb952-b75d-4ed6-9ca6-426daf13570b': {
          entity: {
            name: 'Test1234asdf',
            production: false,
            space_guid: 'a59b770c-2b51-46d8-a16d-bfc0322b2e12',
            stack_guid: 'd644d75e-fe53-492f-ba19-27e5d304413a',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: '762aa151-8820-437c-8ba4-7cf651eff784',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a59b770c-2b51-46d8-a16d-bfc0322b2e12',
            space: 'a59b770c-2b51-46d8-a16d-bfc0322b2e12',
            stack_url: '/v2/stacks/d644d75e-fe53-492f-ba19-27e5d304413a',
            stack: 'd644d75e-fe53-492f-ba19-27e5d304413a',
            routes_url: '/v2/apps/c58cb952-b75d-4ed6-9ca6-426daf13570b/routes',
            routes: [],
            events_url: '/v2/apps/c58cb952-b75d-4ed6-9ca6-426daf13570b/events',
            service_bindings_url: '/v2/apps/c58cb952-b75d-4ed6-9ca6-426daf13570b/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/c58cb952-b75d-4ed6-9ca6-426daf13570b/route_mappings',
            guid: 'c58cb952-b75d-4ed6-9ca6-426daf13570b',
            cfGuid: '521a9d96-2d6c-4d94-a555-807437ab106d'
          },
          metadata: {
            guid: 'c58cb952-b75d-4ed6-9ca6-426daf13570b',
            url: '/v2/apps/c58cb952-b75d-4ed6-9ca6-426daf13570b',
            created_at: '2017-10-03T10:06:57Z',
            updated_at: '2017-10-03T10:06:57Z'
          }
        },
        '6c6d0951-80f8-4420-b2b5-1ff404072ed6': {
          entity: {
            name: 'Test1234xcvbnm',
            production: false,
            space_guid: 'a59b770c-2b51-46d8-a16d-bfc0322b2e12',
            stack_guid: 'd644d75e-fe53-492f-ba19-27e5d304413a',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: '43a2bc5d-18b6-4e12-aa41-9cb7012b17cf',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a59b770c-2b51-46d8-a16d-bfc0322b2e12',
            space: 'a59b770c-2b51-46d8-a16d-bfc0322b2e12',
            stack_url: '/v2/stacks/d644d75e-fe53-492f-ba19-27e5d304413a',
            stack: 'd644d75e-fe53-492f-ba19-27e5d304413a',
            routes_url: '/v2/apps/6c6d0951-80f8-4420-b2b5-1ff404072ed6/routes',
            routes: [],
            events_url: '/v2/apps/6c6d0951-80f8-4420-b2b5-1ff404072ed6/events',
            service_bindings_url: '/v2/apps/6c6d0951-80f8-4420-b2b5-1ff404072ed6/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/6c6d0951-80f8-4420-b2b5-1ff404072ed6/route_mappings',
            guid: '6c6d0951-80f8-4420-b2b5-1ff404072ed6',
            cfGuid: '521a9d96-2d6c-4d94-a555-807437ab106d'
          },
          metadata: {
            guid: '6c6d0951-80f8-4420-b2b5-1ff404072ed6',
            url: '/v2/apps/6c6d0951-80f8-4420-b2b5-1ff404072ed6',
            created_at: '2017-10-03T10:08:17Z',
            updated_at: '2017-10-03T10:08:17Z'
          }
        },
        'f916c732-cce2-4500-bc88-e3ca19f1394b': {
          entity: {
            name: 'Test1234dfvdfg',
            production: false,
            space_guid: 'a59b770c-2b51-46d8-a16d-bfc0322b2e12',
            stack_guid: 'd644d75e-fe53-492f-ba19-27e5d304413a',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: '68431cb5-881c-4359-b231-99f4e7d5ac33',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a59b770c-2b51-46d8-a16d-bfc0322b2e12',
            space: 'a59b770c-2b51-46d8-a16d-bfc0322b2e12',
            stack_url: '/v2/stacks/d644d75e-fe53-492f-ba19-27e5d304413a',
            stack: 'd644d75e-fe53-492f-ba19-27e5d304413a',
            routes_url: '/v2/apps/f916c732-cce2-4500-bc88-e3ca19f1394b/routes',
            routes: [],
            events_url: '/v2/apps/f916c732-cce2-4500-bc88-e3ca19f1394b/events',
            service_bindings_url: '/v2/apps/f916c732-cce2-4500-bc88-e3ca19f1394b/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/f916c732-cce2-4500-bc88-e3ca19f1394b/route_mappings',
            guid: 'f916c732-cce2-4500-bc88-e3ca19f1394b',
            cfGuid: '521a9d96-2d6c-4d94-a555-807437ab106d'
          },
          metadata: {
            guid: 'f916c732-cce2-4500-bc88-e3ca19f1394b',
            url: '/v2/apps/f916c732-cce2-4500-bc88-e3ca19f1394b',
            created_at: '2017-10-03T10:11:24Z',
            updated_at: '2017-10-03T10:11:24Z'
          }
        },
        '7d046ff5-68af-4ed9-8a69-8e74b011563e': {
          entity: {
            name: 'wsdefrgtyuji',
            production: false,
            space_guid: 'a59b770c-2b51-46d8-a16d-bfc0322b2e12',
            stack_guid: 'd644d75e-fe53-492f-ba19-27e5d304413a',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: '8acf1437-51c0-40d7-be1f-6e8dcca620c6',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a59b770c-2b51-46d8-a16d-bfc0322b2e12',
            space: 'a59b770c-2b51-46d8-a16d-bfc0322b2e12',
            stack_url: '/v2/stacks/d644d75e-fe53-492f-ba19-27e5d304413a',
            stack: 'd644d75e-fe53-492f-ba19-27e5d304413a',
            routes_url: '/v2/apps/7d046ff5-68af-4ed9-8a69-8e74b011563e/routes',
            routes: [],
            events_url: '/v2/apps/7d046ff5-68af-4ed9-8a69-8e74b011563e/events',
            service_bindings_url: '/v2/apps/7d046ff5-68af-4ed9-8a69-8e74b011563e/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/7d046ff5-68af-4ed9-8a69-8e74b011563e/route_mappings',
            guid: '7d046ff5-68af-4ed9-8a69-8e74b011563e',
            cfGuid: '521a9d96-2d6c-4d94-a555-807437ab106d'
          },
          metadata: {
            guid: '7d046ff5-68af-4ed9-8a69-8e74b011563e',
            url: '/v2/apps/7d046ff5-68af-4ed9-8a69-8e74b011563e',
            created_at: '2017-10-03T10:11:58Z',
            updated_at: '2017-10-03T10:11:58Z'
          }
        },
        'ea8220f9-fd47-4c88-9e12-9fb0611f3260': {
          entity: {
            name: 'Test1234 nbnmc',
            production: false,
            space_guid: 'a59b770c-2b51-46d8-a16d-bfc0322b2e12',
            stack_guid: 'd644d75e-fe53-492f-ba19-27e5d304413a',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: '093d4a8d-2250-45ab-b27a-26ee6b1ba267',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a59b770c-2b51-46d8-a16d-bfc0322b2e12',
            space: 'a59b770c-2b51-46d8-a16d-bfc0322b2e12',
            stack_url: '/v2/stacks/d644d75e-fe53-492f-ba19-27e5d304413a',
            stack: 'd644d75e-fe53-492f-ba19-27e5d304413a',
            routes_url: '/v2/apps/ea8220f9-fd47-4c88-9e12-9fb0611f3260/routes',
            routes: [],
            events_url: '/v2/apps/ea8220f9-fd47-4c88-9e12-9fb0611f3260/events',
            service_bindings_url: '/v2/apps/ea8220f9-fd47-4c88-9e12-9fb0611f3260/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/ea8220f9-fd47-4c88-9e12-9fb0611f3260/route_mappings',
            guid: 'ea8220f9-fd47-4c88-9e12-9fb0611f3260',
            cfGuid: '521a9d96-2d6c-4d94-a555-807437ab106d'
          },
          metadata: {
            guid: 'ea8220f9-fd47-4c88-9e12-9fb0611f3260',
            url: '/v2/apps/ea8220f9-fd47-4c88-9e12-9fb0611f3260',
            created_at: '2017-10-03T10:14:02Z',
            updated_at: '2017-10-03T10:14:02Z'
          }
        },
        '70b1b77f-71e2-4c06-8f4b-66486cff44af': {
          entity: {
            name: 'Nathan Test123',
            production: false,
            space_guid: 'a59b770c-2b51-46d8-a16d-bfc0322b2e12',
            stack_guid: 'd644d75e-fe53-492f-ba19-27e5d304413a',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: '39fc10cd-4ff1-4845-891b-8ab8d8cc1d50',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a59b770c-2b51-46d8-a16d-bfc0322b2e12',
            space: 'a59b770c-2b51-46d8-a16d-bfc0322b2e12',
            stack_url: '/v2/stacks/d644d75e-fe53-492f-ba19-27e5d304413a',
            stack: 'd644d75e-fe53-492f-ba19-27e5d304413a',
            routes_url: '/v2/apps/70b1b77f-71e2-4c06-8f4b-66486cff44af/routes',
            routes: [],
            events_url: '/v2/apps/70b1b77f-71e2-4c06-8f4b-66486cff44af/events',
            service_bindings_url: '/v2/apps/70b1b77f-71e2-4c06-8f4b-66486cff44af/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/70b1b77f-71e2-4c06-8f4b-66486cff44af/route_mappings',
            guid: '70b1b77f-71e2-4c06-8f4b-66486cff44af',
            cfGuid: '521a9d96-2d6c-4d94-a555-807437ab106d'
          },
          metadata: {
            guid: '70b1b77f-71e2-4c06-8f4b-66486cff44af',
            url: '/v2/apps/70b1b77f-71e2-4c06-8f4b-66486cff44af',
            created_at: '2017-10-03T10:38:09Z',
            updated_at: '2017-10-03T10:38:09Z'
          }
        },
        '122f72b1-4c63-45f4-a607-34fc152fc551': {
          entity: {
            name: 'Test1234asdsadadsfdsaf',
            production: false,
            space_guid: 'a59b770c-2b51-46d8-a16d-bfc0322b2e12',
            stack_guid: 'd644d75e-fe53-492f-ba19-27e5d304413a',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: '7da50cdd-b4df-4b57-93bb-448dba73e0ed',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a59b770c-2b51-46d8-a16d-bfc0322b2e12',
            space: 'a59b770c-2b51-46d8-a16d-bfc0322b2e12',
            stack_url: '/v2/stacks/d644d75e-fe53-492f-ba19-27e5d304413a',
            stack: 'd644d75e-fe53-492f-ba19-27e5d304413a',
            routes_url: '/v2/apps/122f72b1-4c63-45f4-a607-34fc152fc551/routes',
            routes: [],
            events_url: '/v2/apps/122f72b1-4c63-45f4-a607-34fc152fc551/events',
            service_bindings_url: '/v2/apps/122f72b1-4c63-45f4-a607-34fc152fc551/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/122f72b1-4c63-45f4-a607-34fc152fc551/route_mappings',
            guid: '122f72b1-4c63-45f4-a607-34fc152fc551',
            cfGuid: '521a9d96-2d6c-4d94-a555-807437ab106d'
          },
          metadata: {
            guid: '122f72b1-4c63-45f4-a607-34fc152fc551',
            url: '/v2/apps/122f72b1-4c63-45f4-a607-34fc152fc551',
            created_at: '2017-10-03T10:47:16Z',
            updated_at: '2017-10-03T10:47:16Z'
          }
        },
        '9830d869-e8c3-4ac7-b838-1e7927c4ee5f': {
          entity: {
            name: 'Test1234fdsf',
            production: false,
            space_guid: 'a59b770c-2b51-46d8-a16d-bfc0322b2e12',
            stack_guid: 'd644d75e-fe53-492f-ba19-27e5d304413a',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: '69b0e3c4-9de4-423f-a9bc-b57f4f7ff400',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a59b770c-2b51-46d8-a16d-bfc0322b2e12',
            space: 'a59b770c-2b51-46d8-a16d-bfc0322b2e12',
            stack_url: '/v2/stacks/d644d75e-fe53-492f-ba19-27e5d304413a',
            stack: 'd644d75e-fe53-492f-ba19-27e5d304413a',
            routes_url: '/v2/apps/9830d869-e8c3-4ac7-b838-1e7927c4ee5f/routes',
            routes: [],
            events_url: '/v2/apps/9830d869-e8c3-4ac7-b838-1e7927c4ee5f/events',
            service_bindings_url: '/v2/apps/9830d869-e8c3-4ac7-b838-1e7927c4ee5f/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/9830d869-e8c3-4ac7-b838-1e7927c4ee5f/route_mappings',
            guid: '9830d869-e8c3-4ac7-b838-1e7927c4ee5f',
            cfGuid: '521a9d96-2d6c-4d94-a555-807437ab106d'
          },
          metadata: {
            guid: '9830d869-e8c3-4ac7-b838-1e7927c4ee5f',
            url: '/v2/apps/9830d869-e8c3-4ac7-b838-1e7927c4ee5f',
            created_at: '2017-10-03T10:49:37Z',
            updated_at: '2017-10-03T10:49:37Z'
          }
        },
        '34fea963-076b-48f6-9928-11b075c1c822': {
          entity: {
            name: 'console',
            production: false,
            space_guid: '8071af91-4b2f-4569-b76e-12a21e71d701',
            stack_guid: '3371958e-2de6-481f-9a6d-0198b42dea6e',
            buildpack: 'https://github.com/nwmac/stratos-buildpack',
            detected_buildpack: '',
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 256,
            state: 'STARTED',
            version: '0c526d8a-2ef0-496e-83ca-e2adf7ec06a8',
            command: null,
            console: false,
            debug: null,
            staging_task_id: '10cbd70b-320e-4502-880b-ac105e05750a',
            package_state: 'STAGED',
            health_check_type: 'port',
            health_check_timeout: 180,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: '2017-10-03T16:19:29Z',
            detected_start_command: './deploy/cloud-foundry/start.sh',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/8071af91-4b2f-4569-b76e-12a21e71d701',
            space: '8071af91-4b2f-4569-b76e-12a21e71d701',
            stack_url: '/v2/stacks/3371958e-2de6-481f-9a6d-0198b42dea6e',
            stack: '3371958e-2de6-481f-9a6d-0198b42dea6e',
            routes_url: '/v2/apps/34fea963-076b-48f6-9928-11b075c1c822/routes',
            routes: [
              {
                metadata: {
                  guid: 'c56091b1-bba0-4c82-9af6-2c0488dabb56',
                  url: '/v2/routes/c56091b1-bba0-4c82-9af6-2c0488dabb56',
                  created_at: '2017-10-03T15:20:06Z',
                  updated_at: '2017-10-03T15:20:06Z'
                },
                entity: {
                  host: 'neil',
                  path: '',
                  domain_guid: '0da3e819-8be9-47f3-b9a1-8329ab649d63',
                  space_guid: '8071af91-4b2f-4569-b76e-12a21e71d701',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/0da3e819-8be9-47f3-b9a1-8329ab649d63',
                  domain: {
                    metadata: {
                      guid: '0da3e819-8be9-47f3-b9a1-8329ab649d63',
                      url: '/v2/shared_domains/0da3e819-8be9-47f3-b9a1-8329ab649d63',
                      created_at: '2017-08-10T13:38:02Z',
                      updated_at: '2017-08-10T13:38:02Z'
                    },
                    entity: {
                      name: 'cf-dev.io',
                      router_group_guid: null,
                      router_group_type: null
                    }
                  },
                  space_url: '/v2/spaces/8071af91-4b2f-4569-b76e-12a21e71d701',
                  space: {
                    metadata: {
                      guid: '8071af91-4b2f-4569-b76e-12a21e71d701',
                      url: '/v2/spaces/8071af91-4b2f-4569-b76e-12a21e71d701',
                      created_at: '2017-08-10T13:45:34Z',
                      updated_at: '2017-08-10T13:45:34Z'
                    },
                    entity: {
                      name: 'dev',
                      organization_guid: '46b16d55-4198-4077-92ff-2c53298648a2',
                      space_quota_definition_guid: null,
                      isolation_segment_guid: null,
                      allow_ssh: true,
                      organization_url: '/v2/organizations/46b16d55-4198-4077-92ff-2c53298648a2',
                      developers_url: '/v2/spaces/8071af91-4b2f-4569-b76e-12a21e71d701/developers',
                      managers_url: '/v2/spaces/8071af91-4b2f-4569-b76e-12a21e71d701/managers',
                      auditors_url: '/v2/spaces/8071af91-4b2f-4569-b76e-12a21e71d701/auditors',
                      apps_url: '/v2/spaces/8071af91-4b2f-4569-b76e-12a21e71d701/apps',
                      routes_url: '/v2/spaces/8071af91-4b2f-4569-b76e-12a21e71d701/routes',
                      domains_url: '/v2/spaces/8071af91-4b2f-4569-b76e-12a21e71d701/domains',
                      service_instances_url: '/v2/spaces/8071af91-4b2f-4569-b76e-12a21e71d701/service_instances',
                      app_events_url: '/v2/spaces/8071af91-4b2f-4569-b76e-12a21e71d701/app_events',
                      events_url: '/v2/spaces/8071af91-4b2f-4569-b76e-12a21e71d701/events',
                      security_groups_url: '/v2/spaces/8071af91-4b2f-4569-b76e-12a21e71d701/security_groups',
                      staging_security_groups_url: '/v2/spaces/8071af91-4b2f-4569-b76e-12a21e71d701/staging_security_groups'
                    }
                  },
                  apps_url: '/v2/routes/c56091b1-bba0-4c82-9af6-2c0488dabb56/apps',
                  route_mappings_url: '/v2/routes/c56091b1-bba0-4c82-9af6-2c0488dabb56/route_mappings'
                }
              }
            ],
            events_url: '/v2/apps/34fea963-076b-48f6-9928-11b075c1c822/events',
            service_bindings_url: '/v2/apps/34fea963-076b-48f6-9928-11b075c1c822/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/34fea963-076b-48f6-9928-11b075c1c822/route_mappings',
            guid: '34fea963-076b-48f6-9928-11b075c1c822',
            cfGuid: '521a9d96-2d6c-4d94-a555-807437ab106d'
          },
          metadata: {
            guid: '34fea963-076b-48f6-9928-11b075c1c822',
            url: '/v2/apps/34fea963-076b-48f6-9928-11b075c1c822',
            created_at: '2017-10-03T16:18:41Z',
            updated_at: '2017-10-03T16:19:49Z'
          }
        },
        '0fe1de5d-8e53-4f67-aafa-0c16228dc182': {
          entity: {
            name: 'asdfsdfasdfsdaf2',
            production: false,
            space_guid: 'a59b770c-2b51-46d8-a16d-bfc0322b2e12',
            stack_guid: 'd644d75e-fe53-492f-ba19-27e5d304413a',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: '641459b6-4530-4cba-9f2b-c6f490c66b93',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a59b770c-2b51-46d8-a16d-bfc0322b2e12',
            space: 'a59b770c-2b51-46d8-a16d-bfc0322b2e12',
            stack_url: '/v2/stacks/d644d75e-fe53-492f-ba19-27e5d304413a',
            stack: 'd644d75e-fe53-492f-ba19-27e5d304413a',
            routes_url: '/v2/apps/0fe1de5d-8e53-4f67-aafa-0c16228dc182/routes',
            routes: [
              {
                metadata: {
                  guid: 'c919c1d9-789b-489b-a74e-a43c6afa5dc8',
                  url: '/v2/routes/c919c1d9-789b-489b-a74e-a43c6afa5dc8',
                  created_at: '2017-10-05T12:33:53Z',
                  updated_at: '2017-10-05T12:33:53Z'
                },
                entity: {
                  host: 'asdfsdfasdfsdaf2',
                  path: '',
                  domain_guid: '0da3e819-8be9-47f3-b9a1-8329ab649d63',
                  space_guid: 'a59b770c-2b51-46d8-a16d-bfc0322b2e12',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/0da3e819-8be9-47f3-b9a1-8329ab649d63',
                  domain: {
                    metadata: {
                      guid: '0da3e819-8be9-47f3-b9a1-8329ab649d63',
                      url: '/v2/shared_domains/0da3e819-8be9-47f3-b9a1-8329ab649d63',
                      created_at: '2017-08-10T13:38:02Z',
                      updated_at: '2017-08-10T13:38:02Z'
                    },
                    entity: {
                      name: 'cf-dev.io',
                      router_group_guid: null,
                      router_group_type: null
                    }
                  },
                  space_url: '/v2/spaces/a59b770c-2b51-46d8-a16d-bfc0322b2e12',
                  space: {
                    metadata: {
                      guid: 'a59b770c-2b51-46d8-a16d-bfc0322b2e12',
                      url: '/v2/spaces/a59b770c-2b51-46d8-a16d-bfc0322b2e12',
                      created_at: '2017-08-10T13:45:25Z',
                      updated_at: '2017-08-10T13:45:25Z'
                    },
                    entity: {
                      name: 'e2e',
                      organization_guid: '9865ddfb-c5b1-4228-846b-94f662a7f730',
                      space_quota_definition_guid: null,
                      isolation_segment_guid: null,
                      allow_ssh: true,
                      organization_url: '/v2/organizations/9865ddfb-c5b1-4228-846b-94f662a7f730',
                      developers_url: '/v2/spaces/a59b770c-2b51-46d8-a16d-bfc0322b2e12/developers',
                      managers_url: '/v2/spaces/a59b770c-2b51-46d8-a16d-bfc0322b2e12/managers',
                      auditors_url: '/v2/spaces/a59b770c-2b51-46d8-a16d-bfc0322b2e12/auditors',
                      apps_url: '/v2/spaces/a59b770c-2b51-46d8-a16d-bfc0322b2e12/apps',
                      routes_url: '/v2/spaces/a59b770c-2b51-46d8-a16d-bfc0322b2e12/routes',
                      domains_url: '/v2/spaces/a59b770c-2b51-46d8-a16d-bfc0322b2e12/domains',
                      service_instances_url: '/v2/spaces/a59b770c-2b51-46d8-a16d-bfc0322b2e12/service_instances',
                      app_events_url: '/v2/spaces/a59b770c-2b51-46d8-a16d-bfc0322b2e12/app_events',
                      events_url: '/v2/spaces/a59b770c-2b51-46d8-a16d-bfc0322b2e12/events',
                      security_groups_url: '/v2/spaces/a59b770c-2b51-46d8-a16d-bfc0322b2e12/security_groups',
                      staging_security_groups_url: '/v2/spaces/a59b770c-2b51-46d8-a16d-bfc0322b2e12/staging_security_groups'
                    }
                  },
                  apps_url: '/v2/routes/c919c1d9-789b-489b-a74e-a43c6afa5dc8/apps',
                  route_mappings_url: '/v2/routes/c919c1d9-789b-489b-a74e-a43c6afa5dc8/route_mappings'
                }
              }
            ],
            events_url: '/v2/apps/0fe1de5d-8e53-4f67-aafa-0c16228dc182/events',
            service_bindings_url: '/v2/apps/0fe1de5d-8e53-4f67-aafa-0c16228dc182/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/0fe1de5d-8e53-4f67-aafa-0c16228dc182/route_mappings',
            guid: '0fe1de5d-8e53-4f67-aafa-0c16228dc182',
            cfGuid: '521a9d96-2d6c-4d94-a555-807437ab106d'
          },
          metadata: {
            guid: '0fe1de5d-8e53-4f67-aafa-0c16228dc182',
            url: '/v2/apps/0fe1de5d-8e53-4f67-aafa-0c16228dc182',
            created_at: '2017-10-05T12:33:53Z',
            updated_at: '2017-10-05T12:33:55Z'
          }
        },
        '74980881-a122-469d-9acc-a2b965abd5e9': {
          entity: {
            name: 'node-env',
            production: false,
            space_guid: 'aa775168-7be8-4006-81e5-647d59f8ee22',
            stack_guid: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            buildpack: null,
            detected_buildpack: 'node.js 1.5.36',
            detected_buildpack_guid: 'e4be1af0-a5db-4a9a-be5f-0f93ff0135c0',
            environment_json: {},
            memory: 64,
            instances: 1,
            disk_quota: 512,
            state: 'STARTED',
            version: 'cd90d3ec-e0ad-4d7f-9f61-5da9893cca84',
            command: null,
            console: false,
            debug: null,
            staging_task_id: '84dc6f72-9d39-4439-9cd5-052d84572ff0',
            package_state: 'STAGED',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: '2017-09-22T15:30:57Z',
            detected_start_command: 'node server.js',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/aa775168-7be8-4006-81e5-647d59f8ee22',
            space: 'aa775168-7be8-4006-81e5-647d59f8ee22',
            stack_url: '/v2/stacks/97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            stack: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            routes_url: '/v2/apps/74980881-a122-469d-9acc-a2b965abd5e9/routes',
            routes: [
              {
                metadata: {
                  guid: 'c8c53018-1bce-47ef-bf63-24e7b38a74bc',
                  url: '/v2/routes/c8c53018-1bce-47ef-bf63-24e7b38a74bc',
                  created_at: '2017-09-22T15:30:52Z',
                  updated_at: '2017-09-22T15:30:52Z'
                },
                entity: {
                  host: 'node-env',
                  path: '',
                  domain_guid: '44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  space_guid: 'aa775168-7be8-4006-81e5-647d59f8ee22',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  domain: {
                    metadata: {
                      guid: '44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                      url: '/v2/shared_domains/44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                      created_at: '2017-09-22T15:25:53Z',
                      updated_at: '2017-09-22T15:25:53Z'
                    },
                    entity: {
                      name: 'capbristol.com',
                      router_group_guid: null,
                      router_group_type: null
                    }
                  },
                  space_url: '/v2/spaces/aa775168-7be8-4006-81e5-647d59f8ee22',
                  space: {
                    metadata: {
                      guid: 'aa775168-7be8-4006-81e5-647d59f8ee22',
                      url: '/v2/spaces/aa775168-7be8-4006-81e5-647d59f8ee22',
                      created_at: '2017-09-22T15:28:41Z',
                      updated_at: '2017-09-22T15:28:41Z'
                    },
                    entity: {
                      name: 'dev',
                      organization_guid: '742d83a1-f8d4-4b1a-96d7-010e9074c2ca',
                      space_quota_definition_guid: null,
                      isolation_segment_guid: null,
                      allow_ssh: true,
                      organization_url: '/v2/organizations/742d83a1-f8d4-4b1a-96d7-010e9074c2ca',
                      developers_url: '/v2/spaces/aa775168-7be8-4006-81e5-647d59f8ee22/developers',
                      managers_url: '/v2/spaces/aa775168-7be8-4006-81e5-647d59f8ee22/managers',
                      auditors_url: '/v2/spaces/aa775168-7be8-4006-81e5-647d59f8ee22/auditors',
                      apps_url: '/v2/spaces/aa775168-7be8-4006-81e5-647d59f8ee22/apps',
                      routes_url: '/v2/spaces/aa775168-7be8-4006-81e5-647d59f8ee22/routes',
                      domains_url: '/v2/spaces/aa775168-7be8-4006-81e5-647d59f8ee22/domains',
                      service_instances_url: '/v2/spaces/aa775168-7be8-4006-81e5-647d59f8ee22/service_instances',
                      app_events_url: '/v2/spaces/aa775168-7be8-4006-81e5-647d59f8ee22/app_events',
                      events_url: '/v2/spaces/aa775168-7be8-4006-81e5-647d59f8ee22/events',
                      security_groups_url: '/v2/spaces/aa775168-7be8-4006-81e5-647d59f8ee22/security_groups',
                      staging_security_groups_url: '/v2/spaces/aa775168-7be8-4006-81e5-647d59f8ee22/staging_security_groups'
                    }
                  },
                  apps_url: '/v2/routes/c8c53018-1bce-47ef-bf63-24e7b38a74bc/apps',
                  route_mappings_url: '/v2/routes/c8c53018-1bce-47ef-bf63-24e7b38a74bc/route_mappings'
                }
              }
            ],
            events_url: '/v2/apps/74980881-a122-469d-9acc-a2b965abd5e9/events',
            service_bindings_url: '/v2/apps/74980881-a122-469d-9acc-a2b965abd5e9/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/74980881-a122-469d-9acc-a2b965abd5e9/route_mappings',
            guid: '74980881-a122-469d-9acc-a2b965abd5e9',
            cfGuid: '663a363e-1faf-4359-ac96-b8c24ec1a4ab'
          },
          metadata: {
            guid: '74980881-a122-469d-9acc-a2b965abd5e9',
            url: '/v2/apps/74980881-a122-469d-9acc-a2b965abd5e9',
            created_at: '2017-09-22T15:30:49Z',
            updated_at: '2017-10-01T21:38:51Z'
          }
        },
        '1532e7d5-643d-436e-bb74-7b60fd76265d': {
          entity: {
            name: 'empty',
            production: false,
            space_guid: 'd91c3bf0-3ab0-4372-8b08-75de137eeaf8',
            stack_guid: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: '50a9bd21-3c7f-4137-90fa-b7bfa487e91d',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/d91c3bf0-3ab0-4372-8b08-75de137eeaf8',
            space: 'd91c3bf0-3ab0-4372-8b08-75de137eeaf8',
            stack_url: '/v2/stacks/97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            stack: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            routes_url: '/v2/apps/1532e7d5-643d-436e-bb74-7b60fd76265d/routes',
            routes: [
              {
                metadata: {
                  guid: 'd117f186-062f-47a3-8b5f-63af20ab318b',
                  url: '/v2/routes/d117f186-062f-47a3-8b5f-63af20ab318b',
                  created_at: '2017-09-25T13:39:10Z',
                  updated_at: '2017-09-25T13:39:10Z'
                },
                entity: {
                  host: 'empty',
                  path: '',
                  domain_guid: '44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  space_guid: 'd91c3bf0-3ab0-4372-8b08-75de137eeaf8',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  domain: {
                    metadata: {
                      guid: '44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                      url: '/v2/shared_domains/44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                      created_at: '2017-09-22T15:25:53Z',
                      updated_at: '2017-09-22T15:25:53Z'
                    },
                    entity: {
                      name: 'capbristol.com',
                      router_group_guid: null,
                      router_group_type: null
                    }
                  },
                  space_url: '/v2/spaces/d91c3bf0-3ab0-4372-8b08-75de137eeaf8',
                  space: {
                    metadata: {
                      guid: 'd91c3bf0-3ab0-4372-8b08-75de137eeaf8',
                      url: '/v2/spaces/d91c3bf0-3ab0-4372-8b08-75de137eeaf8',
                      created_at: '2017-09-22T15:38:44Z',
                      updated_at: '2017-09-22T15:38:44Z'
                    },
                    entity: {
                      name: 'susecon',
                      organization_guid: '94ce3787-757b-4eac-91c6-8f1705a178ba',
                      space_quota_definition_guid: null,
                      isolation_segment_guid: null,
                      allow_ssh: true,
                      organization_url: '/v2/organizations/94ce3787-757b-4eac-91c6-8f1705a178ba',
                      developers_url: '/v2/spaces/d91c3bf0-3ab0-4372-8b08-75de137eeaf8/developers',
                      managers_url: '/v2/spaces/d91c3bf0-3ab0-4372-8b08-75de137eeaf8/managers',
                      auditors_url: '/v2/spaces/d91c3bf0-3ab0-4372-8b08-75de137eeaf8/auditors',
                      apps_url: '/v2/spaces/d91c3bf0-3ab0-4372-8b08-75de137eeaf8/apps',
                      routes_url: '/v2/spaces/d91c3bf0-3ab0-4372-8b08-75de137eeaf8/routes',
                      domains_url: '/v2/spaces/d91c3bf0-3ab0-4372-8b08-75de137eeaf8/domains',
                      service_instances_url: '/v2/spaces/d91c3bf0-3ab0-4372-8b08-75de137eeaf8/service_instances',
                      app_events_url: '/v2/spaces/d91c3bf0-3ab0-4372-8b08-75de137eeaf8/app_events',
                      events_url: '/v2/spaces/d91c3bf0-3ab0-4372-8b08-75de137eeaf8/events',
                      security_groups_url: '/v2/spaces/d91c3bf0-3ab0-4372-8b08-75de137eeaf8/security_groups',
                      staging_security_groups_url: '/v2/spaces/d91c3bf0-3ab0-4372-8b08-75de137eeaf8/staging_security_groups'
                    }
                  },
                  apps_url: '/v2/routes/d117f186-062f-47a3-8b5f-63af20ab318b/apps',
                  route_mappings_url: '/v2/routes/d117f186-062f-47a3-8b5f-63af20ab318b/route_mappings'
                }
              }
            ],
            events_url: '/v2/apps/1532e7d5-643d-436e-bb74-7b60fd76265d/events',
            service_bindings_url: '/v2/apps/1532e7d5-643d-436e-bb74-7b60fd76265d/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/1532e7d5-643d-436e-bb74-7b60fd76265d/route_mappings',
            guid: '1532e7d5-643d-436e-bb74-7b60fd76265d',
            cfGuid: '663a363e-1faf-4359-ac96-b8c24ec1a4ab'
          },
          metadata: {
            guid: '1532e7d5-643d-436e-bb74-7b60fd76265d',
            url: '/v2/apps/1532e7d5-643d-436e-bb74-7b60fd76265d',
            created_at: '2017-09-25T13:39:09Z',
            updated_at: '2017-09-25T13:39:11Z'
          }
        },
        'ca76c3a6-44c4-4d7e-9ae6-d8ced5e99c44': {
          entity: {
            name: 'sdgsdfg',
            production: false,
            space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_guid: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: '07419ef8-5f0e-451b-a064-e793cefc254c',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
            space: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_url: '/v2/stacks/97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            stack: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            routes_url: '/v2/apps/ca76c3a6-44c4-4d7e-9ae6-d8ced5e99c44/routes',
            routes: [
              {
                metadata: {
                  guid: 'be5c6699-feb7-4e6f-91aa-99186199e058',
                  url: '/v2/routes/be5c6699-feb7-4e6f-91aa-99186199e058',
                  created_at: '2017-09-28T15:01:31Z',
                  updated_at: '2017-09-28T15:01:31Z'
                },
                entity: {
                  host: 'sdfgsdfg',
                  path: '',
                  domain_guid: '44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  domain: {
                    metadata: {
                      guid: '44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                      url: '/v2/shared_domains/44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                      created_at: '2017-09-22T15:25:53Z',
                      updated_at: '2017-09-22T15:25:53Z'
                    },
                    entity: {
                      name: 'capbristol.com',
                      router_group_guid: null,
                      router_group_type: null
                    }
                  },
                  space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
                  space: {
                    metadata: {
                      guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
                      url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
                      created_at: '2017-09-22T15:27:48Z',
                      updated_at: '2017-09-22T15:27:48Z'
                    },
                    entity: {
                      name: 'e2e',
                      organization_guid: '22feecef-df39-4ae0-a56a-098cbe09ec0d',
                      space_quota_definition_guid: null,
                      isolation_segment_guid: null,
                      allow_ssh: true,
                      organization_url: '/v2/organizations/22feecef-df39-4ae0-a56a-098cbe09ec0d',
                      developers_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/developers',
                      managers_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/managers',
                      auditors_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/auditors',
                      apps_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/apps',
                      routes_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/routes',
                      domains_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/domains',
                      service_instances_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/service_instances',
                      app_events_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/app_events',
                      events_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/events',
                      security_groups_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/security_groups',
                      staging_security_groups_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/staging_security_groups'
                    }
                  },
                  apps_url: '/v2/routes/be5c6699-feb7-4e6f-91aa-99186199e058/apps',
                  route_mappings_url: '/v2/routes/be5c6699-feb7-4e6f-91aa-99186199e058/route_mappings'
                }
              }
            ],
            events_url: '/v2/apps/ca76c3a6-44c4-4d7e-9ae6-d8ced5e99c44/events',
            service_bindings_url: '/v2/apps/ca76c3a6-44c4-4d7e-9ae6-d8ced5e99c44/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/ca76c3a6-44c4-4d7e-9ae6-d8ced5e99c44/route_mappings',
            guid: 'ca76c3a6-44c4-4d7e-9ae6-d8ced5e99c44',
            cfGuid: '663a363e-1faf-4359-ac96-b8c24ec1a4ab'
          },
          metadata: {
            guid: 'ca76c3a6-44c4-4d7e-9ae6-d8ced5e99c44',
            url: '/v2/apps/ca76c3a6-44c4-4d7e-9ae6-d8ced5e99c44',
            created_at: '2017-09-28T15:01:31Z',
            updated_at: '2017-09-28T15:01:32Z'
          }
        },
        '0fb015ed-a743-42e4-be08-9f09f05378bb': {
          entity: {
            name: 'Test123',
            production: false,
            space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_guid: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: '87bea6db-323e-4389-94e1-346c3bbe4c50',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
            space: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_url: '/v2/stacks/97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            stack: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            routes_url: '/v2/apps/0fb015ed-a743-42e4-be08-9f09f05378bb/routes',
            routes: [],
            events_url: '/v2/apps/0fb015ed-a743-42e4-be08-9f09f05378bb/events',
            service_bindings_url: '/v2/apps/0fb015ed-a743-42e4-be08-9f09f05378bb/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/0fb015ed-a743-42e4-be08-9f09f05378bb/route_mappings',
            guid: '0fb015ed-a743-42e4-be08-9f09f05378bb',
            cfGuid: '663a363e-1faf-4359-ac96-b8c24ec1a4ab'
          },
          metadata: {
            guid: '0fb015ed-a743-42e4-be08-9f09f05378bb',
            url: '/v2/apps/0fb015ed-a743-42e4-be08-9f09f05378bb',
            created_at: '2017-09-29T10:34:28Z',
            updated_at: '2017-09-29T10:34:28Z'
          }
        },
        '5d5f3b86-f50b-46b3-9ed8-64f1276f99a0': {
          entity: {
            name: 'Test1233',
            production: false,
            space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_guid: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: 'd212ad6d-8c5a-4190-b4d2-794f0659db35',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
            space: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_url: '/v2/stacks/97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            stack: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            routes_url: '/v2/apps/5d5f3b86-f50b-46b3-9ed8-64f1276f99a0/routes',
            routes: [],
            events_url: '/v2/apps/5d5f3b86-f50b-46b3-9ed8-64f1276f99a0/events',
            service_bindings_url: '/v2/apps/5d5f3b86-f50b-46b3-9ed8-64f1276f99a0/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/5d5f3b86-f50b-46b3-9ed8-64f1276f99a0/route_mappings',
            guid: '5d5f3b86-f50b-46b3-9ed8-64f1276f99a0',
            cfGuid: '663a363e-1faf-4359-ac96-b8c24ec1a4ab'
          },
          metadata: {
            guid: '5d5f3b86-f50b-46b3-9ed8-64f1276f99a0',
            url: '/v2/apps/5d5f3b86-f50b-46b3-9ed8-64f1276f99a0',
            created_at: '2017-09-29T10:39:33Z',
            updated_at: '2017-09-29T10:39:33Z'
          }
        },
        'c6a7751f-182e-4b28-8c53-ca28243ee501': {
          entity: {
            name: 'Test1234',
            production: false,
            space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_guid: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: '49f38ecd-132f-4f4b-b946-e013228509d7',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
            space: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_url: '/v2/stacks/97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            stack: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            routes_url: '/v2/apps/c6a7751f-182e-4b28-8c53-ca28243ee501/routes',
            routes: [],
            events_url: '/v2/apps/c6a7751f-182e-4b28-8c53-ca28243ee501/events',
            service_bindings_url: '/v2/apps/c6a7751f-182e-4b28-8c53-ca28243ee501/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/c6a7751f-182e-4b28-8c53-ca28243ee501/route_mappings',
            guid: 'c6a7751f-182e-4b28-8c53-ca28243ee501',
            cfGuid: '663a363e-1faf-4359-ac96-b8c24ec1a4ab'
          },
          metadata: {
            guid: 'c6a7751f-182e-4b28-8c53-ca28243ee501',
            url: '/v2/apps/c6a7751f-182e-4b28-8c53-ca28243ee501',
            created_at: '2017-09-29T12:19:55Z',
            updated_at: '2017-09-29T12:19:55Z'
          }
        },
        'a54e9401-a7d9-4a36-b548-d78507057e69': {
          entity: {
            name: 'Test12345',
            production: false,
            space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_guid: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: 'a843adc3-c9d7-420c-9793-15eaefdfff6e',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
            space: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_url: '/v2/stacks/97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            stack: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            routes_url: '/v2/apps/a54e9401-a7d9-4a36-b548-d78507057e69/routes',
            routes: [],
            events_url: '/v2/apps/a54e9401-a7d9-4a36-b548-d78507057e69/events',
            service_bindings_url: '/v2/apps/a54e9401-a7d9-4a36-b548-d78507057e69/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/a54e9401-a7d9-4a36-b548-d78507057e69/route_mappings',
            guid: 'a54e9401-a7d9-4a36-b548-d78507057e69',
            cfGuid: '663a363e-1faf-4359-ac96-b8c24ec1a4ab'
          },
          metadata: {
            guid: 'a54e9401-a7d9-4a36-b548-d78507057e69',
            url: '/v2/apps/a54e9401-a7d9-4a36-b548-d78507057e69',
            created_at: '2017-09-29T12:44:40Z',
            updated_at: '2017-09-29T12:44:40Z'
          }
        },
        '658e24d6-da5f-4faa-a6ae-95bc787faa25': {
          entity: {
            name: 'Test123456',
            production: false,
            space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_guid: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: 'a7be5011-b55b-4ad6-a1ac-de7552936074',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
            space: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_url: '/v2/stacks/97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            stack: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            routes_url: '/v2/apps/658e24d6-da5f-4faa-a6ae-95bc787faa25/routes',
            routes: [],
            events_url: '/v2/apps/658e24d6-da5f-4faa-a6ae-95bc787faa25/events',
            service_bindings_url: '/v2/apps/658e24d6-da5f-4faa-a6ae-95bc787faa25/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/658e24d6-da5f-4faa-a6ae-95bc787faa25/route_mappings',
            guid: '658e24d6-da5f-4faa-a6ae-95bc787faa25',
            cfGuid: '663a363e-1faf-4359-ac96-b8c24ec1a4ab'
          },
          metadata: {
            guid: '658e24d6-da5f-4faa-a6ae-95bc787faa25',
            url: '/v2/apps/658e24d6-da5f-4faa-a6ae-95bc787faa25',
            created_at: '2017-09-29T12:45:32Z',
            updated_at: '2017-09-29T12:45:32Z'
          }
        },
        'd27915f7-55b9-427e-969b-6b0ce5a67803': {
          entity: {
            name: 'Test12344',
            production: false,
            space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_guid: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: 'b7b1f2ee-f487-486c-881b-bda184693d98',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
            space: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_url: '/v2/stacks/97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            stack: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            routes_url: '/v2/apps/d27915f7-55b9-427e-969b-6b0ce5a67803/routes',
            routes: [],
            events_url: '/v2/apps/d27915f7-55b9-427e-969b-6b0ce5a67803/events',
            service_bindings_url: '/v2/apps/d27915f7-55b9-427e-969b-6b0ce5a67803/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/d27915f7-55b9-427e-969b-6b0ce5a67803/route_mappings',
            guid: 'd27915f7-55b9-427e-969b-6b0ce5a67803',
            cfGuid: '663a363e-1faf-4359-ac96-b8c24ec1a4ab'
          },
          metadata: {
            guid: 'd27915f7-55b9-427e-969b-6b0ce5a67803',
            url: '/v2/apps/d27915f7-55b9-427e-969b-6b0ce5a67803',
            created_at: '2017-09-29T12:46:48Z',
            updated_at: '2017-09-29T12:46:48Z'
          }
        },
        'cdbe2006-8311-451c-aec1-72c36afd384d': {
          entity: {
            name: 'TETESR',
            production: false,
            space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_guid: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: '707678fb-eaab-4418-bd84-d74964f618a6',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
            space: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_url: '/v2/stacks/97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            stack: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            routes_url: '/v2/apps/cdbe2006-8311-451c-aec1-72c36afd384d/routes',
            routes: [],
            events_url: '/v2/apps/cdbe2006-8311-451c-aec1-72c36afd384d/events',
            service_bindings_url: '/v2/apps/cdbe2006-8311-451c-aec1-72c36afd384d/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/cdbe2006-8311-451c-aec1-72c36afd384d/route_mappings',
            guid: 'cdbe2006-8311-451c-aec1-72c36afd384d',
            cfGuid: '663a363e-1faf-4359-ac96-b8c24ec1a4ab'
          },
          metadata: {
            guid: 'cdbe2006-8311-451c-aec1-72c36afd384d',
            url: '/v2/apps/cdbe2006-8311-451c-aec1-72c36afd384d',
            created_at: '2017-09-29T12:48:29Z',
            updated_at: '2017-09-29T12:48:29Z'
          }
        },
        '278ba371-59ad-4504-9b58-47f67b0fde42': {
          entity: {
            name: 'Test123445',
            production: false,
            space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_guid: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: '3a853ec0-bd0c-4029-9325-95c3c4cad5a4',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
            space: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_url: '/v2/stacks/97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            stack: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            routes_url: '/v2/apps/278ba371-59ad-4504-9b58-47f67b0fde42/routes',
            routes: [],
            events_url: '/v2/apps/278ba371-59ad-4504-9b58-47f67b0fde42/events',
            service_bindings_url: '/v2/apps/278ba371-59ad-4504-9b58-47f67b0fde42/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/278ba371-59ad-4504-9b58-47f67b0fde42/route_mappings',
            guid: '278ba371-59ad-4504-9b58-47f67b0fde42',
            cfGuid: '663a363e-1faf-4359-ac96-b8c24ec1a4ab'
          },
          metadata: {
            guid: '278ba371-59ad-4504-9b58-47f67b0fde42',
            url: '/v2/apps/278ba371-59ad-4504-9b58-47f67b0fde42',
            created_at: '2017-09-29T12:51:55Z',
            updated_at: '2017-09-29T12:51:55Z'
          }
        },
        'cb20a937-d20e-4f37-8d8a-0ec2a2a40599': {
          entity: {
            name: 'Test1234455',
            production: false,
            space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_guid: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: '52b8aa3b-2a35-4750-8c1e-c6bb486f65b1',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
            space: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_url: '/v2/stacks/97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            stack: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            routes_url: '/v2/apps/cb20a937-d20e-4f37-8d8a-0ec2a2a40599/routes',
            routes: [],
            events_url: '/v2/apps/cb20a937-d20e-4f37-8d8a-0ec2a2a40599/events',
            service_bindings_url: '/v2/apps/cb20a937-d20e-4f37-8d8a-0ec2a2a40599/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/cb20a937-d20e-4f37-8d8a-0ec2a2a40599/route_mappings',
            guid: 'cb20a937-d20e-4f37-8d8a-0ec2a2a40599',
            cfGuid: '663a363e-1faf-4359-ac96-b8c24ec1a4ab'
          },
          metadata: {
            guid: 'cb20a937-d20e-4f37-8d8a-0ec2a2a40599',
            url: '/v2/apps/cb20a937-d20e-4f37-8d8a-0ec2a2a40599',
            created_at: '2017-09-29T13:09:39Z',
            updated_at: '2017-09-29T13:09:39Z'
          }
        },
        '7c324e6f-b9fc-4cd7-a977-48276413a805': {
          entity: {
            name: 'Tetst1234',
            production: false,
            space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_guid: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: 'c0a3654b-8882-4220-9374-539b08110039',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
            space: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_url: '/v2/stacks/97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            stack: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            routes_url: '/v2/apps/7c324e6f-b9fc-4cd7-a977-48276413a805/routes',
            routes: [],
            events_url: '/v2/apps/7c324e6f-b9fc-4cd7-a977-48276413a805/events',
            service_bindings_url: '/v2/apps/7c324e6f-b9fc-4cd7-a977-48276413a805/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/7c324e6f-b9fc-4cd7-a977-48276413a805/route_mappings',
            guid: '7c324e6f-b9fc-4cd7-a977-48276413a805',
            cfGuid: '663a363e-1faf-4359-ac96-b8c24ec1a4ab'
          },
          metadata: {
            guid: '7c324e6f-b9fc-4cd7-a977-48276413a805',
            url: '/v2/apps/7c324e6f-b9fc-4cd7-a977-48276413a805',
            created_at: '2017-09-29T13:11:46Z',
            updated_at: '2017-09-29T13:11:46Z'
          }
        },
        '29b09812-0b9c-4d10-9181-26436461914a': {
          entity: {
            name: 'Test1234645',
            production: false,
            space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_guid: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: '9bf7c37e-457c-402c-8d8c-4eb61ca44bcf',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
            space: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_url: '/v2/stacks/97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            stack: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            routes_url: '/v2/apps/29b09812-0b9c-4d10-9181-26436461914a/routes',
            routes: [],
            events_url: '/v2/apps/29b09812-0b9c-4d10-9181-26436461914a/events',
            service_bindings_url: '/v2/apps/29b09812-0b9c-4d10-9181-26436461914a/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/29b09812-0b9c-4d10-9181-26436461914a/route_mappings',
            guid: '29b09812-0b9c-4d10-9181-26436461914a',
            cfGuid: '663a363e-1faf-4359-ac96-b8c24ec1a4ab'
          },
          metadata: {
            guid: '29b09812-0b9c-4d10-9181-26436461914a',
            url: '/v2/apps/29b09812-0b9c-4d10-9181-26436461914a',
            created_at: '2017-09-29T13:15:26Z',
            updated_at: '2017-09-29T13:15:26Z'
          }
        },
        '79dbd97e-0887-49f9-80c0-444cf1f16a96': {
          entity: {
            name: 'Test12347',
            production: false,
            space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_guid: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: '90ad6709-f069-47f5-ae78-5907f47fd3f8',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
            space: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_url: '/v2/stacks/97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            stack: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            routes_url: '/v2/apps/79dbd97e-0887-49f9-80c0-444cf1f16a96/routes',
            routes: [],
            events_url: '/v2/apps/79dbd97e-0887-49f9-80c0-444cf1f16a96/events',
            service_bindings_url: '/v2/apps/79dbd97e-0887-49f9-80c0-444cf1f16a96/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/79dbd97e-0887-49f9-80c0-444cf1f16a96/route_mappings',
            guid: '79dbd97e-0887-49f9-80c0-444cf1f16a96',
            cfGuid: '663a363e-1faf-4359-ac96-b8c24ec1a4ab'
          },
          metadata: {
            guid: '79dbd97e-0887-49f9-80c0-444cf1f16a96',
            url: '/v2/apps/79dbd97e-0887-49f9-80c0-444cf1f16a96',
            created_at: '2017-09-29T13:17:42Z',
            updated_at: '2017-09-29T13:17:42Z'
          }
        },
        '683b899c-6235-406c-82dd-176db0404369': {
          entity: {
            name: 'test12345678',
            production: false,
            space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_guid: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: '65fd3bf8-4d74-479c-8aff-e349828c4e03',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
            space: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_url: '/v2/stacks/97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            stack: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            routes_url: '/v2/apps/683b899c-6235-406c-82dd-176db0404369/routes',
            routes: [],
            events_url: '/v2/apps/683b899c-6235-406c-82dd-176db0404369/events',
            service_bindings_url: '/v2/apps/683b899c-6235-406c-82dd-176db0404369/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/683b899c-6235-406c-82dd-176db0404369/route_mappings',
            guid: '683b899c-6235-406c-82dd-176db0404369',
            cfGuid: '663a363e-1faf-4359-ac96-b8c24ec1a4ab'
          },
          metadata: {
            guid: '683b899c-6235-406c-82dd-176db0404369',
            url: '/v2/apps/683b899c-6235-406c-82dd-176db0404369',
            created_at: '2017-09-29T13:27:33Z',
            updated_at: '2017-09-29T13:27:33Z'
          }
        },
        'c9b34793-4b14-45ae-bd1f-15e005db8583': {
          entity: {
            name: 'Test1234r24324',
            production: false,
            space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_guid: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: '8fa0b86c-4351-45ce-b7e0-9f74923b41dd',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
            space: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_url: '/v2/stacks/97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            stack: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            routes_url: '/v2/apps/c9b34793-4b14-45ae-bd1f-15e005db8583/routes',
            routes: [],
            events_url: '/v2/apps/c9b34793-4b14-45ae-bd1f-15e005db8583/events',
            service_bindings_url: '/v2/apps/c9b34793-4b14-45ae-bd1f-15e005db8583/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/c9b34793-4b14-45ae-bd1f-15e005db8583/route_mappings',
            guid: 'c9b34793-4b14-45ae-bd1f-15e005db8583',
            cfGuid: '663a363e-1faf-4359-ac96-b8c24ec1a4ab'
          },
          metadata: {
            guid: 'c9b34793-4b14-45ae-bd1f-15e005db8583',
            url: '/v2/apps/c9b34793-4b14-45ae-bd1f-15e005db8583',
            created_at: '2017-09-29T13:28:56Z',
            updated_at: '2017-09-29T13:28:56Z'
          }
        },
        '1511062e-7099-4dfb-9fa3-08d699bbd0ab': {
          entity: {
            name: 'Test123445678',
            production: false,
            space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_guid: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: 'e6bb9e1e-68b4-4a4b-85b8-c57006126051',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
            space: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_url: '/v2/stacks/97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            stack: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            routes_url: '/v2/apps/1511062e-7099-4dfb-9fa3-08d699bbd0ab/routes',
            routes: [],
            events_url: '/v2/apps/1511062e-7099-4dfb-9fa3-08d699bbd0ab/events',
            service_bindings_url: '/v2/apps/1511062e-7099-4dfb-9fa3-08d699bbd0ab/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/1511062e-7099-4dfb-9fa3-08d699bbd0ab/route_mappings',
            guid: '1511062e-7099-4dfb-9fa3-08d699bbd0ab',
            cfGuid: '663a363e-1faf-4359-ac96-b8c24ec1a4ab'
          },
          metadata: {
            guid: '1511062e-7099-4dfb-9fa3-08d699bbd0ab',
            url: '/v2/apps/1511062e-7099-4dfb-9fa3-08d699bbd0ab',
            created_at: '2017-09-29T13:34:42Z',
            updated_at: '2017-09-29T13:34:42Z'
          }
        },
        'eb86d68d-fd31-42c1-a711-74691775c2d8': {
          entity: {
            name: 'Test12345iujyg',
            production: false,
            space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_guid: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: '7791a7be-929f-49fe-b0b3-c1e2dbe0b143',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
            space: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_url: '/v2/stacks/97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            stack: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            routes_url: '/v2/apps/eb86d68d-fd31-42c1-a711-74691775c2d8/routes',
            routes: [],
            events_url: '/v2/apps/eb86d68d-fd31-42c1-a711-74691775c2d8/events',
            service_bindings_url: '/v2/apps/eb86d68d-fd31-42c1-a711-74691775c2d8/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/eb86d68d-fd31-42c1-a711-74691775c2d8/route_mappings',
            guid: 'eb86d68d-fd31-42c1-a711-74691775c2d8',
            cfGuid: '663a363e-1faf-4359-ac96-b8c24ec1a4ab'
          },
          metadata: {
            guid: 'eb86d68d-fd31-42c1-a711-74691775c2d8',
            url: '/v2/apps/eb86d68d-fd31-42c1-a711-74691775c2d8',
            created_at: '2017-09-29T13:36:05Z',
            updated_at: '2017-09-29T13:36:05Z'
          }
        },
        '9daab4bc-6a94-401e-8456-730cf516d4c9': {
          entity: {
            name: 'NathanTest1',
            production: false,
            space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_guid: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: '9bf1adef-ee8d-40d3-bbae-2a3069d9b278',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
            space: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_url: '/v2/stacks/97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            stack: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            routes_url: '/v2/apps/9daab4bc-6a94-401e-8456-730cf516d4c9/routes',
            routes: [],
            events_url: '/v2/apps/9daab4bc-6a94-401e-8456-730cf516d4c9/events',
            service_bindings_url: '/v2/apps/9daab4bc-6a94-401e-8456-730cf516d4c9/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/9daab4bc-6a94-401e-8456-730cf516d4c9/route_mappings',
            guid: '9daab4bc-6a94-401e-8456-730cf516d4c9',
            cfGuid: '663a363e-1faf-4359-ac96-b8c24ec1a4ab'
          },
          metadata: {
            guid: '9daab4bc-6a94-401e-8456-730cf516d4c9',
            url: '/v2/apps/9daab4bc-6a94-401e-8456-730cf516d4c9',
            created_at: '2017-09-29T15:01:59Z',
            updated_at: '2017-09-29T15:01:59Z'
          }
        },
        '4fbec12e-b310-42c3-831c-e70c21cccc96': {
          entity: {
            name: 'TestNathan123',
            production: false,
            space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_guid: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: '0b7b0c2a-95f4-4558-af74-f66bba622959',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
            space: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_url: '/v2/stacks/97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            stack: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            routes_url: '/v2/apps/4fbec12e-b310-42c3-831c-e70c21cccc96/routes',
            routes: [],
            events_url: '/v2/apps/4fbec12e-b310-42c3-831c-e70c21cccc96/events',
            service_bindings_url: '/v2/apps/4fbec12e-b310-42c3-831c-e70c21cccc96/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/4fbec12e-b310-42c3-831c-e70c21cccc96/route_mappings',
            guid: '4fbec12e-b310-42c3-831c-e70c21cccc96',
            cfGuid: '663a363e-1faf-4359-ac96-b8c24ec1a4ab'
          },
          metadata: {
            guid: '4fbec12e-b310-42c3-831c-e70c21cccc96',
            url: '/v2/apps/4fbec12e-b310-42c3-831c-e70c21cccc96',
            created_at: '2017-09-29T15:04:46Z',
            updated_at: '2017-09-29T15:04:46Z'
          }
        },
        'c5c8a9f2-a770-4ee5-8f7a-0eb6015dfe3a': {
          entity: {
            name: 'obi-wan',
            production: false,
            space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_guid: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: '075f7fa7-09a9-44d1-b7b4-660eb58c3398',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
            space: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_url: '/v2/stacks/97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            stack: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            routes_url: '/v2/apps/c5c8a9f2-a770-4ee5-8f7a-0eb6015dfe3a/routes',
            routes: [],
            events_url: '/v2/apps/c5c8a9f2-a770-4ee5-8f7a-0eb6015dfe3a/events',
            service_bindings_url: '/v2/apps/c5c8a9f2-a770-4ee5-8f7a-0eb6015dfe3a/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/c5c8a9f2-a770-4ee5-8f7a-0eb6015dfe3a/route_mappings',
            guid: 'c5c8a9f2-a770-4ee5-8f7a-0eb6015dfe3a',
            cfGuid: '663a363e-1faf-4359-ac96-b8c24ec1a4ab'
          },
          metadata: {
            guid: 'c5c8a9f2-a770-4ee5-8f7a-0eb6015dfe3a',
            url: '/v2/apps/c5c8a9f2-a770-4ee5-8f7a-0eb6015dfe3a',
            created_at: '2017-09-29T15:09:00Z',
            updated_at: '2017-09-29T15:09:00Z'
          }
        },
        '8c92a1ca-b7ec-4811-883c-d33ac65fce73': {
          entity: {
            name: 'Test1234263543567',
            production: false,
            space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_guid: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: 'ec9e6ecf-e1f1-4f2b-a141-e864ce3f1968',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
            space: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_url: '/v2/stacks/97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            stack: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            routes_url: '/v2/apps/8c92a1ca-b7ec-4811-883c-d33ac65fce73/routes',
            routes: [],
            events_url: '/v2/apps/8c92a1ca-b7ec-4811-883c-d33ac65fce73/events',
            service_bindings_url: '/v2/apps/8c92a1ca-b7ec-4811-883c-d33ac65fce73/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/8c92a1ca-b7ec-4811-883c-d33ac65fce73/route_mappings',
            guid: '8c92a1ca-b7ec-4811-883c-d33ac65fce73',
            cfGuid: '663a363e-1faf-4359-ac96-b8c24ec1a4ab'
          },
          metadata: {
            guid: '8c92a1ca-b7ec-4811-883c-d33ac65fce73',
            url: '/v2/apps/8c92a1ca-b7ec-4811-883c-d33ac65fce73',
            created_at: '2017-09-29T15:40:38Z',
            updated_at: '2017-09-29T15:40:38Z'
          }
        },
        'de78601d-49ec-4ebe-9bd9-9cc104207f72': {
          entity: {
            name: 'sadfsdafdsafsdafsadf',
            production: false,
            space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_guid: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: 'dc0cec78-f7ba-4577-bfb2-e7f52c7d811e',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
            space: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_url: '/v2/stacks/97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            stack: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            routes_url: '/v2/apps/de78601d-49ec-4ebe-9bd9-9cc104207f72/routes',
            routes: [],
            events_url: '/v2/apps/de78601d-49ec-4ebe-9bd9-9cc104207f72/events',
            service_bindings_url: '/v2/apps/de78601d-49ec-4ebe-9bd9-9cc104207f72/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/de78601d-49ec-4ebe-9bd9-9cc104207f72/route_mappings',
            guid: 'de78601d-49ec-4ebe-9bd9-9cc104207f72',
            cfGuid: '663a363e-1faf-4359-ac96-b8c24ec1a4ab'
          },
          metadata: {
            guid: 'de78601d-49ec-4ebe-9bd9-9cc104207f72',
            url: '/v2/apps/de78601d-49ec-4ebe-9bd9-9cc104207f72',
            created_at: '2017-09-29T15:42:01Z',
            updated_at: '2017-09-29T15:42:01Z'
          }
        },
        '14016a5f-0509-47c7-852a-98ba05ab5da8': {
          entity: {
            name: 'Test123456sadsad',
            production: false,
            space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_guid: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: '5a2dac76-b339-4022-add1-68330326f0df',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
            space: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_url: '/v2/stacks/97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            stack: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            routes_url: '/v2/apps/14016a5f-0509-47c7-852a-98ba05ab5da8/routes',
            routes: [],
            events_url: '/v2/apps/14016a5f-0509-47c7-852a-98ba05ab5da8/events',
            service_bindings_url: '/v2/apps/14016a5f-0509-47c7-852a-98ba05ab5da8/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/14016a5f-0509-47c7-852a-98ba05ab5da8/route_mappings',
            guid: '14016a5f-0509-47c7-852a-98ba05ab5da8',
            cfGuid: '663a363e-1faf-4359-ac96-b8c24ec1a4ab'
          },
          metadata: {
            guid: '14016a5f-0509-47c7-852a-98ba05ab5da8',
            url: '/v2/apps/14016a5f-0509-47c7-852a-98ba05ab5da8',
            created_at: '2017-09-29T15:43:49Z',
            updated_at: '2017-09-29T15:43:49Z'
          }
        },
        '03b8edb2-bab9-47d2-89f8-0ca2dcfbb9fd': {
          entity: {
            name: 'Test12344asdfasdfasdf',
            production: false,
            space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_guid: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: 'aab389c8-b0f9-4164-85a4-cd6925df5084',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
            space: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_url: '/v2/stacks/97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            stack: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            routes_url: '/v2/apps/03b8edb2-bab9-47d2-89f8-0ca2dcfbb9fd/routes',
            routes: [],
            events_url: '/v2/apps/03b8edb2-bab9-47d2-89f8-0ca2dcfbb9fd/events',
            service_bindings_url: '/v2/apps/03b8edb2-bab9-47d2-89f8-0ca2dcfbb9fd/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/03b8edb2-bab9-47d2-89f8-0ca2dcfbb9fd/route_mappings',
            guid: '03b8edb2-bab9-47d2-89f8-0ca2dcfbb9fd',
            cfGuid: '663a363e-1faf-4359-ac96-b8c24ec1a4ab'
          },
          metadata: {
            guid: '03b8edb2-bab9-47d2-89f8-0ca2dcfbb9fd',
            url: '/v2/apps/03b8edb2-bab9-47d2-89f8-0ca2dcfbb9fd',
            created_at: '2017-09-29T15:45:23Z',
            updated_at: '2017-09-29T15:45:23Z'
          }
        },
        '44ad1092-3247-4bf1-857e-644961506f7d': {
          entity: {
            name: 'Test123456adfasdfsadf',
            production: false,
            space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_guid: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: 'ea16f753-4429-46a9-8fd6-a91f12964c02',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
            space: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_url: '/v2/stacks/97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            stack: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            routes_url: '/v2/apps/44ad1092-3247-4bf1-857e-644961506f7d/routes',
            routes: [],
            events_url: '/v2/apps/44ad1092-3247-4bf1-857e-644961506f7d/events',
            service_bindings_url: '/v2/apps/44ad1092-3247-4bf1-857e-644961506f7d/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/44ad1092-3247-4bf1-857e-644961506f7d/route_mappings',
            guid: '44ad1092-3247-4bf1-857e-644961506f7d',
            cfGuid: '663a363e-1faf-4359-ac96-b8c24ec1a4ab'
          },
          metadata: {
            guid: '44ad1092-3247-4bf1-857e-644961506f7d',
            url: '/v2/apps/44ad1092-3247-4bf1-857e-644961506f7d',
            created_at: '2017-09-29T15:48:43Z',
            updated_at: '2017-09-29T15:48:43Z'
          }
        },
        'a9363ef2-78dc-43bf-9d15-c0c7a08a4f69': {
          entity: {
            name: '12factor',
            production: false,
            space_guid: 'aa775168-7be8-4006-81e5-647d59f8ee22',
            stack_guid: '18813ebb-8907-4c3b-8ba7-26a1632e16e9',
            buildpack: 'ruby_buildpack',
            detected_buildpack: '',
            detected_buildpack_guid: 'a1c434e4-0674-4b9a-a5e1-469553e8c702',
            environment_json: {},
            memory: 64,
            instances: 1,
            disk_quota: 512,
            state: 'STARTED',
            version: '08204dba-a50e-4280-b62d-ecc0eef76eba',
            command: null,
            console: false,
            debug: null,
            staging_task_id: 'b1c06621-12eb-40f7-a50b-6d609c7f92d4',
            package_state: 'STAGED',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: '2017-09-30T10:37:40Z',
            detected_start_command: 'bundle exec ruby web.rb -p $PORT',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/aa775168-7be8-4006-81e5-647d59f8ee22',
            space: 'aa775168-7be8-4006-81e5-647d59f8ee22',
            stack_url: '/v2/stacks/18813ebb-8907-4c3b-8ba7-26a1632e16e9',
            stack: '18813ebb-8907-4c3b-8ba7-26a1632e16e9',
            routes_url: '/v2/apps/a9363ef2-78dc-43bf-9d15-c0c7a08a4f69/routes',
            routes: [
              {
                metadata: {
                  guid: '6613b2d5-e4e0-4f75-93b0-5e715c4f42f7',
                  url: '/v2/routes/6613b2d5-e4e0-4f75-93b0-5e715c4f42f7',
                  created_at: '2017-09-30T10:37:34Z',
                  updated_at: '2017-09-30T10:37:34Z'
                },
                entity: {
                  host: '12factor',
                  path: '',
                  domain_guid: '44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  space_guid: 'aa775168-7be8-4006-81e5-647d59f8ee22',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  domain: {
                    metadata: {
                      guid: '44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                      url: '/v2/shared_domains/44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                      created_at: '2017-09-22T15:25:53Z',
                      updated_at: '2017-09-22T15:25:53Z'
                    },
                    entity: {
                      name: 'capbristol.com',
                      router_group_guid: null,
                      router_group_type: null
                    }
                  },
                  space_url: '/v2/spaces/aa775168-7be8-4006-81e5-647d59f8ee22',
                  space: {
                    metadata: {
                      guid: 'aa775168-7be8-4006-81e5-647d59f8ee22',
                      url: '/v2/spaces/aa775168-7be8-4006-81e5-647d59f8ee22',
                      created_at: '2017-09-22T15:28:41Z',
                      updated_at: '2017-09-22T15:28:41Z'
                    },
                    entity: {
                      name: 'dev',
                      organization_guid: '742d83a1-f8d4-4b1a-96d7-010e9074c2ca',
                      space_quota_definition_guid: null,
                      isolation_segment_guid: null,
                      allow_ssh: true,
                      organization_url: '/v2/organizations/742d83a1-f8d4-4b1a-96d7-010e9074c2ca',
                      developers_url: '/v2/spaces/aa775168-7be8-4006-81e5-647d59f8ee22/developers',
                      managers_url: '/v2/spaces/aa775168-7be8-4006-81e5-647d59f8ee22/managers',
                      auditors_url: '/v2/spaces/aa775168-7be8-4006-81e5-647d59f8ee22/auditors',
                      apps_url: '/v2/spaces/aa775168-7be8-4006-81e5-647d59f8ee22/apps',
                      routes_url: '/v2/spaces/aa775168-7be8-4006-81e5-647d59f8ee22/routes',
                      domains_url: '/v2/spaces/aa775168-7be8-4006-81e5-647d59f8ee22/domains',
                      service_instances_url: '/v2/spaces/aa775168-7be8-4006-81e5-647d59f8ee22/service_instances',
                      app_events_url: '/v2/spaces/aa775168-7be8-4006-81e5-647d59f8ee22/app_events',
                      events_url: '/v2/spaces/aa775168-7be8-4006-81e5-647d59f8ee22/events',
                      security_groups_url: '/v2/spaces/aa775168-7be8-4006-81e5-647d59f8ee22/security_groups',
                      staging_security_groups_url: '/v2/spaces/aa775168-7be8-4006-81e5-647d59f8ee22/staging_security_groups'
                    }
                  },
                  apps_url: '/v2/routes/6613b2d5-e4e0-4f75-93b0-5e715c4f42f7/apps',
                  route_mappings_url: '/v2/routes/6613b2d5-e4e0-4f75-93b0-5e715c4f42f7/route_mappings'
                }
              }
            ],
            events_url: '/v2/apps/a9363ef2-78dc-43bf-9d15-c0c7a08a4f69/events',
            service_bindings_url: '/v2/apps/a9363ef2-78dc-43bf-9d15-c0c7a08a4f69/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/a9363ef2-78dc-43bf-9d15-c0c7a08a4f69/route_mappings',
            guid: 'a9363ef2-78dc-43bf-9d15-c0c7a08a4f69',
            cfGuid: '663a363e-1faf-4359-ac96-b8c24ec1a4ab'
          },
          metadata: {
            guid: 'a9363ef2-78dc-43bf-9d15-c0c7a08a4f69',
            url: '/v2/apps/a9363ef2-78dc-43bf-9d15-c0c7a08a4f69',
            created_at: '2017-09-30T10:37:30Z',
            updated_at: '2017-10-01T21:34:35Z'
          }
        },
        'cfdd8369-e88e-4648-a7dd-69b9b09dddcf': {
          entity: {
            name: 'Test123452345678',
            production: false,
            space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_guid: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: 'ed8835aa-caa7-430e-9636-a9b9426d58f4',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
            space: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_url: '/v2/stacks/97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            stack: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            routes_url: '/v2/apps/cfdd8369-e88e-4648-a7dd-69b9b09dddcf/routes',
            routes: [],
            events_url: '/v2/apps/cfdd8369-e88e-4648-a7dd-69b9b09dddcf/events',
            service_bindings_url: '/v2/apps/cfdd8369-e88e-4648-a7dd-69b9b09dddcf/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/cfdd8369-e88e-4648-a7dd-69b9b09dddcf/route_mappings',
            guid: 'cfdd8369-e88e-4648-a7dd-69b9b09dddcf',
            cfGuid: '663a363e-1faf-4359-ac96-b8c24ec1a4ab'
          },
          metadata: {
            guid: 'cfdd8369-e88e-4648-a7dd-69b9b09dddcf',
            url: '/v2/apps/cfdd8369-e88e-4648-a7dd-69b9b09dddcf',
            created_at: '2017-10-02T09:16:44Z',
            updated_at: '2017-10-02T09:16:44Z'
          }
        },
        '2b5eb25a-e4bd-4316-a5c7-47adcba9f3f0': {
          entity: {
            name: 'TestNathan123',
            production: false,
            space_guid: 'd91c3bf0-3ab0-4372-8b08-75de137eeaf8',
            stack_guid: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: 'af763ca7-0d73-4918-bdb0-d9451e0deb9e',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/d91c3bf0-3ab0-4372-8b08-75de137eeaf8',
            space: 'd91c3bf0-3ab0-4372-8b08-75de137eeaf8',
            stack_url: '/v2/stacks/97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            stack: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            routes_url: '/v2/apps/2b5eb25a-e4bd-4316-a5c7-47adcba9f3f0/routes',
            routes: [
              {
                metadata: {
                  guid: '11f5c52e-5aa4-4afb-9dd3-cc5e10de5d7a',
                  url: '/v2/routes/11f5c52e-5aa4-4afb-9dd3-cc5e10de5d7a',
                  created_at: '2017-10-02T09:47:46Z',
                  updated_at: '2017-10-02T09:47:46Z'
                },
                entity: {
                  host: 'TestNathan123',
                  path: '',
                  domain_guid: '44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  space_guid: 'd91c3bf0-3ab0-4372-8b08-75de137eeaf8',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  domain: {
                    metadata: {
                      guid: '44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                      url: '/v2/shared_domains/44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                      created_at: '2017-09-22T15:25:53Z',
                      updated_at: '2017-09-22T15:25:53Z'
                    },
                    entity: {
                      name: 'capbristol.com',
                      router_group_guid: null,
                      router_group_type: null
                    }
                  },
                  space_url: '/v2/spaces/d91c3bf0-3ab0-4372-8b08-75de137eeaf8',
                  space: {
                    metadata: {
                      guid: 'd91c3bf0-3ab0-4372-8b08-75de137eeaf8',
                      url: '/v2/spaces/d91c3bf0-3ab0-4372-8b08-75de137eeaf8',
                      created_at: '2017-09-22T15:38:44Z',
                      updated_at: '2017-09-22T15:38:44Z'
                    },
                    entity: {
                      name: 'susecon',
                      organization_guid: '94ce3787-757b-4eac-91c6-8f1705a178ba',
                      space_quota_definition_guid: null,
                      isolation_segment_guid: null,
                      allow_ssh: true,
                      organization_url: '/v2/organizations/94ce3787-757b-4eac-91c6-8f1705a178ba',
                      developers_url: '/v2/spaces/d91c3bf0-3ab0-4372-8b08-75de137eeaf8/developers',
                      managers_url: '/v2/spaces/d91c3bf0-3ab0-4372-8b08-75de137eeaf8/managers',
                      auditors_url: '/v2/spaces/d91c3bf0-3ab0-4372-8b08-75de137eeaf8/auditors',
                      apps_url: '/v2/spaces/d91c3bf0-3ab0-4372-8b08-75de137eeaf8/apps',
                      routes_url: '/v2/spaces/d91c3bf0-3ab0-4372-8b08-75de137eeaf8/routes',
                      domains_url: '/v2/spaces/d91c3bf0-3ab0-4372-8b08-75de137eeaf8/domains',
                      service_instances_url: '/v2/spaces/d91c3bf0-3ab0-4372-8b08-75de137eeaf8/service_instances',
                      app_events_url: '/v2/spaces/d91c3bf0-3ab0-4372-8b08-75de137eeaf8/app_events',
                      events_url: '/v2/spaces/d91c3bf0-3ab0-4372-8b08-75de137eeaf8/events',
                      security_groups_url: '/v2/spaces/d91c3bf0-3ab0-4372-8b08-75de137eeaf8/security_groups',
                      staging_security_groups_url: '/v2/spaces/d91c3bf0-3ab0-4372-8b08-75de137eeaf8/staging_security_groups'
                    }
                  },
                  apps_url: '/v2/routes/11f5c52e-5aa4-4afb-9dd3-cc5e10de5d7a/apps',
                  route_mappings_url: '/v2/routes/11f5c52e-5aa4-4afb-9dd3-cc5e10de5d7a/route_mappings'
                }
              }
            ],
            events_url: '/v2/apps/2b5eb25a-e4bd-4316-a5c7-47adcba9f3f0/events',
            service_bindings_url: '/v2/apps/2b5eb25a-e4bd-4316-a5c7-47adcba9f3f0/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/2b5eb25a-e4bd-4316-a5c7-47adcba9f3f0/route_mappings',
            guid: '2b5eb25a-e4bd-4316-a5c7-47adcba9f3f0',
            cfGuid: '663a363e-1faf-4359-ac96-b8c24ec1a4ab'
          },
          metadata: {
            guid: '2b5eb25a-e4bd-4316-a5c7-47adcba9f3f0',
            url: '/v2/apps/2b5eb25a-e4bd-4316-a5c7-47adcba9f3f0',
            created_at: '2017-10-02T09:47:45Z',
            updated_at: '2017-10-02T09:47:46Z'
          }
        },
        '885f1a87-e465-4826-abdc-fd8beb6564da': {
          entity: {
            name: 'Test123456f',
            production: false,
            space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_guid: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: '40debae2-fb21-4a8f-97ef-e54d2f9b6ab1',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
            space: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_url: '/v2/stacks/97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            stack: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            routes_url: '/v2/apps/885f1a87-e465-4826-abdc-fd8beb6564da/routes',
            routes: [],
            events_url: '/v2/apps/885f1a87-e465-4826-abdc-fd8beb6564da/events',
            service_bindings_url: '/v2/apps/885f1a87-e465-4826-abdc-fd8beb6564da/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/885f1a87-e465-4826-abdc-fd8beb6564da/route_mappings',
            guid: '885f1a87-e465-4826-abdc-fd8beb6564da',
            cfGuid: '663a363e-1faf-4359-ac96-b8c24ec1a4ab'
          },
          metadata: {
            guid: '885f1a87-e465-4826-abdc-fd8beb6564da',
            url: '/v2/apps/885f1a87-e465-4826-abdc-fd8beb6564da',
            created_at: '2017-10-03T08:26:20Z',
            updated_at: '2017-10-03T08:26:20Z'
          }
        },
        '994591c8-4f2a-4775-ad23-79ed3g3b99f62': {
          entity: {
            name: 'Test1234sefsdf',
            production: false,
            space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_guid: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: 'd410bfc0-90f8-41f8-b106-bf30c35d4753',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            events_url: '/v2/apps/885f1a87-e465-4826-abdc-fd8beb6564da/events',
            service_bindings_url: '/v2/apps/885f1a87-e465-4826-abdc-fd8beb6564da/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/885f1a87-e465-4826-abdc-fd8beb6564da/route_mappings',
            guid: '885f1a87-e465-4826-abdc-fd8beb6564da',
            cfGuid: '663a363e-1faf-4359-ac96-b8c24ec1a4ab'
          },
          metadata: {
            guid: '885f1a87-e465-4826-abdc-fd8beb6564da',
            url: '/v2/apps/885f1a87-e465-4826-abdc-fd8beb6564da',
            created_at: '2017-10-03T08:26:20Z',
            updated_at: '2017-10-03T08:26:20Z'
          }
        },
        '994591c8-4f2a-4775-ad23-79ed33b99f62': {
          entity: {
            name: 'Test1234sefsdf',
            production: false,
            space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_guid: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: 'd410bfc0-90f8-41f8-b106-bf30c35d4753',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
            space: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_url: '/v2/stacks/97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            stack: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            routes_url: '/v2/apps/994591c8-4f2a-4775-ad23-79ed33b99f62/routes',
            routes: [],
            events_url: '/v2/apps/994591c8-4f2a-4775-ad23-79ed33b99f62/events',
            service_bindings_url: '/v2/apps/994591c8-4f2a-4775-ad23-79ed33b99f62/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/994591c8-4f2a-4775-ad23-79ed33b99f62/route_mappings',
            guid: '994591c8-4f2a-4775-ad23-79ed33b99f62',
            cfGuid: '663a363e-1faf-4359-ac96-b8c24ec1a4ab'
          },
          metadata: {
            guid: '994591c8-4f2a-4775-ad23-79ed33b99f62',
            url: '/v2/apps/994591c8-4f2a-4775-ad23-79ed33b99f62',
            created_at: '2017-10-03T10:48:57Z',
            updated_at: '2017-10-03T10:48:57Z'
          }
        },
        '8a02a394-e899-4eab-97d1-dee092fbdb57': {
          entity: {
            name: 'Test1234asdsad',
            production: false,
            space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_guid: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: 'f7291018-7392-4ca8-8f69-46032cd0375b',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
            space: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_url: '/v2/stacks/97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            stack: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            routes_url: '/v2/apps/8a02a394-e899-4eab-97d1-dee092fbdb57/routes',
            routes: [],
            events_url: '/v2/apps/8a02a394-e899-4eab-97d1-dee092fbdb57/events',
            service_bindings_url: '/v2/apps/8a02a394-e899-4eab-97d1-dee092fbdb57/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/8a02a394-e899-4eab-97d1-dee092fbdb57/route_mappings',
            guid: '8a02a394-e899-4eab-97d1-dee092fbdb57',
            cfGuid: '663a363e-1faf-4359-ac96-b8c24ec1a4ab'
          },
          metadata: {
            guid: '8a02a394-e899-4eab-97d1-dee092fbdb57',
            url: '/v2/apps/8a02a394-e899-4eab-97d1-dee092fbdb57',
            created_at: '2017-10-04T08:39:09Z',
            updated_at: '2017-10-04T08:39:09Z'
          }
        },
        '85c42418-81c2-4ef5-bb4d-b1991f8f4f95': {
          entity: {
            name: 'Test1234asdsadsdadhdsfdfhfgdrhkjlgarhkljgshkkjn',
            production: false,
            space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_guid: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: 'd524f05a-2166-4de2-9bba-af25abc45013',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
            space: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_url: '/v2/stacks/97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            stack: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            routes_url: '/v2/apps/85c42418-81c2-4ef5-bb4d-b1991f8f4f95/routes',
            routes: [],
            events_url: '/v2/apps/85c42418-81c2-4ef5-bb4d-b1991f8f4f95/events',
            service_bindings_url: '/v2/apps/85c42418-81c2-4ef5-bb4d-b1991f8f4f95/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/85c42418-81c2-4ef5-bb4d-b1991f8f4f95/route_mappings',
            guid: '85c42418-81c2-4ef5-bb4d-b1991f8f4f95',
            cfGuid: '663a363e-1faf-4359-ac96-b8c24ec1a4ab'
          },
          metadata: {
            guid: '85c42418-81c2-4ef5-bb4d-b1991f8f4f95',
            url: '/v2/apps/85c42418-81c2-4ef5-bb4d-b1991f8f4f95',
            created_at: '2017-10-04T09:51:40Z',
            updated_at: '2017-10-04T09:51:40Z'
          }
        },
        '687f2c3b-c10c-4aee-bf70-b5525fd585b8': {
          entity: {
            name: 'Test1234asdsadhjkkl',
            production: false,
            space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_guid: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: 'f95c221f-65fa-4484-9c31-cb53a247b130',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
            space: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_url: '/v2/stacks/97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            stack: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            routes_url: '/v2/apps/687f2c3b-c10c-4aee-bf70-b5525fd585b8/routes',
            routes: [],
            events_url: '/v2/apps/687f2c3b-c10c-4aee-bf70-b5525fd585b8/events',
            service_bindings_url: '/v2/apps/687f2c3b-c10c-4aee-bf70-b5525fd585b8/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/687f2c3b-c10c-4aee-bf70-b5525fd585b8/route_mappings',
            guid: '687f2c3b-c10c-4aee-bf70-b5525fd585b8',
            cfGuid: '663a363e-1faf-4359-ac96-b8c24ec1a4ab'
          },
          metadata: {
            guid: '687f2c3b-c10c-4aee-bf70-b5525fd585b8',
            url: '/v2/apps/687f2c3b-c10c-4aee-bf70-b5525fd585b8',
            created_at: '2017-10-04T10:26:10Z',
            updated_at: '2017-10-04T10:26:10Z'
          }
        },
        'a63178d7-d123-4059-9976-74b7234318e6': {
          entity: {
            name: 'Test1234asdsadgfhfg',
            production: false,
            space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_guid: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: '8fdb1095-b569-4ad1-8674-58022eed0160',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
            space: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_url: '/v2/stacks/97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            stack: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            routes_url: '/v2/apps/a63178d7-d123-4059-9976-74b7234318e6/routes',
            routes: [],
            events_url: '/v2/apps/a63178d7-d123-4059-9976-74b7234318e6/events',
            service_bindings_url: '/v2/apps/a63178d7-d123-4059-9976-74b7234318e6/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/a63178d7-d123-4059-9976-74b7234318e6/route_mappings',
            guid: 'a63178d7-d123-4059-9976-74b7234318e6',
            cfGuid: '663a363e-1faf-4359-ac96-b8c24ec1a4ab'
          },
          metadata: {
            guid: 'a63178d7-d123-4059-9976-74b7234318e6',
            url: '/v2/apps/a63178d7-d123-4059-9976-74b7234318e6',
            created_at: '2017-10-04T16:01:09Z',
            updated_at: '2017-10-04T16:01:09Z'
          }
        },
        'fa48e6b4-9091-40bb-9e53-2159f1cc9782': {
          entity: {
            name: 'Test1234asdsaddfghjkl/',
            production: false,
            space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_guid: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: 'd6fb24b6-ef93-45a2-9cad-427e56e9e319',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
            space: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_url: '/v2/stacks/97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            stack: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            routes_url: '/v2/apps/fa48e6b4-9091-40bb-9e53-2159f1cc9782/routes',
            routes: [],
            events_url: '/v2/apps/fa48e6b4-9091-40bb-9e53-2159f1cc9782/events',
            service_bindings_url: '/v2/apps/fa48e6b4-9091-40bb-9e53-2159f1cc9782/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/fa48e6b4-9091-40bb-9e53-2159f1cc9782/route_mappings',
            guid: 'fa48e6b4-9091-40bb-9e53-2159f1cc9782',
            cfGuid: '663a363e-1faf-4359-ac96-b8c24ec1a4ab'
          },
          metadata: {
            guid: 'fa48e6b4-9091-40bb-9e53-2159f1cc9782',
            url: '/v2/apps/fa48e6b4-9091-40bb-9e53-2159f1cc9782',
            created_at: '2017-10-04T16:03:48Z',
            updated_at: '2017-10-04T16:03:48Z'
          }
        },
        '365a890d-1e13-40eb-937f-d2f2ab9403eb': {
          entity: {
            name: 'Test1234asdsadkjhygtr',
            production: false,
            space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_guid: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: 'a7763198-c566-4b4d-ae2c-f113ef3ed7cc',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
            space: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_url: '/v2/stacks/97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            stack: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            routes_url: '/v2/apps/365a890d-1e13-40eb-937f-d2f2ab9403eb/routes',
            routes: [
              {
                metadata: {
                  guid: 'e7eef63c-1e06-492c-a48a-898f2ed5d8ea',
                  url: '/v2/routes/e7eef63c-1e06-492c-a48a-898f2ed5d8ea',
                  created_at: '2017-10-04T16:07:31Z',
                  updated_at: '2017-10-04T16:07:31Z'
                },
                entity: {
                  host: 'test1234asdsadkjhygtr',
                  path: '',
                  domain_guid: '44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  domain: {
                    metadata: {
                      guid: '44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                      url: '/v2/shared_domains/44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                      created_at: '2017-09-22T15:25:53Z',
                      updated_at: '2017-09-22T15:25:53Z'
                    },
                    entity: {
                      name: 'capbristol.com',
                      router_group_guid: null,
                      router_group_type: null
                    }
                  },
                  space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
                  space: {
                    metadata: {
                      guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
                      url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
                      created_at: '2017-09-22T15:27:48Z',
                      updated_at: '2017-09-22T15:27:48Z'
                    },
                    entity: {
                      name: 'e2e',
                      organization_guid: '22feecef-df39-4ae0-a56a-098cbe09ec0d',
                      space_quota_definition_guid: null,
                      isolation_segment_guid: null,
                      allow_ssh: true,
                      organization_url: '/v2/organizations/22feecef-df39-4ae0-a56a-098cbe09ec0d',
                      developers_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/developers',
                      managers_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/managers',
                      auditors_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/auditors',
                      apps_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/apps',
                      routes_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/routes',
                      domains_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/domains',
                      service_instances_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/service_instances',
                      app_events_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/app_events',
                      events_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/events',
                      security_groups_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/security_groups',
                      staging_security_groups_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/staging_security_groups'
                    }
                  },
                  apps_url: '/v2/routes/e7eef63c-1e06-492c-a48a-898f2ed5d8ea/apps',
                  route_mappings_url: '/v2/routes/e7eef63c-1e06-492c-a48a-898f2ed5d8ea/route_mappings'
                }
              }
            ],
            events_url: '/v2/apps/365a890d-1e13-40eb-937f-d2f2ab9403eb/events',
            service_bindings_url: '/v2/apps/365a890d-1e13-40eb-937f-d2f2ab9403eb/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/365a890d-1e13-40eb-937f-d2f2ab9403eb/route_mappings',
            guid: '365a890d-1e13-40eb-937f-d2f2ab9403eb',
            cfGuid: '663a363e-1faf-4359-ac96-b8c24ec1a4ab'
          },
          metadata: {
            guid: '365a890d-1e13-40eb-937f-d2f2ab9403eb',
            url: '/v2/apps/365a890d-1e13-40eb-937f-d2f2ab9403eb',
            created_at: '2017-10-04T16:07:30Z',
            updated_at: '2017-10-04T16:07:32Z'
          }
        },
        '09543d4e-73ed-4e59-b3b5-727b841a5684': {
          entity: {
            name: 'Test1234asdsadasdasdsfa',
            production: false,
            space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_guid: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: 'caa8ca9b-9c1e-4c46-8021-dfb74322f2f7',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
            space: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_url: '/v2/stacks/97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            stack: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            routes_url: '/v2/apps/09543d4e-73ed-4e59-b3b5-727b841a5684/routes',
            routes: [],
            events_url: '/v2/apps/09543d4e-73ed-4e59-b3b5-727b841a5684/events',
            service_bindings_url: '/v2/apps/09543d4e-73ed-4e59-b3b5-727b841a5684/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/09543d4e-73ed-4e59-b3b5-727b841a5684/route_mappings',
            guid: '09543d4e-73ed-4e59-b3b5-727b841a5684',
            cfGuid: '663a363e-1faf-4359-ac96-b8c24ec1a4ab'
          },
          metadata: {
            guid: '09543d4e-73ed-4e59-b3b5-727b841a5684',
            url: '/v2/apps/09543d4e-73ed-4e59-b3b5-727b841a5684',
            created_at: '2017-10-05T08:45:56Z',
            updated_at: '2017-10-05T08:45:56Z'
          }
        },
        'c318322d-8187-41a8-a1fd-bdae1ed1d24c': {
          entity: {
            name: 'Test1234asdsadsdfghjk',
            production: false,
            space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_guid: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: '759d0bdb-b9d7-44ef-b5d7-76cbb9acad0b',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
            space: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_url: '/v2/stacks/97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            stack: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            routes_url: '/v2/apps/c318322d-8187-41a8-a1fd-bdae1ed1d24c/routes',
            routes: [],
            events_url: '/v2/apps/c318322d-8187-41a8-a1fd-bdae1ed1d24c/events',
            service_bindings_url: '/v2/apps/c318322d-8187-41a8-a1fd-bdae1ed1d24c/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/c318322d-8187-41a8-a1fd-bdae1ed1d24c/route_mappings',
            guid: 'c318322d-8187-41a8-a1fd-bdae1ed1d24c',
            cfGuid: '663a363e-1faf-4359-ac96-b8c24ec1a4ab'
          },
          metadata: {
            guid: 'c318322d-8187-41a8-a1fd-bdae1ed1d24c',
            url: '/v2/apps/c318322d-8187-41a8-a1fd-bdae1ed1d24c',
            created_at: '2017-10-05T08:51:56Z',
            updated_at: '2017-10-05T08:51:56Z'
          }
        },
        '15c480aa-8215-4bc3-959a-0814967c091e': {
          entity: {
            name: 'Test12345dssfaf',
            production: false,
            space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_guid: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: '7a5e4c32-51ae-4d01-a407-fba6b9fb9f3e',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
            space: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_url: '/v2/stacks/97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            stack: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            routes_url: '/v2/apps/15c480aa-8215-4bc3-959a-0814967c091e/routes',
            routes: [],
            events_url: '/v2/apps/15c480aa-8215-4bc3-959a-0814967c091e/events',
            service_bindings_url: '/v2/apps/15c480aa-8215-4bc3-959a-0814967c091e/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/15c480aa-8215-4bc3-959a-0814967c091e/route_mappings',
            guid: '15c480aa-8215-4bc3-959a-0814967c091e',
            cfGuid: '663a363e-1faf-4359-ac96-b8c24ec1a4ab'
          },
          metadata: {
            guid: '15c480aa-8215-4bc3-959a-0814967c091e',
            url: '/v2/apps/15c480aa-8215-4bc3-959a-0814967c091e',
            created_at: '2017-10-05T08:58:21Z',
            updated_at: '2017-10-05T08:58:21Z'
          }
        },
        'ab9c9db3-cb7d-4248-b53b-9d185b0555f6': {
          entity: {
            name: 'Test1234sgsdgdg',
            production: false,
            space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_guid: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: 'bae78589-c425-4d6c-8005-fd4b69ab0f9d',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
            space: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_url: '/v2/stacks/97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            stack: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            routes_url: '/v2/apps/ab9c9db3-cb7d-4248-b53b-9d185b0555f6/routes',
            routes: [],
            events_url: '/v2/apps/ab9c9db3-cb7d-4248-b53b-9d185b0555f6/events',
            service_bindings_url: '/v2/apps/ab9c9db3-cb7d-4248-b53b-9d185b0555f6/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/ab9c9db3-cb7d-4248-b53b-9d185b0555f6/route_mappings',
            guid: 'ab9c9db3-cb7d-4248-b53b-9d185b0555f6',
            cfGuid: '663a363e-1faf-4359-ac96-b8c24ec1a4ab'
          },
          metadata: {
            guid: 'ab9c9db3-cb7d-4248-b53b-9d185b0555f6',
            url: '/v2/apps/ab9c9db3-cb7d-4248-b53b-9d185b0555f6',
            created_at: '2017-10-05T09:00:01Z',
            updated_at: '2017-10-05T09:00:01Z'
          }
        },
        '4716e251-5af8-4144-a179-1871c7217dc0': {
          entity: {
            name: 'Test1234asdfasdfasf',
            production: false,
            space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_guid: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: 'b0ca4d5d-5950-4654-894c-39e3bf4a765d',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
            space: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_url: '/v2/stacks/97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            stack: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            routes_url: '/v2/apps/4716e251-5af8-4144-a179-1871c7217dc0/routes',
            routes: [],
            events_url: '/v2/apps/4716e251-5af8-4144-a179-1871c7217dc0/events',
            service_bindings_url: '/v2/apps/4716e251-5af8-4144-a179-1871c7217dc0/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/4716e251-5af8-4144-a179-1871c7217dc0/route_mappings',
            guid: '4716e251-5af8-4144-a179-1871c7217dc0',
            cfGuid: '663a363e-1faf-4359-ac96-b8c24ec1a4ab'
          },
          metadata: {
            guid: '4716e251-5af8-4144-a179-1871c7217dc0',
            url: '/v2/apps/4716e251-5af8-4144-a179-1871c7217dc0',
            created_at: '2017-10-05T09:02:11Z',
            updated_at: '2017-10-05T09:02:11Z'
          }
        },
        '6ce08a19-f87b-497c-bc93-3b5616ae40c2': {
          entity: {
            name: 'Test1234asdsadasdfasdf',
            production: false,
            space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_guid: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: 'd26f5076-a8bf-4de6-9e19-05b2caea62df',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
            space: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_url: '/v2/stacks/97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            stack: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            routes_url: '/v2/apps/6ce08a19-f87b-497c-bc93-3b5616ae40c2/routes',
            routes: [],
            events_url: '/v2/apps/6ce08a19-f87b-497c-bc93-3b5616ae40c2/events',
            service_bindings_url: '/v2/apps/6ce08a19-f87b-497c-bc93-3b5616ae40c2/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/6ce08a19-f87b-497c-bc93-3b5616ae40c2/route_mappings',
            guid: '6ce08a19-f87b-497c-bc93-3b5616ae40c2',
            cfGuid: '663a363e-1faf-4359-ac96-b8c24ec1a4ab'
          },
          metadata: {
            guid: '6ce08a19-f87b-497c-bc93-3b5616ae40c2',
            url: '/v2/apps/6ce08a19-f87b-497c-bc93-3b5616ae40c2',
            created_at: '2017-10-05T09:03:16Z',
            updated_at: '2017-10-05T09:03:16Z'
          }
        },
        'ee165a5e-0f37-43c1-9744-4027b5144c3a': {
          entity: {
            name: 'Test12345esdfvfdgdsgdfs',
            production: false,
            space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_guid: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: '46e41092-17df-4aae-bee9-1276b3e47bcc',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
            space: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_url: '/v2/stacks/97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            stack: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            routes_url: '/v2/apps/ee165a5e-0f37-43c1-9744-4027b5144c3a/routes',
            routes: [],
            events_url: '/v2/apps/ee165a5e-0f37-43c1-9744-4027b5144c3a/events',
            service_bindings_url: '/v2/apps/ee165a5e-0f37-43c1-9744-4027b5144c3a/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/ee165a5e-0f37-43c1-9744-4027b5144c3a/route_mappings',
            guid: 'ee165a5e-0f37-43c1-9744-4027b5144c3a',
            cfGuid: '663a363e-1faf-4359-ac96-b8c24ec1a4ab'
          },
          metadata: {
            guid: 'ee165a5e-0f37-43c1-9744-4027b5144c3a',
            url: '/v2/apps/ee165a5e-0f37-43c1-9744-4027b5144c3a',
            created_at: '2017-10-05T09:04:46Z',
            updated_at: '2017-10-05T09:04:46Z'
          }
        },
        '38081245-299e-42d3-847b-b08444da4553': {
          entity: {
            name: 'Test1234asdsaddsfse',
            production: false,
            space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_guid: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: '9091cead-e8cb-41ef-8462-8a9c5e5c4004',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
            space: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_url: '/v2/stacks/97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            stack: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            routes_url: '/v2/apps/38081245-299e-42d3-847b-b08444da4553/routes',
            routes: [
              {
                metadata: {
                  guid: 'f15ac961-d71c-4778-8e71-d56bab3c27b2',
                  url: '/v2/routes/f15ac961-d71c-4778-8e71-d56bab3c27b2',
                  created_at: '2017-10-05T09:06:49Z',
                  updated_at: '2017-10-05T09:06:49Z'
                },
                entity: {
                  host: 'test1234asdsaddsfse',
                  path: '',
                  domain_guid: '44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  domain: {
                    metadata: {
                      guid: '44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                      url: '/v2/shared_domains/44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                      created_at: '2017-09-22T15:25:53Z',
                      updated_at: '2017-09-22T15:25:53Z'
                    },
                    entity: {
                      name: 'capbristol.com',
                      router_group_guid: null,
                      router_group_type: null
                    }
                  },
                  space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
                  space: {
                    metadata: {
                      guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
                      url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
                      created_at: '2017-09-22T15:27:48Z',
                      updated_at: '2017-09-22T15:27:48Z'
                    },
                    entity: {
                      name: 'e2e',
                      organization_guid: '22feecef-df39-4ae0-a56a-098cbe09ec0d',
                      space_quota_definition_guid: null,
                      isolation_segment_guid: null,
                      allow_ssh: true,
                      organization_url: '/v2/organizations/22feecef-df39-4ae0-a56a-098cbe09ec0d',
                      developers_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/developers',
                      managers_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/managers',
                      auditors_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/auditors',
                      apps_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/apps',
                      routes_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/routes',
                      domains_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/domains',
                      service_instances_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/service_instances',
                      app_events_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/app_events',
                      events_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/events',
                      security_groups_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/security_groups',
                      staging_security_groups_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/staging_security_groups'
                    }
                  },
                  apps_url: '/v2/routes/f15ac961-d71c-4778-8e71-d56bab3c27b2/apps',
                  route_mappings_url: '/v2/routes/f15ac961-d71c-4778-8e71-d56bab3c27b2/route_mappings'
                }
              }
            ],
            events_url: '/v2/apps/38081245-299e-42d3-847b-b08444da4553/events',
            service_bindings_url: '/v2/apps/38081245-299e-42d3-847b-b08444da4553/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/38081245-299e-42d3-847b-b08444da4553/route_mappings',
            guid: '38081245-299e-42d3-847b-b08444da4553',
            cfGuid: '663a363e-1faf-4359-ac96-b8c24ec1a4ab'
          },
          metadata: {
            guid: '38081245-299e-42d3-847b-b08444da4553',
            url: '/v2/apps/38081245-299e-42d3-847b-b08444da4553',
            created_at: '2017-10-05T09:06:49Z',
            updated_at: '2017-10-05T09:06:50Z'
          }
        },
        'a5ff68cd-baa2-4fa4-a688-e7b840af5073': {
          entity: {
            name: 'Test1234asdasd',
            production: false,
            space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_guid: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: 'e4271fa4-59f1-465b-9657-a910c937e606',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
            space: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_url: '/v2/stacks/97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            stack: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            routes_url: '/v2/apps/a5ff68cd-baa2-4fa4-a688-e7b840af5073/routes',
            routes: [
              {
                metadata: {
                  guid: 'c2977237-67b0-4bff-9b8d-e738040d4518',
                  url: '/v2/routes/c2977237-67b0-4bff-9b8d-e738040d4518',
                  created_at: '2017-10-05T09:51:13Z',
                  updated_at: '2017-10-05T09:51:13Z'
                },
                entity: {
                  host: 'test1234asdasd',
                  path: '',
                  domain_guid: '44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  domain: {
                    metadata: {
                      guid: '44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                      url: '/v2/shared_domains/44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                      created_at: '2017-09-22T15:25:53Z',
                      updated_at: '2017-09-22T15:25:53Z'
                    },
                    entity: {
                      name: 'capbristol.com',
                      router_group_guid: null,
                      router_group_type: null
                    }
                  },
                  space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
                  space: {
                    metadata: {
                      guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
                      url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
                      created_at: '2017-09-22T15:27:48Z',
                      updated_at: '2017-09-22T15:27:48Z'
                    },
                    entity: {
                      name: 'e2e',
                      organization_guid: '22feecef-df39-4ae0-a56a-098cbe09ec0d',
                      space_quota_definition_guid: null,
                      isolation_segment_guid: null,
                      allow_ssh: true,
                      organization_url: '/v2/organizations/22feecef-df39-4ae0-a56a-098cbe09ec0d',
                      developers_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/developers',
                      managers_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/managers',
                      auditors_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/auditors',
                      apps_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/apps',
                      routes_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/routes',
                      domains_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/domains',
                      service_instances_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/service_instances',
                      app_events_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/app_events',
                      events_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/events',
                      security_groups_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/security_groups',
                      staging_security_groups_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/staging_security_groups'
                    }
                  },
                  apps_url: '/v2/routes/c2977237-67b0-4bff-9b8d-e738040d4518/apps',
                  route_mappings_url: '/v2/routes/c2977237-67b0-4bff-9b8d-e738040d4518/route_mappings'
                }
              }
            ],
            events_url: '/v2/apps/a5ff68cd-baa2-4fa4-a688-e7b840af5073/events',
            service_bindings_url: '/v2/apps/a5ff68cd-baa2-4fa4-a688-e7b840af5073/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/a5ff68cd-baa2-4fa4-a688-e7b840af5073/route_mappings',
            guid: 'a5ff68cd-baa2-4fa4-a688-e7b840af5073',
            cfGuid: '663a363e-1faf-4359-ac96-b8c24ec1a4ab'
          },
          metadata: {
            guid: 'a5ff68cd-baa2-4fa4-a688-e7b840af5073',
            url: '/v2/apps/a5ff68cd-baa2-4fa4-a688-e7b840af5073',
            created_at: '2017-10-05T09:51:13Z',
            updated_at: '2017-10-05T09:51:17Z'
          }
        },
        'db5ecb02-e05c-4742-9ad6-6f78b77d3dca': {
          entity: {
            name: 'one',
            production: false,
            space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_guid: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: '00c9d923-8a2f-4955-987a-d455fb9341b7',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
            space: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_url: '/v2/stacks/97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            stack: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            routes_url: '/v2/apps/db5ecb02-e05c-4742-9ad6-6f78b77d3dca/routes',
            routes: [
              {
                metadata: {
                  guid: '179b84ff-399d-4ee3-8f76-30739b865783',
                  url: '/v2/routes/179b84ff-399d-4ee3-8f76-30739b865783',
                  created_at: '2017-10-05T09:53:13Z',
                  updated_at: '2017-10-05T09:53:13Z'
                },
                entity: {
                  host: 'one',
                  path: '',
                  domain_guid: '44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  domain: {
                    metadata: {
                      guid: '44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                      url: '/v2/shared_domains/44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                      created_at: '2017-09-22T15:25:53Z',
                      updated_at: '2017-09-22T15:25:53Z'
                    },
                    entity: {
                      name: 'capbristol.com',
                      router_group_guid: null,
                      router_group_type: null
                    }
                  },
                  space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
                  space: {
                    metadata: {
                      guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
                      url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
                      created_at: '2017-09-22T15:27:48Z',
                      updated_at: '2017-09-22T15:27:48Z'
                    },
                    entity: {
                      name: 'e2e',
                      organization_guid: '22feecef-df39-4ae0-a56a-098cbe09ec0d',
                      space_quota_definition_guid: null,
                      isolation_segment_guid: null,
                      allow_ssh: true,
                      organization_url: '/v2/organizations/22feecef-df39-4ae0-a56a-098cbe09ec0d',
                      developers_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/developers',
                      managers_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/managers',
                      auditors_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/auditors',
                      apps_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/apps',
                      routes_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/routes',
                      domains_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/domains',
                      service_instances_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/service_instances',
                      app_events_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/app_events',
                      events_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/events',
                      security_groups_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/security_groups',
                      staging_security_groups_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/staging_security_groups'
                    }
                  },
                  apps_url: '/v2/routes/179b84ff-399d-4ee3-8f76-30739b865783/apps',
                  route_mappings_url: '/v2/routes/179b84ff-399d-4ee3-8f76-30739b865783/route_mappings'
                }
              }
            ],
            events_url: '/v2/apps/db5ecb02-e05c-4742-9ad6-6f78b77d3dca/events',
            service_bindings_url: '/v2/apps/db5ecb02-e05c-4742-9ad6-6f78b77d3dca/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/db5ecb02-e05c-4742-9ad6-6f78b77d3dca/route_mappings',
            guid: 'db5ecb02-e05c-4742-9ad6-6f78b77d3dca',
            cfGuid: '663a363e-1faf-4359-ac96-b8c24ec1a4ab'
          },
          metadata: {
            guid: 'db5ecb02-e05c-4742-9ad6-6f78b77d3dca',
            url: '/v2/apps/db5ecb02-e05c-4742-9ad6-6f78b77d3dca',
            created_at: '2017-10-05T09:53:11Z',
            updated_at: '2017-10-05T09:54:15Z'
          }
        },
        '9111c1c9-04b9-4d71-b494-66a68bdeef52': {
          entity: {
            name: 'Test1234asdasdsdfghj',
            production: false,
            space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_guid: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: '5373d73c-c3ec-4ab4-9643-b7f9e1f3a0a8',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
            space: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_url: '/v2/stacks/97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            stack: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            routes_url: '/v2/apps/9111c1c9-04b9-4d71-b494-66a68bdeef52/routes',
            routes: [],
            events_url: '/v2/apps/9111c1c9-04b9-4d71-b494-66a68bdeef52/events',
            service_bindings_url: '/v2/apps/9111c1c9-04b9-4d71-b494-66a68bdeef52/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/9111c1c9-04b9-4d71-b494-66a68bdeef52/route_mappings',
            guid: '9111c1c9-04b9-4d71-b494-66a68bdeef52',
            cfGuid: '663a363e-1faf-4359-ac96-b8c24ec1a4ab'
          },
          metadata: {
            guid: '9111c1c9-04b9-4d71-b494-66a68bdeef52',
            url: '/v2/apps/9111c1c9-04b9-4d71-b494-66a68bdeef52',
            created_at: '2017-10-05T09:56:21Z',
            updated_at: '2017-10-05T09:56:21Z'
          }
        },
        'f88c311c-4cd8-4bd5-a044-72b3d449690e': {
          entity: {
            name: 'Test1234asdasddasf',
            production: false,
            space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_guid: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: '810d0d85-69e1-4975-a891-b7cecdfb18c3',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
            space: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_url: '/v2/stacks/97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            stack: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            routes_url: '/v2/apps/f88c311c-4cd8-4bd5-a044-72b3d449690e/routes',
            routes: [],
            events_url: '/v2/apps/f88c311c-4cd8-4bd5-a044-72b3d449690e/events',
            service_bindings_url: '/v2/apps/f88c311c-4cd8-4bd5-a044-72b3d449690e/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/f88c311c-4cd8-4bd5-a044-72b3d449690e/route_mappings',
            guid: 'f88c311c-4cd8-4bd5-a044-72b3d449690e',
            cfGuid: '663a363e-1faf-4359-ac96-b8c24ec1a4ab'
          },
          metadata: {
            guid: 'f88c311c-4cd8-4bd5-a044-72b3d449690e',
            url: '/v2/apps/f88c311c-4cd8-4bd5-a044-72b3d449690e',
            created_at: '2017-10-05T09:58:56Z',
            updated_at: '2017-10-05T09:58:56Z'
          }
        },
        '76ec34ca-61b8-4a75-8abc-4a800874a851': {
          entity: {
            name: 'szccsdfsfsf',
            production: false,
            space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_guid: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: '15b20737-19bd-4501-8920-e1c7154225cd',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
            space: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_url: '/v2/stacks/97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            stack: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            routes_url: '/v2/apps/76ec34ca-61b8-4a75-8abc-4a800874a851/routes',
            routes: [],
            events_url: '/v2/apps/76ec34ca-61b8-4a75-8abc-4a800874a851/events',
            service_bindings_url: '/v2/apps/76ec34ca-61b8-4a75-8abc-4a800874a851/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/76ec34ca-61b8-4a75-8abc-4a800874a851/route_mappings',
            guid: '76ec34ca-61b8-4a75-8abc-4a800874a851',
            cfGuid: '663a363e-1faf-4359-ac96-b8c24ec1a4ab'
          },
          metadata: {
            guid: '76ec34ca-61b8-4a75-8abc-4a800874a851',
            url: '/v2/apps/76ec34ca-61b8-4a75-8abc-4a800874a851',
            created_at: '2017-10-05T10:01:39Z',
            updated_at: '2017-10-05T10:01:39Z'
          }
        },
        'da42afa1-0bf6-4ad7-b644-40ac216efce5': {
          entity: {
            name: 'Test1234asdasdghjkl;/',
            production: false,
            space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_guid: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: '1c73d515-3900-4363-be61-7dd0f770076f',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
            space: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_url: '/v2/stacks/97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            stack: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            routes_url: '/v2/apps/da42afa1-0bf6-4ad7-b644-40ac216efce5/routes',
            routes: [],
            events_url: '/v2/apps/da42afa1-0bf6-4ad7-b644-40ac216efce5/events',
            service_bindings_url: '/v2/apps/da42afa1-0bf6-4ad7-b644-40ac216efce5/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/da42afa1-0bf6-4ad7-b644-40ac216efce5/route_mappings',
            guid: 'da42afa1-0bf6-4ad7-b644-40ac216efce5',
            cfGuid: '663a363e-1faf-4359-ac96-b8c24ec1a4ab'
          },
          metadata: {
            guid: 'da42afa1-0bf6-4ad7-b644-40ac216efce5',
            url: '/v2/apps/da42afa1-0bf6-4ad7-b644-40ac216efce5',
            created_at: '2017-10-05T10:05:36Z',
            updated_at: '2017-10-05T10:05:36Z'
          }
        },
        '90adbf54-bc68-487f-b60a-3967083c7b4e': {
          entity: {
            name: 'Test1234asdasd,kjmhgfvgbhnm',
            production: false,
            space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_guid: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: '9e349665-c4ac-4215-8de0-7b5cb2e0962d',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
            space: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_url: '/v2/stacks/97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            stack: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            routes_url: '/v2/apps/90adbf54-bc68-487f-b60a-3967083c7b4e/routes',
            routes: [],
            events_url: '/v2/apps/90adbf54-bc68-487f-b60a-3967083c7b4e/events',
            service_bindings_url: '/v2/apps/90adbf54-bc68-487f-b60a-3967083c7b4e/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/90adbf54-bc68-487f-b60a-3967083c7b4e/route_mappings',
            guid: '90adbf54-bc68-487f-b60a-3967083c7b4e',
            cfGuid: '663a363e-1faf-4359-ac96-b8c24ec1a4ab'
          },
          metadata: {
            guid: '90adbf54-bc68-487f-b60a-3967083c7b4e',
            url: '/v2/apps/90adbf54-bc68-487f-b60a-3967083c7b4e',
            created_at: '2017-10-05T10:06:12Z',
            updated_at: '2017-10-05T10:06:12Z'
          }
        },
        'c54e3d96-d4aa-441f-9b84-c313fedc06e3': {
          entity: {
            name: 'Test1234asdasdkjmhgfvgbhnm',
            production: false,
            space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_guid: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: 'a02579cf-0fcc-46dd-a0f5-01fea5537261',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
            space: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_url: '/v2/stacks/97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            stack: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            routes_url: '/v2/apps/c54e3d96-d4aa-441f-9b84-c313fedc06e3/routes',
            routes: [
              {
                metadata: {
                  guid: '8f58c328-b20d-420a-a80f-b808a9f78d79',
                  url: '/v2/routes/8f58c328-b20d-420a-a80f-b808a9f78d79',
                  created_at: '2017-10-05T10:06:27Z',
                  updated_at: '2017-10-05T10:06:27Z'
                },
                entity: {
                  host: 'test1234asdasdkjmhgfvgbhnm',
                  path: '',
                  domain_guid: '44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  domain: {
                    metadata: {
                      guid: '44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                      url: '/v2/shared_domains/44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                      created_at: '2017-09-22T15:25:53Z',
                      updated_at: '2017-09-22T15:25:53Z'
                    },
                    entity: {
                      name: 'capbristol.com',
                      router_group_guid: null,
                      router_group_type: null
                    }
                  },
                  space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
                  space: {
                    metadata: {
                      guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
                      url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
                      created_at: '2017-09-22T15:27:48Z',
                      updated_at: '2017-09-22T15:27:48Z'
                    },
                    entity: {
                      name: 'e2e',
                      organization_guid: '22feecef-df39-4ae0-a56a-098cbe09ec0d',
                      space_quota_definition_guid: null,
                      isolation_segment_guid: null,
                      allow_ssh: true,
                      organization_url: '/v2/organizations/22feecef-df39-4ae0-a56a-098cbe09ec0d',
                      developers_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/developers',
                      managers_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/managers',
                      auditors_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/auditors',
                      apps_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/apps',
                      routes_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/routes',
                      domains_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/domains',
                      service_instances_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/service_instances',
                      app_events_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/app_events',
                      events_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/events',
                      security_groups_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/security_groups',
                      staging_security_groups_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/staging_security_groups'
                    }
                  },
                  apps_url: '/v2/routes/8f58c328-b20d-420a-a80f-b808a9f78d79/apps',
                  route_mappings_url: '/v2/routes/8f58c328-b20d-420a-a80f-b808a9f78d79/route_mappings'
                }
              }
            ],
            events_url: '/v2/apps/c54e3d96-d4aa-441f-9b84-c313fedc06e3/events',
            service_bindings_url: '/v2/apps/c54e3d96-d4aa-441f-9b84-c313fedc06e3/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/c54e3d96-d4aa-441f-9b84-c313fedc06e3/route_mappings',
            guid: 'c54e3d96-d4aa-441f-9b84-c313fedc06e3',
            cfGuid: '663a363e-1faf-4359-ac96-b8c24ec1a4ab'
          },
          metadata: {
            guid: 'c54e3d96-d4aa-441f-9b84-c313fedc06e3',
            url: '/v2/apps/c54e3d96-d4aa-441f-9b84-c313fedc06e3',
            created_at: '2017-10-05T10:06:27Z',
            updated_at: '2017-10-05T10:06:29Z'
          }
        },
        '17e397a7-fae2-40ee-93ef-70e428932a73': {
          entity: {
            name: 'Test1234asdasdsdfgadfa',
            production: false,
            space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_guid: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: '8b5cfcc4-4648-45e2-95e3-ba03b26a68c8',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
            space: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_url: '/v2/stacks/97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            stack: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            routes_url: '/v2/apps/17e397a7-fae2-40ee-93ef-70e428932a73/routes',
            routes: [
              {
                metadata: {
                  guid: '48c7ed46-91b6-42b4-8422-52d281235ee8',
                  url: '/v2/routes/48c7ed46-91b6-42b4-8422-52d281235ee8',
                  created_at: '2017-10-05T10:07:43Z',
                  updated_at: '2017-10-05T10:07:43Z'
                },
                entity: {
                  host: 'test1234asdasdsdfgadfa',
                  path: '',
                  domain_guid: '44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  domain: {
                    metadata: {
                      guid: '44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                      url: '/v2/shared_domains/44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                      created_at: '2017-09-22T15:25:53Z',
                      updated_at: '2017-09-22T15:25:53Z'
                    },
                    entity: {
                      name: 'capbristol.com',
                      router_group_guid: null,
                      router_group_type: null
                    }
                  },
                  space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
                  space: {
                    metadata: {
                      guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
                      url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
                      created_at: '2017-09-22T15:27:48Z',
                      updated_at: '2017-09-22T15:27:48Z'
                    },
                    entity: {
                      name: 'e2e',
                      organization_guid: '22feecef-df39-4ae0-a56a-098cbe09ec0d',
                      space_quota_definition_guid: null,
                      isolation_segment_guid: null,
                      allow_ssh: true,
                      organization_url: '/v2/organizations/22feecef-df39-4ae0-a56a-098cbe09ec0d',
                      developers_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/developers',
                      managers_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/managers',
                      auditors_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/auditors',
                      apps_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/apps',
                      routes_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/routes',
                      domains_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/domains',
                      service_instances_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/service_instances',
                      app_events_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/app_events',
                      events_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/events',
                      security_groups_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/security_groups',
                      staging_security_groups_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/staging_security_groups'
                    }
                  },
                  apps_url: '/v2/routes/48c7ed46-91b6-42b4-8422-52d281235ee8/apps',
                  route_mappings_url: '/v2/routes/48c7ed46-91b6-42b4-8422-52d281235ee8/route_mappings'
                }
              }
            ],
            events_url: '/v2/apps/17e397a7-fae2-40ee-93ef-70e428932a73/events',
            service_bindings_url: '/v2/apps/17e397a7-fae2-40ee-93ef-70e428932a73/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/17e397a7-fae2-40ee-93ef-70e428932a73/route_mappings',
            guid: '17e397a7-fae2-40ee-93ef-70e428932a73',
            cfGuid: '663a363e-1faf-4359-ac96-b8c24ec1a4ab'
          },
          metadata: {
            guid: '17e397a7-fae2-40ee-93ef-70e428932a73',
            url: '/v2/apps/17e397a7-fae2-40ee-93ef-70e428932a73',
            created_at: '2017-10-05T10:07:43Z',
            updated_at: '2017-10-05T10:07:44Z'
          }
        },
        '6c9ab603-c038-4b4b-b29e-7b440f8d2916': {
          entity: {
            name: '1',
            production: false,
            space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_guid: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: '665f2e87-3660-487f-8d09-27c6124ad6fa',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
            space: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_url: '/v2/stacks/97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            stack: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            routes_url: '/v2/apps/6c9ab603-c038-4b4b-b29e-7b440f8d2916/routes',
            routes: [
              {
                metadata: {
                  guid: 'd70e0bfd-8c31-4345-ade4-e268253c2770',
                  url: '/v2/routes/d70e0bfd-8c31-4345-ade4-e268253c2770',
                  created_at: '2017-10-05T10:08:31Z',
                  updated_at: '2017-10-05T10:08:31Z'
                },
                entity: {
                  host: '1',
                  path: '',
                  domain_guid: '44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  domain: {
                    metadata: {
                      guid: '44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                      url: '/v2/shared_domains/44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                      created_at: '2017-09-22T15:25:53Z',
                      updated_at: '2017-09-22T15:25:53Z'
                    },
                    entity: {
                      name: 'capbristol.com',
                      router_group_guid: null,
                      router_group_type: null
                    }
                  },
                  space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
                  space: {
                    metadata: {
                      guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
                      url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
                      created_at: '2017-09-22T15:27:48Z',
                      updated_at: '2017-09-22T15:27:48Z'
                    },
                    entity: {
                      name: 'e2e',
                      organization_guid: '22feecef-df39-4ae0-a56a-098cbe09ec0d',
                      space_quota_definition_guid: null,
                      isolation_segment_guid: null,
                      allow_ssh: true,
                      organization_url: '/v2/organizations/22feecef-df39-4ae0-a56a-098cbe09ec0d',
                      developers_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/developers',
                      managers_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/managers',
                      auditors_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/auditors',
                      apps_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/apps',
                      routes_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/routes',
                      domains_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/domains',
                      service_instances_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/service_instances',
                      app_events_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/app_events',
                      events_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/events',
                      security_groups_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/security_groups',
                      staging_security_groups_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/staging_security_groups'
                    }
                  },
                  apps_url: '/v2/routes/d70e0bfd-8c31-4345-ade4-e268253c2770/apps',
                  route_mappings_url: '/v2/routes/d70e0bfd-8c31-4345-ade4-e268253c2770/route_mappings'
                }
              }
            ],
            events_url: '/v2/apps/6c9ab603-c038-4b4b-b29e-7b440f8d2916/events',
            service_bindings_url: '/v2/apps/6c9ab603-c038-4b4b-b29e-7b440f8d2916/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/6c9ab603-c038-4b4b-b29e-7b440f8d2916/route_mappings',
            guid: '6c9ab603-c038-4b4b-b29e-7b440f8d2916',
            cfGuid: '663a363e-1faf-4359-ac96-b8c24ec1a4ab'
          },
          metadata: {
            guid: '6c9ab603-c038-4b4b-b29e-7b440f8d2916',
            url: '/v2/apps/6c9ab603-c038-4b4b-b29e-7b440f8d2916',
            created_at: '2017-10-05T10:08:31Z',
            updated_at: '2017-10-05T10:09:55Z'
          }
        },
        'f4091dbe-2aff-492e-b476-1b14219fdaf8': {
          entity: {
            name: '2',
            production: false,
            space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_guid: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: '96921f34-c08a-423b-85b1-46148c351e42',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
            space: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_url: '/v2/stacks/97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            stack: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            routes_url: '/v2/apps/f4091dbe-2aff-492e-b476-1b14219fdaf8/routes',
            routes: [
              {
                metadata: {
                  guid: '313f3e05-c989-4b13-bed5-cf1bbd907125',
                  url: '/v2/routes/313f3e05-c989-4b13-bed5-cf1bbd907125',
                  created_at: '2017-10-05T10:10:16Z',
                  updated_at: '2017-10-05T10:10:16Z'
                },
                entity: {
                  host: '2',
                  path: '',
                  domain_guid: '44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  domain: {
                    metadata: {
                      guid: '44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                      url: '/v2/shared_domains/44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                      created_at: '2017-09-22T15:25:53Z',
                      updated_at: '2017-09-22T15:25:53Z'
                    },
                    entity: {
                      name: 'capbristol.com',
                      router_group_guid: null,
                      router_group_type: null
                    }
                  },
                  space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
                  space: {
                    metadata: {
                      guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
                      url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
                      created_at: '2017-09-22T15:27:48Z',
                      updated_at: '2017-09-22T15:27:48Z'
                    },
                    entity: {
                      name: 'e2e',
                      organization_guid: '22feecef-df39-4ae0-a56a-098cbe09ec0d',
                      space_quota_definition_guid: null,
                      isolation_segment_guid: null,
                      allow_ssh: true,
                      organization_url: '/v2/organizations/22feecef-df39-4ae0-a56a-098cbe09ec0d',
                      developers_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/developers',
                      managers_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/managers',
                      auditors_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/auditors',
                      apps_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/apps',
                      routes_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/routes',
                      domains_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/domains',
                      service_instances_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/service_instances',
                      app_events_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/app_events',
                      events_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/events',
                      security_groups_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/security_groups',
                      staging_security_groups_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/staging_security_groups'
                    }
                  },
                  apps_url: '/v2/routes/313f3e05-c989-4b13-bed5-cf1bbd907125/apps',
                  route_mappings_url: '/v2/routes/313f3e05-c989-4b13-bed5-cf1bbd907125/route_mappings'
                }
              }
            ],
            events_url: '/v2/apps/f4091dbe-2aff-492e-b476-1b14219fdaf8/events',
            service_bindings_url: '/v2/apps/f4091dbe-2aff-492e-b476-1b14219fdaf8/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/f4091dbe-2aff-492e-b476-1b14219fdaf8/route_mappings',
            guid: 'f4091dbe-2aff-492e-b476-1b14219fdaf8',
            cfGuid: '663a363e-1faf-4359-ac96-b8c24ec1a4ab'
          },
          metadata: {
            guid: 'f4091dbe-2aff-492e-b476-1b14219fdaf8',
            url: '/v2/apps/f4091dbe-2aff-492e-b476-1b14219fdaf8',
            created_at: '2017-10-05T10:10:15Z',
            updated_at: '2017-10-05T10:12:30Z'
          }
        },
        'c5ede50a-6787-4628-b379-848d55ee914e': {
          entity: {
            name: 'neil',
            production: false,
            space_guid: 'd91c3bf0-3ab0-4372-8b08-75de137eeaf8',
            stack_guid: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: 'e363a885-af05-4eec-bb9e-b2666ac5a322',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/d91c3bf0-3ab0-4372-8b08-75de137eeaf8',
            space: 'd91c3bf0-3ab0-4372-8b08-75de137eeaf8',
            stack_url: '/v2/stacks/97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            stack: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            routes_url: '/v2/apps/c5ede50a-6787-4628-b379-848d55ee914e/routes',
            routes: [
              {
                metadata: {
                  guid: 'dfccdc77-a31f-428f-9c89-eee6786df0c7',
                  url: '/v2/routes/dfccdc77-a31f-428f-9c89-eee6786df0c7',
                  created_at: '2017-10-05T10:10:33Z',
                  updated_at: '2017-10-05T10:10:33Z'
                },
                entity: {
                  host: 'console',
                  path: '',
                  domain_guid: '44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  space_guid: 'd91c3bf0-3ab0-4372-8b08-75de137eeaf8',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  domain: {
                    metadata: {
                      guid: '44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                      url: '/v2/shared_domains/44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                      created_at: '2017-09-22T15:25:53Z',
                      updated_at: '2017-09-22T15:25:53Z'
                    },
                    entity: {
                      name: 'capbristol.com',
                      router_group_guid: null,
                      router_group_type: null
                    }
                  },
                  space_url: '/v2/spaces/d91c3bf0-3ab0-4372-8b08-75de137eeaf8',
                  space: {
                    metadata: {
                      guid: 'd91c3bf0-3ab0-4372-8b08-75de137eeaf8',
                      url: '/v2/spaces/d91c3bf0-3ab0-4372-8b08-75de137eeaf8',
                      created_at: '2017-09-22T15:38:44Z',
                      updated_at: '2017-09-22T15:38:44Z'
                    },
                    entity: {
                      name: 'susecon',
                      organization_guid: '94ce3787-757b-4eac-91c6-8f1705a178ba',
                      space_quota_definition_guid: null,
                      isolation_segment_guid: null,
                      allow_ssh: true,
                      organization_url: '/v2/organizations/94ce3787-757b-4eac-91c6-8f1705a178ba',
                      developers_url: '/v2/spaces/d91c3bf0-3ab0-4372-8b08-75de137eeaf8/developers',
                      managers_url: '/v2/spaces/d91c3bf0-3ab0-4372-8b08-75de137eeaf8/managers',
                      auditors_url: '/v2/spaces/d91c3bf0-3ab0-4372-8b08-75de137eeaf8/auditors',
                      apps_url: '/v2/spaces/d91c3bf0-3ab0-4372-8b08-75de137eeaf8/apps',
                      routes_url: '/v2/spaces/d91c3bf0-3ab0-4372-8b08-75de137eeaf8/routes',
                      domains_url: '/v2/spaces/d91c3bf0-3ab0-4372-8b08-75de137eeaf8/domains',
                      service_instances_url: '/v2/spaces/d91c3bf0-3ab0-4372-8b08-75de137eeaf8/service_instances',
                      app_events_url: '/v2/spaces/d91c3bf0-3ab0-4372-8b08-75de137eeaf8/app_events',
                      events_url: '/v2/spaces/d91c3bf0-3ab0-4372-8b08-75de137eeaf8/events',
                      security_groups_url: '/v2/spaces/d91c3bf0-3ab0-4372-8b08-75de137eeaf8/security_groups',
                      staging_security_groups_url: '/v2/spaces/d91c3bf0-3ab0-4372-8b08-75de137eeaf8/staging_security_groups'
                    }
                  },
                  apps_url: '/v2/routes/dfccdc77-a31f-428f-9c89-eee6786df0c7/apps',
                  route_mappings_url: '/v2/routes/dfccdc77-a31f-428f-9c89-eee6786df0c7/route_mappings'
                }
              }
            ],
            events_url: '/v2/apps/c5ede50a-6787-4628-b379-848d55ee914e/events',
            service_bindings_url: '/v2/apps/c5ede50a-6787-4628-b379-848d55ee914e/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/c5ede50a-6787-4628-b379-848d55ee914e/route_mappings',
            guid: 'c5ede50a-6787-4628-b379-848d55ee914e',
            cfGuid: '663a363e-1faf-4359-ac96-b8c24ec1a4ab'
          },
          metadata: {
            guid: 'c5ede50a-6787-4628-b379-848d55ee914e',
            url: '/v2/apps/c5ede50a-6787-4628-b379-848d55ee914e',
            created_at: '2017-10-05T10:10:32Z',
            updated_at: '2017-10-05T10:10:33Z'
          }
        },
        'b18c3b6f-87bf-48c4-a8b9-48749ab63d05': {
          entity: {
            name: 'console',
            production: false,
            space_guid: 'd91c3bf0-3ab0-4372-8b08-75de137eeaf8',
            stack_guid: '18813ebb-8907-4c3b-8ba7-26a1632e16e9',
            buildpack: 'https://github.com/cloudfoundry-incubator/multi-buildpack',
            detected_buildpack: '',
            detected_buildpack_guid: null,
            environment_json: {
              STRATOS_PROJECT: '{"deploySource":{"type":"github","timestamp":1507198314,"project":"cloudfoundry-incubator/stratos","branch":"master","url":"https://github.com/cloudfoundry-incubator/stratos","commit":"abd53d23fb7a64fa2dabfc89c7c20177845000bb\\n"}}'
            },
            memory: 1024,
            instances: 1,
            disk_quota: 2048,
            state: 'STARTED',
            version: '049c7367-914f-47f2-af63-f5b30d48c24f',
            command: null,
            console: false,
            debug: null,
            staging_task_id: 'd5ca7157-51dc-4e05-a1c4-19a21ea9d082',
            package_state: 'STAGED',
            health_check_type: 'port',
            health_check_timeout: 180,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: '2017-10-05T10:12:34Z',
            detected_start_command: './deploy/cloud-foundry/package.sh',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/d91c3bf0-3ab0-4372-8b08-75de137eeaf8',
            space: 'd91c3bf0-3ab0-4372-8b08-75de137eeaf8',
            stack_url: '/v2/stacks/18813ebb-8907-4c3b-8ba7-26a1632e16e9',
            stack: '18813ebb-8907-4c3b-8ba7-26a1632e16e9',
            routes_url: '/v2/apps/b18c3b6f-87bf-48c4-a8b9-48749ab63d05/routes',
            routes: [
              {
                metadata: {
                  guid: 'dfccdc77-a31f-428f-9c89-eee6786df0c7',
                  url: '/v2/routes/dfccdc77-a31f-428f-9c89-eee6786df0c7',
                  created_at: '2017-10-05T10:10:33Z',
                  updated_at: '2017-10-05T10:10:33Z'
                },
                entity: {
                  host: 'console',
                  path: '',
                  domain_guid: '44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  space_guid: 'd91c3bf0-3ab0-4372-8b08-75de137eeaf8',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  domain: {
                    metadata: {
                      guid: '44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                      url: '/v2/shared_domains/44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                      created_at: '2017-09-22T15:25:53Z',
                      updated_at: '2017-09-22T15:25:53Z'
                    },
                    entity: {
                      name: 'capbristol.com',
                      router_group_guid: null,
                      router_group_type: null
                    }
                  },
                  space_url: '/v2/spaces/d91c3bf0-3ab0-4372-8b08-75de137eeaf8',
                  space: {
                    metadata: {
                      guid: 'd91c3bf0-3ab0-4372-8b08-75de137eeaf8',
                      url: '/v2/spaces/d91c3bf0-3ab0-4372-8b08-75de137eeaf8',
                      created_at: '2017-09-22T15:38:44Z',
                      updated_at: '2017-09-22T15:38:44Z'
                    },
                    entity: {
                      name: 'susecon',
                      organization_guid: '94ce3787-757b-4eac-91c6-8f1705a178ba',
                      space_quota_definition_guid: null,
                      isolation_segment_guid: null,
                      allow_ssh: true,
                      organization_url: '/v2/organizations/94ce3787-757b-4eac-91c6-8f1705a178ba',
                      developers_url: '/v2/spaces/d91c3bf0-3ab0-4372-8b08-75de137eeaf8/developers',
                      managers_url: '/v2/spaces/d91c3bf0-3ab0-4372-8b08-75de137eeaf8/managers',
                      auditors_url: '/v2/spaces/d91c3bf0-3ab0-4372-8b08-75de137eeaf8/auditors',
                      apps_url: '/v2/spaces/d91c3bf0-3ab0-4372-8b08-75de137eeaf8/apps',
                      routes_url: '/v2/spaces/d91c3bf0-3ab0-4372-8b08-75de137eeaf8/routes',
                      domains_url: '/v2/spaces/d91c3bf0-3ab0-4372-8b08-75de137eeaf8/domains',
                      service_instances_url: '/v2/spaces/d91c3bf0-3ab0-4372-8b08-75de137eeaf8/service_instances',
                      app_events_url: '/v2/spaces/d91c3bf0-3ab0-4372-8b08-75de137eeaf8/app_events',
                      events_url: '/v2/spaces/d91c3bf0-3ab0-4372-8b08-75de137eeaf8/events',
                      security_groups_url: '/v2/spaces/d91c3bf0-3ab0-4372-8b08-75de137eeaf8/security_groups',
                      staging_security_groups_url: '/v2/spaces/d91c3bf0-3ab0-4372-8b08-75de137eeaf8/staging_security_groups'
                    }
                  },
                  apps_url: '/v2/routes/dfccdc77-a31f-428f-9c89-eee6786df0c7/apps',
                  route_mappings_url: '/v2/routes/dfccdc77-a31f-428f-9c89-eee6786df0c7/route_mappings'
                }
              }
            ],
            events_url: '/v2/apps/b18c3b6f-87bf-48c4-a8b9-48749ab63d05/events',
            service_bindings_url: '/v2/apps/b18c3b6f-87bf-48c4-a8b9-48749ab63d05/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/b18c3b6f-87bf-48c4-a8b9-48749ab63d05/route_mappings',
            guid: 'b18c3b6f-87bf-48c4-a8b9-48749ab63d05',
            cfGuid: '663a363e-1faf-4359-ac96-b8c24ec1a4ab'
          },
          metadata: {
            guid: 'b18c3b6f-87bf-48c4-a8b9-48749ab63d05',
            url: '/v2/apps/b18c3b6f-87bf-48c4-a8b9-48749ab63d05',
            created_at: '2017-10-05T10:12:02Z',
            updated_at: '2017-10-05T10:13:17Z'
          }
        },
        '0e14fcb7-4a13-48bd-8d5e-fc52cbe19d2c': {
          entity: {
            name: '4',
            production: false,
            space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_guid: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: 'd15de583-797a-4cca-b146-481276ca254c',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
            space: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_url: '/v2/stacks/97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            stack: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            routes_url: '/v2/apps/0e14fcb7-4a13-48bd-8d5e-fc52cbe19d2c/routes',
            routes: [
              {
                metadata: {
                  guid: '3e7d252b-6fc3-4625-85d4-3b1ec4f02cb4',
                  url: '/v2/routes/3e7d252b-6fc3-4625-85d4-3b1ec4f02cb4',
                  created_at: '2017-10-05T10:14:25Z',
                  updated_at: '2017-10-05T10:14:25Z'
                },
                entity: {
                  host: '4',
                  path: '',
                  domain_guid: '44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  domain: {
                    metadata: {
                      guid: '44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                      url: '/v2/shared_domains/44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                      created_at: '2017-09-22T15:25:53Z',
                      updated_at: '2017-09-22T15:25:53Z'
                    },
                    entity: {
                      name: 'capbristol.com',
                      router_group_guid: null,
                      router_group_type: null
                    }
                  },
                  space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
                  space: {
                    metadata: {
                      guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
                      url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
                      created_at: '2017-09-22T15:27:48Z',
                      updated_at: '2017-09-22T15:27:48Z'
                    },
                    entity: {
                      name: 'e2e',
                      organization_guid: '22feecef-df39-4ae0-a56a-098cbe09ec0d',
                      space_quota_definition_guid: null,
                      isolation_segment_guid: null,
                      allow_ssh: true,
                      organization_url: '/v2/organizations/22feecef-df39-4ae0-a56a-098cbe09ec0d',
                      developers_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/developers',
                      managers_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/managers',
                      auditors_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/auditors',
                      apps_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/apps',
                      routes_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/routes',
                      domains_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/domains',
                      service_instances_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/service_instances',
                      app_events_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/app_events',
                      events_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/events',
                      security_groups_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/security_groups',
                      staging_security_groups_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/staging_security_groups'
                    }
                  },
                  apps_url: '/v2/routes/3e7d252b-6fc3-4625-85d4-3b1ec4f02cb4/apps',
                  route_mappings_url: '/v2/routes/3e7d252b-6fc3-4625-85d4-3b1ec4f02cb4/route_mappings'
                }
              }
            ],
            events_url: '/v2/apps/0e14fcb7-4a13-48bd-8d5e-fc52cbe19d2c/events',
            service_bindings_url: '/v2/apps/0e14fcb7-4a13-48bd-8d5e-fc52cbe19d2c/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/0e14fcb7-4a13-48bd-8d5e-fc52cbe19d2c/route_mappings',
            guid: '0e14fcb7-4a13-48bd-8d5e-fc52cbe19d2c',
            cfGuid: '663a363e-1faf-4359-ac96-b8c24ec1a4ab'
          },
          metadata: {
            guid: '0e14fcb7-4a13-48bd-8d5e-fc52cbe19d2c',
            url: '/v2/apps/0e14fcb7-4a13-48bd-8d5e-fc52cbe19d2c',
            created_at: '2017-10-05T10:14:24Z',
            updated_at: '2017-10-05T10:14:26Z'
          }
        },
        '53d2f48c-48ec-4ece-9775-d8932f77e2db': {
          entity: {
            name: 'Test1234asdasdasdasd1',
            production: false,
            space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_guid: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: 'd05bce60-7e11-4ab0-99b8-56a999f08cbd',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
            space: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_url: '/v2/stacks/97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            stack: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            routes_url: '/v2/apps/53d2f48c-48ec-4ece-9775-d8932f77e2db/routes',
            routes: [
              {
                metadata: {
                  guid: '4f2518bc-0854-4c20-b78b-17d6ef5b8b10',
                  url: '/v2/routes/4f2518bc-0854-4c20-b78b-17d6ef5b8b10',
                  created_at: '2017-10-05T10:15:48Z',
                  updated_at: '2017-10-05T10:15:48Z'
                },
                entity: {
                  host: 'test1234asdasdasdasd1',
                  path: '',
                  domain_guid: '44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  domain: {
                    metadata: {
                      guid: '44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                      url: '/v2/shared_domains/44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                      created_at: '2017-09-22T15:25:53Z',
                      updated_at: '2017-09-22T15:25:53Z'
                    },
                    entity: {
                      name: 'capbristol.com',
                      router_group_guid: null,
                      router_group_type: null
                    }
                  },
                  space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
                  space: {
                    metadata: {
                      guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
                      url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
                      created_at: '2017-09-22T15:27:48Z',
                      updated_at: '2017-09-22T15:27:48Z'
                    },
                    entity: {
                      name: 'e2e',
                      organization_guid: '22feecef-df39-4ae0-a56a-098cbe09ec0d',
                      space_quota_definition_guid: null,
                      isolation_segment_guid: null,
                      allow_ssh: true,
                      organization_url: '/v2/organizations/22feecef-df39-4ae0-a56a-098cbe09ec0d',
                      developers_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/developers',
                      managers_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/managers',
                      auditors_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/auditors',
                      apps_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/apps',
                      routes_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/routes',
                      domains_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/domains',
                      service_instances_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/service_instances',
                      app_events_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/app_events',
                      events_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/events',
                      security_groups_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/security_groups',
                      staging_security_groups_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/staging_security_groups'
                    }
                  },
                  apps_url: '/v2/routes/4f2518bc-0854-4c20-b78b-17d6ef5b8b10/apps',
                  route_mappings_url: '/v2/routes/4f2518bc-0854-4c20-b78b-17d6ef5b8b10/route_mappings'
                }
              }
            ],
            events_url: '/v2/apps/53d2f48c-48ec-4ece-9775-d8932f77e2db/events',
            service_bindings_url: '/v2/apps/53d2f48c-48ec-4ece-9775-d8932f77e2db/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/53d2f48c-48ec-4ece-9775-d8932f77e2db/route_mappings',
            guid: '53d2f48c-48ec-4ece-9775-d8932f77e2db',
            cfGuid: '663a363e-1faf-4359-ac96-b8c24ec1a4ab'
          },
          metadata: {
            guid: '53d2f48c-48ec-4ece-9775-d8932f77e2db',
            url: '/v2/apps/53d2f48c-48ec-4ece-9775-d8932f77e2db',
            created_at: '2017-10-05T10:15:45Z',
            updated_at: '2017-10-05T10:16:03Z'
          }
        },
        '879d3e3b-72df-455f-83d7-7c1183db150f': {
          entity: {
            name: 'Test1234asdasdsdfg',
            production: false,
            space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_guid: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: 'ad987876-42fd-40d0-9029-2d0bc79028fc',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
            space: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_url: '/v2/stacks/97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            stack: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            routes_url: '/v2/apps/879d3e3b-72df-455f-83d7-7c1183db150f/routes',
            routes: [
              {
                metadata: {
                  guid: '0db7f14d-321f-43c0-8dc2-ff5907d3f2ac',
                  url: '/v2/routes/0db7f14d-321f-43c0-8dc2-ff5907d3f2ac',
                  created_at: '2017-10-05T10:17:01Z',
                  updated_at: '2017-10-05T10:17:01Z'
                },
                entity: {
                  host: 'test1234asdasdsdfg',
                  path: '',
                  domain_guid: '44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  domain: {
                    metadata: {
                      guid: '44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                      url: '/v2/shared_domains/44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                      created_at: '2017-09-22T15:25:53Z',
                      updated_at: '2017-09-22T15:25:53Z'
                    },
                    entity: {
                      name: 'capbristol.com',
                      router_group_guid: null,
                      router_group_type: null
                    }
                  },
                  space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
                  space: {
                    metadata: {
                      guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
                      url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
                      created_at: '2017-09-22T15:27:48Z',
                      updated_at: '2017-09-22T15:27:48Z'
                    },
                    entity: {
                      name: 'e2e',
                      organization_guid: '22feecef-df39-4ae0-a56a-098cbe09ec0d',
                      space_quota_definition_guid: null,
                      isolation_segment_guid: null,
                      allow_ssh: true,
                      organization_url: '/v2/organizations/22feecef-df39-4ae0-a56a-098cbe09ec0d',
                      developers_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/developers',
                      managers_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/managers',
                      auditors_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/auditors',
                      apps_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/apps',
                      routes_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/routes',
                      domains_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/domains',
                      service_instances_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/service_instances',
                      app_events_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/app_events',
                      events_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/events',
                      security_groups_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/security_groups',
                      staging_security_groups_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/staging_security_groups'
                    }
                  },
                  apps_url: '/v2/routes/0db7f14d-321f-43c0-8dc2-ff5907d3f2ac/apps',
                  route_mappings_url: '/v2/routes/0db7f14d-321f-43c0-8dc2-ff5907d3f2ac/route_mappings'
                }
              }
            ],
            events_url: '/v2/apps/879d3e3b-72df-455f-83d7-7c1183db150f/events',
            service_bindings_url: '/v2/apps/879d3e3b-72df-455f-83d7-7c1183db150f/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/879d3e3b-72df-455f-83d7-7c1183db150f/route_mappings',
            guid: '879d3e3b-72df-455f-83d7-7c1183db150f',
            cfGuid: '663a363e-1faf-4359-ac96-b8c24ec1a4ab'
          },
          metadata: {
            guid: '879d3e3b-72df-455f-83d7-7c1183db150f',
            url: '/v2/apps/879d3e3b-72df-455f-83d7-7c1183db150f',
            created_at: '2017-10-05T10:17:01Z',
            updated_at: '2017-10-05T10:17:10Z'
          }
        },
        'cf717053-f8e6-4cd3-9bd3-9c1b0701ed45': {
          entity: {
            name: 'Test1234asdsadsdfghjk1',
            production: false,
            space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_guid: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: '107c7e9c-4c66-4f93-b210-ef12d8ebe607',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
            space: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_url: '/v2/stacks/97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            stack: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            routes_url: '/v2/apps/cf717053-f8e6-4cd3-9bd3-9c1b0701ed45/routes',
            routes: [
              {
                metadata: {
                  guid: '60aea4fa-5aa0-4939-9780-f17dd3dd813a',
                  url: '/v2/routes/60aea4fa-5aa0-4939-9780-f17dd3dd813a',
                  created_at: '2017-10-05T10:19:34Z',
                  updated_at: '2017-10-05T10:19:34Z'
                },
                entity: {
                  host: 'test1234asdsadsdfghjk1',
                  path: '',
                  domain_guid: '44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  domain: {
                    metadata: {
                      guid: '44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                      url: '/v2/shared_domains/44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                      created_at: '2017-09-22T15:25:53Z',
                      updated_at: '2017-09-22T15:25:53Z'
                    },
                    entity: {
                      name: 'capbristol.com',
                      router_group_guid: null,
                      router_group_type: null
                    }
                  },
                  space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
                  space: {
                    metadata: {
                      guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
                      url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
                      created_at: '2017-09-22T15:27:48Z',
                      updated_at: '2017-09-22T15:27:48Z'
                    },
                    entity: {
                      name: 'e2e',
                      organization_guid: '22feecef-df39-4ae0-a56a-098cbe09ec0d',
                      space_quota_definition_guid: null,
                      isolation_segment_guid: null,
                      allow_ssh: true,
                      organization_url: '/v2/organizations/22feecef-df39-4ae0-a56a-098cbe09ec0d',
                      developers_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/developers',
                      managers_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/managers',
                      auditors_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/auditors',
                      apps_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/apps',
                      routes_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/routes',
                      domains_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/domains',
                      service_instances_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/service_instances',
                      app_events_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/app_events',
                      events_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/events',
                      security_groups_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/security_groups',
                      staging_security_groups_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/staging_security_groups'
                    }
                  },
                  apps_url: '/v2/routes/60aea4fa-5aa0-4939-9780-f17dd3dd813a/apps',
                  route_mappings_url: '/v2/routes/60aea4fa-5aa0-4939-9780-f17dd3dd813a/route_mappings'
                }
              }
            ],
            events_url: '/v2/apps/cf717053-f8e6-4cd3-9bd3-9c1b0701ed45/events',
            service_bindings_url: '/v2/apps/cf717053-f8e6-4cd3-9bd3-9c1b0701ed45/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/cf717053-f8e6-4cd3-9bd3-9c1b0701ed45/route_mappings',
            guid: 'cf717053-f8e6-4cd3-9bd3-9c1b0701ed45',
            cfGuid: '663a363e-1faf-4359-ac96-b8c24ec1a4ab'
          },
          metadata: {
            guid: 'cf717053-f8e6-4cd3-9bd3-9c1b0701ed45',
            url: '/v2/apps/cf717053-f8e6-4cd3-9bd3-9c1b0701ed45',
            created_at: '2017-10-05T10:19:33Z',
            updated_at: '2017-10-05T10:19:41Z'
          }
        },
        'bce5e758-768d-4e92-b8d0-a3580752ddf5': {
          entity: {
            name: 'Test1234asdsadxdfgse5rg',
            production: false,
            space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_guid: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: '5defd56c-aecb-44e0-b5ce-39c1a21811ce',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
            space: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_url: '/v2/stacks/97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            stack: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            routes_url: '/v2/apps/bce5e758-768d-4e92-b8d0-a3580752ddf5/routes',
            routes: [
              {
                metadata: {
                  guid: '7cc6bbfb-85d1-487f-921b-173f8f269be5',
                  url: '/v2/routes/7cc6bbfb-85d1-487f-921b-173f8f269be5',
                  created_at: '2017-10-05T10:20:42Z',
                  updated_at: '2017-10-05T10:20:42Z'
                },
                entity: {
                  host: 'test1234asdsadxdfgse5rg',
                  path: '',
                  domain_guid: '44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  domain: {
                    metadata: {
                      guid: '44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                      url: '/v2/shared_domains/44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                      created_at: '2017-09-22T15:25:53Z',
                      updated_at: '2017-09-22T15:25:53Z'
                    },
                    entity: {
                      name: 'capbristol.com',
                      router_group_guid: null,
                      router_group_type: null
                    }
                  },
                  space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
                  space: {
                    metadata: {
                      guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
                      url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
                      created_at: '2017-09-22T15:27:48Z',
                      updated_at: '2017-09-22T15:27:48Z'
                    },
                    entity: {
                      name: 'e2e',
                      organization_guid: '22feecef-df39-4ae0-a56a-098cbe09ec0d',
                      space_quota_definition_guid: null,
                      isolation_segment_guid: null,
                      allow_ssh: true,
                      organization_url: '/v2/organizations/22feecef-df39-4ae0-a56a-098cbe09ec0d',
                      developers_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/developers',
                      managers_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/managers',
                      auditors_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/auditors',
                      apps_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/apps',
                      routes_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/routes',
                      domains_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/domains',
                      service_instances_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/service_instances',
                      app_events_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/app_events',
                      events_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/events',
                      security_groups_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/security_groups',
                      staging_security_groups_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/staging_security_groups'
                    }
                  },
                  apps_url: '/v2/routes/7cc6bbfb-85d1-487f-921b-173f8f269be5/apps',
                  route_mappings_url: '/v2/routes/7cc6bbfb-85d1-487f-921b-173f8f269be5/route_mappings'
                }
              }
            ],
            events_url: '/v2/apps/bce5e758-768d-4e92-b8d0-a3580752ddf5/events',
            service_bindings_url: '/v2/apps/bce5e758-768d-4e92-b8d0-a3580752ddf5/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/bce5e758-768d-4e92-b8d0-a3580752ddf5/route_mappings',
            guid: 'bce5e758-768d-4e92-b8d0-a3580752ddf5',
            cfGuid: '663a363e-1faf-4359-ac96-b8c24ec1a4ab'
          },
          metadata: {
            guid: 'bce5e758-768d-4e92-b8d0-a3580752ddf5',
            url: '/v2/apps/bce5e758-768d-4e92-b8d0-a3580752ddf5',
            created_at: '2017-10-05T10:20:42Z',
            updated_at: '2017-10-05T10:20:50Z'
          }
        },
        'ef33c4d2-104b-4e04-9635-dac7a6b2face': {
          entity: {
            name: 'Test1234asdasd2234',
            production: false,
            space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_guid: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: '4432faa2-783b-4cec-aca1-d1a59945bfa6',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
            space: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_url: '/v2/stacks/97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            stack: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            routes_url: '/v2/apps/ef33c4d2-104b-4e04-9635-dac7a6b2face/routes',
            routes: [],
            events_url: '/v2/apps/ef33c4d2-104b-4e04-9635-dac7a6b2face/events',
            service_bindings_url: '/v2/apps/ef33c4d2-104b-4e04-9635-dac7a6b2face/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/ef33c4d2-104b-4e04-9635-dac7a6b2face/route_mappings',
            guid: 'ef33c4d2-104b-4e04-9635-dac7a6b2face',
            cfGuid: '663a363e-1faf-4359-ac96-b8c24ec1a4ab'
          },
          metadata: {
            guid: 'ef33c4d2-104b-4e04-9635-dac7a6b2face',
            url: '/v2/apps/ef33c4d2-104b-4e04-9635-dac7a6b2face',
            created_at: '2017-10-05T10:22:51Z',
            updated_at: '2017-10-05T10:22:51Z'
          }
        },
        '84a7f331-41c3-474f-9d3c-e8108f4702a6': {
          entity: {
            name: 'Test1234asdsaddfgh',
            production: false,
            space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_guid: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: 'e4cdaa1d-b08c-45a5-9d8f-08af72e91318',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
            space: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_url: '/v2/stacks/97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            stack: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            routes_url: '/v2/apps/84a7f331-41c3-474f-9d3c-e8108f4702a6/routes',
            routes: [
              {
                metadata: {
                  guid: '0c9635e3-3861-4cd3-b43e-99b4838a602e',
                  url: '/v2/routes/0c9635e3-3861-4cd3-b43e-99b4838a602e',
                  created_at: '2017-10-05T10:29:01Z',
                  updated_at: '2017-10-05T10:29:01Z'
                },
                entity: {
                  host: 'test1234asdsaddfgh',
                  path: '',
                  domain_guid: '44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  domain: {
                    metadata: {
                      guid: '44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                      url: '/v2/shared_domains/44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                      created_at: '2017-09-22T15:25:53Z',
                      updated_at: '2017-09-22T15:25:53Z'
                    },
                    entity: {
                      name: 'capbristol.com',
                      router_group_guid: null,
                      router_group_type: null
                    }
                  },
                  space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
                  space: {
                    metadata: {
                      guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
                      url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
                      created_at: '2017-09-22T15:27:48Z',
                      updated_at: '2017-09-22T15:27:48Z'
                    },
                    entity: {
                      name: 'e2e',
                      organization_guid: '22feecef-df39-4ae0-a56a-098cbe09ec0d',
                      space_quota_definition_guid: null,
                      isolation_segment_guid: null,
                      allow_ssh: true,
                      organization_url: '/v2/organizations/22feecef-df39-4ae0-a56a-098cbe09ec0d',
                      developers_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/developers',
                      managers_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/managers',
                      auditors_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/auditors',
                      apps_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/apps',
                      routes_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/routes',
                      domains_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/domains',
                      service_instances_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/service_instances',
                      app_events_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/app_events',
                      events_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/events',
                      security_groups_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/security_groups',
                      staging_security_groups_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/staging_security_groups'
                    }
                  },
                  apps_url: '/v2/routes/0c9635e3-3861-4cd3-b43e-99b4838a602e/apps',
                  route_mappings_url: '/v2/routes/0c9635e3-3861-4cd3-b43e-99b4838a602e/route_mappings'
                }
              }
            ],
            events_url: '/v2/apps/84a7f331-41c3-474f-9d3c-e8108f4702a6/events',
            service_bindings_url: '/v2/apps/84a7f331-41c3-474f-9d3c-e8108f4702a6/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/84a7f331-41c3-474f-9d3c-e8108f4702a6/route_mappings',
            guid: '84a7f331-41c3-474f-9d3c-e8108f4702a6',
            cfGuid: '663a363e-1faf-4359-ac96-b8c24ec1a4ab'
          },
          metadata: {
            guid: '84a7f331-41c3-474f-9d3c-e8108f4702a6',
            url: '/v2/apps/84a7f331-41c3-474f-9d3c-e8108f4702a6',
            created_at: '2017-10-05T10:29:01Z',
            updated_at: '2017-10-05T10:29:10Z'
          }
        },
        '34026306-3b74-4405-a489-d85ec67d7860': {
          entity: {
            name: 'RouteTest',
            production: false,
            space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_guid: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: '02544669-5fb4-4265-9343-bc96e76aa5a8',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
            space: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_url: '/v2/stacks/97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            stack: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            routes_url: '/v2/apps/34026306-3b74-4405-a489-d85ec67d7860/routes',
            routes: [
              {
                metadata: {
                  guid: 'a27d5cd2-2c48-4dcd-bf32-a40280673bec',
                  url: '/v2/routes/a27d5cd2-2c48-4dcd-bf32-a40280673bec',
                  created_at: '2017-10-05T10:35:53Z',
                  updated_at: '2017-10-05T10:35:53Z'
                },
                entity: {
                  host: 'routetest',
                  path: '',
                  domain_guid: '44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  domain: {
                    metadata: {
                      guid: '44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                      url: '/v2/shared_domains/44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                      created_at: '2017-09-22T15:25:53Z',
                      updated_at: '2017-09-22T15:25:53Z'
                    },
                    entity: {
                      name: 'capbristol.com',
                      router_group_guid: null,
                      router_group_type: null
                    }
                  },
                  space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
                  space: {
                    metadata: {
                      guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
                      url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
                      created_at: '2017-09-22T15:27:48Z',
                      updated_at: '2017-09-22T15:27:48Z'
                    },
                    entity: {
                      name: 'e2e',
                      organization_guid: '22feecef-df39-4ae0-a56a-098cbe09ec0d',
                      space_quota_definition_guid: null,
                      isolation_segment_guid: null,
                      allow_ssh: true,
                      organization_url: '/v2/organizations/22feecef-df39-4ae0-a56a-098cbe09ec0d',
                      developers_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/developers',
                      managers_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/managers',
                      auditors_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/auditors',
                      apps_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/apps',
                      routes_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/routes',
                      domains_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/domains',
                      service_instances_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/service_instances',
                      app_events_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/app_events',
                      events_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/events',
                      security_groups_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/security_groups',
                      staging_security_groups_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/staging_security_groups'
                    }
                  },
                  apps_url: '/v2/routes/a27d5cd2-2c48-4dcd-bf32-a40280673bec/apps',
                  route_mappings_url: '/v2/routes/a27d5cd2-2c48-4dcd-bf32-a40280673bec/route_mappings'
                }
              }
            ],
            events_url: '/v2/apps/34026306-3b74-4405-a489-d85ec67d7860/events',
            service_bindings_url: '/v2/apps/34026306-3b74-4405-a489-d85ec67d7860/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/34026306-3b74-4405-a489-d85ec67d7860/route_mappings',
            guid: '34026306-3b74-4405-a489-d85ec67d7860',
            cfGuid: '663a363e-1faf-4359-ac96-b8c24ec1a4ab'
          },
          metadata: {
            guid: '34026306-3b74-4405-a489-d85ec67d7860',
            url: '/v2/apps/34026306-3b74-4405-a489-d85ec67d7860',
            created_at: '2017-10-05T10:35:53Z',
            updated_at: '2017-10-05T10:35:57Z'
          }
        },
        '66aee61b-cf69-4a9d-966a-4dbc9ee981f1': {
          entity: {
            name: 'Test1234asdasd23234',
            production: false,
            space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_guid: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: '5babb7a9-d07a-48ac-a7e8-aff726c2b43d',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
            space: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_url: '/v2/stacks/97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            stack: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            routes_url: '/v2/apps/66aee61b-cf69-4a9d-966a-4dbc9ee981f1/routes',
            routes: [
              {
                metadata: {
                  guid: 'd735e9b9-b8c4-483c-96d8-c81b3a5b4228',
                  url: '/v2/routes/d735e9b9-b8c4-483c-96d8-c81b3a5b4228',
                  created_at: '2017-10-05T10:47:03Z',
                  updated_at: '2017-10-05T10:47:03Z'
                },
                entity: {
                  host: 'test1234asdasd23234',
                  path: '',
                  domain_guid: '44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  domain: {
                    metadata: {
                      guid: '44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                      url: '/v2/shared_domains/44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                      created_at: '2017-09-22T15:25:53Z',
                      updated_at: '2017-09-22T15:25:53Z'
                    },
                    entity: {
                      name: 'capbristol.com',
                      router_group_guid: null,
                      router_group_type: null
                    }
                  },
                  space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
                  space: {
                    metadata: {
                      guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
                      url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
                      created_at: '2017-09-22T15:27:48Z',
                      updated_at: '2017-09-22T15:27:48Z'
                    },
                    entity: {
                      name: 'e2e',
                      organization_guid: '22feecef-df39-4ae0-a56a-098cbe09ec0d',
                      space_quota_definition_guid: null,
                      isolation_segment_guid: null,
                      allow_ssh: true,
                      organization_url: '/v2/organizations/22feecef-df39-4ae0-a56a-098cbe09ec0d',
                      developers_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/developers',
                      managers_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/managers',
                      auditors_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/auditors',
                      apps_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/apps',
                      routes_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/routes',
                      domains_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/domains',
                      service_instances_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/service_instances',
                      app_events_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/app_events',
                      events_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/events',
                      security_groups_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/security_groups',
                      staging_security_groups_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/staging_security_groups'
                    }
                  },
                  apps_url: '/v2/routes/d735e9b9-b8c4-483c-96d8-c81b3a5b4228/apps',
                  route_mappings_url: '/v2/routes/d735e9b9-b8c4-483c-96d8-c81b3a5b4228/route_mappings'
                }
              }
            ],
            events_url: '/v2/apps/66aee61b-cf69-4a9d-966a-4dbc9ee981f1/events',
            service_bindings_url: '/v2/apps/66aee61b-cf69-4a9d-966a-4dbc9ee981f1/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/66aee61b-cf69-4a9d-966a-4dbc9ee981f1/route_mappings',
            guid: '66aee61b-cf69-4a9d-966a-4dbc9ee981f1',
            cfGuid: '663a363e-1faf-4359-ac96-b8c24ec1a4ab'
          },
          metadata: {
            guid: '66aee61b-cf69-4a9d-966a-4dbc9ee981f1',
            url: '/v2/apps/66aee61b-cf69-4a9d-966a-4dbc9ee981f1',
            created_at: '2017-10-05T10:47:03Z',
            updated_at: '2017-10-05T10:47:04Z'
          }
        },
        '92abdead-5c38-46fd-a4c7-6fc8a0ff8176': {
          entity: {
            name: 'Test1234asdasdsdfgnm',
            production: false,
            space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_guid: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: '57b6bf55-4c96-461c-9740-ac45d8c85ef9',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
            space: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_url: '/v2/stacks/97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            stack: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            routes_url: '/v2/apps/92abdead-5c38-46fd-a4c7-6fc8a0ff8176/routes',
            routes: [
              {
                metadata: {
                  guid: 'f8b6cbbe-7b0b-49f8-8a52-f05360e321eb',
                  url: '/v2/routes/f8b6cbbe-7b0b-49f8-8a52-f05360e321eb',
                  created_at: '2017-10-05T10:49:44Z',
                  updated_at: '2017-10-05T10:49:44Z'
                },
                entity: {
                  host: 'test1234asdasdsdfgnm',
                  path: '',
                  domain_guid: '44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  domain: {
                    metadata: {
                      guid: '44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                      url: '/v2/shared_domains/44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                      created_at: '2017-09-22T15:25:53Z',
                      updated_at: '2017-09-22T15:25:53Z'
                    },
                    entity: {
                      name: 'capbristol.com',
                      router_group_guid: null,
                      router_group_type: null
                    }
                  },
                  space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
                  space: {
                    metadata: {
                      guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
                      url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
                      created_at: '2017-09-22T15:27:48Z',
                      updated_at: '2017-09-22T15:27:48Z'
                    },
                    entity: {
                      name: 'e2e',
                      organization_guid: '22feecef-df39-4ae0-a56a-098cbe09ec0d',
                      space_quota_definition_guid: null,
                      isolation_segment_guid: null,
                      allow_ssh: true,
                      organization_url: '/v2/organizations/22feecef-df39-4ae0-a56a-098cbe09ec0d',
                      developers_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/developers',
                      managers_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/managers',
                      auditors_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/auditors',
                      apps_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/apps',
                      routes_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/routes',
                      domains_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/domains',
                      service_instances_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/service_instances',
                      app_events_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/app_events',
                      events_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/events',
                      security_groups_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/security_groups',
                      staging_security_groups_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/staging_security_groups'
                    }
                  },
                  apps_url: '/v2/routes/f8b6cbbe-7b0b-49f8-8a52-f05360e321eb/apps',
                  route_mappings_url: '/v2/routes/f8b6cbbe-7b0b-49f8-8a52-f05360e321eb/route_mappings'
                }
              }
            ],
            events_url: '/v2/apps/92abdead-5c38-46fd-a4c7-6fc8a0ff8176/events',
            service_bindings_url: '/v2/apps/92abdead-5c38-46fd-a4c7-6fc8a0ff8176/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/92abdead-5c38-46fd-a4c7-6fc8a0ff8176/route_mappings',
            guid: '92abdead-5c38-46fd-a4c7-6fc8a0ff8176',
            cfGuid: '663a363e-1faf-4359-ac96-b8c24ec1a4ab'
          },
          metadata: {
            guid: '92abdead-5c38-46fd-a4c7-6fc8a0ff8176',
            url: '/v2/apps/92abdead-5c38-46fd-a4c7-6fc8a0ff8176',
            created_at: '2017-10-05T10:49:45Z',
            updated_at: '2017-10-05T10:49:48Z'
          }
        },
        '6141d1b5-1f9c-4fec-8511-3ad2f6ab71b0': {
          entity: {
            name: 'asdasd',
            production: false,
            space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_guid: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: '432e6ded-602b-4d7a-988b-d386f735afea',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
            space: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_url: '/v2/stacks/97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            stack: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            routes_url: '/v2/apps/6141d1b5-1f9c-4fec-8511-3ad2f6ab71b0/routes',
            routes: [
              {
                metadata: {
                  guid: 'cbe6d4a5-dbf9-458e-a360-f4e3a295ec5f',
                  url: '/v2/routes/cbe6d4a5-dbf9-458e-a360-f4e3a295ec5f',
                  created_at: '2017-10-05T10:51:54Z',
                  updated_at: '2017-10-05T10:51:54Z'
                },
                entity: {
                  host: 'asdasd',
                  path: '',
                  domain_guid: '44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  domain: {
                    metadata: {
                      guid: '44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                      url: '/v2/shared_domains/44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                      created_at: '2017-09-22T15:25:53Z',
                      updated_at: '2017-09-22T15:25:53Z'
                    },
                    entity: {
                      name: 'capbristol.com',
                      router_group_guid: null,
                      router_group_type: null
                    }
                  },
                  space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
                  space: {
                    metadata: {
                      guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
                      url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
                      created_at: '2017-09-22T15:27:48Z',
                      updated_at: '2017-09-22T15:27:48Z'
                    },
                    entity: {
                      name: 'e2e',
                      organization_guid: '22feecef-df39-4ae0-a56a-098cbe09ec0d',
                      space_quota_definition_guid: null,
                      isolation_segment_guid: null,
                      allow_ssh: true,
                      organization_url: '/v2/organizations/22feecef-df39-4ae0-a56a-098cbe09ec0d',
                      developers_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/developers',
                      managers_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/managers',
                      auditors_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/auditors',
                      apps_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/apps',
                      routes_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/routes',
                      domains_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/domains',
                      service_instances_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/service_instances',
                      app_events_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/app_events',
                      events_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/events',
                      security_groups_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/security_groups',
                      staging_security_groups_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/staging_security_groups'
                    }
                  },
                  apps_url: '/v2/routes/cbe6d4a5-dbf9-458e-a360-f4e3a295ec5f/apps',
                  route_mappings_url: '/v2/routes/cbe6d4a5-dbf9-458e-a360-f4e3a295ec5f/route_mappings'
                }
              }
            ],
            events_url: '/v2/apps/6141d1b5-1f9c-4fec-8511-3ad2f6ab71b0/events',
            service_bindings_url: '/v2/apps/6141d1b5-1f9c-4fec-8511-3ad2f6ab71b0/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/6141d1b5-1f9c-4fec-8511-3ad2f6ab71b0/route_mappings',
            guid: '6141d1b5-1f9c-4fec-8511-3ad2f6ab71b0',
            cfGuid: '663a363e-1faf-4359-ac96-b8c24ec1a4ab'
          },
          metadata: {
            guid: '6141d1b5-1f9c-4fec-8511-3ad2f6ab71b0',
            url: '/v2/apps/6141d1b5-1f9c-4fec-8511-3ad2f6ab71b0',
            created_at: '2017-10-05T10:51:54Z',
            updated_at: '2017-10-05T10:51:55Z'
          }
        },
        '10e5e215-dfc1-4bad-a3bf-5a191e5466b0': {
          entity: {
            name: 'Test1234asdasd3',
            production: false,
            space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_guid: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: '44055e81-920f-408d-8248-7d0f21a89c22',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
            space: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_url: '/v2/stacks/97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            stack: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            routes_url: '/v2/apps/10e5e215-dfc1-4bad-a3bf-5a191e5466b0/routes',
            routes: [
              {
                metadata: {
                  guid: 'ee0f7c0a-3ca0-48a5-b760-c0df87ab49f4',
                  url: '/v2/routes/ee0f7c0a-3ca0-48a5-b760-c0df87ab49f4',
                  created_at: '2017-10-05T10:53:21Z',
                  updated_at: '2017-10-05T10:53:21Z'
                },
                entity: {
                  host: 'test1234asdasd3',
                  path: '',
                  domain_guid: '44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  domain: {
                    metadata: {
                      guid: '44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                      url: '/v2/shared_domains/44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                      created_at: '2017-09-22T15:25:53Z',
                      updated_at: '2017-09-22T15:25:53Z'
                    },
                    entity: {
                      name: 'capbristol.com',
                      router_group_guid: null,
                      router_group_type: null
                    }
                  },
                  space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
                  space: {
                    metadata: {
                      guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
                      url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
                      created_at: '2017-09-22T15:27:48Z',
                      updated_at: '2017-09-22T15:27:48Z'
                    },
                    entity: {
                      name: 'e2e',
                      organization_guid: '22feecef-df39-4ae0-a56a-098cbe09ec0d',
                      space_quota_definition_guid: null,
                      isolation_segment_guid: null,
                      allow_ssh: true,
                      organization_url: '/v2/organizations/22feecef-df39-4ae0-a56a-098cbe09ec0d',
                      developers_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/developers',
                      managers_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/managers',
                      auditors_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/auditors',
                      apps_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/apps',
                      routes_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/routes',
                      domains_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/domains',
                      service_instances_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/service_instances',
                      app_events_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/app_events',
                      events_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/events',
                      security_groups_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/security_groups',
                      staging_security_groups_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/staging_security_groups'
                    }
                  },
                  apps_url: '/v2/routes/ee0f7c0a-3ca0-48a5-b760-c0df87ab49f4/apps',
                  route_mappings_url: '/v2/routes/ee0f7c0a-3ca0-48a5-b760-c0df87ab49f4/route_mappings'
                }
              }
            ],
            events_url: '/v2/apps/10e5e215-dfc1-4bad-a3bf-5a191e5466b0/events',
            service_bindings_url: '/v2/apps/10e5e215-dfc1-4bad-a3bf-5a191e5466b0/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/10e5e215-dfc1-4bad-a3bf-5a191e5466b0/route_mappings',
            guid: '10e5e215-dfc1-4bad-a3bf-5a191e5466b0',
            cfGuid: '663a363e-1faf-4359-ac96-b8c24ec1a4ab'
          },
          metadata: {
            guid: '10e5e215-dfc1-4bad-a3bf-5a191e5466b0',
            url: '/v2/apps/10e5e215-dfc1-4bad-a3bf-5a191e5466b0',
            created_at: '2017-10-05T10:53:16Z',
            updated_at: '2017-10-05T10:53:30Z'
          }
        },
        'f06af5ef-bbf9-4285-a72a-67598cb62708': {
          entity: {
            name: 'Test1234asdasd2',
            production: false,
            space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_guid: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: '05f99eb2-49e0-4115-aa0e-d0229c9c8f21',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
            space: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_url: '/v2/stacks/97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            stack: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            routes_url: '/v2/apps/f06af5ef-bbf9-4285-a72a-67598cb62708/routes',
            routes: [
              {
                metadata: {
                  guid: '70498846-7652-47dd-944f-b34f8b986968',
                  url: '/v2/routes/70498846-7652-47dd-944f-b34f8b986968',
                  created_at: '2017-10-05T10:57:17Z',
                  updated_at: '2017-10-05T10:57:17Z'
                },
                entity: {
                  host: 'test1234asdasd2',
                  path: '',
                  domain_guid: '44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  domain: {
                    metadata: {
                      guid: '44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                      url: '/v2/shared_domains/44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                      created_at: '2017-09-22T15:25:53Z',
                      updated_at: '2017-09-22T15:25:53Z'
                    },
                    entity: {
                      name: 'capbristol.com',
                      router_group_guid: null,
                      router_group_type: null
                    }
                  },
                  space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
                  space: {
                    metadata: {
                      guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
                      url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
                      created_at: '2017-09-22T15:27:48Z',
                      updated_at: '2017-09-22T15:27:48Z'
                    },
                    entity: {
                      name: 'e2e',
                      organization_guid: '22feecef-df39-4ae0-a56a-098cbe09ec0d',
                      space_quota_definition_guid: null,
                      isolation_segment_guid: null,
                      allow_ssh: true,
                      organization_url: '/v2/organizations/22feecef-df39-4ae0-a56a-098cbe09ec0d',
                      developers_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/developers',
                      managers_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/managers',
                      auditors_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/auditors',
                      apps_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/apps',
                      routes_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/routes',
                      domains_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/domains',
                      service_instances_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/service_instances',
                      app_events_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/app_events',
                      events_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/events',
                      security_groups_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/security_groups',
                      staging_security_groups_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/staging_security_groups'
                    }
                  },
                  apps_url: '/v2/routes/70498846-7652-47dd-944f-b34f8b986968/apps',
                  route_mappings_url: '/v2/routes/70498846-7652-47dd-944f-b34f8b986968/route_mappings'
                }
              }
            ],
            events_url: '/v2/apps/f06af5ef-bbf9-4285-a72a-67598cb62708/events',
            service_bindings_url: '/v2/apps/f06af5ef-bbf9-4285-a72a-67598cb62708/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/f06af5ef-bbf9-4285-a72a-67598cb62708/route_mappings',
            guid: 'f06af5ef-bbf9-4285-a72a-67598cb62708',
            cfGuid: '663a363e-1faf-4359-ac96-b8c24ec1a4ab'
          },
          metadata: {
            guid: 'f06af5ef-bbf9-4285-a72a-67598cb62708',
            url: '/v2/apps/f06af5ef-bbf9-4285-a72a-67598cb62708',
            created_at: '2017-10-05T10:57:17Z',
            updated_at: '2017-10-05T10:57:18Z'
          }
        },
        '6f82f89d-7900-4cf8-8e91-50c78f968628': {
          entity: {
            name: '5',
            production: false,
            space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_guid: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: 'be20ef54-f3fb-4ee9-a672-3cda961a4365',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
            space: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_url: '/v2/stacks/97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            stack: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            routes_url: '/v2/apps/6f82f89d-7900-4cf8-8e91-50c78f968628/routes',
            routes: [],
            events_url: '/v2/apps/6f82f89d-7900-4cf8-8e91-50c78f968628/events',
            service_bindings_url: '/v2/apps/6f82f89d-7900-4cf8-8e91-50c78f968628/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/6f82f89d-7900-4cf8-8e91-50c78f968628/route_mappings',
            guid: '6f82f89d-7900-4cf8-8e91-50c78f968628',
            cfGuid: '663a363e-1faf-4359-ac96-b8c24ec1a4ab'
          },
          metadata: {
            guid: '6f82f89d-7900-4cf8-8e91-50c78f968628',
            url: '/v2/apps/6f82f89d-7900-4cf8-8e91-50c78f968628',
            created_at: '2017-10-05T10:58:54Z',
            updated_at: '2017-10-05T10:58:54Z'
          }
        },
        '750f7bc2-c3f6-4bee-a743-9ad92a2df704': {
          entity: {
            name: '6',
            production: false,
            space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_guid: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: 'f03071b6-ccd9-462e-b7af-5af837343677',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
            space: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_url: '/v2/stacks/97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            stack: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            routes_url: '/v2/apps/750f7bc2-c3f6-4bee-a743-9ad92a2df704/routes',
            routes: [
              {
                metadata: {
                  guid: '7ea0fa0f-d7e9-499b-a0fa-87dd69811f20',
                  url: '/v2/routes/7ea0fa0f-d7e9-499b-a0fa-87dd69811f20',
                  created_at: '2017-10-05T11:00:20Z',
                  updated_at: '2017-10-05T11:00:20Z'
                },
                entity: {
                  host: '6',
                  path: '',
                  domain_guid: '44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  domain: {
                    metadata: {
                      guid: '44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                      url: '/v2/shared_domains/44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                      created_at: '2017-09-22T15:25:53Z',
                      updated_at: '2017-09-22T15:25:53Z'
                    },
                    entity: {
                      name: 'capbristol.com',
                      router_group_guid: null,
                      router_group_type: null
                    }
                  },
                  space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
                  space: {
                    metadata: {
                      guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
                      url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
                      created_at: '2017-09-22T15:27:48Z',
                      updated_at: '2017-09-22T15:27:48Z'
                    },
                    entity: {
                      name: 'e2e',
                      organization_guid: '22feecef-df39-4ae0-a56a-098cbe09ec0d',
                      space_quota_definition_guid: null,
                      isolation_segment_guid: null,
                      allow_ssh: true,
                      organization_url: '/v2/organizations/22feecef-df39-4ae0-a56a-098cbe09ec0d',
                      developers_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/developers',
                      managers_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/managers',
                      auditors_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/auditors',
                      apps_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/apps',
                      routes_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/routes',
                      domains_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/domains',
                      service_instances_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/service_instances',
                      app_events_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/app_events',
                      events_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/events',
                      security_groups_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/security_groups',
                      staging_security_groups_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/staging_security_groups'
                    }
                  },
                  apps_url: '/v2/routes/7ea0fa0f-d7e9-499b-a0fa-87dd69811f20/apps',
                  route_mappings_url: '/v2/routes/7ea0fa0f-d7e9-499b-a0fa-87dd69811f20/route_mappings'
                }
              }
            ],
            events_url: '/v2/apps/750f7bc2-c3f6-4bee-a743-9ad92a2df704/events',
            service_bindings_url: '/v2/apps/750f7bc2-c3f6-4bee-a743-9ad92a2df704/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/750f7bc2-c3f6-4bee-a743-9ad92a2df704/route_mappings',
            guid: '750f7bc2-c3f6-4bee-a743-9ad92a2df704',
            cfGuid: '663a363e-1faf-4359-ac96-b8c24ec1a4ab'
          },
          metadata: {
            guid: '750f7bc2-c3f6-4bee-a743-9ad92a2df704',
            url: '/v2/apps/750f7bc2-c3f6-4bee-a743-9ad92a2df704',
            created_at: '2017-10-05T11:00:19Z',
            updated_at: '2017-10-05T11:00:56Z'
          }
        },
        'e6697556-a5e2-4d03-88e6-973e1351ed0b': {
          entity: {
            name: '7',
            production: false,
            space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_guid: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: '5370e83e-e530-4699-8b98-1bc30e318531',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
            space: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_url: '/v2/stacks/97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            stack: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            routes_url: '/v2/apps/e6697556-a5e2-4d03-88e6-973e1351ed0b/routes',
            routes: [],
            events_url: '/v2/apps/e6697556-a5e2-4d03-88e6-973e1351ed0b/events',
            service_bindings_url: '/v2/apps/e6697556-a5e2-4d03-88e6-973e1351ed0b/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/e6697556-a5e2-4d03-88e6-973e1351ed0b/route_mappings',
            guid: 'e6697556-a5e2-4d03-88e6-973e1351ed0b',
            cfGuid: '663a363e-1faf-4359-ac96-b8c24ec1a4ab'
          },
          metadata: {
            guid: 'e6697556-a5e2-4d03-88e6-973e1351ed0b',
            url: '/v2/apps/e6697556-a5e2-4d03-88e6-973e1351ed0b',
            created_at: '2017-10-05T11:01:38Z',
            updated_at: '2017-10-05T11:01:38Z'
          }
        },
        '689a218b-1b31-4d49-8766-84573372d77a': {
          entity: {
            name: '8',
            production: false,
            space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_guid: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: '5fa2d384-1cd8-4113-b682-87c148f1f33a',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
            space: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_url: '/v2/stacks/97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            stack: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            routes_url: '/v2/apps/689a218b-1b31-4d49-8766-84573372d77a/routes',
            routes: [],
            events_url: '/v2/apps/689a218b-1b31-4d49-8766-84573372d77a/events',
            service_bindings_url: '/v2/apps/689a218b-1b31-4d49-8766-84573372d77a/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/689a218b-1b31-4d49-8766-84573372d77a/route_mappings',
            guid: '689a218b-1b31-4d49-8766-84573372d77a',
            cfGuid: '663a363e-1faf-4359-ac96-b8c24ec1a4ab'
          },
          metadata: {
            guid: '689a218b-1b31-4d49-8766-84573372d77a',
            url: '/v2/apps/689a218b-1b31-4d49-8766-84573372d77a',
            created_at: '2017-10-05T11:04:19Z',
            updated_at: '2017-10-05T11:04:19Z'
          }
        },
        '0195cbb8-2d1c-4e98-bef7-19287c643ff2': {
          entity: {
            name: 'Test1234asdasd2324',
            production: false,
            space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_guid: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: 'c030c2d6-2b9c-415d-9c3b-239b42b2aae8',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
            space: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_url: '/v2/stacks/97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            stack: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            routes_url: '/v2/apps/0195cbb8-2d1c-4e98-bef7-19287c643ff2/routes',
            routes: [
              {
                metadata: {
                  guid: 'bf6b6813-181b-4392-8ca5-12470648bf5e',
                  url: '/v2/routes/bf6b6813-181b-4392-8ca5-12470648bf5e',
                  created_at: '2017-10-05T11:09:55Z',
                  updated_at: '2017-10-05T11:09:55Z'
                },
                entity: {
                  host: 'test1234asdasd2324',
                  path: '',
                  domain_guid: '44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  domain: {
                    metadata: {
                      guid: '44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                      url: '/v2/shared_domains/44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                      created_at: '2017-09-22T15:25:53Z',
                      updated_at: '2017-09-22T15:25:53Z'
                    },
                    entity: {
                      name: 'capbristol.com',
                      router_group_guid: null,
                      router_group_type: null
                    }
                  },
                  space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
                  space: {
                    metadata: {
                      guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
                      url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
                      created_at: '2017-09-22T15:27:48Z',
                      updated_at: '2017-09-22T15:27:48Z'
                    },
                    entity: {
                      name: 'e2e',
                      organization_guid: '22feecef-df39-4ae0-a56a-098cbe09ec0d',
                      space_quota_definition_guid: null,
                      isolation_segment_guid: null,
                      allow_ssh: true,
                      organization_url: '/v2/organizations/22feecef-df39-4ae0-a56a-098cbe09ec0d',
                      developers_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/developers',
                      managers_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/managers',
                      auditors_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/auditors',
                      apps_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/apps',
                      routes_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/routes',
                      domains_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/domains',
                      service_instances_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/service_instances',
                      app_events_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/app_events',
                      events_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/events',
                      security_groups_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/security_groups',
                      staging_security_groups_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/staging_security_groups'
                    }
                  },
                  apps_url: '/v2/routes/bf6b6813-181b-4392-8ca5-12470648bf5e/apps',
                  route_mappings_url: '/v2/routes/bf6b6813-181b-4392-8ca5-12470648bf5e/route_mappings'
                }
              }
            ],
            events_url: '/v2/apps/0195cbb8-2d1c-4e98-bef7-19287c643ff2/events',
            service_bindings_url: '/v2/apps/0195cbb8-2d1c-4e98-bef7-19287c643ff2/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/0195cbb8-2d1c-4e98-bef7-19287c643ff2/route_mappings',
            guid: '0195cbb8-2d1c-4e98-bef7-19287c643ff2',
            cfGuid: '663a363e-1faf-4359-ac96-b8c24ec1a4ab'
          },
          metadata: {
            guid: '0195cbb8-2d1c-4e98-bef7-19287c643ff2',
            url: '/v2/apps/0195cbb8-2d1c-4e98-bef7-19287c643ff2',
            created_at: '2017-10-05T11:09:54Z',
            updated_at: '2017-10-05T11:09:56Z'
          }
        },
        '876b2f13-38fe-4925-bf3e-e0eccbcbb3a0': {
          entity: {
            name: 'Test1234asdasd988',
            production: false,
            space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_guid: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: '357af30c-45b2-415b-896f-40f729c8dfd5',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
            space: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_url: '/v2/stacks/97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            stack: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            routes_url: '/v2/apps/876b2f13-38fe-4925-bf3e-e0eccbcbb3a0/routes',
            routes: [],
            events_url: '/v2/apps/876b2f13-38fe-4925-bf3e-e0eccbcbb3a0/events',
            service_bindings_url: '/v2/apps/876b2f13-38fe-4925-bf3e-e0eccbcbb3a0/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/876b2f13-38fe-4925-bf3e-e0eccbcbb3a0/route_mappings',
            guid: '876b2f13-38fe-4925-bf3e-e0eccbcbb3a0',
            cfGuid: '663a363e-1faf-4359-ac96-b8c24ec1a4ab'
          },
          metadata: {
            guid: '876b2f13-38fe-4925-bf3e-e0eccbcbb3a0',
            url: '/v2/apps/876b2f13-38fe-4925-bf3e-e0eccbcbb3a0',
            created_at: '2017-10-05T11:16:25Z',
            updated_at: '2017-10-05T11:16:25Z'
          }
        },
        '7ee817ad-770d-41b9-85f7-2a7c05ec7012': {
          entity: {
            name: 'Test1234asdsad123',
            production: false,
            space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_guid: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: 'c7c3e0c8-a43e-4424-a03c-2e2839bb443b',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
            space: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_url: '/v2/stacks/97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            stack: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            routes_url: '/v2/apps/7ee817ad-770d-41b9-85f7-2a7c05ec7012/routes',
            routes: [],
            events_url: '/v2/apps/7ee817ad-770d-41b9-85f7-2a7c05ec7012/events',
            service_bindings_url: '/v2/apps/7ee817ad-770d-41b9-85f7-2a7c05ec7012/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/7ee817ad-770d-41b9-85f7-2a7c05ec7012/route_mappings',
            guid: '7ee817ad-770d-41b9-85f7-2a7c05ec7012',
            cfGuid: '663a363e-1faf-4359-ac96-b8c24ec1a4ab'
          },
          metadata: {
            guid: '7ee817ad-770d-41b9-85f7-2a7c05ec7012',
            url: '/v2/apps/7ee817ad-770d-41b9-85f7-2a7c05ec7012',
            created_at: '2017-10-05T11:22:12Z',
            updated_at: '2017-10-05T11:22:12Z'
          }
        },
        'f6f5db80-c020-430a-ab11-d9fe5dfe925f': {
          entity: {
            name: 'Test1234asdasduyt89',
            production: false,
            space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_guid: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: 'cb7e6bc0-d882-4774-9b7c-5dced80b5b10',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
            space: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_url: '/v2/stacks/97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            stack: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            routes_url: '/v2/apps/f6f5db80-c020-430a-ab11-d9fe5dfe925f/routes',
            routes: [
              {
                metadata: {
                  guid: '9786666c-e1b6-4af5-9b35-30c9e5823d03',
                  url: '/v2/routes/9786666c-e1b6-4af5-9b35-30c9e5823d03',
                  created_at: '2017-10-05T12:19:44Z',
                  updated_at: '2017-10-05T12:19:44Z'
                },
                entity: {
                  host: 'test1234asdasduyt89',
                  path: '',
                  domain_guid: '44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  domain: {
                    metadata: {
                      guid: '44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                      url: '/v2/shared_domains/44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                      created_at: '2017-09-22T15:25:53Z',
                      updated_at: '2017-09-22T15:25:53Z'
                    },
                    entity: {
                      name: 'capbristol.com',
                      router_group_guid: null,
                      router_group_type: null
                    }
                  },
                  space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
                  space: {
                    metadata: {
                      guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
                      url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
                      created_at: '2017-09-22T15:27:48Z',
                      updated_at: '2017-09-22T15:27:48Z'
                    },
                    entity: {
                      name: 'e2e',
                      organization_guid: '22feecef-df39-4ae0-a56a-098cbe09ec0d',
                      space_quota_definition_guid: null,
                      isolation_segment_guid: null,
                      allow_ssh: true,
                      organization_url: '/v2/organizations/22feecef-df39-4ae0-a56a-098cbe09ec0d',
                      developers_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/developers',
                      managers_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/managers',
                      auditors_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/auditors',
                      apps_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/apps',
                      routes_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/routes',
                      domains_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/domains',
                      service_instances_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/service_instances',
                      app_events_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/app_events',
                      events_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/events',
                      security_groups_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/security_groups',
                      staging_security_groups_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/staging_security_groups'
                    }
                  },
                  apps_url: '/v2/routes/9786666c-e1b6-4af5-9b35-30c9e5823d03/apps',
                  route_mappings_url: '/v2/routes/9786666c-e1b6-4af5-9b35-30c9e5823d03/route_mappings'
                }
              }
            ],
            events_url: '/v2/apps/f6f5db80-c020-430a-ab11-d9fe5dfe925f/events',
            service_bindings_url: '/v2/apps/f6f5db80-c020-430a-ab11-d9fe5dfe925f/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/f6f5db80-c020-430a-ab11-d9fe5dfe925f/route_mappings',
            guid: 'f6f5db80-c020-430a-ab11-d9fe5dfe925f',
            cfGuid: '663a363e-1faf-4359-ac96-b8c24ec1a4ab'
          },
          metadata: {
            guid: 'f6f5db80-c020-430a-ab11-d9fe5dfe925f',
            url: '/v2/apps/f6f5db80-c020-430a-ab11-d9fe5dfe925f',
            created_at: '2017-10-05T12:19:44Z',
            updated_at: '2017-10-05T12:19:51Z'
          }
        },
        'b08ea7b4-688e-48d9-a8d9-2d04b06efcdb': {
          entity: {
            name: 'Test1234asdasd87',
            production: false,
            space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_guid: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: '4ce619db-cd4c-452b-af7a-42f7dffab46a',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
            space: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_url: '/v2/stacks/97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            stack: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            routes_url: '/v2/apps/b08ea7b4-688e-48d9-a8d9-2d04b06efcdb/routes',
            routes: [],
            events_url: '/v2/apps/b08ea7b4-688e-48d9-a8d9-2d04b06efcdb/events',
            service_bindings_url: '/v2/apps/b08ea7b4-688e-48d9-a8d9-2d04b06efcdb/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/b08ea7b4-688e-48d9-a8d9-2d04b06efcdb/route_mappings',
            guid: 'b08ea7b4-688e-48d9-a8d9-2d04b06efcdb',
            cfGuid: '663a363e-1faf-4359-ac96-b8c24ec1a4ab'
          },
          metadata: {
            guid: 'b08ea7b4-688e-48d9-a8d9-2d04b06efcdb',
            url: '/v2/apps/b08ea7b4-688e-48d9-a8d9-2d04b06efcdb',
            created_at: '2017-10-05T12:21:38Z',
            updated_at: '2017-10-05T12:21:38Z'
          }
        },
        'ef1c514f-5b19-4ce0-b840-6fe8d5f5bb46': {
          entity: {
            name: 'Test1234asdasd345678',
            production: false,
            space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_guid: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: '96f652e5-9e45-44d7-a76f-96d77544dfbd',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
            space: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_url: '/v2/stacks/97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            stack: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            routes_url: '/v2/apps/ef1c514f-5b19-4ce0-b840-6fe8d5f5bb46/routes',
            routes: [
              {
                metadata: {
                  guid: '88a4aa0d-da85-433e-8a44-1d11a166b6c4',
                  url: '/v2/routes/88a4aa0d-da85-433e-8a44-1d11a166b6c4',
                  created_at: '2017-10-05T12:22:31Z',
                  updated_at: '2017-10-05T12:22:31Z'
                },
                entity: {
                  host: 'test1234asdasd345678',
                  path: '',
                  domain_guid: '44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  domain: {
                    metadata: {
                      guid: '44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                      url: '/v2/shared_domains/44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                      created_at: '2017-09-22T15:25:53Z',
                      updated_at: '2017-09-22T15:25:53Z'
                    },
                    entity: {
                      name: 'capbristol.com',
                      router_group_guid: null,
                      router_group_type: null
                    }
                  },
                  space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
                  space: {
                    metadata: {
                      guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
                      url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
                      created_at: '2017-09-22T15:27:48Z',
                      updated_at: '2017-09-22T15:27:48Z'
                    },
                    entity: {
                      name: 'e2e',
                      organization_guid: '22feecef-df39-4ae0-a56a-098cbe09ec0d',
                      space_quota_definition_guid: null,
                      isolation_segment_guid: null,
                      allow_ssh: true,
                      organization_url: '/v2/organizations/22feecef-df39-4ae0-a56a-098cbe09ec0d',
                      developers_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/developers',
                      managers_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/managers',
                      auditors_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/auditors',
                      apps_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/apps',
                      routes_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/routes',
                      domains_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/domains',
                      service_instances_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/service_instances',
                      app_events_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/app_events',
                      events_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/events',
                      security_groups_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/security_groups',
                      staging_security_groups_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/staging_security_groups'
                    }
                  },
                  apps_url: '/v2/routes/88a4aa0d-da85-433e-8a44-1d11a166b6c4/apps',
                  route_mappings_url: '/v2/routes/88a4aa0d-da85-433e-8a44-1d11a166b6c4/route_mappings'
                }
              }
            ],
            events_url: '/v2/apps/ef1c514f-5b19-4ce0-b840-6fe8d5f5bb46/events',
            service_bindings_url: '/v2/apps/ef1c514f-5b19-4ce0-b840-6fe8d5f5bb46/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/ef1c514f-5b19-4ce0-b840-6fe8d5f5bb46/route_mappings',
            guid: 'ef1c514f-5b19-4ce0-b840-6fe8d5f5bb46',
            cfGuid: '663a363e-1faf-4359-ac96-b8c24ec1a4ab'
          },
          metadata: {
            guid: 'ef1c514f-5b19-4ce0-b840-6fe8d5f5bb46',
            url: '/v2/apps/ef1c514f-5b19-4ce0-b840-6fe8d5f5bb46',
            created_at: '2017-10-05T12:22:31Z',
            updated_at: '2017-10-05T12:22:35Z'
          }
        },
        '0da9d02b-93b4-4828-8058-04ff243f43b9': {
          entity: {
            name: 'Test1234asdasd3456',
            production: false,
            space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_guid: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: '1345d40d-7afa-4c00-b6c3-a01092bca126',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
            space: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_url: '/v2/stacks/97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            stack: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            routes_url: '/v2/apps/0da9d02b-93b4-4828-8058-04ff243f43b9/routes',
            routes: [],
            events_url: '/v2/apps/0da9d02b-93b4-4828-8058-04ff243f43b9/events',
            service_bindings_url: '/v2/apps/0da9d02b-93b4-4828-8058-04ff243f43b9/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/0da9d02b-93b4-4828-8058-04ff243f43b9/route_mappings',
            guid: '0da9d02b-93b4-4828-8058-04ff243f43b9',
            cfGuid: '663a363e-1faf-4359-ac96-b8c24ec1a4ab'
          },
          metadata: {
            guid: '0da9d02b-93b4-4828-8058-04ff243f43b9',
            url: '/v2/apps/0da9d02b-93b4-4828-8058-04ff243f43b9',
            created_at: '2017-10-05T12:23:26Z',
            updated_at: '2017-10-05T12:23:26Z'
          }
        },
        'e2a17f54-d0c3-4660-919b-b1ff585e6c05': {
          entity: {
            name: 'sadasd',
            production: false,
            space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_guid: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: 'fdf2bd7b-4f0f-442f-aa04-f158ac78c887',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
            space: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_url: '/v2/stacks/97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            stack: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            routes_url: '/v2/apps/e2a17f54-d0c3-4660-919b-b1ff585e6c05/routes',
            routes: [
              {
                metadata: {
                  guid: 'f09d1299-46fc-421f-858f-d994e7ca751b',
                  url: '/v2/routes/f09d1299-46fc-421f-858f-d994e7ca751b',
                  created_at: '2017-10-05T12:25:52Z',
                  updated_at: '2017-10-05T12:25:52Z'
                },
                entity: {
                  host: 'sadasd',
                  path: '',
                  domain_guid: '44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  domain: {
                    metadata: {
                      guid: '44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                      url: '/v2/shared_domains/44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                      created_at: '2017-09-22T15:25:53Z',
                      updated_at: '2017-09-22T15:25:53Z'
                    },
                    entity: {
                      name: 'capbristol.com',
                      router_group_guid: null,
                      router_group_type: null
                    }
                  },
                  space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
                  space: {
                    metadata: {
                      guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
                      url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
                      created_at: '2017-09-22T15:27:48Z',
                      updated_at: '2017-09-22T15:27:48Z'
                    },
                    entity: {
                      name: 'e2e',
                      organization_guid: '22feecef-df39-4ae0-a56a-098cbe09ec0d',
                      space_quota_definition_guid: null,
                      isolation_segment_guid: null,
                      allow_ssh: true,
                      organization_url: '/v2/organizations/22feecef-df39-4ae0-a56a-098cbe09ec0d',
                      developers_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/developers',
                      managers_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/managers',
                      auditors_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/auditors',
                      apps_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/apps',
                      routes_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/routes',
                      domains_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/domains',
                      service_instances_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/service_instances',
                      app_events_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/app_events',
                      events_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/events',
                      security_groups_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/security_groups',
                      staging_security_groups_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/staging_security_groups'
                    }
                  },
                  apps_url: '/v2/routes/f09d1299-46fc-421f-858f-d994e7ca751b/apps',
                  route_mappings_url: '/v2/routes/f09d1299-46fc-421f-858f-d994e7ca751b/route_mappings'
                }
              }
            ],
            events_url: '/v2/apps/e2a17f54-d0c3-4660-919b-b1ff585e6c05/events',
            service_bindings_url: '/v2/apps/e2a17f54-d0c3-4660-919b-b1ff585e6c05/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/e2a17f54-d0c3-4660-919b-b1ff585e6c05/route_mappings',
            guid: 'e2a17f54-d0c3-4660-919b-b1ff585e6c05',
            cfGuid: '663a363e-1faf-4359-ac96-b8c24ec1a4ab'
          },
          metadata: {
            guid: 'e2a17f54-d0c3-4660-919b-b1ff585e6c05',
            url: '/v2/apps/e2a17f54-d0c3-4660-919b-b1ff585e6c05',
            created_at: '2017-10-05T12:25:51Z',
            updated_at: '2017-10-05T12:25:53Z'
          }
        },
        'a4e2cbfd-d11e-4b5f-a5f5-3739dfdc7d1d': {
          entity: {
            name: 'asfdsfadsf',
            production: false,
            space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_guid: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: '145c98ff-ace9-4034-81e5-307eecec49a4',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
            space: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_url: '/v2/stacks/97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            stack: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            routes_url: '/v2/apps/a4e2cbfd-d11e-4b5f-a5f5-3739dfdc7d1d/routes',
            routes: [
              {
                metadata: {
                  guid: 'fbc54341-6ab4-4e7c-b4d2-122f435c411c',
                  url: '/v2/routes/fbc54341-6ab4-4e7c-b4d2-122f435c411c',
                  created_at: '2017-10-05T12:35:18Z',
                  updated_at: '2017-10-05T12:35:18Z'
                },
                entity: {
                  host: 'asfdsfadsf',
                  path: '',
                  domain_guid: '44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  domain: {
                    metadata: {
                      guid: '44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                      url: '/v2/shared_domains/44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                      created_at: '2017-09-22T15:25:53Z',
                      updated_at: '2017-09-22T15:25:53Z'
                    },
                    entity: {
                      name: 'capbristol.com',
                      router_group_guid: null,
                      router_group_type: null
                    }
                  },
                  space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
                  space: {
                    metadata: {
                      guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
                      url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
                      created_at: '2017-09-22T15:27:48Z',
                      updated_at: '2017-09-22T15:27:48Z'
                    },
                    entity: {
                      name: 'e2e',
                      organization_guid: '22feecef-df39-4ae0-a56a-098cbe09ec0d',
                      space_quota_definition_guid: null,
                      isolation_segment_guid: null,
                      allow_ssh: true,
                      organization_url: '/v2/organizations/22feecef-df39-4ae0-a56a-098cbe09ec0d',
                      developers_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/developers',
                      managers_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/managers',
                      auditors_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/auditors',
                      apps_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/apps',
                      routes_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/routes',
                      domains_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/domains',
                      service_instances_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/service_instances',
                      app_events_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/app_events',
                      events_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/events',
                      security_groups_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/security_groups',
                      staging_security_groups_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/staging_security_groups'
                    }
                  },
                  apps_url: '/v2/routes/fbc54341-6ab4-4e7c-b4d2-122f435c411c/apps',
                  route_mappings_url: '/v2/routes/fbc54341-6ab4-4e7c-b4d2-122f435c411c/route_mappings'
                }
              }
            ],
            events_url: '/v2/apps/a4e2cbfd-d11e-4b5f-a5f5-3739dfdc7d1d/events',
            service_bindings_url: '/v2/apps/a4e2cbfd-d11e-4b5f-a5f5-3739dfdc7d1d/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/a4e2cbfd-d11e-4b5f-a5f5-3739dfdc7d1d/route_mappings',
            guid: 'a4e2cbfd-d11e-4b5f-a5f5-3739dfdc7d1d',
            cfGuid: '663a363e-1faf-4359-ac96-b8c24ec1a4ab'
          },
          metadata: {
            guid: 'a4e2cbfd-d11e-4b5f-a5f5-3739dfdc7d1d',
            url: '/v2/apps/a4e2cbfd-d11e-4b5f-a5f5-3739dfdc7d1d',
            created_at: '2017-10-05T12:35:18Z',
            updated_at: '2017-10-05T12:35:20Z'
          }
        },
        'a222dcfe-8a0d-4207-b049-14de5da5b0ae': {
          entity: {
            name: '89',
            production: false,
            space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_guid: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: '7047eb9e-46cb-4f8a-939d-cbdbd002f565',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
            space: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_url: '/v2/stacks/97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            stack: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            routes_url: '/v2/apps/a222dcfe-8a0d-4207-b049-14de5da5b0ae/routes',
            routes: [
              {
                metadata: {
                  guid: '8a322b76-0c36-488b-9808-0bd3d0dc4247',
                  url: '/v2/routes/8a322b76-0c36-488b-9808-0bd3d0dc4247',
                  created_at: '2017-10-05T12:38:37Z',
                  updated_at: '2017-10-05T12:38:37Z'
                },
                entity: {
                  host: '89',
                  path: '',
                  domain_guid: '44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  domain: {
                    metadata: {
                      guid: '44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                      url: '/v2/shared_domains/44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                      created_at: '2017-09-22T15:25:53Z',
                      updated_at: '2017-09-22T15:25:53Z'
                    },
                    entity: {
                      name: 'capbristol.com',
                      router_group_guid: null,
                      router_group_type: null
                    }
                  },
                  space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
                  space: {
                    metadata: {
                      guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
                      url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
                      created_at: '2017-09-22T15:27:48Z',
                      updated_at: '2017-09-22T15:27:48Z'
                    },
                    entity: {
                      name: 'e2e',
                      organization_guid: '22feecef-df39-4ae0-a56a-098cbe09ec0d',
                      space_quota_definition_guid: null,
                      isolation_segment_guid: null,
                      allow_ssh: true,
                      organization_url: '/v2/organizations/22feecef-df39-4ae0-a56a-098cbe09ec0d',
                      developers_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/developers',
                      managers_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/managers',
                      auditors_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/auditors',
                      apps_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/apps',
                      routes_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/routes',
                      domains_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/domains',
                      service_instances_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/service_instances',
                      app_events_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/app_events',
                      events_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/events',
                      security_groups_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/security_groups',
                      staging_security_groups_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/staging_security_groups'
                    }
                  },
                  apps_url: '/v2/routes/8a322b76-0c36-488b-9808-0bd3d0dc4247/apps',
                  route_mappings_url: '/v2/routes/8a322b76-0c36-488b-9808-0bd3d0dc4247/route_mappings'
                }
              }
            ],
            events_url: '/v2/apps/a222dcfe-8a0d-4207-b049-14de5da5b0ae/events',
            service_bindings_url: '/v2/apps/a222dcfe-8a0d-4207-b049-14de5da5b0ae/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/a222dcfe-8a0d-4207-b049-14de5da5b0ae/route_mappings',
            guid: 'a222dcfe-8a0d-4207-b049-14de5da5b0ae',
            cfGuid: '663a363e-1faf-4359-ac96-b8c24ec1a4ab'
          },
          metadata: {
            guid: 'a222dcfe-8a0d-4207-b049-14de5da5b0ae',
            url: '/v2/apps/a222dcfe-8a0d-4207-b049-14de5da5b0ae',
            created_at: '2017-10-05T12:38:37Z',
            updated_at: '2017-10-05T12:38:38Z'
          }
        },
        'aa33e150-c962-4982-a602-d9a149ddc61b': {
          entity: {
            name: 'dfg43',
            production: false,
            space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_guid: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: 'ddd3f5a9-d14c-4cd2-a921-9a2895eaa09a',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
            space: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_url: '/v2/stacks/97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            stack: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            routes_url: '/v2/apps/aa33e150-c962-4982-a602-d9a149ddc61b/routes',
            routes: [],
            events_url: '/v2/apps/aa33e150-c962-4982-a602-d9a149ddc61b/events',
            service_bindings_url: '/v2/apps/aa33e150-c962-4982-a602-d9a149ddc61b/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/aa33e150-c962-4982-a602-d9a149ddc61b/route_mappings',
            guid: 'aa33e150-c962-4982-a602-d9a149ddc61b',
            cfGuid: '663a363e-1faf-4359-ac96-b8c24ec1a4ab'
          },
          metadata: {
            guid: 'aa33e150-c962-4982-a602-d9a149ddc61b',
            url: '/v2/apps/aa33e150-c962-4982-a602-d9a149ddc61b',
            created_at: '2017-10-05T12:42:59Z',
            updated_at: '2017-10-05T12:42:59Z'
          }
        },
        '921aefc2-0bbc-4d8b-a438-1cc6dd6673e1': {
          entity: {
            name: '876543ertfghbn',
            production: false,
            space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_guid: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: '2f236105-0b48-4033-a367-e01091260334',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
            space: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_url: '/v2/stacks/97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            stack: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            routes_url: '/v2/apps/921aefc2-0bbc-4d8b-a438-1cc6dd6673e1/routes',
            routes: [
              {
                metadata: {
                  guid: 'badb9b62-261f-40ac-9902-391d45822577',
                  url: '/v2/routes/badb9b62-261f-40ac-9902-391d45822577',
                  created_at: '2017-10-05T12:45:46Z',
                  updated_at: '2017-10-05T12:45:46Z'
                },
                entity: {
                  host: '876543ertfghbn',
                  path: '',
                  domain_guid: '44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  domain: {
                    metadata: {
                      guid: '44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                      url: '/v2/shared_domains/44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                      created_at: '2017-09-22T15:25:53Z',
                      updated_at: '2017-09-22T15:25:53Z'
                    },
                    entity: {
                      name: 'capbristol.com',
                      router_group_guid: null,
                      router_group_type: null
                    }
                  },
                  space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
                  space: {
                    metadata: {
                      guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
                      url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
                      created_at: '2017-09-22T15:27:48Z',
                      updated_at: '2017-09-22T15:27:48Z'
                    },
                    entity: {
                      name: 'e2e',
                      organization_guid: '22feecef-df39-4ae0-a56a-098cbe09ec0d',
                      space_quota_definition_guid: null,
                      isolation_segment_guid: null,
                      allow_ssh: true,
                      organization_url: '/v2/organizations/22feecef-df39-4ae0-a56a-098cbe09ec0d',
                      developers_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/developers',
                      managers_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/managers',
                      auditors_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/auditors',
                      apps_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/apps',
                      routes_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/routes',
                      domains_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/domains',
                      service_instances_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/service_instances',
                      app_events_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/app_events',
                      events_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/events',
                      security_groups_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/security_groups',
                      staging_security_groups_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/staging_security_groups'
                    }
                  },
                  apps_url: '/v2/routes/badb9b62-261f-40ac-9902-391d45822577/apps',
                  route_mappings_url: '/v2/routes/badb9b62-261f-40ac-9902-391d45822577/route_mappings'
                }
              }
            ],
            events_url: '/v2/apps/921aefc2-0bbc-4d8b-a438-1cc6dd6673e1/events',
            service_bindings_url: '/v2/apps/921aefc2-0bbc-4d8b-a438-1cc6dd6673e1/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/921aefc2-0bbc-4d8b-a438-1cc6dd6673e1/route_mappings',
            guid: '921aefc2-0bbc-4d8b-a438-1cc6dd6673e1',
            cfGuid: '663a363e-1faf-4359-ac96-b8c24ec1a4ab'
          },
          metadata: {
            guid: '921aefc2-0bbc-4d8b-a438-1cc6dd6673e1',
            url: '/v2/apps/921aefc2-0bbc-4d8b-a438-1cc6dd6673e1',
            created_at: '2017-10-05T12:45:45Z',
            updated_at: '2017-10-05T12:45:47Z'
          }
        },
        '197bef61-1a81-44ed-8d96-028a88baa4b5': {
          entity: {
            name: 'Test1234asdasd87654',
            production: false,
            space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_guid: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: 'be499b2d-6257-4772-9a2b-41dc85ed6cda',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
            space: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_url: '/v2/stacks/97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            stack: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            routes_url: '/v2/apps/197bef61-1a81-44ed-8d96-028a88baa4b5/routes',
            routes: [
              {
                metadata: {
                  guid: 'b3e73ecd-6648-4db9-868f-1e150b37a4e1',
                  url: '/v2/routes/b3e73ecd-6648-4db9-868f-1e150b37a4e1',
                  created_at: '2017-10-05T12:46:39Z',
                  updated_at: '2017-10-05T12:46:39Z'
                },
                entity: {
                  host: 'test1234asdasd87654',
                  path: '',
                  domain_guid: '44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  domain: {
                    metadata: {
                      guid: '44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                      url: '/v2/shared_domains/44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                      created_at: '2017-09-22T15:25:53Z',
                      updated_at: '2017-09-22T15:25:53Z'
                    },
                    entity: {
                      name: 'capbristol.com',
                      router_group_guid: null,
                      router_group_type: null
                    }
                  },
                  space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
                  space: {
                    metadata: {
                      guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
                      url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
                      created_at: '2017-09-22T15:27:48Z',
                      updated_at: '2017-09-22T15:27:48Z'
                    },
                    entity: {
                      name: 'e2e',
                      organization_guid: '22feecef-df39-4ae0-a56a-098cbe09ec0d',
                      space_quota_definition_guid: null,
                      isolation_segment_guid: null,
                      allow_ssh: true,
                      organization_url: '/v2/organizations/22feecef-df39-4ae0-a56a-098cbe09ec0d',
                      developers_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/developers',
                      managers_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/managers',
                      auditors_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/auditors',
                      apps_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/apps',
                      routes_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/routes',
                      domains_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/domains',
                      service_instances_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/service_instances',
                      app_events_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/app_events',
                      events_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/events',
                      security_groups_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/security_groups',
                      staging_security_groups_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/staging_security_groups'
                    }
                  },
                  apps_url: '/v2/routes/b3e73ecd-6648-4db9-868f-1e150b37a4e1/apps',
                  route_mappings_url: '/v2/routes/b3e73ecd-6648-4db9-868f-1e150b37a4e1/route_mappings'
                }
              }
            ],
            events_url: '/v2/apps/197bef61-1a81-44ed-8d96-028a88baa4b5/events',
            service_bindings_url: '/v2/apps/197bef61-1a81-44ed-8d96-028a88baa4b5/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/197bef61-1a81-44ed-8d96-028a88baa4b5/route_mappings',
            guid: '197bef61-1a81-44ed-8d96-028a88baa4b5',
            cfGuid: '663a363e-1faf-4359-ac96-b8c24ec1a4ab'
          },
          metadata: {
            guid: '197bef61-1a81-44ed-8d96-028a88baa4b5',
            url: '/v2/apps/197bef61-1a81-44ed-8d96-028a88baa4b5',
            created_at: '2017-10-05T12:46:39Z',
            updated_at: '2017-10-05T12:46:40Z'
          }
        },
        'c73943a7-6e56-423b-b0c2-d5720f8ef9fc': {
          entity: {
            name: 'Test1234asdsad9876',
            production: false,
            space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_guid: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: 'd9cb45eb-fcfb-45d8-baae-92907f3c5b2f',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
            space: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_url: '/v2/stacks/97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            stack: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            routes_url: '/v2/apps/c73943a7-6e56-423b-b0c2-d5720f8ef9fc/routes',
            routes: [
              {
                metadata: {
                  guid: '483a3d25-3ece-4375-80a0-b35fd441a5c4',
                  url: '/v2/routes/483a3d25-3ece-4375-80a0-b35fd441a5c4',
                  created_at: '2017-10-05T12:48:03Z',
                  updated_at: '2017-10-05T12:48:03Z'
                },
                entity: {
                  host: 'test1234asdsad9876',
                  path: '',
                  domain_guid: '44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  domain: {
                    metadata: {
                      guid: '44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                      url: '/v2/shared_domains/44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                      created_at: '2017-09-22T15:25:53Z',
                      updated_at: '2017-09-22T15:25:53Z'
                    },
                    entity: {
                      name: 'capbristol.com',
                      router_group_guid: null,
                      router_group_type: null
                    }
                  },
                  space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
                  space: {
                    metadata: {
                      guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
                      url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
                      created_at: '2017-09-22T15:27:48Z',
                      updated_at: '2017-09-22T15:27:48Z'
                    },
                    entity: {
                      name: 'e2e',
                      organization_guid: '22feecef-df39-4ae0-a56a-098cbe09ec0d',
                      space_quota_definition_guid: null,
                      isolation_segment_guid: null,
                      allow_ssh: true,
                      organization_url: '/v2/organizations/22feecef-df39-4ae0-a56a-098cbe09ec0d',
                      developers_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/developers',
                      managers_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/managers',
                      auditors_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/auditors',
                      apps_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/apps',
                      routes_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/routes',
                      domains_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/domains',
                      service_instances_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/service_instances',
                      app_events_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/app_events',
                      events_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/events',
                      security_groups_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/security_groups',
                      staging_security_groups_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/staging_security_groups'
                    }
                  },
                  apps_url: '/v2/routes/483a3d25-3ece-4375-80a0-b35fd441a5c4/apps',
                  route_mappings_url: '/v2/routes/483a3d25-3ece-4375-80a0-b35fd441a5c4/route_mappings'
                }
              }
            ],
            events_url: '/v2/apps/c73943a7-6e56-423b-b0c2-d5720f8ef9fc/events',
            service_bindings_url: '/v2/apps/c73943a7-6e56-423b-b0c2-d5720f8ef9fc/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/c73943a7-6e56-423b-b0c2-d5720f8ef9fc/route_mappings',
            guid: 'c73943a7-6e56-423b-b0c2-d5720f8ef9fc',
            cfGuid: '663a363e-1faf-4359-ac96-b8c24ec1a4ab'
          },
          metadata: {
            guid: 'c73943a7-6e56-423b-b0c2-d5720f8ef9fc',
            url: '/v2/apps/c73943a7-6e56-423b-b0c2-d5720f8ef9fc',
            created_at: '2017-10-05T12:48:03Z',
            updated_at: '2017-10-05T12:48:04Z'
          }
        },
        '02325b75-1199-4269-ba0a-8366a64b91af': {
          entity: {
            name: 'Test1234asdasdkjhygtfdsx',
            production: false,
            space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_guid: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: '481b3ae5-1bcd-4c14-9d59-63270de434bb',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
            space: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_url: '/v2/stacks/97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            stack: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            routes_url: '/v2/apps/02325b75-1199-4269-ba0a-8366a64b91af/routes',
            routes: [
              {
                metadata: {
                  guid: 'cbfa3b22-9fc7-45fb-ae82-48282d38775d',
                  url: '/v2/routes/cbfa3b22-9fc7-45fb-ae82-48282d38775d',
                  created_at: '2017-10-05T13:03:53Z',
                  updated_at: '2017-10-05T13:03:53Z'
                },
                entity: {
                  host: 'test1234asdasdkjhygtfdsx',
                  path: '',
                  domain_guid: '44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  domain: {
                    metadata: {
                      guid: '44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                      url: '/v2/shared_domains/44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                      created_at: '2017-09-22T15:25:53Z',
                      updated_at: '2017-09-22T15:25:53Z'
                    },
                    entity: {
                      name: 'capbristol.com',
                      router_group_guid: null,
                      router_group_type: null
                    }
                  },
                  space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
                  space: {
                    metadata: {
                      guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
                      url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
                      created_at: '2017-09-22T15:27:48Z',
                      updated_at: '2017-09-22T15:27:48Z'
                    },
                    entity: {
                      name: 'e2e',
                      organization_guid: '22feecef-df39-4ae0-a56a-098cbe09ec0d',
                      space_quota_definition_guid: null,
                      isolation_segment_guid: null,
                      allow_ssh: true,
                      organization_url: '/v2/organizations/22feecef-df39-4ae0-a56a-098cbe09ec0d',
                      developers_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/developers',
                      managers_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/managers',
                      auditors_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/auditors',
                      apps_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/apps',
                      routes_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/routes',
                      domains_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/domains',
                      service_instances_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/service_instances',
                      app_events_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/app_events',
                      events_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/events',
                      security_groups_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/security_groups',
                      staging_security_groups_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/staging_security_groups'
                    }
                  },
                  apps_url: '/v2/routes/cbfa3b22-9fc7-45fb-ae82-48282d38775d/apps',
                  route_mappings_url: '/v2/routes/cbfa3b22-9fc7-45fb-ae82-48282d38775d/route_mappings'
                }
              }
            ],
            events_url: '/v2/apps/02325b75-1199-4269-ba0a-8366a64b91af/events',
            service_bindings_url: '/v2/apps/02325b75-1199-4269-ba0a-8366a64b91af/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/02325b75-1199-4269-ba0a-8366a64b91af/route_mappings',
            guid: '02325b75-1199-4269-ba0a-8366a64b91af',
            cfGuid: '663a363e-1faf-4359-ac96-b8c24ec1a4ab'
          },
          metadata: {
            guid: '02325b75-1199-4269-ba0a-8366a64b91af',
            url: '/v2/apps/02325b75-1199-4269-ba0a-8366a64b91af',
            created_at: '2017-10-05T13:03:53Z',
            updated_at: '2017-10-05T13:03:54Z'
          }
        },
        '3f3cd4e0-9cc8-41f6-9e6a-fce36ca839ae': {
          entity: {
            name: 'sdfdsfd322456',
            production: false,
            space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_guid: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: 'd7758c04-a0b3-47c1-9ec9-d32c042196c3',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
            space: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_url: '/v2/stacks/97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            stack: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            routes_url: '/v2/apps/3f3cd4e0-9cc8-41f6-9e6a-fce36ca839ae/routes',
            routes: [
              {
                metadata: {
                  guid: '17265ac5-caba-4df8-b56a-03331e869309',
                  url: '/v2/routes/17265ac5-caba-4df8-b56a-03331e869309',
                  created_at: '2017-10-05T13:23:24Z',
                  updated_at: '2017-10-05T13:23:24Z'
                },
                entity: {
                  host: 'sdfdsfd322456',
                  path: '',
                  domain_guid: '44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  domain: {
                    metadata: {
                      guid: '44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                      url: '/v2/shared_domains/44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                      created_at: '2017-09-22T15:25:53Z',
                      updated_at: '2017-09-22T15:25:53Z'
                    },
                    entity: {
                      name: 'capbristol.com',
                      router_group_guid: null,
                      router_group_type: null
                    }
                  },
                  space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
                  space: {
                    metadata: {
                      guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
                      url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
                      created_at: '2017-09-22T15:27:48Z',
                      updated_at: '2017-09-22T15:27:48Z'
                    },
                    entity: {
                      name: 'e2e',
                      organization_guid: '22feecef-df39-4ae0-a56a-098cbe09ec0d',
                      space_quota_definition_guid: null,
                      isolation_segment_guid: null,
                      allow_ssh: true,
                      organization_url: '/v2/organizations/22feecef-df39-4ae0-a56a-098cbe09ec0d',
                      developers_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/developers',
                      managers_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/managers',
                      auditors_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/auditors',
                      apps_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/apps',
                      routes_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/routes',
                      domains_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/domains',
                      service_instances_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/service_instances',
                      app_events_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/app_events',
                      events_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/events',
                      security_groups_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/security_groups',
                      staging_security_groups_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/staging_security_groups'
                    }
                  },
                  apps_url: '/v2/routes/17265ac5-caba-4df8-b56a-03331e869309/apps',
                  route_mappings_url: '/v2/routes/17265ac5-caba-4df8-b56a-03331e869309/route_mappings'
                }
              }
            ],
            events_url: '/v2/apps/3f3cd4e0-9cc8-41f6-9e6a-fce36ca839ae/events',
            service_bindings_url: '/v2/apps/3f3cd4e0-9cc8-41f6-9e6a-fce36ca839ae/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/3f3cd4e0-9cc8-41f6-9e6a-fce36ca839ae/route_mappings',
            guid: '3f3cd4e0-9cc8-41f6-9e6a-fce36ca839ae',
            cfGuid: '663a363e-1faf-4359-ac96-b8c24ec1a4ab'
          },
          metadata: {
            guid: '3f3cd4e0-9cc8-41f6-9e6a-fce36ca839ae',
            url: '/v2/apps/3f3cd4e0-9cc8-41f6-9e6a-fce36ca839ae',
            created_at: '2017-10-05T13:23:24Z',
            updated_at: '2017-10-05T13:23:25Z'
          }
        },
        '6fa0182c-2b31-4b9a-ae05-11f766fadd31': {
          entity: {
            name: 'Test1234asdasdsadasd',
            production: false,
            space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_guid: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: '0da776b0-5af6-464b-b466-598d91a75ec3',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
            space: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_url: '/v2/stacks/97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            stack: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            routes_url: '/v2/apps/6fa0182c-2b31-4b9a-ae05-11f766fadd31/routes',
            routes: [
              {
                metadata: {
                  guid: 'a941234e-cee1-4bdd-9846-5e379b2a8ece',
                  url: '/v2/routes/a941234e-cee1-4bdd-9846-5e379b2a8ece',
                  created_at: '2017-10-05T13:25:45Z',
                  updated_at: '2017-10-05T13:25:45Z'
                },
                entity: {
                  host: 'test1234asdasdsadasd',
                  path: '',
                  domain_guid: '44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  domain: {
                    metadata: {
                      guid: '44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                      url: '/v2/shared_domains/44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                      created_at: '2017-09-22T15:25:53Z',
                      updated_at: '2017-09-22T15:25:53Z'
                    },
                    entity: {
                      name: 'capbristol.com',
                      router_group_guid: null,
                      router_group_type: null
                    }
                  },
                  space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
                  space: {
                    metadata: {
                      guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
                      url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
                      created_at: '2017-09-22T15:27:48Z',
                      updated_at: '2017-09-22T15:27:48Z'
                    },
                    entity: {
                      name: 'e2e',
                      organization_guid: '22feecef-df39-4ae0-a56a-098cbe09ec0d',
                      space_quota_definition_guid: null,
                      isolation_segment_guid: null,
                      allow_ssh: true,
                      organization_url: '/v2/organizations/22feecef-df39-4ae0-a56a-098cbe09ec0d',
                      developers_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/developers',
                      managers_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/managers',
                      auditors_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/auditors',
                      apps_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/apps',
                      routes_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/routes',
                      domains_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/domains',
                      service_instances_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/service_instances',
                      app_events_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/app_events',
                      events_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/events',
                      security_groups_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/security_groups',
                      staging_security_groups_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/staging_security_groups'
                    }
                  },
                  apps_url: '/v2/routes/a941234e-cee1-4bdd-9846-5e379b2a8ece/apps',
                  route_mappings_url: '/v2/routes/a941234e-cee1-4bdd-9846-5e379b2a8ece/route_mappings'
                }
              }
            ],
            events_url: '/v2/apps/6fa0182c-2b31-4b9a-ae05-11f766fadd31/events',
            service_bindings_url: '/v2/apps/6fa0182c-2b31-4b9a-ae05-11f766fadd31/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/6fa0182c-2b31-4b9a-ae05-11f766fadd31/route_mappings',
            guid: '6fa0182c-2b31-4b9a-ae05-11f766fadd31',
            cfGuid: '663a363e-1faf-4359-ac96-b8c24ec1a4ab'
          },
          metadata: {
            guid: '6fa0182c-2b31-4b9a-ae05-11f766fadd31',
            url: '/v2/apps/6fa0182c-2b31-4b9a-ae05-11f766fadd31',
            created_at: '2017-10-05T13:25:45Z',
            updated_at: '2017-10-05T13:25:47Z'
          }
        },
        'e49a16ad-3afd-4320-a301-745eda859f36': {
          entity: {
            name: 'Test1234asdasd6876',
            production: false,
            space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_guid: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: '368ae773-fa67-474e-822f-fc0690fa4dd3',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
            space: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_url: '/v2/stacks/97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            stack: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            routes_url: '/v2/apps/e49a16ad-3afd-4320-a301-745eda859f36/routes',
            routes: [],
            events_url: '/v2/apps/e49a16ad-3afd-4320-a301-745eda859f36/events',
            service_bindings_url: '/v2/apps/e49a16ad-3afd-4320-a301-745eda859f36/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/e49a16ad-3afd-4320-a301-745eda859f36/route_mappings',
            guid: 'e49a16ad-3afd-4320-a301-745eda859f36',
            cfGuid: '663a363e-1faf-4359-ac96-b8c24ec1a4ab'
          },
          metadata: {
            guid: 'e49a16ad-3afd-4320-a301-745eda859f36',
            url: '/v2/apps/e49a16ad-3afd-4320-a301-745eda859f36',
            created_at: '2017-10-05T14:25:00Z',
            updated_at: '2017-10-05T14:25:00Z'
          }
        },
        '219d24fd-77fa-402b-98c6-085e5ce5cedd': {
          entity: {
            name: 'cf-demo-app',
            production: false,
            space_guid: 'd91c3bf0-3ab0-4372-8b08-75de137eeaf8',
            stack_guid: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            buildpack: null,
            detected_buildpack: 'node.js 1.5.36',
            detected_buildpack_guid: 'e4be1af0-a5db-4a9a-be5f-0f93ff0135c0',
            environment_json: {
              STRATOS_PROJECT: '{"deploySource":{"type":"github","timestamp":1507284560,"project":"nwmac/cf-demo-app","branch":"master","url":"https://github.com/nwmac/cf-demo-app","commit":"df3430474b7508853bd2176393b6787f96c38e88\\n"}}'
            },
            memory: 64,
            instances: 2,
            disk_quota: 1024,
            state: 'STARTED',
            version: '93b8fd35-3ec7-4de4-b1d1-517a0f227e3f',
            command: null,
            console: false,
            debug: null,
            staging_task_id: '1a7692e0-7cc2-48e2-bea8-7ba2a62a3624',
            package_state: 'STAGED',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: '2017-10-06T10:09:16Z',
            detected_start_command: 'node server.js',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/d91c3bf0-3ab0-4372-8b08-75de137eeaf8',
            space: 'd91c3bf0-3ab0-4372-8b08-75de137eeaf8',
            stack_url: '/v2/stacks/97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            stack: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            routes_url: '/v2/apps/219d24fd-77fa-402b-98c6-085e5ce5cedd/routes',
            routes: [
              {
                metadata: {
                  guid: 'f5124941-7712-4432-8e51-27a64673c108',
                  url: '/v2/routes/f5124941-7712-4432-8e51-27a64673c108',
                  created_at: '2017-10-06T10:09:13Z',
                  updated_at: '2017-10-06T10:09:13Z'
                },
                entity: {
                  host: 'cf-demo-app',
                  path: '',
                  domain_guid: '44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  space_guid: 'd91c3bf0-3ab0-4372-8b08-75de137eeaf8',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  domain: {
                    metadata: {
                      guid: '44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                      url: '/v2/shared_domains/44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                      created_at: '2017-09-22T15:25:53Z',
                      updated_at: '2017-09-22T15:25:53Z'
                    },
                    entity: {
                      name: 'capbristol.com',
                      router_group_guid: null,
                      router_group_type: null
                    }
                  },
                  space_url: '/v2/spaces/d91c3bf0-3ab0-4372-8b08-75de137eeaf8',
                  space: {
                    metadata: {
                      guid: 'd91c3bf0-3ab0-4372-8b08-75de137eeaf8',
                      url: '/v2/spaces/d91c3bf0-3ab0-4372-8b08-75de137eeaf8',
                      created_at: '2017-09-22T15:38:44Z',
                      updated_at: '2017-09-22T15:38:44Z'
                    },
                    entity: {
                      name: 'susecon',
                      organization_guid: '94ce3787-757b-4eac-91c6-8f1705a178ba',
                      space_quota_definition_guid: null,
                      isolation_segment_guid: null,
                      allow_ssh: true,
                      organization_url: '/v2/organizations/94ce3787-757b-4eac-91c6-8f1705a178ba',
                      developers_url: '/v2/spaces/d91c3bf0-3ab0-4372-8b08-75de137eeaf8/developers',
                      managers_url: '/v2/spaces/d91c3bf0-3ab0-4372-8b08-75de137eeaf8/managers',
                      auditors_url: '/v2/spaces/d91c3bf0-3ab0-4372-8b08-75de137eeaf8/auditors',
                      apps_url: '/v2/spaces/d91c3bf0-3ab0-4372-8b08-75de137eeaf8/apps',
                      routes_url: '/v2/spaces/d91c3bf0-3ab0-4372-8b08-75de137eeaf8/routes',
                      domains_url: '/v2/spaces/d91c3bf0-3ab0-4372-8b08-75de137eeaf8/domains',
                      service_instances_url: '/v2/spaces/d91c3bf0-3ab0-4372-8b08-75de137eeaf8/service_instances',
                      app_events_url: '/v2/spaces/d91c3bf0-3ab0-4372-8b08-75de137eeaf8/app_events',
                      events_url: '/v2/spaces/d91c3bf0-3ab0-4372-8b08-75de137eeaf8/events',
                      security_groups_url: '/v2/spaces/d91c3bf0-3ab0-4372-8b08-75de137eeaf8/security_groups',
                      staging_security_groups_url: '/v2/spaces/d91c3bf0-3ab0-4372-8b08-75de137eeaf8/staging_security_groups'
                    }
                  },
                  apps_url: '/v2/routes/f5124941-7712-4432-8e51-27a64673c108/apps',
                  route_mappings_url: '/v2/routes/f5124941-7712-4432-8e51-27a64673c108/route_mappings'
                }
              }
            ],
            events_url: '/v2/apps/219d24fd-77fa-402b-98c6-085e5ce5cedd/events',
            service_bindings_url: '/v2/apps/219d24fd-77fa-402b-98c6-085e5ce5cedd/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/219d24fd-77fa-402b-98c6-085e5ce5cedd/route_mappings',
            guid: '219d24fd-77fa-402b-98c6-085e5ce5cedd',
            cfGuid: '663a363e-1faf-4359-ac96-b8c24ec1a4ab'
          },
          metadata: {
            guid: '219d24fd-77fa-402b-98c6-085e5ce5cedd',
            url: '/v2/apps/219d24fd-77fa-402b-98c6-085e5ce5cedd',
            created_at: '2017-10-06T10:09:10Z',
            updated_at: '2017-10-06T10:10:48Z'
          }
        },
        '1c6acc17-5275-486f-84f2-f5c14b4afd7d': {
          entity: {
            name: 'Test1234asdasd1213',
            production: false,
            space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_guid: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: 'c7ae9b57-039e-41a6-93c3-ac055fd6c7c6',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
            space: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_url: '/v2/stacks/97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            stack: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            routes_url: '/v2/apps/1c6acc17-5275-486f-84f2-f5c14b4afd7d/routes',
            routes: [
              {
                metadata: {
                  guid: 'cba96101-69ac-4a53-87ed-00e000afb110',
                  url: '/v2/routes/cba96101-69ac-4a53-87ed-00e000afb110',
                  created_at: '2017-10-06T14:36:34Z',
                  updated_at: '2017-10-06T14:36:34Z'
                },
                entity: {
                  host: 'test1234asdasd1213',
                  path: '',
                  domain_guid: '44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  domain: {
                    metadata: {
                      guid: '44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                      url: '/v2/shared_domains/44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                      created_at: '2017-09-22T15:25:53Z',
                      updated_at: '2017-09-22T15:25:53Z'
                    },
                    entity: {
                      name: 'capbristol.com',
                      router_group_guid: null,
                      router_group_type: null
                    }
                  },
                  space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
                  space: {
                    metadata: {
                      guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
                      url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
                      created_at: '2017-09-22T15:27:48Z',
                      updated_at: '2017-09-22T15:27:48Z'
                    },
                    entity: {
                      name: 'e2e',
                      organization_guid: '22feecef-df39-4ae0-a56a-098cbe09ec0d',
                      space_quota_definition_guid: null,
                      isolation_segment_guid: null,
                      allow_ssh: true,
                      organization_url: '/v2/organizations/22feecef-df39-4ae0-a56a-098cbe09ec0d',
                      developers_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/developers',
                      managers_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/managers',
                      auditors_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/auditors',
                      apps_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/apps',
                      routes_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/routes',
                      domains_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/domains',
                      service_instances_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/service_instances',
                      app_events_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/app_events',
                      events_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/events',
                      security_groups_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/security_groups',
                      staging_security_groups_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/staging_security_groups'
                    }
                  },
                  apps_url: '/v2/routes/cba96101-69ac-4a53-87ed-00e000afb110/apps',
                  route_mappings_url: '/v2/routes/cba96101-69ac-4a53-87ed-00e000afb110/route_mappings'
                }
              }
            ],
            events_url: '/v2/apps/1c6acc17-5275-486f-84f2-f5c14b4afd7d/events',
            service_bindings_url: '/v2/apps/1c6acc17-5275-486f-84f2-f5c14b4afd7d/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/1c6acc17-5275-486f-84f2-f5c14b4afd7d/route_mappings',
            guid: '1c6acc17-5275-486f-84f2-f5c14b4afd7d',
            cfGuid: '663a363e-1faf-4359-ac96-b8c24ec1a4ab'
          },
          metadata: {
            guid: '1c6acc17-5275-486f-84f2-f5c14b4afd7d',
            url: '/v2/apps/1c6acc17-5275-486f-84f2-f5c14b4afd7d',
            created_at: '2017-10-06T14:36:34Z',
            updated_at: '2017-10-06T14:36:35Z'
          }
        },
        'ce653e40-bd26-4278-85c9-773d0ed806a2': {
          entity: {
            name: '456',
            production: false,
            space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_guid: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: 'c738133e-cbdd-4cfd-8beb-c0cdb313bf53',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
            space: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_url: '/v2/stacks/97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            stack: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            routes_url: '/v2/apps/ce653e40-bd26-4278-85c9-773d0ed806a2/routes',
            routes: [
              {
                metadata: {
                  guid: 'b69d7f74-948b-4a62-b03d-70446c07338f',
                  url: '/v2/routes/b69d7f74-948b-4a62-b03d-70446c07338f',
                  created_at: '2017-10-06T14:42:33Z',
                  updated_at: '2017-10-06T14:42:33Z'
                },
                entity: {
                  host: '456',
                  path: '',
                  domain_guid: '44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  domain: {
                    metadata: {
                      guid: '44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                      url: '/v2/shared_domains/44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                      created_at: '2017-09-22T15:25:53Z',
                      updated_at: '2017-09-22T15:25:53Z'
                    },
                    entity: {
                      name: 'capbristol.com',
                      router_group_guid: null,
                      router_group_type: null
                    }
                  },
                  space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
                  space: {
                    metadata: {
                      guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
                      url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
                      created_at: '2017-09-22T15:27:48Z',
                      updated_at: '2017-09-22T15:27:48Z'
                    },
                    entity: {
                      name: 'e2e',
                      organization_guid: '22feecef-df39-4ae0-a56a-098cbe09ec0d',
                      space_quota_definition_guid: null,
                      isolation_segment_guid: null,
                      allow_ssh: true,
                      organization_url: '/v2/organizations/22feecef-df39-4ae0-a56a-098cbe09ec0d',
                      developers_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/developers',
                      managers_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/managers',
                      auditors_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/auditors',
                      apps_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/apps',
                      routes_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/routes',
                      domains_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/domains',
                      service_instances_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/service_instances',
                      app_events_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/app_events',
                      events_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/events',
                      security_groups_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/security_groups',
                      staging_security_groups_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/staging_security_groups'
                    }
                  },
                  apps_url: '/v2/routes/b69d7f74-948b-4a62-b03d-70446c07338f/apps',
                  route_mappings_url: '/v2/routes/b69d7f74-948b-4a62-b03d-70446c07338f/route_mappings'
                }
              }
            ],
            events_url: '/v2/apps/ce653e40-bd26-4278-85c9-773d0ed806a2/events',
            service_bindings_url: '/v2/apps/ce653e40-bd26-4278-85c9-773d0ed806a2/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/ce653e40-bd26-4278-85c9-773d0ed806a2/route_mappings',
            guid: 'ce653e40-bd26-4278-85c9-773d0ed806a2',
            cfGuid: '663a363e-1faf-4359-ac96-b8c24ec1a4ab'
          },
          metadata: {
            guid: 'ce653e40-bd26-4278-85c9-773d0ed806a2',
            url: '/v2/apps/ce653e40-bd26-4278-85c9-773d0ed806a2',
            created_at: '2017-10-06T14:42:33Z',
            updated_at: '2017-10-06T14:42:35Z'
          }
        },
        '6c29687b-e2b0-4ba5-b17a-ed3b99c54f79': {
          entity: {
            name: '987',
            production: false,
            space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_guid: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: 'aae434dd-f918-4273-b4e4-44354afb8163',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
            space: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_url: '/v2/stacks/97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            stack: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            routes_url: '/v2/apps/6c29687b-e2b0-4ba5-b17a-ed3b99c54f79/routes',
            routes: [
              {
                metadata: {
                  guid: 'b7fe87ba-4e18-4af8-b7f4-85e660c0f3cd',
                  url: '/v2/routes/b7fe87ba-4e18-4af8-b7f4-85e660c0f3cd',
                  created_at: '2017-10-06T14:45:02Z',
                  updated_at: '2017-10-06T14:45:02Z'
                },
                entity: {
                  host: '987',
                  path: '',
                  domain_guid: '44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  domain: {
                    metadata: {
                      guid: '44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                      url: '/v2/shared_domains/44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                      created_at: '2017-09-22T15:25:53Z',
                      updated_at: '2017-09-22T15:25:53Z'
                    },
                    entity: {
                      name: 'capbristol.com',
                      router_group_guid: null,
                      router_group_type: null
                    }
                  },
                  space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
                  space: {
                    metadata: {
                      guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
                      url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
                      created_at: '2017-09-22T15:27:48Z',
                      updated_at: '2017-09-22T15:27:48Z'
                    },
                    entity: {
                      name: 'e2e',
                      organization_guid: '22feecef-df39-4ae0-a56a-098cbe09ec0d',
                      space_quota_definition_guid: null,
                      isolation_segment_guid: null,
                      allow_ssh: true,
                      organization_url: '/v2/organizations/22feecef-df39-4ae0-a56a-098cbe09ec0d',
                      developers_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/developers',
                      managers_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/managers',
                      auditors_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/auditors',
                      apps_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/apps',
                      routes_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/routes',
                      domains_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/domains',
                      service_instances_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/service_instances',
                      app_events_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/app_events',
                      events_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/events',
                      security_groups_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/security_groups',
                      staging_security_groups_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/staging_security_groups'
                    }
                  },
                  apps_url: '/v2/routes/b7fe87ba-4e18-4af8-b7f4-85e660c0f3cd/apps',
                  route_mappings_url: '/v2/routes/b7fe87ba-4e18-4af8-b7f4-85e660c0f3cd/route_mappings'
                }
              }
            ],
            events_url: '/v2/apps/6c29687b-e2b0-4ba5-b17a-ed3b99c54f79/events',
            service_bindings_url: '/v2/apps/6c29687b-e2b0-4ba5-b17a-ed3b99c54f79/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/6c29687b-e2b0-4ba5-b17a-ed3b99c54f79/route_mappings',
            guid: '6c29687b-e2b0-4ba5-b17a-ed3b99c54f79',
            cfGuid: '663a363e-1faf-4359-ac96-b8c24ec1a4ab'
          },
          metadata: {
            guid: '6c29687b-e2b0-4ba5-b17a-ed3b99c54f79',
            url: '/v2/apps/6c29687b-e2b0-4ba5-b17a-ed3b99c54f79',
            created_at: '2017-10-06T14:45:02Z',
            updated_at: '2017-10-06T14:45:04Z'
          }
        },
        '980877d5-ff09-400d-87d3-2db36ea763d6': {
          entity: {
            name: 'Test1234asdasd2345',
            production: false,
            space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_guid: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: 'c099c4ee-0809-4887-8e5a-5f780fc8b48c',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
            space: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_url: '/v2/stacks/97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            stack: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            routes_url: '/v2/apps/980877d5-ff09-400d-87d3-2db36ea763d6/routes',
            routes: [
              {
                metadata: {
                  guid: 'f396f665-9c1e-42a3-a8a9-77fabd2d69f0',
                  url: '/v2/routes/f396f665-9c1e-42a3-a8a9-77fabd2d69f0',
                  created_at: '2017-10-06T14:47:12Z',
                  updated_at: '2017-10-06T14:47:12Z'
                },
                entity: {
                  host: 'test1234asdasd234523456',
                  path: '',
                  domain_guid: '44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  domain: {
                    metadata: {
                      guid: '44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                      url: '/v2/shared_domains/44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                      created_at: '2017-09-22T15:25:53Z',
                      updated_at: '2017-09-22T15:25:53Z'
                    },
                    entity: {
                      name: 'capbristol.com',
                      router_group_guid: null,
                      router_group_type: null
                    }
                  },
                  space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
                  space: {
                    metadata: {
                      guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
                      url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
                      created_at: '2017-09-22T15:27:48Z',
                      updated_at: '2017-09-22T15:27:48Z'
                    },
                    entity: {
                      name: 'e2e',
                      organization_guid: '22feecef-df39-4ae0-a56a-098cbe09ec0d',
                      space_quota_definition_guid: null,
                      isolation_segment_guid: null,
                      allow_ssh: true,
                      organization_url: '/v2/organizations/22feecef-df39-4ae0-a56a-098cbe09ec0d',
                      developers_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/developers',
                      managers_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/managers',
                      auditors_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/auditors',
                      apps_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/apps',
                      routes_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/routes',
                      domains_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/domains',
                      service_instances_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/service_instances',
                      app_events_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/app_events',
                      events_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/events',
                      security_groups_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/security_groups',
                      staging_security_groups_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/staging_security_groups'
                    }
                  },
                  apps_url: '/v2/routes/f396f665-9c1e-42a3-a8a9-77fabd2d69f0/apps',
                  route_mappings_url: '/v2/routes/f396f665-9c1e-42a3-a8a9-77fabd2d69f0/route_mappings'
                }
              }
            ],
            events_url: '/v2/apps/980877d5-ff09-400d-87d3-2db36ea763d6/events',
            service_bindings_url: '/v2/apps/980877d5-ff09-400d-87d3-2db36ea763d6/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/980877d5-ff09-400d-87d3-2db36ea763d6/route_mappings',
            guid: '980877d5-ff09-400d-87d3-2db36ea763d6',
            cfGuid: '663a363e-1faf-4359-ac96-b8c24ec1a4ab'
          },
          metadata: {
            guid: '980877d5-ff09-400d-87d3-2db36ea763d6',
            url: '/v2/apps/980877d5-ff09-400d-87d3-2db36ea763d6',
            created_at: '2017-10-06T14:47:12Z',
            updated_at: '2017-10-06T14:47:14Z'
          }
        },
        '1df7da98-ba42-4c95-af2a-3e1be5ce9824': {
          entity: {
            name: 'Test1234asdsad23123',
            production: false,
            space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_guid: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            buildpack: null,
            detected_buildpack: null,
            detected_buildpack_guid: null,
            environment_json: {},
            memory: 1024,
            instances: 1,
            disk_quota: 1024,
            state: 'STOPPED',
            version: '0c724a00-80e0-462d-b6d9-9e5305dabb99',
            command: null,
            console: false,
            debug: null,
            staging_task_id: null,
            package_state: 'PENDING',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: null,
            detected_start_command: '',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
            space: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            stack_url: '/v2/stacks/97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            stack: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            routes_url: '/v2/apps/1df7da98-ba42-4c95-af2a-3e1be5ce9824/routes',
            routes: [
              {
                metadata: {
                  guid: '010e7988-64f3-4043-8d1b-b74c6c517c31',
                  url: '/v2/routes/010e7988-64f3-4043-8d1b-b74c6c517c31',
                  created_at: '2017-10-06T14:53:08Z',
                  updated_at: '2017-10-06T14:53:08Z'
                },
                entity: {
                  host: 'test1234asdsad23123',
                  path: '',
                  domain_guid: '44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  space_guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  domain: {
                    metadata: {
                      guid: '44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                      url: '/v2/shared_domains/44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                      created_at: '2017-09-22T15:25:53Z',
                      updated_at: '2017-09-22T15:25:53Z'
                    },
                    entity: {
                      name: 'capbristol.com',
                      router_group_guid: null,
                      router_group_type: null
                    }
                  },
                  space_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
                  space: {
                    metadata: {
                      guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
                      url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
                      created_at: '2017-09-22T15:27:48Z',
                      updated_at: '2017-09-22T15:27:48Z'
                    },
                    entity: {
                      name: 'e2e',
                      organization_guid: '22feecef-df39-4ae0-a56a-098cbe09ec0d',
                      space_quota_definition_guid: null,
                      isolation_segment_guid: null,
                      allow_ssh: true,
                      organization_url: '/v2/organizations/22feecef-df39-4ae0-a56a-098cbe09ec0d',
                      developers_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/developers',
                      managers_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/managers',
                      auditors_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/auditors',
                      apps_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/apps',
                      routes_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/routes',
                      domains_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/domains',
                      service_instances_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/service_instances',
                      app_events_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/app_events',
                      events_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/events',
                      security_groups_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/security_groups',
                      staging_security_groups_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/staging_security_groups'
                    }
                  },
                  apps_url: '/v2/routes/010e7988-64f3-4043-8d1b-b74c6c517c31/apps',
                  route_mappings_url: '/v2/routes/010e7988-64f3-4043-8d1b-b74c6c517c31/route_mappings'
                }
              }
            ],
            events_url: '/v2/apps/1df7da98-ba42-4c95-af2a-3e1be5ce9824/events',
            service_bindings_url: '/v2/apps/1df7da98-ba42-4c95-af2a-3e1be5ce9824/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/1df7da98-ba42-4c95-af2a-3e1be5ce9824/route_mappings',
            guid: '1df7da98-ba42-4c95-af2a-3e1be5ce9824',
            cfGuid: '663a363e-1faf-4359-ac96-b8c24ec1a4ab'
          },
          metadata: {
            guid: '1df7da98-ba42-4c95-af2a-3e1be5ce9824',
            url: '/v2/apps/1df7da98-ba42-4c95-af2a-3e1be5ce9824',
            created_at: '2017-10-06T14:53:08Z',
            updated_at: '2017-10-06T14:53:09Z'
          }
        },
        '7d2981da-6ee5-47ce-948f-4769a63be5ee': {
          entity: {
            name: 'console',
            production: false,
            space_guid: '8da86308-f3e6-4196-b5e7-b03865b973d3',
            stack_guid: 'a360f093-c64d-4631-9b5e-a4a87cc47991',
            buildpack: 'https://github.com/SUSE/stratos-buildpack',
            detected_buildpack: '',
            detected_buildpack_guid: null,
            environment_json: {
              FORCE_ENDPOINT_DASHBOARD: 'true'
            },
            memory: 256,
            instances: 1,
            disk_quota: 256,
            state: 'STARTED',
            version: '4326e877-8bc0-4f2c-9b98-590d329dd8c4',
            command: null,
            console: false,
            debug: null,
            staging_task_id: '261d313c-db9a-403f-b7d7-008d4fe77f76',
            package_state: 'STAGED',
            health_check_type: 'port',
            health_check_timeout: 180,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: '2017-10-09T15:24:42Z',
            detected_start_command: './deploy/cloud-foundry/start.sh',
            enable_ssh: false,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/8da86308-f3e6-4196-b5e7-b03865b973d3',
            space: '8da86308-f3e6-4196-b5e7-b03865b973d3',
            stack_url: '/v2/stacks/a360f093-c64d-4631-9b5e-a4a87cc47991',
            stack: 'a360f093-c64d-4631-9b5e-a4a87cc47991',
            routes_url: '/v2/apps/7d2981da-6ee5-47ce-948f-4769a63be5ee/routes',
            routes: [
              {
                metadata: {
                  guid: '5f4becde-3290-4ca4-a3bd-51d7efb4b118',
                  url: '/v2/routes/5f4becde-3290-4ca4-a3bd-51d7efb4b118',
                  created_at: '2017-10-09T10:06:29Z',
                  updated_at: '2017-10-09T10:06:29Z'
                },
                entity: {
                  host: 'nwm-console',
                  path: '',
                  domain_guid: '9762e24d-9761-40df-822f-16f1526ddbe7',
                  space_guid: '8da86308-f3e6-4196-b5e7-b03865b973d3',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/9762e24d-9761-40df-822f-16f1526ddbe7',
                  domain: {
                    metadata: {
                      guid: '9762e24d-9761-40df-822f-16f1526ddbe7',
                      url: '/v2/shared_domains/9762e24d-9761-40df-822f-16f1526ddbe7',
                      created_at: '2016-11-04T12:57:41Z',
                      updated_at: '2017-10-02T08:39:19Z'
                    },
                    entity: {
                      name: 'cfapps.eu10.hana.ondemand.com',
                      router_group_guid: null,
                      router_group_type: null
                    }
                  },
                  space_url: '/v2/spaces/8da86308-f3e6-4196-b5e7-b03865b973d3',
                  space: {
                    metadata: {
                      guid: '8da86308-f3e6-4196-b5e7-b03865b973d3',
                      url: '/v2/spaces/8da86308-f3e6-4196-b5e7-b03865b973d3',
                      created_at: '2017-06-09T12:40:41Z',
                      updated_at: '2017-07-04T09:56:21Z'
                    },
                    entity: {
                      name: 'dev',
                      organization_guid: '145a99e5-3728-4f71-b750-56f074dd32b8',
                      space_quota_definition_guid: null,
                      isolation_segment_guid: null,
                      allow_ssh: true,
                      organization_url: '/v2/organizations/145a99e5-3728-4f71-b750-56f074dd32b8',
                      developers_url: '/v2/spaces/8da86308-f3e6-4196-b5e7-b03865b973d3/developers',
                      managers_url: '/v2/spaces/8da86308-f3e6-4196-b5e7-b03865b973d3/managers',
                      auditors_url: '/v2/spaces/8da86308-f3e6-4196-b5e7-b03865b973d3/auditors',
                      apps_url: '/v2/spaces/8da86308-f3e6-4196-b5e7-b03865b973d3/apps',
                      routes_url: '/v2/spaces/8da86308-f3e6-4196-b5e7-b03865b973d3/routes',
                      domains_url: '/v2/spaces/8da86308-f3e6-4196-b5e7-b03865b973d3/domains',
                      service_instances_url: '/v2/spaces/8da86308-f3e6-4196-b5e7-b03865b973d3/service_instances',
                      app_events_url: '/v2/spaces/8da86308-f3e6-4196-b5e7-b03865b973d3/app_events',
                      events_url: '/v2/spaces/8da86308-f3e6-4196-b5e7-b03865b973d3/events',
                      security_groups_url: '/v2/spaces/8da86308-f3e6-4196-b5e7-b03865b973d3/security_groups',
                      staging_security_groups_url: '/v2/spaces/8da86308-f3e6-4196-b5e7-b03865b973d3/staging_security_groups'
                    }
                  },
                  apps_url: '/v2/routes/5f4becde-3290-4ca4-a3bd-51d7efb4b118/apps',
                  route_mappings_url: '/v2/routes/5f4becde-3290-4ca4-a3bd-51d7efb4b118/route_mappings'
                }
              }
            ],
            events_url: '/v2/apps/7d2981da-6ee5-47ce-948f-4769a63be5ee/events',
            service_bindings_url: '/v2/apps/7d2981da-6ee5-47ce-948f-4769a63be5ee/service_bindings',
            service_bindings: [
              {
                metadata: {
                  guid: 'addc44a8-3d99-4321-ab71-aef3ec2137f9',
                  url: '/v2/service_bindings/addc44a8-3d99-4321-ab71-aef3ec2137f9',
                  created_at: '2017-10-09T15:24:58Z',
                  updated_at: '2017-10-09T15:24:58Z'
                },
                entity: {
                  app_guid: '7d2981da-6ee5-47ce-948f-4769a63be5ee',
                  service_instance_guid: 'f1105781-b2ab-4e5b-9872-cfdaf4d7b58f',
                  credentials: {
                    hostname: '10.11.241.20',
                    ports: {
                      '5432/tcp': '55150'
                    },
                    port: '55150',
                    username: 'UzONGmCw5kSqeL9p',
                    password: 'lgq8Y7trTMQSxwkS',
                    dbname: 'POCe11YN7GEaOj2R',
                    uri: 'postgres://UzONGmCw5kSqeL9p:lgq8Y7trTMQSxwkS@10.11.241.20:55150/POCe11YN7GEaOj2R'
                  },
                  binding_options: {},
                  gateway_data: null,
                  gateway_name: '',
                  syslog_drain_url: null,
                  volume_mounts: [],
                  app_url: '/v2/apps/7d2981da-6ee5-47ce-948f-4769a63be5ee',
                  service_instance_url: '/v2/service_instances/f1105781-b2ab-4e5b-9872-cfdaf4d7b58f',
                  service_instance: {
                    metadata: {
                      guid: 'f1105781-b2ab-4e5b-9872-cfdaf4d7b58f',
                      url: '/v2/service_instances/f1105781-b2ab-4e5b-9872-cfdaf4d7b58f',
                      created_at: '2017-10-09T10:05:59Z',
                      updated_at: '2017-10-09T10:05:59Z'
                    },
                    entity: {
                      name: 'console_db',
                      credentials: {},
                      service_plan_guid: 'cd6fcd9c-26e0-4b4a-8031-e0b8e70fb429',
                      space_guid: '8da86308-f3e6-4196-b5e7-b03865b973d3',
                      gateway_data: null,
                      dashboard_url: 'https://service-fabrik-broker.cf.eu10.hana.ondemand.com/manage/instances/6db542eb-8187-4afc-8a85-e08b4a3cc24e/c3320e0f-5866-4f14-895e-48bc92a4245c/f1105781-b2ab-4e5b-9872-cfdaf4d7b58f',
                      type: 'managed_service_instance',
                      last_operation: {
                        type: 'create',
                        state: 'succeeded',
                        description: '',
                        updated_at: '2017-10-09T10:05:59Z',
                        created_at: '2017-10-09T10:05:59Z'
                      },
                      tags: [
                        'stratos_postgresql'
                      ],
                      service_guid: '9ae1b7ff-ad5c-4f31-a1b9-6d00dd19fbec',
                      space_url: '/v2/spaces/8da86308-f3e6-4196-b5e7-b03865b973d3',
                      service_plan_url: '/v2/service_plans/cd6fcd9c-26e0-4b4a-8031-e0b8e70fb429',
                      service_bindings_url: '/v2/service_instances/f1105781-b2ab-4e5b-9872-cfdaf4d7b58f/service_bindings',
                      service_keys_url: '/v2/service_instances/f1105781-b2ab-4e5b-9872-cfdaf4d7b58f/service_keys',
                      routes_url: '/v2/service_instances/f1105781-b2ab-4e5b-9872-cfdaf4d7b58f/routes',
                      service_url: '/v2/services/9ae1b7ff-ad5c-4f31-a1b9-6d00dd19fbec'
                    }
                  }
                }
              }
            ],
            route_mappings_url: '/v2/apps/7d2981da-6ee5-47ce-948f-4769a63be5ee/route_mappings',
            guid: '7d2981da-6ee5-47ce-948f-4769a63be5ee',
            cfGuid: 'b24923d0-f1ad-4534-bb02-f609a1667bb1'
          },
          metadata: {
            guid: '7d2981da-6ee5-47ce-948f-4769a63be5ee',
            url: '/v2/apps/7d2981da-6ee5-47ce-948f-4769a63be5ee',
            created_at: '2017-10-09T15:24:32Z',
            updated_at: '2017-10-09T15:24:58Z'
          }
        },
        '0c47e5fe-4b84-42b7-9ac7-6f4d52596a7f': {
          entity: {
            name: 'go-env',
            production: false,
            space_guid: '78bd7c96-c182-4371-bc71-15a49eb5c5bc',
            stack_guid: '2f93057d-9a36-4f46-bd6e-87ddb8f574a2',
            buildpack: null,
            detected_buildpack: 'Go',
            detected_buildpack_guid: '531233b9-4e0f-4252-8866-ec65081df515',
            environment_json: {},
            memory: 16,
            instances: 1,
            disk_quota: 16,
            state: 'STARTED',
            version: 'edde8891-a661-41c9-a3cf-8c60b185474e',
            command: null,
            console: false,
            debug: null,
            staging_task_id: '25432486-6fe9-40af-84a4-ad903ee96073',
            package_state: 'STAGED',
            health_check_type: 'process',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: '2017-09-11T09:43:06Z',
            detected_start_command: 'go-env',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/78bd7c96-c182-4371-bc71-15a49eb5c5bc',
            space: '78bd7c96-c182-4371-bc71-15a49eb5c5bc',
            stack_url: '/v2/stacks/2f93057d-9a36-4f46-bd6e-87ddb8f574a2',
            stack: '2f93057d-9a36-4f46-bd6e-87ddb8f574a2',
            routes_url: '/v2/apps/0c47e5fe-4b84-42b7-9ac7-6f4d52596a7f/routes',
            routes: [],
            events_url: '/v2/apps/0c47e5fe-4b84-42b7-9ac7-6f4d52596a7f/events',
            service_bindings_url: '/v2/apps/0c47e5fe-4b84-42b7-9ac7-6f4d52596a7f/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/0c47e5fe-4b84-42b7-9ac7-6f4d52596a7f/route_mappings',
            guid: '0c47e5fe-4b84-42b7-9ac7-6f4d52596a7f',
            cfGuid: 'e2f91bca-38e8-435a-9f72-7a8f8de0ee17'
          },
          metadata: {
            guid: '0c47e5fe-4b84-42b7-9ac7-6f4d52596a7f',
            url: '/v2/apps/0c47e5fe-4b84-42b7-9ac7-6f4d52596a7f',
            created_at: '2017-09-11T09:43:05Z',
            updated_at: '2017-09-11T09:43:12Z'
          }
        },
        'af405ff9-2da6-47c0-af4d-1e72f55e621f': {
          entity: {
            name: 'app-autoscaler-broker',
            production: false,
            space_guid: '78bd7c96-c182-4371-bc71-15a49eb5c5bc',
            stack_guid: '133ce0c7-44a0-4951-bbc8-b885c2b3cd53',
            buildpack: null,
            detected_buildpack: 'Go',
            detected_buildpack_guid: '531233b9-4e0f-4252-8866-ec65081df515',
            environment_json: {
              BASE_GUID: '826fcda4-80e1-11e7-aead-9372473ff564',
              CREDENTIALS: '{"port": "4000", "host": "1.2.3.4"}',
              SERVICE_NAME: 'app-autoscaler',
              SERVICE_PLAN_NAME: 'shared',
              TAGS: 'simple,shared'
            },
            memory: 128,
            instances: 1,
            disk_quota: 256,
            state: 'STARTED',
            version: 'ede235d1-eac1-47c3-8b67-2ba9136e53cc',
            command: null,
            console: false,
            debug: null,
            staging_task_id: '4d725275-b131-4e92-9484-6dfced492dd8',
            package_state: 'STAGED',
            health_check_type: 'port',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: '2017-09-11T10:01:04Z',
            detected_start_command: 'worlds-simplest-service-broker',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/78bd7c96-c182-4371-bc71-15a49eb5c5bc',
            space: '78bd7c96-c182-4371-bc71-15a49eb5c5bc',
            stack_url: '/v2/stacks/133ce0c7-44a0-4951-bbc8-b885c2b3cd53',
            stack: '133ce0c7-44a0-4951-bbc8-b885c2b3cd53',
            routes_url: '/v2/apps/af405ff9-2da6-47c0-af4d-1e72f55e621f/routes',
            routes: [
              {
                metadata: {
                  guid: '54c9ae57-e84e-42ff-99b0-836502fa1982',
                  url: '/v2/routes/54c9ae57-e84e-42ff-99b0-836502fa1982',
                  created_at: '2017-09-11T09:56:19Z',
                  updated_at: '2017-09-11T09:56:19Z'
                },
                entity: {
                  host: 'app-autoscaler-broker',
                  path: '',
                  domain_guid: '15611675-b792-4236-92ce-36caa54b18e9',
                  space_guid: '78bd7c96-c182-4371-bc71-15a49eb5c5bc',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/15611675-b792-4236-92ce-36caa54b18e9',
                  domain: {
                    metadata: {
                      guid: '15611675-b792-4236-92ce-36caa54b18e9',
                      url: '/v2/shared_domains/15611675-b792-4236-92ce-36caa54b18e9',
                      created_at: '2017-09-08T17:22:39Z',
                      updated_at: '2017-09-08T17:22:39Z'
                    },
                    entity: {
                      name: 'cf-dev.io',
                      router_group_guid: null,
                      router_group_type: null
                    }
                  },
                  space_url: '/v2/spaces/78bd7c96-c182-4371-bc71-15a49eb5c5bc',
                  space: {
                    metadata: {
                      guid: '78bd7c96-c182-4371-bc71-15a49eb5c5bc',
                      url: '/v2/spaces/78bd7c96-c182-4371-bc71-15a49eb5c5bc',
                      created_at: '2017-09-08T17:26:55Z',
                      updated_at: '2017-09-08T17:26:55Z'
                    },
                    entity: {
                      name: 'dev',
                      organization_guid: 'bba0b575-800f-48ac-b89f-1a245132fc40',
                      space_quota_definition_guid: null,
                      isolation_segment_guid: null,
                      allow_ssh: true,
                      organization_url: '/v2/organizations/bba0b575-800f-48ac-b89f-1a245132fc40',
                      developers_url: '/v2/spaces/78bd7c96-c182-4371-bc71-15a49eb5c5bc/developers',
                      managers_url: '/v2/spaces/78bd7c96-c182-4371-bc71-15a49eb5c5bc/managers',
                      auditors_url: '/v2/spaces/78bd7c96-c182-4371-bc71-15a49eb5c5bc/auditors',
                      apps_url: '/v2/spaces/78bd7c96-c182-4371-bc71-15a49eb5c5bc/apps',
                      routes_url: '/v2/spaces/78bd7c96-c182-4371-bc71-15a49eb5c5bc/routes',
                      domains_url: '/v2/spaces/78bd7c96-c182-4371-bc71-15a49eb5c5bc/domains',
                      service_instances_url: '/v2/spaces/78bd7c96-c182-4371-bc71-15a49eb5c5bc/service_instances',
                      app_events_url: '/v2/spaces/78bd7c96-c182-4371-bc71-15a49eb5c5bc/app_events',
                      events_url: '/v2/spaces/78bd7c96-c182-4371-bc71-15a49eb5c5bc/events',
                      security_groups_url: '/v2/spaces/78bd7c96-c182-4371-bc71-15a49eb5c5bc/security_groups',
                      staging_security_groups_url: '/v2/spaces/78bd7c96-c182-4371-bc71-15a49eb5c5bc/staging_security_groups'
                    }
                  },
                  apps_url: '/v2/routes/54c9ae57-e84e-42ff-99b0-836502fa1982/apps',
                  route_mappings_url: '/v2/routes/54c9ae57-e84e-42ff-99b0-836502fa1982/route_mappings'
                }
              }
            ],
            events_url: '/v2/apps/af405ff9-2da6-47c0-af4d-1e72f55e621f/events',
            service_bindings_url: '/v2/apps/af405ff9-2da6-47c0-af4d-1e72f55e621f/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/af405ff9-2da6-47c0-af4d-1e72f55e621f/route_mappings',
            guid: 'af405ff9-2da6-47c0-af4d-1e72f55e621f',
            cfGuid: 'e2f91bca-38e8-435a-9f72-7a8f8de0ee17'
          },
          metadata: {
            guid: 'af405ff9-2da6-47c0-af4d-1e72f55e621f',
            url: '/v2/apps/af405ff9-2da6-47c0-af4d-1e72f55e621f',
            created_at: '2017-09-11T09:56:18Z',
            updated_at: '2017-09-11T10:01:15Z'
          }
        },
        'dbc5f72a-8703-4c9a-8919-b9e900392acb': {
          entity: {
            name: 'go-env',
            production: false,
            space_guid: '3625beef-09b3-420c-b11b-a7bb2b1fe978',
            stack_guid: '2f93057d-9a36-4f46-bd6e-87ddb8f574a2',
            buildpack: null,
            detected_buildpack: 'Go',
            detected_buildpack_guid: '531233b9-4e0f-4252-8866-ec65081df515',
            environment_json: {
              STRATOS_PROJECT: '{"url":"https://github.com/cf-stratos/go-env","commit":"f50a5b30d8903722c93a1334f1651e8c0c9e07a1\\n","branch":"master","timestamp":1506078991}'
            },
            memory: 16,
            instances: 1,
            disk_quota: 16,
            state: 'STARTED',
            version: '7f013a50-8d12-43db-b1c8-12c58f96e824',
            command: null,
            console: false,
            debug: null,
            staging_task_id: '0301b37e-6d05-4746-8e5b-fa1fd837387f',
            package_state: 'STAGED',
            health_check_type: 'process',
            health_check_timeout: null,
            health_check_http_endpoint: null,
            staging_failed_reason: null,
            staging_failed_description: null,
            diego: true,
            docker_image: null,
            docker_credentials: {
              username: null,
              password: null
            },
            package_updated_at: '2017-09-22T11:16:41Z',
            detected_start_command: 'go-env',
            enable_ssh: true,
            ports: [
              8080
            ],
            space_url: '/v2/spaces/3625beef-09b3-420c-b11b-a7bb2b1fe978',
            space: '3625beef-09b3-420c-b11b-a7bb2b1fe978',
            stack_url: '/v2/stacks/2f93057d-9a36-4f46-bd6e-87ddb8f574a2',
            stack: '2f93057d-9a36-4f46-bd6e-87ddb8f574a2',
            routes_url: '/v2/apps/dbc5f72a-8703-4c9a-8919-b9e900392acb/routes',
            routes: [],
            events_url: '/v2/apps/dbc5f72a-8703-4c9a-8919-b9e900392acb/events',
            service_bindings_url: '/v2/apps/dbc5f72a-8703-4c9a-8919-b9e900392acb/service_bindings',
            service_bindings: [],
            route_mappings_url: '/v2/apps/dbc5f72a-8703-4c9a-8919-b9e900392acb/route_mappings',
            guid: 'dbc5f72a-8703-4c9a-8919-b9e900392acb',
            cfGuid: 'e2f91bca-38e8-435a-9f72-7a8f8de0ee17'
          },
          metadata: {
            guid: 'dbc5f72a-8703-4c9a-8919-b9e900392acb',
            url: '/v2/apps/dbc5f72a-8703-4c9a-8919-b9e900392acb',
            created_at: '2017-09-21T06:55:39Z',
            updated_at: '2017-09-22T11:16:49Z'
          }
        }
      },
      stack: {
        '57ab08d8-86cc-473a-8818-25d5e8d0ea23': {
          metadata: {
            guid: '57ab08d8-86cc-473a-8818-25d5e8d0ea23',
            url: '/v2/stacks/57ab08d8-86cc-473a-8818-25d5e8d0ea23',
            created_at: '2017-10-10T09:16:50Z',
            updated_at: '2017-10-10T09:16:50Z'
          },
          entity: {
            name: 'cflinuxfs2',
            description: 'Cloud Foundry Linux-based filesystem'
          }
        },
        '73f00c1a-0ddc-43fd-8384-4b8971609874': {
          metadata: {
            guid: '73f00c1a-0ddc-43fd-8384-4b8971609874',
            url: '/v2/stacks/73f00c1a-0ddc-43fd-8384-4b8971609874',
            created_at: '2017-10-10T09:16:50Z',
            updated_at: '2017-10-10T09:16:50Z'
          },
          entity: {
            name: 'opensuse42',
            description: 'openSUSE-based filesystem'
          }
        },
        'd644d75e-fe53-492f-ba19-27e5d304413a': {
          metadata: {
            guid: 'd644d75e-fe53-492f-ba19-27e5d304413a',
            url: '/v2/stacks/d644d75e-fe53-492f-ba19-27e5d304413a',
            created_at: '2017-08-10T13:38:02Z',
            updated_at: '2017-08-10T13:38:02Z'
          },
          entity: {
            name: 'opensuse42',
            description: 'openSUSE-based filesystem'
          }
        },
        '3371958e-2de6-481f-9a6d-0198b42dea6e': {
          metadata: {
            guid: '3371958e-2de6-481f-9a6d-0198b42dea6e',
            url: '/v2/stacks/3371958e-2de6-481f-9a6d-0198b42dea6e',
            created_at: '2017-08-10T13:38:02Z',
            updated_at: '2017-08-10T13:38:02Z'
          },
          entity: {
            name: 'cflinuxfs2',
            description: 'Cloud Foundry Linux-based filesystem'
          }
        },
        '97a1b1e4-c307-48fd-b6a5-97cc621a9bda': {
          metadata: {
            guid: '97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            url: '/v2/stacks/97a1b1e4-c307-48fd-b6a5-97cc621a9bda',
            created_at: '2017-09-22T15:25:53Z',
            updated_at: '2017-09-22T15:25:53Z'
          },
          entity: {
            name: 'opensuse42',
            description: 'openSUSE-based filesystem'
          }
        },
        '18813ebb-8907-4c3b-8ba7-26a1632e16e9': {
          metadata: {
            guid: '18813ebb-8907-4c3b-8ba7-26a1632e16e9',
            url: '/v2/stacks/18813ebb-8907-4c3b-8ba7-26a1632e16e9',
            created_at: '2017-09-22T15:25:53Z',
            updated_at: '2017-09-22T15:25:53Z'
          },
          entity: {
            name: 'cflinuxfs2',
            description: 'Cloud Foundry Linux-based filesystem'
          }
        },
        'a360f093-c64d-4631-9b5e-a4a87cc47991': {
          metadata: {
            guid: 'a360f093-c64d-4631-9b5e-a4a87cc47991',
            url: '/v2/stacks/a360f093-c64d-4631-9b5e-a4a87cc47991',
            created_at: '2016-11-04T12:44:07Z',
            updated_at: '2016-11-04T12:44:07Z'
          },
          entity: {
            name: 'cflinuxfs2',
            description: 'Cloud Foundry Linux-based filesystem'
          }
        },
        '2f93057d-9a36-4f46-bd6e-87ddb8f574a2': {
          metadata: {
            guid: '2f93057d-9a36-4f46-bd6e-87ddb8f574a2',
            url: '/v2/stacks/2f93057d-9a36-4f46-bd6e-87ddb8f574a2',
            created_at: '2017-09-08T17:22:39Z',
            updated_at: '2017-09-08T17:22:39Z'
          },
          entity: {
            name: 'cflinuxfs2',
            description: 'Cloud Foundry Linux-based filesystem'
          }
        },
        '133ce0c7-44a0-4951-bbc8-b885c2b3cd53': {
          metadata: {
            guid: '133ce0c7-44a0-4951-bbc8-b885c2b3cd53',
            url: '/v2/stacks/133ce0c7-44a0-4951-bbc8-b885c2b3cd53',
            created_at: '2017-09-08T17:22:39Z',
            updated_at: '2017-09-08T17:22:39Z'
          },
          entity: {
            name: 'opensuse42',
            description: 'openSUSE-based filesystem'
          }
        }
      },
      space: {
        'd87ba175-51ec-4cc9-916c-bee26d00e498': {
          metadata: {
            guid: 'd87ba175-51ec-4cc9-916c-bee26d00e498',
            url: '/v2/spaces/d87ba175-51ec-4cc9-916c-bee26d00e498',
            created_at: '2017-10-10T09:28:48Z',
            updated_at: '2017-10-10T09:28:48Z'
          },
          entity: {
            name: 'dev',
            organization_guid: 'a63027a8-e160-4e71-ad59-6675aa94a886',
            space_quota_definition_guid: null,
            isolation_segment_guid: null,
            allow_ssh: true,
            organization_url: '/v2/organizations/a63027a8-e160-4e71-ad59-6675aa94a886',
            organization: {
              metadata: {
                guid: 'a63027a8-e160-4e71-ad59-6675aa94a886',
                url: '/v2/organizations/a63027a8-e160-4e71-ad59-6675aa94a886',
                created_at: '2017-10-10T09:28:45Z',
                updated_at: '2017-10-10T09:28:45Z'
              },
              entity: {
                name: 'SUSE',
                billing_enabled: false,
                quota_definition_guid: '522ee75f-b100-4f92-9801-74a3dc17fd6d',
                status: 'active',
                default_isolation_segment_guid: null,
                quota_definition_url: '/v2/quota_definitions/522ee75f-b100-4f92-9801-74a3dc17fd6d',
                spaces_url: '/v2/organizations/a63027a8-e160-4e71-ad59-6675aa94a886/spaces',
                domains_url: '/v2/organizations/a63027a8-e160-4e71-ad59-6675aa94a886/domains',
                private_domains_url: '/v2/organizations/a63027a8-e160-4e71-ad59-6675aa94a886/private_domains',
                users_url: '/v2/organizations/a63027a8-e160-4e71-ad59-6675aa94a886/users',
                managers_url: '/v2/organizations/a63027a8-e160-4e71-ad59-6675aa94a886/managers',
                billing_managers_url: '/v2/organizations/a63027a8-e160-4e71-ad59-6675aa94a886/billing_managers',
                auditors_url: '/v2/organizations/a63027a8-e160-4e71-ad59-6675aa94a886/auditors',
                app_events_url: '/v2/organizations/a63027a8-e160-4e71-ad59-6675aa94a886/app_events',
                space_quota_definitions_url: '/v2/organizations/a63027a8-e160-4e71-ad59-6675aa94a886/space_quota_definitions'
              }
            },
            developers_url: '/v2/spaces/d87ba175-51ec-4cc9-916c-bee26d00e498/developers',
            developers: [
              {
                metadata: {
                  guid: 'a6254a42-a218-4f41-b77e-35a8d53d9dd1',
                  url: '/v2/users/a6254a42-a218-4f41-b77e-35a8d53d9dd1',
                  created_at: '2017-10-10T09:17:30Z',
                  updated_at: '2017-10-10T09:17:30Z'
                },
                entity: {
                  admin: false,
                  active: true,
                  default_space_guid: null,
                  spaces_url: '/v2/users/a6254a42-a218-4f41-b77e-35a8d53d9dd1/spaces',
                  organizations_url: '/v2/users/a6254a42-a218-4f41-b77e-35a8d53d9dd1/organizations',
                  managed_organizations_url: '/v2/users/a6254a42-a218-4f41-b77e-35a8d53d9dd1/managed_organizations',
                  billing_managed_organizations_url: '/v2/users/a6254a42-a218-4f41-b77e-35a8d53d9dd1/billing_managed_organizations',
                  audited_organizations_url: '/v2/users/a6254a42-a218-4f41-b77e-35a8d53d9dd1/audited_organizations',
                  managed_spaces_url: '/v2/users/a6254a42-a218-4f41-b77e-35a8d53d9dd1/managed_spaces',
                  audited_spaces_url: '/v2/users/a6254a42-a218-4f41-b77e-35a8d53d9dd1/audited_spaces'
                }
              }
            ],
            managers_url: '/v2/spaces/d87ba175-51ec-4cc9-916c-bee26d00e498/managers',
            managers: [
              {
                metadata: {
                  guid: 'a6254a42-a218-4f41-b77e-35a8d53d9dd1',
                  url: '/v2/users/a6254a42-a218-4f41-b77e-35a8d53d9dd1',
                  created_at: '2017-10-10T09:17:30Z',
                  updated_at: '2017-10-10T09:17:30Z'
                },
                entity: {
                  admin: false,
                  active: true,
                  default_space_guid: null,
                  spaces_url: '/v2/users/a6254a42-a218-4f41-b77e-35a8d53d9dd1/spaces',
                  organizations_url: '/v2/users/a6254a42-a218-4f41-b77e-35a8d53d9dd1/organizations',
                  managed_organizations_url: '/v2/users/a6254a42-a218-4f41-b77e-35a8d53d9dd1/managed_organizations',
                  billing_managed_organizations_url: '/v2/users/a6254a42-a218-4f41-b77e-35a8d53d9dd1/billing_managed_organizations',
                  audited_organizations_url: '/v2/users/a6254a42-a218-4f41-b77e-35a8d53d9dd1/audited_organizations',
                  managed_spaces_url: '/v2/users/a6254a42-a218-4f41-b77e-35a8d53d9dd1/managed_spaces',
                  audited_spaces_url: '/v2/users/a6254a42-a218-4f41-b77e-35a8d53d9dd1/audited_spaces'
                }
              }
            ],
            auditors_url: '/v2/spaces/d87ba175-51ec-4cc9-916c-bee26d00e498/auditors',
            auditors: [],
            apps_url: '/v2/spaces/d87ba175-51ec-4cc9-916c-bee26d00e498/apps',
            routes_url: '/v2/spaces/d87ba175-51ec-4cc9-916c-bee26d00e498/routes',
            routes: [
              {
                metadata: {
                  guid: '255dd039-2a61-440b-a1d1-3cac1d6784da',
                  url: '/v2/routes/255dd039-2a61-440b-a1d1-3cac1d6784da',
                  created_at: '2017-10-10T09:31:59Z',
                  updated_at: '2017-10-10T09:31:59Z'
                },
                entity: {
                  host: 'app-autoscaler-broker',
                  path: '',
                  domain_guid: 'ffaa691e-2092-4ed4-8cb2-eb97fa5b34f1',
                  space_guid: 'd87ba175-51ec-4cc9-916c-bee26d00e498',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/ffaa691e-2092-4ed4-8cb2-eb97fa5b34f1',
                  space_url: '/v2/spaces/d87ba175-51ec-4cc9-916c-bee26d00e498',
                  apps_url: '/v2/routes/255dd039-2a61-440b-a1d1-3cac1d6784da/apps',
                  route_mappings_url: '/v2/routes/255dd039-2a61-440b-a1d1-3cac1d6784da/route_mappings'
                }
              }
            ],
            domains_url: '/v2/spaces/d87ba175-51ec-4cc9-916c-bee26d00e498/domains',
            domains: [
              {
                metadata: {
                  guid: 'ffaa691e-2092-4ed4-8cb2-eb97fa5b34f1',
                  url: '/v2/shared_domains/ffaa691e-2092-4ed4-8cb2-eb97fa5b34f1',
                  created_at: '2017-10-10T09:16:50Z',
                  updated_at: '2017-10-10T09:16:50Z'
                },
                entity: {
                  name: 'cf-dev.io',
                  router_group_guid: null,
                  router_group_type: null
                }
              }
            ],
            service_instances_url: '/v2/spaces/d87ba175-51ec-4cc9-916c-bee26d00e498/service_instances',
            service_instances: [],
            app_events_url: '/v2/spaces/d87ba175-51ec-4cc9-916c-bee26d00e498/app_events',
            events_url: '/v2/spaces/d87ba175-51ec-4cc9-916c-bee26d00e498/events',
            security_groups_url: '/v2/spaces/d87ba175-51ec-4cc9-916c-bee26d00e498/security_groups',
            security_groups: [
              {
                metadata: {
                  guid: '40c7d0e1-c3f1-47e4-a071-586dcd9b2196',
                  url: '/v2/security_groups/40c7d0e1-c3f1-47e4-a071-586dcd9b2196',
                  created_at: '2017-10-10T09:16:50Z',
                  updated_at: '2017-10-10T09:16:50Z'
                },
                entity: {
                  name: 'public_networks',
                  rules: [
                    {
                      destination: '0.0.0.0-9.255.255.255',
                      protocol: 'all'
                    },
                    {
                      destination: '11.0.0.0-169.253.255.255',
                      protocol: 'all'
                    },
                    {
                      destination: '169.255.0.0-172.15.255.255',
                      protocol: 'all'
                    },
                    {
                      destination: '172.32.0.0-192.167.255.255',
                      protocol: 'all'
                    },
                    {
                      destination: '192.169.0.0-255.255.255.255',
                      protocol: 'all'
                    }
                  ],
                  running_default: true,
                  staging_default: true,
                  spaces_url: '/v2/security_groups/40c7d0e1-c3f1-47e4-a071-586dcd9b2196/spaces',
                  staging_spaces_url: '/v2/security_groups/40c7d0e1-c3f1-47e4-a071-586dcd9b2196/staging_spaces'
                }
              },
              {
                metadata: {
                  guid: '6d664a18-d6d8-41fa-8046-af7b51c71eb3',
                  url: '/v2/security_groups/6d664a18-d6d8-41fa-8046-af7b51c71eb3',
                  created_at: '2017-10-10T09:16:50Z',
                  updated_at: '2017-10-10T09:16:50Z'
                },
                entity: {
                  name: 'dns',
                  rules: [
                    {
                      destination: '0.0.0.0/0',
                      ports: '53',
                      protocol: 'tcp'
                    },
                    {
                      destination: '0.0.0.0/0',
                      ports: '53',
                      protocol: 'udp'
                    }
                  ],
                  running_default: true,
                  staging_default: true,
                  spaces_url: '/v2/security_groups/6d664a18-d6d8-41fa-8046-af7b51c71eb3/spaces',
                  staging_spaces_url: '/v2/security_groups/6d664a18-d6d8-41fa-8046-af7b51c71eb3/staging_spaces'
                }
              },
              {
                metadata: {
                  guid: 'acb6a9d1-2a6f-4239-8bb7-fc0688124d2a',
                  url: '/v2/security_groups/acb6a9d1-2a6f-4239-8bb7-fc0688124d2a',
                  created_at: '2017-10-10T09:17:26Z',
                  updated_at: '2017-10-10T09:17:27Z'
                },
                entity: {
                  name: 'dev-mysql',
                  rules: [
                    {
                      destination: '10.0.0.117',
                      ports: '3306',
                      protocol: 'tcp'
                    }
                  ],
                  running_default: true,
                  staging_default: true,
                  spaces_url: '/v2/security_groups/acb6a9d1-2a6f-4239-8bb7-fc0688124d2a/spaces',
                  staging_spaces_url: '/v2/security_groups/acb6a9d1-2a6f-4239-8bb7-fc0688124d2a/staging_spaces'
                }
              }
            ],
            staging_security_groups_url: '/v2/spaces/d87ba175-51ec-4cc9-916c-bee26d00e498/staging_security_groups',
            staging_security_groups: [
              {
                metadata: {
                  guid: '40c7d0e1-c3f1-47e4-a071-586dcd9b2196',
                  url: '/v2/security_groups/40c7d0e1-c3f1-47e4-a071-586dcd9b2196',
                  created_at: '2017-10-10T09:16:50Z',
                  updated_at: '2017-10-10T09:16:50Z'
                },
                entity: {
                  name: 'public_networks',
                  rules: [
                    {
                      destination: '0.0.0.0-9.255.255.255',
                      protocol: 'all'
                    },
                    {
                      destination: '11.0.0.0-169.253.255.255',
                      protocol: 'all'
                    },
                    {
                      destination: '169.255.0.0-172.15.255.255',
                      protocol: 'all'
                    },
                    {
                      destination: '172.32.0.0-192.167.255.255',
                      protocol: 'all'
                    },
                    {
                      destination: '192.169.0.0-255.255.255.255',
                      protocol: 'all'
                    }
                  ],
                  running_default: true,
                  staging_default: true,
                  spaces_url: '/v2/security_groups/40c7d0e1-c3f1-47e4-a071-586dcd9b2196/spaces',
                  staging_spaces_url: '/v2/security_groups/40c7d0e1-c3f1-47e4-a071-586dcd9b2196/staging_spaces'
                }
              },
              {
                metadata: {
                  guid: '6d664a18-d6d8-41fa-8046-af7b51c71eb3',
                  url: '/v2/security_groups/6d664a18-d6d8-41fa-8046-af7b51c71eb3',
                  created_at: '2017-10-10T09:16:50Z',
                  updated_at: '2017-10-10T09:16:50Z'
                },
                entity: {
                  name: 'dns',
                  rules: [
                    {
                      destination: '0.0.0.0/0',
                      ports: '53',
                      protocol: 'tcp'
                    },
                    {
                      destination: '0.0.0.0/0',
                      ports: '53',
                      protocol: 'udp'
                    }
                  ],
                  running_default: true,
                  staging_default: true,
                  spaces_url: '/v2/security_groups/6d664a18-d6d8-41fa-8046-af7b51c71eb3/spaces',
                  staging_spaces_url: '/v2/security_groups/6d664a18-d6d8-41fa-8046-af7b51c71eb3/staging_spaces'
                }
              },
              {
                metadata: {
                  guid: 'acb6a9d1-2a6f-4239-8bb7-fc0688124d2a',
                  url: '/v2/security_groups/acb6a9d1-2a6f-4239-8bb7-fc0688124d2a',
                  created_at: '2017-10-10T09:17:26Z',
                  updated_at: '2017-10-10T09:17:27Z'
                },
                entity: {
                  name: 'dev-mysql',
                  rules: [
                    {
                      destination: '10.0.0.117',
                      ports: '3306',
                      protocol: 'tcp'
                    }
                  ],
                  running_default: true,
                  staging_default: true,
                  spaces_url: '/v2/security_groups/acb6a9d1-2a6f-4239-8bb7-fc0688124d2a/spaces',
                  staging_spaces_url: '/v2/security_groups/acb6a9d1-2a6f-4239-8bb7-fc0688124d2a/staging_spaces'
                }
              }
            ]
          }
        },
        '8071af91-4b2f-4569-b76e-12a21e71d701': {
          metadata: {
            guid: '8071af91-4b2f-4569-b76e-12a21e71d701',
            url: '/v2/spaces/8071af91-4b2f-4569-b76e-12a21e71d701',
            created_at: '2017-08-10T13:45:34Z',
            updated_at: '2017-08-10T13:45:34Z'
          },
          entity: {
            name: 'dev',
            organization_guid: '46b16d55-4198-4077-92ff-2c53298648a2',
            space_quota_definition_guid: null,
            isolation_segment_guid: null,
            allow_ssh: true,
            organization_url: '/v2/organizations/46b16d55-4198-4077-92ff-2c53298648a2',
            organization: {
              metadata: {
                guid: '46b16d55-4198-4077-92ff-2c53298648a2',
                url: '/v2/organizations/46b16d55-4198-4077-92ff-2c53298648a2',
                created_at: '2017-08-10T13:45:30Z',
                updated_at: '2017-08-10T13:45:30Z'
              },
              entity: {
                name: 'SUSE',
                billing_enabled: false,
                quota_definition_guid: 'ae738db2-34f5-4124-9072-c33ce404cc3e',
                status: 'active',
                default_isolation_segment_guid: null,
                quota_definition_url: '/v2/quota_definitions/ae738db2-34f5-4124-9072-c33ce404cc3e',
                spaces_url: '/v2/organizations/46b16d55-4198-4077-92ff-2c53298648a2/spaces',
                domains_url: '/v2/organizations/46b16d55-4198-4077-92ff-2c53298648a2/domains',
                private_domains_url: '/v2/organizations/46b16d55-4198-4077-92ff-2c53298648a2/private_domains',
                users_url: '/v2/organizations/46b16d55-4198-4077-92ff-2c53298648a2/users',
                managers_url: '/v2/organizations/46b16d55-4198-4077-92ff-2c53298648a2/managers',
                billing_managers_url: '/v2/organizations/46b16d55-4198-4077-92ff-2c53298648a2/billing_managers',
                auditors_url: '/v2/organizations/46b16d55-4198-4077-92ff-2c53298648a2/auditors',
                app_events_url: '/v2/organizations/46b16d55-4198-4077-92ff-2c53298648a2/app_events',
                space_quota_definitions_url: '/v2/organizations/46b16d55-4198-4077-92ff-2c53298648a2/space_quota_definitions'
              }
            },
            developers_url: '/v2/spaces/8071af91-4b2f-4569-b76e-12a21e71d701/developers',
            developers: [
              {
                metadata: {
                  guid: 'ded8a59b-b21d-4da6-a07a-0d865a9b16e2',
                  url: '/v2/users/ded8a59b-b21d-4da6-a07a-0d865a9b16e2',
                  created_at: '2017-08-10T13:39:37Z',
                  updated_at: '2017-08-10T13:39:37Z'
                },
                entity: {
                  admin: false,
                  active: true,
                  default_space_guid: null,
                  spaces_url: '/v2/users/ded8a59b-b21d-4da6-a07a-0d865a9b16e2/spaces',
                  organizations_url: '/v2/users/ded8a59b-b21d-4da6-a07a-0d865a9b16e2/organizations',
                  managed_organizations_url: '/v2/users/ded8a59b-b21d-4da6-a07a-0d865a9b16e2/managed_organizations',
                  billing_managed_organizations_url: '/v2/users/ded8a59b-b21d-4da6-a07a-0d865a9b16e2/billing_managed_organizations',
                  audited_organizations_url: '/v2/users/ded8a59b-b21d-4da6-a07a-0d865a9b16e2/audited_organizations',
                  managed_spaces_url: '/v2/users/ded8a59b-b21d-4da6-a07a-0d865a9b16e2/managed_spaces',
                  audited_spaces_url: '/v2/users/ded8a59b-b21d-4da6-a07a-0d865a9b16e2/audited_spaces'
                }
              }
            ],
            managers_url: '/v2/spaces/8071af91-4b2f-4569-b76e-12a21e71d701/managers',
            managers: [
              {
                metadata: {
                  guid: 'ded8a59b-b21d-4da6-a07a-0d865a9b16e2',
                  url: '/v2/users/ded8a59b-b21d-4da6-a07a-0d865a9b16e2',
                  created_at: '2017-08-10T13:39:37Z',
                  updated_at: '2017-08-10T13:39:37Z'
                },
                entity: {
                  admin: false,
                  active: true,
                  default_space_guid: null,
                  spaces_url: '/v2/users/ded8a59b-b21d-4da6-a07a-0d865a9b16e2/spaces',
                  organizations_url: '/v2/users/ded8a59b-b21d-4da6-a07a-0d865a9b16e2/organizations',
                  managed_organizations_url: '/v2/users/ded8a59b-b21d-4da6-a07a-0d865a9b16e2/managed_organizations',
                  billing_managed_organizations_url: '/v2/users/ded8a59b-b21d-4da6-a07a-0d865a9b16e2/billing_managed_organizations',
                  audited_organizations_url: '/v2/users/ded8a59b-b21d-4da6-a07a-0d865a9b16e2/audited_organizations',
                  managed_spaces_url: '/v2/users/ded8a59b-b21d-4da6-a07a-0d865a9b16e2/managed_spaces',
                  audited_spaces_url: '/v2/users/ded8a59b-b21d-4da6-a07a-0d865a9b16e2/audited_spaces'
                }
              }
            ],
            auditors_url: '/v2/spaces/8071af91-4b2f-4569-b76e-12a21e71d701/auditors',
            auditors: [],
            apps_url: '/v2/spaces/8071af91-4b2f-4569-b76e-12a21e71d701/apps',
            routes_url: '/v2/spaces/8071af91-4b2f-4569-b76e-12a21e71d701/routes',
            routes: [
              {
                metadata: {
                  guid: '42566218-680d-4f3d-88ff-ff405df12c0c',
                  url: '/v2/routes/42566218-680d-4f3d-88ff-ff405df12c0c',
                  created_at: '2017-08-18T14:55:41Z',
                  updated_at: '2017-08-18T14:55:41Z'
                },
                entity: {
                  host: 'delete-me',
                  path: '',
                  domain_guid: '0da3e819-8be9-47f3-b9a1-8329ab649d63',
                  space_guid: '8071af91-4b2f-4569-b76e-12a21e71d701',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/0da3e819-8be9-47f3-b9a1-8329ab649d63',
                  space_url: '/v2/spaces/8071af91-4b2f-4569-b76e-12a21e71d701',
                  apps_url: '/v2/routes/42566218-680d-4f3d-88ff-ff405df12c0c/apps',
                  route_mappings_url: '/v2/routes/42566218-680d-4f3d-88ff-ff405df12c0c/route_mappings'
                }
              },
              {
                metadata: {
                  guid: '15fc17a4-81cb-4095-bf31-c7a9062e4dbc',
                  url: '/v2/routes/15fc17a4-81cb-4095-bf31-c7a9062e4dbc',
                  created_at: '2017-08-18T14:56:14Z',
                  updated_at: '2017-08-18T14:56:14Z'
                },
                entity: {
                  host: 'rc-test-1',
                  path: '',
                  domain_guid: '0da3e819-8be9-47f3-b9a1-8329ab649d63',
                  space_guid: '8071af91-4b2f-4569-b76e-12a21e71d701',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/0da3e819-8be9-47f3-b9a1-8329ab649d63',
                  space_url: '/v2/spaces/8071af91-4b2f-4569-b76e-12a21e71d701',
                  apps_url: '/v2/routes/15fc17a4-81cb-4095-bf31-c7a9062e4dbc/apps',
                  route_mappings_url: '/v2/routes/15fc17a4-81cb-4095-bf31-c7a9062e4dbc/route_mappings'
                }
              },
              {
                metadata: {
                  guid: '8e2b07da-778d-4552-813b-1873c3004736',
                  url: '/v2/routes/8e2b07da-778d-4552-813b-1873c3004736',
                  created_at: '2017-08-18T14:56:24Z',
                  updated_at: '2017-08-18T14:56:24Z'
                },
                entity: {
                  host: 'rc-test-3',
                  path: '',
                  domain_guid: '0da3e819-8be9-47f3-b9a1-8329ab649d63',
                  space_guid: '8071af91-4b2f-4569-b76e-12a21e71d701',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/0da3e819-8be9-47f3-b9a1-8329ab649d63',
                  space_url: '/v2/spaces/8071af91-4b2f-4569-b76e-12a21e71d701',
                  apps_url: '/v2/routes/8e2b07da-778d-4552-813b-1873c3004736/apps',
                  route_mappings_url: '/v2/routes/8e2b07da-778d-4552-813b-1873c3004736/route_mappings'
                }
              },
              {
                metadata: {
                  guid: 'cb5908a7-4399-4881-8be5-ebe8fbcc2463',
                  url: '/v2/routes/cb5908a7-4399-4881-8be5-ebe8fbcc2463',
                  created_at: '2017-08-18T14:56:29Z',
                  updated_at: '2017-08-18T14:56:29Z'
                },
                entity: {
                  host: 'rc-test-4',
                  path: '',
                  domain_guid: '0da3e819-8be9-47f3-b9a1-8329ab649d63',
                  space_guid: '8071af91-4b2f-4569-b76e-12a21e71d701',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/0da3e819-8be9-47f3-b9a1-8329ab649d63',
                  space_url: '/v2/spaces/8071af91-4b2f-4569-b76e-12a21e71d701',
                  apps_url: '/v2/routes/cb5908a7-4399-4881-8be5-ebe8fbcc2463/apps',
                  route_mappings_url: '/v2/routes/cb5908a7-4399-4881-8be5-ebe8fbcc2463/route_mappings'
                }
              },
              {
                metadata: {
                  guid: 'd20320f9-9b5f-4640-9b0b-0bf454f9ae34',
                  url: '/v2/routes/d20320f9-9b5f-4640-9b0b-0bf454f9ae34',
                  created_at: '2017-08-18T14:56:35Z',
                  updated_at: '2017-08-18T14:56:35Z'
                },
                entity: {
                  host: 'rc-test-5',
                  path: '',
                  domain_guid: '0da3e819-8be9-47f3-b9a1-8329ab649d63',
                  space_guid: '8071af91-4b2f-4569-b76e-12a21e71d701',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/0da3e819-8be9-47f3-b9a1-8329ab649d63',
                  space_url: '/v2/spaces/8071af91-4b2f-4569-b76e-12a21e71d701',
                  apps_url: '/v2/routes/d20320f9-9b5f-4640-9b0b-0bf454f9ae34/apps',
                  route_mappings_url: '/v2/routes/d20320f9-9b5f-4640-9b0b-0bf454f9ae34/route_mappings'
                }
              },
              {
                metadata: {
                  guid: '1f6d6e07-2d84-4a23-9c07-5af25c5f5038',
                  url: '/v2/routes/1f6d6e07-2d84-4a23-9c07-5af25c5f5038',
                  created_at: '2017-08-18T14:57:22Z',
                  updated_at: '2017-08-18T14:57:22Z'
                },
                entity: {
                  host: 'rc-test-6',
                  path: '',
                  domain_guid: '0da3e819-8be9-47f3-b9a1-8329ab649d63',
                  space_guid: '8071af91-4b2f-4569-b76e-12a21e71d701',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/0da3e819-8be9-47f3-b9a1-8329ab649d63',
                  space_url: '/v2/spaces/8071af91-4b2f-4569-b76e-12a21e71d701',
                  apps_url: '/v2/routes/1f6d6e07-2d84-4a23-9c07-5af25c5f5038/apps',
                  route_mappings_url: '/v2/routes/1f6d6e07-2d84-4a23-9c07-5af25c5f5038/route_mappings'
                }
              },
              {
                metadata: {
                  guid: '1900053f-01fe-4125-a2af-e3968a32304e',
                  url: '/v2/routes/1900053f-01fe-4125-a2af-e3968a32304e',
                  created_at: '2017-08-21T14:43:03Z',
                  updated_at: '2017-08-21T14:43:03Z'
                },
                entity: {
                  host: 'test1',
                  path: '',
                  domain_guid: '0da3e819-8be9-47f3-b9a1-8329ab649d63',
                  space_guid: '8071af91-4b2f-4569-b76e-12a21e71d701',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/0da3e819-8be9-47f3-b9a1-8329ab649d63',
                  space_url: '/v2/spaces/8071af91-4b2f-4569-b76e-12a21e71d701',
                  apps_url: '/v2/routes/1900053f-01fe-4125-a2af-e3968a32304e/apps',
                  route_mappings_url: '/v2/routes/1900053f-01fe-4125-a2af-e3968a32304e/route_mappings'
                }
              },
              {
                metadata: {
                  guid: '16395d20-4d16-490e-a240-1769771d4ffc',
                  url: '/v2/routes/16395d20-4d16-490e-a240-1769771d4ffc',
                  created_at: '2017-09-13T21:08:31Z',
                  updated_at: '2017-09-13T21:08:31Z'
                },
                entity: {
                  host: 'slides',
                  path: '',
                  domain_guid: '0da3e819-8be9-47f3-b9a1-8329ab649d63',
                  space_guid: '8071af91-4b2f-4569-b76e-12a21e71d701',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/0da3e819-8be9-47f3-b9a1-8329ab649d63',
                  space_url: '/v2/spaces/8071af91-4b2f-4569-b76e-12a21e71d701',
                  apps_url: '/v2/routes/16395d20-4d16-490e-a240-1769771d4ffc/apps',
                  route_mappings_url: '/v2/routes/16395d20-4d16-490e-a240-1769771d4ffc/route_mappings'
                }
              },
              {
                metadata: {
                  guid: 'c56091b1-bba0-4c82-9af6-2c0488dabb56',
                  url: '/v2/routes/c56091b1-bba0-4c82-9af6-2c0488dabb56',
                  created_at: '2017-10-03T15:20:06Z',
                  updated_at: '2017-10-03T15:20:06Z'
                },
                entity: {
                  host: 'neil',
                  path: '',
                  domain_guid: '0da3e819-8be9-47f3-b9a1-8329ab649d63',
                  space_guid: '8071af91-4b2f-4569-b76e-12a21e71d701',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/0da3e819-8be9-47f3-b9a1-8329ab649d63',
                  space_url: '/v2/spaces/8071af91-4b2f-4569-b76e-12a21e71d701',
                  apps_url: '/v2/routes/c56091b1-bba0-4c82-9af6-2c0488dabb56/apps',
                  route_mappings_url: '/v2/routes/c56091b1-bba0-4c82-9af6-2c0488dabb56/route_mappings'
                }
              }
            ],
            domains_url: '/v2/spaces/8071af91-4b2f-4569-b76e-12a21e71d701/domains',
            domains: [
              {
                metadata: {
                  guid: '0da3e819-8be9-47f3-b9a1-8329ab649d63',
                  url: '/v2/shared_domains/0da3e819-8be9-47f3-b9a1-8329ab649d63',
                  created_at: '2017-08-10T13:38:02Z',
                  updated_at: '2017-08-10T13:38:02Z'
                },
                entity: {
                  name: 'cf-dev.io',
                  router_group_guid: null,
                  router_group_type: null
                }
              }
            ],
            service_instances_url: '/v2/spaces/8071af91-4b2f-4569-b76e-12a21e71d701/service_instances',
            service_instances: [
              {
                metadata: {
                  guid: 'd88b9115-139e-43a7-9d80-a1f4953fdd10',
                  url: '/v2/service_instances/d88b9115-139e-43a7-9d80-a1f4953fdd10',
                  created_at: '2017-08-18T14:51:43Z',
                  updated_at: '2017-08-18T14:51:43Z'
                },
                entity: {
                  name: 'test',
                  credentials: {},
                  service_plan_guid: '549409b6-b754-4643-a83b-885dbcfd2dfb',
                  space_guid: '8071af91-4b2f-4569-b76e-12a21e71d701',
                  gateway_data: null,
                  dashboard_url: 'https://app-autoscaler-broker.cf-dev.io/dashboard',
                  type: 'managed_service_instance',
                  last_operation: {
                    type: 'create',
                    state: 'succeeded',
                    description: '',
                    updated_at: '2017-08-18T14:51:43Z',
                    created_at: '2017-08-18T14:51:43Z'
                  },
                  tags: [],
                  service_guid: '43b1c1bd-0a26-4986-adcc-700d56559f1e',
                  space_url: '/v2/spaces/8071af91-4b2f-4569-b76e-12a21e71d701',
                  service_plan_url: '/v2/service_plans/549409b6-b754-4643-a83b-885dbcfd2dfb',
                  service_bindings_url: '/v2/service_instances/d88b9115-139e-43a7-9d80-a1f4953fdd10/service_bindings',
                  service_keys_url: '/v2/service_instances/d88b9115-139e-43a7-9d80-a1f4953fdd10/service_keys',
                  routes_url: '/v2/service_instances/d88b9115-139e-43a7-9d80-a1f4953fdd10/routes',
                  service_url: '/v2/services/43b1c1bd-0a26-4986-adcc-700d56559f1e'
                }
              },
              {
                metadata: {
                  guid: 'bfae68fb-b981-4ee2-88ec-70176f7a7c93',
                  url: '/v2/service_instances/bfae68fb-b981-4ee2-88ec-70176f7a7c93',
                  created_at: '2017-08-22T14:49:05Z',
                  updated_at: '2017-08-22T14:49:05Z'
                },
                entity: {
                  name: 'NathanTest123',
                  credentials: {},
                  service_plan_guid: '3c1b3320-d1a9-40e4-91b4-5841c3239cce',
                  space_guid: '8071af91-4b2f-4569-b76e-12a21e71d701',
                  gateway_data: null,
                  dashboard_url: 'https://cf-dev.io/manage/instances/bfae68fb-b981-4ee2-88ec-70176f7a7c93',
                  type: 'managed_service_instance',
                  last_operation: {
                    type: 'create',
                    state: 'succeeded',
                    description: '',
                    updated_at: '2017-08-22T14:49:05Z',
                    created_at: '2017-08-22T14:49:05Z'
                  },
                  tags: [],
                  service_guid: '606e5ecd-eea1-47df-b4f0-dc833642e1ac',
                  space_url: '/v2/spaces/8071af91-4b2f-4569-b76e-12a21e71d701',
                  service_plan_url: '/v2/service_plans/3c1b3320-d1a9-40e4-91b4-5841c3239cce',
                  service_bindings_url: '/v2/service_instances/bfae68fb-b981-4ee2-88ec-70176f7a7c93/service_bindings',
                  service_keys_url: '/v2/service_instances/bfae68fb-b981-4ee2-88ec-70176f7a7c93/service_keys',
                  routes_url: '/v2/service_instances/bfae68fb-b981-4ee2-88ec-70176f7a7c93/routes',
                  service_url: '/v2/services/606e5ecd-eea1-47df-b4f0-dc833642e1ac'
                }
              },
              {
                metadata: {
                  guid: 'c54d3386-2c5a-4c0a-ae10-fe2008c0c2b0',
                  url: '/v2/service_instances/c54d3386-2c5a-4c0a-ae10-fe2008c0c2b0',
                  created_at: '2017-08-22T16:15:55Z',
                  updated_at: '2017-08-22T16:15:55Z'
                },
                entity: {
                  name: 'Test-auto-scaler',
                  credentials: {},
                  service_plan_guid: '549409b6-b754-4643-a83b-885dbcfd2dfb',
                  space_guid: '8071af91-4b2f-4569-b76e-12a21e71d701',
                  gateway_data: null,
                  dashboard_url: 'https://app-autoscaler-broker.cf-dev.io/dashboard',
                  type: 'managed_service_instance',
                  last_operation: {
                    type: 'create',
                    state: 'succeeded',
                    description: '',
                    updated_at: '2017-08-22T16:15:55Z',
                    created_at: '2017-08-22T16:15:55Z'
                  },
                  tags: [],
                  service_guid: '43b1c1bd-0a26-4986-adcc-700d56559f1e',
                  space_url: '/v2/spaces/8071af91-4b2f-4569-b76e-12a21e71d701',
                  service_plan_url: '/v2/service_plans/549409b6-b754-4643-a83b-885dbcfd2dfb',
                  service_bindings_url: '/v2/service_instances/c54d3386-2c5a-4c0a-ae10-fe2008c0c2b0/service_bindings',
                  service_keys_url: '/v2/service_instances/c54d3386-2c5a-4c0a-ae10-fe2008c0c2b0/service_keys',
                  routes_url: '/v2/service_instances/c54d3386-2c5a-4c0a-ae10-fe2008c0c2b0/routes',
                  service_url: '/v2/services/43b1c1bd-0a26-4986-adcc-700d56559f1e'
                }
              },
              {
                metadata: {
                  guid: '486e85f4-12a4-4495-8b49-9b01a8886991',
                  url: '/v2/service_instances/486e85f4-12a4-4495-8b49-9b01a8886991',
                  created_at: '2017-08-24T08:56:38Z',
                  updated_at: '2017-08-24T08:56:38Z'
                },
                entity: {
                  name: 'ShouldBeHereTest',
                  credentials: {},
                  service_plan_guid: '3c1b3320-d1a9-40e4-91b4-5841c3239cce',
                  space_guid: '8071af91-4b2f-4569-b76e-12a21e71d701',
                  gateway_data: null,
                  dashboard_url: 'https://cf-dev.io/manage/instances/486e85f4-12a4-4495-8b49-9b01a8886991',
                  type: 'managed_service_instance',
                  last_operation: {
                    type: 'create',
                    state: 'succeeded',
                    description: '',
                    updated_at: '2017-08-24T08:56:38Z',
                    created_at: '2017-08-24T08:56:38Z'
                  },
                  tags: [],
                  service_guid: '606e5ecd-eea1-47df-b4f0-dc833642e1ac',
                  space_url: '/v2/spaces/8071af91-4b2f-4569-b76e-12a21e71d701',
                  service_plan_url: '/v2/service_plans/3c1b3320-d1a9-40e4-91b4-5841c3239cce',
                  service_bindings_url: '/v2/service_instances/486e85f4-12a4-4495-8b49-9b01a8886991/service_bindings',
                  service_keys_url: '/v2/service_instances/486e85f4-12a4-4495-8b49-9b01a8886991/service_keys',
                  routes_url: '/v2/service_instances/486e85f4-12a4-4495-8b49-9b01a8886991/routes',
                  service_url: '/v2/services/606e5ecd-eea1-47df-b4f0-dc833642e1ac'
                }
              }
            ],
            app_events_url: '/v2/spaces/8071af91-4b2f-4569-b76e-12a21e71d701/app_events',
            events_url: '/v2/spaces/8071af91-4b2f-4569-b76e-12a21e71d701/events',
            security_groups_url: '/v2/spaces/8071af91-4b2f-4569-b76e-12a21e71d701/security_groups',
            security_groups: [
              {
                metadata: {
                  guid: 'bcd2b298-eaa2-4d13-bce2-6d62be8eaa36',
                  url: '/v2/security_groups/bcd2b298-eaa2-4d13-bce2-6d62be8eaa36',
                  created_at: '2017-08-10T13:45:36Z',
                  updated_at: '2017-08-10T13:45:36Z'
                },
                entity: {
                  name: 'all-traffic',
                  rules: [
                    {
                      destination: '0.0.0.0-255.255.255.255',
                      protocol: 'all'
                    }
                  ],
                  running_default: false,
                  staging_default: false,
                  spaces_url: '/v2/security_groups/bcd2b298-eaa2-4d13-bce2-6d62be8eaa36/spaces',
                  staging_spaces_url: '/v2/security_groups/bcd2b298-eaa2-4d13-bce2-6d62be8eaa36/staging_spaces'
                }
              },
              {
                metadata: {
                  guid: 'fd8f2bbf-2f1a-4320-a07f-240bb2ca02dd',
                  url: '/v2/security_groups/fd8f2bbf-2f1a-4320-a07f-240bb2ca02dd',
                  created_at: '2017-08-10T13:38:02Z',
                  updated_at: '2017-08-10T13:38:02Z'
                },
                entity: {
                  name: 'public_networks',
                  rules: [
                    {
                      destination: '0.0.0.0-9.255.255.255',
                      protocol: 'all'
                    },
                    {
                      destination: '11.0.0.0-169.253.255.255',
                      protocol: 'all'
                    },
                    {
                      destination: '169.255.0.0-172.15.255.255',
                      protocol: 'all'
                    },
                    {
                      destination: '172.32.0.0-192.167.255.255',
                      protocol: 'all'
                    },
                    {
                      destination: '192.169.0.0-255.255.255.255',
                      protocol: 'all'
                    }
                  ],
                  running_default: true,
                  staging_default: true,
                  spaces_url: '/v2/security_groups/fd8f2bbf-2f1a-4320-a07f-240bb2ca02dd/spaces',
                  staging_spaces_url: '/v2/security_groups/fd8f2bbf-2f1a-4320-a07f-240bb2ca02dd/staging_spaces'
                }
              },
              {
                metadata: {
                  guid: 'edd678c5-8abc-4973-8b6f-856bb87ca7de',
                  url: '/v2/security_groups/edd678c5-8abc-4973-8b6f-856bb87ca7de',
                  created_at: '2017-08-10T13:38:02Z',
                  updated_at: '2017-08-10T13:38:02Z'
                },
                entity: {
                  name: 'dns',
                  rules: [
                    {
                      destination: '0.0.0.0/0',
                      ports: '53',
                      protocol: 'tcp'
                    },
                    {
                      destination: '0.0.0.0/0',
                      ports: '53',
                      protocol: 'udp'
                    }
                  ],
                  running_default: true,
                  staging_default: true,
                  spaces_url: '/v2/security_groups/edd678c5-8abc-4973-8b6f-856bb87ca7de/spaces',
                  staging_spaces_url: '/v2/security_groups/edd678c5-8abc-4973-8b6f-856bb87ca7de/staging_spaces'
                }
              },
              {
                metadata: {
                  guid: '65c2b61e-dc9f-4415-86bf-493cb4ea284e',
                  url: '/v2/security_groups/65c2b61e-dc9f-4415-86bf-493cb4ea284e',
                  created_at: '2017-08-10T13:39:32Z',
                  updated_at: '2017-08-10T13:39:34Z'
                },
                entity: {
                  name: 'dev-mysql',
                  rules: [
                    {
                      destination: '10.0.0.41',
                      ports: '3306',
                      protocol: 'tcp'
                    }
                  ],
                  running_default: true,
                  staging_default: true,
                  spaces_url: '/v2/security_groups/65c2b61e-dc9f-4415-86bf-493cb4ea284e/spaces',
                  staging_spaces_url: '/v2/security_groups/65c2b61e-dc9f-4415-86bf-493cb4ea284e/staging_spaces'
                }
              }
            ],
            staging_security_groups_url: '/v2/spaces/8071af91-4b2f-4569-b76e-12a21e71d701/staging_security_groups',
            staging_security_groups: [
              {
                metadata: {
                  guid: 'fd8f2bbf-2f1a-4320-a07f-240bb2ca02dd',
                  url: '/v2/security_groups/fd8f2bbf-2f1a-4320-a07f-240bb2ca02dd',
                  created_at: '2017-08-10T13:38:02Z',
                  updated_at: '2017-08-10T13:38:02Z'
                },
                entity: {
                  name: 'public_networks',
                  rules: [
                    {
                      destination: '0.0.0.0-9.255.255.255',
                      protocol: 'all'
                    },
                    {
                      destination: '11.0.0.0-169.253.255.255',
                      protocol: 'all'
                    },
                    {
                      destination: '169.255.0.0-172.15.255.255',
                      protocol: 'all'
                    },
                    {
                      destination: '172.32.0.0-192.167.255.255',
                      protocol: 'all'
                    },
                    {
                      destination: '192.169.0.0-255.255.255.255',
                      protocol: 'all'
                    }
                  ],
                  running_default: true,
                  staging_default: true,
                  spaces_url: '/v2/security_groups/fd8f2bbf-2f1a-4320-a07f-240bb2ca02dd/spaces',
                  staging_spaces_url: '/v2/security_groups/fd8f2bbf-2f1a-4320-a07f-240bb2ca02dd/staging_spaces'
                }
              },
              {
                metadata: {
                  guid: 'edd678c5-8abc-4973-8b6f-856bb87ca7de',
                  url: '/v2/security_groups/edd678c5-8abc-4973-8b6f-856bb87ca7de',
                  created_at: '2017-08-10T13:38:02Z',
                  updated_at: '2017-08-10T13:38:02Z'
                },
                entity: {
                  name: 'dns',
                  rules: [
                    {
                      destination: '0.0.0.0/0',
                      ports: '53',
                      protocol: 'tcp'
                    },
                    {
                      destination: '0.0.0.0/0',
                      ports: '53',
                      protocol: 'udp'
                    }
                  ],
                  running_default: true,
                  staging_default: true,
                  spaces_url: '/v2/security_groups/edd678c5-8abc-4973-8b6f-856bb87ca7de/spaces',
                  staging_spaces_url: '/v2/security_groups/edd678c5-8abc-4973-8b6f-856bb87ca7de/staging_spaces'
                }
              },
              {
                metadata: {
                  guid: '65c2b61e-dc9f-4415-86bf-493cb4ea284e',
                  url: '/v2/security_groups/65c2b61e-dc9f-4415-86bf-493cb4ea284e',
                  created_at: '2017-08-10T13:39:32Z',
                  updated_at: '2017-08-10T13:39:34Z'
                },
                entity: {
                  name: 'dev-mysql',
                  rules: [
                    {
                      destination: '10.0.0.41',
                      ports: '3306',
                      protocol: 'tcp'
                    }
                  ],
                  running_default: true,
                  staging_default: true,
                  spaces_url: '/v2/security_groups/65c2b61e-dc9f-4415-86bf-493cb4ea284e/spaces',
                  staging_spaces_url: '/v2/security_groups/65c2b61e-dc9f-4415-86bf-493cb4ea284e/staging_spaces'
                }
              }
            ]
          }
        },
        'f5e6affb-8b7b-4fa8-aea3-24df8b682a85': {
          metadata: {
            guid: 'f5e6affb-8b7b-4fa8-aea3-24df8b682a85',
            url: '/v2/spaces/f5e6affb-8b7b-4fa8-aea3-24df8b682a85',
            created_at: '2017-08-14T11:02:29Z',
            updated_at: '2017-08-14T11:02:29Z'
          },
          entity: {
            name: 'services',
            organization_guid: '48f9c989-8215-4164-8d1f-d3aa754fdcb5',
            space_quota_definition_guid: null,
            isolation_segment_guid: null,
            allow_ssh: true,
            organization_url: '/v2/organizations/48f9c989-8215-4164-8d1f-d3aa754fdcb5',
            organization: {
              metadata: {
                guid: '48f9c989-8215-4164-8d1f-d3aa754fdcb5',
                url: '/v2/organizations/48f9c989-8215-4164-8d1f-d3aa754fdcb5',
                created_at: '2017-08-10T13:38:02Z',
                updated_at: '2017-08-10T13:38:02Z'
              },
              entity: {
                name: 'system',
                billing_enabled: false,
                quota_definition_guid: 'ae738db2-34f5-4124-9072-c33ce404cc3e',
                status: 'active',
                default_isolation_segment_guid: null,
                quota_definition_url: '/v2/quota_definitions/ae738db2-34f5-4124-9072-c33ce404cc3e',
                spaces_url: '/v2/organizations/48f9c989-8215-4164-8d1f-d3aa754fdcb5/spaces',
                domains_url: '/v2/organizations/48f9c989-8215-4164-8d1f-d3aa754fdcb5/domains',
                private_domains_url: '/v2/organizations/48f9c989-8215-4164-8d1f-d3aa754fdcb5/private_domains',
                users_url: '/v2/organizations/48f9c989-8215-4164-8d1f-d3aa754fdcb5/users',
                managers_url: '/v2/organizations/48f9c989-8215-4164-8d1f-d3aa754fdcb5/managers',
                billing_managers_url: '/v2/organizations/48f9c989-8215-4164-8d1f-d3aa754fdcb5/billing_managers',
                auditors_url: '/v2/organizations/48f9c989-8215-4164-8d1f-d3aa754fdcb5/auditors',
                app_events_url: '/v2/organizations/48f9c989-8215-4164-8d1f-d3aa754fdcb5/app_events',
                space_quota_definitions_url: '/v2/organizations/48f9c989-8215-4164-8d1f-d3aa754fdcb5/space_quota_definitions'
              }
            },
            developers_url: '/v2/spaces/f5e6affb-8b7b-4fa8-aea3-24df8b682a85/developers',
            developers: [
              {
                metadata: {
                  guid: 'ded8a59b-b21d-4da6-a07a-0d865a9b16e2',
                  url: '/v2/users/ded8a59b-b21d-4da6-a07a-0d865a9b16e2',
                  created_at: '2017-08-10T13:39:37Z',
                  updated_at: '2017-08-10T13:39:37Z'
                },
                entity: {
                  admin: false,
                  active: true,
                  default_space_guid: null,
                  spaces_url: '/v2/users/ded8a59b-b21d-4da6-a07a-0d865a9b16e2/spaces',
                  organizations_url: '/v2/users/ded8a59b-b21d-4da6-a07a-0d865a9b16e2/organizations',
                  managed_organizations_url: '/v2/users/ded8a59b-b21d-4da6-a07a-0d865a9b16e2/managed_organizations',
                  billing_managed_organizations_url: '/v2/users/ded8a59b-b21d-4da6-a07a-0d865a9b16e2/billing_managed_organizations',
                  audited_organizations_url: '/v2/users/ded8a59b-b21d-4da6-a07a-0d865a9b16e2/audited_organizations',
                  managed_spaces_url: '/v2/users/ded8a59b-b21d-4da6-a07a-0d865a9b16e2/managed_spaces',
                  audited_spaces_url: '/v2/users/ded8a59b-b21d-4da6-a07a-0d865a9b16e2/audited_spaces'
                }
              }
            ],
            managers_url: '/v2/spaces/f5e6affb-8b7b-4fa8-aea3-24df8b682a85/managers',
            managers: [
              {
                metadata: {
                  guid: 'ded8a59b-b21d-4da6-a07a-0d865a9b16e2',
                  url: '/v2/users/ded8a59b-b21d-4da6-a07a-0d865a9b16e2',
                  created_at: '2017-08-10T13:39:37Z',
                  updated_at: '2017-08-10T13:39:37Z'
                },
                entity: {
                  admin: false,
                  active: true,
                  default_space_guid: null,
                  spaces_url: '/v2/users/ded8a59b-b21d-4da6-a07a-0d865a9b16e2/spaces',
                  organizations_url: '/v2/users/ded8a59b-b21d-4da6-a07a-0d865a9b16e2/organizations',
                  managed_organizations_url: '/v2/users/ded8a59b-b21d-4da6-a07a-0d865a9b16e2/managed_organizations',
                  billing_managed_organizations_url: '/v2/users/ded8a59b-b21d-4da6-a07a-0d865a9b16e2/billing_managed_organizations',
                  audited_organizations_url: '/v2/users/ded8a59b-b21d-4da6-a07a-0d865a9b16e2/audited_organizations',
                  managed_spaces_url: '/v2/users/ded8a59b-b21d-4da6-a07a-0d865a9b16e2/managed_spaces',
                  audited_spaces_url: '/v2/users/ded8a59b-b21d-4da6-a07a-0d865a9b16e2/audited_spaces'
                }
              }
            ],
            auditors_url: '/v2/spaces/f5e6affb-8b7b-4fa8-aea3-24df8b682a85/auditors',
            auditors: [],
            apps_url: '/v2/spaces/f5e6affb-8b7b-4fa8-aea3-24df8b682a85/apps',
            routes_url: '/v2/spaces/f5e6affb-8b7b-4fa8-aea3-24df8b682a85/routes',
            routes: [
              {
                metadata: {
                  guid: '9a88f5de-517b-4360-a843-0e7345ad4da5',
                  url: '/v2/routes/9a88f5de-517b-4360-a843-0e7345ad4da5',
                  created_at: '2017-08-14T11:07:00Z',
                  updated_at: '2017-08-14T11:07:00Z'
                },
                entity: {
                  host: 'app-autoscaler-broker',
                  path: '',
                  domain_guid: '0da3e819-8be9-47f3-b9a1-8329ab649d63',
                  space_guid: 'f5e6affb-8b7b-4fa8-aea3-24df8b682a85',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/0da3e819-8be9-47f3-b9a1-8329ab649d63',
                  space_url: '/v2/spaces/f5e6affb-8b7b-4fa8-aea3-24df8b682a85',
                  apps_url: '/v2/routes/9a88f5de-517b-4360-a843-0e7345ad4da5/apps',
                  route_mappings_url: '/v2/routes/9a88f5de-517b-4360-a843-0e7345ad4da5/route_mappings'
                }
              },
              {
                metadata: {
                  guid: 'a66f9167-9bce-4e24-9e6b-bf9afcce6c6e',
                  url: '/v2/routes/a66f9167-9bce-4e24-9e6b-bf9afcce6c6e',
                  created_at: '2017-08-18T13:13:05Z',
                  updated_at: '2017-08-18T13:13:05Z'
                },
                entity: {
                  host: 'Test-route',
                  path: '',
                  domain_guid: '0da3e819-8be9-47f3-b9a1-8329ab649d63',
                  space_guid: 'f5e6affb-8b7b-4fa8-aea3-24df8b682a85',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/0da3e819-8be9-47f3-b9a1-8329ab649d63',
                  space_url: '/v2/spaces/f5e6affb-8b7b-4fa8-aea3-24df8b682a85',
                  apps_url: '/v2/routes/a66f9167-9bce-4e24-9e6b-bf9afcce6c6e/apps',
                  route_mappings_url: '/v2/routes/a66f9167-9bce-4e24-9e6b-bf9afcce6c6e/route_mappings'
                }
              },
              {
                metadata: {
                  guid: '8898cf37-df96-4156-8274-644b835c55f0',
                  url: '/v2/routes/8898cf37-df96-4156-8274-644b835c55f0',
                  created_at: '2017-09-27T11:51:13Z',
                  updated_at: '2017-09-27T11:51:13Z'
                },
                entity: {
                  host: 'asdasd',
                  path: '',
                  domain_guid: '0da3e819-8be9-47f3-b9a1-8329ab649d63',
                  space_guid: 'f5e6affb-8b7b-4fa8-aea3-24df8b682a85',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/0da3e819-8be9-47f3-b9a1-8329ab649d63',
                  space_url: '/v2/spaces/f5e6affb-8b7b-4fa8-aea3-24df8b682a85',
                  apps_url: '/v2/routes/8898cf37-df96-4156-8274-644b835c55f0/apps',
                  route_mappings_url: '/v2/routes/8898cf37-df96-4156-8274-644b835c55f0/route_mappings'
                }
              },
              {
                metadata: {
                  guid: '109aa9a4-f8a0-409a-b416-e93c15591d75',
                  url: '/v2/routes/109aa9a4-f8a0-409a-b416-e93c15591d75',
                  created_at: '2017-09-28T15:07:53Z',
                  updated_at: '2017-09-28T15:07:53Z'
                },
                entity: {
                  host: 'asdasdasdasdasd',
                  path: '',
                  domain_guid: '0da3e819-8be9-47f3-b9a1-8329ab649d63',
                  space_guid: 'f5e6affb-8b7b-4fa8-aea3-24df8b682a85',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/0da3e819-8be9-47f3-b9a1-8329ab649d63',
                  space_url: '/v2/spaces/f5e6affb-8b7b-4fa8-aea3-24df8b682a85',
                  apps_url: '/v2/routes/109aa9a4-f8a0-409a-b416-e93c15591d75/apps',
                  route_mappings_url: '/v2/routes/109aa9a4-f8a0-409a-b416-e93c15591d75/route_mappings'
                }
              },
              {
                metadata: {
                  guid: '9b6f5788-4b22-42b3-b3d6-91d67bf6d127',
                  url: '/v2/routes/9b6f5788-4b22-42b3-b3d6-91d67bf6d127',
                  created_at: '2017-09-28T15:30:13Z',
                  updated_at: '2017-09-28T15:30:13Z'
                },
                entity: {
                  host: 'Nathan-Test',
                  path: '',
                  domain_guid: '0da3e819-8be9-47f3-b9a1-8329ab649d63',
                  space_guid: 'f5e6affb-8b7b-4fa8-aea3-24df8b682a85',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/0da3e819-8be9-47f3-b9a1-8329ab649d63',
                  space_url: '/v2/spaces/f5e6affb-8b7b-4fa8-aea3-24df8b682a85',
                  apps_url: '/v2/routes/9b6f5788-4b22-42b3-b3d6-91d67bf6d127/apps',
                  route_mappings_url: '/v2/routes/9b6f5788-4b22-42b3-b3d6-91d67bf6d127/route_mappings'
                }
              }
            ],
            domains_url: '/v2/spaces/f5e6affb-8b7b-4fa8-aea3-24df8b682a85/domains',
            domains: [
              {
                metadata: {
                  guid: '0da3e819-8be9-47f3-b9a1-8329ab649d63',
                  url: '/v2/shared_domains/0da3e819-8be9-47f3-b9a1-8329ab649d63',
                  created_at: '2017-08-10T13:38:02Z',
                  updated_at: '2017-08-10T13:38:02Z'
                },
                entity: {
                  name: 'cf-dev.io',
                  router_group_guid: null,
                  router_group_type: null
                }
              }
            ],
            service_instances_url: '/v2/spaces/f5e6affb-8b7b-4fa8-aea3-24df8b682a85/service_instances',
            service_instances: [
              {
                metadata: {
                  guid: 'e321cd6c-458e-48c9-83c1-c6ee45f46bcb',
                  url: '/v2/service_instances/e321cd6c-458e-48c9-83c1-c6ee45f46bcb',
                  created_at: '2017-08-22T12:00:34Z',
                  updated_at: '2017-08-22T12:00:34Z'
                },
                entity: {
                  name: 'Test123',
                  credentials: {},
                  service_plan_guid: '3c1b3320-d1a9-40e4-91b4-5841c3239cce',
                  space_guid: 'f5e6affb-8b7b-4fa8-aea3-24df8b682a85',
                  gateway_data: null,
                  dashboard_url: 'https://cf-dev.io/manage/instances/e321cd6c-458e-48c9-83c1-c6ee45f46bcb',
                  type: 'managed_service_instance',
                  last_operation: {
                    type: 'create',
                    state: 'succeeded',
                    description: '',
                    updated_at: '2017-08-22T12:00:34Z',
                    created_at: '2017-08-22T12:00:34Z'
                  },
                  tags: [],
                  service_guid: '606e5ecd-eea1-47df-b4f0-dc833642e1ac',
                  space_url: '/v2/spaces/f5e6affb-8b7b-4fa8-aea3-24df8b682a85',
                  service_plan_url: '/v2/service_plans/3c1b3320-d1a9-40e4-91b4-5841c3239cce',
                  service_bindings_url: '/v2/service_instances/e321cd6c-458e-48c9-83c1-c6ee45f46bcb/service_bindings',
                  service_keys_url: '/v2/service_instances/e321cd6c-458e-48c9-83c1-c6ee45f46bcb/service_keys',
                  routes_url: '/v2/service_instances/e321cd6c-458e-48c9-83c1-c6ee45f46bcb/routes',
                  service_url: '/v2/services/606e5ecd-eea1-47df-b4f0-dc833642e1ac'
                }
              },
              {
                metadata: {
                  guid: 'ad5b95c1-5480-4fb0-952e-83daa6f55761',
                  url: '/v2/service_instances/ad5b95c1-5480-4fb0-952e-83daa6f55761',
                  created_at: '2017-08-22T12:03:06Z',
                  updated_at: '2017-08-22T12:03:06Z'
                },
                entity: {
                  name: 'asdasdasd',
                  credentials: {},
                  service_plan_guid: '3c1b3320-d1a9-40e4-91b4-5841c3239cce',
                  space_guid: 'f5e6affb-8b7b-4fa8-aea3-24df8b682a85',
                  gateway_data: null,
                  dashboard_url: 'https://cf-dev.io/manage/instances/ad5b95c1-5480-4fb0-952e-83daa6f55761',
                  type: 'managed_service_instance',
                  last_operation: {
                    type: 'create',
                    state: 'succeeded',
                    description: '',
                    updated_at: '2017-08-22T12:03:06Z',
                    created_at: '2017-08-22T12:03:06Z'
                  },
                  tags: [],
                  service_guid: '606e5ecd-eea1-47df-b4f0-dc833642e1ac',
                  space_url: '/v2/spaces/f5e6affb-8b7b-4fa8-aea3-24df8b682a85',
                  service_plan_url: '/v2/service_plans/3c1b3320-d1a9-40e4-91b4-5841c3239cce',
                  service_bindings_url: '/v2/service_instances/ad5b95c1-5480-4fb0-952e-83daa6f55761/service_bindings',
                  service_keys_url: '/v2/service_instances/ad5b95c1-5480-4fb0-952e-83daa6f55761/service_keys',
                  routes_url: '/v2/service_instances/ad5b95c1-5480-4fb0-952e-83daa6f55761/routes',
                  service_url: '/v2/services/606e5ecd-eea1-47df-b4f0-dc833642e1ac'
                }
              },
              {
                metadata: {
                  guid: '14006228-ac3a-4e70-8c04-563cda966df3',
                  url: '/v2/service_instances/14006228-ac3a-4e70-8c04-563cda966df3',
                  created_at: '2017-08-23T13:21:21Z',
                  updated_at: '2017-08-23T13:21:21Z'
                },
                entity: {
                  name: 'Test1231',
                  credentials: {},
                  service_plan_guid: '549409b6-b754-4643-a83b-885dbcfd2dfb',
                  space_guid: 'f5e6affb-8b7b-4fa8-aea3-24df8b682a85',
                  gateway_data: null,
                  dashboard_url: 'https://app-autoscaler-broker.cf-dev.io/dashboard',
                  type: 'managed_service_instance',
                  last_operation: {
                    type: 'create',
                    state: 'succeeded',
                    description: '',
                    updated_at: '2017-08-23T13:21:22Z',
                    created_at: '2017-08-23T13:21:22Z'
                  },
                  tags: [],
                  service_guid: '43b1c1bd-0a26-4986-adcc-700d56559f1e',
                  space_url: '/v2/spaces/f5e6affb-8b7b-4fa8-aea3-24df8b682a85',
                  service_plan_url: '/v2/service_plans/549409b6-b754-4643-a83b-885dbcfd2dfb',
                  service_bindings_url: '/v2/service_instances/14006228-ac3a-4e70-8c04-563cda966df3/service_bindings',
                  service_keys_url: '/v2/service_instances/14006228-ac3a-4e70-8c04-563cda966df3/service_keys',
                  routes_url: '/v2/service_instances/14006228-ac3a-4e70-8c04-563cda966df3/routes',
                  service_url: '/v2/services/43b1c1bd-0a26-4986-adcc-700d56559f1e'
                }
              },
              {
                metadata: {
                  guid: '69b0214c-423e-4bb1-9fca-1b95f87e3228',
                  url: '/v2/service_instances/69b0214c-423e-4bb1-9fca-1b95f87e3228',
                  created_at: '2017-08-23T14:48:50Z',
                  updated_at: '2017-08-23T14:48:50Z'
                },
                entity: {
                  name: 'New-service123',
                  credentials: {},
                  service_plan_guid: '3c1b3320-d1a9-40e4-91b4-5841c3239cce',
                  space_guid: 'f5e6affb-8b7b-4fa8-aea3-24df8b682a85',
                  gateway_data: null,
                  dashboard_url: 'https://cf-dev.io/manage/instances/69b0214c-423e-4bb1-9fca-1b95f87e3228',
                  type: 'managed_service_instance',
                  last_operation: {
                    type: 'create',
                    state: 'succeeded',
                    description: '',
                    updated_at: '2017-08-23T14:48:50Z',
                    created_at: '2017-08-23T14:48:50Z'
                  },
                  tags: [],
                  service_guid: '606e5ecd-eea1-47df-b4f0-dc833642e1ac',
                  space_url: '/v2/spaces/f5e6affb-8b7b-4fa8-aea3-24df8b682a85',
                  service_plan_url: '/v2/service_plans/3c1b3320-d1a9-40e4-91b4-5841c3239cce',
                  service_bindings_url: '/v2/service_instances/69b0214c-423e-4bb1-9fca-1b95f87e3228/service_bindings',
                  service_keys_url: '/v2/service_instances/69b0214c-423e-4bb1-9fca-1b95f87e3228/service_keys',
                  routes_url: '/v2/service_instances/69b0214c-423e-4bb1-9fca-1b95f87e3228/routes',
                  service_url: '/v2/services/606e5ecd-eea1-47df-b4f0-dc833642e1ac'
                }
              },
              {
                metadata: {
                  guid: '6c78b8c4-ec43-479f-ac24-4b4e3f8991d0',
                  url: '/v2/service_instances/6c78b8c4-ec43-479f-ac24-4b4e3f8991d0',
                  created_at: '2017-08-23T15:22:10Z',
                  updated_at: '2017-08-23T15:22:10Z'
                },
                entity: {
                  name: 'werwerwer',
                  credentials: {},
                  service_plan_guid: '3c1b3320-d1a9-40e4-91b4-5841c3239cce',
                  space_guid: 'f5e6affb-8b7b-4fa8-aea3-24df8b682a85',
                  gateway_data: null,
                  dashboard_url: 'https://cf-dev.io/manage/instances/6c78b8c4-ec43-479f-ac24-4b4e3f8991d0',
                  type: 'managed_service_instance',
                  last_operation: {
                    type: 'create',
                    state: 'succeeded',
                    description: '',
                    updated_at: '2017-08-23T15:22:10Z',
                    created_at: '2017-08-23T15:22:10Z'
                  },
                  tags: [],
                  service_guid: '606e5ecd-eea1-47df-b4f0-dc833642e1ac',
                  space_url: '/v2/spaces/f5e6affb-8b7b-4fa8-aea3-24df8b682a85',
                  service_plan_url: '/v2/service_plans/3c1b3320-d1a9-40e4-91b4-5841c3239cce',
                  service_bindings_url: '/v2/service_instances/6c78b8c4-ec43-479f-ac24-4b4e3f8991d0/service_bindings',
                  service_keys_url: '/v2/service_instances/6c78b8c4-ec43-479f-ac24-4b4e3f8991d0/service_keys',
                  routes_url: '/v2/service_instances/6c78b8c4-ec43-479f-ac24-4b4e3f8991d0/routes',
                  service_url: '/v2/services/606e5ecd-eea1-47df-b4f0-dc833642e1ac'
                }
              },
              {
                metadata: {
                  guid: '8c6f1c1c-819d-4ee1-8170-37777f986037',
                  url: '/v2/service_instances/8c6f1c1c-819d-4ee1-8170-37777f986037',
                  created_at: '2017-08-23T15:25:01Z',
                  updated_at: '2017-08-23T15:25:01Z'
                },
                entity: {
                  name: 'asdasd',
                  credentials: {},
                  service_plan_guid: '3c1b3320-d1a9-40e4-91b4-5841c3239cce',
                  space_guid: 'f5e6affb-8b7b-4fa8-aea3-24df8b682a85',
                  gateway_data: null,
                  dashboard_url: 'https://cf-dev.io/manage/instances/8c6f1c1c-819d-4ee1-8170-37777f986037',
                  type: 'managed_service_instance',
                  last_operation: {
                    type: 'create',
                    state: 'succeeded',
                    description: '',
                    updated_at: '2017-08-23T15:25:01Z',
                    created_at: '2017-08-23T15:25:01Z'
                  },
                  tags: [],
                  service_guid: '606e5ecd-eea1-47df-b4f0-dc833642e1ac',
                  space_url: '/v2/spaces/f5e6affb-8b7b-4fa8-aea3-24df8b682a85',
                  service_plan_url: '/v2/service_plans/3c1b3320-d1a9-40e4-91b4-5841c3239cce',
                  service_bindings_url: '/v2/service_instances/8c6f1c1c-819d-4ee1-8170-37777f986037/service_bindings',
                  service_keys_url: '/v2/service_instances/8c6f1c1c-819d-4ee1-8170-37777f986037/service_keys',
                  routes_url: '/v2/service_instances/8c6f1c1c-819d-4ee1-8170-37777f986037/routes',
                  service_url: '/v2/services/606e5ecd-eea1-47df-b4f0-dc833642e1ac'
                }
              },
              {
                metadata: {
                  guid: '01b68ffe-aadd-42c1-b8a2-458bab029011',
                  url: '/v2/service_instances/01b68ffe-aadd-42c1-b8a2-458bab029011',
                  created_at: '2017-08-23T15:28:30Z',
                  updated_at: '2017-08-23T15:28:30Z'
                },
                entity: {
                  name: 'sadsdas',
                  credentials: {},
                  service_plan_guid: '3c1b3320-d1a9-40e4-91b4-5841c3239cce',
                  space_guid: 'f5e6affb-8b7b-4fa8-aea3-24df8b682a85',
                  gateway_data: null,
                  dashboard_url: 'https://cf-dev.io/manage/instances/01b68ffe-aadd-42c1-b8a2-458bab029011',
                  type: 'managed_service_instance',
                  last_operation: {
                    type: 'create',
                    state: 'succeeded',
                    description: '',
                    updated_at: '2017-08-23T15:28:30Z',
                    created_at: '2017-08-23T15:28:30Z'
                  },
                  tags: [],
                  service_guid: '606e5ecd-eea1-47df-b4f0-dc833642e1ac',
                  space_url: '/v2/spaces/f5e6affb-8b7b-4fa8-aea3-24df8b682a85',
                  service_plan_url: '/v2/service_plans/3c1b3320-d1a9-40e4-91b4-5841c3239cce',
                  service_bindings_url: '/v2/service_instances/01b68ffe-aadd-42c1-b8a2-458bab029011/service_bindings',
                  service_keys_url: '/v2/service_instances/01b68ffe-aadd-42c1-b8a2-458bab029011/service_keys',
                  routes_url: '/v2/service_instances/01b68ffe-aadd-42c1-b8a2-458bab029011/routes',
                  service_url: '/v2/services/606e5ecd-eea1-47df-b4f0-dc833642e1ac'
                }
              },
              {
                metadata: {
                  guid: '106a8e80-657a-4b25-ab9c-788a004a59d8',
                  url: '/v2/service_instances/106a8e80-657a-4b25-ab9c-788a004a59d8',
                  created_at: '2017-08-23T15:36:30Z',
                  updated_at: '2017-08-23T15:36:30Z'
                },
                entity: {
                  name: 'dasdasd',
                  credentials: {},
                  service_plan_guid: '549409b6-b754-4643-a83b-885dbcfd2dfb',
                  space_guid: 'f5e6affb-8b7b-4fa8-aea3-24df8b682a85',
                  gateway_data: null,
                  dashboard_url: 'https://app-autoscaler-broker.cf-dev.io/dashboard',
                  type: 'managed_service_instance',
                  last_operation: {
                    type: 'create',
                    state: 'succeeded',
                    description: '',
                    updated_at: '2017-08-23T15:36:30Z',
                    created_at: '2017-08-23T15:36:30Z'
                  },
                  tags: [],
                  service_guid: '43b1c1bd-0a26-4986-adcc-700d56559f1e',
                  space_url: '/v2/spaces/f5e6affb-8b7b-4fa8-aea3-24df8b682a85',
                  service_plan_url: '/v2/service_plans/549409b6-b754-4643-a83b-885dbcfd2dfb',
                  service_bindings_url: '/v2/service_instances/106a8e80-657a-4b25-ab9c-788a004a59d8/service_bindings',
                  service_keys_url: '/v2/service_instances/106a8e80-657a-4b25-ab9c-788a004a59d8/service_keys',
                  routes_url: '/v2/service_instances/106a8e80-657a-4b25-ab9c-788a004a59d8/routes',
                  service_url: '/v2/services/43b1c1bd-0a26-4986-adcc-700d56559f1e'
                }
              },
              {
                metadata: {
                  guid: '123537a1-a7ad-4114-b345-5680226bf272',
                  url: '/v2/service_instances/123537a1-a7ad-4114-b345-5680226bf272',
                  created_at: '2017-08-23T15:39:03Z',
                  updated_at: '2017-08-23T15:39:03Z'
                },
                entity: {
                  name: 'asdasdasdasd',
                  credentials: {},
                  service_plan_guid: '3c1b3320-d1a9-40e4-91b4-5841c3239cce',
                  space_guid: 'f5e6affb-8b7b-4fa8-aea3-24df8b682a85',
                  gateway_data: null,
                  dashboard_url: 'https://cf-dev.io/manage/instances/123537a1-a7ad-4114-b345-5680226bf272',
                  type: 'managed_service_instance',
                  last_operation: {
                    type: 'create',
                    state: 'succeeded',
                    description: '',
                    updated_at: '2017-08-23T15:39:03Z',
                    created_at: '2017-08-23T15:39:03Z'
                  },
                  tags: [],
                  service_guid: '606e5ecd-eea1-47df-b4f0-dc833642e1ac',
                  space_url: '/v2/spaces/f5e6affb-8b7b-4fa8-aea3-24df8b682a85',
                  service_plan_url: '/v2/service_plans/3c1b3320-d1a9-40e4-91b4-5841c3239cce',
                  service_bindings_url: '/v2/service_instances/123537a1-a7ad-4114-b345-5680226bf272/service_bindings',
                  service_keys_url: '/v2/service_instances/123537a1-a7ad-4114-b345-5680226bf272/service_keys',
                  routes_url: '/v2/service_instances/123537a1-a7ad-4114-b345-5680226bf272/routes',
                  service_url: '/v2/services/606e5ecd-eea1-47df-b4f0-dc833642e1ac'
                }
              },
              {
                metadata: {
                  guid: '728aab1d-4086-40d7-a41f-2e77ac796977',
                  url: '/v2/service_instances/728aab1d-4086-40d7-a41f-2e77ac796977',
                  created_at: '2017-08-24T13:04:59Z',
                  updated_at: '2017-08-24T13:04:59Z'
                },
                entity: {
                  name: 'New123Test',
                  credentials: {},
                  service_plan_guid: '3c1b3320-d1a9-40e4-91b4-5841c3239cce',
                  space_guid: 'f5e6affb-8b7b-4fa8-aea3-24df8b682a85',
                  gateway_data: null,
                  dashboard_url: 'https://cf-dev.io/manage/instances/728aab1d-4086-40d7-a41f-2e77ac796977',
                  type: 'managed_service_instance',
                  last_operation: {
                    type: 'create',
                    state: 'succeeded',
                    description: '',
                    updated_at: '2017-08-24T13:04:59Z',
                    created_at: '2017-08-24T13:04:59Z'
                  },
                  tags: [],
                  service_guid: '606e5ecd-eea1-47df-b4f0-dc833642e1ac',
                  space_url: '/v2/spaces/f5e6affb-8b7b-4fa8-aea3-24df8b682a85',
                  service_plan_url: '/v2/service_plans/3c1b3320-d1a9-40e4-91b4-5841c3239cce',
                  service_bindings_url: '/v2/service_instances/728aab1d-4086-40d7-a41f-2e77ac796977/service_bindings',
                  service_keys_url: '/v2/service_instances/728aab1d-4086-40d7-a41f-2e77ac796977/service_keys',
                  routes_url: '/v2/service_instances/728aab1d-4086-40d7-a41f-2e77ac796977/routes',
                  service_url: '/v2/services/606e5ecd-eea1-47df-b4f0-dc833642e1ac'
                }
              }
            ],
            app_events_url: '/v2/spaces/f5e6affb-8b7b-4fa8-aea3-24df8b682a85/app_events',
            events_url: '/v2/spaces/f5e6affb-8b7b-4fa8-aea3-24df8b682a85/events',
            security_groups_url: '/v2/spaces/f5e6affb-8b7b-4fa8-aea3-24df8b682a85/security_groups',
            security_groups: [
              {
                metadata: {
                  guid: 'fd8f2bbf-2f1a-4320-a07f-240bb2ca02dd',
                  url: '/v2/security_groups/fd8f2bbf-2f1a-4320-a07f-240bb2ca02dd',
                  created_at: '2017-08-10T13:38:02Z',
                  updated_at: '2017-08-10T13:38:02Z'
                },
                entity: {
                  name: 'public_networks',
                  rules: [
                    {
                      destination: '0.0.0.0-9.255.255.255',
                      protocol: 'all'
                    },
                    {
                      destination: '11.0.0.0-169.253.255.255',
                      protocol: 'all'
                    },
                    {
                      destination: '169.255.0.0-172.15.255.255',
                      protocol: 'all'
                    },
                    {
                      destination: '172.32.0.0-192.167.255.255',
                      protocol: 'all'
                    },
                    {
                      destination: '192.169.0.0-255.255.255.255',
                      protocol: 'all'
                    }
                  ],
                  running_default: true,
                  staging_default: true,
                  spaces_url: '/v2/security_groups/fd8f2bbf-2f1a-4320-a07f-240bb2ca02dd/spaces',
                  staging_spaces_url: '/v2/security_groups/fd8f2bbf-2f1a-4320-a07f-240bb2ca02dd/staging_spaces'
                }
              },
              {
                metadata: {
                  guid: 'edd678c5-8abc-4973-8b6f-856bb87ca7de',
                  url: '/v2/security_groups/edd678c5-8abc-4973-8b6f-856bb87ca7de',
                  created_at: '2017-08-10T13:38:02Z',
                  updated_at: '2017-08-10T13:38:02Z'
                },
                entity: {
                  name: 'dns',
                  rules: [
                    {
                      destination: '0.0.0.0/0',
                      ports: '53',
                      protocol: 'tcp'
                    },
                    {
                      destination: '0.0.0.0/0',
                      ports: '53',
                      protocol: 'udp'
                    }
                  ],
                  running_default: true,
                  staging_default: true,
                  spaces_url: '/v2/security_groups/edd678c5-8abc-4973-8b6f-856bb87ca7de/spaces',
                  staging_spaces_url: '/v2/security_groups/edd678c5-8abc-4973-8b6f-856bb87ca7de/staging_spaces'
                }
              },
              {
                metadata: {
                  guid: '65c2b61e-dc9f-4415-86bf-493cb4ea284e',
                  url: '/v2/security_groups/65c2b61e-dc9f-4415-86bf-493cb4ea284e',
                  created_at: '2017-08-10T13:39:32Z',
                  updated_at: '2017-08-10T13:39:34Z'
                },
                entity: {
                  name: 'dev-mysql',
                  rules: [
                    {
                      destination: '10.0.0.41',
                      ports: '3306',
                      protocol: 'tcp'
                    }
                  ],
                  running_default: true,
                  staging_default: true,
                  spaces_url: '/v2/security_groups/65c2b61e-dc9f-4415-86bf-493cb4ea284e/spaces',
                  staging_spaces_url: '/v2/security_groups/65c2b61e-dc9f-4415-86bf-493cb4ea284e/staging_spaces'
                }
              }
            ],
            staging_security_groups_url: '/v2/spaces/f5e6affb-8b7b-4fa8-aea3-24df8b682a85/staging_security_groups',
            staging_security_groups: [
              {
                metadata: {
                  guid: 'fd8f2bbf-2f1a-4320-a07f-240bb2ca02dd',
                  url: '/v2/security_groups/fd8f2bbf-2f1a-4320-a07f-240bb2ca02dd',
                  created_at: '2017-08-10T13:38:02Z',
                  updated_at: '2017-08-10T13:38:02Z'
                },
                entity: {
                  name: 'public_networks',
                  rules: [
                    {
                      destination: '0.0.0.0-9.255.255.255',
                      protocol: 'all'
                    },
                    {
                      destination: '11.0.0.0-169.253.255.255',
                      protocol: 'all'
                    },
                    {
                      destination: '169.255.0.0-172.15.255.255',
                      protocol: 'all'
                    },
                    {
                      destination: '172.32.0.0-192.167.255.255',
                      protocol: 'all'
                    },
                    {
                      destination: '192.169.0.0-255.255.255.255',
                      protocol: 'all'
                    }
                  ],
                  running_default: true,
                  staging_default: true,
                  spaces_url: '/v2/security_groups/fd8f2bbf-2f1a-4320-a07f-240bb2ca02dd/spaces',
                  staging_spaces_url: '/v2/security_groups/fd8f2bbf-2f1a-4320-a07f-240bb2ca02dd/staging_spaces'
                }
              },
              {
                metadata: {
                  guid: 'edd678c5-8abc-4973-8b6f-856bb87ca7de',
                  url: '/v2/security_groups/edd678c5-8abc-4973-8b6f-856bb87ca7de',
                  created_at: '2017-08-10T13:38:02Z',
                  updated_at: '2017-08-10T13:38:02Z'
                },
                entity: {
                  name: 'dns',
                  rules: [
                    {
                      destination: '0.0.0.0/0',
                      ports: '53',
                      protocol: 'tcp'
                    },
                    {
                      destination: '0.0.0.0/0',
                      ports: '53',
                      protocol: 'udp'
                    }
                  ],
                  running_default: true,
                  staging_default: true,
                  spaces_url: '/v2/security_groups/edd678c5-8abc-4973-8b6f-856bb87ca7de/spaces',
                  staging_spaces_url: '/v2/security_groups/edd678c5-8abc-4973-8b6f-856bb87ca7de/staging_spaces'
                }
              },
              {
                metadata: {
                  guid: '65c2b61e-dc9f-4415-86bf-493cb4ea284e',
                  url: '/v2/security_groups/65c2b61e-dc9f-4415-86bf-493cb4ea284e',
                  created_at: '2017-08-10T13:39:32Z',
                  updated_at: '2017-08-10T13:39:34Z'
                },
                entity: {
                  name: 'dev-mysql',
                  rules: [
                    {
                      destination: '10.0.0.41',
                      ports: '3306',
                      protocol: 'tcp'
                    }
                  ],
                  running_default: true,
                  staging_default: true,
                  spaces_url: '/v2/security_groups/65c2b61e-dc9f-4415-86bf-493cb4ea284e/spaces',
                  staging_spaces_url: '/v2/security_groups/65c2b61e-dc9f-4415-86bf-493cb4ea284e/staging_spaces'
                }
              }
            ]
          }
        },
        '61391638-57a8-4185-b91c-495b8869125e': {
          metadata: {
            guid: '61391638-57a8-4185-b91c-495b8869125e',
            url: '/v2/spaces/61391638-57a8-4185-b91c-495b8869125e',
            created_at: '2017-08-24T09:39:42Z',
            updated_at: '2017-08-24T09:39:42Z'
          },
          entity: {
            name: 'rc1',
            organization_guid: '306071ee-0cad-4b4b-8fd9-9944d6e65c99',
            space_quota_definition_guid: null,
            isolation_segment_guid: null,
            allow_ssh: true,
            organization_url: '/v2/organizations/306071ee-0cad-4b4b-8fd9-9944d6e65c99',
            organization: {
              metadata: {
                guid: '306071ee-0cad-4b4b-8fd9-9944d6e65c99',
                url: '/v2/organizations/306071ee-0cad-4b4b-8fd9-9944d6e65c99',
                created_at: '2017-08-24T09:39:34Z',
                updated_at: '2017-08-24T09:39:34Z'
              },
              entity: {
                name: 'rc',
                billing_enabled: false,
                quota_definition_guid: 'ae738db2-34f5-4124-9072-c33ce404cc3e',
                status: 'active',
                default_isolation_segment_guid: null,
                quota_definition_url: '/v2/quota_definitions/ae738db2-34f5-4124-9072-c33ce404cc3e',
                spaces_url: '/v2/organizations/306071ee-0cad-4b4b-8fd9-9944d6e65c99/spaces',
                domains_url: '/v2/organizations/306071ee-0cad-4b4b-8fd9-9944d6e65c99/domains',
                private_domains_url: '/v2/organizations/306071ee-0cad-4b4b-8fd9-9944d6e65c99/private_domains',
                users_url: '/v2/organizations/306071ee-0cad-4b4b-8fd9-9944d6e65c99/users',
                managers_url: '/v2/organizations/306071ee-0cad-4b4b-8fd9-9944d6e65c99/managers',
                billing_managers_url: '/v2/organizations/306071ee-0cad-4b4b-8fd9-9944d6e65c99/billing_managers',
                auditors_url: '/v2/organizations/306071ee-0cad-4b4b-8fd9-9944d6e65c99/auditors',
                app_events_url: '/v2/organizations/306071ee-0cad-4b4b-8fd9-9944d6e65c99/app_events',
                space_quota_definitions_url: '/v2/organizations/306071ee-0cad-4b4b-8fd9-9944d6e65c99/space_quota_definitions'
              }
            },
            developers_url: '/v2/spaces/61391638-57a8-4185-b91c-495b8869125e/developers',
            developers: [
              {
                metadata: {
                  guid: 'ded8a59b-b21d-4da6-a07a-0d865a9b16e2',
                  url: '/v2/users/ded8a59b-b21d-4da6-a07a-0d865a9b16e2',
                  created_at: '2017-08-10T13:39:37Z',
                  updated_at: '2017-08-10T13:39:37Z'
                },
                entity: {
                  admin: false,
                  active: true,
                  default_space_guid: null,
                  spaces_url: '/v2/users/ded8a59b-b21d-4da6-a07a-0d865a9b16e2/spaces',
                  organizations_url: '/v2/users/ded8a59b-b21d-4da6-a07a-0d865a9b16e2/organizations',
                  managed_organizations_url: '/v2/users/ded8a59b-b21d-4da6-a07a-0d865a9b16e2/managed_organizations',
                  billing_managed_organizations_url: '/v2/users/ded8a59b-b21d-4da6-a07a-0d865a9b16e2/billing_managed_organizations',
                  audited_organizations_url: '/v2/users/ded8a59b-b21d-4da6-a07a-0d865a9b16e2/audited_organizations',
                  managed_spaces_url: '/v2/users/ded8a59b-b21d-4da6-a07a-0d865a9b16e2/managed_spaces',
                  audited_spaces_url: '/v2/users/ded8a59b-b21d-4da6-a07a-0d865a9b16e2/audited_spaces'
                }
              }
            ],
            managers_url: '/v2/spaces/61391638-57a8-4185-b91c-495b8869125e/managers',
            managers: [
              {
                metadata: {
                  guid: 'ded8a59b-b21d-4da6-a07a-0d865a9b16e2',
                  url: '/v2/users/ded8a59b-b21d-4da6-a07a-0d865a9b16e2',
                  created_at: '2017-08-10T13:39:37Z',
                  updated_at: '2017-08-10T13:39:37Z'
                },
                entity: {
                  admin: false,
                  active: true,
                  default_space_guid: null,
                  spaces_url: '/v2/users/ded8a59b-b21d-4da6-a07a-0d865a9b16e2/spaces',
                  organizations_url: '/v2/users/ded8a59b-b21d-4da6-a07a-0d865a9b16e2/organizations',
                  managed_organizations_url: '/v2/users/ded8a59b-b21d-4da6-a07a-0d865a9b16e2/managed_organizations',
                  billing_managed_organizations_url: '/v2/users/ded8a59b-b21d-4da6-a07a-0d865a9b16e2/billing_managed_organizations',
                  audited_organizations_url: '/v2/users/ded8a59b-b21d-4da6-a07a-0d865a9b16e2/audited_organizations',
                  managed_spaces_url: '/v2/users/ded8a59b-b21d-4da6-a07a-0d865a9b16e2/managed_spaces',
                  audited_spaces_url: '/v2/users/ded8a59b-b21d-4da6-a07a-0d865a9b16e2/audited_spaces'
                }
              },
              {
                metadata: {
                  guid: 'd6fe1342-fd81-491f-b32f-63024cb07734',
                  url: '/v2/users/d6fe1342-fd81-491f-b32f-63024cb07734',
                  created_at: '2017-08-10T13:45:27Z',
                  updated_at: '2017-08-10T13:45:27Z'
                },
                entity: {
                  admin: false,
                  active: false,
                  default_space_guid: null,
                  spaces_url: '/v2/users/d6fe1342-fd81-491f-b32f-63024cb07734/spaces',
                  organizations_url: '/v2/users/d6fe1342-fd81-491f-b32f-63024cb07734/organizations',
                  managed_organizations_url: '/v2/users/d6fe1342-fd81-491f-b32f-63024cb07734/managed_organizations',
                  billing_managed_organizations_url: '/v2/users/d6fe1342-fd81-491f-b32f-63024cb07734/billing_managed_organizations',
                  audited_organizations_url: '/v2/users/d6fe1342-fd81-491f-b32f-63024cb07734/audited_organizations',
                  managed_spaces_url: '/v2/users/d6fe1342-fd81-491f-b32f-63024cb07734/managed_spaces',
                  audited_spaces_url: '/v2/users/d6fe1342-fd81-491f-b32f-63024cb07734/audited_spaces'
                }
              }
            ],
            auditors_url: '/v2/spaces/61391638-57a8-4185-b91c-495b8869125e/auditors',
            auditors: [
              {
                metadata: {
                  guid: 'd6fe1342-fd81-491f-b32f-63024cb07734',
                  url: '/v2/users/d6fe1342-fd81-491f-b32f-63024cb07734',
                  created_at: '2017-08-10T13:45:27Z',
                  updated_at: '2017-08-10T13:45:27Z'
                },
                entity: {
                  admin: false,
                  active: false,
                  default_space_guid: null,
                  spaces_url: '/v2/users/d6fe1342-fd81-491f-b32f-63024cb07734/spaces',
                  organizations_url: '/v2/users/d6fe1342-fd81-491f-b32f-63024cb07734/organizations',
                  managed_organizations_url: '/v2/users/d6fe1342-fd81-491f-b32f-63024cb07734/managed_organizations',
                  billing_managed_organizations_url: '/v2/users/d6fe1342-fd81-491f-b32f-63024cb07734/billing_managed_organizations',
                  audited_organizations_url: '/v2/users/d6fe1342-fd81-491f-b32f-63024cb07734/audited_organizations',
                  managed_spaces_url: '/v2/users/d6fe1342-fd81-491f-b32f-63024cb07734/managed_spaces',
                  audited_spaces_url: '/v2/users/d6fe1342-fd81-491f-b32f-63024cb07734/audited_spaces'
                }
              }
            ],
            apps_url: '/v2/spaces/61391638-57a8-4185-b91c-495b8869125e/apps',
            routes_url: '/v2/spaces/61391638-57a8-4185-b91c-495b8869125e/routes',
            routes: [
              {
                metadata: {
                  guid: '7a759392-44db-4669-b50d-cc7f8dd433b9',
                  url: '/v2/routes/7a759392-44db-4669-b50d-cc7f8dd433b9',
                  created_at: '2017-09-01T14:46:50Z',
                  updated_at: '2017-09-01T14:46:50Z'
                },
                entity: {
                  host: 'test-app',
                  path: '',
                  domain_guid: '0da3e819-8be9-47f3-b9a1-8329ab649d63',
                  space_guid: '61391638-57a8-4185-b91c-495b8869125e',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/0da3e819-8be9-47f3-b9a1-8329ab649d63',
                  space_url: '/v2/spaces/61391638-57a8-4185-b91c-495b8869125e',
                  apps_url: '/v2/routes/7a759392-44db-4669-b50d-cc7f8dd433b9/apps',
                  route_mappings_url: '/v2/routes/7a759392-44db-4669-b50d-cc7f8dd433b9/route_mappings'
                }
              },
              {
                metadata: {
                  guid: '0b327348-b0b9-453c-a92c-b9d7d8f42115',
                  url: '/v2/routes/0b327348-b0b9-453c-a92c-b9d7d8f42115',
                  created_at: '2017-09-07T12:55:47Z',
                  updated_at: '2017-09-07T12:55:47Z'
                },
                entity: {
                  host: 'console',
                  path: '',
                  domain_guid: '0da3e819-8be9-47f3-b9a1-8329ab649d63',
                  space_guid: '61391638-57a8-4185-b91c-495b8869125e',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/0da3e819-8be9-47f3-b9a1-8329ab649d63',
                  space_url: '/v2/spaces/61391638-57a8-4185-b91c-495b8869125e',
                  apps_url: '/v2/routes/0b327348-b0b9-453c-a92c-b9d7d8f42115/apps',
                  route_mappings_url: '/v2/routes/0b327348-b0b9-453c-a92c-b9d7d8f42115/route_mappings'
                }
              }
            ],
            domains_url: '/v2/spaces/61391638-57a8-4185-b91c-495b8869125e/domains',
            domains: [
              {
                metadata: {
                  guid: '0da3e819-8be9-47f3-b9a1-8329ab649d63',
                  url: '/v2/shared_domains/0da3e819-8be9-47f3-b9a1-8329ab649d63',
                  created_at: '2017-08-10T13:38:02Z',
                  updated_at: '2017-08-10T13:38:02Z'
                },
                entity: {
                  name: 'cf-dev.io',
                  router_group_guid: null,
                  router_group_type: null
                }
              }
            ],
            service_instances_url: '/v2/spaces/61391638-57a8-4185-b91c-495b8869125e/service_instances',
            service_instances: [
              {
                metadata: {
                  guid: 'afa0cbcc-d12e-4182-ac1d-9354757625a6',
                  url: '/v2/service_instances/afa0cbcc-d12e-4182-ac1d-9354757625a6',
                  created_at: '2017-10-05T13:27:34Z',
                  updated_at: '2017-10-05T13:27:34Z'
                },
                entity: {
                  name: 'rc-my-sql',
                  credentials: {},
                  service_plan_guid: '3c1b3320-d1a9-40e4-91b4-5841c3239cce',
                  space_guid: '61391638-57a8-4185-b91c-495b8869125e',
                  gateway_data: null,
                  dashboard_url: 'https://cf-dev.io/manage/instances/afa0cbcc-d12e-4182-ac1d-9354757625a6',
                  type: 'managed_service_instance',
                  last_operation: {
                    type: 'create',
                    state: 'succeeded',
                    description: '',
                    updated_at: '2017-10-05T13:27:34Z',
                    created_at: '2017-10-05T13:27:34Z'
                  },
                  tags: [],
                  service_guid: '606e5ecd-eea1-47df-b4f0-dc833642e1ac',
                  space_url: '/v2/spaces/61391638-57a8-4185-b91c-495b8869125e',
                  service_plan_url: '/v2/service_plans/3c1b3320-d1a9-40e4-91b4-5841c3239cce',
                  service_bindings_url: '/v2/service_instances/afa0cbcc-d12e-4182-ac1d-9354757625a6/service_bindings',
                  service_keys_url: '/v2/service_instances/afa0cbcc-d12e-4182-ac1d-9354757625a6/service_keys',
                  routes_url: '/v2/service_instances/afa0cbcc-d12e-4182-ac1d-9354757625a6/routes',
                  service_url: '/v2/services/606e5ecd-eea1-47df-b4f0-dc833642e1ac'
                }
              }
            ],
            app_events_url: '/v2/spaces/61391638-57a8-4185-b91c-495b8869125e/app_events',
            events_url: '/v2/spaces/61391638-57a8-4185-b91c-495b8869125e/events',
            security_groups_url: '/v2/spaces/61391638-57a8-4185-b91c-495b8869125e/security_groups',
            security_groups: [
              {
                metadata: {
                  guid: 'fd8f2bbf-2f1a-4320-a07f-240bb2ca02dd',
                  url: '/v2/security_groups/fd8f2bbf-2f1a-4320-a07f-240bb2ca02dd',
                  created_at: '2017-08-10T13:38:02Z',
                  updated_at: '2017-08-10T13:38:02Z'
                },
                entity: {
                  name: 'public_networks',
                  rules: [
                    {
                      destination: '0.0.0.0-9.255.255.255',
                      protocol: 'all'
                    },
                    {
                      destination: '11.0.0.0-169.253.255.255',
                      protocol: 'all'
                    },
                    {
                      destination: '169.255.0.0-172.15.255.255',
                      protocol: 'all'
                    },
                    {
                      destination: '172.32.0.0-192.167.255.255',
                      protocol: 'all'
                    },
                    {
                      destination: '192.169.0.0-255.255.255.255',
                      protocol: 'all'
                    }
                  ],
                  running_default: true,
                  staging_default: true,
                  spaces_url: '/v2/security_groups/fd8f2bbf-2f1a-4320-a07f-240bb2ca02dd/spaces',
                  staging_spaces_url: '/v2/security_groups/fd8f2bbf-2f1a-4320-a07f-240bb2ca02dd/staging_spaces'
                }
              },
              {
                metadata: {
                  guid: 'edd678c5-8abc-4973-8b6f-856bb87ca7de',
                  url: '/v2/security_groups/edd678c5-8abc-4973-8b6f-856bb87ca7de',
                  created_at: '2017-08-10T13:38:02Z',
                  updated_at: '2017-08-10T13:38:02Z'
                },
                entity: {
                  name: 'dns',
                  rules: [
                    {
                      destination: '0.0.0.0/0',
                      ports: '53',
                      protocol: 'tcp'
                    },
                    {
                      destination: '0.0.0.0/0',
                      ports: '53',
                      protocol: 'udp'
                    }
                  ],
                  running_default: true,
                  staging_default: true,
                  spaces_url: '/v2/security_groups/edd678c5-8abc-4973-8b6f-856bb87ca7de/spaces',
                  staging_spaces_url: '/v2/security_groups/edd678c5-8abc-4973-8b6f-856bb87ca7de/staging_spaces'
                }
              },
              {
                metadata: {
                  guid: '65c2b61e-dc9f-4415-86bf-493cb4ea284e',
                  url: '/v2/security_groups/65c2b61e-dc9f-4415-86bf-493cb4ea284e',
                  created_at: '2017-08-10T13:39:32Z',
                  updated_at: '2017-08-10T13:39:34Z'
                },
                entity: {
                  name: 'dev-mysql',
                  rules: [
                    {
                      destination: '10.0.0.41',
                      ports: '3306',
                      protocol: 'tcp'
                    }
                  ],
                  running_default: true,
                  staging_default: true,
                  spaces_url: '/v2/security_groups/65c2b61e-dc9f-4415-86bf-493cb4ea284e/spaces',
                  staging_spaces_url: '/v2/security_groups/65c2b61e-dc9f-4415-86bf-493cb4ea284e/staging_spaces'
                }
              }
            ],
            staging_security_groups_url: '/v2/spaces/61391638-57a8-4185-b91c-495b8869125e/staging_security_groups',
            staging_security_groups: [
              {
                metadata: {
                  guid: 'fd8f2bbf-2f1a-4320-a07f-240bb2ca02dd',
                  url: '/v2/security_groups/fd8f2bbf-2f1a-4320-a07f-240bb2ca02dd',
                  created_at: '2017-08-10T13:38:02Z',
                  updated_at: '2017-08-10T13:38:02Z'
                },
                entity: {
                  name: 'public_networks',
                  rules: [
                    {
                      destination: '0.0.0.0-9.255.255.255',
                      protocol: 'all'
                    },
                    {
                      destination: '11.0.0.0-169.253.255.255',
                      protocol: 'all'
                    },
                    {
                      destination: '169.255.0.0-172.15.255.255',
                      protocol: 'all'
                    },
                    {
                      destination: '172.32.0.0-192.167.255.255',
                      protocol: 'all'
                    },
                    {
                      destination: '192.169.0.0-255.255.255.255',
                      protocol: 'all'
                    }
                  ],
                  running_default: true,
                  staging_default: true,
                  spaces_url: '/v2/security_groups/fd8f2bbf-2f1a-4320-a07f-240bb2ca02dd/spaces',
                  staging_spaces_url: '/v2/security_groups/fd8f2bbf-2f1a-4320-a07f-240bb2ca02dd/staging_spaces'
                }
              },
              {
                metadata: {
                  guid: 'edd678c5-8abc-4973-8b6f-856bb87ca7de',
                  url: '/v2/security_groups/edd678c5-8abc-4973-8b6f-856bb87ca7de',
                  created_at: '2017-08-10T13:38:02Z',
                  updated_at: '2017-08-10T13:38:02Z'
                },
                entity: {
                  name: 'dns',
                  rules: [
                    {
                      destination: '0.0.0.0/0',
                      ports: '53',
                      protocol: 'tcp'
                    },
                    {
                      destination: '0.0.0.0/0',
                      ports: '53',
                      protocol: 'udp'
                    }
                  ],
                  running_default: true,
                  staging_default: true,
                  spaces_url: '/v2/security_groups/edd678c5-8abc-4973-8b6f-856bb87ca7de/spaces',
                  staging_spaces_url: '/v2/security_groups/edd678c5-8abc-4973-8b6f-856bb87ca7de/staging_spaces'
                }
              },
              {
                metadata: {
                  guid: '65c2b61e-dc9f-4415-86bf-493cb4ea284e',
                  url: '/v2/security_groups/65c2b61e-dc9f-4415-86bf-493cb4ea284e',
                  created_at: '2017-08-10T13:39:32Z',
                  updated_at: '2017-08-10T13:39:34Z'
                },
                entity: {
                  name: 'dev-mysql',
                  rules: [
                    {
                      destination: '10.0.0.41',
                      ports: '3306',
                      protocol: 'tcp'
                    }
                  ],
                  running_default: true,
                  staging_default: true,
                  spaces_url: '/v2/security_groups/65c2b61e-dc9f-4415-86bf-493cb4ea284e/spaces',
                  staging_spaces_url: '/v2/security_groups/65c2b61e-dc9f-4415-86bf-493cb4ea284e/staging_spaces'
                }
              }
            ]
          }
        },
        'a59b770c-2b51-46d8-a16d-bfc0322b2e12': {
          metadata: {
            guid: 'a59b770c-2b51-46d8-a16d-bfc0322b2e12',
            url: '/v2/spaces/a59b770c-2b51-46d8-a16d-bfc0322b2e12',
            created_at: '2017-08-10T13:45:25Z',
            updated_at: '2017-08-10T13:45:25Z'
          },
          entity: {
            name: 'e2e',
            organization_guid: '9865ddfb-c5b1-4228-846b-94f662a7f730',
            space_quota_definition_guid: null,
            isolation_segment_guid: null,
            allow_ssh: true,
            organization_url: '/v2/organizations/9865ddfb-c5b1-4228-846b-94f662a7f730',
            organization: {
              metadata: {
                guid: '9865ddfb-c5b1-4228-846b-94f662a7f730',
                url: '/v2/organizations/9865ddfb-c5b1-4228-846b-94f662a7f730',
                created_at: '2017-08-10T13:45:23Z',
                updated_at: '2017-08-10T13:45:23Z'
              },
              entity: {
                name: 'e2e',
                billing_enabled: false,
                quota_definition_guid: 'ae738db2-34f5-4124-9072-c33ce404cc3e',
                status: 'active',
                default_isolation_segment_guid: null,
                quota_definition_url: '/v2/quota_definitions/ae738db2-34f5-4124-9072-c33ce404cc3e',
                spaces_url: '/v2/organizations/9865ddfb-c5b1-4228-846b-94f662a7f730/spaces',
                domains_url: '/v2/organizations/9865ddfb-c5b1-4228-846b-94f662a7f730/domains',
                private_domains_url: '/v2/organizations/9865ddfb-c5b1-4228-846b-94f662a7f730/private_domains',
                users_url: '/v2/organizations/9865ddfb-c5b1-4228-846b-94f662a7f730/users',
                managers_url: '/v2/organizations/9865ddfb-c5b1-4228-846b-94f662a7f730/managers',
                billing_managers_url: '/v2/organizations/9865ddfb-c5b1-4228-846b-94f662a7f730/billing_managers',
                auditors_url: '/v2/organizations/9865ddfb-c5b1-4228-846b-94f662a7f730/auditors',
                app_events_url: '/v2/organizations/9865ddfb-c5b1-4228-846b-94f662a7f730/app_events',
                space_quota_definitions_url: '/v2/organizations/9865ddfb-c5b1-4228-846b-94f662a7f730/space_quota_definitions'
              }
            },
            developers_url: '/v2/spaces/a59b770c-2b51-46d8-a16d-bfc0322b2e12/developers',
            developers: [
              {
                metadata: {
                  guid: 'ded8a59b-b21d-4da6-a07a-0d865a9b16e2',
                  url: '/v2/users/ded8a59b-b21d-4da6-a07a-0d865a9b16e2',
                  created_at: '2017-08-10T13:39:37Z',
                  updated_at: '2017-08-10T13:39:37Z'
                },
                entity: {
                  admin: false,
                  active: true,
                  default_space_guid: null,
                  spaces_url: '/v2/users/ded8a59b-b21d-4da6-a07a-0d865a9b16e2/spaces',
                  organizations_url: '/v2/users/ded8a59b-b21d-4da6-a07a-0d865a9b16e2/organizations',
                  managed_organizations_url: '/v2/users/ded8a59b-b21d-4da6-a07a-0d865a9b16e2/managed_organizations',
                  billing_managed_organizations_url: '/v2/users/ded8a59b-b21d-4da6-a07a-0d865a9b16e2/billing_managed_organizations',
                  audited_organizations_url: '/v2/users/ded8a59b-b21d-4da6-a07a-0d865a9b16e2/audited_organizations',
                  managed_spaces_url: '/v2/users/ded8a59b-b21d-4da6-a07a-0d865a9b16e2/managed_spaces',
                  audited_spaces_url: '/v2/users/ded8a59b-b21d-4da6-a07a-0d865a9b16e2/audited_spaces'
                }
              },
              {
                metadata: {
                  guid: 'd6fe1342-fd81-491f-b32f-63024cb07734',
                  url: '/v2/users/d6fe1342-fd81-491f-b32f-63024cb07734',
                  created_at: '2017-08-10T13:45:27Z',
                  updated_at: '2017-08-10T13:45:27Z'
                },
                entity: {
                  admin: false,
                  active: false,
                  default_space_guid: null,
                  spaces_url: '/v2/users/d6fe1342-fd81-491f-b32f-63024cb07734/spaces',
                  organizations_url: '/v2/users/d6fe1342-fd81-491f-b32f-63024cb07734/organizations',
                  managed_organizations_url: '/v2/users/d6fe1342-fd81-491f-b32f-63024cb07734/managed_organizations',
                  billing_managed_organizations_url: '/v2/users/d6fe1342-fd81-491f-b32f-63024cb07734/billing_managed_organizations',
                  audited_organizations_url: '/v2/users/d6fe1342-fd81-491f-b32f-63024cb07734/audited_organizations',
                  managed_spaces_url: '/v2/users/d6fe1342-fd81-491f-b32f-63024cb07734/managed_spaces',
                  audited_spaces_url: '/v2/users/d6fe1342-fd81-491f-b32f-63024cb07734/audited_spaces'
                }
              }
            ],
            managers_url: '/v2/spaces/a59b770c-2b51-46d8-a16d-bfc0322b2e12/managers',
            managers: [
              {
                metadata: {
                  guid: 'ded8a59b-b21d-4da6-a07a-0d865a9b16e2',
                  url: '/v2/users/ded8a59b-b21d-4da6-a07a-0d865a9b16e2',
                  created_at: '2017-08-10T13:39:37Z',
                  updated_at: '2017-08-10T13:39:37Z'
                },
                entity: {
                  admin: false,
                  active: true,
                  default_space_guid: null,
                  spaces_url: '/v2/users/ded8a59b-b21d-4da6-a07a-0d865a9b16e2/spaces',
                  organizations_url: '/v2/users/ded8a59b-b21d-4da6-a07a-0d865a9b16e2/organizations',
                  managed_organizations_url: '/v2/users/ded8a59b-b21d-4da6-a07a-0d865a9b16e2/managed_organizations',
                  billing_managed_organizations_url: '/v2/users/ded8a59b-b21d-4da6-a07a-0d865a9b16e2/billing_managed_organizations',
                  audited_organizations_url: '/v2/users/ded8a59b-b21d-4da6-a07a-0d865a9b16e2/audited_organizations',
                  managed_spaces_url: '/v2/users/ded8a59b-b21d-4da6-a07a-0d865a9b16e2/managed_spaces',
                  audited_spaces_url: '/v2/users/ded8a59b-b21d-4da6-a07a-0d865a9b16e2/audited_spaces'
                }
              }
            ],
            auditors_url: '/v2/spaces/a59b770c-2b51-46d8-a16d-bfc0322b2e12/auditors',
            auditors: [],
            apps_url: '/v2/spaces/a59b770c-2b51-46d8-a16d-bfc0322b2e12/apps',
            routes_url: '/v2/spaces/a59b770c-2b51-46d8-a16d-bfc0322b2e12/routes',
            routes: [
              {
                metadata: {
                  guid: 'a5caced2-0845-44fb-91e0-d17cb3782d10',
                  url: '/v2/routes/a5caced2-0845-44fb-91e0-d17cb3782d10',
                  created_at: '2017-09-08T11:23:29Z',
                  updated_at: '2017-09-08T11:23:29Z'
                },
                entity: {
                  host: 'acceptance_e2e_richard_2017-09-08T11_22_28_574Z-delete',
                  path: '',
                  domain_guid: '0da3e819-8be9-47f3-b9a1-8329ab649d63',
                  space_guid: 'a59b770c-2b51-46d8-a16d-bfc0322b2e12',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/0da3e819-8be9-47f3-b9a1-8329ab649d63',
                  space_url: '/v2/spaces/a59b770c-2b51-46d8-a16d-bfc0322b2e12',
                  apps_url: '/v2/routes/a5caced2-0845-44fb-91e0-d17cb3782d10/apps',
                  route_mappings_url: '/v2/routes/a5caced2-0845-44fb-91e0-d17cb3782d10/route_mappings'
                }
              },
              {
                metadata: {
                  guid: '0e3e9789-4850-45e1-abab-3441a03868ac',
                  url: '/v2/routes/0e3e9789-4850-45e1-abab-3441a03868ac',
                  created_at: '2017-10-02T12:07:20Z',
                  updated_at: '2017-10-02T12:07:20Z'
                },
                entity: {
                  host: 'acceptance_e2e_root_2017-10-02T12_03_40_267Z',
                  path: '',
                  domain_guid: '0da3e819-8be9-47f3-b9a1-8329ab649d63',
                  space_guid: 'a59b770c-2b51-46d8-a16d-bfc0322b2e12',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/0da3e819-8be9-47f3-b9a1-8329ab649d63',
                  space_url: '/v2/spaces/a59b770c-2b51-46d8-a16d-bfc0322b2e12',
                  apps_url: '/v2/routes/0e3e9789-4850-45e1-abab-3441a03868ac/apps',
                  route_mappings_url: '/v2/routes/0e3e9789-4850-45e1-abab-3441a03868ac/route_mappings'
                }
              },
              {
                metadata: {
                  guid: '85128cb8-73ca-4475-9190-284789382d9f',
                  url: '/v2/routes/85128cb8-73ca-4475-9190-284789382d9f',
                  created_at: '2017-10-02T12:58:16Z',
                  updated_at: '2017-10-02T12:58:16Z'
                },
                entity: {
                  host: 'acceptance_e2e_root_2017-10-02T12_55_11_087Z_new',
                  path: '',
                  domain_guid: '0da3e819-8be9-47f3-b9a1-8329ab649d63',
                  space_guid: 'a59b770c-2b51-46d8-a16d-bfc0322b2e12',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/0da3e819-8be9-47f3-b9a1-8329ab649d63',
                  space_url: '/v2/spaces/a59b770c-2b51-46d8-a16d-bfc0322b2e12',
                  apps_url: '/v2/routes/85128cb8-73ca-4475-9190-284789382d9f/apps',
                  route_mappings_url: '/v2/routes/85128cb8-73ca-4475-9190-284789382d9f/route_mappings'
                }
              },
              {
                metadata: {
                  guid: '5f073702-ce79-4465-a1ea-c96507a1899b',
                  url: '/v2/routes/5f073702-ce79-4465-a1ea-c96507a1899b',
                  created_at: '2017-10-03T09:29:50Z',
                  updated_at: '2017-10-03T09:29:50Z'
                },
                entity: {
                  host: 'Test1234asdsad',
                  path: '',
                  domain_guid: '0da3e819-8be9-47f3-b9a1-8329ab649d63',
                  space_guid: 'a59b770c-2b51-46d8-a16d-bfc0322b2e12',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/0da3e819-8be9-47f3-b9a1-8329ab649d63',
                  space_url: '/v2/spaces/a59b770c-2b51-46d8-a16d-bfc0322b2e12',
                  apps_url: '/v2/routes/5f073702-ce79-4465-a1ea-c96507a1899b/apps',
                  route_mappings_url: '/v2/routes/5f073702-ce79-4465-a1ea-c96507a1899b/route_mappings'
                }
              },
              {
                metadata: {
                  guid: '54a54cf1-0972-4ebf-ae9a-46844164f1d1',
                  url: '/v2/routes/54a54cf1-0972-4ebf-ae9a-46844164f1d1',
                  created_at: '2017-10-03T09:31:33Z',
                  updated_at: '2017-10-03T09:31:33Z'
                },
                entity: {
                  host: 'Test123456fsghdfgh',
                  path: '',
                  domain_guid: '0da3e819-8be9-47f3-b9a1-8329ab649d63',
                  space_guid: 'a59b770c-2b51-46d8-a16d-bfc0322b2e12',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/0da3e819-8be9-47f3-b9a1-8329ab649d63',
                  space_url: '/v2/spaces/a59b770c-2b51-46d8-a16d-bfc0322b2e12',
                  apps_url: '/v2/routes/54a54cf1-0972-4ebf-ae9a-46844164f1d1/apps',
                  route_mappings_url: '/v2/routes/54a54cf1-0972-4ebf-ae9a-46844164f1d1/route_mappings'
                }
              },
              {
                metadata: {
                  guid: 'c46d71d2-f570-4949-96a6-a7418489dbca',
                  url: '/v2/routes/c46d71d2-f570-4949-96a6-a7418489dbca',
                  created_at: '2017-10-03T09:47:40Z',
                  updated_at: '2017-10-03T09:47:40Z'
                },
                entity: {
                  host: 'nathantest',
                  path: '',
                  domain_guid: '0da3e819-8be9-47f3-b9a1-8329ab649d63',
                  space_guid: 'a59b770c-2b51-46d8-a16d-bfc0322b2e12',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/0da3e819-8be9-47f3-b9a1-8329ab649d63',
                  space_url: '/v2/spaces/a59b770c-2b51-46d8-a16d-bfc0322b2e12',
                  apps_url: '/v2/routes/c46d71d2-f570-4949-96a6-a7418489dbca/apps',
                  route_mappings_url: '/v2/routes/c46d71d2-f570-4949-96a6-a7418489dbca/route_mappings'
                }
              },
              {
                metadata: {
                  guid: '12a143e0-2d71-4017-9b9e-412505b06571',
                  url: '/v2/routes/12a143e0-2d71-4017-9b9e-412505b06571',
                  created_at: '2017-10-03T09:48:36Z',
                  updated_at: '2017-10-03T09:48:36Z'
                },
                entity: {
                  host: 'nathantestf',
                  path: '',
                  domain_guid: '0da3e819-8be9-47f3-b9a1-8329ab649d63',
                  space_guid: 'a59b770c-2b51-46d8-a16d-bfc0322b2e12',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/0da3e819-8be9-47f3-b9a1-8329ab649d63',
                  space_url: '/v2/spaces/a59b770c-2b51-46d8-a16d-bfc0322b2e12',
                  apps_url: '/v2/routes/12a143e0-2d71-4017-9b9e-412505b06571/apps',
                  route_mappings_url: '/v2/routes/12a143e0-2d71-4017-9b9e-412505b06571/route_mappings'
                }
              },
              {
                metadata: {
                  guid: '1ad3f87c-06eb-46a2-81bb-051a1f8d2d74',
                  url: '/v2/routes/1ad3f87c-06eb-46a2-81bb-051a1f8d2d74',
                  created_at: '2017-10-03T09:50:28Z',
                  updated_at: '2017-10-03T09:50:28Z'
                },
                entity: {
                  host: 'test1234dsfds',
                  path: '',
                  domain_guid: '0da3e819-8be9-47f3-b9a1-8329ab649d63',
                  space_guid: 'a59b770c-2b51-46d8-a16d-bfc0322b2e12',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/0da3e819-8be9-47f3-b9a1-8329ab649d63',
                  space_url: '/v2/spaces/a59b770c-2b51-46d8-a16d-bfc0322b2e12',
                  apps_url: '/v2/routes/1ad3f87c-06eb-46a2-81bb-051a1f8d2d74/apps',
                  route_mappings_url: '/v2/routes/1ad3f87c-06eb-46a2-81bb-051a1f8d2d74/route_mappings'
                }
              },
              {
                metadata: {
                  guid: '670b5be8-0a31-4430-bb06-eefda0b333b1',
                  url: '/v2/routes/670b5be8-0a31-4430-bb06-eefda0b333b1',
                  created_at: '2017-10-03T09:56:41Z',
                  updated_at: '2017-10-03T09:56:41Z'
                },
                entity: {
                  host: 'test1234asdsadsad',
                  path: '',
                  domain_guid: '0da3e819-8be9-47f3-b9a1-8329ab649d63',
                  space_guid: 'a59b770c-2b51-46d8-a16d-bfc0322b2e12',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/0da3e819-8be9-47f3-b9a1-8329ab649d63',
                  space_url: '/v2/spaces/a59b770c-2b51-46d8-a16d-bfc0322b2e12',
                  apps_url: '/v2/routes/670b5be8-0a31-4430-bb06-eefda0b333b1/apps',
                  route_mappings_url: '/v2/routes/670b5be8-0a31-4430-bb06-eefda0b333b1/route_mappings'
                }
              },
              {
                metadata: {
                  guid: '87394396-56ce-490a-936f-279c09b73112',
                  url: '/v2/routes/87394396-56ce-490a-936f-279c09b73112',
                  created_at: '2017-10-03T09:58:10Z',
                  updated_at: '2017-10-03T09:58:10Z'
                },
                entity: {
                  host: 'sadfdasf',
                  path: '',
                  domain_guid: '0da3e819-8be9-47f3-b9a1-8329ab649d63',
                  space_guid: 'a59b770c-2b51-46d8-a16d-bfc0322b2e12',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/0da3e819-8be9-47f3-b9a1-8329ab649d63',
                  space_url: '/v2/spaces/a59b770c-2b51-46d8-a16d-bfc0322b2e12',
                  apps_url: '/v2/routes/87394396-56ce-490a-936f-279c09b73112/apps',
                  route_mappings_url: '/v2/routes/87394396-56ce-490a-936f-279c09b73112/route_mappings'
                }
              },
              {
                metadata: {
                  guid: 'b7b4ee95-da57-4f0d-9fb5-f484e6850b20',
                  url: '/v2/routes/b7b4ee95-da57-4f0d-9fb5-f484e6850b20',
                  created_at: '2017-10-03T10:06:56Z',
                  updated_at: '2017-10-03T10:06:56Z'
                },
                entity: {
                  host: 'test1234asdf',
                  path: '',
                  domain_guid: '0da3e819-8be9-47f3-b9a1-8329ab649d63',
                  space_guid: 'a59b770c-2b51-46d8-a16d-bfc0322b2e12',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/0da3e819-8be9-47f3-b9a1-8329ab649d63',
                  space_url: '/v2/spaces/a59b770c-2b51-46d8-a16d-bfc0322b2e12',
                  apps_url: '/v2/routes/b7b4ee95-da57-4f0d-9fb5-f484e6850b20/apps',
                  route_mappings_url: '/v2/routes/b7b4ee95-da57-4f0d-9fb5-f484e6850b20/route_mappings'
                }
              },
              {
                metadata: {
                  guid: '66772071-4a72-4bb6-abac-f8bbcd272cf1',
                  url: '/v2/routes/66772071-4a72-4bb6-abac-f8bbcd272cf1',
                  created_at: '2017-10-03T10:08:20Z',
                  updated_at: '2017-10-03T10:08:20Z'
                },
                entity: {
                  host: 'test1234xcvbnm',
                  path: '',
                  domain_guid: '0da3e819-8be9-47f3-b9a1-8329ab649d63',
                  space_guid: 'a59b770c-2b51-46d8-a16d-bfc0322b2e12',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/0da3e819-8be9-47f3-b9a1-8329ab649d63',
                  space_url: '/v2/spaces/a59b770c-2b51-46d8-a16d-bfc0322b2e12',
                  apps_url: '/v2/routes/66772071-4a72-4bb6-abac-f8bbcd272cf1/apps',
                  route_mappings_url: '/v2/routes/66772071-4a72-4bb6-abac-f8bbcd272cf1/route_mappings'
                }
              },
              {
                metadata: {
                  guid: '078b3e5d-f679-4a9e-9a5c-229b1953637a',
                  url: '/v2/routes/078b3e5d-f679-4a9e-9a5c-229b1953637a',
                  created_at: '2017-10-03T10:11:24Z',
                  updated_at: '2017-10-03T10:11:24Z'
                },
                entity: {
                  host: 'test1234dfvdfg',
                  path: '',
                  domain_guid: '0da3e819-8be9-47f3-b9a1-8329ab649d63',
                  space_guid: 'a59b770c-2b51-46d8-a16d-bfc0322b2e12',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/0da3e819-8be9-47f3-b9a1-8329ab649d63',
                  space_url: '/v2/spaces/a59b770c-2b51-46d8-a16d-bfc0322b2e12',
                  apps_url: '/v2/routes/078b3e5d-f679-4a9e-9a5c-229b1953637a/apps',
                  route_mappings_url: '/v2/routes/078b3e5d-f679-4a9e-9a5c-229b1953637a/route_mappings'
                }
              },
              {
                metadata: {
                  guid: '29bbc1ec-2398-4a0c-ada2-29227bffc543',
                  url: '/v2/routes/29bbc1ec-2398-4a0c-ada2-29227bffc543',
                  created_at: '2017-10-03T10:11:58Z',
                  updated_at: '2017-10-03T10:11:58Z'
                },
                entity: {
                  host: 'wsdefrgtyuji',
                  path: '',
                  domain_guid: '0da3e819-8be9-47f3-b9a1-8329ab649d63',
                  space_guid: 'a59b770c-2b51-46d8-a16d-bfc0322b2e12',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/0da3e819-8be9-47f3-b9a1-8329ab649d63',
                  space_url: '/v2/spaces/a59b770c-2b51-46d8-a16d-bfc0322b2e12',
                  apps_url: '/v2/routes/29bbc1ec-2398-4a0c-ada2-29227bffc543/apps',
                  route_mappings_url: '/v2/routes/29bbc1ec-2398-4a0c-ada2-29227bffc543/route_mappings'
                }
              },
              {
                metadata: {
                  guid: '1231bfa0-14f7-4b45-b453-e09fdb32323d',
                  url: '/v2/routes/1231bfa0-14f7-4b45-b453-e09fdb32323d',
                  created_at: '2017-10-03T10:14:02Z',
                  updated_at: '2017-10-03T10:14:02Z'
                },
                entity: {
                  host: 'test1234-nbnmc',
                  path: '',
                  domain_guid: '0da3e819-8be9-47f3-b9a1-8329ab649d63',
                  space_guid: 'a59b770c-2b51-46d8-a16d-bfc0322b2e12',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/0da3e819-8be9-47f3-b9a1-8329ab649d63',
                  space_url: '/v2/spaces/a59b770c-2b51-46d8-a16d-bfc0322b2e12',
                  apps_url: '/v2/routes/1231bfa0-14f7-4b45-b453-e09fdb32323d/apps',
                  route_mappings_url: '/v2/routes/1231bfa0-14f7-4b45-b453-e09fdb32323d/route_mappings'
                }
              },
              {
                metadata: {
                  guid: 'f6aaeaed-e91b-4c44-bba0-abb4ee3c6e1a',
                  url: '/v2/routes/f6aaeaed-e91b-4c44-bba0-abb4ee3c6e1a',
                  created_at: '2017-10-03T10:38:09Z',
                  updated_at: '2017-10-03T10:38:09Z'
                },
                entity: {
                  host: 'nathan-test123',
                  path: '',
                  domain_guid: '0da3e819-8be9-47f3-b9a1-8329ab649d63',
                  space_guid: 'a59b770c-2b51-46d8-a16d-bfc0322b2e12',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/0da3e819-8be9-47f3-b9a1-8329ab649d63',
                  space_url: '/v2/spaces/a59b770c-2b51-46d8-a16d-bfc0322b2e12',
                  apps_url: '/v2/routes/f6aaeaed-e91b-4c44-bba0-abb4ee3c6e1a/apps',
                  route_mappings_url: '/v2/routes/f6aaeaed-e91b-4c44-bba0-abb4ee3c6e1a/route_mappings'
                }
              },
              {
                metadata: {
                  guid: '8ebad19b-1269-4a70-9408-ee915fdc14e8',
                  url: '/v2/routes/8ebad19b-1269-4a70-9408-ee915fdc14e8',
                  created_at: '2017-10-03T10:47:16Z',
                  updated_at: '2017-10-03T10:47:16Z'
                },
                entity: {
                  host: 'test1234asdsadadsfdsaf',
                  path: '',
                  domain_guid: '0da3e819-8be9-47f3-b9a1-8329ab649d63',
                  space_guid: 'a59b770c-2b51-46d8-a16d-bfc0322b2e12',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/0da3e819-8be9-47f3-b9a1-8329ab649d63',
                  space_url: '/v2/spaces/a59b770c-2b51-46d8-a16d-bfc0322b2e12',
                  apps_url: '/v2/routes/8ebad19b-1269-4a70-9408-ee915fdc14e8/apps',
                  route_mappings_url: '/v2/routes/8ebad19b-1269-4a70-9408-ee915fdc14e8/route_mappings'
                }
              },
              {
                metadata: {
                  guid: '22410093-c690-47cd-a9e5-aa756989fc6b',
                  url: '/v2/routes/22410093-c690-47cd-a9e5-aa756989fc6b',
                  created_at: '2017-10-03T10:49:37Z',
                  updated_at: '2017-10-03T10:49:37Z'
                },
                entity: {
                  host: 'test1234fdsf',
                  path: '',
                  domain_guid: '0da3e819-8be9-47f3-b9a1-8329ab649d63',
                  space_guid: 'a59b770c-2b51-46d8-a16d-bfc0322b2e12',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/0da3e819-8be9-47f3-b9a1-8329ab649d63',
                  space_url: '/v2/spaces/a59b770c-2b51-46d8-a16d-bfc0322b2e12',
                  apps_url: '/v2/routes/22410093-c690-47cd-a9e5-aa756989fc6b/apps',
                  route_mappings_url: '/v2/routes/22410093-c690-47cd-a9e5-aa756989fc6b/route_mappings'
                }
              },
              {
                metadata: {
                  guid: 'c919c1d9-789b-489b-a74e-a43c6afa5dc8',
                  url: '/v2/routes/c919c1d9-789b-489b-a74e-a43c6afa5dc8',
                  created_at: '2017-10-05T12:33:53Z',
                  updated_at: '2017-10-05T12:33:53Z'
                },
                entity: {
                  host: 'asdfsdfasdfsdaf2',
                  path: '',
                  domain_guid: '0da3e819-8be9-47f3-b9a1-8329ab649d63',
                  space_guid: 'a59b770c-2b51-46d8-a16d-bfc0322b2e12',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/0da3e819-8be9-47f3-b9a1-8329ab649d63',
                  space_url: '/v2/spaces/a59b770c-2b51-46d8-a16d-bfc0322b2e12',
                  apps_url: '/v2/routes/c919c1d9-789b-489b-a74e-a43c6afa5dc8/apps',
                  route_mappings_url: '/v2/routes/c919c1d9-789b-489b-a74e-a43c6afa5dc8/route_mappings'
                }
              }
            ],
            domains_url: '/v2/spaces/a59b770c-2b51-46d8-a16d-bfc0322b2e12/domains',
            domains: [
              {
                metadata: {
                  guid: '0da3e819-8be9-47f3-b9a1-8329ab649d63',
                  url: '/v2/shared_domains/0da3e819-8be9-47f3-b9a1-8329ab649d63',
                  created_at: '2017-08-10T13:38:02Z',
                  updated_at: '2017-08-10T13:38:02Z'
                },
                entity: {
                  name: 'cf-dev.io',
                  router_group_guid: null,
                  router_group_type: null
                }
              }
            ],
            service_instances_url: '/v2/spaces/a59b770c-2b51-46d8-a16d-bfc0322b2e12/service_instances',
            service_instances: [
              {
                metadata: {
                  guid: '272e4b3d-1fa6-4eb5-8688-8c305ae129ad',
                  url: '/v2/service_instances/272e4b3d-1fa6-4eb5-8688-8c305ae129ad',
                  created_at: '2017-10-02T12:07:28Z',
                  updated_at: '2017-10-02T12:07:28Z'
                },
                entity: {
                  name: 'service_e2e_root_2017-10-02T12_03_40_267Z',
                  credentials: {},
                  service_plan_guid: '549409b6-b754-4643-a83b-885dbcfd2dfb',
                  space_guid: 'a59b770c-2b51-46d8-a16d-bfc0322b2e12',
                  gateway_data: null,
                  dashboard_url: 'https://app-autoscaler-broker.cf-dev.io/dashboard',
                  type: 'managed_service_instance',
                  last_operation: {
                    type: 'create',
                    state: 'succeeded',
                    description: '',
                    updated_at: '2017-10-02T12:07:28Z',
                    created_at: '2017-10-02T12:07:28Z'
                  },
                  tags: [],
                  service_guid: '43b1c1bd-0a26-4986-adcc-700d56559f1e',
                  space_url: '/v2/spaces/a59b770c-2b51-46d8-a16d-bfc0322b2e12',
                  service_plan_url: '/v2/service_plans/549409b6-b754-4643-a83b-885dbcfd2dfb',
                  service_bindings_url: '/v2/service_instances/272e4b3d-1fa6-4eb5-8688-8c305ae129ad/service_bindings',
                  service_keys_url: '/v2/service_instances/272e4b3d-1fa6-4eb5-8688-8c305ae129ad/service_keys',
                  routes_url: '/v2/service_instances/272e4b3d-1fa6-4eb5-8688-8c305ae129ad/routes',
                  service_url: '/v2/services/43b1c1bd-0a26-4986-adcc-700d56559f1e'
                }
              }
            ],
            app_events_url: '/v2/spaces/a59b770c-2b51-46d8-a16d-bfc0322b2e12/app_events',
            events_url: '/v2/spaces/a59b770c-2b51-46d8-a16d-bfc0322b2e12/events',
            security_groups_url: '/v2/spaces/a59b770c-2b51-46d8-a16d-bfc0322b2e12/security_groups',
            security_groups: [
              {
                metadata: {
                  guid: 'fd8f2bbf-2f1a-4320-a07f-240bb2ca02dd',
                  url: '/v2/security_groups/fd8f2bbf-2f1a-4320-a07f-240bb2ca02dd',
                  created_at: '2017-08-10T13:38:02Z',
                  updated_at: '2017-08-10T13:38:02Z'
                },
                entity: {
                  name: 'public_networks',
                  rules: [
                    {
                      destination: '0.0.0.0-9.255.255.255',
                      protocol: 'all'
                    },
                    {
                      destination: '11.0.0.0-169.253.255.255',
                      protocol: 'all'
                    },
                    {
                      destination: '169.255.0.0-172.15.255.255',
                      protocol: 'all'
                    },
                    {
                      destination: '172.32.0.0-192.167.255.255',
                      protocol: 'all'
                    },
                    {
                      destination: '192.169.0.0-255.255.255.255',
                      protocol: 'all'
                    }
                  ],
                  running_default: true,
                  staging_default: true,
                  spaces_url: '/v2/security_groups/fd8f2bbf-2f1a-4320-a07f-240bb2ca02dd/spaces',
                  staging_spaces_url: '/v2/security_groups/fd8f2bbf-2f1a-4320-a07f-240bb2ca02dd/staging_spaces'
                }
              },
              {
                metadata: {
                  guid: 'edd678c5-8abc-4973-8b6f-856bb87ca7de',
                  url: '/v2/security_groups/edd678c5-8abc-4973-8b6f-856bb87ca7de',
                  created_at: '2017-08-10T13:38:02Z',
                  updated_at: '2017-08-10T13:38:02Z'
                },
                entity: {
                  name: 'dns',
                  rules: [
                    {
                      destination: '0.0.0.0/0',
                      ports: '53',
                      protocol: 'tcp'
                    },
                    {
                      destination: '0.0.0.0/0',
                      ports: '53',
                      protocol: 'udp'
                    }
                  ],
                  running_default: true,
                  staging_default: true,
                  spaces_url: '/v2/security_groups/edd678c5-8abc-4973-8b6f-856bb87ca7de/spaces',
                  staging_spaces_url: '/v2/security_groups/edd678c5-8abc-4973-8b6f-856bb87ca7de/staging_spaces'
                }
              },
              {
                metadata: {
                  guid: '65c2b61e-dc9f-4415-86bf-493cb4ea284e',
                  url: '/v2/security_groups/65c2b61e-dc9f-4415-86bf-493cb4ea284e',
                  created_at: '2017-08-10T13:39:32Z',
                  updated_at: '2017-08-10T13:39:34Z'
                },
                entity: {
                  name: 'dev-mysql',
                  rules: [
                    {
                      destination: '10.0.0.41',
                      ports: '3306',
                      protocol: 'tcp'
                    }
                  ],
                  running_default: true,
                  staging_default: true,
                  spaces_url: '/v2/security_groups/65c2b61e-dc9f-4415-86bf-493cb4ea284e/spaces',
                  staging_spaces_url: '/v2/security_groups/65c2b61e-dc9f-4415-86bf-493cb4ea284e/staging_spaces'
                }
              }
            ],
            staging_security_groups_url: '/v2/spaces/a59b770c-2b51-46d8-a16d-bfc0322b2e12/staging_security_groups',
            staging_security_groups: [
              {
                metadata: {
                  guid: 'fd8f2bbf-2f1a-4320-a07f-240bb2ca02dd',
                  url: '/v2/security_groups/fd8f2bbf-2f1a-4320-a07f-240bb2ca02dd',
                  created_at: '2017-08-10T13:38:02Z',
                  updated_at: '2017-08-10T13:38:02Z'
                },
                entity: {
                  name: 'public_networks',
                  rules: [
                    {
                      destination: '0.0.0.0-9.255.255.255',
                      protocol: 'all'
                    },
                    {
                      destination: '11.0.0.0-169.253.255.255',
                      protocol: 'all'
                    },
                    {
                      destination: '169.255.0.0-172.15.255.255',
                      protocol: 'all'
                    },
                    {
                      destination: '172.32.0.0-192.167.255.255',
                      protocol: 'all'
                    },
                    {
                      destination: '192.169.0.0-255.255.255.255',
                      protocol: 'all'
                    }
                  ],
                  running_default: true,
                  staging_default: true,
                  spaces_url: '/v2/security_groups/fd8f2bbf-2f1a-4320-a07f-240bb2ca02dd/spaces',
                  staging_spaces_url: '/v2/security_groups/fd8f2bbf-2f1a-4320-a07f-240bb2ca02dd/staging_spaces'
                }
              },
              {
                metadata: {
                  guid: 'edd678c5-8abc-4973-8b6f-856bb87ca7de',
                  url: '/v2/security_groups/edd678c5-8abc-4973-8b6f-856bb87ca7de',
                  created_at: '2017-08-10T13:38:02Z',
                  updated_at: '2017-08-10T13:38:02Z'
                },
                entity: {
                  name: 'dns',
                  rules: [
                    {
                      destination: '0.0.0.0/0',
                      ports: '53',
                      protocol: 'tcp'
                    },
                    {
                      destination: '0.0.0.0/0',
                      ports: '53',
                      protocol: 'udp'
                    }
                  ],
                  running_default: true,
                  staging_default: true,
                  spaces_url: '/v2/security_groups/edd678c5-8abc-4973-8b6f-856bb87ca7de/spaces',
                  staging_spaces_url: '/v2/security_groups/edd678c5-8abc-4973-8b6f-856bb87ca7de/staging_spaces'
                }
              },
              {
                metadata: {
                  guid: '65c2b61e-dc9f-4415-86bf-493cb4ea284e',
                  url: '/v2/security_groups/65c2b61e-dc9f-4415-86bf-493cb4ea284e',
                  created_at: '2017-08-10T13:39:32Z',
                  updated_at: '2017-08-10T13:39:34Z'
                },
                entity: {
                  name: 'dev-mysql',
                  rules: [
                    {
                      destination: '10.0.0.41',
                      ports: '3306',
                      protocol: 'tcp'
                    }
                  ],
                  running_default: true,
                  staging_default: true,
                  spaces_url: '/v2/security_groups/65c2b61e-dc9f-4415-86bf-493cb4ea284e/spaces',
                  staging_spaces_url: '/v2/security_groups/65c2b61e-dc9f-4415-86bf-493cb4ea284e/staging_spaces'
                }
              }
            ]
          }
        },
        'aa775168-7be8-4006-81e5-647d59f8ee22': {
          metadata: {
            guid: 'aa775168-7be8-4006-81e5-647d59f8ee22',
            url: '/v2/spaces/aa775168-7be8-4006-81e5-647d59f8ee22',
            created_at: '2017-09-22T15:28:41Z',
            updated_at: '2017-09-22T15:28:41Z'
          },
          entity: {
            name: 'dev',
            organization_guid: '742d83a1-f8d4-4b1a-96d7-010e9074c2ca',
            space_quota_definition_guid: null,
            isolation_segment_guid: null,
            allow_ssh: true,
            organization_url: '/v2/organizations/742d83a1-f8d4-4b1a-96d7-010e9074c2ca',
            organization: {
              metadata: {
                guid: '742d83a1-f8d4-4b1a-96d7-010e9074c2ca',
                url: '/v2/organizations/742d83a1-f8d4-4b1a-96d7-010e9074c2ca',
                created_at: '2017-09-22T15:28:13Z',
                updated_at: '2017-09-22T15:28:13Z'
              },
              entity: {
                name: 'SUSE',
                billing_enabled: false,
                quota_definition_guid: '5fcd846b-7eb3-410e-ba15-35634d723ca7',
                status: 'active',
                default_isolation_segment_guid: null,
                quota_definition_url: '/v2/quota_definitions/5fcd846b-7eb3-410e-ba15-35634d723ca7',
                spaces_url: '/v2/organizations/742d83a1-f8d4-4b1a-96d7-010e9074c2ca/spaces',
                domains_url: '/v2/organizations/742d83a1-f8d4-4b1a-96d7-010e9074c2ca/domains',
                private_domains_url: '/v2/organizations/742d83a1-f8d4-4b1a-96d7-010e9074c2ca/private_domains',
                users_url: '/v2/organizations/742d83a1-f8d4-4b1a-96d7-010e9074c2ca/users',
                managers_url: '/v2/organizations/742d83a1-f8d4-4b1a-96d7-010e9074c2ca/managers',
                billing_managers_url: '/v2/organizations/742d83a1-f8d4-4b1a-96d7-010e9074c2ca/billing_managers',
                auditors_url: '/v2/organizations/742d83a1-f8d4-4b1a-96d7-010e9074c2ca/auditors',
                app_events_url: '/v2/organizations/742d83a1-f8d4-4b1a-96d7-010e9074c2ca/app_events',
                space_quota_definitions_url: '/v2/organizations/742d83a1-f8d4-4b1a-96d7-010e9074c2ca/space_quota_definitions'
              }
            },
            developers_url: '/v2/spaces/aa775168-7be8-4006-81e5-647d59f8ee22/developers',
            developers: [
              {
                metadata: {
                  guid: 'b2a8ed5c-5c63-4b5b-bdf8-04ea66a9db00',
                  url: '/v2/users/b2a8ed5c-5c63-4b5b-bdf8-04ea66a9db00',
                  created_at: '2017-09-22T15:27:32Z',
                  updated_at: '2017-09-22T15:27:32Z'
                },
                entity: {
                  admin: false,
                  active: true,
                  default_space_guid: null,
                  spaces_url: '/v2/users/b2a8ed5c-5c63-4b5b-bdf8-04ea66a9db00/spaces',
                  organizations_url: '/v2/users/b2a8ed5c-5c63-4b5b-bdf8-04ea66a9db00/organizations',
                  managed_organizations_url: '/v2/users/b2a8ed5c-5c63-4b5b-bdf8-04ea66a9db00/managed_organizations',
                  billing_managed_organizations_url: '/v2/users/b2a8ed5c-5c63-4b5b-bdf8-04ea66a9db00/billing_managed_organizations',
                  audited_organizations_url: '/v2/users/b2a8ed5c-5c63-4b5b-bdf8-04ea66a9db00/audited_organizations',
                  managed_spaces_url: '/v2/users/b2a8ed5c-5c63-4b5b-bdf8-04ea66a9db00/managed_spaces',
                  audited_spaces_url: '/v2/users/b2a8ed5c-5c63-4b5b-bdf8-04ea66a9db00/audited_spaces'
                }
              }
            ],
            managers_url: '/v2/spaces/aa775168-7be8-4006-81e5-647d59f8ee22/managers',
            managers: [
              {
                metadata: {
                  guid: 'b2a8ed5c-5c63-4b5b-bdf8-04ea66a9db00',
                  url: '/v2/users/b2a8ed5c-5c63-4b5b-bdf8-04ea66a9db00',
                  created_at: '2017-09-22T15:27:32Z',
                  updated_at: '2017-09-22T15:27:32Z'
                },
                entity: {
                  admin: false,
                  active: true,
                  default_space_guid: null,
                  spaces_url: '/v2/users/b2a8ed5c-5c63-4b5b-bdf8-04ea66a9db00/spaces',
                  organizations_url: '/v2/users/b2a8ed5c-5c63-4b5b-bdf8-04ea66a9db00/organizations',
                  managed_organizations_url: '/v2/users/b2a8ed5c-5c63-4b5b-bdf8-04ea66a9db00/managed_organizations',
                  billing_managed_organizations_url: '/v2/users/b2a8ed5c-5c63-4b5b-bdf8-04ea66a9db00/billing_managed_organizations',
                  audited_organizations_url: '/v2/users/b2a8ed5c-5c63-4b5b-bdf8-04ea66a9db00/audited_organizations',
                  managed_spaces_url: '/v2/users/b2a8ed5c-5c63-4b5b-bdf8-04ea66a9db00/managed_spaces',
                  audited_spaces_url: '/v2/users/b2a8ed5c-5c63-4b5b-bdf8-04ea66a9db00/audited_spaces'
                }
              }
            ],
            auditors_url: '/v2/spaces/aa775168-7be8-4006-81e5-647d59f8ee22/auditors',
            auditors: [],
            apps_url: '/v2/spaces/aa775168-7be8-4006-81e5-647d59f8ee22/apps',
            routes_url: '/v2/spaces/aa775168-7be8-4006-81e5-647d59f8ee22/routes',
            routes: [
              {
                metadata: {
                  guid: 'c8c53018-1bce-47ef-bf63-24e7b38a74bc',
                  url: '/v2/routes/c8c53018-1bce-47ef-bf63-24e7b38a74bc',
                  created_at: '2017-09-22T15:30:52Z',
                  updated_at: '2017-09-22T15:30:52Z'
                },
                entity: {
                  host: 'node-env',
                  path: '',
                  domain_guid: '44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  space_guid: 'aa775168-7be8-4006-81e5-647d59f8ee22',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  space_url: '/v2/spaces/aa775168-7be8-4006-81e5-647d59f8ee22',
                  apps_url: '/v2/routes/c8c53018-1bce-47ef-bf63-24e7b38a74bc/apps',
                  route_mappings_url: '/v2/routes/c8c53018-1bce-47ef-bf63-24e7b38a74bc/route_mappings'
                }
              },
              {
                metadata: {
                  guid: 'ce36ddf4-3530-441a-8b03-d86c3ecc3fb5',
                  url: '/v2/routes/ce36ddf4-3530-441a-8b03-d86c3ecc3fb5',
                  created_at: '2017-09-27T09:21:56Z',
                  updated_at: '2017-09-27T09:21:56Z'
                },
                entity: {
                  host: 'slides',
                  path: '',
                  domain_guid: '44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  space_guid: 'aa775168-7be8-4006-81e5-647d59f8ee22',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  space_url: '/v2/spaces/aa775168-7be8-4006-81e5-647d59f8ee22',
                  apps_url: '/v2/routes/ce36ddf4-3530-441a-8b03-d86c3ecc3fb5/apps',
                  route_mappings_url: '/v2/routes/ce36ddf4-3530-441a-8b03-d86c3ecc3fb5/route_mappings'
                }
              },
              {
                metadata: {
                  guid: '6613b2d5-e4e0-4f75-93b0-5e715c4f42f7',
                  url: '/v2/routes/6613b2d5-e4e0-4f75-93b0-5e715c4f42f7',
                  created_at: '2017-09-30T10:37:34Z',
                  updated_at: '2017-09-30T10:37:34Z'
                },
                entity: {
                  host: '12factor',
                  path: '',
                  domain_guid: '44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  space_guid: 'aa775168-7be8-4006-81e5-647d59f8ee22',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  space_url: '/v2/spaces/aa775168-7be8-4006-81e5-647d59f8ee22',
                  apps_url: '/v2/routes/6613b2d5-e4e0-4f75-93b0-5e715c4f42f7/apps',
                  route_mappings_url: '/v2/routes/6613b2d5-e4e0-4f75-93b0-5e715c4f42f7/route_mappings'
                }
              },
              {
                metadata: {
                  guid: '7f52f0a7-5a1e-4dcf-afa9-f5c484d56f4d',
                  url: '/v2/routes/7f52f0a7-5a1e-4dcf-afa9-f5c484d56f4d',
                  created_at: '2017-10-09T15:32:52Z',
                  updated_at: '2017-10-09T15:32:52Z'
                },
                entity: {
                  host: 'nwm-console',
                  path: '',
                  domain_guid: '44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  space_guid: 'aa775168-7be8-4006-81e5-647d59f8ee22',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  space_url: '/v2/spaces/aa775168-7be8-4006-81e5-647d59f8ee22',
                  apps_url: '/v2/routes/7f52f0a7-5a1e-4dcf-afa9-f5c484d56f4d/apps',
                  route_mappings_url: '/v2/routes/7f52f0a7-5a1e-4dcf-afa9-f5c484d56f4d/route_mappings'
                }
              }
            ],
            domains_url: '/v2/spaces/aa775168-7be8-4006-81e5-647d59f8ee22/domains',
            domains: [
              {
                metadata: {
                  guid: '44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  url: '/v2/shared_domains/44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  created_at: '2017-09-22T15:25:53Z',
                  updated_at: '2017-09-22T15:25:53Z'
                },
                entity: {
                  name: 'capbristol.com',
                  router_group_guid: null,
                  router_group_type: null
                }
              }
            ],
            service_instances_url: '/v2/spaces/aa775168-7be8-4006-81e5-647d59f8ee22/service_instances',
            service_instances: [
              {
                metadata: {
                  guid: '76a86c69-3bb9-419f-8dbf-d52eb865d7f6',
                  url: '/v2/service_instances/76a86c69-3bb9-419f-8dbf-d52eb865d7f6',
                  created_at: '2017-09-25T13:46:14Z',
                  updated_at: '2017-09-25T13:46:14Z'
                },
                entity: {
                  name: 'Test-DB',
                  credentials: {},
                  service_plan_guid: '9364d296-2cba-4883-a47f-f152fc1bc0ac',
                  space_guid: 'aa775168-7be8-4006-81e5-647d59f8ee22',
                  gateway_data: null,
                  dashboard_url: 'https://capbristol.com/manage/instances/76a86c69-3bb9-419f-8dbf-d52eb865d7f6',
                  type: 'managed_service_instance',
                  last_operation: {
                    type: 'create',
                    state: 'succeeded',
                    description: '',
                    updated_at: '2017-09-25T13:46:14Z',
                    created_at: '2017-09-25T13:46:14Z'
                  },
                  tags: [
                    'suseon'
                  ],
                  service_guid: '6ee3d1bf-df07-4e80-bacf-6adc3b72e4db',
                  space_url: '/v2/spaces/aa775168-7be8-4006-81e5-647d59f8ee22',
                  service_plan_url: '/v2/service_plans/9364d296-2cba-4883-a47f-f152fc1bc0ac',
                  service_bindings_url: '/v2/service_instances/76a86c69-3bb9-419f-8dbf-d52eb865d7f6/service_bindings',
                  service_keys_url: '/v2/service_instances/76a86c69-3bb9-419f-8dbf-d52eb865d7f6/service_keys',
                  routes_url: '/v2/service_instances/76a86c69-3bb9-419f-8dbf-d52eb865d7f6/routes',
                  service_url: '/v2/services/6ee3d1bf-df07-4e80-bacf-6adc3b72e4db'
                }
              },
              {
                metadata: {
                  guid: '7a5aa760-5d47-4126-8510-a197a63e5fc8',
                  url: '/v2/service_instances/7a5aa760-5d47-4126-8510-a197a63e5fc8',
                  created_at: '2017-10-09T15:31:49Z',
                  updated_at: '2017-10-09T15:31:49Z'
                },
                entity: {
                  name: 'Console',
                  credentials: {},
                  service_plan_guid: '9364d296-2cba-4883-a47f-f152fc1bc0ac',
                  space_guid: 'aa775168-7be8-4006-81e5-647d59f8ee22',
                  gateway_data: null,
                  dashboard_url: 'https://capbristol.com/manage/instances/7a5aa760-5d47-4126-8510-a197a63e5fc8',
                  type: 'managed_service_instance',
                  last_operation: {
                    type: 'create',
                    state: 'succeeded',
                    description: '',
                    updated_at: '2017-10-09T15:31:49Z',
                    created_at: '2017-10-09T15:31:49Z'
                  },
                  tags: [
                    'stratos_mysql'
                  ],
                  service_guid: '6ee3d1bf-df07-4e80-bacf-6adc3b72e4db',
                  space_url: '/v2/spaces/aa775168-7be8-4006-81e5-647d59f8ee22',
                  service_plan_url: '/v2/service_plans/9364d296-2cba-4883-a47f-f152fc1bc0ac',
                  service_bindings_url: '/v2/service_instances/7a5aa760-5d47-4126-8510-a197a63e5fc8/service_bindings',
                  service_keys_url: '/v2/service_instances/7a5aa760-5d47-4126-8510-a197a63e5fc8/service_keys',
                  routes_url: '/v2/service_instances/7a5aa760-5d47-4126-8510-a197a63e5fc8/routes',
                  service_url: '/v2/services/6ee3d1bf-df07-4e80-bacf-6adc3b72e4db'
                }
              }
            ],
            app_events_url: '/v2/spaces/aa775168-7be8-4006-81e5-647d59f8ee22/app_events',
            events_url: '/v2/spaces/aa775168-7be8-4006-81e5-647d59f8ee22/events',
            security_groups_url: '/v2/spaces/aa775168-7be8-4006-81e5-647d59f8ee22/security_groups',
            security_groups: [
              {
                metadata: {
                  guid: 'f9106af9-9f69-4d20-84bf-e239ce19bbaf',
                  url: '/v2/security_groups/f9106af9-9f69-4d20-84bf-e239ce19bbaf',
                  created_at: '2017-09-22T15:29:00Z',
                  updated_at: '2017-09-22T15:29:00Z'
                },
                entity: {
                  name: 'all-traffic',
                  rules: [
                    {
                      destination: '0.0.0.0-255.255.255.255',
                      protocol: 'all'
                    }
                  ],
                  running_default: false,
                  staging_default: false,
                  spaces_url: '/v2/security_groups/f9106af9-9f69-4d20-84bf-e239ce19bbaf/spaces',
                  staging_spaces_url: '/v2/security_groups/f9106af9-9f69-4d20-84bf-e239ce19bbaf/staging_spaces'
                }
              },
              {
                metadata: {
                  guid: '882d01f9-f95f-49f7-b36d-167363b04ef8',
                  url: '/v2/security_groups/882d01f9-f95f-49f7-b36d-167363b04ef8',
                  created_at: '2017-09-22T15:25:53Z',
                  updated_at: '2017-09-22T15:25:53Z'
                },
                entity: {
                  name: 'public_networks',
                  rules: [
                    {
                      destination: '0.0.0.0-9.255.255.255',
                      protocol: 'all'
                    },
                    {
                      destination: '11.0.0.0-169.253.255.255',
                      protocol: 'all'
                    },
                    {
                      destination: '169.255.0.0-172.15.255.255',
                      protocol: 'all'
                    },
                    {
                      destination: '172.32.0.0-192.167.255.255',
                      protocol: 'all'
                    },
                    {
                      destination: '192.169.0.0-255.255.255.255',
                      protocol: 'all'
                    }
                  ],
                  running_default: true,
                  staging_default: true,
                  spaces_url: '/v2/security_groups/882d01f9-f95f-49f7-b36d-167363b04ef8/spaces',
                  staging_spaces_url: '/v2/security_groups/882d01f9-f95f-49f7-b36d-167363b04ef8/staging_spaces'
                }
              },
              {
                metadata: {
                  guid: '1a0f5ef8-addc-49a8-b107-fbd290575124',
                  url: '/v2/security_groups/1a0f5ef8-addc-49a8-b107-fbd290575124',
                  created_at: '2017-09-22T15:25:53Z',
                  updated_at: '2017-09-22T15:25:53Z'
                },
                entity: {
                  name: 'dns',
                  rules: [
                    {
                      destination: '0.0.0.0/0',
                      ports: '53',
                      protocol: 'tcp'
                    },
                    {
                      destination: '0.0.0.0/0',
                      ports: '53',
                      protocol: 'udp'
                    }
                  ],
                  running_default: true,
                  staging_default: true,
                  spaces_url: '/v2/security_groups/1a0f5ef8-addc-49a8-b107-fbd290575124/spaces',
                  staging_spaces_url: '/v2/security_groups/1a0f5ef8-addc-49a8-b107-fbd290575124/staging_spaces'
                }
              },
              {
                metadata: {
                  guid: '60ad6339-baae-416a-bc15-65f2de203fc6',
                  url: '/v2/security_groups/60ad6339-baae-416a-bc15-65f2de203fc6',
                  created_at: '2017-09-22T15:29:01Z',
                  updated_at: '2017-09-22T15:29:02Z'
                },
                entity: {
                  name: 'dev-mysql',
                  rules: [
                    {
                      destination: '10.0.0.17',
                      ports: '3306',
                      protocol: 'tcp'
                    }
                  ],
                  running_default: true,
                  staging_default: true,
                  spaces_url: '/v2/security_groups/60ad6339-baae-416a-bc15-65f2de203fc6/spaces',
                  staging_spaces_url: '/v2/security_groups/60ad6339-baae-416a-bc15-65f2de203fc6/staging_spaces'
                }
              }
            ],
            staging_security_groups_url: '/v2/spaces/aa775168-7be8-4006-81e5-647d59f8ee22/staging_security_groups',
            staging_security_groups: [
              {
                metadata: {
                  guid: '882d01f9-f95f-49f7-b36d-167363b04ef8',
                  url: '/v2/security_groups/882d01f9-f95f-49f7-b36d-167363b04ef8',
                  created_at: '2017-09-22T15:25:53Z',
                  updated_at: '2017-09-22T15:25:53Z'
                },
                entity: {
                  name: 'public_networks',
                  rules: [
                    {
                      destination: '0.0.0.0-9.255.255.255',
                      protocol: 'all'
                    },
                    {
                      destination: '11.0.0.0-169.253.255.255',
                      protocol: 'all'
                    },
                    {
                      destination: '169.255.0.0-172.15.255.255',
                      protocol: 'all'
                    },
                    {
                      destination: '172.32.0.0-192.167.255.255',
                      protocol: 'all'
                    },
                    {
                      destination: '192.169.0.0-255.255.255.255',
                      protocol: 'all'
                    }
                  ],
                  running_default: true,
                  staging_default: true,
                  spaces_url: '/v2/security_groups/882d01f9-f95f-49f7-b36d-167363b04ef8/spaces',
                  staging_spaces_url: '/v2/security_groups/882d01f9-f95f-49f7-b36d-167363b04ef8/staging_spaces'
                }
              },
              {
                metadata: {
                  guid: '1a0f5ef8-addc-49a8-b107-fbd290575124',
                  url: '/v2/security_groups/1a0f5ef8-addc-49a8-b107-fbd290575124',
                  created_at: '2017-09-22T15:25:53Z',
                  updated_at: '2017-09-22T15:25:53Z'
                },
                entity: {
                  name: 'dns',
                  rules: [
                    {
                      destination: '0.0.0.0/0',
                      ports: '53',
                      protocol: 'tcp'
                    },
                    {
                      destination: '0.0.0.0/0',
                      ports: '53',
                      protocol: 'udp'
                    }
                  ],
                  running_default: true,
                  staging_default: true,
                  spaces_url: '/v2/security_groups/1a0f5ef8-addc-49a8-b107-fbd290575124/spaces',
                  staging_spaces_url: '/v2/security_groups/1a0f5ef8-addc-49a8-b107-fbd290575124/staging_spaces'
                }
              },
              {
                metadata: {
                  guid: '60ad6339-baae-416a-bc15-65f2de203fc6',
                  url: '/v2/security_groups/60ad6339-baae-416a-bc15-65f2de203fc6',
                  created_at: '2017-09-22T15:29:01Z',
                  updated_at: '2017-09-22T15:29:02Z'
                },
                entity: {
                  name: 'dev-mysql',
                  rules: [
                    {
                      destination: '10.0.0.17',
                      ports: '3306',
                      protocol: 'tcp'
                    }
                  ],
                  running_default: true,
                  staging_default: true,
                  spaces_url: '/v2/security_groups/60ad6339-baae-416a-bc15-65f2de203fc6/spaces',
                  staging_spaces_url: '/v2/security_groups/60ad6339-baae-416a-bc15-65f2de203fc6/staging_spaces'
                }
              }
            ]
          }
        },
        'd91c3bf0-3ab0-4372-8b08-75de137eeaf8': {
          metadata: {
            guid: 'd91c3bf0-3ab0-4372-8b08-75de137eeaf8',
            url: '/v2/spaces/d91c3bf0-3ab0-4372-8b08-75de137eeaf8',
            created_at: '2017-09-22T15:38:44Z',
            updated_at: '2017-09-22T15:38:44Z'
          },
          entity: {
            name: 'susecon',
            organization_guid: '94ce3787-757b-4eac-91c6-8f1705a178ba',
            space_quota_definition_guid: null,
            isolation_segment_guid: null,
            allow_ssh: true,
            organization_url: '/v2/organizations/94ce3787-757b-4eac-91c6-8f1705a178ba',
            organization: {
              metadata: {
                guid: '94ce3787-757b-4eac-91c6-8f1705a178ba',
                url: '/v2/organizations/94ce3787-757b-4eac-91c6-8f1705a178ba',
                created_at: '2017-09-22T15:25:53Z',
                updated_at: '2017-09-22T15:25:53Z'
              },
              entity: {
                name: 'system',
                billing_enabled: false,
                quota_definition_guid: '5fcd846b-7eb3-410e-ba15-35634d723ca7',
                status: 'active',
                default_isolation_segment_guid: null,
                quota_definition_url: '/v2/quota_definitions/5fcd846b-7eb3-410e-ba15-35634d723ca7',
                spaces_url: '/v2/organizations/94ce3787-757b-4eac-91c6-8f1705a178ba/spaces',
                domains_url: '/v2/organizations/94ce3787-757b-4eac-91c6-8f1705a178ba/domains',
                private_domains_url: '/v2/organizations/94ce3787-757b-4eac-91c6-8f1705a178ba/private_domains',
                users_url: '/v2/organizations/94ce3787-757b-4eac-91c6-8f1705a178ba/users',
                managers_url: '/v2/organizations/94ce3787-757b-4eac-91c6-8f1705a178ba/managers',
                billing_managers_url: '/v2/organizations/94ce3787-757b-4eac-91c6-8f1705a178ba/billing_managers',
                auditors_url: '/v2/organizations/94ce3787-757b-4eac-91c6-8f1705a178ba/auditors',
                app_events_url: '/v2/organizations/94ce3787-757b-4eac-91c6-8f1705a178ba/app_events',
                space_quota_definitions_url: '/v2/organizations/94ce3787-757b-4eac-91c6-8f1705a178ba/space_quota_definitions'
              }
            },
            developers_url: '/v2/spaces/d91c3bf0-3ab0-4372-8b08-75de137eeaf8/developers',
            developers: [
              {
                metadata: {
                  guid: 'b2a8ed5c-5c63-4b5b-bdf8-04ea66a9db00',
                  url: '/v2/users/b2a8ed5c-5c63-4b5b-bdf8-04ea66a9db00',
                  created_at: '2017-09-22T15:27:32Z',
                  updated_at: '2017-09-22T15:27:32Z'
                },
                entity: {
                  admin: false,
                  active: true,
                  default_space_guid: null,
                  spaces_url: '/v2/users/b2a8ed5c-5c63-4b5b-bdf8-04ea66a9db00/spaces',
                  organizations_url: '/v2/users/b2a8ed5c-5c63-4b5b-bdf8-04ea66a9db00/organizations',
                  managed_organizations_url: '/v2/users/b2a8ed5c-5c63-4b5b-bdf8-04ea66a9db00/managed_organizations',
                  billing_managed_organizations_url: '/v2/users/b2a8ed5c-5c63-4b5b-bdf8-04ea66a9db00/billing_managed_organizations',
                  audited_organizations_url: '/v2/users/b2a8ed5c-5c63-4b5b-bdf8-04ea66a9db00/audited_organizations',
                  managed_spaces_url: '/v2/users/b2a8ed5c-5c63-4b5b-bdf8-04ea66a9db00/managed_spaces',
                  audited_spaces_url: '/v2/users/b2a8ed5c-5c63-4b5b-bdf8-04ea66a9db00/audited_spaces'
                }
              }
            ],
            managers_url: '/v2/spaces/d91c3bf0-3ab0-4372-8b08-75de137eeaf8/managers',
            managers: [
              {
                metadata: {
                  guid: 'b2a8ed5c-5c63-4b5b-bdf8-04ea66a9db00',
                  url: '/v2/users/b2a8ed5c-5c63-4b5b-bdf8-04ea66a9db00',
                  created_at: '2017-09-22T15:27:32Z',
                  updated_at: '2017-09-22T15:27:32Z'
                },
                entity: {
                  admin: false,
                  active: true,
                  default_space_guid: null,
                  spaces_url: '/v2/users/b2a8ed5c-5c63-4b5b-bdf8-04ea66a9db00/spaces',
                  organizations_url: '/v2/users/b2a8ed5c-5c63-4b5b-bdf8-04ea66a9db00/organizations',
                  managed_organizations_url: '/v2/users/b2a8ed5c-5c63-4b5b-bdf8-04ea66a9db00/managed_organizations',
                  billing_managed_organizations_url: '/v2/users/b2a8ed5c-5c63-4b5b-bdf8-04ea66a9db00/billing_managed_organizations',
                  audited_organizations_url: '/v2/users/b2a8ed5c-5c63-4b5b-bdf8-04ea66a9db00/audited_organizations',
                  managed_spaces_url: '/v2/users/b2a8ed5c-5c63-4b5b-bdf8-04ea66a9db00/managed_spaces',
                  audited_spaces_url: '/v2/users/b2a8ed5c-5c63-4b5b-bdf8-04ea66a9db00/audited_spaces'
                }
              }
            ],
            auditors_url: '/v2/spaces/d91c3bf0-3ab0-4372-8b08-75de137eeaf8/auditors',
            auditors: [],
            apps_url: '/v2/spaces/d91c3bf0-3ab0-4372-8b08-75de137eeaf8/apps',
            routes_url: '/v2/spaces/d91c3bf0-3ab0-4372-8b08-75de137eeaf8/routes',
            routes: [
              {
                metadata: {
                  guid: 'd117f186-062f-47a3-8b5f-63af20ab318b',
                  url: '/v2/routes/d117f186-062f-47a3-8b5f-63af20ab318b',
                  created_at: '2017-09-25T13:39:10Z',
                  updated_at: '2017-09-25T13:39:10Z'
                },
                entity: {
                  host: 'empty',
                  path: '',
                  domain_guid: '44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  space_guid: 'd91c3bf0-3ab0-4372-8b08-75de137eeaf8',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  space_url: '/v2/spaces/d91c3bf0-3ab0-4372-8b08-75de137eeaf8',
                  apps_url: '/v2/routes/d117f186-062f-47a3-8b5f-63af20ab318b/apps',
                  route_mappings_url: '/v2/routes/d117f186-062f-47a3-8b5f-63af20ab318b/route_mappings'
                }
              },
              {
                metadata: {
                  guid: '11f5c52e-5aa4-4afb-9dd3-cc5e10de5d7a',
                  url: '/v2/routes/11f5c52e-5aa4-4afb-9dd3-cc5e10de5d7a',
                  created_at: '2017-10-02T09:47:46Z',
                  updated_at: '2017-10-02T09:47:46Z'
                },
                entity: {
                  host: 'TestNathan123',
                  path: '',
                  domain_guid: '44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  space_guid: 'd91c3bf0-3ab0-4372-8b08-75de137eeaf8',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  space_url: '/v2/spaces/d91c3bf0-3ab0-4372-8b08-75de137eeaf8',
                  apps_url: '/v2/routes/11f5c52e-5aa4-4afb-9dd3-cc5e10de5d7a/apps',
                  route_mappings_url: '/v2/routes/11f5c52e-5aa4-4afb-9dd3-cc5e10de5d7a/route_mappings'
                }
              },
              {
                metadata: {
                  guid: 'dfccdc77-a31f-428f-9c89-eee6786df0c7',
                  url: '/v2/routes/dfccdc77-a31f-428f-9c89-eee6786df0c7',
                  created_at: '2017-10-05T10:10:33Z',
                  updated_at: '2017-10-05T10:10:33Z'
                },
                entity: {
                  host: 'console',
                  path: '',
                  domain_guid: '44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  space_guid: 'd91c3bf0-3ab0-4372-8b08-75de137eeaf8',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  space_url: '/v2/spaces/d91c3bf0-3ab0-4372-8b08-75de137eeaf8',
                  apps_url: '/v2/routes/dfccdc77-a31f-428f-9c89-eee6786df0c7/apps',
                  route_mappings_url: '/v2/routes/dfccdc77-a31f-428f-9c89-eee6786df0c7/route_mappings'
                }
              },
              {
                metadata: {
                  guid: 'f5124941-7712-4432-8e51-27a64673c108',
                  url: '/v2/routes/f5124941-7712-4432-8e51-27a64673c108',
                  created_at: '2017-10-06T10:09:13Z',
                  updated_at: '2017-10-06T10:09:13Z'
                },
                entity: {
                  host: 'cf-demo-app',
                  path: '',
                  domain_guid: '44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  space_guid: 'd91c3bf0-3ab0-4372-8b08-75de137eeaf8',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  space_url: '/v2/spaces/d91c3bf0-3ab0-4372-8b08-75de137eeaf8',
                  apps_url: '/v2/routes/f5124941-7712-4432-8e51-27a64673c108/apps',
                  route_mappings_url: '/v2/routes/f5124941-7712-4432-8e51-27a64673c108/route_mappings'
                }
              }
            ],
            domains_url: '/v2/spaces/d91c3bf0-3ab0-4372-8b08-75de137eeaf8/domains',
            domains: [
              {
                metadata: {
                  guid: '44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  url: '/v2/shared_domains/44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  created_at: '2017-09-22T15:25:53Z',
                  updated_at: '2017-09-22T15:25:53Z'
                },
                entity: {
                  name: 'capbristol.com',
                  router_group_guid: null,
                  router_group_type: null
                }
              }
            ],
            service_instances_url: '/v2/spaces/d91c3bf0-3ab0-4372-8b08-75de137eeaf8/service_instances',
            service_instances: [
              {
                metadata: {
                  guid: 'efba4df9-d803-45e2-8ff4-02a1449732d9',
                  url: '/v2/service_instances/efba4df9-d803-45e2-8ff4-02a1449732d9',
                  created_at: '2017-10-09T15:27:27Z',
                  updated_at: '2017-10-09T15:27:27Z'
                },
                entity: {
                  name: 'console_db',
                  credentials: {},
                  service_plan_guid: '9364d296-2cba-4883-a47f-f152fc1bc0ac',
                  space_guid: 'd91c3bf0-3ab0-4372-8b08-75de137eeaf8',
                  gateway_data: null,
                  dashboard_url: 'https://capbristol.com/manage/instances/efba4df9-d803-45e2-8ff4-02a1449732d9',
                  type: 'managed_service_instance',
                  last_operation: {
                    type: 'create',
                    state: 'succeeded',
                    description: '',
                    updated_at: '2017-10-09T15:27:27Z',
                    created_at: '2017-10-09T15:27:27Z'
                  },
                  tags: [],
                  service_guid: '6ee3d1bf-df07-4e80-bacf-6adc3b72e4db',
                  space_url: '/v2/spaces/d91c3bf0-3ab0-4372-8b08-75de137eeaf8',
                  service_plan_url: '/v2/service_plans/9364d296-2cba-4883-a47f-f152fc1bc0ac',
                  service_bindings_url: '/v2/service_instances/efba4df9-d803-45e2-8ff4-02a1449732d9/service_bindings',
                  service_keys_url: '/v2/service_instances/efba4df9-d803-45e2-8ff4-02a1449732d9/service_keys',
                  routes_url: '/v2/service_instances/efba4df9-d803-45e2-8ff4-02a1449732d9/routes',
                  service_url: '/v2/services/6ee3d1bf-df07-4e80-bacf-6adc3b72e4db'
                }
              },
              {
                metadata: {
                  guid: '1fa391a4-c744-42fa-b96a-9eecbb474a94',
                  url: '/v2/service_instances/1fa391a4-c744-42fa-b96a-9eecbb474a94',
                  created_at: '2017-10-09T15:27:49Z',
                  updated_at: '2017-10-09T15:27:49Z'
                },
                entity: {
                  name: 'CONSOLE',
                  credentials: {},
                  service_plan_guid: '9364d296-2cba-4883-a47f-f152fc1bc0ac',
                  space_guid: 'd91c3bf0-3ab0-4372-8b08-75de137eeaf8',
                  gateway_data: null,
                  dashboard_url: 'https://capbristol.com/manage/instances/1fa391a4-c744-42fa-b96a-9eecbb474a94',
                  type: 'managed_service_instance',
                  last_operation: {
                    type: 'create',
                    state: 'succeeded',
                    description: '',
                    updated_at: '2017-10-09T15:27:49Z',
                    created_at: '2017-10-09T15:27:49Z'
                  },
                  tags: [
                    'stratos_mysql'
                  ],
                  service_guid: '6ee3d1bf-df07-4e80-bacf-6adc3b72e4db',
                  space_url: '/v2/spaces/d91c3bf0-3ab0-4372-8b08-75de137eeaf8',
                  service_plan_url: '/v2/service_plans/9364d296-2cba-4883-a47f-f152fc1bc0ac',
                  service_bindings_url: '/v2/service_instances/1fa391a4-c744-42fa-b96a-9eecbb474a94/service_bindings',
                  service_keys_url: '/v2/service_instances/1fa391a4-c744-42fa-b96a-9eecbb474a94/service_keys',
                  routes_url: '/v2/service_instances/1fa391a4-c744-42fa-b96a-9eecbb474a94/routes',
                  service_url: '/v2/services/6ee3d1bf-df07-4e80-bacf-6adc3b72e4db'
                }
              }
            ],
            app_events_url: '/v2/spaces/d91c3bf0-3ab0-4372-8b08-75de137eeaf8/app_events',
            events_url: '/v2/spaces/d91c3bf0-3ab0-4372-8b08-75de137eeaf8/events',
            security_groups_url: '/v2/spaces/d91c3bf0-3ab0-4372-8b08-75de137eeaf8/security_groups',
            security_groups: [
              {
                metadata: {
                  guid: '882d01f9-f95f-49f7-b36d-167363b04ef8',
                  url: '/v2/security_groups/882d01f9-f95f-49f7-b36d-167363b04ef8',
                  created_at: '2017-09-22T15:25:53Z',
                  updated_at: '2017-09-22T15:25:53Z'
                },
                entity: {
                  name: 'public_networks',
                  rules: [
                    {
                      destination: '0.0.0.0-9.255.255.255',
                      protocol: 'all'
                    },
                    {
                      destination: '11.0.0.0-169.253.255.255',
                      protocol: 'all'
                    },
                    {
                      destination: '169.255.0.0-172.15.255.255',
                      protocol: 'all'
                    },
                    {
                      destination: '172.32.0.0-192.167.255.255',
                      protocol: 'all'
                    },
                    {
                      destination: '192.169.0.0-255.255.255.255',
                      protocol: 'all'
                    }
                  ],
                  running_default: true,
                  staging_default: true,
                  spaces_url: '/v2/security_groups/882d01f9-f95f-49f7-b36d-167363b04ef8/spaces',
                  staging_spaces_url: '/v2/security_groups/882d01f9-f95f-49f7-b36d-167363b04ef8/staging_spaces'
                }
              },
              {
                metadata: {
                  guid: '1a0f5ef8-addc-49a8-b107-fbd290575124',
                  url: '/v2/security_groups/1a0f5ef8-addc-49a8-b107-fbd290575124',
                  created_at: '2017-09-22T15:25:53Z',
                  updated_at: '2017-09-22T15:25:53Z'
                },
                entity: {
                  name: 'dns',
                  rules: [
                    {
                      destination: '0.0.0.0/0',
                      ports: '53',
                      protocol: 'tcp'
                    },
                    {
                      destination: '0.0.0.0/0',
                      ports: '53',
                      protocol: 'udp'
                    }
                  ],
                  running_default: true,
                  staging_default: true,
                  spaces_url: '/v2/security_groups/1a0f5ef8-addc-49a8-b107-fbd290575124/spaces',
                  staging_spaces_url: '/v2/security_groups/1a0f5ef8-addc-49a8-b107-fbd290575124/staging_spaces'
                }
              },
              {
                metadata: {
                  guid: '60ad6339-baae-416a-bc15-65f2de203fc6',
                  url: '/v2/security_groups/60ad6339-baae-416a-bc15-65f2de203fc6',
                  created_at: '2017-09-22T15:29:01Z',
                  updated_at: '2017-09-22T15:29:02Z'
                },
                entity: {
                  name: 'dev-mysql',
                  rules: [
                    {
                      destination: '10.0.0.17',
                      ports: '3306',
                      protocol: 'tcp'
                    }
                  ],
                  running_default: true,
                  staging_default: true,
                  spaces_url: '/v2/security_groups/60ad6339-baae-416a-bc15-65f2de203fc6/spaces',
                  staging_spaces_url: '/v2/security_groups/60ad6339-baae-416a-bc15-65f2de203fc6/staging_spaces'
                }
              }
            ],
            staging_security_groups_url: '/v2/spaces/d91c3bf0-3ab0-4372-8b08-75de137eeaf8/staging_security_groups',
            staging_security_groups: [
              {
                metadata: {
                  guid: '882d01f9-f95f-49f7-b36d-167363b04ef8',
                  url: '/v2/security_groups/882d01f9-f95f-49f7-b36d-167363b04ef8',
                  created_at: '2017-09-22T15:25:53Z',
                  updated_at: '2017-09-22T15:25:53Z'
                },
                entity: {
                  name: 'public_networks',
                  rules: [
                    {
                      destination: '0.0.0.0-9.255.255.255',
                      protocol: 'all'
                    },
                    {
                      destination: '11.0.0.0-169.253.255.255',
                      protocol: 'all'
                    },
                    {
                      destination: '169.255.0.0-172.15.255.255',
                      protocol: 'all'
                    },
                    {
                      destination: '172.32.0.0-192.167.255.255',
                      protocol: 'all'
                    },
                    {
                      destination: '192.169.0.0-255.255.255.255',
                      protocol: 'all'
                    }
                  ],
                  running_default: true,
                  staging_default: true,
                  spaces_url: '/v2/security_groups/882d01f9-f95f-49f7-b36d-167363b04ef8/spaces',
                  staging_spaces_url: '/v2/security_groups/882d01f9-f95f-49f7-b36d-167363b04ef8/staging_spaces'
                }
              },
              {
                metadata: {
                  guid: '1a0f5ef8-addc-49a8-b107-fbd290575124',
                  url: '/v2/security_groups/1a0f5ef8-addc-49a8-b107-fbd290575124',
                  created_at: '2017-09-22T15:25:53Z',
                  updated_at: '2017-09-22T15:25:53Z'
                },
                entity: {
                  name: 'dns',
                  rules: [
                    {
                      destination: '0.0.0.0/0',
                      ports: '53',
                      protocol: 'tcp'
                    },
                    {
                      destination: '0.0.0.0/0',
                      ports: '53',
                      protocol: 'udp'
                    }
                  ],
                  running_default: true,
                  staging_default: true,
                  spaces_url: '/v2/security_groups/1a0f5ef8-addc-49a8-b107-fbd290575124/spaces',
                  staging_spaces_url: '/v2/security_groups/1a0f5ef8-addc-49a8-b107-fbd290575124/staging_spaces'
                }
              },
              {
                metadata: {
                  guid: '60ad6339-baae-416a-bc15-65f2de203fc6',
                  url: '/v2/security_groups/60ad6339-baae-416a-bc15-65f2de203fc6',
                  created_at: '2017-09-22T15:29:01Z',
                  updated_at: '2017-09-22T15:29:02Z'
                },
                entity: {
                  name: 'dev-mysql',
                  rules: [
                    {
                      destination: '10.0.0.17',
                      ports: '3306',
                      protocol: 'tcp'
                    }
                  ],
                  running_default: true,
                  staging_default: true,
                  spaces_url: '/v2/security_groups/60ad6339-baae-416a-bc15-65f2de203fc6/spaces',
                  staging_spaces_url: '/v2/security_groups/60ad6339-baae-416a-bc15-65f2de203fc6/staging_spaces'
                }
              }
            ]
          }
        },
        'a01435cd-3468-44de-9f0c-242afdd4ef36': {
          metadata: {
            guid: 'a01435cd-3468-44de-9f0c-242afdd4ef36',
            url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36',
            created_at: '2017-09-22T15:27:48Z',
            updated_at: '2017-09-22T15:27:48Z'
          },
          entity: {
            name: 'e2e',
            organization_guid: '22feecef-df39-4ae0-a56a-098cbe09ec0d',
            space_quota_definition_guid: null,
            isolation_segment_guid: null,
            allow_ssh: true,
            organization_url: '/v2/organizations/22feecef-df39-4ae0-a56a-098cbe09ec0d',
            organization: {
              metadata: {
                guid: '22feecef-df39-4ae0-a56a-098cbe09ec0d',
                url: '/v2/organizations/22feecef-df39-4ae0-a56a-098cbe09ec0d',
                created_at: '2017-09-22T15:27:35Z',
                updated_at: '2017-09-22T15:27:35Z'
              },
              entity: {
                name: 'e2e',
                billing_enabled: false,
                quota_definition_guid: '5fcd846b-7eb3-410e-ba15-35634d723ca7',
                status: 'active',
                default_isolation_segment_guid: null,
                quota_definition_url: '/v2/quota_definitions/5fcd846b-7eb3-410e-ba15-35634d723ca7',
                spaces_url: '/v2/organizations/22feecef-df39-4ae0-a56a-098cbe09ec0d/spaces',
                domains_url: '/v2/organizations/22feecef-df39-4ae0-a56a-098cbe09ec0d/domains',
                private_domains_url: '/v2/organizations/22feecef-df39-4ae0-a56a-098cbe09ec0d/private_domains',
                users_url: '/v2/organizations/22feecef-df39-4ae0-a56a-098cbe09ec0d/users',
                managers_url: '/v2/organizations/22feecef-df39-4ae0-a56a-098cbe09ec0d/managers',
                billing_managers_url: '/v2/organizations/22feecef-df39-4ae0-a56a-098cbe09ec0d/billing_managers',
                auditors_url: '/v2/organizations/22feecef-df39-4ae0-a56a-098cbe09ec0d/auditors',
                app_events_url: '/v2/organizations/22feecef-df39-4ae0-a56a-098cbe09ec0d/app_events',
                space_quota_definitions_url: '/v2/organizations/22feecef-df39-4ae0-a56a-098cbe09ec0d/space_quota_definitions'
              }
            },
            developers_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/developers',
            developers: [
              {
                metadata: {
                  guid: 'b2a8ed5c-5c63-4b5b-bdf8-04ea66a9db00',
                  url: '/v2/users/b2a8ed5c-5c63-4b5b-bdf8-04ea66a9db00',
                  created_at: '2017-09-22T15:27:32Z',
                  updated_at: '2017-09-22T15:27:32Z'
                },
                entity: {
                  admin: false,
                  active: true,
                  default_space_guid: null,
                  spaces_url: '/v2/users/b2a8ed5c-5c63-4b5b-bdf8-04ea66a9db00/spaces',
                  organizations_url: '/v2/users/b2a8ed5c-5c63-4b5b-bdf8-04ea66a9db00/organizations',
                  managed_organizations_url: '/v2/users/b2a8ed5c-5c63-4b5b-bdf8-04ea66a9db00/managed_organizations',
                  billing_managed_organizations_url: '/v2/users/b2a8ed5c-5c63-4b5b-bdf8-04ea66a9db00/billing_managed_organizations',
                  audited_organizations_url: '/v2/users/b2a8ed5c-5c63-4b5b-bdf8-04ea66a9db00/audited_organizations',
                  managed_spaces_url: '/v2/users/b2a8ed5c-5c63-4b5b-bdf8-04ea66a9db00/managed_spaces',
                  audited_spaces_url: '/v2/users/b2a8ed5c-5c63-4b5b-bdf8-04ea66a9db00/audited_spaces'
                }
              },
              {
                metadata: {
                  guid: '35558344-b233-43ce-a67e-3a0ef230e59d',
                  url: '/v2/users/35558344-b233-43ce-a67e-3a0ef230e59d',
                  created_at: '2017-09-22T15:28:00Z',
                  updated_at: '2017-09-22T15:28:00Z'
                },
                entity: {
                  admin: false,
                  active: false,
                  default_space_guid: null,
                  spaces_url: '/v2/users/35558344-b233-43ce-a67e-3a0ef230e59d/spaces',
                  organizations_url: '/v2/users/35558344-b233-43ce-a67e-3a0ef230e59d/organizations',
                  managed_organizations_url: '/v2/users/35558344-b233-43ce-a67e-3a0ef230e59d/managed_organizations',
                  billing_managed_organizations_url: '/v2/users/35558344-b233-43ce-a67e-3a0ef230e59d/billing_managed_organizations',
                  audited_organizations_url: '/v2/users/35558344-b233-43ce-a67e-3a0ef230e59d/audited_organizations',
                  managed_spaces_url: '/v2/users/35558344-b233-43ce-a67e-3a0ef230e59d/managed_spaces',
                  audited_spaces_url: '/v2/users/35558344-b233-43ce-a67e-3a0ef230e59d/audited_spaces'
                }
              }
            ],
            managers_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/managers',
            managers: [
              {
                metadata: {
                  guid: 'b2a8ed5c-5c63-4b5b-bdf8-04ea66a9db00',
                  url: '/v2/users/b2a8ed5c-5c63-4b5b-bdf8-04ea66a9db00',
                  created_at: '2017-09-22T15:27:32Z',
                  updated_at: '2017-09-22T15:27:32Z'
                },
                entity: {
                  admin: false,
                  active: true,
                  default_space_guid: null,
                  spaces_url: '/v2/users/b2a8ed5c-5c63-4b5b-bdf8-04ea66a9db00/spaces',
                  organizations_url: '/v2/users/b2a8ed5c-5c63-4b5b-bdf8-04ea66a9db00/organizations',
                  managed_organizations_url: '/v2/users/b2a8ed5c-5c63-4b5b-bdf8-04ea66a9db00/managed_organizations',
                  billing_managed_organizations_url: '/v2/users/b2a8ed5c-5c63-4b5b-bdf8-04ea66a9db00/billing_managed_organizations',
                  audited_organizations_url: '/v2/users/b2a8ed5c-5c63-4b5b-bdf8-04ea66a9db00/audited_organizations',
                  managed_spaces_url: '/v2/users/b2a8ed5c-5c63-4b5b-bdf8-04ea66a9db00/managed_spaces',
                  audited_spaces_url: '/v2/users/b2a8ed5c-5c63-4b5b-bdf8-04ea66a9db00/audited_spaces'
                }
              }
            ],
            auditors_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/auditors',
            auditors: [],
            apps_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/apps',
            routes_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/routes',
            domains_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/domains',
            domains: [
              {
                metadata: {
                  guid: '44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  url: '/v2/shared_domains/44e7881e-3a21-41b2-bb6d-1a2b0996731c',
                  created_at: '2017-09-22T15:25:53Z',
                  updated_at: '2017-09-22T15:25:53Z'
                },
                entity: {
                  name: 'capbristol.com',
                  router_group_guid: null,
                  router_group_type: null
                }
              }
            ],
            service_instances_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/service_instances',
            service_instances: [],
            app_events_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/app_events',
            events_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/events',
            security_groups_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/security_groups',
            security_groups: [
              {
                metadata: {
                  guid: '882d01f9-f95f-49f7-b36d-167363b04ef8',
                  url: '/v2/security_groups/882d01f9-f95f-49f7-b36d-167363b04ef8',
                  created_at: '2017-09-22T15:25:53Z',
                  updated_at: '2017-09-22T15:25:53Z'
                },
                entity: {
                  name: 'public_networks',
                  rules: [
                    {
                      destination: '0.0.0.0-9.255.255.255',
                      protocol: 'all'
                    },
                    {
                      destination: '11.0.0.0-169.253.255.255',
                      protocol: 'all'
                    },
                    {
                      destination: '169.255.0.0-172.15.255.255',
                      protocol: 'all'
                    },
                    {
                      destination: '172.32.0.0-192.167.255.255',
                      protocol: 'all'
                    },
                    {
                      destination: '192.169.0.0-255.255.255.255',
                      protocol: 'all'
                    }
                  ],
                  running_default: true,
                  staging_default: true,
                  spaces_url: '/v2/security_groups/882d01f9-f95f-49f7-b36d-167363b04ef8/spaces',
                  staging_spaces_url: '/v2/security_groups/882d01f9-f95f-49f7-b36d-167363b04ef8/staging_spaces'
                }
              },
              {
                metadata: {
                  guid: '1a0f5ef8-addc-49a8-b107-fbd290575124',
                  url: '/v2/security_groups/1a0f5ef8-addc-49a8-b107-fbd290575124',
                  created_at: '2017-09-22T15:25:53Z',
                  updated_at: '2017-09-22T15:25:53Z'
                },
                entity: {
                  name: 'dns',
                  rules: [
                    {
                      destination: '0.0.0.0/0',
                      ports: '53',
                      protocol: 'tcp'
                    },
                    {
                      destination: '0.0.0.0/0',
                      ports: '53',
                      protocol: 'udp'
                    }
                  ],
                  running_default: true,
                  staging_default: true,
                  spaces_url: '/v2/security_groups/1a0f5ef8-addc-49a8-b107-fbd290575124/spaces',
                  staging_spaces_url: '/v2/security_groups/1a0f5ef8-addc-49a8-b107-fbd290575124/staging_spaces'
                }
              },
              {
                metadata: {
                  guid: '60ad6339-baae-416a-bc15-65f2de203fc6',
                  url: '/v2/security_groups/60ad6339-baae-416a-bc15-65f2de203fc6',
                  created_at: '2017-09-22T15:29:01Z',
                  updated_at: '2017-09-22T15:29:02Z'
                },
                entity: {
                  name: 'dev-mysql',
                  rules: [
                    {
                      destination: '10.0.0.17',
                      ports: '3306',
                      protocol: 'tcp'
                    }
                  ],
                  running_default: true,
                  staging_default: true,
                  spaces_url: '/v2/security_groups/60ad6339-baae-416a-bc15-65f2de203fc6/spaces',
                  staging_spaces_url: '/v2/security_groups/60ad6339-baae-416a-bc15-65f2de203fc6/staging_spaces'
                }
              }
            ],
            staging_security_groups_url: '/v2/spaces/a01435cd-3468-44de-9f0c-242afdd4ef36/staging_security_groups',
            staging_security_groups: [
              {
                metadata: {
                  guid: '882d01f9-f95f-49f7-b36d-167363b04ef8',
                  url: '/v2/security_groups/882d01f9-f95f-49f7-b36d-167363b04ef8',
                  created_at: '2017-09-22T15:25:53Z',
                  updated_at: '2017-09-22T15:25:53Z'
                },
                entity: {
                  name: 'public_networks',
                  rules: [
                    {
                      destination: '0.0.0.0-9.255.255.255',
                      protocol: 'all'
                    },
                    {
                      destination: '11.0.0.0-169.253.255.255',
                      protocol: 'all'
                    },
                    {
                      destination: '169.255.0.0-172.15.255.255',
                      protocol: 'all'
                    },
                    {
                      destination: '172.32.0.0-192.167.255.255',
                      protocol: 'all'
                    },
                    {
                      destination: '192.169.0.0-255.255.255.255',
                      protocol: 'all'
                    }
                  ],
                  running_default: true,
                  staging_default: true,
                  spaces_url: '/v2/security_groups/882d01f9-f95f-49f7-b36d-167363b04ef8/spaces',
                  staging_spaces_url: '/v2/security_groups/882d01f9-f95f-49f7-b36d-167363b04ef8/staging_spaces'
                }
              },
              {
                metadata: {
                  guid: '1a0f5ef8-addc-49a8-b107-fbd290575124',
                  url: '/v2/security_groups/1a0f5ef8-addc-49a8-b107-fbd290575124',
                  created_at: '2017-09-22T15:25:53Z',
                  updated_at: '2017-09-22T15:25:53Z'
                },
                entity: {
                  name: 'dns',
                  rules: [
                    {
                      destination: '0.0.0.0/0',
                      ports: '53',
                      protocol: 'tcp'
                    },
                    {
                      destination: '0.0.0.0/0',
                      ports: '53',
                      protocol: 'udp'
                    }
                  ],
                  running_default: true,
                  staging_default: true,
                  spaces_url: '/v2/security_groups/1a0f5ef8-addc-49a8-b107-fbd290575124/spaces',
                  staging_spaces_url: '/v2/security_groups/1a0f5ef8-addc-49a8-b107-fbd290575124/staging_spaces'
                }
              },
              {
                metadata: {
                  guid: '60ad6339-baae-416a-bc15-65f2de203fc6',
                  url: '/v2/security_groups/60ad6339-baae-416a-bc15-65f2de203fc6',
                  created_at: '2017-09-22T15:29:01Z',
                  updated_at: '2017-09-22T15:29:02Z'
                },
                entity: {
                  name: 'dev-mysql',
                  rules: [
                    {
                      destination: '10.0.0.17',
                      ports: '3306',
                      protocol: 'tcp'
                    }
                  ],
                  running_default: true,
                  staging_default: true,
                  spaces_url: '/v2/security_groups/60ad6339-baae-416a-bc15-65f2de203fc6/spaces',
                  staging_spaces_url: '/v2/security_groups/60ad6339-baae-416a-bc15-65f2de203fc6/staging_spaces'
                }
              }
            ]
          }
        },
        '8da86308-f3e6-4196-b5e7-b03865b973d3': {
          metadata: {
            guid: '8da86308-f3e6-4196-b5e7-b03865b973d3',
            url: '/v2/spaces/8da86308-f3e6-4196-b5e7-b03865b973d3',
            created_at: '2017-06-09T12:40:41Z',
            updated_at: '2017-07-04T09:56:21Z'
          },
          entity: {
            name: 'dev',
            organization_guid: '145a99e5-3728-4f71-b750-56f074dd32b8',
            space_quota_definition_guid: null,
            isolation_segment_guid: null,
            allow_ssh: true,
            organization_url: '/v2/organizations/145a99e5-3728-4f71-b750-56f074dd32b8',
            organization: {
              metadata: {
                guid: '145a99e5-3728-4f71-b750-56f074dd32b8',
                url: '/v2/organizations/145a99e5-3728-4f71-b750-56f074dd32b8',
                created_at: '2017-06-09T12:40:30Z',
                updated_at: '2017-06-09T12:40:41Z'
              },
              entity: {
                name: 'P1942633594trial_trial',
                billing_enabled: false,
                quota_definition_guid: '57b092b7-3635-4b09-b5b9-459a23133cfd',
                status: 'active',
                default_isolation_segment_guid: null,
                quota_definition_url: '/v2/quota_definitions/57b092b7-3635-4b09-b5b9-459a23133cfd',
                spaces_url: '/v2/organizations/145a99e5-3728-4f71-b750-56f074dd32b8/spaces',
                domains_url: '/v2/organizations/145a99e5-3728-4f71-b750-56f074dd32b8/domains',
                private_domains_url: '/v2/organizations/145a99e5-3728-4f71-b750-56f074dd32b8/private_domains',
                users_url: '/v2/organizations/145a99e5-3728-4f71-b750-56f074dd32b8/users',
                managers_url: '/v2/organizations/145a99e5-3728-4f71-b750-56f074dd32b8/managers',
                billing_managers_url: '/v2/organizations/145a99e5-3728-4f71-b750-56f074dd32b8/billing_managers',
                auditors_url: '/v2/organizations/145a99e5-3728-4f71-b750-56f074dd32b8/auditors',
                app_events_url: '/v2/organizations/145a99e5-3728-4f71-b750-56f074dd32b8/app_events',
                space_quota_definitions_url: '/v2/organizations/145a99e5-3728-4f71-b750-56f074dd32b8/space_quota_definitions'
              }
            },
            developers_url: '/v2/spaces/8da86308-f3e6-4196-b5e7-b03865b973d3/developers',
            developers: [
              {
                metadata: {
                  guid: '7965e2cc-ef57-4373-bb0d-b45025355883',
                  url: '/v2/users/7965e2cc-ef57-4373-bb0d-b45025355883',
                  created_at: '2017-06-09T12:40:31Z',
                  updated_at: '2017-06-09T12:40:31Z'
                },
                entity: {
                  admin: false,
                  active: false,
                  default_space_guid: null,
                  spaces_url: '/v2/users/7965e2cc-ef57-4373-bb0d-b45025355883/spaces',
                  organizations_url: '/v2/users/7965e2cc-ef57-4373-bb0d-b45025355883/organizations',
                  managed_organizations_url: '/v2/users/7965e2cc-ef57-4373-bb0d-b45025355883/managed_organizations',
                  billing_managed_organizations_url: '/v2/users/7965e2cc-ef57-4373-bb0d-b45025355883/billing_managed_organizations',
                  audited_organizations_url: '/v2/users/7965e2cc-ef57-4373-bb0d-b45025355883/audited_organizations',
                  managed_spaces_url: '/v2/users/7965e2cc-ef57-4373-bb0d-b45025355883/managed_spaces',
                  audited_spaces_url: '/v2/users/7965e2cc-ef57-4373-bb0d-b45025355883/audited_spaces'
                }
              }
            ],
            managers_url: '/v2/spaces/8da86308-f3e6-4196-b5e7-b03865b973d3/managers',
            managers: [
              {
                metadata: {
                  guid: '7965e2cc-ef57-4373-bb0d-b45025355883',
                  url: '/v2/users/7965e2cc-ef57-4373-bb0d-b45025355883',
                  created_at: '2017-06-09T12:40:31Z',
                  updated_at: '2017-06-09T12:40:31Z'
                },
                entity: {
                  admin: false,
                  active: false,
                  default_space_guid: null,
                  spaces_url: '/v2/users/7965e2cc-ef57-4373-bb0d-b45025355883/spaces',
                  organizations_url: '/v2/users/7965e2cc-ef57-4373-bb0d-b45025355883/organizations',
                  managed_organizations_url: '/v2/users/7965e2cc-ef57-4373-bb0d-b45025355883/managed_organizations',
                  billing_managed_organizations_url: '/v2/users/7965e2cc-ef57-4373-bb0d-b45025355883/billing_managed_organizations',
                  audited_organizations_url: '/v2/users/7965e2cc-ef57-4373-bb0d-b45025355883/audited_organizations',
                  managed_spaces_url: '/v2/users/7965e2cc-ef57-4373-bb0d-b45025355883/managed_spaces',
                  audited_spaces_url: '/v2/users/7965e2cc-ef57-4373-bb0d-b45025355883/audited_spaces'
                }
              }
            ],
            auditors_url: '/v2/spaces/8da86308-f3e6-4196-b5e7-b03865b973d3/auditors',
            auditors: [],
            apps_url: '/v2/spaces/8da86308-f3e6-4196-b5e7-b03865b973d3/apps',
            routes_url: '/v2/spaces/8da86308-f3e6-4196-b5e7-b03865b973d3/routes',
            routes: [
              {
                metadata: {
                  guid: '3ed5ad7f-aab2-443c-980e-fdfe46de2c42',
                  url: '/v2/routes/3ed5ad7f-aab2-443c-980e-fdfe46de2c42',
                  created_at: '2017-07-11T10:11:20Z',
                  updated_at: '2017-07-11T10:11:20Z'
                },
                entity: {
                  host: 'd',
                  path: '',
                  domain_guid: '9762e24d-9761-40df-822f-16f1526ddbe7',
                  space_guid: '8da86308-f3e6-4196-b5e7-b03865b973d3',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/9762e24d-9761-40df-822f-16f1526ddbe7',
                  space_url: '/v2/spaces/8da86308-f3e6-4196-b5e7-b03865b973d3',
                  apps_url: '/v2/routes/3ed5ad7f-aab2-443c-980e-fdfe46de2c42/apps',
                  route_mappings_url: '/v2/routes/3ed5ad7f-aab2-443c-980e-fdfe46de2c42/route_mappings'
                }
              },
              {
                metadata: {
                  guid: '60468290-480b-4b5e-b6db-54fc1becea21',
                  url: '/v2/routes/60468290-480b-4b5e-b6db-54fc1becea21',
                  created_at: '2017-09-12T13:22:59Z',
                  updated_at: '2017-09-12T13:22:59Z'
                },
                entity: {
                  host: 'console3',
                  path: '',
                  domain_guid: '9762e24d-9761-40df-822f-16f1526ddbe7',
                  space_guid: '8da86308-f3e6-4196-b5e7-b03865b973d3',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/9762e24d-9761-40df-822f-16f1526ddbe7',
                  space_url: '/v2/spaces/8da86308-f3e6-4196-b5e7-b03865b973d3',
                  apps_url: '/v2/routes/60468290-480b-4b5e-b6db-54fc1becea21/apps',
                  route_mappings_url: '/v2/routes/60468290-480b-4b5e-b6db-54fc1becea21/route_mappings'
                }
              },
              {
                metadata: {
                  guid: 'd14cb912-01a7-4fef-bc6c-a220209b7ba1',
                  url: '/v2/routes/d14cb912-01a7-4fef-bc6c-a220209b7ba1',
                  created_at: '2017-10-02T10:04:12Z',
                  updated_at: '2017-10-02T10:04:12Z'
                },
                entity: {
                  host: 'suse-console',
                  path: '',
                  domain_guid: '9762e24d-9761-40df-822f-16f1526ddbe7',
                  space_guid: '8da86308-f3e6-4196-b5e7-b03865b973d3',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/9762e24d-9761-40df-822f-16f1526ddbe7',
                  space_url: '/v2/spaces/8da86308-f3e6-4196-b5e7-b03865b973d3',
                  apps_url: '/v2/routes/d14cb912-01a7-4fef-bc6c-a220209b7ba1/apps',
                  route_mappings_url: '/v2/routes/d14cb912-01a7-4fef-bc6c-a220209b7ba1/route_mappings'
                }
              },
              {
                metadata: {
                  guid: '3773ac42-dd79-4804-ba3f-fe1c13f288a5',
                  url: '/v2/routes/3773ac42-dd79-4804-ba3f-fe1c13f288a5',
                  created_at: '2017-09-21T15:09:02Z',
                  updated_at: '2017-09-21T15:09:02Z'
                },
                entity: {
                  host: 'nwm',
                  path: '',
                  domain_guid: '9762e24d-9761-40df-822f-16f1526ddbe7',
                  space_guid: '8da86308-f3e6-4196-b5e7-b03865b973d3',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/9762e24d-9761-40df-822f-16f1526ddbe7',
                  space_url: '/v2/spaces/8da86308-f3e6-4196-b5e7-b03865b973d3',
                  apps_url: '/v2/routes/3773ac42-dd79-4804-ba3f-fe1c13f288a5/apps',
                  route_mappings_url: '/v2/routes/3773ac42-dd79-4804-ba3f-fe1c13f288a5/route_mappings'
                }
              },
              {
                metadata: {
                  guid: '87d95f26-332e-4e5d-b4ae-8530b06e1de7',
                  url: '/v2/routes/87d95f26-332e-4e5d-b4ae-8530b06e1de7',
                  created_at: '2017-09-26T13:16:33Z',
                  updated_at: '2017-09-26T13:16:33Z'
                },
                entity: {
                  host: 'susecon',
                  path: '',
                  domain_guid: '9762e24d-9761-40df-822f-16f1526ddbe7',
                  space_guid: '8da86308-f3e6-4196-b5e7-b03865b973d3',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/9762e24d-9761-40df-822f-16f1526ddbe7',
                  space_url: '/v2/spaces/8da86308-f3e6-4196-b5e7-b03865b973d3',
                  apps_url: '/v2/routes/87d95f26-332e-4e5d-b4ae-8530b06e1de7/apps',
                  route_mappings_url: '/v2/routes/87d95f26-332e-4e5d-b4ae-8530b06e1de7/route_mappings'
                }
              },
              {
                metadata: {
                  guid: '971b4123-acf7-46d3-9964-fc9fc034710a',
                  url: '/v2/routes/971b4123-acf7-46d3-9964-fc9fc034710a',
                  created_at: '2017-10-02T19:31:35Z',
                  updated_at: '2017-10-02T19:31:35Z'
                },
                entity: {
                  host: 'n',
                  path: '',
                  domain_guid: '9762e24d-9761-40df-822f-16f1526ddbe7',
                  space_guid: '8da86308-f3e6-4196-b5e7-b03865b973d3',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/9762e24d-9761-40df-822f-16f1526ddbe7',
                  space_url: '/v2/spaces/8da86308-f3e6-4196-b5e7-b03865b973d3',
                  apps_url: '/v2/routes/971b4123-acf7-46d3-9964-fc9fc034710a/apps',
                  route_mappings_url: '/v2/routes/971b4123-acf7-46d3-9964-fc9fc034710a/route_mappings'
                }
              },
              {
                metadata: {
                  guid: '5f4becde-3290-4ca4-a3bd-51d7efb4b118',
                  url: '/v2/routes/5f4becde-3290-4ca4-a3bd-51d7efb4b118',
                  created_at: '2017-10-09T10:06:29Z',
                  updated_at: '2017-10-09T10:06:29Z'
                },
                entity: {
                  host: 'nwm-console',
                  path: '',
                  domain_guid: '9762e24d-9761-40df-822f-16f1526ddbe7',
                  space_guid: '8da86308-f3e6-4196-b5e7-b03865b973d3',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/9762e24d-9761-40df-822f-16f1526ddbe7',
                  space_url: '/v2/spaces/8da86308-f3e6-4196-b5e7-b03865b973d3',
                  apps_url: '/v2/routes/5f4becde-3290-4ca4-a3bd-51d7efb4b118/apps',
                  route_mappings_url: '/v2/routes/5f4becde-3290-4ca4-a3bd-51d7efb4b118/route_mappings'
                }
              }
            ],
            domains_url: '/v2/spaces/8da86308-f3e6-4196-b5e7-b03865b973d3/domains',
            domains: [
              {
                metadata: {
                  guid: '9762e24d-9761-40df-822f-16f1526ddbe7',
                  url: '/v2/shared_domains/9762e24d-9761-40df-822f-16f1526ddbe7',
                  created_at: '2016-11-04T12:57:41Z',
                  updated_at: '2017-10-02T08:39:19Z'
                },
                entity: {
                  name: 'cfapps.eu10.hana.ondemand.com',
                  router_group_guid: null,
                  router_group_type: null
                }
              }
            ],
            service_instances_url: '/v2/spaces/8da86308-f3e6-4196-b5e7-b03865b973d3/service_instances',
            service_instances: [
              {
                metadata: {
                  guid: 'f1105781-b2ab-4e5b-9872-cfdaf4d7b58f',
                  url: '/v2/service_instances/f1105781-b2ab-4e5b-9872-cfdaf4d7b58f',
                  created_at: '2017-10-09T10:05:59Z',
                  updated_at: '2017-10-09T10:05:59Z'
                },
                entity: {
                  name: 'console_db',
                  credentials: {},
                  service_plan_guid: 'cd6fcd9c-26e0-4b4a-8031-e0b8e70fb429',
                  space_guid: '8da86308-f3e6-4196-b5e7-b03865b973d3',
                  gateway_data: null,
                  dashboard_url: 'https://service-fabrik-broker.cf.eu10.hana.ondemand.com/manage/instances/6db542eb-8187-4afc-8a85-e08b4a3cc24e/c3320e0f-5866-4f14-895e-48bc92a4245c/f1105781-b2ab-4e5b-9872-cfdaf4d7b58f',
                  type: 'managed_service_instance',
                  last_operation: {
                    type: 'create',
                    state: 'succeeded',
                    description: '',
                    updated_at: '2017-10-09T10:05:59Z',
                    created_at: '2017-10-09T10:05:59Z'
                  },
                  tags: [
                    'stratos_postgresql'
                  ],
                  service_guid: '9ae1b7ff-ad5c-4f31-a1b9-6d00dd19fbec',
                  space_url: '/v2/spaces/8da86308-f3e6-4196-b5e7-b03865b973d3',
                  service_plan_url: '/v2/service_plans/cd6fcd9c-26e0-4b4a-8031-e0b8e70fb429',
                  service_bindings_url: '/v2/service_instances/f1105781-b2ab-4e5b-9872-cfdaf4d7b58f/service_bindings',
                  service_keys_url: '/v2/service_instances/f1105781-b2ab-4e5b-9872-cfdaf4d7b58f/service_keys',
                  routes_url: '/v2/service_instances/f1105781-b2ab-4e5b-9872-cfdaf4d7b58f/routes',
                  service_url: '/v2/services/9ae1b7ff-ad5c-4f31-a1b9-6d00dd19fbec'
                }
              },
              {
                metadata: {
                  guid: '98475879-6ea2-4664-8f0a-7b3940bd9d1d',
                  url: '/v2/service_instances/98475879-6ea2-4664-8f0a-7b3940bd9d1d',
                  created_at: '2017-07-07T14:49:55Z',
                  updated_at: '2017-07-07T14:49:55Z'
                },
                entity: {
                  name: 'Logs-1',
                  credentials: {},
                  service_plan_guid: 'fdba25e1-eadc-4504-9c77-fce719ecd64c',
                  space_guid: '8da86308-f3e6-4196-b5e7-b03865b973d3',
                  gateway_data: null,
                  dashboard_url: null,
                  type: 'managed_service_instance',
                  last_operation: {
                    type: 'create',
                    state: 'succeeded',
                    description: '',
                    updated_at: '2017-07-07T14:49:55Z',
                    created_at: '2017-07-07T14:49:55Z'
                  },
                  tags: [],
                  service_guid: 'de8378c6-9d36-4e60-a6ce-6e22648afba9',
                  space_url: '/v2/spaces/8da86308-f3e6-4196-b5e7-b03865b973d3',
                  service_plan_url: '/v2/service_plans/fdba25e1-eadc-4504-9c77-fce719ecd64c',
                  service_bindings_url: '/v2/service_instances/98475879-6ea2-4664-8f0a-7b3940bd9d1d/service_bindings',
                  service_keys_url: '/v2/service_instances/98475879-6ea2-4664-8f0a-7b3940bd9d1d/service_keys',
                  routes_url: '/v2/service_instances/98475879-6ea2-4664-8f0a-7b3940bd9d1d/routes',
                  service_url: '/v2/services/de8378c6-9d36-4e60-a6ce-6e22648afba9'
                }
              },
              {
                metadata: {
                  guid: 'a8e6e395-703b-4312-91bc-ceae69c990a1',
                  url: '/v2/service_instances/a8e6e395-703b-4312-91bc-ceae69c990a1',
                  created_at: '2017-07-07T15:19:22Z',
                  updated_at: '2017-07-07T15:19:22Z'
                },
                entity: {
                  name: 'Logs-2',
                  credentials: {},
                  service_plan_guid: 'fdba25e1-eadc-4504-9c77-fce719ecd64c',
                  space_guid: '8da86308-f3e6-4196-b5e7-b03865b973d3',
                  gateway_data: null,
                  dashboard_url: null,
                  type: 'managed_service_instance',
                  last_operation: {
                    type: 'create',
                    state: 'succeeded',
                    description: '',
                    updated_at: '2017-07-07T15:19:22Z',
                    created_at: '2017-07-07T15:19:22Z'
                  },
                  tags: [],
                  service_guid: 'de8378c6-9d36-4e60-a6ce-6e22648afba9',
                  space_url: '/v2/spaces/8da86308-f3e6-4196-b5e7-b03865b973d3',
                  service_plan_url: '/v2/service_plans/fdba25e1-eadc-4504-9c77-fce719ecd64c',
                  service_bindings_url: '/v2/service_instances/a8e6e395-703b-4312-91bc-ceae69c990a1/service_bindings',
                  service_keys_url: '/v2/service_instances/a8e6e395-703b-4312-91bc-ceae69c990a1/service_keys',
                  routes_url: '/v2/service_instances/a8e6e395-703b-4312-91bc-ceae69c990a1/routes',
                  service_url: '/v2/services/de8378c6-9d36-4e60-a6ce-6e22648afba9'
                }
              }
            ],
            app_events_url: '/v2/spaces/8da86308-f3e6-4196-b5e7-b03865b973d3/app_events',
            events_url: '/v2/spaces/8da86308-f3e6-4196-b5e7-b03865b973d3/events',
            security_groups_url: '/v2/spaces/8da86308-f3e6-4196-b5e7-b03865b973d3/security_groups',
            security_groups: [
              {
                metadata: {
                  guid: '6a18e825-7aa2-45c8-9f26-16f7048f3f6d',
                  url: '/v2/security_groups/6a18e825-7aa2-45c8-9f26-16f7048f3f6d',
                  created_at: '2017-10-09T10:05:59Z',
                  updated_at: '2017-10-09T10:05:59Z'
                },
                entity: {
                  name: 'service-fabrik-f1105781-b2ab-4e5b-9872-cfdaf4d7b58f',
                  rules: [
                    {
                      protocol: 'tcp',
                      destination: '10.11.241.20',
                      ports: '55150'
                    }
                  ],
                  running_default: false,
                  staging_default: false,
                  spaces_url: '/v2/security_groups/6a18e825-7aa2-45c8-9f26-16f7048f3f6d/spaces',
                  staging_spaces_url: '/v2/security_groups/6a18e825-7aa2-45c8-9f26-16f7048f3f6d/staging_spaces'
                }
              },
              {
                metadata: {
                  guid: 'dbce25ce-50f1-463e-8eeb-3ed5e4fadefc',
                  url: '/v2/security_groups/dbce25ce-50f1-463e-8eeb-3ed5e4fadefc',
                  created_at: '2016-11-04T12:44:07Z',
                  updated_at: '2017-10-11T00:03:03Z'
                },
                entity: {
                  name: 'public_networks',
                  rules: [
                    {
                      destination: '0.0.0.0-9.255.255.255',
                      protocol: 'all'
                    },
                    {
                      destination: '11.0.0.0-147.204.7.255',
                      protocol: 'all'
                    },
                    {
                      destination: '147.204.9.0-155.56.54.155',
                      protocol: 'all'
                    },
                    {
                      destination: '155.56.54.159-155.56.68.227',
                      protocol: 'all'
                    },
                    {
                      destination: '155.56.68.230-155.56.68.235',
                      protocol: 'all'
                    },
                    {
                      destination: '155.56.68.238-169.253.255.255',
                      protocol: 'all'
                    },
                    {
                      destination: '169.255.0.0-172.15.255.255',
                      protocol: 'all'
                    },
                    {
                      destination: '172.32.0.0-192.167.255.255',
                      protocol: 'all'
                    },
                    {
                      destination: '192.169.0.0-255.255.255.255',
                      protocol: 'all'
                    }
                  ],
                  running_default: true,
                  staging_default: true,
                  spaces_url: '/v2/security_groups/dbce25ce-50f1-463e-8eeb-3ed5e4fadefc/spaces',
                  staging_spaces_url: '/v2/security_groups/dbce25ce-50f1-463e-8eeb-3ed5e4fadefc/staging_spaces'
                }
              },
              {
                metadata: {
                  guid: '3b31730c-1b4c-40e5-9f7b-c25f9e8f0ee7',
                  url: '/v2/security_groups/3b31730c-1b4c-40e5-9f7b-c25f9e8f0ee7',
                  created_at: '2017-05-15T08:42:11Z',
                  updated_at: '2017-09-22T11:04:12Z'
                },
                entity: {
                  name: 'hana_trial_HCPCM-432',
                  rules: [
                    {
                      destination: '10.253.93.93',
                      ports: '30041, 8041',
                      protocol: 'tcp'
                    },
                    {
                      destination: '10.253.98.223',
                      ports: '30041, 8041',
                      protocol: 'tcp'
                    }
                  ],
                  running_default: true,
                  staging_default: false,
                  spaces_url: '/v2/security_groups/3b31730c-1b4c-40e5-9f7b-c25f9e8f0ee7/spaces',
                  staging_spaces_url: '/v2/security_groups/3b31730c-1b4c-40e5-9f7b-c25f9e8f0ee7/staging_spaces'
                }
              },
              {
                metadata: {
                  guid: 'f68acd85-52c1-49a7-92d4-87bd0ba2b988',
                  url: '/v2/security_groups/f68acd85-52c1-49a7-92d4-87bd0ba2b988',
                  created_at: '2016-11-04T12:44:07Z',
                  updated_at: '2016-11-04T12:44:07Z'
                },
                entity: {
                  name: 'dns',
                  rules: [
                    {
                      destination: '0.0.0.0/0',
                      ports: '53',
                      protocol: 'tcp'
                    },
                    {
                      destination: '0.0.0.0/0',
                      ports: '53',
                      protocol: 'udp'
                    }
                  ],
                  running_default: true,
                  staging_default: true,
                  spaces_url: '/v2/security_groups/f68acd85-52c1-49a7-92d4-87bd0ba2b988/spaces',
                  staging_spaces_url: '/v2/security_groups/f68acd85-52c1-49a7-92d4-87bd0ba2b988/staging_spaces'
                }
              }
            ],
            staging_security_groups_url: '/v2/spaces/8da86308-f3e6-4196-b5e7-b03865b973d3/staging_security_groups',
            staging_security_groups: [
              {
                metadata: {
                  guid: 'dbce25ce-50f1-463e-8eeb-3ed5e4fadefc',
                  url: '/v2/security_groups/dbce25ce-50f1-463e-8eeb-3ed5e4fadefc',
                  created_at: '2016-11-04T12:44:07Z',
                  updated_at: '2017-10-11T00:03:03Z'
                },
                entity: {
                  name: 'public_networks',
                  rules: [
                    {
                      destination: '0.0.0.0-9.255.255.255',
                      protocol: 'all'
                    },
                    {
                      destination: '11.0.0.0-147.204.7.255',
                      protocol: 'all'
                    },
                    {
                      destination: '147.204.9.0-155.56.54.155',
                      protocol: 'all'
                    },
                    {
                      destination: '155.56.54.159-155.56.68.227',
                      protocol: 'all'
                    },
                    {
                      destination: '155.56.68.230-155.56.68.235',
                      protocol: 'all'
                    },
                    {
                      destination: '155.56.68.238-169.253.255.255',
                      protocol: 'all'
                    },
                    {
                      destination: '169.255.0.0-172.15.255.255',
                      protocol: 'all'
                    },
                    {
                      destination: '172.32.0.0-192.167.255.255',
                      protocol: 'all'
                    },
                    {
                      destination: '192.169.0.0-255.255.255.255',
                      protocol: 'all'
                    }
                  ],
                  running_default: true,
                  staging_default: true,
                  spaces_url: '/v2/security_groups/dbce25ce-50f1-463e-8eeb-3ed5e4fadefc/spaces',
                  staging_spaces_url: '/v2/security_groups/dbce25ce-50f1-463e-8eeb-3ed5e4fadefc/staging_spaces'
                }
              },
              {
                metadata: {
                  guid: 'f68acd85-52c1-49a7-92d4-87bd0ba2b988',
                  url: '/v2/security_groups/f68acd85-52c1-49a7-92d4-87bd0ba2b988',
                  created_at: '2016-11-04T12:44:07Z',
                  updated_at: '2016-11-04T12:44:07Z'
                },
                entity: {
                  name: 'dns',
                  rules: [
                    {
                      destination: '0.0.0.0/0',
                      ports: '53',
                      protocol: 'tcp'
                    },
                    {
                      destination: '0.0.0.0/0',
                      ports: '53',
                      protocol: 'udp'
                    }
                  ],
                  running_default: true,
                  staging_default: true,
                  spaces_url: '/v2/security_groups/f68acd85-52c1-49a7-92d4-87bd0ba2b988/spaces',
                  staging_spaces_url: '/v2/security_groups/f68acd85-52c1-49a7-92d4-87bd0ba2b988/staging_spaces'
                }
              }
            ]
          }
        },
        '78bd7c96-c182-4371-bc71-15a49eb5c5bc': {
          metadata: {
            guid: '78bd7c96-c182-4371-bc71-15a49eb5c5bc',
            url: '/v2/spaces/78bd7c96-c182-4371-bc71-15a49eb5c5bc',
            created_at: '2017-09-08T17:26:55Z',
            updated_at: '2017-09-08T17:26:55Z'
          },
          entity: {
            name: 'dev',
            organization_guid: 'bba0b575-800f-48ac-b89f-1a245132fc40',
            space_quota_definition_guid: null,
            isolation_segment_guid: null,
            allow_ssh: true,
            organization_url: '/v2/organizations/bba0b575-800f-48ac-b89f-1a245132fc40',
            organization: {
              metadata: {
                guid: 'bba0b575-800f-48ac-b89f-1a245132fc40',
                url: '/v2/organizations/bba0b575-800f-48ac-b89f-1a245132fc40',
                created_at: '2017-09-08T17:26:51Z',
                updated_at: '2017-09-08T17:26:51Z'
              },
              entity: {
                name: 'SUSE',
                billing_enabled: false,
                quota_definition_guid: 'fa684b6e-a42c-4c78-bef1-ec7ec40ec128',
                status: 'active',
                default_isolation_segment_guid: null,
                quota_definition_url: '/v2/quota_definitions/fa684b6e-a42c-4c78-bef1-ec7ec40ec128',
                spaces_url: '/v2/organizations/bba0b575-800f-48ac-b89f-1a245132fc40/spaces',
                domains_url: '/v2/organizations/bba0b575-800f-48ac-b89f-1a245132fc40/domains',
                private_domains_url: '/v2/organizations/bba0b575-800f-48ac-b89f-1a245132fc40/private_domains',
                users_url: '/v2/organizations/bba0b575-800f-48ac-b89f-1a245132fc40/users',
                managers_url: '/v2/organizations/bba0b575-800f-48ac-b89f-1a245132fc40/managers',
                billing_managers_url: '/v2/organizations/bba0b575-800f-48ac-b89f-1a245132fc40/billing_managers',
                auditors_url: '/v2/organizations/bba0b575-800f-48ac-b89f-1a245132fc40/auditors',
                app_events_url: '/v2/organizations/bba0b575-800f-48ac-b89f-1a245132fc40/app_events',
                space_quota_definitions_url: '/v2/organizations/bba0b575-800f-48ac-b89f-1a245132fc40/space_quota_definitions'
              }
            },
            developers_url: '/v2/spaces/78bd7c96-c182-4371-bc71-15a49eb5c5bc/developers',
            developers: [
              {
                metadata: {
                  guid: 'a1e15ade-2f3d-4354-8935-0553973afb2c',
                  url: '/v2/users/a1e15ade-2f3d-4354-8935-0553973afb2c',
                  created_at: '2017-09-08T17:23:47Z',
                  updated_at: '2017-09-08T17:23:47Z'
                },
                entity: {
                  admin: false,
                  active: true,
                  default_space_guid: null,
                  spaces_url: '/v2/users/a1e15ade-2f3d-4354-8935-0553973afb2c/spaces',
                  organizations_url: '/v2/users/a1e15ade-2f3d-4354-8935-0553973afb2c/organizations',
                  managed_organizations_url: '/v2/users/a1e15ade-2f3d-4354-8935-0553973afb2c/managed_organizations',
                  billing_managed_organizations_url: '/v2/users/a1e15ade-2f3d-4354-8935-0553973afb2c/billing_managed_organizations',
                  audited_organizations_url: '/v2/users/a1e15ade-2f3d-4354-8935-0553973afb2c/audited_organizations',
                  managed_spaces_url: '/v2/users/a1e15ade-2f3d-4354-8935-0553973afb2c/managed_spaces',
                  audited_spaces_url: '/v2/users/a1e15ade-2f3d-4354-8935-0553973afb2c/audited_spaces'
                }
              }
            ],
            managers_url: '/v2/spaces/78bd7c96-c182-4371-bc71-15a49eb5c5bc/managers',
            managers: [
              {
                metadata: {
                  guid: 'a1e15ade-2f3d-4354-8935-0553973afb2c',
                  url: '/v2/users/a1e15ade-2f3d-4354-8935-0553973afb2c',
                  created_at: '2017-09-08T17:23:47Z',
                  updated_at: '2017-09-08T17:23:47Z'
                },
                entity: {
                  admin: false,
                  active: true,
                  default_space_guid: null,
                  spaces_url: '/v2/users/a1e15ade-2f3d-4354-8935-0553973afb2c/spaces',
                  organizations_url: '/v2/users/a1e15ade-2f3d-4354-8935-0553973afb2c/organizations',
                  managed_organizations_url: '/v2/users/a1e15ade-2f3d-4354-8935-0553973afb2c/managed_organizations',
                  billing_managed_organizations_url: '/v2/users/a1e15ade-2f3d-4354-8935-0553973afb2c/billing_managed_organizations',
                  audited_organizations_url: '/v2/users/a1e15ade-2f3d-4354-8935-0553973afb2c/audited_organizations',
                  managed_spaces_url: '/v2/users/a1e15ade-2f3d-4354-8935-0553973afb2c/managed_spaces',
                  audited_spaces_url: '/v2/users/a1e15ade-2f3d-4354-8935-0553973afb2c/audited_spaces'
                }
              }
            ],
            auditors_url: '/v2/spaces/78bd7c96-c182-4371-bc71-15a49eb5c5bc/auditors',
            auditors: [],
            apps_url: '/v2/spaces/78bd7c96-c182-4371-bc71-15a49eb5c5bc/apps',
            routes_url: '/v2/spaces/78bd7c96-c182-4371-bc71-15a49eb5c5bc/routes',
            routes: [
              {
                metadata: {
                  guid: '54c9ae57-e84e-42ff-99b0-836502fa1982',
                  url: '/v2/routes/54c9ae57-e84e-42ff-99b0-836502fa1982',
                  created_at: '2017-09-11T09:56:19Z',
                  updated_at: '2017-09-11T09:56:19Z'
                },
                entity: {
                  host: 'app-autoscaler-broker',
                  path: '',
                  domain_guid: '15611675-b792-4236-92ce-36caa54b18e9',
                  space_guid: '78bd7c96-c182-4371-bc71-15a49eb5c5bc',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/15611675-b792-4236-92ce-36caa54b18e9',
                  space_url: '/v2/spaces/78bd7c96-c182-4371-bc71-15a49eb5c5bc',
                  apps_url: '/v2/routes/54c9ae57-e84e-42ff-99b0-836502fa1982/apps',
                  route_mappings_url: '/v2/routes/54c9ae57-e84e-42ff-99b0-836502fa1982/route_mappings'
                }
              },
              {
                metadata: {
                  guid: 'bd3234a1-6ab9-413e-8859-2e68d2c0ae3f',
                  url: '/v2/routes/bd3234a1-6ab9-413e-8859-2e68d2c0ae3f',
                  created_at: '2017-10-02T09:48:20Z',
                  updated_at: '2017-10-02T09:48:20Z'
                },
                entity: {
                  host: 'console-nwm',
                  path: '',
                  domain_guid: '15611675-b792-4236-92ce-36caa54b18e9',
                  space_guid: '78bd7c96-c182-4371-bc71-15a49eb5c5bc',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/15611675-b792-4236-92ce-36caa54b18e9',
                  space_url: '/v2/spaces/78bd7c96-c182-4371-bc71-15a49eb5c5bc',
                  apps_url: '/v2/routes/bd3234a1-6ab9-413e-8859-2e68d2c0ae3f/apps',
                  route_mappings_url: '/v2/routes/bd3234a1-6ab9-413e-8859-2e68d2c0ae3f/route_mappings'
                }
              },
              {
                metadata: {
                  guid: 'c5130743-1c96-4a18-81d1-c20f671c6920',
                  url: '/v2/routes/c5130743-1c96-4a18-81d1-c20f671c6920',
                  created_at: '2017-10-02T10:23:56Z',
                  updated_at: '2017-10-02T10:23:56Z'
                },
                entity: {
                  host: 'suse-console',
                  path: '',
                  domain_guid: '15611675-b792-4236-92ce-36caa54b18e9',
                  space_guid: '78bd7c96-c182-4371-bc71-15a49eb5c5bc',
                  service_instance_guid: null,
                  port: null,
                  domain_url: '/v2/shared_domains/15611675-b792-4236-92ce-36caa54b18e9',
                  space_url: '/v2/spaces/78bd7c96-c182-4371-bc71-15a49eb5c5bc',
                  apps_url: '/v2/routes/c5130743-1c96-4a18-81d1-c20f671c6920/apps',
                  route_mappings_url: '/v2/routes/c5130743-1c96-4a18-81d1-c20f671c6920/route_mappings'
                }
              }
            ],
            domains_url: '/v2/spaces/78bd7c96-c182-4371-bc71-15a49eb5c5bc/domains',
            domains: [
              {
                metadata: {
                  guid: '15611675-b792-4236-92ce-36caa54b18e9',
                  url: '/v2/shared_domains/15611675-b792-4236-92ce-36caa54b18e9',
                  created_at: '2017-09-08T17:22:39Z',
                  updated_at: '2017-09-08T17:22:39Z'
                },
                entity: {
                  name: 'cf-dev.io',
                  router_group_guid: null,
                  router_group_type: null
                }
              }
            ],
            service_instances_url: '/v2/spaces/78bd7c96-c182-4371-bc71-15a49eb5c5bc/service_instances',
            service_instances: [],
            app_events_url: '/v2/spaces/78bd7c96-c182-4371-bc71-15a49eb5c5bc/app_events',
            events_url: '/v2/spaces/78bd7c96-c182-4371-bc71-15a49eb5c5bc/events',
            security_groups_url: '/v2/spaces/78bd7c96-c182-4371-bc71-15a49eb5c5bc/security_groups',
            security_groups: [
              {
                metadata: {
                  guid: 'c885c7c7-4d80-4983-b262-91dafcc08902',
                  url: '/v2/security_groups/c885c7c7-4d80-4983-b262-91dafcc08902',
                  created_at: '2017-09-08T17:22:39Z',
                  updated_at: '2017-09-08T17:22:39Z'
                },
                entity: {
                  name: 'public_networks',
                  rules: [
                    {
                      destination: '0.0.0.0-9.255.255.255',
                      protocol: 'all'
                    },
                    {
                      destination: '11.0.0.0-169.253.255.255',
                      protocol: 'all'
                    },
                    {
                      destination: '169.255.0.0-172.15.255.255',
                      protocol: 'all'
                    },
                    {
                      destination: '172.32.0.0-192.167.255.255',
                      protocol: 'all'
                    },
                    {
                      destination: '192.169.0.0-255.255.255.255',
                      protocol: 'all'
                    }
                  ],
                  running_default: true,
                  staging_default: true,
                  spaces_url: '/v2/security_groups/c885c7c7-4d80-4983-b262-91dafcc08902/spaces',
                  staging_spaces_url: '/v2/security_groups/c885c7c7-4d80-4983-b262-91dafcc08902/staging_spaces'
                }
              },
              {
                metadata: {
                  guid: '742be003-8a2d-4638-bb52-3d8217927f3d',
                  url: '/v2/security_groups/742be003-8a2d-4638-bb52-3d8217927f3d',
                  created_at: '2017-09-08T17:22:39Z',
                  updated_at: '2017-09-08T17:22:39Z'
                },
                entity: {
                  name: 'dns',
                  rules: [
                    {
                      destination: '0.0.0.0/0',
                      ports: '53',
                      protocol: 'tcp'
                    },
                    {
                      destination: '0.0.0.0/0',
                      ports: '53',
                      protocol: 'udp'
                    }
                  ],
                  running_default: true,
                  staging_default: true,
                  spaces_url: '/v2/security_groups/742be003-8a2d-4638-bb52-3d8217927f3d/spaces',
                  staging_spaces_url: '/v2/security_groups/742be003-8a2d-4638-bb52-3d8217927f3d/staging_spaces'
                }
              },
              {
                metadata: {
                  guid: '8212705e-0e48-4a9a-8b12-22a7a8a0d700',
                  url: '/v2/security_groups/8212705e-0e48-4a9a-8b12-22a7a8a0d700',
                  created_at: '2017-09-08T17:23:42Z',
                  updated_at: '2017-09-08T17:23:43Z'
                },
                entity: {
                  name: 'dev-mysql',
                  rules: [
                    {
                      destination: '10.0.0.236',
                      ports: '3306',
                      protocol: 'tcp'
                    }
                  ],
                  running_default: true,
                  staging_default: true,
                  spaces_url: '/v2/security_groups/8212705e-0e48-4a9a-8b12-22a7a8a0d700/spaces',
                  staging_spaces_url: '/v2/security_groups/8212705e-0e48-4a9a-8b12-22a7a8a0d700/staging_spaces'
                }
              }
            ],
            staging_security_groups_url: '/v2/spaces/78bd7c96-c182-4371-bc71-15a49eb5c5bc/staging_security_groups',
            staging_security_groups: [
              {
                metadata: {
                  guid: 'c885c7c7-4d80-4983-b262-91dafcc08902',
                  url: '/v2/security_groups/c885c7c7-4d80-4983-b262-91dafcc08902',
                  created_at: '2017-09-08T17:22:39Z',
                  updated_at: '2017-09-08T17:22:39Z'
                },
                entity: {
                  name: 'public_networks',
                  rules: [
                    {
                      destination: '0.0.0.0-9.255.255.255',
                      protocol: 'all'
                    },
                    {
                      destination: '11.0.0.0-169.253.255.255',
                      protocol: 'all'
                    },
                    {
                      destination: '169.255.0.0-172.15.255.255',
                      protocol: 'all'
                    },
                    {
                      destination: '172.32.0.0-192.167.255.255',
                      protocol: 'all'
                    },
                    {
                      destination: '192.169.0.0-255.255.255.255',
                      protocol: 'all'
                    }
                  ],
                  running_default: true,
                  staging_default: true,
                  spaces_url: '/v2/security_groups/c885c7c7-4d80-4983-b262-91dafcc08902/spaces',
                  staging_spaces_url: '/v2/security_groups/c885c7c7-4d80-4983-b262-91dafcc08902/staging_spaces'
                }
              },
              {
                metadata: {
                  guid: '742be003-8a2d-4638-bb52-3d8217927f3d',
                  url: '/v2/security_groups/742be003-8a2d-4638-bb52-3d8217927f3d',
                  created_at: '2017-09-08T17:22:39Z',
                  updated_at: '2017-09-08T17:22:39Z'
                },
                entity: {
                  name: 'dns',
                  rules: [
                    {
                      destination: '0.0.0.0/0',
                      ports: '53',
                      protocol: 'tcp'
                    },
                    {
                      destination: '0.0.0.0/0',
                      ports: '53',
                      protocol: 'udp'
                    }
                  ],
                  running_default: true,
                  staging_default: true,
                  spaces_url: '/v2/security_groups/742be003-8a2d-4638-bb52-3d8217927f3d/spaces',
                  staging_spaces_url: '/v2/security_groups/742be003-8a2d-4638-bb52-3d8217927f3d/staging_spaces'
                }
              },
              {
                metadata: {
                  guid: '8212705e-0e48-4a9a-8b12-22a7a8a0d700',
                  url: '/v2/security_groups/8212705e-0e48-4a9a-8b12-22a7a8a0d700',
                  created_at: '2017-09-08T17:23:42Z',
                  updated_at: '2017-09-08T17:23:43Z'
                },
                entity: {
                  name: 'dev-mysql',
                  rules: [
                    {
                      destination: '10.0.0.236',
                      ports: '3306',
                      protocol: 'tcp'
                    }
                  ],
                  running_default: true,
                  staging_default: true,
                  spaces_url: '/v2/security_groups/8212705e-0e48-4a9a-8b12-22a7a8a0d700/spaces',
                  staging_spaces_url: '/v2/security_groups/8212705e-0e48-4a9a-8b12-22a7a8a0d700/staging_spaces'
                }
              }
            ]
          }
        },
        '3625beef-09b3-420c-b11b-a7bb2b1fe978': {
          metadata: {
            guid: '3625beef-09b3-420c-b11b-a7bb2b1fe978',
            url: '/v2/spaces/3625beef-09b3-420c-b11b-a7bb2b1fe978',
            created_at: '2017-09-08T17:26:46Z',
            updated_at: '2017-09-08T17:26:46Z'
          },
          entity: {
            name: 'e2e',
            organization_guid: '7de83a7f-32bd-4d34-b222-f84a2afe4183',
            space_quota_definition_guid: null,
            isolation_segment_guid: null,
            allow_ssh: true,
            organization_url: '/v2/organizations/7de83a7f-32bd-4d34-b222-f84a2afe4183',
            organization: {
              metadata: {
                guid: '7de83a7f-32bd-4d34-b222-f84a2afe4183',
                url: '/v2/organizations/7de83a7f-32bd-4d34-b222-f84a2afe4183',
                created_at: '2017-09-08T17:26:43Z',
                updated_at: '2017-09-08T17:26:43Z'
              },
              entity: {
                name: 'e2e',
                billing_enabled: false,
                quota_definition_guid: 'fa684b6e-a42c-4c78-bef1-ec7ec40ec128',
                status: 'active',
                default_isolation_segment_guid: null,
                quota_definition_url: '/v2/quota_definitions/fa684b6e-a42c-4c78-bef1-ec7ec40ec128',
                spaces_url: '/v2/organizations/7de83a7f-32bd-4d34-b222-f84a2afe4183/spaces',
                domains_url: '/v2/organizations/7de83a7f-32bd-4d34-b222-f84a2afe4183/domains',
                private_domains_url: '/v2/organizations/7de83a7f-32bd-4d34-b222-f84a2afe4183/private_domains',
                users_url: '/v2/organizations/7de83a7f-32bd-4d34-b222-f84a2afe4183/users',
                managers_url: '/v2/organizations/7de83a7f-32bd-4d34-b222-f84a2afe4183/managers',
                billing_managers_url: '/v2/organizations/7de83a7f-32bd-4d34-b222-f84a2afe4183/billing_managers',
                auditors_url: '/v2/organizations/7de83a7f-32bd-4d34-b222-f84a2afe4183/auditors',
                app_events_url: '/v2/organizations/7de83a7f-32bd-4d34-b222-f84a2afe4183/app_events',
                space_quota_definitions_url: '/v2/organizations/7de83a7f-32bd-4d34-b222-f84a2afe4183/space_quota_definitions'
              }
            },
            developers_url: '/v2/spaces/3625beef-09b3-420c-b11b-a7bb2b1fe978/developers',
            developers: [
              {
                metadata: {
                  guid: 'a1e15ade-2f3d-4354-8935-0553973afb2c',
                  url: '/v2/users/a1e15ade-2f3d-4354-8935-0553973afb2c',
                  created_at: '2017-09-08T17:23:47Z',
                  updated_at: '2017-09-08T17:23:47Z'
                },
                entity: {
                  admin: false,
                  active: true,
                  default_space_guid: null,
                  spaces_url: '/v2/users/a1e15ade-2f3d-4354-8935-0553973afb2c/spaces',
                  organizations_url: '/v2/users/a1e15ade-2f3d-4354-8935-0553973afb2c/organizations',
                  managed_organizations_url: '/v2/users/a1e15ade-2f3d-4354-8935-0553973afb2c/managed_organizations',
                  billing_managed_organizations_url: '/v2/users/a1e15ade-2f3d-4354-8935-0553973afb2c/billing_managed_organizations',
                  audited_organizations_url: '/v2/users/a1e15ade-2f3d-4354-8935-0553973afb2c/audited_organizations',
                  managed_spaces_url: '/v2/users/a1e15ade-2f3d-4354-8935-0553973afb2c/managed_spaces',
                  audited_spaces_url: '/v2/users/a1e15ade-2f3d-4354-8935-0553973afb2c/audited_spaces'
                }
              },
              {
                metadata: {
                  guid: '9d18801e-0fc9-462d-a11b-8968777f6419',
                  url: '/v2/users/9d18801e-0fc9-462d-a11b-8968777f6419',
                  created_at: '2017-09-08T17:26:48Z',
                  updated_at: '2017-09-08T17:26:48Z'
                },
                entity: {
                  admin: false,
                  active: false,
                  default_space_guid: null,
                  spaces_url: '/v2/users/9d18801e-0fc9-462d-a11b-8968777f6419/spaces',
                  organizations_url: '/v2/users/9d18801e-0fc9-462d-a11b-8968777f6419/organizations',
                  managed_organizations_url: '/v2/users/9d18801e-0fc9-462d-a11b-8968777f6419/managed_organizations',
                  billing_managed_organizations_url: '/v2/users/9d18801e-0fc9-462d-a11b-8968777f6419/billing_managed_organizations',
                  audited_organizations_url: '/v2/users/9d18801e-0fc9-462d-a11b-8968777f6419/audited_organizations',
                  managed_spaces_url: '/v2/users/9d18801e-0fc9-462d-a11b-8968777f6419/managed_spaces',
                  audited_spaces_url: '/v2/users/9d18801e-0fc9-462d-a11b-8968777f6419/audited_spaces'
                }
              }
            ],
            managers_url: '/v2/spaces/3625beef-09b3-420c-b11b-a7bb2b1fe978/managers',
            managers: [
              {
                metadata: {
                  guid: 'a1e15ade-2f3d-4354-8935-0553973afb2c',
                  url: '/v2/users/a1e15ade-2f3d-4354-8935-0553973afb2c',
                  created_at: '2017-09-08T17:23:47Z',
                  updated_at: '2017-09-08T17:23:47Z'
                },
                entity: {
                  admin: false,
                  active: true,
                  default_space_guid: null,
                  spaces_url: '/v2/users/a1e15ade-2f3d-4354-8935-0553973afb2c/spaces',
                  organizations_url: '/v2/users/a1e15ade-2f3d-4354-8935-0553973afb2c/organizations',
                  managed_organizations_url: '/v2/users/a1e15ade-2f3d-4354-8935-0553973afb2c/managed_organizations',
                  billing_managed_organizations_url: '/v2/users/a1e15ade-2f3d-4354-8935-0553973afb2c/billing_managed_organizations',
                  audited_organizations_url: '/v2/users/a1e15ade-2f3d-4354-8935-0553973afb2c/audited_organizations',
                  managed_spaces_url: '/v2/users/a1e15ade-2f3d-4354-8935-0553973afb2c/managed_spaces',
                  audited_spaces_url: '/v2/users/a1e15ade-2f3d-4354-8935-0553973afb2c/audited_spaces'
                }
              }
            ],
            auditors_url: '/v2/spaces/3625beef-09b3-420c-b11b-a7bb2b1fe978/auditors',
            auditors: [],
            apps_url: '/v2/spaces/3625beef-09b3-420c-b11b-a7bb2b1fe978/apps',
            routes_url: '/v2/spaces/3625beef-09b3-420c-b11b-a7bb2b1fe978/routes',
            routes: [],
            domains_url: '/v2/spaces/3625beef-09b3-420c-b11b-a7bb2b1fe978/domains',
            domains: [
              {
                metadata: {
                  guid: '15611675-b792-4236-92ce-36caa54b18e9',
                  url: '/v2/shared_domains/15611675-b792-4236-92ce-36caa54b18e9',
                  created_at: '2017-09-08T17:22:39Z',
                  updated_at: '2017-09-08T17:22:39Z'
                },
                entity: {
                  name: 'cf-dev.io',
                  router_group_guid: null,
                  router_group_type: null
                }
              }
            ],
            service_instances_url: '/v2/spaces/3625beef-09b3-420c-b11b-a7bb2b1fe978/service_instances',
            service_instances: [],
            app_events_url: '/v2/spaces/3625beef-09b3-420c-b11b-a7bb2b1fe978/app_events',
            events_url: '/v2/spaces/3625beef-09b3-420c-b11b-a7bb2b1fe978/events',
            security_groups_url: '/v2/spaces/3625beef-09b3-420c-b11b-a7bb2b1fe978/security_groups',
            security_groups: [
              {
                metadata: {
                  guid: 'c885c7c7-4d80-4983-b262-91dafcc08902',
                  url: '/v2/security_groups/c885c7c7-4d80-4983-b262-91dafcc08902',
                  created_at: '2017-09-08T17:22:39Z',
                  updated_at: '2017-09-08T17:22:39Z'
                },
                entity: {
                  name: 'public_networks',
                  rules: [
                    {
                      destination: '0.0.0.0-9.255.255.255',
                      protocol: 'all'
                    },
                    {
                      destination: '11.0.0.0-169.253.255.255',
                      protocol: 'all'
                    },
                    {
                      destination: '169.255.0.0-172.15.255.255',
                      protocol: 'all'
                    },
                    {
                      destination: '172.32.0.0-192.167.255.255',
                      protocol: 'all'
                    },
                    {
                      destination: '192.169.0.0-255.255.255.255',
                      protocol: 'all'
                    }
                  ],
                  running_default: true,
                  staging_default: true,
                  spaces_url: '/v2/security_groups/c885c7c7-4d80-4983-b262-91dafcc08902/spaces',
                  staging_spaces_url: '/v2/security_groups/c885c7c7-4d80-4983-b262-91dafcc08902/staging_spaces'
                }
              },
              {
                metadata: {
                  guid: '742be003-8a2d-4638-bb52-3d8217927f3d',
                  url: '/v2/security_groups/742be003-8a2d-4638-bb52-3d8217927f3d',
                  created_at: '2017-09-08T17:22:39Z',
                  updated_at: '2017-09-08T17:22:39Z'
                },
                entity: {
                  name: 'dns',
                  rules: [
                    {
                      destination: '0.0.0.0/0',
                      ports: '53',
                      protocol: 'tcp'
                    },
                    {
                      destination: '0.0.0.0/0',
                      ports: '53',
                      protocol: 'udp'
                    }
                  ],
                  running_default: true,
                  staging_default: true,
                  spaces_url: '/v2/security_groups/742be003-8a2d-4638-bb52-3d8217927f3d/spaces',
                  staging_spaces_url: '/v2/security_groups/742be003-8a2d-4638-bb52-3d8217927f3d/staging_spaces'
                }
              },
              {
                metadata: {
                  guid: '8212705e-0e48-4a9a-8b12-22a7a8a0d700',
                  url: '/v2/security_groups/8212705e-0e48-4a9a-8b12-22a7a8a0d700',
                  created_at: '2017-09-08T17:23:42Z',
                  updated_at: '2017-09-08T17:23:43Z'
                },
                entity: {
                  name: 'dev-mysql',
                  rules: [
                    {
                      destination: '10.0.0.236',
                      ports: '3306',
                      protocol: 'tcp'
                    }
                  ],
                  running_default: true,
                  staging_default: true,
                  spaces_url: '/v2/security_groups/8212705e-0e48-4a9a-8b12-22a7a8a0d700/spaces',
                  staging_spaces_url: '/v2/security_groups/8212705e-0e48-4a9a-8b12-22a7a8a0d700/staging_spaces'
                }
              }
            ],
            staging_security_groups_url: '/v2/spaces/3625beef-09b3-420c-b11b-a7bb2b1fe978/staging_security_groups',
            staging_security_groups: [
              {
                metadata: {
                  guid: 'c885c7c7-4d80-4983-b262-91dafcc08902',
                  url: '/v2/security_groups/c885c7c7-4d80-4983-b262-91dafcc08902',
                  created_at: '2017-09-08T17:22:39Z',
                  updated_at: '2017-09-08T17:22:39Z'
                },
                entity: {
                  name: 'public_networks',
                  rules: [
                    {
                      destination: '0.0.0.0-9.255.255.255',
                      protocol: 'all'
                    },
                    {
                      destination: '11.0.0.0-169.253.255.255',
                      protocol: 'all'
                    },
                    {
                      destination: '169.255.0.0-172.15.255.255',
                      protocol: 'all'
                    },
                    {
                      destination: '172.32.0.0-192.167.255.255',
                      protocol: 'all'
                    },
                    {
                      destination: '192.169.0.0-255.255.255.255',
                      protocol: 'all'
                    }
                  ],
                  running_default: true,
                  staging_default: true,
                  spaces_url: '/v2/security_groups/c885c7c7-4d80-4983-b262-91dafcc08902/spaces',
                  staging_spaces_url: '/v2/security_groups/c885c7c7-4d80-4983-b262-91dafcc08902/staging_spaces'
                }
              },
              {
                metadata: {
                  guid: '742be003-8a2d-4638-bb52-3d8217927f3d',
                  url: '/v2/security_groups/742be003-8a2d-4638-bb52-3d8217927f3d',
                  created_at: '2017-09-08T17:22:39Z',
                  updated_at: '2017-09-08T17:22:39Z'
                },
                entity: {
                  name: 'dns',
                  rules: [
                    {
                      destination: '0.0.0.0/0',
                      ports: '53',
                      protocol: 'tcp'
                    },
                    {
                      destination: '0.0.0.0/0',
                      ports: '53',
                      protocol: 'udp'
                    }
                  ],
                  running_default: true,
                  staging_default: true,
                  spaces_url: '/v2/security_groups/742be003-8a2d-4638-bb52-3d8217927f3d/spaces',
                  staging_spaces_url: '/v2/security_groups/742be003-8a2d-4638-bb52-3d8217927f3d/staging_spaces'
                }
              },
              {
                metadata: {
                  guid: '8212705e-0e48-4a9a-8b12-22a7a8a0d700',
                  url: '/v2/security_groups/8212705e-0e48-4a9a-8b12-22a7a8a0d700',
                  created_at: '2017-09-08T17:23:42Z',
                  updated_at: '2017-09-08T17:23:43Z'
                },
                entity: {
                  name: 'dev-mysql',
                  rules: [
                    {
                      destination: '10.0.0.236',
                      ports: '3306',
                      protocol: 'tcp'
                    }
                  ],
                  running_default: true,
                  staging_default: true,
                  spaces_url: '/v2/security_groups/8212705e-0e48-4a9a-8b12-22a7a8a0d700/spaces',
                  staging_spaces_url: '/v2/security_groups/8212705e-0e48-4a9a-8b12-22a7a8a0d700/staging_spaces'
                }
              }
            ]
          }
        }
      },
      organization: {},
      route: {},
      event: {},
      endpoint: {
        [testSCFGuid]: {
          guid: testSCFGuid,
          name: 'SCF',
          cnsi_type: 'cf',
          api_endpoint: {
            Scheme: 'https',
            Opaque: '',
            User: null,
            Host: 'api.127.0.0.1.xip.io:8443',
            Path: '',
            RawPath: '',
            ForceQuery: false,
            RawQuery: '',
            Fragment: ''
          },
          authorization_endpoint: 'https://cf.uaa.127.0.0.1.xip.io:2793',
          token_endpoint: 'https://cf.uaa.127.0.0.1.xip.io:2793',
          doppler_logging_endpoint: 'wss://doppler.127.0.0.1.xip.io:4443',
          skip_ssl_validation: true,
          sso_allowed: true,
          user: {
            guid: 'bcf78136-6225-4515-bf8e-a32243deea0c',
            name: 'admin',
            admin: true
          },
          connectionStatus: 'connected',
          registered: true,
          system_shared_token: false,
          metricsAvailable: false
        },
      },
      metrics: {},
      system: {},
      userProfile: {
        id: 'test-user',
        name: {
          familyName: 'User',
          givenName: 'Test',
        },
        userName: 'tesy-user-name',
        meta: {
          created: '',
          lastModified: '',
        },
        verified: true,
        active: true,
        emails: [
          {
            primary: true,
            value: 'test@test.com',
          }
        ],
        passwordLastModified: ''
      },
      [userProvidedServiceInstanceSchemaKey]: {}
    },
    actionHistory: [],
    lists: {},
    routing: {
      previousState: {
        id: 4,
        url: '/marketplace',
        urlAfterRedirects: '/marketplace',
        state: {
          url: '/marketplace',
          params: {},
          queryParams: {}
        }
      },
      currentState: {
        id: 5,
        url: '/applications',
        urlAfterRedirects: '/applications',
        state: {
          url: '/applications',
          params: {},
          queryParams: {}
        }
      }
    },
    manageUsersRoles: {
      users: [],
      cfGuid: '',
      newRoles: {
        name: '',
        orgGuid: '',
        spaces: {},
        permissions: createUserRoleInOrg(
          undefined,
          undefined,
          undefined,
          undefined
        )
      },
      changedRoles: []
    },
    internalEvents: {
      types: {}
    },
    currentUserRoles: {
      internal: {
        isAdmin: false,
        scopes: []
      },
      cf: {
        [testSCFGuid]: getDefaultEndpointRoles()
      },
      state: getDefaultRolesRequestState()
    },
    updateAutoscalerPolicy: {
      policy: {
        instance_min_count: 1,
        instance_max_count: 10,
        scaling_rules_form: [],
        schedules: {
          timezone: '',
          recurring_schedule: [],
          specific_date: []
        }
      }
    },
  };
}

/* tslint:enable */
export function createBasicStoreModule(initialState: Partial<AppState> = getInitialTestStoreState()): ModuleWithProviders {
  return StoreModule.forRoot(
    appReducers,
    {
      initialState
    }
  );
}

export function registerEntitiesForTesting(entities) {
  entities.forEach(entity => {
    const entitySchema = new EntitySchema(entity.entityKey, entity.definition, entity.options, entity.relationKey);
    addEntityToCache(entitySchema);
    defaultCfEntitiesState[entity.entityKey] = {};
    registerAPIRequestEntity(entity.entityKey);
  });
}
