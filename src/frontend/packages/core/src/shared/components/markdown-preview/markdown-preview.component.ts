
import { HttpClient, HttpResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, ElementRef, Input, ViewChild, inject, signal } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

import { PreviewableComponent } from '../../previewable-component';

import { marked } from 'marked';
import { SidepanelPreviewComponent } from '../sidepanel-preview/sidepanel-preview.component';
import { MarkdownContentObserverDirective } from './markdown-content-observer.directive';

@Component({
  selector: 'app-markdown-preview',
  templateUrl: './markdown-preview.component.html',
  standalone: true,
  imports: [
    SidepanelPreviewComponent,
    MarkdownContentObserverDirective
],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MarkdownPreviewComponent implements PreviewableComponent {
  private httpClient = inject(HttpClient);
  private domSanitizer = inject(DomSanitizer);


  // Signals: both are written asynchronously (HTTP response, a timeout) and an
  // OnPush view under zoneless CD only repaints for signal writes.
  readonly markdownHtml = signal('');
  private _documentUrl!: string;
  // null is a sentinel meaning "title not yet derived from the document"
  readonly title = signal<string | null>('');
  readonly unavailable = signal(false);

  @Input()
  set documentUrl(value: string) {
    if (value && this._documentUrl !== value) {
      this._documentUrl = value;
      this.title.set(null);
      this.unavailable.set(false);
      this.loadDocument();
    }
  }

  // strict: static @ViewChild is available from ngOnInit onward
  @ViewChild('markdown', { static: true }) public markdown!: ElementRef;

  private parseInline(tokens: any[]): string {
    return tokens.map((token: any) => {
      if (token.type === 'text') {
        return token.raw;
      }
      return token.raw || '';
    }).join('');
  }

  setProps(props: { [key: string]: any, }) {
    this.documentUrl = props.documentUrl;
  }

  private loadDocument() {
    this.httpClient.get(this._documentUrl, { responseType: 'text', observe: 'response' }).subscribe({
      next: (response: HttpResponse<string>) => {
        const markText = response.body ?? '';
        if (this.isHtmlPage(response, markText)) {
          this.showUnavailable();
        } else if (markText.length > 0) {
          // Basic sanitization - Note: marked no longer supports sanitize option
          const renderer = new marked.Renderer();
          // Ensure links in the readme open in a new tab
          renderer.link = ({ href, title, tokens }: any) => {
            const text = this.parseInline(tokens);
            return `<a target="_blank" href="${href}" ${title ? `title="${title}"` : ''}>${text}</a>`;
          };
          const result = marked(markText, { renderer });
          this.markdownHtml.set(typeof result === 'string' ? result : '');
        }
      },
      error: (error: any) => {
        console.warn(`Failed to fetch markdown with url ${this._documentUrl}: `, error);
        this.showUnavailable();
      }
    });
  }

  // A help URL with no file behind it gets the SPA fallback page, which would
  // otherwise render as the help text.
  private isHtmlPage(response: HttpResponse<string>, text: string): boolean {
    const contentType = response.headers.get('Content-Type') ?? '';
    return contentType.includes('text/html') || /^\s*<(!doctype|html)/i.test(text);
  }

  private showUnavailable() {
    this.markdownHtml.set('');
    this.unavailable.set(true);
    this.title.set('Help');
  }

  public markdownRendered() {
    // Find the page title and move it to the header
    const h1 = this.markdown.nativeElement.getElementsByTagName('h1');
    if (this.title() === null) {
      if (h1.length > 0) {
        window.setTimeout(() => {
          const titleElement = h1[0];
          const titleText = titleElement.innerText;
          titleElement.remove();
          this.title.set(titleText);
        }, 100);
      } else {
        this.title.set('Help');
      }
    }
  }

}
