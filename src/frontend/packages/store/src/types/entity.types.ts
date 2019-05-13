import {
  IService,
  IServiceBinding,
  IServiceBroker,
  IServiceInstance,
  IServicePlan,
  IServicePlanVisibility,
  IUserProvidedServiceInstance,
} from '../../../core/src/core/cf-api-svc.types';
import {
  IApp,
  IDomain,
  IFeatureFlag,
  IOrganization,
  IRoute,
  ISecurityGroup,
  ISpace,
  IStack,
  IBuildpack,
} from '../../../core/src/core/cf-api.types';
import { IRequestEntityTypeState, IRequestTypeState, AppState } from '../app-state';
import {
  appEnvVarsSchemaKey,
  appEventSchemaKey,
  applicationSchemaKey,
  appStatsSchemaKey,
  appSummarySchemaKey,
  buildpackSchemaKey,
  cfUserSchemaKey,
  domainSchemaKey,
  endpointSchemaKey,
  featureFlagSchemaKey,
  gitBranchesSchemaKey,
  gitCommitSchemaKey,
  metricSchemaKey,
  organizationSchemaKey,
  privateDomainsSchemaKey,
  routeSchemaKey,
  securityGroupSchemaKey,
  serviceBindingSchemaKey,
  serviceBrokerSchemaKey,
  serviceInstancesSchemaKey,
  servicePlanSchemaKey,
  servicePlanVisibilitySchemaKey,
  serviceSchemaKey,
  spaceQuotaSchemaKey,
  spaceSchemaKey,
  stackSchemaKey,
  userFavoritesSchemaKey,
  userProvidedServiceInstanceSchemaKey,
} from '../helpers/entity-factory';
import { RequestInfoState } from '../reducers/api-request-reducer/types';
import { APIResource } from './api.types';
import { IMetrics } from './base-metric.types';
import { EndpointModel } from './endpoint.types';
import { GitBranch, GitCommit, GitRepo } from './git.types';
import { SystemInfo } from './system.types';
import { IFavoriteMetadata, UserFavorite } from './user-favorites.types';
import { CfUser } from './user.types';
import { AppStats } from './app-metadata.types';
import { UserProfileInfo } from './user-profile.types';

export interface IRequestDataState {
  endpoint: IRequestEntityTypeState<EndpointModel>;
  system: IRequestEntityTypeState<SystemInfo>;
  // featureFlag: IRequestEntityTypeState<IFeatureFlag>;
  // application: IRequestEntityTypeState<APIResource<IApp>>;
  // stack: IRequestEntityTypeState<APIResource<IStack>>;
  // space: IRequestEntityTypeState<APIResource<ISpace>>;
  // organization: IRequestEntityTypeState<APIResource<IOrganization>>;
  // route: IRequestEntityTypeState<APIResource<IRoute>>;
  // event: IRequestEntityTypeState<APIResource>;
  // gitBranches: IRequestEntityTypeState<APIResource<GitBranch>>;
  // gitCommits: IRequestEntityTypeState<APIResource<GitCommit>>;
  // domain: IRequestEntityTypeState<APIResource<IDomain>>;
  // user: IRequestEntityTypeState<APIResource<CfUser>>;
  // serviceInstance: IRequestEntityTypeState<APIResource<IServiceInstance>>;
  // servicePlan: IRequestEntityTypeState<APIResource<IServicePlan>>;
  // service: IRequestEntityTypeState<APIResource<IService>>;
  // serviceBinding: IRequestEntityTypeState<APIResource<IServiceBinding>>;
  // securityGroup: IRequestEntityTypeState<APIResource<ISecurityGroup>>;
  // servicePlanVisibility: IRequestEntityTypeState<APIResource<IServicePlanVisibility>>;
  // serviceBroker: IRequestEntityTypeState<APIResource<IServiceBroker>>;
  metrics: IRequestEntityTypeState<IMetrics>;
  userFavorites: IRequestEntityTypeState<UserFavorite<IFavoriteMetadata>>;
  // Extensibility
  // [name: string]: IRequestEntityTypeState<any>;
}
interface EntityValues {
  featureFlag: IRequestEntityTypeState<IFeatureFlag>;
  application: IRequestEntityTypeState<APIResource<IApp>>;
  stack: IRequestEntityTypeState<APIResource<IStack>>;
  space: IRequestEntityTypeState<APIResource<ISpace>>;
  organization: IRequestEntityTypeState<APIResource<IOrganization>>;
  route: IRequestEntityTypeState<APIResource<IRoute>>;
  event: IRequestEntityTypeState<APIResource>;
  gitBranches: IRequestEntityTypeState<APIResource<GitBranch>>;
  gitRepo: IRequestEntityTypeState<APIResource<GitRepo>>;
  gitCommits: IRequestEntityTypeState<APIResource<GitCommit>>;
  domain: IRequestEntityTypeState<APIResource<IDomain>>;
  user: IRequestEntityTypeState<APIResource<CfUser>>;
  serviceInstance: IRequestEntityTypeState<APIResource<IServiceInstance>>;
  servicePlan: IRequestEntityTypeState<APIResource<IServicePlan>>;
  service: IRequestEntityTypeState<APIResource<IService>>;
  serviceBinding: IRequestEntityTypeState<APIResource<IServiceBinding>>;
  securityGroup: IRequestEntityTypeState<APIResource<ISecurityGroup>>;
  servicePlanVisibility: IRequestEntityTypeState<APIResource<IServicePlanVisibility>>;
  serviceBroker: IRequestEntityTypeState<APIResource<IServiceBroker>>;
  buildpack: IRequestEntityTypeState<IBuildpack>;
  environmentVars: IRequestEntityTypeState<any>;
  stats: IRequestEntityTypeState<AppStats>;
  userProvidedServiceInstance: IRequestEntityTypeState<IUserProvidedServiceInstance>;
  userProfile: UserProfileInfo;
  cloudFoundryInfo: IRequestEntityTypeState<any>;
  private_domains: IRequestEntityTypeState<any>;
  space_quota_definition: IRequestEntityTypeState<any>;
}

