import { HttpClient } from '@angular/common/http';
import {Component, Input, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { marked, type Token } from 'marked';
import { type Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

interface Analyzer {
  iconUrl?: string;
  iconWidth?: number;
  descriptionUrl?: string;
}

@Component({
  selector: 'app-analysis-info-card',
  templateUrl: './analysis-info-card.component.html',
  styleUrls: ['./analysis-info-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule
  ]
})
export class AnalysisInfoCardComponent {

  public loading = true;
  public content$: Observable<string>;
  private renderer = new marked.Renderer();
  private parser = new marked.Parser();

  public mAanalyzer: Analyzer = {};

  @Input() set analyzer(analyzer: Analyzer) {
    if (analyzer?.descriptionUrl) {
      this.content$ = this.getDescription(analyzer.descriptionUrl);
    }
    this.mAanalyzer = analyzer;
  }

  get analyzer() {
    return this.mAanalyzer;
  }  private http = inject(HttpClient);



  constructor() {
    this.renderer.link = ({ href, title, tokens }: { href: string; title?: string | null; tokens: Token[] }) => `<a target="_blank" title="${title ?? ''}" href="${href}">${this.parser.parseInline(tokens)}</a>`;
    this.renderer.code = ({ text }: { text: string }) => `<code>${text}</code>`;


  }

  private getDescription(url: string): Observable<string> {
    return this.http.get(url, { responseType: 'text' }).pipe(
      map((resp: string) => {
        this.loading = false;
        return marked(resp, {
          renderer: this.renderer
        }) as string;
      }),
      catchError((error: { status: number }) => {
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
