import { ActivatedRoute } from '@angular/router';

import { Chart } from './shared/models/chart';


/**
 * Stratos Monocular has no concept of an endpoint (it has monocular repo endpoints...) so give it a default string
 * Note - This could be the guid for the helm hub endpoint
 */
export const stratosMonocularEndpointGuid = 'default';

/**
 * Add the monocular endpoint id to a url. This could be the helm hub endpoint guid or `default` for stratos monocular
 */
export const getMonocularEndpoint = (route?: ActivatedRoute, chart?: Chart, ifEmpty = stratosMonocularEndpointGuid) => {
  const endpointFromRoute = route ? route.snapshot.params.endpoint : null;
  const endpointFromChart = chart ? chart.monocularEndpointId : null;
  return endpointFromRoute || endpointFromChart || ifEmpty;
};
