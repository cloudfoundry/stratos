import { Component, OnInit } from '@angular/core';
import { KubernetesNodeService, KubeNodeMetric } from '../../services/kubernetes-node.service';

@Component({
  selector: 'app-kubernetes-node-metrics',
  templateUrl: './kubernetes-node-metrics.component.html',
  styleUrls: ['./kubernetes-node-metrics.component.scss']
})
export class KubernetesNodeMetricsComponent implements OnInit {
  memoryMetric: KubeNodeMetric;
  cpuMetric: KubeNodeMetric;
  memoryUnit: string;
  cpuUnit: string;

  constructor(
    public kubeNodeService: KubernetesNodeService
  ) { }

  ngOnInit() {

    this.memoryMetric = KubeNodeMetric.MEMORY;
    this.cpuMetric = KubeNodeMetric.CPU;
    this.memoryUnit = 'bytes';
    this.cpuUnit = 'secs';
  }

}
