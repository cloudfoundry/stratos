import { Validators } from '@angular/forms';

import { metricEntityType } from '../../../../cloud-foundry/src/cf-entity-types';
import { IFavoriteMetadata } from '../../../../store/src/types/user-favorites.types';
import {
  StratosBaseCatalogueEntity,
  StratosCatalogueEndpointEntity,
  StratosCatalogueEntity,
} from '../../core/entity-catalogue/entity-catalogue-entity';
import { StratosEndpointExtensionDefinition, IStratosEntityDefinition } from '../../core/entity-catalogue/entity-catalogue.types';
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
  ConditionType,
} from './store/kube.types';
import { podActionBuilders } from './entity-action-builders/pod-action-builders';
import { nodeActionBuilders } from './entity-action-builders/node-action-builders';
import { getContainerLengthSort, getConditionSort } from './list-types/kube-sort.helper';
import { EntitySchema } from '../../../../store/src/helpers/entity-schema';
import { KubernetesNodeLinkComponent } from './list-types/kubernetes-nodes/kubernetes-node-link/kubernetes-node-link.component';
import { KubernetesNodeIpsComponent } from './list-types/kubernetes-nodes/kubernetes-node-ips/kubernetes-node-ips.component';
import { KubernetesNodeLabelsComponent } from './list-types/kubernetes-nodes/kubernetes-node-labels/kubernetes-node-labels.component';
import { ConditionCellComponent } from './list-types/kubernetes-nodes/condition-cell/condition-cell.component';
import { KubernetesNodePressureComponent } from './list-types/kubernetes-nodes/kubernetes-node-pressure/kubernetes-node-pressure.component';
import { NodePodCountComponent } from './list-types/kubernetes-nodes/node-pod-count/node-pod-count.component';
import { KubernetesNodeCapacityComponent } from './list-types/kubernetes-nodes/kubernetes-node-capacity/kubernetes-node-capacity.component';
import { KubernetesNodesListFilterKeys } from './list-types/kubernetes-nodes/kubernetes-nodes-list-config.service';

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

export const k8EndpointDefinition: StratosEndpointExtensionDefinition = {
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

export function generateKubernetesEntities(): StratosBaseCatalogueEntity[] {

  return [
    generateEndpointEntity(k8EndpointDefinition),
    generateAppEntity(k8EndpointDefinition),
    generateStatefulSetsEntity(k8EndpointDefinition),
    generatePodsEntity(k8EndpointDefinition),
    generateDeploymentsEntity(k8EndpointDefinition),
    generateNodesEntity(k8EndpointDefinition),
    generateNamespacesEntity(k8EndpointDefinition),
    generateServicesEntity(k8EndpointDefinition),
    generateDashboardEntity(k8EndpointDefinition),
    generateMetricEntity(k8EndpointDefinition)
  ];
}

function generateEndpointEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  return new StratosCatalogueEndpointEntity(
    endpointDefinition,
    metadata => `/kubernetes/${metadata.guid}`,
  );
}

function generateAppEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition = {
    type: kubernetesAppsEntityType,
    schema: kubernetesEntityFactory(kubernetesAppsEntityType),
    endpoint: endpointDefinition
  };
  return new StratosCatalogueEntity<IFavoriteMetadata, KubernetesApp>(definition);
}

function generateStatefulSetsEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition = {
    type: kubernetesStatefulSetsEntityType,
    schema: kubernetesEntityFactory(kubernetesStatefulSetsEntityType),
    endpoint: endpointDefinition
  };
  return new StratosCatalogueEntity<IFavoriteMetadata, KubernetesStatefulSet>(definition);
}

function generatePodsEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition: IStratosEntityDefinition<EntitySchema, KubernetesPod> = {
    type: kubernetesPodsEntityType,
    schema: kubernetesEntityFactory(kubernetesPodsEntityType),
    endpoint: endpointDefinition,
    icon: 'adjust',
    label: 'Pod',
    labelPlural: 'Pods',
    tableConfig: {
      columnBuilders: [
        ['Name', (pod: KubernetesPod) => pod.metadata.name],
        {
          columnId: 'containers', headerCell: () => 'No. of Containers',
          cellDefinition: {
            valuePath: 'spec.containers.length'
          },
          sort: getContainerLengthSort,
          cellFlex: '2',
        },
        {
          columnId: 'namespace', headerCell: () => 'Namespace',
          cellDefinition: {
            valuePath: 'metadata.namespace'
          },
          sort: {
            type: 'sort',
            orderKey: 'namespace',
            field: 'metadata.namespace'
          },
          cellFlex: '5',
        },
        {
          columnId: 'node', headerCell: () => 'Node',
          cellDefinition: {
            valuePath: 'spec.nodeName'
          },
          sort: {
            type: 'sort',
            orderKey: 'node',
            field: 'spec.nodeName'
          },
          cellFlex: '5',
        },
        {
          columnId: 'status', headerCell: () => 'Status',
          cellDefinition: {
            valuePath: 'status.phase'
          },
          sort: {
            type: 'sort',
            orderKey: 'status',
            field: 'status.phase'
          },
          cellFlex: '5',
        },
        {
          columnId: 'container-status', headerCell: () => `Ready Containers`,
          cellDefinition: {
            getValue: (row) => {
              if (row.status.phase === 'Failed') {
                return `0 / ${row.spec.containers.length}`;
              }
              const readyPods = row.status.containerStatuses.filter(status => status.ready).length;
              const allContainers = row.status.containerStatuses.length;
              return `${readyPods} / ${allContainers}`;
            }
          },
          cellFlex: '5',
        },
      ]
    }
  };
  return new StratosCatalogueEntity<IFavoriteMetadata, KubernetesPod>(definition, {
    actionBuilders: podActionBuilders
  });
}

function generateDeploymentsEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition = {
    type: kubernetesDeploymentsEntityType,
    schema: kubernetesEntityFactory(kubernetesDeploymentsEntityType),
    endpoint: endpointDefinition
  };
  return new StratosCatalogueEntity<IFavoriteMetadata, KubernetesDeployment>(definition);
}

function generateNodesEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition: IStratosEntityDefinition = {
    type: kubernetesNodesEntityType,
    schema: kubernetesEntityFactory(kubernetesNodesEntityType),
    endpoint: endpointDefinition,
    label: 'Node',
    labelPlural: 'Nodes',
    icon: 'developer_board',
    tableConfig: {
      columnBuilders: [
        {
          columnId: 'name', headerCell: () => 'Name',
          cellComponent: KubernetesNodeLinkComponent,
          sort: {
            type: 'sort',
            orderKey: 'name',
            field: 'metadata.name'
          },
          cellFlex: '5',
        },
        {
          columnId: 'ips', headerCell: () => 'IPs',
          cellComponent: KubernetesNodeIpsComponent,
          cellFlex: '1',
        },
        {
          columnId: 'labels', headerCell: () => 'Labels',
          cellComponent: KubernetesNodeLabelsComponent,
          cellFlex: '1',
        },
        {
          columnId: 'ready', headerCell: () => 'Ready',
          cellConfig: {
            conditionType: ConditionType.Ready
          },
          cellComponent: ConditionCellComponent,

          sort: getConditionSort(ConditionType.Ready),
          cellFlex: '2',
        },
        {
          columnId: 'condition', headerCell: () => 'Condition',
          cellComponent: KubernetesNodePressureComponent,
          cellFlex: '2',
        },
        {
          columnId: 'numPods', headerCell: () => 'No. of Pods',
          cellComponent: NodePodCountComponent,
          cellFlex: '2',
        },
        {
          columnId: 'capacity', headerCell: () => 'Capacity',
          cellComponent: KubernetesNodeCapacityComponent,
          cellFlex: '4',
        },
        // Display labels as the usual chip list
        // {
        //   columnId: 'labels', headerCell: () => 'Labels',
        //   cellComponent: KubernetesLabelsCellComponent,
        //   cellFlex: '6',
        // },
      ]
    }
  };
  return new StratosCatalogueEntity<IFavoriteMetadata, KubernetesNode>(definition, {
    actionBuilders: nodeActionBuilders
  });
}

function generateNamespacesEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition = {
    type: kubernetesNamespacesEntityType,
    schema: kubernetesEntityFactory(kubernetesNamespacesEntityType),
    endpoint: endpointDefinition
  };
  return new StratosCatalogueEntity<IFavoriteMetadata, KubernetesNamespace>(definition);
}

function generateServicesEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition = {
    type: kubernetesServicesEntityType,
    schema: kubernetesEntityFactory(kubernetesServicesEntityType),
    endpoint: endpointDefinition
  };
  return new StratosCatalogueEntity<IFavoriteMetadata, KubeService>(definition);
}

function generateDashboardEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition = {
    type: kubernetesDashboardEntityType,
    schema: kubernetesEntityFactory(kubernetesDashboardEntityType),
    endpoint: endpointDefinition
  };
  return new StratosCatalogueEntity<IFavoriteMetadata>(definition);
}

function generateMetricEntity(endpointDefinition: StratosEndpointExtensionDefinition) {
  const definition = {
    type: metricEntityType,
    schema: kubernetesEntityFactory(metricEntityType),
    label: 'Kubernetes Metric',
    labelPlural: 'Kubernetes Metrics',
    endpoint: endpointDefinition,
  };
  return new StratosCatalogueEntity(definition);
}
