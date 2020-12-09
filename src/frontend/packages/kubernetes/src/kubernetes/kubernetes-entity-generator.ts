import { Compiler, Injector } from '@angular/core';
import { Validators } from '@angular/forms';
import moment from 'moment';

import { BaseEndpointAuth } from '../../../core/src/core/endpoint-auth';
import {
  OrchestratedActionBuilderConfig,
  OrchestratedActionBuilders,
} from '../../../store/src/entity-catalog/action-orchestrator/action-orchestrator';
import {
  StratosBaseCatalogEntity,
  StratosCatalogEndpointEntity,
  StratosCatalogEntity,
} from '../../../store/src/entity-catalog/entity-catalog-entity/entity-catalog-entity';
import {
  IStratosEntityDefinition,
  StratosEndpointExtensionDefinition,
} from '../../../store/src/entity-catalog/entity-catalog.types';
import { EndpointAuthTypeConfig, EndpointType } from '../../../store/src/extension-types';
import { metricEntityType } from '../../../store/src/helpers/stratos-entity-factory';
import { entityFetchedWithoutError } from '../../../store/src/operators';
import { IFavoriteMetadata } from '../../../store/src/types/user-favorites.types';
import { KubernetesAWSAuthFormComponent } from './auth-forms/kubernetes-aws-auth-form/kubernetes-aws-auth-form.component';
import {
  KubernetesCertsAuthFormComponent,
} from './auth-forms/kubernetes-certs-auth-form/kubernetes-certs-auth-form.component';
import {
  KubernetesConfigAuthFormComponent,
} from './auth-forms/kubernetes-config-auth-form/kubernetes-config-auth-form.component';
import { KubernetesGKEAuthFormComponent } from './auth-forms/kubernetes-gke-auth-form/kubernetes-gke-auth-form.component';
import {
  KubernetesSATokenAuthFormComponent,
} from './auth-forms/kubernetes-serviceaccount-auth-form/kubernetes-serviceaccount-auth-form.component';
import { KubeConfigRegistrationComponent } from './kube-config-registration/kube-config-registration.component';
import {
  addKubernetesEntitySchema,
  analysisReportEntityType,
  KUBERNETES_ENDPOINT_TYPE,
  kubernetesConfigMapEntityType,
  kubernetesDashboardEntityType,
  kubernetesDeploymentsEntityType,
  kubernetesEntityFactory,
  KubernetesEntitySchema,
  kubernetesNamespacesEntityType,
  kubernetesNodesEntityType,
  kubernetesPodsEntityType,
  kubernetesServicesEntityType,
  kubernetesStatefulSetsEntityType,
} from './kubernetes-entity-factory';
import {
  createKubeResourceActionBuilder,
  KubeResourceActionBuilders,
} from './store/action-builders/kube-resource.action-builder';
import {
  AnalysisReportsActionBuilders,
  analysisReportsActionBuilders,
  KubeDashboardActionBuilders,
  kubeDashboardActionBuilders,
  KubeDeploymentActionBuilders,
  kubeDeploymentActionBuilders,
  KubeNamespaceActionBuilders,
  kubeNamespaceActionBuilders,
  KubeNodeActionBuilders,
  kubeNodeActionBuilders,
  KubePodActionBuilders,
  kubePodActionBuilders,
  KubeServiceActionBuilders,
  kubeServiceActionBuilders,
  KubeStatefulSetsActionBuilders,
  kubeStatefulSetsActionBuilders,
} from './store/action-builders/kube.action-builders';
import { getGuidFromKubePodObj } from './store/kube.getIds';
import {
  AnalysisReport,
  BasicKubeAPIResource,
  KubeAPIResource,
  KubeResourceEntityDefinition,
  KubernetesConfigMap,
  KubernetesDeployment,
  KubernetesNamespace,
  KubernetesNode,
  KubernetesPod,
  KubernetesStatefulSet,
  KubeService,
  KubeServiceAccount,
} from './store/kube.types';
import { KubeDashboardStatus } from './store/kubernetes.effects';
import { generateWorkloadsEntities } from './workloads/store/workloads-entity-generator';


export interface IKubeResourceFavMetadata extends IFavoriteMetadata {
  guid: string;
  kubeGuid: string;
  name: string;
}

