import { AfterViewInit, Component, ElementRef, Input, Renderer2, ViewChild } from '@angular/core';

export interface NoContentMessageLine {
  link?: string;
  linkText?: string;
  text: string;
}
@Component({
  selector: 'app-no-content-message',
  templateUrl: './no-content-message.component.html',
  styleUrls: ['./no-content-message.component.scss']
})
export class NoContentMessageComponent implements AfterViewInit {

  @Input() icon: string;
  @Input() iconFont: string;
  @Input() firstLine: string;
  @Input() secondLine: NoContentMessageLine;
  @Input() otherLines: NoContentMessageLine[];
  @Input() toolbarLink: {
    text: string;
  };
  @Input() toolbarAlign: string;

  @Input() mode: string;

  @ViewChild('toolBarLinkElement') toolBarLinkElement: ElementRef;

  constructor(private renderer: Renderer2) { }

  ngAfterViewInit() {
    // Align the prompt with the toolbar item
    if (this.toolBarLinkElement) {
      const elem = document.getElementById(this.toolbarAlign);
      if (elem) {
        const right = document.body.clientWidth - elem.getBoundingClientRect().right;
        this.renderer.setStyle(this.toolBarLinkElement.nativeElement, 'right', right + 'px');
      }
    }
  }
}
