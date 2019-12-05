import { Component, Input } from '@angular/core';
import * as markdown from 'marked';
import { Observable, of as observableOf } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { ChartVersion } from '../../shared/models/chart-version';
import { ChartsService } from '../../shared/services/charts.service';

@Component({
  selector: 'app-chart-details-readme',
  templateUrl: './chart-details-readme.component.html',
  styleUrls: ['./chart-details-readme.component.scss']
})
export class ChartDetailsReadmeComponent {

  @Input() set currentVersion(currentVersion: ChartVersion) {
    if (currentVersion) {
      this.readmeContent$ = this.getReadme(currentVersion);
    }
  }

  public loading = true;
  public readmeContent$: Observable<string>;
  private renderer = new markdown.Renderer();

  constructor(private chartsService: ChartsService) {
    this.renderer.link = (href, title, text) => `<a target="_blank" title="${title}" href="${href}">${text}</a>`;
    this.renderer.code = (text: string) => `<code>${text}</code>`;
  }

  // TODO: See #150 - This should not require loading the specific version and then the readme
  private getReadme(currentVersion: ChartVersion): Observable<string> {
    return this.chartsService.getChartReadme(currentVersion).pipe(
      map(resp => {
        this.loading = false;
        return markdown(resp, {
          renderer: this.renderer
        });
      }),
      catchError((error) => {
        this.loading = false;
        if (error.status === 404) {
          return observableOf('<h1>No Readme available for this chart</h1>');
        } else {
          return observableOf('<h1>An error occurred retrieving Readme</h1>');
        }
      }));
  }
}
