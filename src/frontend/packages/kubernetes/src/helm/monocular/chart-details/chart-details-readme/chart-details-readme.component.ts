import { Component, inject, ChangeDetectionStrategy, input, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { marked } from 'marked';
import { Observable, of as observableOf } from 'rxjs';
import { catchError, filter, map, switchMap, tap } from 'rxjs/operators';

import { ChartVersion } from '../../shared/models/chart-version';
import { ChartsService } from '../../shared/services/charts.service';
import { LoaderComponent } from '../../loader/loader.component';

@Component({
  selector: 'app-chart-details-readme',
  templateUrl: './chart-details-readme.component.html',

  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    LoaderComponent
  ]
})
export class ChartDetailsReadmeComponent {

  readonly currentVersion = input<ChartVersion>();

  // Nothing renders until the readme arrives, so show the spinner from the start
  public loading = signal(true);
  private renderer = new marked.Renderer();
  private chartsService = inject(ChartsService);

  public readmeContent = toSignal(toObservable(this.currentVersion).pipe(
    filter((currentVersion): currentVersion is ChartVersion => !!currentVersion),
    tap(() => this.loading.set(true)),
    switchMap(currentVersion => this.getReadme(currentVersion)),
  ));

  constructor() {
    this.renderer.link = ({ href, title, text }) => `<a target="_blank" title="${title}" href="${href}">${text}</a>`;
    this.renderer.code = ({ text, lang: _lang, escaped: _escaped }: { text: string; lang?: string; escaped?: boolean }) => `<code>${text}</code>`;
  }

  // TODO: See #150 - This should not require loading the specific version and then the readme
  private getReadme(currentVersion: ChartVersion): Observable<string> {
    return this.chartsService.getChartReadme(currentVersion).pipe(
      map(resp => {
        this.loading.set(false);
        const result = marked(resp, {
          renderer: this.renderer
        });
        return typeof result === 'string' ? result : '';
      }),
      catchError((error) => {
        this.loading.set(false);
        if (error.status === 404) {
          return observableOf('<h1>No Readme available for this chart</h1>');
        } else {
          return observableOf('<h1>An error occurred retrieving Readme</h1>');
        }
      }));
  }
}
