import { Component, OnInit, Input, Renderer2, ViewChild, ElementRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as marked from 'marked';

@Component({
  selector: 'app-markdown-preview',
  templateUrl: './markdown-preview.component.html',
  styleUrls: ['./markdown-preview.component.scss']
})
export class MarkdownPreviewComponent implements OnInit {

  markdownHtml: string;
  documentUrl: string;
  title = '';

  @Input('documentUrl')
  set setDocumentUrl(value: string) {
    if (this.documentUrl !== value) {
      this.documentUrl = value;
      this.title = '';
      this.loadDocument();
    }
  }

  @ViewChild('markdown') public markdown: ElementRef;

  constructor(private httpClient: HttpClient) { }

  ngOnInit() { }

  private loadDocument() {
    this.httpClient.get(this.documentUrl, {responseType: 'text'}).subscribe((markText) => {
      if (markText && markText.length > 0) {
        this.markdownHtml = marked(markText);
      }
    });
  }

  public markdownRendered() {
    // Find the page title and move it to the header
    const h1 = this.markdown.nativeElement.getElementsByTagName('h1');
    if (!this.title) {
      if (h1.length > 0) {
        const titleElement = h1[0];
        this.title = titleElement.innerText;
        titleElement.remove();
      } else {
        this.title = 'Help';
      }
    }
  }

}