// pagination: {
//   featureFlag: {},
//   serviceBroker: {},
//   securityGroup: {},
//   servicePlanVisibility: {},
//   buildpack: {},
//   application: {
//     applicationWall: {
//       pageCount: 1,
//       currentPage: 1,
//       totalResults: 0,
//       params: {
//         key: 'a'
//       },
//       ids: {
//         '1': [
//           '4e4858c4-24ab-4caf-87a8-7703d1da58a0',
//           '40a8cd59-956c-483c-ba7d-a7161e39e5eb',
//           '8b501d9e-4e27-4d7d-bdf5-8b20975137c0',
//           '1463eda1-e0e1-4c70-ae5f-4c408dc098f6',
//           '77c0759f-e857-4f4c-9785-299acf7b3f48',
//           'c5026174-fcf7-413b-bc9a-ac3419e30a91',
//           'b87f92ee-bcaa-4430-96d5-ef5b7a80214f',
//           'e629c3be-e5cc-4f24-bd6e-57a83c3e4f2e',
//           'a82554fb-6e81-48ba-839a-c52b55d8e37c',
//           'f5f40768-7416-4400-8026-832a43e3653e',
//           'e1b7b5e3-a33c-4bc2-b14d-ca7731988a7d',
//           'b862b599-7e32-43da-9956-b717d85e2f33',
//           '8f13b7ea-fe92-4bb4-a0e9-4c0effdf945c',
//           '13321c2f-9156-498f-a4e8-318f414e8817',
//           '44a63e90-8075-4708-90d9-262a81dcc77c',
//           'eb0fabf1-0f49-4840-b9fb-a78f2f5433b5',
//           'fd125f54-60dd-4cf3-b966-5a4391abf5fa',
//           '0af78017-8c76-4d09-ae08-003c4b297fa5',
//           '1b16f469-127b-440f-88ef-d4960c098bf6',
//           '1b4c9820-e648-4bd9-80c8-6b5a870938c4',
//           '83278b7e-feb9-41f1-ad03-06d08f9ce824',
//           '610fd394-2323-45da-91e6-36b83357ad54',
//           '98260847-6844-4674-8cbf-2d899171da2e',
//           'c58cb952-b75d-4ed6-9ca6-426daf13570b',
//           '6c6d0951-80f8-4420-b2b5-1ff404072ed6',
//           'f916c732-cce2-4500-bc88-e3ca19f1394b',
//           '7d046ff5-68af-4ed9-8a69-8e74b011563e',
//           'ea8220f9-fd47-4c88-9e12-9fb0611f3260',
//           '70b1b77f-71e2-4c06-8f4b-66486cff44af',
//           '122f72b1-4c63-45f4-a607-34fc152fc551',
//           '9830d869-e8c3-4ac7-b838-1e7927c4ee5f',
//           '34fea963-076b-48f6-9928-11b075c1c822',
//           '0fe1de5d-8e53-4f67-aafa-0c16228dc182',
//           '74980881-a122-469d-9acc-a2b965abd5e9',
//           '1532e7d5-643d-436e-bb74-7b60fd76265d',
//           'ca76c3a6-44c4-4d7e-9ae6-d8ced5e99c44',
//           '0fb015ed-a743-42e4-be08-9f09f05378bb',
//           '5d5f3b86-f50b-46b3-9ed8-64f1276f99a0',
//           'c6a7751f-182e-4b28-8c53-ca28243ee501',
//           'a54e9401-a7d9-4a36-b548-d78507057e69',
//           '658e24d6-da5f-4faa-a6ae-95bc787faa25',
//           'd27915f7-55b9-427e-969b-6b0ce5a67803',
//           'cdbe2006-8311-451c-aec1-72c36afd384d',
//           '278ba371-59ad-4504-9b58-47f67b0fde42',
//           'cb20a937-d20e-4f37-8d8a-0ec2a2a40599',
//           '7c324e6f-b9fc-4cd7-a977-48276413a805',
//           '29b09812-0b9c-4d10-9181-26436461914a',
//           '79dbd97e-0887-49f9-80c0-444cf1f16a96',
//           '683b899c-6235-406c-82dd-176db0404369',
//           'c9b34793-4b14-45ae-bd1f-15e005db8583',
//           '1511062e-7099-4dfb-9fa3-08d699bbd0ab',
//           'eb86d68d-fd31-42c1-a711-74691775c2d8',
//           '9daab4bc-6a94-401e-8456-730cf516d4c9',
//           '4fbec12e-b310-42c3-831c-e70c21cccc96',
//           'c5c8a9f2-a770-4ee5-8f7a-0eb6015dfe3a',
//           '8c92a1ca-b7ec-4811-883c-d33ac65fce73',
//           'de78601d-49ec-4ebe-9bd9-9cc104207f72',
//           '14016a5f-0509-47c7-852a-98ba05ab5da8',
//           '03b8edb2-bab9-47d2-89f8-0ca2dcfbb9fd',
//           '44ad1092-3247-4bf1-857e-644961506f7d',
//           'a9363ef2-78dc-43bf-9d15-c0c7a08a4f69',
//           'cfdd8369-e88e-4648-a7dd-69b9b09dddcf',
//           '2b5eb25a-e4bd-4316-a5c7-47adcba9f3f0',
//           '885f1a87-e465-4826-abdc-fd8beb6564da',
//           '994591c8-4f2a-4775-ad23-79ed33b99f62',
//           '8a02a394-e899-4eab-97d1-dee092fbdb57',
//           '85c42418-81c2-4ef5-bb4d-b1991f8f4f95',
//           '687f2c3b-c10c-4aee-bf70-b5525fd585b8',
//           'a63178d7-d123-4059-9976-74b7234318e6',
//           'fa48e6b4-9091-40bb-9e53-2159f1cc9782',
//           '365a890d-1e13-40eb-937f-d2f2ab9403eb',
//           '09543d4e-73ed-4e59-b3b5-727b841a5684',
//           'c318322d-8187-41a8-a1fd-bdae1ed1d24c',
//           '15c480aa-8215-4bc3-959a-0814967c091e',
//           'ab9c9db3-cb7d-4248-b53b-9d185b0555f6',
//           '4716e251-5af8-4144-a179-1871c7217dc0',
//           '6ce08a19-f87b-497c-bc93-3b5616ae40c2',
//           'ee165a5e-0f37-43c1-9744-4027b5144c3a',
//           '38081245-299e-42d3-847b-b08444da4553',
//           'a5ff68cd-baa2-4fa4-a688-e7b840af5073',
//           'db5ecb02-e05c-4742-9ad6-6f78b77d3dca',
//           '9111c1c9-04b9-4d71-b494-66a68bdeef52',
//           'f88c311c-4cd8-4bd5-a044-72b3d449690e',
//           '76ec34ca-61b8-4a75-8abc-4a800874a851',
//           'da42afa1-0bf6-4ad7-b644-40ac216efce5',
//           '90adbf54-bc68-487f-b60a-3967083c7b4e',
//           'c54e3d96-d4aa-441f-9b84-c313fedc06e3',
//           '17e397a7-fae2-40ee-93ef-70e428932a73',
//           '6c9ab603-c038-4b4b-b29e-7b440f8d2916',
//           'f4091dbe-2aff-492e-b476-1b14219fdaf8',
//           'c5ede50a-6787-4628-b379-848d55ee914e',
//           'b18c3b6f-87bf-48c4-a8b9-48749ab63d05',
//           '0e14fcb7-4a13-48bd-8d5e-fc52cbe19d2c',
//           '53d2f48c-48ec-4ece-9775-d8932f77e2db',
//           '879d3e3b-72df-455f-83d7-7c1183db150f',
//           'cf717053-f8e6-4cd3-9bd3-9c1b0701ed45',
//           'bce5e758-768d-4e92-b8d0-a3580752ddf5',
//           'ef33c4d2-104b-4e04-9635-dac7a6b2face',
//           '84a7f331-41c3-474f-9d3c-e8108f4702a6',
//           '34026306-3b74-4405-a489-d85ec67d7860',
//           '66aee61b-cf69-4a9d-966a-4dbc9ee981f1',
//           '92abdead-5c38-46fd-a4c7-6fc8a0ff8176',
//           '6141d1b5-1f9c-4fec-8511-3ad2f6ab71b0',
//           '10e5e215-dfc1-4bad-a3bf-5a191e5466b0',
//           'f06af5ef-bbf9-4285-a72a-67598cb62708',
//           '6f82f89d-7900-4cf8-8e91-50c78f968628',
//           '750f7bc2-c3f6-4bee-a743-9ad92a2df704',
//           'e6697556-a5e2-4d03-88e6-973e1351ed0b',
//           '689a218b-1b31-4d49-8766-84573372d77a',
//           '0195cbb8-2d1c-4e98-bef7-19287c643ff2',
//           '876b2f13-38fe-4925-bf3e-e0eccbcbb3a0',
//           '7ee817ad-770d-41b9-85f7-2a7c05ec7012',
//           'f6f5db80-c020-430a-ab11-d9fe5dfe925f',
//           'b08ea7b4-688e-48d9-a8d9-2d04b06efcdb',
//           'ef1c514f-5b19-4ce0-b840-6fe8d5f5bb46',
//           '0da9d02b-93b4-4828-8058-04ff243f43b9',
//           'e2a17f54-d0c3-4660-919b-b1ff585e6c05',
//           'a4e2cbfd-d11e-4b5f-a5f5-3739dfdc7d1d',
//           'a222dcfe-8a0d-4207-b049-14de5da5b0ae',
//           'aa33e150-c962-4982-a602-d9a149ddc61b',
//           '921aefc2-0bbc-4d8b-a438-1cc6dd6673e1',
//           '197bef61-1a81-44ed-8d96-028a88baa4b5',
//           'c73943a7-6e56-423b-b0c2-d5720f8ef9fc',
//           '02325b75-1199-4269-ba0a-8366a64b91af',
//           '3f3cd4e0-9cc8-41f6-9e6a-fce36ca839ae',
//           '6fa0182c-2b31-4b9a-ae05-11f766fadd31',
//           'e49a16ad-3afd-4320-a301-745eda859f36',
//           '219d24fd-77fa-402b-98c6-085e5ce5cedd',
//           '1c6acc17-5275-486f-84f2-f5c14b4afd7d',
//           'ce653e40-bd26-4278-85c9-773d0ed806a2',
//           '6c29687b-e2b0-4ba5-b17a-ed3b99c54f79',
//           '980877d5-ff09-400d-87d3-2db36ea763d6',
//           '1df7da98-ba42-4c95-af2a-3e1be5ce9824',
//           '7d2981da-6ee5-47ce-948f-4769a63be5ee',
//           '0c47e5fe-4b84-42b7-9ac7-6f4d52596a7f',
//           'af405ff9-2da6-47c0-af4d-1e72f55e621f',
//           'dbc5f72a-8703-4c9a-8919-b9e900392acb'
//         ]
//       },
//       pageRequests: {
//       },
//       clientPagination: {
//         pageSize: 5,
//         currentPage: 1,
//         totalResults: 50,
//         filter: {
//           string: '',
//           items: {}
//         },
//       }
//     },
//   },
//   stack: {},
//   space: {},
//   userFavorites: {},
//   organization: {
//     endpointOrgSpaceService: {
//       pageCount: 1,
//       currentPage: 1,
//       totalResults: 4,
//       ids: {
//         '1': [
//           '1ddbd64b-59a3-411f-a2b9-66e128b08be1',
//           '815a79fa-58dc-433f-b4a6-b3e06c4dda77',
//           'bd46bccd-6a1e-441a-b107-8969785054e0',
//           '4e229771-2d4d-4765-aed4-419cd937d1f8'
//         ]
//       },
//       pageRequests: {
//         '1': {
//           busy: false,
//           error: false,
//           message: ''
//         }
//       },
//       params: {
//         'results-per-page': 100,
//         page: 1,
//         'inline-relations-depth': 2,
//         q: []
//       },
//       clientPagination: {
//         pageSize: 9,
//         currentPage: 1,
//         filter: {
//           string: '',
//           items: {}
//         },
//         totalResults: 4
//       }
//     },
//     'cf-organizations': {
//       pageCount: 1,
//       currentPage: 1,
//       totalResults: 4,
//       ids: {
//         '1': [
//           '1ddbd64b-59a3-411f-a2b9-66e128b08be1',
//           '815a79fa-58dc-433f-b4a6-b3e06c4dda77',
//           'bd46bccd-6a1e-441a-b107-8969785054e0',
//           '4e229771-2d4d-4765-aed4-419cd937d1f8'
//         ]
//       },
//       pageRequests: {
//         '1': {
//           busy: false,
//           error: false,
//           message: ''
//         }
//       },
//       params: {
//         'results-per-page': 100,
//         page: 1,
//         'inline-relations-depth': 2,
//         q: []
//       },
//       clientPagination: {
//         pageSize: 9,
//         currentPage: 1,
//         filter: {
//           string: '',
//           items: {}
//         },
//         totalResults: 4
//       },
//     }
//   },
//   route: {},
//   event: {
//     'app-events:01ccda9d-8f40-4dd0-bc39-08eea68e364f4e4858c4-24ab-4caf-87a8-7703d1da58a0': {
//       pageCount: 1,
//       currentPage: 1,
//       totalResults: 0,
//       params: {
//         key: 'a'
//       },
//       ids: {
//         '1': [
//           '4e4858c4-24ab-4caf-87a8-7703d1da58a0',
//           '40a8cd59-956c-483c-ba7d-a7161e39e5eb',
//           '8b501d9e-4e27-4d7d-bdf5-8b20975137c0',
//           '1463eda1-e0e1-4c70-ae5f-4c408dc098f6',
//           '77c0759f-e857-4f4c-9785-299acf7b3f48',
//           'c5026174-fcf7-413b-bc9a-ac3419e30a91',
//           'b87f92ee-bcaa-4430-96d5-ef5b7a80214f',
//           'e629c3be-e5cc-4f24-bd6e-57a83c3e4f2e',
//           'a82554fb-6e81-48ba-839a-c52b55d8e37c',
//           'f5f40768-7416-4400-8026-832a43e3653e',
//           'e1b7b5e3-a33c-4bc2-b14d-ca7731988a7d',
//           'b862b599-7e32-43da-9956-b717d85e2f33',
//           '8f13b7ea-fe92-4bb4-a0e9-4c0effdf945c',
//           '13321c2f-9156-498f-a4e8-318f414e8817',
//           '44a63e90-8075-4708-90d9-262a81dcc77c',
//           'eb0fabf1-0f49-4840-b9fb-a78f2f5433b5',
//           'fd125f54-60dd-4cf3-b966-5a4391abf5fa',
//           '0af78017-8c76-4d09-ae08-003c4b297fa5',
//           '1b16f469-127b-440f-88ef-d4960c098bf6',
//           '1b4c9820-e648-4bd9-80c8-6b5a870938c4',
//           '83278b7e-feb9-41f1-ad03-06d08f9ce824',
//           '610fd394-2323-45da-91e6-36b83357ad54',
//           '98260847-6844-4674-8cbf-2d899171da2e',
//           'c58cb952-b75d-4ed6-9ca6-426daf13570b',
//           '6c6d0951-80f8-4420-b2b5-1ff404072ed6',
//           'f916c732-cce2-4500-bc88-e3ca19f1394b',
//           '7d046ff5-68af-4ed9-8a69-8e74b011563e',
//           'ea8220f9-fd47-4c88-9e12-9fb0611f3260',
//           '70b1b77f-71e2-4c06-8f4b-66486cff44af',
//           '122f72b1-4c63-45f4-a607-34fc152fc551',
//           '9830d869-e8c3-4ac7-b838-1e7927c4ee5f',
//           '34fea963-076b-48f6-9928-11b075c1c822',
//           '0fe1de5d-8e53-4f67-aafa-0c16228dc182',
//           '74980881-a122-469d-9acc-a2b965abd5e9',
//           '1532e7d5-643d-436e-bb74-7b60fd76265d',
//           'ca76c3a6-44c4-4d7e-9ae6-d8ced5e99c44',
//           '0fb015ed-a743-42e4-be08-9f09f05378bb',
//           '5d5f3b86-f50b-46b3-9ed8-64f1276f99a0',
//           'c6a7751f-182e-4b28-8c53-ca28243ee501',
//           'a54e9401-a7d9-4a36-b548-d78507057e69',
//           '658e24d6-da5f-4faa-a6ae-95bc787faa25',
//           'd27915f7-55b9-427e-969b-6b0ce5a67803',
//           'cdbe2006-8311-451c-aec1-72c36afd384d',
//           '278ba371-59ad-4504-9b58-47f67b0fde42',
//           'cb20a937-d20e-4f37-8d8a-0ec2a2a40599',
//           '7c324e6f-b9fc-4cd7-a977-48276413a805',
//           '29b09812-0b9c-4d10-9181-26436461914a',
//           '79dbd97e-0887-49f9-80c0-444cf1f16a96',
//           '683b899c-6235-406c-82dd-176db0404369',
//           'c9b34793-4b14-45ae-bd1f-15e005db8583',
//           '1511062e-7099-4dfb-9fa3-08d699bbd0ab',
//           'eb86d68d-fd31-42c1-a711-74691775c2d8',
//           '9daab4bc-6a94-401e-8456-730cf516d4c9',
//           '4fbec12e-b310-42c3-831c-e70c21cccc96',
//           'c5c8a9f2-a770-4ee5-8f7a-0eb6015dfe3a',
//           '8c92a1ca-b7ec-4811-883c-d33ac65fce73',
//           'de78601d-49ec-4ebe-9bd9-9cc104207f72',
//           '14016a5f-0509-47c7-852a-98ba05ab5da8',
//           '03b8edb2-bab9-47d2-89f8-0ca2dcfbb9fd',
//           '44ad1092-3247-4bf1-857e-644961506f7d',
//           'a9363ef2-78dc-43bf-9d15-c0c7a08a4f69',
//           'cfdd8369-e88e-4648-a7dd-69b9b09dddcf',
//           '2b5eb25a-e4bd-4316-a5c7-47adcba9f3f0',
//           '885f1a87-e465-4826-abdc-fd8beb6564da',
//           '994591c8-4f2a-4775-ad23-79ed33b99f62',
//           '8a02a394-e899-4eab-97d1-dee092fbdb57',
//           '85c42418-81c2-4ef5-bb4d-b1991f8f4f95',
//           '687f2c3b-c10c-4aee-bf70-b5525fd585b8',
//           'a63178d7-d123-4059-9976-74b7234318e6',
//           'fa48e6b4-9091-40bb-9e53-2159f1cc9782',
//           '365a890d-1e13-40eb-937f-d2f2ab9403eb',
//           '09543d4e-73ed-4e59-b3b5-727b841a5684',
//           'c318322d-8187-41a8-a1fd-bdae1ed1d24c',
//           '15c480aa-8215-4bc3-959a-0814967c091e',
//           'ab9c9db3-cb7d-4248-b53b-9d185b0555f6',
//           '4716e251-5af8-4144-a179-1871c7217dc0',
//           '6ce08a19-f87b-497c-bc93-3b5616ae40c2',
//           'ee165a5e-0f37-43c1-9744-4027b5144c3a',
//           '38081245-299e-42d3-847b-b08444da4553',
//           'a5ff68cd-baa2-4fa4-a688-e7b840af5073',
//           'db5ecb02-e05c-4742-9ad6-6f78b77d3dca',
//           '9111c1c9-04b9-4d71-b494-66a68bdeef52',
//           'f88c311c-4cd8-4bd5-a044-72b3d449690e',
//           '76ec34ca-61b8-4a75-8abc-4a800874a851',
//           'da42afa1-0bf6-4ad7-b644-40ac216efce5',
//           '90adbf54-bc68-487f-b60a-3967083c7b4e',
//           'c54e3d96-d4aa-441f-9b84-c313fedc06e3',
//           '17e397a7-fae2-40ee-93ef-70e428932a73',
//           '6c9ab603-c038-4b4b-b29e-7b440f8d2916',
//           'f4091dbe-2aff-492e-b476-1b14219fdaf8',
//           'c5ede50a-6787-4628-b379-848d55ee914e',
//           'b18c3b6f-87bf-48c4-a8b9-48749ab63d05',
//           '0e14fcb7-4a13-48bd-8d5e-fc52cbe19d2c',
//           '53d2f48c-48ec-4ece-9775-d8932f77e2db',
//           '879d3e3b-72df-455f-83d7-7c1183db150f',
//           'cf717053-f8e6-4cd3-9bd3-9c1b0701ed45',
//           'bce5e758-768d-4e92-b8d0-a3580752ddf5',
//           'ef33c4d2-104b-4e04-9635-dac7a6b2face',
//           '84a7f331-41c3-474f-9d3c-e8108f4702a6',
//           '34026306-3b74-4405-a489-d85ec67d7860',
//           '66aee61b-cf69-4a9d-966a-4dbc9ee981f1',
//           '92abdead-5c38-46fd-a4c7-6fc8a0ff8176',
//           '6141d1b5-1f9c-4fec-8511-3ad2f6ab71b0',
//           '10e5e215-dfc1-4bad-a3bf-5a191e5466b0',
//           'f06af5ef-bbf9-4285-a72a-67598cb62708',
//           '6f82f89d-7900-4cf8-8e91-50c78f968628',
//           '750f7bc2-c3f6-4bee-a743-9ad92a2df704',
//           'e6697556-a5e2-4d03-88e6-973e1351ed0b',
//           '689a218b-1b31-4d49-8766-84573372d77a',
//           '0195cbb8-2d1c-4e98-bef7-19287c643ff2',
//           '876b2f13-38fe-4925-bf3e-e0eccbcbb3a0',
//           '7ee817ad-770d-41b9-85f7-2a7c05ec7012',
//           'f6f5db80-c020-430a-ab11-d9fe5dfe925f',
//           'b08ea7b4-688e-48d9-a8d9-2d04b06efcdb',
//           'ef1c514f-5b19-4ce0-b840-6fe8d5f5bb46',
//           '0da9d02b-93b4-4828-8058-04ff243f43b9',
//           'e2a17f54-d0c3-4660-919b-b1ff585e6c05',
//           'a4e2cbfd-d11e-4b5f-a5f5-3739dfdc7d1d',
//           'a222dcfe-8a0d-4207-b049-14de5da5b0ae',
//           'aa33e150-c962-4982-a602-d9a149ddc61b',
//           '921aefc2-0bbc-4d8b-a438-1cc6dd6673e1',
//           '197bef61-1a81-44ed-8d96-028a88baa4b5',
//           'c73943a7-6e56-423b-b0c2-d5720f8ef9fc',
//           '02325b75-1199-4269-ba0a-8366a64b91af',
//           '3f3cd4e0-9cc8-41f6-9e6a-fce36ca839ae',
//           '6fa0182c-2b31-4b9a-ae05-11f766fadd31',
//           'e49a16ad-3afd-4320-a301-745eda859f36',
//           '219d24fd-77fa-402b-98c6-085e5ce5cedd',
//           '1c6acc17-5275-486f-84f2-f5c14b4afd7d',
//           'ce653e40-bd26-4278-85c9-773d0ed806a2',
//           '6c29687b-e2b0-4ba5-b17a-ed3b99c54f79',
//           '980877d5-ff09-400d-87d3-2db36ea763d6',
//           '1df7da98-ba42-4c95-af2a-3e1be5ce9824',
//           '7d2981da-6ee5-47ce-948f-4769a63be5ee',
//           '0c47e5fe-4b84-42b7-9ac7-6f4d52596a7f',
//           'af405ff9-2da6-47c0-af4d-1e72f55e621f',
//           'dbc5f72a-8703-4c9a-8919-b9e900392acb'
//         ]
//       },
//       pageRequests: {
//       },
//       clientPagination: {
//         pageSize: 5,
//         currentPage: 1,
//         totalResults: 50,
//         filter: {
//           string: '',
//           items: {}
//         },
//       }
//     }
//   },
//   endpoint: {
//     "endpoint-list": {
//       pageCount: 1,
//       currentPage: 1,
//       totalResults: 0,
//       params: {
//         key: 'a'
//       },
//       pageRequests: {
//       },
//       ids: {},
//       clientPagination: {
//         pageSize: 5,
//         currentPage: 1,
//         totalResults: 50,
//         filter: {
//           string: '',
//           items: {}
//         },
//       }
//     }
//   },
//   environmentVars: {},
//   stats: {},
//   user: {
//     endpointUsersService: {
//       pageCount: 1,
//       currentPage: 1,
//       totalResults: 3,
//       ids: {
//         '1': [
//           'bcf78136-6225-4515-bf8e-a32243deea0c',
//           'hcf_auto_config',
//           'b950b10c-c360-4bec-83c9-333c76cbbbe1'
//         ]
//       },
//       pageRequests: {
//         '1': {
//           busy: false,
//           error: false,
//           message: ''
//         }
//       },
//       params: {
//         'results-per-page': 100,
//         page: 1,
//         'inline-relations-depth': 1,
//         q: []
//       },
//       clientPagination: {
//         pageSize: 9,
//         currentPage: 1,
//         filter: {
//           string: '',
//           items: {}
//         },
//         totalResults: 3
//       }
//     }
//   },
//   serviceInstance: {},
//   serviceBinding: {},
//   service: {},
//   gitCommits: {},
//   domain: {},
//   metrics: {},
//   servicePlan: {},
//   userProvidedServiceInstance: {},
//   cloudFoundryInfo: {}
// }
// type EntityValues = {
//   cfFeatureFlag: IRequestEntityTypeState<IFeatureFlag>;
//   cfApplication: IRequestEntityTypeState<APIResource<IApp>>;
//   cfStack: IRequestEntityTypeState<APIResource<IStack>>;
//   cfSpace: IRequestEntityTypeState<APIResource<ISpace>>;
//   cfOrganization: IRequestEntityTypeState<APIResource<IOrganization>>;
//   cfRoute: IRequestEntityTypeState<APIResource<IRoute>>;
//   cfEvent: IRequestEntityTypeState<APIResource>;
//   cfGitBranches: IRequestEntityTypeState<APIResource<GitBranch>>;
//   cfGitCommits: IRequestEntityTypeState<APIResource<GitCommit>>;
//   cfGomain: IRequestEntityTypeState<APIResource<IDomain>>;
//   cfUser: IRequestEntityTypeState<APIResource<CfUser>>;
//   cfServiceInstance: IRequestEntityTypeState<APIResource<IServiceInstance>>;
//   cfServicePlan: IRequestEntityTypeState<APIResource<IServicePlan>>;
//   cfService: IRequestEntityTypeState<APIResource<IService>>;
//   cfServiceBinding: IRequestEntityTypeState<APIResource<IServiceBinding>>;
//   cfSecurityGroup: IRequestEntityTypeState<APIResource<ISecurityGroup>>;
//   cfServicePlanVisibility: IRequestEntityTypeState<APIResource<IServicePlanVisibility>>;
//   cfServiceBroker: IRequestEntityTypeState<APIResource<IServiceBroker>>;
// };