const enum KubeEndpointAuthTypes {
  CERT_AUTH = 'kube-cert-auth',
  CONFIG = 'kubeconfig',
  CONFIG_AZ = 'kubeconfig-az',
  AWS_IAM = 'aws-iam',
  GKE = 'gke-auth',
  TOKEN = 'k8s-token',
}

const kubeAuthTypeMap: { [type: string]: EndpointAuthTypeConfig, } = {
  [KubeEndpointAuthTypes.CERT_AUTH]: {
    value: KubeEndpointAuthTypes.CERT_AUTH,
    name: 'Kubernetes Cert Auth',
    form: {
      cert: ['', Validators.required],
      certKey: ['', Validators.required],
    },
    types: new Array<EndpointType>(),
    component: KubernetesCertsAuthFormComponent
  },
  [KubeEndpointAuthTypes.CONFIG]: {
    value: KubeEndpointAuthTypes.CONFIG,
    name: 'Kube Config',
    form: {
      kubeconfig: ['', Validators.required],
    },
    types: new Array<EndpointType>(),
    component: KubernetesConfigAuthFormComponent
  },
  [KubeEndpointAuthTypes.CONFIG_AZ]: {
    value: KubeEndpointAuthTypes.CONFIG_AZ,
    name: 'Azure AKS',
    form: {
      kubeconfig: ['', Validators.required],
    },
    types: new Array<EndpointType>(),
    component: KubernetesConfigAuthFormComponent
  },
  [KubeEndpointAuthTypes.AWS_IAM]: {
    value: KubeEndpointAuthTypes.AWS_IAM,
    name: 'AWS IAM (EKS)',
    form: {
      cluster: ['', Validators.required],
      access_key: ['', Validators.required],
      secret_key: ['', Validators.required],
    },
    types: new Array<EndpointType>(),
    component: KubernetesAWSAuthFormComponent
  },
  [KubeEndpointAuthTypes.GKE]: {
    value: KubeEndpointAuthTypes.GKE,
    name: 'GKE',
    form: {
      gkeconfig: ['', Validators.required],
    },
    types: new Array<EndpointType>(),
    component: KubernetesGKEAuthFormComponent,
    help: '/core/assets/custom/help/en/connecting_gke.md'
  },
  [KubeEndpointAuthTypes.TOKEN]: {
    value: KubeEndpointAuthTypes.TOKEN,
    name: 'Service Account Token',
    form: {
      token: ['', Validators.required],
    },
    types: new Array<EndpointType>(),
    component: KubernetesSATokenAuthFormComponent
  }
};

class KubeResourceEntityHelper {

  public static generate<
    B = any,
    C extends OrchestratedActionBuilderConfig = OrchestratedActionBuilders
  >(
    endpointDefinition: StratosEndpointExtensionDefinition,
    defn: KubeResourceEntityDefinition<IFavoriteMetadata, B, C>
  ): StratosCatalogEntity<IFavoriteMetadata, B, C> {
    // Simplify registration by registering the schema in the entity cache
    addKubernetesEntitySchema(defn.type, new KubernetesEntitySchema(defn.type, {}, { idAttribute: getGuidFromKubePodObj }));

    defn.labelTab = defn.labelTab || defn.labelPlural || `${defn.label}s`;

    if (defn.apiNamespaced !== false) {
      defn.apiNamespaced = true;
    }

    const schema = kubernetesEntityFactory(defn.type);
    const d: IStratosEntityDefinition = {
      ...defn,
      endpoint: endpointDefinition,
      schema,
      iconFont: defn.iconFont || 'stratos-icons',
      labelPlural: defn.labelPlural || `${defn.label}s`
    };

    const entity = defn.getKubeCatalogEntity ? defn.getKubeCatalogEntity(d) : new StratosCatalogEntity<IFavoriteMetadata, B, C>(d, {
      actionBuilders: createKubeResourceActionBuilder(d.type) as unknown as C
    });

    if (defn.canFavorite && defn.getIsValid) {
      entity.builders.entityBuilder = {
        getIsValid: defn.getIsValid,
        getMetadata: (resource: any) => {
          return {
            endpointId: resource.kubeGuid,
            guid: resource.metadata.uid,
            kubeGuid: resource.kubeGuid,
            name: resource.metadata.name,
          };
        },
        getLink: metadata => `/kubernetes/${metadata.endpointId}/resource/${defn.type}`,
        getGuid: resource => schema.getId(resource),
      };
    }

    return entity;
  }
}


