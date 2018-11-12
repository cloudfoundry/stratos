import {
  IService,
  IServiceBinding,
  IServiceBroker,
  IServiceInstance,
  IServicePlan,
  IServicePlanVisibility,
} from '../../core/cf-api-svc.types';
import { IApp, IDomain, IFeatureFlag, IOrganization, IRoute, ISecurityGroup, ISpace, IStack } from '../../core/cf-api.types';
import { KubernetesService } from '../../custom/kubernetes/services/kubernetes.service';
import {
  KubernetesApp,
  KubernetesNamespace,
  KubernetesNode,
  KubernetesPod,
  KubernetesStatefulSet,
} from '../../custom/kubernetes/store/kube.types';
import { IRequestEntityTypeState, IRequestTypeState } from '../app-state';
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
  githubBranchesSchemaKey,
  githubCommitSchemaKey,
  kubernetesAppsSchemaKey,
  kubernetesNamespacesSchemaKey,
  kubernetesNodesSchemaKey,
  kubernetesPodsSchemaKey,
  kubernetesServicesSchemaKey,
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
  kubernetesStatefulSetsSchemaKey,
  kubernetesDeploymentsSchemaKey,
} from '../helpers/entity-factory';
import { RequestInfoState } from '../reducers/api-request-reducer/types';
import { APIResource } from './api.types';
import { IMetrics } from './base-metric.types';
import { EndpointModel } from './endpoint.types';
import { GitBranch, GithubCommit } from './github.types';
import { SystemInfo } from './system.types';
import { CfUser } from './user.types';

export interface IRequestDataState extends IRequestTypeState {
  endpoint: IRequestEntityTypeState<EndpointModel>;
  system: IRequestEntityTypeState<SystemInfo>;
  featureFlag: IRequestEntityTypeState<IFeatureFlag>;
  application: IRequestEntityTypeState<APIResource<IApp>>;
  stack: IRequestEntityTypeState<APIResource<IStack>>;
  space: IRequestEntityTypeState<APIResource<ISpace>>;
  organization: IRequestEntityTypeState<APIResource<IOrganization>>;
  route: IRequestEntityTypeState<APIResource<IRoute>>;
  event: IRequestEntityTypeState<APIResource>;
  githubBranches: IRequestEntityTypeState<APIResource<GitBranch>>;
  githubCommits: IRequestEntityTypeState<APIResource<GithubCommit>>;
  domain: IRequestEntityTypeState<APIResource<IDomain>>;
  user: IRequestEntityTypeState<APIResource<CfUser>>;
  serviceInstance: IRequestEntityTypeState<APIResource<IServiceInstance>>;
  servicePlan: IRequestEntityTypeState<APIResource<IServicePlan>>;
  service: IRequestEntityTypeState<APIResource<IService>>;
  serviceBinding: IRequestEntityTypeState<APIResource<IServiceBinding>>;
  securityGroup: IRequestEntityTypeState<APIResource<ISecurityGroup>>;
  servicePlanVisibility: IRequestEntityTypeState<APIResource<IServicePlanVisibility>>;
  serviceBroker: IRequestEntityTypeState<APIResource<IServiceBroker>>;
  metrics: IRequestEntityTypeState<IMetrics>;
  kubernetesNode: IRequestEntityTypeState<KubernetesNode>;
  kubernetesPod: IRequestEntityTypeState<KubernetesPod>;
  kubernetesNamespace: IRequestEntityTypeState<KubernetesNamespace>;
  kubernetesApp: IRequestEntityTypeState<KubernetesApp>;
  kubernetesService: IRequestEntityTypeState<KubernetesService>;
  kubernetesStatefulSet: IRequestEntityTypeState<KubernetesStatefulSet>;
  kubernetesDeployment: IRequestEntityTypeState<KubernetesStatefulSet>;
}

export interface IRequestState extends IRequestTypeState {
  application: IRequestEntityTypeState<RequestInfoState>;
  endpoint: IRequestEntityTypeState<RequestInfoState>;
  system: IRequestEntityTypeState<RequestInfoState>;
  featureFlag: IRequestEntityTypeState<RequestInfoState>;
  stack: IRequestEntityTypeState<RequestInfoState>;
  space: IRequestEntityTypeState<RequestInfoState>;
  organization: IRequestEntityTypeState<RequestInfoState>;
  route: IRequestEntityTypeState<RequestInfoState>;
  event: IRequestEntityTypeState<RequestInfoState>;
  githubBranches: IRequestEntityTypeState<RequestInfoState>;
  githubCommits: IRequestEntityTypeState<RequestInfoState>;
  domain: IRequestEntityTypeState<RequestInfoState>;
  user: IRequestEntityTypeState<RequestInfoState>;
  serviceInstance: IRequestEntityTypeState<RequestInfoState>;
  servicePlan: IRequestEntityTypeState<RequestInfoState>;
  service: IRequestEntityTypeState<RequestInfoState>;
  serviceBinding: IRequestEntityTypeState<RequestInfoState>;
  securityGroup: IRequestEntityTypeState<RequestInfoState>;
  servicePlanVisibility: IRequestEntityTypeState<RequestInfoState>;
  serviceBroker: IRequestEntityTypeState<RequestInfoState>;
  kubernetesNode: IRequestEntityTypeState<RequestInfoState>;
  kubernetesPod: IRequestEntityTypeState<RequestInfoState>;
  kubernetesNamespace: IRequestEntityTypeState<RequestInfoState>;
  kubernetesApp: IRequestEntityTypeState<RequestInfoState>;
  kubernetesService: IRequestEntityTypeState<RequestInfoState>;
  kubernetesStatefulSet: IRequestEntityTypeState<RequestInfoState>;
  kubernetesDeployment: IRequestEntityTypeState<RequestInfoState>;
}


export const defaultCfEntitiesState = {
  [applicationSchemaKey]: {},
  [stackSchemaKey]: {},
  [spaceSchemaKey]: {},
  [organizationSchemaKey]: {},
  [routeSchemaKey]: {},
  [appEventSchemaKey]: {},
  [endpointSchemaKey]: {},
  [githubBranchesSchemaKey]: {},
  [githubCommitSchemaKey]: {},
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
  [kubernetesNodesSchemaKey]: {},
  [kubernetesPodsSchemaKey]: {},
  [kubernetesNamespacesSchemaKey]: {},
  [kubernetesAppsSchemaKey]: {},
  [kubernetesServicesSchemaKey]: {},
  [kubernetesStatefulSetsSchemaKey]: {},
  [kubernetesDeploymentsSchemaKey]: {},
};