export type ExtendedRequestState<T extends string | number | symbol, Y> = Record<T, Y>;

export type ExtendedRequestDataState<
  E extends Record<keyof E, any>,
  > = {
    [P in keyof E]: IRequestEntityTypeState<E[keyof E]>
  };

export interface CFRequestDataState extends EntityValues, IRequestDataState { }

// class temp<T> {
//   data: T;
// }
// const c = new temp<CFAppState>();
// c.data.cfApplication;

// const d = new temp<CFRequestDataState>();
// d.data.cfApplication;

// const e = new temp<AppState<CFRequestDataState>>();
// e.data.pagination.;

// application: IRequestEntityTypeState<RequestInfoState>;
//   system: IRequestEntityTypeState<RequestInfoState>;
//   featureFlag: IRequestEntityTypeState<RequestInfoState>;
//   stack: IRequestEntityTypeState<RequestInfoState>;
//   space: IRequestEntityTypeState<RequestInfoState>;
//   organization: IRequestEntityTypeState<RequestInfoState>;
//   route: IRequestEntityTypeState<RequestInfoState>;
//   event: IRequestEntityTypeState<RequestInfoState>;
//   gitBranches: IRequestEntityTypeState<RequestInfoState>;
//   gitCommits: IRequestEntityTypeState<RequestInfoState>;
//   domain: IRequestEntityTypeState<RequestInfoState>;
//   user: IRequestEntityTypeState<RequestInfoState>;
//   serviceInstance: IRequestEntityTypeState<RequestInfoState>;
//   servicePlan: IRequestEntityTypeState<RequestInfoState>;
//   service: IRequestEntityTypeState<RequestInfoState>;
//   serviceBinding: IRequestEntityTypeState<RequestInfoState>;
//   securityGroup: IRequestEntityTypeState<RequestInfoState>;
//   servicePlanVisibility: IRequestEntityTypeState<RequestInfoState>;
//   serviceBroker: IRequestEntityTypeState<RequestInfoState>;

