import { AsyncPipe, DecimalPipe } from "@angular/common";
import {
  Component,
  Input,
  OnDestroy,
  OnInit,
  inject,
  ChangeDetectionStrategy,
} from "@angular/core";
import { Observable, Subscription } from "rxjs";

import { BytesToHumanSize } from "@stratosui/core";
import {
  KubeNodeMetric,
  KubernetesNodeService,
} from "../../../services/kubernetes-node.service";
import { MetricStatistic } from "../../../store/kube.types";
import { KubernetesNodeSimpleMetricComponent } from "../kubernetes-node-simple-metric/kubernetes-node-simple-metric.component";

@Component({
  selector: "app-kubernetes-node-metric-stats-card",
  templateUrl: "./kubernetes-node-metric-stats-card.component.html",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AsyncPipe,
    DecimalPipe,
    BytesToHumanSize,
    KubernetesNodeSimpleMetricComponent,
  ],
})
export class KubernetesNodeMetricStatsCardComponent
  implements OnInit, OnDestroy
{
  @Input()
  title = "Memory";

  @Input()
  metric!: KubeNodeMetric;

  @Input()
  period = "Hour";

  @Input()
  unit!: string;

  max$!: Observable<number>;
  mean$!: Observable<number>;
  subscriptions: Subscription[] = [];
  public kubeNodeService = inject(KubernetesNodeService);

  ngOnInit() {
    const maxMetric = this.kubeNodeService.setupMetricObservable(
      this.metric,
      MetricStatistic.MAXIMUM,
    );
    this.subscriptions.push(maxMetric.pollerSub);
    this.max$ = maxMetric.entity$;

    const meanMetric = this.kubeNodeService.setupMetricObservable(
      this.metric,
      MetricStatistic.AVERAGE,
    );
    this.subscriptions.push(meanMetric.pollerSub);
    this.mean$ = meanMetric.entity$;
  }

  ngOnDestroy() {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