/**
 * A strongly typed collection of Kube Catalog Entities.
 * This can be used to access functionality exposed by each specific type, such as get, update, delete, etc
 */
export class KubeEntityCatalog {

  public endpoint: StratosCatalogEndpointEntity;
  public statefulSet: StratosCatalogEntity<IFavoriteMetadata, KubernetesStatefulSet, KubeStatefulSetsActionBuilders>;
  public pod: StratosCatalogEntity<IFavoriteMetadata, KubernetesPod, KubePodActionBuilders>;
  public deployment: StratosCatalogEntity<IFavoriteMetadata, KubernetesDeployment, KubeDeploymentActionBuilders>;
  public node: StratosCatalogEntity<IFavoriteMetadata, KubernetesNode, KubeNodeActionBuilders>;
  public namespace: StratosCatalogEntity<IFavoriteMetadata, KubernetesNamespace, KubeNamespaceActionBuilders>;
  public service: StratosCatalogEntity<IFavoriteMetadata, KubeService, KubeServiceActionBuilders>;
  public dashboard: StratosCatalogEntity<IFavoriteMetadata, KubeDashboardStatus, KubeDashboardActionBuilders>;
  public analysisReport: StratosCatalogEntity<undefined, AnalysisReport, AnalysisReportsActionBuilders>;
  public configMap: StratosCatalogEntity<IFavoriteMetadata, KubernetesConfigMap, KubeResourceActionBuilders>;
  public metrics: StratosCatalogEntity;

  public secrets: StratosCatalogEntity<IFavoriteMetadata, KubeAPIResource, KubeResourceActionBuilders>;
  public pvc: StratosCatalogEntity<IFavoriteMetadata, KubeAPIResource, KubeResourceActionBuilders>;
  public storage: StratosCatalogEntity<IFavoriteMetadata, KubeAPIResource, KubeResourceActionBuilders>;
  public pv: StratosCatalogEntity<IFavoriteMetadata, KubeAPIResource, KubeResourceActionBuilders>;
  public replicaSet: StratosCatalogEntity<IFavoriteMetadata, KubeAPIResource, KubeResourceActionBuilders>;
  public clusterRole: StratosCatalogEntity<IFavoriteMetadata, KubeAPIResource, KubeResourceActionBuilders>;
  public serviceAccount: StratosCatalogEntity<IFavoriteMetadata, KubeServiceAccount, KubeResourceActionBuilders>;
  public role: StratosCatalogEntity<IFavoriteMetadata, KubeAPIResource, KubeResourceActionBuilders>;
  public job: StratosCatalogEntity<IFavoriteMetadata, BasicKubeAPIResource, KubeResourceActionBuilders>;

