import { Validators } from '@angular/forms';

import { IFavoriteMetadata } from '../../../../store/src/types/user-favorites.types';
import {
  StratosBaseCatalogueEntity,
  StratosCatalogueEndpointEntity,
  StratosCatalogueEntity,
} from '../../core/entity-catalogue/entity-catalogue-entity';
import { StratosEndpointExtensionDefinition } from '../../core/entity-catalogue/entity-catalogue.types';
import { EndpointAuthTypeConfig, EndpointType } from '../../core/extension/extension-types';
import { KubernetesAWSAuthFormComponent } from './auth-forms/kubernetes-aws-auth-form/kubernetes-aws-auth-form.component';
import {
  KubernetesCertsAuthFormComponent,
} from './auth-forms/kubernetes-certs-auth-form/kubernetes-certs-auth-form.component';
import {
  KubernetesConfigAuthFormComponent,
} from './auth-forms/kubernetes-config-auth-form/kubernetes-config-auth-form.component';
import { KubernetesGKEAuthFormComponent } from './auth-forms/kubernetes-gke-auth-form/kubernetes-gke-auth-form.component';
import {
  KUBERNETES_ENDPOINT_TYPE,
  kubernetesAppsSchemaKey,
  kubernetesDashboardSchemaKey,
  kubernetesDeploymentsSchemaKey,
  kubernetesEntityFactory,
  kubernetesNamespacesSchemaKey,
  kubernetesNodesSchemaKey,
  kubernetesPodsSchemaKey,
  kubernetesServicesSchemaKey,
  kubernetesStatefulSetsSchemaKey,
} from './kubernetes-entity-factory';
import { KubernetesApp } from './store/kube.types';

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


// export interface EndpointAuthTypeConfig {
//   name: string;
//   value: string;
//   formType?: string;
//   types: Array<EndpointType>;
//   form?: any;
//   data?: any;
//   component: Type<IAuthForm>;
//   help?: string;
// }

/**
 * CustomImportModule brings in CustomModule. CustomModule brings in kube setup module. setup module brings this in multiple times
 */
let hack = false;

export function generateKubernetesEntities(): StratosBaseCatalogueEntity[] {
  if (hack) {
    return [];
  }
  hack = true;

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
      logoUrl: '/core/assets/custom/caasp.png'
    }, {
      type: 'aks',
      label: 'Azure AKS',
      authTypes: [kubeAuthTypeMap[KubeEndpointAuthTypes.CONFIG_AZ]],
      logoUrl: '/core/assets/custom/aks.svg'
    }, {
      type: 'eks',
      label: 'Amazon EKS',
      authTypes: [kubeAuthTypeMap[KubeEndpointAuthTypes.AWS_IAM]],
      logoUrl: '/core/assets/custom/eks.svg'
    }, {
      type: 'gke',
      label: 'Google Kubernetes Engine',
      authTypes: [kubeAuthTypeMap[KubeEndpointAuthTypes.GKE]],
      logoUrl: '/core/assets/custom/gke.svg'
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
  ];
}

function generateEndpointEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  return new StratosCatalogueEndpointEntity(
    endpointDefinition,
    metadata => `/kubernetes/${metadata.guid}`, // TODO: RC
  );
}

function generateAppEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition = {
    type: kubernetesAppsSchemaKey,
    schema: kubernetesEntityFactory(kubernetesAppsSchemaKey),
    endpoint: endpointDefinition
  };
  return new StratosCatalogueEntity<IFavoriteMetadata, KubernetesApp>(definition);
}

function generateStatefulSetsEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition = {
    type: kubernetesStatefulSetsSchemaKey,
    schema: kubernetesEntityFactory(kubernetesStatefulSetsSchemaKey),
    endpoint: endpointDefinition
  };
  return new StratosCatalogueEntity<IFavoriteMetadata, KubernetesApp>(definition);
}

function generatePodsEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition = {
    type: kubernetesPodsSchemaKey,
    schema: kubernetesEntityFactory(kubernetesPodsSchemaKey),
    endpoint: endpointDefinition
  };
  return new StratosCatalogueEntity<IFavoriteMetadata, KubernetesApp>(definition);
}

function generateDeploymentsEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition = {
    type: kubernetesDeploymentsSchemaKey,
    schema: kubernetesEntityFactory(kubernetesDeploymentsSchemaKey),
    endpoint: endpointDefinition
  };
  return new StratosCatalogueEntity<IFavoriteMetadata, KubernetesApp>(definition);
}

function generateNodesEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition = {
    type: kubernetesNodesSchemaKey,
    schema: kubernetesEntityFactory(kubernetesNodesSchemaKey),
    endpoint: endpointDefinition
  };
  return new StratosCatalogueEntity<IFavoriteMetadata, KubernetesApp>(definition);
}

function generateNamespacesEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition = {
    type: kubernetesNamespacesSchemaKey,
    schema: kubernetesEntityFactory(kubernetesNamespacesSchemaKey),
    endpoint: endpointDefinition
  };
  return new StratosCatalogueEntity<IFavoriteMetadata, KubernetesApp>(definition);
}

function generateServicesEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition = {
    type: kubernetesServicesSchemaKey,
    schema: kubernetesEntityFactory(kubernetesServicesSchemaKey),
    endpoint: endpointDefinition
  };
  return new StratosCatalogueEntity<IFavoriteMetadata, KubernetesApp>(definition);
}

function generateDashboardEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition = {
    type: kubernetesDashboardSchemaKey,
    schema: kubernetesEntityFactory(kubernetesDashboardSchemaKey),
    endpoint: endpointDefinition
  };
  return new StratosCatalogueEntity<IFavoriteMetadata, KubernetesApp>(definition);
}
