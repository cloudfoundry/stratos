import { AfterViewInit, Component, ElementRef, Input, Renderer2, ViewChild, inject, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CustomIconComponent } from '../custom-material/custom-material.component';

export interface NoContentMessageLine {
  link?: string;
  linkText?: string;
  text: string;
}
@Component({
  selector: 'app-no-content-message',
  templateUrl: './no-content-message.component.html',
  styleUrls: ['./no-content-message.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    CustomIconComponent,
    RouterModule
  ]
})
export class NoContentMessageComponent implements AfterViewInit {

  readonly icon = input<string>();
  readonly iconFont = input<string>();
  @Input() firstLine?: string;
  @Input() secondLine?: NoContentMessageLine | null;
  readonly otherLines = input<NoContentMessageLine[]>();
  @Input() toolbarLink?: {
    text: string;
  };
  readonly toolbarAlign = input<string>();

  readonly mode = input<string>();

  @ViewChild('toolBarLinkElement', { static: false }) toolBarLinkElement?: ElementRef;
  private renderer = inject(Renderer2);

  ngAfterViewInit() {
    // Align the prompt with the toolbar item ...
    // Note - Only execute after a delay. The final place of the target element may change given visibility of other menu items
    // (polling disabled, notification bell). We should come back to this and replace the timeout with a better way of determining readyness
    setTimeout(() => {
      const toolbarAlign = this.toolbarAlign();
      if (this.toolBarLinkElement && toolbarAlign) {
        const elem = document.getElementById(toolbarAlign);
        if (elem) {
          // The prompt is placed inside its container, which starts well
          // below the toolbar, so measure both offsets from the container.
          // Its arrow starts below the page header's bar, which draws over
          // anything inside it.
          const link: HTMLElement = this.toolBarLinkElement.nativeElement;
          const target = elem.getBoundingClientRect();
          const top = (elem.closest('.page-header-outer') ?? elem).getBoundingClientRect().bottom;
          const box = link.parentElement!.getBoundingClientRect();
          this.renderer.setStyle(link, 'top', (top - box.top) + 'px');
          this.renderer.setStyle(link, 'right', (box.right - target.right - 3) + 'px');
          this.renderer.addClass(this.toolBarLinkElement.nativeElement, 'app-no-content-container__link--show');
        }
      }
    }, 500);
  }
}
