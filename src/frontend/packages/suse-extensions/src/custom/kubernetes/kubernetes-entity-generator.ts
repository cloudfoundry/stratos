import { Validators } from '@angular/forms';

import { BaseEndpointAuth } from '../../../../core/src/core/endpoint-auth';
import {
  StratosBaseCatalogEntity,
  StratosCatalogEndpointEntity,
  StratosCatalogEntity,
} from '../../../../store/src/entity-catalog/entity-catalog-entity/entity-catalog-entity';
import {
  IStratosEntityDefinition,
  StratosEndpointExtensionDefinition,
} from '../../../../store/src/entity-catalog/entity-catalog.types';
import { EndpointAuthTypeConfig, EndpointType } from '../../../../store/src/extension-types';
import { metricEntityType } from '../../../../store/src/helpers/stratos-entity-factory';
import { IFavoriteMetadata } from '../../../../store/src/types/user-favorites.types';
import { KubernetesAWSAuthFormComponent } from './auth-forms/kubernetes-aws-auth-form/kubernetes-aws-auth-form.component';
import {
  KubernetesCertsAuthFormComponent,
} from './auth-forms/kubernetes-certs-auth-form/kubernetes-certs-auth-form.component';
import {
  KubernetesConfigAuthFormComponent,
} from './auth-forms/kubernetes-config-auth-form/kubernetes-config-auth-form.component';
import { KubernetesGKEAuthFormComponent } from './auth-forms/kubernetes-gke-auth-form/kubernetes-gke-auth-form.component';
import { KubeConfigRegistrationComponent } from './kube-config-registration/kube-config-registration.component';
import { kubeEntityCatalog } from './kubernetes-entity-catalog';
import {
  analysisReportEntityType,
  KUBERNETES_ENDPOINT_TYPE,
  kubernetesDashboardEntityType,
  kubernetesDeploymentsEntityType,
  kubernetesEntityFactory,
  kubernetesNamespacesEntityType,
  kubernetesNodesEntityType,
  kubernetesPodsEntityType,
  kubernetesServicesEntityType,
  kubernetesStatefulSetsEntityType,
} from './kubernetes-entity-factory';
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
import {
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
}

const kubeAuthTypeMap: { [type: string]: EndpointAuthTypeConfig } = {
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
  }
};

export function generateKubernetesEntities(): StratosBaseCatalogEntity[] {
  const endpointDefinition: StratosEndpointExtensionDefinition = {
    type: KUBERNETES_ENDPOINT_TYPE,
    label: 'Kubernetes',
    labelPlural: 'Kubernetes',
    icon: 'kubernetes',
    iconFont: 'stratos-icons',
    logoUrl: '/core/assets/custom/kubernetes.svg',
    urlValidation: undefined,
    authTypes: [kubeAuthTypeMap[KubeEndpointAuthTypes.CERT_AUTH], kubeAuthTypeMap[KubeEndpointAuthTypes.CONFIG], BaseEndpointAuth.UsernamePassword],
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
        authTypes: [kubeAuthTypeMap[KubeEndpointAuthTypes.CONFIG]],
        logoUrl: '/core/assets/custom/caasp.png',
        renderPriority: 5,
      }, {
        type: 'aks',
        label: 'Azure AKS',
        labelShort: 'AKS',
        authTypes: [kubeAuthTypeMap[KubeEndpointAuthTypes.CONFIG_AZ]],
        logoUrl: '/core/assets/custom/aks.svg',
        renderPriority: 6
      }, {
        type: 'eks',
        label: 'Amazon EKS',
        labelShort: 'EKS',
        authTypes: [kubeAuthTypeMap[KubeEndpointAuthTypes.AWS_IAM]],
        logoUrl: '/core/assets/custom/eks.svg',
        renderPriority: 6
      }, {
        type: 'gke',
        label: 'Google Kubernetes Engine',
        labelShort: 'GKE',
        authTypes: [kubeAuthTypeMap[KubeEndpointAuthTypes.GKE]],
        logoUrl: '/core/assets/custom/gke.svg',
        renderPriority: 6
      }, {
        type: 'k3s',
        label: 'K3S',
        labelShort: 'K3S',
        authTypes: [BaseEndpointAuth.UsernamePassword],
        logoUrl: '/core/assets/custom/k3s.svg',
        renderPriority: 6
      }]
  };
  return [
    generateEndpointEntity(endpointDefinition),
    generateStatefulSetsEntity(endpointDefinition),
    generatePodsEntity(endpointDefinition),
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
  kubeEntityCatalog.statefulSet = new StratosCatalogEntity<IFavoriteMetadata, KubernetesStatefulSet, KubeStatefulSetsActionBuilders>(definition, {
    actionBuilders: kubeStatefulSetsActionBuilders
  });
  return kubeEntityCatalog.statefulSet;
}

function generatePodsEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition: IStratosEntityDefinition = {
    type: kubernetesPodsEntityType,
    schema: kubernetesEntityFactory(kubernetesPodsEntityType),
    endpoint: endpointDefinition
  };
  kubeEntityCatalog.pod = new StratosCatalogEntity<IFavoriteMetadata, KubernetesPod, KubePodActionBuilders>(definition, {
    actionBuilders: kubePodActionBuilders
  });
  return kubeEntityCatalog.pod;
}

function generateDeploymentsEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition: IStratosEntityDefinition = {
    type: kubernetesDeploymentsEntityType,
    schema: kubernetesEntityFactory(kubernetesDeploymentsEntityType),
    endpoint: endpointDefinition
  };
  kubeEntityCatalog.deployment = new StratosCatalogEntity<IFavoriteMetadata, KubernetesDeployment, KubeDeploymentActionBuilders>(definition, {
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
  return kubeEntityCatalog.analysisReport
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
