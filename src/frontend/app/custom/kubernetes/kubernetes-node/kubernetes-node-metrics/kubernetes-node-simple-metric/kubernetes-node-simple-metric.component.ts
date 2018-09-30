import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-kubernetes-node-simple-metric',
  templateUrl: './kubernetes-node-simple-metric.component.html',
  styleUrls: ['./kubernetes-node-simple-metric.component.scss']
})
export class KubernetesNodeSimpleMetricComponent implements OnInit {

  @Input()
  key: string;

  @Input()
  value: number;

  constructor() { }

  ngOnInit() {
  }

}
