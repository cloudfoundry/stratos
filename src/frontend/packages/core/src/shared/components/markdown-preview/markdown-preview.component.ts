
import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, type ElementRef, Input, ViewChild  } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

import type { PreviewableComponent } from '../../previewable-component';

import { marked } from 'marked';
import { SidepanelPreviewComponent } from '../sidepanel-preview/sidepanel-preview.component';
import { MarkdownContentObserverDirective } from './markdown-content-observer.directive';

// Type for marked tokens
interface MarkedToken {
  type: string;
  raw: string;
  text?: string;
  tokens?: MarkedToken[];
}

@Component({
  selector: 'app-markdown-preview',
  templateUrl: './markdown-preview.component.html',
  styleUrls: ['./markdown-preview.component.scss'],
  standalone: true,
  imports: [
    SidepanelPreviewComponent,
    MarkdownContentObserverDirective
],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MarkdownPreviewComponent implements PreviewableComponent {

  markdownHtml!: string;
  documentUrl!: string;
  title: string | null = '';

  @Input('documentUrl')
  set setDocumentUrl(value: string) {
    if (value && this.documentUrl !== value) {
      this.documentUrl = value;
      this.title = null;
      this.loadDocument();
    }
  }

  @ViewChild('markdown', { static: true }) public markdown: ElementRef;

  constructor(
    private httpClient: HttpClient,_domSanitizer: DomSanitizer
  ) { }

  private parseInline(tokens: MarkedToken[]): string {
    return tokens.map((token: MarkedToken) => {
      if (token.type === 'text') {
        return token.raw;
      }
      return token.raw || '';
    }).join('');
  }

  setProps(props: Record<string, unknown>) {
    this.setDocumentUrl = props.documentUrl as string;
  }

  private loadDocument() {
    this.httpClient.get(this.documentUrl, { responseType: 'text' }).subscribe(
      (markText: string) => {
        if (markText && markText.length > 0) {
          // Basic sanitization - Note: marked no longer supports sanitize option
          const renderer = new marked.Renderer();
          // Ensure links in the readme open in a new tab
          renderer.link = ({ href, title, tokens }: { href?: string; title?: string; tokens?: MarkedToken[] }) => {
            const text = this.parseInline(tokens || []);
            return `<a target="_blank" href="${href}" ${title ? `title="${title}"` : ''}>${text}</a>`;
          };
          const result = marked(markText, { renderer });
          this.markdownHtml = typeof result === 'string' ? result : '';
        }
      },
      (error: unknown) => console.warn(`Failed to fetch markdown with url ${this.documentUrl}: `, error));
  }

  public markdownRendered() {
    // Find the page title and move it to the header
    const h1 = this.markdown.nativeElement.getElementsByTagName('h1');
    if (this.title === null) {
      if (h1.length > 0) {
        window.setTimeout(() => {
          const titleElement = h1[0];
          const titleText = titleElement.innerText;
          titleElement.remove();
          this.title = titleText;
        }, 100);
      } else {
        this.title = 'Help';
      }
    }
  }

}
