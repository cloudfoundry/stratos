import { Validators } from '@angular/forms';

import { BaseEndpointAuth } from '../../../core/src/core/endpoint-auth';
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
import { kubeEntityCatalog } from './kubernetes-entity-catalog';
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
  KubeAPIResource,
  KubeResourceEntityDefinition,
  KubernetesConfigMap,
  KubernetesDeployment,
  KubernetesNamespace,
  KubernetesNode,
  KubernetesPod,
  KubernetesStatefulSet,
  KubeService,
} from './store/kube.types';
import { generateWorkloadsEntities } from './workloads/store/workloads-entity-generator';

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

  constructor(private endpointDefinition: StratosEndpointExtensionDefinition) { }

  public entities: any[] = [];

  public add<T>(defn: KubeResourceEntityDefinition): KubeResourceEntityHelper {

    // Simplify registration by registrtering the schema in the entity cache
    addKubernetesEntitySchema(defn.type, new KubernetesEntitySchema(defn.type, {}, { idAttribute: getGuidFromKubePodObj }));

    defn.labelTab = defn.labelTab || defn.labelPlural || `${defn.label}s`;

    if (defn.apiNamespaced !== false) {
      defn.apiNamespaced = true;
    }

    const d: IStratosEntityDefinition = {
      ...defn,
      endpoint: this.endpointDefinition,
      schema: kubernetesEntityFactory(defn.type),
      iconFont: defn.iconFont || 'stratos-icons',
      labelPlural: defn.labelPlural || `${defn.label}s`
    }

    if (defn.getKubeCatalogEntity) {
      console.log(defn);
      kubeEntityCatalog[defn.kubeCatalogEntity] = defn.getKubeCatalogEntity(d);
    } else {
      kubeEntityCatalog[defn.kubeCatalogEntity] = new StratosCatalogEntity<IFavoriteMetadata, T, KubeResourceActionBuilders>(d, {
        actionBuilders: createKubeResourceActionBuilder(d.type)
      });
    }

    this.entities.push(kubeEntityCatalog[defn.kubeCatalogEntity]);
    return this;
  }
}

export function generateKubernetesEntities(): StratosBaseCatalogEntity[] {
  const endpointDefinition: StratosEndpointExtensionDefinition = {
    type: KUBERNETES_ENDPOINT_TYPE,
    label: 'Kubernetes',
    labelPlural: 'Kubernetes',
    icon: 'kubernetes',
    iconFont: 'stratos-icons',
    logoUrl: '/core/assets/custom/kubernetes.svg',
    urlValidation: undefined,
    authTypes: [
      kubeAuthTypeMap[KubeEndpointAuthTypes.CERT_AUTH],
      kubeAuthTypeMap[KubeEndpointAuthTypes.CONFIG],
      BaseEndpointAuth.UsernamePassword,
      kubeAuthTypeMap[KubeEndpointAuthTypes.TOKEN],
    ],
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
      }]
  };
  return [
    generateEndpointEntity(endpointDefinition),
    generateStatefulSetsEntity(endpointDefinition),
    ...generateKubeResourceEntities(endpointDefinition),
    generateDeploymentsEntity(endpointDefinition),
    generateNodesEntity(endpointDefinition),
    generateNamespacesEntity(endpointDefinition),
    generateServicesEntity(endpointDefinition),
    generateDashboardEntity(endpointDefinition),
    generateAnalysisReportsEntity(endpointDefinition),
    generateMetricEntity(endpointDefinition),
    ...generateWorkloadsEntities(endpointDefinition)
  ];
}

function generateEndpointEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  kubeEntityCatalog.endpoint = new StratosCatalogEndpointEntity(
    endpointDefinition,
    metadata => `/kubernetes/${metadata.guid}`
  );
  return kubeEntityCatalog.endpoint;
}

function generateStatefulSetsEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition: IStratosEntityDefinition = {
    type: kubernetesStatefulSetsEntityType,
    schema: kubernetesEntityFactory(kubernetesStatefulSetsEntityType),
    endpoint: endpointDefinition
  };
  kubeEntityCatalog.statefulSet = new StratosCatalogEntity<IFavoriteMetadata, KubernetesStatefulSet, KubeStatefulSetsActionBuilders>(
    definition, {
    actionBuilders: kubeStatefulSetsActionBuilders
  });
  return kubeEntityCatalog.statefulSet;
}

function generateDeploymentsEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition: IStratosEntityDefinition = {
    type: kubernetesDeploymentsEntityType,
    schema: kubernetesEntityFactory(kubernetesDeploymentsEntityType),
    endpoint: endpointDefinition
  };
  kubeEntityCatalog.deployment = new StratosCatalogEntity<IFavoriteMetadata, KubernetesDeployment, KubeDeploymentActionBuilders>(
    definition, {
    actionBuilders: kubeDeploymentActionBuilders
  });
  return kubeEntityCatalog.deployment;
}

function generateNodesEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition: IStratosEntityDefinition = {
    type: kubernetesNodesEntityType,
    schema: kubernetesEntityFactory(kubernetesNodesEntityType),
    endpoint: endpointDefinition
  };
  kubeEntityCatalog.node = new StratosCatalogEntity<IFavoriteMetadata, KubernetesNode, KubeNodeActionBuilders>(definition, {
    actionBuilders: kubeNodeActionBuilders
  });
  return kubeEntityCatalog.node;
}

function generateNamespacesEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition: IStratosEntityDefinition = {
    type: kubernetesNamespacesEntityType,
    schema: kubernetesEntityFactory(kubernetesNamespacesEntityType),
    endpoint: endpointDefinition
  };
  kubeEntityCatalog.namespace = new StratosCatalogEntity<IFavoriteMetadata, KubernetesNamespace, KubeNamespaceActionBuilders>(definition, {
    actionBuilders: kubeNamespaceActionBuilders
  });
  return kubeEntityCatalog.namespace;
}

function generateServicesEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition: IStratosEntityDefinition = {
    type: kubernetesServicesEntityType,
    schema: kubernetesEntityFactory(kubernetesServicesEntityType),
    endpoint: endpointDefinition
  };
  kubeEntityCatalog.service = new StratosCatalogEntity<IFavoriteMetadata, KubeService, KubeServiceActionBuilders>(definition, {
    actionBuilders: kubeServiceActionBuilders
  });
  return kubeEntityCatalog.service;
}

function generateDashboardEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition: IStratosEntityDefinition = {
    type: kubernetesDashboardEntityType,
    schema: kubernetesEntityFactory(kubernetesDashboardEntityType),
    endpoint: endpointDefinition
  };
  kubeEntityCatalog.dashboard = new StratosCatalogEntity<IFavoriteMetadata, any, KubeDashboardActionBuilders>(definition, {
    actionBuilders: kubeDashboardActionBuilders
  });
  return kubeEntityCatalog.dashboard;
}

function generateAnalysisReportsEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition = {
    type: analysisReportEntityType,
    schema: kubernetesEntityFactory(analysisReportEntityType),
    endpoint: endpointDefinition
  };
  kubeEntityCatalog.analysisReport = new StratosCatalogEntity<undefined, any, AnalysisReportsActionBuilders>(definition, {
    actionBuilders: analysisReportsActionBuilders
  });
  return kubeEntityCatalog.analysisReport;
}

function generateMetricEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition: IStratosEntityDefinition = {
    type: metricEntityType,
    schema: kubernetesEntityFactory(metricEntityType),
    label: 'Kubernetes Metric',
    labelPlural: 'Kubernetes Metrics',
    endpoint: endpointDefinition,
  };
  return new StratosCatalogEntity(definition);
}

// =============================================================================================================
// Kubernetes Resources using generic resource pattern
// =============================================================================================================

function generateKubeResourceEntities(endpointDefinition: StratosEndpointExtensionDefinition) {

  const entities = new KubeResourceEntityHelper(endpointDefinition);

  entities.add<KubernetesPod>({
    type: kubernetesPodsEntityType,
    icon: 'pod',
    label: 'Pod',
    apiVersion: '/api/v1',
    apiName: 'pods',
    apiNamespaced: true,
    kubeCatalogEntity: 'pod',
    route: 'pods',
    getKubeCatalogEntity: (definition) => new StratosCatalogEntity<IFavoriteMetadata, KubernetesPod, KubePodActionBuilders>(
      definition, { actionBuilders: kubePodActionBuilders }
    )
  });

  entities.add<KubernetesConfigMap>({
    type: kubernetesConfigMapEntityType,
    icon: 'config_maps',
    label: 'Config Map',
    apiVersion: '/api/v1',
    apiName: 'configmaps',
    kubeCatalogEntity: 'configMap'
  });

  entities.add<KubeAPIResource>({
    type: 'kubernetesSecrets',
    icon: 'config_maps',
    label: 'Secret',
    apiVersion: '/api/v1',
    apiName: 'secrets',
    kubeCatalogEntity: 'secrets'
  });

  entities.add<KubeAPIResource>({
    type: 'kubernetesPersistentVolumeClaims',
    icon: 'job',
    label: 'Persistent Volume Claim',
    labelTab: 'PVCs',
    apiVersion: '/api/v1',
    apiName: 'persistentvolumeclaims',
    kubeCatalogEntity: 'pvcs',
    listColumns: [
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

  entities.add<KubeAPIResource>({
    type: 'kubernetesStorageClass',
    icon: 'storage_class',
    label: 'Storage Class',
    labelPlural: 'Storage Classes',
    apiVersion: '/apis/storage.k8s.io/v1',
    apiName: 'storageclasses',
    apiNamespaced: false,
    kubeCatalogEntity: 'storageClass',
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

  entities.add<KubeAPIResource>({
    type: 'kubernetesPersistentVolume',
    icon: 'persistent_volume',
    label: 'Persistent Volume',
    apiVersion: '/api/v1',
    apiName: 'persistentvolumes',
    apiNamespaced: false,
    kubeCatalogEntity: 'persistentVolumes'
  });

  entities.add<KubeAPIResource>({
    type: 'kubernetesReplicaSet',
    icon: 'replica_set',
    label: 'Replica Set',
    apiVersion: '/apis/apps/v1',
    apiName: 'replicasets',
    kubeCatalogEntity: 'replicaSets'
  });

  entities.add<KubeAPIResource>({
    type: 'kubernetesClusterRole',
    icon: 'cluster_role',
    label: 'Cluster Role',
    apiVersion: '/apis/rbac.authorization.k8s.io/v1',
    apiName: 'clusterroles',
    apiNamespaced: false,
    kubeCatalogEntity: 'clusterroles'
  });

  entities.add<KubeAPIResource>({
    type: 'kubernetesServiceAccount',
    icon: 'replica_set',
    label: 'Service Account',
    apiVersion: '/api/v1',
    apiName: 'serviceaccounts',
    kubeCatalogEntity: 'serviceaccounts'
  });

  entities.add<KubeAPIResource>({
    type: 'kubernetesRole',
    icon: 'role_binding',
    label: 'Role',
    apiVersion: '/apis/rbac.authorization.k8s.io/v1',
    apiName: 'roles',
    kubeCatalogEntity: 'role'
  });

  return entities.entities;
}
