import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, Input, SecurityContext, ViewChild } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

import { PreviewableComponent } from '../../previewable-component';

import { marked } from 'marked';

@Component({
selector: 'app-markdown-preview',
  templateUrl: './markdown-preview.component.html',
  styleUrls: ['./markdown-preview.component.scss'],
  standalone: false
})
export class MarkdownPreviewComponent implements PreviewableComponent {

  markdownHtml: string;
  documentUrl: string;
  title = null;

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
    private httpClient: HttpClient,
    private domSanitizer: DomSanitizer
  ) { }

  private parseInline(tokens: any[]): string {
    return tokens.map(token => {
      if (token.type === 'text') {
        return token.raw;
      }
      return token.raw || '';
    }).join('');
  }

  setProps(props: { [key: string]: any, }) {
    this.setDocumentUrl = props.documentUrl;
  }

  private loadDocument() {
    this.httpClient.get(this.documentUrl, { responseType: 'text' }).subscribe(
      (markText) => {
        if (markText && markText.length > 0) {
          // Basic sanitization - Note: marked no longer supports sanitize option
          const renderer = new marked.Renderer();
          // Ensure links in the readme open in a new tab
          renderer.link = ({ href, title, tokens }) => {
            const text = this.parseInline(tokens);
            return `<a target="_blank" href="${href}" ${title ? `title="${title}"` : ''}>${text}</a>`;
          };
          const result = marked(markText, { renderer });
          this.markdownHtml = typeof result === 'string' ? result : '';
        }
      },
      (error) => console.warn(`Failed to fetch markdown with url ${this.documentUrl}: `, error));
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
