import moment from 'moment';

import { EndpointRelationshipTypeMetadataJob, EndpointRelationshipTypes } from '../../store/src/types/endpoint.types';

export enum CfRelationTypes {
  /**
   * Metrics endpoint provides cf metrics to a cloud foundry endpoint
   */
  METRICS_CF = 'metrics-cf',
  /**
   * Metrics endpoint provides eirini (kube) metrics to a cloud foundry endpoint
   */
  METRICS_EIRINI = 'metrics-eirini'
}

EndpointRelationshipTypes[CfRelationTypes.METRICS_CF] = {
  metadata: [
    {
      type: EndpointRelationshipTypeMetadataJob,
      icon: 'help_outline',
      value: (job: any) => job.health ? (job.health as string).toUpperCase() : '',
      label: 'Exporter Health',
    },
    {
      type: EndpointRelationshipTypeMetadataJob,
      icon: 'schedule',
      value: (job: any) => job.lastScrape ? moment(job.lastScrape).format('LLL') : 'None',
      label: 'Exporter Last Scrape',
    },
    {
      type: EndpointRelationshipTypeMetadataJob,
      icon: 'error_outline',
      value: (job: any) => job.lastError || 'None',
      label: 'Exporter Last Error',
    },
  ]
};

EndpointRelationshipTypes[CfRelationTypes.METRICS_EIRINI] = {
  metadata: [
    {
      icon: 'history',
      value: (relMetadata: any) => relMetadata.namespace,
      label: 'Eirini Pod Namespace',
    },
  ]
};
