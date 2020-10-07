import { EndpointRelationshipTypes } from '../../../store/src/types/endpoint.types';

export enum KubeRelationTypes {
  /**
   * Metrics endpoint provides metrics to a kube endpoint
   */
  METRICS_KUBE = 'metrics-kube'
}

EndpointRelationshipTypes[KubeRelationTypes.METRICS_KUBE] = {
  label: 'Kubernetes Metrics',
  metadata: [
    {
      icon: 'history',
      value: (relMetadata: any) => relMetadata.job,
      label: 'Prometheus Job',
    },
  ]
};