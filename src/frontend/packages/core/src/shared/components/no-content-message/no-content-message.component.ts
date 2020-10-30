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
    // Align the prompt with the toolbar item ...
    // Note - Only execute after a delay. The final place of the target element may change given visibility of other menu items
    // (polling disabled, notification bell). We should come back to this and replace the timeout with a better way of determining readyness
    setTimeout(() => {
      if (this.toolBarLinkElement) {
        const elem = document.getElementById(this.toolbarAlign);
        if (elem) {
          const right = document.body.clientWidth - elem.getBoundingClientRect().right - 3;
          this.renderer.setStyle(this.toolBarLinkElement.nativeElement, 'right', right + 'px');
          this.renderer.addClass(this.toolBarLinkElement.nativeElement, 'app-no-content-container__link--show');
        }
      }
    }, 500);
  }
}