  constructor() {
    const endpointDef: StratosEndpointExtensionDefinition = {
      type: KUBERNETES_ENDPOINT_TYPE,
      label: 'Kubernetes',
      labelPlural: 'Kubernetes',
      icon: 'kubernetes',
      iconFont: 'stratos-icons',
      logoUrl: '/core/assets/custom/kubernetes.svg',
      authTypes: [
        kubeAuthTypeMap[KubeEndpointAuthTypes.CERT_AUTH],
        kubeAuthTypeMap[KubeEndpointAuthTypes.CONFIG],
        BaseEndpointAuth.UsernamePassword,
        kubeAuthTypeMap[KubeEndpointAuthTypes.TOKEN],
      ],
      getEndpointIdFromEntity: (entity) => entity.kubeGuid || entity.metadata?.kubeId,
      renderPriority: 4,
      subTypes: [
        {
          type: 'config',
          label: 'Import Kubeconfig',
          authTypes: [kubeAuthTypeMap[KubeEndpointAuthTypes.CONFIG]],
          logoUrl: '/core/assets/custom/kube_import.png',
          renderPriority: 3,
          registrationComponent: KubeConfigRegistrationComponent,
        },
        {
          type: 'caasp',
          label: 'SUSE CaaS Platform',
          labelShort: 'CaaSP',
          authTypes: [kubeAuthTypeMap[KubeEndpointAuthTypes.CONFIG], kubeAuthTypeMap[KubeEndpointAuthTypes.TOKEN]],
          logoUrl: '/core/assets/custom/caasp.png',
          renderPriority: 5,
        }, {
          type: 'aks',
          label: 'Azure AKS',
          labelShort: 'AKS',
          authTypes: [kubeAuthTypeMap[KubeEndpointAuthTypes.CONFIG_AZ], kubeAuthTypeMap[KubeEndpointAuthTypes.TOKEN]],
          logoUrl: '/core/assets/custom/aks.svg',
          renderPriority: 6
        }, {
          type: 'eks',
          label: 'Amazon EKS',
          labelShort: 'EKS',
          authTypes: [kubeAuthTypeMap[KubeEndpointAuthTypes.AWS_IAM], kubeAuthTypeMap[KubeEndpointAuthTypes.TOKEN]],
          logoUrl: '/core/assets/custom/eks.svg',
          renderPriority: 6
        }, {
          type: 'gke',
          label: 'Google Kubernetes Engine',
          labelShort: 'GKE',
          authTypes: [kubeAuthTypeMap[KubeEndpointAuthTypes.GKE], kubeAuthTypeMap[KubeEndpointAuthTypes.TOKEN]],
          logoUrl: '/core/assets/custom/gke.svg',
          renderPriority: 6
        }, {
          type: 'k3s',
          label: 'K3S',
          labelShort: 'K3S',
          authTypes: [BaseEndpointAuth.UsernamePassword, kubeAuthTypeMap[KubeEndpointAuthTypes.TOKEN]],
          logoUrl: '/core/assets/custom/k3s.svg',
          renderPriority: 6
        }],
      homeCard: {
        component: (compiler: Compiler, injector: Injector) => import('./home/kubernetes-home-card.module').then((m) => {
          return compiler.compileModuleAndAllComponentsAsync(m.KubernetesHomeCardModule).then(cm => {
            const mod = cm.ngModuleFactory.create(injector);
            return mod.instance.createHomeCard(mod.componentFactoryResolver);
          });
        }),
        fullView: false
      }
    };

    this.endpoint = new StratosCatalogEndpointEntity(
      endpointDef,
      favorite => `/kubernetes/${favorite.endpointId}`
    );
    this.statefulSet = this.generateStatefulSetsEntity(endpointDef);
    this.pod = KubeResourceEntityHelper.generate<KubernetesPod, KubePodActionBuilders>(endpointDef, {
      type: kubernetesPodsEntityType,
      icon: 'pod',
      label: 'Pod',
      apiVersion: '/api/v1',
      apiName: 'pods',
      apiNamespaced: true,
      apiWorkspaced: true,
      listConfig: 'k8s-pods',
      getKubeCatalogEntity: (definition) => new StratosCatalogEntity<IFavoriteMetadata, KubernetesPod, KubePodActionBuilders>(
        definition, { actionBuilders: kubePodActionBuilders }
      )
    });
    this.deployment = this.generateDeploymentsEntity(endpointDef);
    this.node = this.generateNodesEntity(endpointDef);
    this.namespace = KubeResourceEntityHelper.generate<KubernetesNamespace, KubeNamespaceActionBuilders>(endpointDef, {
      type: kubernetesNamespacesEntityType,
      icon: 'namespace',
      label: 'Namespace',
      apiVersion: '/api/v1',
      apiName: 'namespaces',
      apiNamespaced: false,
      canFavorite: true,
      getKubeCatalogEntity: (definition) => new StratosCatalogEntity<IFavoriteMetadata, KubernetesNamespace, KubeNamespaceActionBuilders>(
        definition, { actionBuilders: kubeNamespaceActionBuilders }
      ),
      getIsValid: (favorite) =>
        kubeEntityCatalog.namespace.api.get(favorite.metadata.name, favorite.endpointId).pipe(entityFetchedWithoutError()),
      listColumns: [
        {
          header: 'Status',
          field: 'status.phase',
          sort: true
        }
      ]
    });
    this.service = KubeResourceEntityHelper.generate<KubeService, KubeServiceActionBuilders>(endpointDef, {
      type: kubernetesServicesEntityType,
      icon: 'service',
      label: 'Service',
      apiVersion: '/api/v1',
      apiName: 'service',
      apiNamespaced: true,
      apiWorkspaced: true,
      listConfig: 'k8s-services',
      getKubeCatalogEntity: (definition) => new StratosCatalogEntity<IFavoriteMetadata, KubeService, KubeServiceActionBuilders>(
        definition, {
        actionBuilders: kubeServiceActionBuilders
      }
      )
    });
    this.dashboard = this.generateDashboardEntity(endpointDef);
    this.analysisReport = this.generateAnalysisReportsEntity(endpointDef);
    this.configMap = KubeResourceEntityHelper.generate<KubernetesConfigMap, KubeResourceActionBuilders>(endpointDef, {
      type: kubernetesConfigMapEntityType,
      icon: 'config_maps',
      label: 'Config Map',
      apiVersion: '/api/v1',
      apiName: 'configmaps',
      listColumns: [
        {
          header: 'Data Keys',
          field: (row: KubernetesConfigMap) => `${Object.keys(row.data).length}`
        },
      ]
    });
    this.metrics = this.generateMetricEntity(endpointDef);
    this.secrets = KubeResourceEntityHelper.generate<KubeAPIResource, KubeResourceActionBuilders>(endpointDef, {
      type: 'secrets',
      icon: 'config_maps',
      label: 'Secret',
      apiVersion: '/api/v1',
      apiName: 'secrets',
      apiWorkspaced: true,
      listColumns: [
        {
          header: 'Type',
          field: 'type',
          sort: true
        },
        {
          header: 'Data Keys',
          field: (row: KubernetesConfigMap) => `${Object.keys(row.data).length}`
        },
      ],
    });
    this.pvc = KubeResourceEntityHelper.generate<KubeAPIResource, KubeResourceActionBuilders>(endpointDef, {
      type: 'persistentVolumeClaims',
      icon: 'job',
      label: 'Persistent Volume Claim',
      labelTab: 'PVCs',
      apiVersion: '/api/v1',
      apiName: 'persistentvolumeclaims',
      apiWorkspaced: true,
      listColumns: [
        {
          header: 'Storage Class',
          field: 'spec.storageClassName',
          sort: true
        },
        {
          header: 'Phase',
          field: 'status.phase',
          sort: true
        },
        {
          header: 'Capacity',
          field: 'status.capacity.storage',
        }
      ]
    });
    this.storage = KubeResourceEntityHelper.generate<KubeAPIResource, KubeResourceActionBuilders>(endpointDef, {
      type: 'storageClass',
      icon: 'storage_class',
      label: 'Storage Class',
      labelPlural: 'Storage Classes',
      apiVersion: '/apis/storage.k8s.io/v1',
      apiName: 'storageclasses',
      apiNamespaced: false,
      listColumns: [
        {
          header: 'Provisioner',
          field: 'provisioner',
          sort: true
        },
        {
          header: 'Reclaim Policy',
          field: 'reclaimPolicy',
          sort: true
        },
        {
          header: 'Binding Mode',
          field: 'volumeBindingMode',
          sort: true
        }
      ]
    });
    this.pv = KubeResourceEntityHelper.generate<KubeAPIResource, KubeResourceActionBuilders>(endpointDef, {
      type: 'persistentVolume',
      icon: 'persistent_volume',
      label: 'Persistent Volume',
      apiVersion: '/api/v1',
      apiName: 'persistentvolumes',
      apiNamespaced: false,
    });
    this.replicaSet = KubeResourceEntityHelper.generate<KubeAPIResource, KubeResourceActionBuilders>(endpointDef, {
      type: 'replicaSet',
      icon: 'replica_set',
      label: 'Replica Set',
      apiVersion: '/apis/apps/v1',
      apiName: 'replicasets',
      apiWorkspaced: true,
      listColumns: [
        {
          header: 'Desired',
          field: 'spec.replicas',
          sort: true
        },
        {
          header: 'Current',
          field: 'status.replicas',
          sort: true
        },
        {
          header: 'Ready',
          field: 'status.readyReplicas',
          sort: true
        },
      ]
    });
    this.clusterRole = KubeResourceEntityHelper.generate<KubeAPIResource, KubeResourceActionBuilders>(endpointDef, {
      type: 'clusterRole',
      icon: 'cluster_role',
      label: 'Cluster Role',
      apiVersion: '/apis/rbac.authorization.k8s.io/v1',
      apiName: 'clusterroles',
      apiNamespaced: false,
    });
    this.serviceAccount = KubeResourceEntityHelper.generate<KubeServiceAccount, KubeResourceActionBuilders>(endpointDef, {
      type: 'serviceAccount',
      icon: 'replica_set',
      label: 'Service Account',
      apiVersion: '/api/v1',
      apiName: 'serviceaccounts',
      apiWorkspaced: true,
      listColumns: [{
        header: 'Secrets',
        field: (row: KubeServiceAccount) => row.secrets?.length.toString()
      }]
    });
    this.role = KubeResourceEntityHelper.generate<KubeAPIResource, KubeResourceActionBuilders>(endpointDef, {
      type: 'role',
      icon: 'role_binding',
      label: 'Role',
      apiVersion: '/apis/rbac.authorization.k8s.io/v1',
      apiName: 'roles',
      apiWorkspaced: true,
    });
    this.job = KubeResourceEntityHelper.generate<BasicKubeAPIResource, KubeResourceActionBuilders>(endpointDef, {
      type: 'job',
      icon: 'job',
      label: 'Job',
      apiVersion: '/apis/batch/v1',
      apiName: 'jobs',
      apiWorkspaced: true,
      listColumns: [{
        header: 'Completions',
        field: (row: BasicKubeAPIResource) => this.jobToCompletion(row.spec, row.status)
      },
      {
        header: 'Duration',
        field: (row: BasicKubeAPIResource) => this.jobToDuration(row.status)
      }]
    });
  }

