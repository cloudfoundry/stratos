import { AsyncPipe, DecimalPipe } from "@angular/common";
import {
  Component,
  OnDestroy,
  OnInit,
  inject,
  ChangeDetectionStrategy,
  Signal,
  computed,
  input,
  signal,
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
  readonly title = input("Memory");

  readonly metric = input<KubeNodeMetric>();

  readonly period = input("Hour");

  readonly unit = input<string>();

  max$!: Observable<number>;
  mean$!: Observable<number>;
  // Why either statistic failed to load, shown in place of the values.
  private readonly statErrors = signal<Signal<string | null>[]>([]);
  readonly errorText = computed(() => this.statErrors().map(e => e()).find(e => !!e) ?? null);
  subscriptions: Subscription[] = [];
  public kubeNodeService = inject(KubernetesNodeService);

  ngOnInit() {
    const maxMetric = this.kubeNodeService.setupMetricObservable(
      this.metric(),
      MetricStatistic.MAXIMUM,
    );
    this.subscriptions.push(maxMetric.pollerSub);
    this.max$ = maxMetric.entity$;

    const meanMetric = this.kubeNodeService.setupMetricObservable(
      this.metric(),
      MetricStatistic.AVERAGE,
    );
    this.subscriptions.push(meanMetric.pollerSub);
    this.mean$ = meanMetric.entity$;
    this.statErrors.set([maxMetric.error, meanMetric.error]);
  }

  ngOnDestroy() {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }
}
