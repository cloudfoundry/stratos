import { HttpClient } from '@angular/common/http';
import { Component, Input } from '@angular/core';
import * as markdown from 'marked';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Component({
  selector: 'app-analysis-info-card',
  templateUrl: './analysis-info-card.component.html',
  styleUrls: ['./analysis-info-card.component.scss']
})
export class AnalysisInfoCardComponent {

  public loading = true;
  public content$: Observable<string>;
  private renderer = new markdown.Renderer();

  public mAanalyzer = {};

  @Input() set analyzer(analyzer: any) {
    if (analyzer && analyzer.descriptionUrl) {
      this.content$ = this.getDescription(analyzer.descriptionUrl);
    }
    this.mAanalyzer = analyzer;
  }

  get analyzer() {
    return this.mAanalyzer;
  }

  constructor(private http: HttpClient) {
    this.renderer.link = (href, title, text) => `<a target="_blank" title="${title || ''}" href="${href}">${text}</a>`;
    this.renderer.code = (text: string) => `<code>${text}</code>`;
  }

  private getDescription(url): Observable<any> {
    return this.http.get(url, { responseType: 'text' }).pipe(
      map(resp => {
        this.loading = false;
        return markdown(resp, {
          renderer: this.renderer
        });
      }),
      catchError((error) => {
        this.loading = false;
        if (error.status === 404) {
          return of('<h1>Unable to load description for this Analyzer</h1>');
        } else {
          return of('<h1>An error occurred retrieving description for this Analyzer</h1>');
        }
      }
      ));
  }

}
