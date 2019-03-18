import { Component, OnInit, Input, Renderer2, ViewChild, ElementRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as markdown from 'marked';

@Component({
  selector: 'app-markdown-preview',
  templateUrl: './markdown-preview.component.html',
  styleUrls: ['./markdown-preview.component.scss']
})
export class MarkdownPreviewComponent implements OnInit {

  markdownHtml: string;
  documentUrl: string;
  title = null;

  @Input('documentUrl')
  set setDocumentUrl(value: string) {
    if (this.documentUrl !== value) {
      this.documentUrl = value;
      this.title = null;
      this.loadDocument();
    }
  }

  @ViewChild('markdown') public markdown: ElementRef;

  constructor(private httpClient: HttpClient) { }

  ngOnInit() { }

  private loadDocument() {
    this.httpClient.get(this.documentUrl, {responseType: 'text'}).subscribe((markText) => {
      if (markText && markText.length > 0) {
        // Ensure links in the readme open in a new tab
        const renderer = new markdown.Renderer();
        renderer.link = function(href, title, text) {
          const link = markdown.Renderer.prototype.link.call(this, href, title, text);
          return link.replace('<a', '<a target="_blank" ');
        };
        this.markdownHtml = markdown(markText, { renderer });
      }
    });
  }

  public markdownRendered() {
    // Find the page title and move it to the header
    const h1 = this.markdown.nativeElement.getElementsByTagName('h1');
    if (this.title === null) {
      if (h1.length > 0) {
        // this.title = titleElement.innerText;
        window.setTimeout(() => {
          const titleElement = h1[0];
          const titleText = titleElement.innerText;
          this.title = titleText;
          console.log('Got title: ' + titleText);
        }, 100);
      } else {
        this.title = 'Help';
      }
    }
  }

}