export interface IRequestState extends IRequestTypeState {
  endpoint: IRequestEntityTypeState<RequestInfoState>;
  userFavorites: IRequestEntityTypeState<RequestInfoState>;
}


export const defaultCfEntitiesState = {
  [applicationSchemaKey]: {},
  [stackSchemaKey]: {},
  [spaceSchemaKey]: {},
  [organizationSchemaKey]: {},
  [routeSchemaKey]: {},
  [appEventSchemaKey]: {},
  [endpointSchemaKey]: {},
  [gitBranchesSchemaKey]: {},
  [gitCommitSchemaKey]: {},
  [cfUserSchemaKey]: {},
  [domainSchemaKey]: {},
  [appEnvVarsSchemaKey]: {},
  [appStatsSchemaKey]: {},
  [appSummarySchemaKey]: {},
  [serviceInstancesSchemaKey]: {},
  [servicePlanSchemaKey]: {},
  [serviceSchemaKey]: {},
  [serviceBindingSchemaKey]: {},
  [buildpackSchemaKey]: {},
  [securityGroupSchemaKey]: {},
  [featureFlagSchemaKey]: {},
  [privateDomainsSchemaKey]: {},
  [spaceQuotaSchemaKey]: {},
  [metricSchemaKey]: {},
  [servicePlanVisibilitySchemaKey]: {},
  [serviceBrokerSchemaKey]: {},
  [userFavoritesSchemaKey]: {},
  [userProvidedServiceInstanceSchemaKey]: []
};
