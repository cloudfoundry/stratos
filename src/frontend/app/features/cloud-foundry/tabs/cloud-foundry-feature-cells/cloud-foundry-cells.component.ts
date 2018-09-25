import { Component } from '@angular/core';
import { Store } from '@ngrx/store';

import {
  CfFeatureFlagsListConfigService,
} from '../../../../shared/components/list/list-types/cf-feature-flags/cf-feature-flags-list-config.service';
import { ListConfig } from '../../../../shared/components/list/list.component.types';
import { AppState } from '../../../../store/app-state';
import { CloudFoundryEndpointService } from '../../services/cloud-foundry-endpoint.service';
import { MetricQueryConfig, MetricQueryType, FetchCFMetricsAction } from '../../../../store/actions/metrics.actions';

@Component({
  selector: 'app-cloud-foundry-cells',
  templateUrl: './cloud-foundry-cells.component.html',
  styleUrls: ['./cloud-foundry-cells.component.scss'],
  providers: [
    {
      provide: ListConfig,
      useClass: CfFeatureFlagsListConfigService
    }
  ]
})
export class CloudFoundryCellsComponent {

  constructor(
    private store: Store<AppState>,
    public cfEndpointService: CloudFoundryEndpointService,
  ) {
    // TODO: RC Move to config service
    // response
    // {"IcXF69N2sUyBYliHug7f-_17WCA":{"status":"success","data":{"resultType":"vector","result":[{"metric":{"__name__":"firehose_value_metric_rep_unhealthy_cell","bosh_deployment":"pcfdev","bosh_job_id":"0","bosh_job_name":"pcfdev","doppler_endpoint":"wss://doppler.local.pcfdev.io:443","environment":"wss://doppler.local.pcfdev.io:443","instance":"kneeling-cheetah-f-exp-service:9186","job":"cf-firehose","origin":"rep","unit":"Metric"},"value":[1537886663.132,"0"]}]}}}
    const action = new FetchCFMetricsAction(
      cfEndpointService.cfGuid,
      new MetricQueryConfig('firehose_value_metric_rep_unhealthy_cell', {}),
      MetricQueryType.QUERY
    );
    store.dispatch(action);
  }
}
