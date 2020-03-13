import { Component, Input, OnInit, ViewChild, ElementRef, AfterViewInit, Renderer2 } from '@angular/core';

@Component({
  selector: 'app-no-content-message',
  templateUrl: './no-content-message.component.html',
  styleUrls: ['./no-content-message.component.scss']
})
export class NoContentMessageComponent implements AfterViewInit {

  @Input() icon: string;
  @Input() iconFont: string;
  @Input() firstLine: string;
  @Input() secondLine: {
    link?: string;
    linkText?: string;
    text: string;
  };
  @Input() toolbarLink: {
    text: string;
  };
  @Input() toolbarAlign: string;

  @ViewChild('toolBarLinkElement', {static: false}) toolBarLinkElement: ElementRef;

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
