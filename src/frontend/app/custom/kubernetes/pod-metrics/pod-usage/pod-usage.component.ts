import { Component, OnInit, Input } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HelmReleaseService } from '../../services/helm-release.service';

@Component({
  selector: 'app-pod-usage',
  templateUrl: './pod-usage.component.html',
  styleUrls: ['./pod-usage.component.scss']
})
export class PodUsageComponent implements OnInit {
  podName: string;

  @Input()
  yAxisLabel: string;

  @Input()
  seriesTranslation: string;

  @Input()
  title: string;

  @Input()
  metric: string;


  constructor(
    public activatedRoute: ActivatedRoute,
    public helmReleaseService: HelmReleaseService,

  ) {
    this.podName = activatedRoute.snapshot.params['podName'];

  }

  ngOnInit() {
  }

}
