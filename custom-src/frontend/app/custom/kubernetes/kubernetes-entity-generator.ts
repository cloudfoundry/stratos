import { Validators } from '@angular/forms';

import { metricEntityType } from '../../../../cloud-foundry/src/cf-entity-types';
import {
  StratosBaseCatalogEntity,
  StratosCatalogEndpointEntity,
  StratosCatalogEntity,
} from '../../../../store/src/entity-catalog/entity-catalog-entity';
import { StratosEndpointExtensionDefinition } from '../../../../store/src/entity-catalog/entity-catalog.types';
import { IFavoriteMetadata } from '../../../../store/src/types/user-favorites.types';
import { EndpointAuthTypeConfig, EndpointType } from '../../core/extension/extension-types';
import { KubernetesAWSAuthFormComponent } from './auth-forms/kubernetes-aws-auth-form/kubernetes-aws-auth-form.component';
import {
  KubernetesCertsAuthFormComponent,
} from './auth-forms/kubernetes-certs-auth-form/kubernetes-certs-auth-form.component';
import {
  KubernetesConfigAuthFormComponent,
} from './auth-forms/kubernetes-config-auth-form/kubernetes-config-auth-form.component';
import { KubernetesGKEAuthFormComponent } from './auth-forms/kubernetes-gke-auth-form/kubernetes-gke-auth-form.component';
import { KubernetesEndpointPreviewComponent } from './kubernetes-endpoint-preview/kubernetes-endpoint-preview.component';
import {
  KUBERNETES_ENDPOINT_TYPE,
  kubernetesAppsEntityType,
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
  KubernetesApp,
  KubernetesDeployment,
  KubernetesNamespace,
  KubernetesNode,
  KubernetesPod,
  KubernetesStatefulSet,
  KubeService,
} from './store/kube.types';

const enum KubeEndpointAuthTypes {
  CERT_AUTH = 'kube-cert-auth',
  CONFIG = 'kubeconfig',
  CONFIG_AZ = 'kubeconfig-az',
  AWS_IAM = 'aws-iam',
  GKE = 'gke-auth'
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
    name: 'CAASP (OIDC)',
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
    authTypes: [kubeAuthTypeMap[KubeEndpointAuthTypes.CERT_AUTH]],
    renderPriority: 4,
    subTypes: [{
      type: 'caasp',
      label: 'SUSE CaaS Platform',
      authTypes: [kubeAuthTypeMap[KubeEndpointAuthTypes.CONFIG]],
      logoUrl: '/core/assets/custom/caasp.png',
      renderPriority: 5
    }, {
      type: 'aks',
      label: 'Azure AKS',
      authTypes: [kubeAuthTypeMap[KubeEndpointAuthTypes.CONFIG_AZ]],
      logoUrl: '/core/assets/custom/aks.svg',
      renderPriority: 6
    }, {
      type: 'eks',
      label: 'Amazon EKS',
      authTypes: [kubeAuthTypeMap[KubeEndpointAuthTypes.AWS_IAM]],
      logoUrl: '/core/assets/custom/eks.svg',
      renderPriority: 6
    }, {
      type: 'gke',
      label: 'Google Kubernetes Engine',
      authTypes: [kubeAuthTypeMap[KubeEndpointAuthTypes.GKE]],
      logoUrl: '/core/assets/custom/gke.svg',
      renderPriority: 6
    }],
  };
  return [
    generateEndpointEntity(endpointDefinition),
    generateAppEntity(endpointDefinition),
    generateStatefulSetsEntity(endpointDefinition),
    generatePodsEntity(endpointDefinition),
    generateDeploymentsEntity(endpointDefinition),
    generateNodesEntity(endpointDefinition),
    generateNamespacesEntity(endpointDefinition),
    generateServicesEntity(endpointDefinition),
    generateDashboardEntity(endpointDefinition),
    generateMetricEntity(endpointDefinition)
  ];
}

function generateEndpointEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  return new StratosCatalogEndpointEntity(
    endpointDefinition,
    metadata => `/kubernetes/${metadata.guid}`,
    () => KubernetesEndpointPreviewComponent,
  );
}

function generateAppEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition = {
    type: kubernetesAppsEntityType,
    schema: kubernetesEntityFactory(kubernetesAppsEntityType),
    endpoint: endpointDefinition
  };
  return new StratosCatalogEntity<IFavoriteMetadata, KubernetesApp>(definition);
}

function generateStatefulSetsEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition = {
    type: kubernetesStatefulSetsEntityType,
    schema: kubernetesEntityFactory(kubernetesStatefulSetsEntityType),
    endpoint: endpointDefinition
  };
  return new StratosCatalogEntity<IFavoriteMetadata, KubernetesStatefulSet>(definition);
}

function generatePodsEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition = {
    type: kubernetesPodsEntityType,
    schema: kubernetesEntityFactory(kubernetesPodsEntityType),
    endpoint: endpointDefinition
  };
  return new StratosCatalogEntity<IFavoriteMetadata, KubernetesPod>(definition);
}

function generateDeploymentsEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition = {
    type: kubernetesDeploymentsEntityType,
    schema: kubernetesEntityFactory(kubernetesDeploymentsEntityType),
    endpoint: endpointDefinition
  };
  return new StratosCatalogEntity<IFavoriteMetadata, KubernetesDeployment>(definition);
}

function generateNodesEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition = {
    type: kubernetesNodesEntityType,
    schema: kubernetesEntityFactory(kubernetesNodesEntityType),
    endpoint: endpointDefinition
  };
  return new StratosCatalogEntity<IFavoriteMetadata, KubernetesNode>(definition);
}

function generateNamespacesEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition = {
    type: kubernetesNamespacesEntityType,
    schema: kubernetesEntityFactory(kubernetesNamespacesEntityType),
    endpoint: endpointDefinition
  };
  return new StratosCatalogEntity<IFavoriteMetadata, KubernetesNamespace>(definition);
}

function generateServicesEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition = {
    type: kubernetesServicesEntityType,
    schema: kubernetesEntityFactory(kubernetesServicesEntityType),
    endpoint: endpointDefinition
  };
  return new StratosCatalogEntity<IFavoriteMetadata, KubeService>(definition);
}

function generateDashboardEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition = {
    type: kubernetesDashboardEntityType,
    schema: kubernetesEntityFactory(kubernetesDashboardEntityType),
    endpoint: endpointDefinition
  };
  return new StratosCatalogEntity<IFavoriteMetadata>(definition);
}

function generateMetricEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition = {
    type: metricEntityType,
    schema: kubernetesEntityFactory(metricEntityType),
    label: 'Kubernetes Metric',
    labelPlural: 'Kubernetes Metrics',
    endpoint: endpointDefinition,
  };
  return new StratosCatalogEntity(definition);
}
