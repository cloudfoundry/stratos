import { Component, OnInit } from '@angular/core';
import { HelmReleaseService } from '../../../../services/helm-release.service';

@Component({
  selector: 'app-helm-release-summary-card',
  templateUrl: './helm-release-summary-card.component.html',
  styleUrls: ['./helm-release-summary-card.component.scss']
})
export class HelmReleaseSummaryCardComponent implements OnInit {

  constructor(
    public helmReleaseService: HelmReleaseService
  ) { }

  ngOnInit() {
  }

}