  public allKubeEntities(): StratosBaseCatalogEntity[] {
    return [
      ...Object.getOwnPropertyNames(this).map(s => this[s]),
      ...generateWorkloadsEntities(this.endpoint.definition)
    ];
  }

  private generateStatefulSetsEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
    return new StratosCatalogEntity<IFavoriteMetadata, KubernetesStatefulSet, KubeStatefulSetsActionBuilders>(
      {
        type: kubernetesStatefulSetsEntityType,
        schema: kubernetesEntityFactory(kubernetesStatefulSetsEntityType),
        endpoint: endpointDefinition
      }, {
      actionBuilders: kubeStatefulSetsActionBuilders
    });
  }

  private generateDeploymentsEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
    return new StratosCatalogEntity<IFavoriteMetadata, KubernetesDeployment, KubeDeploymentActionBuilders>(
      {
        type: kubernetesDeploymentsEntityType,
        schema: kubernetesEntityFactory(kubernetesDeploymentsEntityType),
        endpoint: endpointDefinition
      }, {
      actionBuilders: kubeDeploymentActionBuilders
    });
  }

  private generateNodesEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
    return new StratosCatalogEntity<IFavoriteMetadata, KubernetesNode, KubeNodeActionBuilders>({
      type: kubernetesNodesEntityType,
      schema: kubernetesEntityFactory(kubernetesNodesEntityType),
      endpoint: endpointDefinition
    }, {
      actionBuilders: kubeNodeActionBuilders
    });
  }

  private generateDashboardEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
    return new StratosCatalogEntity<IFavoriteMetadata, any, KubeDashboardActionBuilders>({
      type: kubernetesDashboardEntityType,
      schema: kubernetesEntityFactory(kubernetesDashboardEntityType),
      endpoint: endpointDefinition
    }, {
      actionBuilders: kubeDashboardActionBuilders
    });
  }

  private generateAnalysisReportsEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
    return new StratosCatalogEntity<undefined, any, AnalysisReportsActionBuilders>({
      type: analysisReportEntityType,
      schema: kubernetesEntityFactory(analysisReportEntityType),
      endpoint: endpointDefinition
    }, {
      actionBuilders: analysisReportsActionBuilders
    });
  }

  private generateMetricEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
    return new StratosCatalogEntity({
      type: metricEntityType,
      schema: kubernetesEntityFactory(metricEntityType),
      label: 'Kubernetes Metric',
      labelPlural: 'Kubernetes Metrics',
      endpoint: endpointDefinition,
    });
  }

  private jobToCompletion(spec: any, status: any): string {
    if (!!spec.completions) {
      return status.succeeded + '/' + spec.completions;
    }

    if (!spec.parallelism) {
      return status.succeeded + '/1';
    }

    if (spec.parallelism > 1) {
      return status.Succeeded + '/1 of ' + spec.parallelism;
    }

    return status.succeeded + '/1';
  }

  private jobToDuration(status: any): string {
    if (!status.startTime) {
      return '';
    }

    if (!!status.CompletionTime) {
      return moment.duration(moment(status.startTime).diff(moment())).humanize();
    }

    return moment.duration(moment(status.startTime).diff(moment(status.completionTime))).humanize();
  }
}

/**
 * A strongly typed collection of Kube Catalog Entities.
 * This can be used to access functionality exposed by each specific type, such as get, update, delete, etc
 */
export const kubeEntityCatalog: KubeEntityCatalog = new KubeEntityCatalog();
