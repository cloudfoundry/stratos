import { NgModule } from '@angular/core';
import { Validators } from '@angular/forms';

import { CoreModule } from '../../core/core.module';
import { StratosExtension } from '../../core/extension/extension-service';
import { EndpointAuthTypeConfig, EndpointType, EndpointTypeExtensionConfig } from '../../core/extension/extension-types';
import { KubernetesAWSAuthFormComponent } from './auth-forms/kubernetes-aws-auth-form/kubernetes-aws-auth-form.component';
import {
  KubernetesCertsAuthFormComponent,
} from './auth-forms/kubernetes-certs-auth-form/kubernetes-certs-auth-form.component';
import {
  KubernetesConfigAuthFormComponent,
} from './auth-forms/kubernetes-config-auth-form/kubernetes-config-auth-form.component';
import { KubernetesGKEAuthFormComponent } from './auth-forms/kubernetes-gke-auth-form/kubernetes-gke-auth-form.component';

import { kubernetesEntities, kubernetesEntityKeys } from './store/kubernetes.entities';

const enum KubeEndpointAuthTypes {
  CERT_AUTH = 'kube-cert-auth',
  CONFIG = 'kubeconfig',
  CONFIG_AZ = 'kubeconfig-az',
  AWS_IAM = 'aws-iam',
  GKE = 'gke-auth'
}

const kubernetesEndpointTypes: EndpointTypeExtensionConfig[] = [{
  type: 'k8s',
  label: 'Kubernetes',
  subTypes: [{
    subType: 'caasp',
    label: 'SUSE CaaS Platform',
    authTypes: [KubeEndpointAuthTypes.CONFIG],
    imagePath: '/core/assets/custom/SUSE_icon_color.png'
  }, {
    subType: 'aks',
    label: 'Azure AKS',
    authTypes: [KubeEndpointAuthTypes.CONFIG_AZ],
    imagePath: '/core/assets/custom/aks.png'
  }, {
    subType: 'eks',
    label: 'Amazon EKS',
    authTypes: [KubeEndpointAuthTypes.AWS_IAM],
    imagePath: '/core/assets/custom/eks.jpg'
  }, {
    subType: 'gke',
    label: 'Google Kubernetes Engine (GKE)',
    authTypes: [KubeEndpointAuthTypes.GKE],
    imagePath: '/core/assets/custom/kubernetes.svg'
  }],
  authTypes: [KubeEndpointAuthTypes.CERT_AUTH],
  icon: 'kubernetes',
  iconFont: 'stratos-icons',
  imagePath: '/core/assets/custom/kubernetes.svg',
  homeLink: (guid) => ['/kubernetes', guid],
  entitySchemaKeys: kubernetesEntityKeys,
  order: 4
}];


const kubernetesAuthTypes: EndpointAuthTypeConfig[] = [{
  value: KubeEndpointAuthTypes.CONFIG,
  name: 'CAASP (OIDC)',
  form: {
    kubeconfig: ['', Validators.required],
  },
  types: new Array<EndpointType>(),
  component: KubernetesConfigAuthFormComponent
},
{
  value: KubeEndpointAuthTypes.CONFIG_AZ,
  name: 'Azure AKS',
  form: {
    kubeconfig: ['', Validators.required],
  },
  types: new Array<EndpointType>(),
  component: KubernetesConfigAuthFormComponent
},
{
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
{
  value: KubeEndpointAuthTypes.CERT_AUTH,
  name: 'Kubernetes Cert Auth',
  form: {
    cert: ['', Validators.required],
    certKey: ['', Validators.required],
  },
  types: new Array<EndpointType>(),
  component: KubernetesCertsAuthFormComponent
},
{
  value: KubeEndpointAuthTypes.GKE,
  name: 'GKE',
  form: {
    gkeconfig: ['', Validators.required],
  },
  types: new Array<EndpointType>(),
  component: KubernetesGKEAuthFormComponent
  }
];

@StratosExtension({
  endpointTypes: kubernetesEndpointTypes,
  authTypes: kubernetesAuthTypes,
  entities: kubernetesEntities,
})
@NgModule({
  imports: [
    CoreModule
  ]
})
export class KubernetesStoreModule { }
