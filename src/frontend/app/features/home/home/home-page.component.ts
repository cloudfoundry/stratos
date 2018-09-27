import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { FetchApplicationMetricsAction, MetricQueryConfig } from '../../../store/actions/metrics.actions';
import { AppState } from '../../../store/app-state';

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.scss']
})
export class HomePageComponent implements OnInit {

  constructor(private store: Store<AppState>) { }
  public metricsAction = new FetchApplicationMetricsAction(
    'fbb2e26f-491f-468c-8d5b-ed02028f7106',
    'rqljU7j5TF-v8_nyozXsd6kDUeU',
    new MetricQueryConfig('firehose_container_metric_cpu_percentage')
  );
  ngOnInit() { }
}
