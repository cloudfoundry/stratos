import { HttpClient } from '@angular/common/http';
import { Component, inject, input, linkedSignal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { marked } from 'marked';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Component({
  selector: 'app-analysis-info-card',
  templateUrl: './analysis-info-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule
  ]
})
export class AnalysisInfoCardComponent {

  private http = inject(HttpClient);

  public loading = true;
  private renderer = new marked.Renderer();
  private parser = new marked.Parser();

  readonly analyzer = input<any>({});

  // The analyzer's description as HTML. An analyzer without a description
  // URL keeps the last description.
  readonly content$ = linkedSignal<any, Observable<string> | undefined>({
    source: this.analyzer,
    computation: (analyzer, previous) => analyzer && analyzer.descriptionUrl
      ? this.getDescription(analyzer.descriptionUrl)
      : previous?.value,
  });


  constructor() {
    this.renderer.link = ({ href, title, tokens }: { href: string; title?: string | null; tokens: any }) => `<a target="_blank" title="${title ?? ''}" href="${href}">${this.parser.parseInline(tokens)}</a>`;
    this.renderer.code = ({ text }: { text: string }) => `<code>${text}</code>`;


  }

  private getDescription(url: string): Observable<any> {
    return this.http.get(url, { responseType: 'text' }).pipe(
      map((resp: string) => {
        this.loading = false;
        return marked(resp, {
          renderer: this.renderer
        });
      }),
      catchError((error: any) => {
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
