import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { Observable, of as observableOf, Subscription, observable } from 'rxjs';
import { KubernetesNodeService, KubeNodeMetric } from '../../../services/kubernetes-node.service';
import { MetricStatistic } from '../../../store/kube.types';

@Component({
  selector: 'app-kubernetes-node-metric-stats-card',
  templateUrl: './kubernetes-node-metric-stats-card.component.html',
  styleUrls: ['./kubernetes-node-metric-stats-card.component.scss']
})
export class KubernetesNodeMetricStatsCardComponent implements OnInit, OnDestroy {

  @Input()
  title = 'Memory';

  @Input()
  metric: KubeNodeMetric;

  @Input()
  period = 'Hour';

  @Input()
  unit: string;

  max$: Observable<number>;
  mean$: Observable<number>;
  subscriptions: Subscription[] = [];
  constructor(
    public kubeNodeService: KubernetesNodeService
  ) {}

  ngOnInit() {
    const maxMetric = this.kubeNodeService.setupMetricObservable(this.metric, MetricStatistic.MAXIMUM);
    this.subscriptions.push(maxMetric.pollerSub);
    this.max$ = maxMetric.entity$;

    const meanMetric = this.kubeNodeService.setupMetricObservable(this.metric, MetricStatistic.AVERAGE);
    this.subscriptions.push(meanMetric.pollerSub);
    this.mean$ = meanMetric.entity$;
  }


  ngOnDestroy() {
    this.subscriptions.forEach(s => s.unsubscribe());
  }

}
