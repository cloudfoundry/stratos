import { Component, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DomSanitizer } from '@angular/platform-browser';

import { EndpointsService } from '../../../../../../../core/src/core/endpoints.service';
import { Chart } from '../../shared/models/chart';

@Component({
  selector: 'app-chart-details-usage',
  templateUrl: './chart-details-usage.component.html',
  styleUrls: ['./chart-details-usage.component.scss'],
  viewProviders: [MatIconRegistry],
  encapsulation: ViewEncapsulation.None
})
export class ChartDetailsUsageComponent implements OnInit {
  @Input() chart: Chart;
  @Input() currentVersion: string;
  installing: boolean;

  constructor(
    private mdIconRegistry: MatIconRegistry,
    private sanitizer: DomSanitizer,
    public snackBar: MatSnackBar,
    public endpointsService: EndpointsService
  ) { }

  ngOnInit() {
    this.mdIconRegistry.addSvgIcon(
      'content-copy',
      this.sanitizer.bypassSecurityTrustResourceUrl(
        // TODO: See #150 - content-copy.svg doesn't exist
        '/assets/icons/content-copy.svg'
      )
    );
  }

  // Show an snack bar to confirm the user that the code has been copied
  showSnackBar(): void {
    this.snackBar.open('Copied to the clipboard', '', {
      duration: 1500
    });
  }

  get showRepoInstructions(): boolean {
    return this.chart.attributes.repo.name !== 'stable';
  }

  get repoAddInstructions(): string {
    return `helm repo add ${this.chart.attributes.repo.name} ${this.chart
      .attributes.repo.url}`;
  }

  get installInstructions(): string {
    return `helm install ${this.chart.id} --version ${this.currentVersion}`;
  }

}
