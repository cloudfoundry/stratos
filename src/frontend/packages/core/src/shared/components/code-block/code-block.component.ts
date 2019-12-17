import { AfterViewInit, Component, ElementRef, Input, OnDestroy, ViewChild } from '@angular/core';

@Component({
  selector: 'app-code-block',
  templateUrl: './code-block.component.html',
  styleUrls: ['./code-block.component.scss']
})
export class CodeBlockComponent implements AfterViewInit, OnDestroy {


  @Input() hideCopy: boolean;
  @Input() codeBlockStyle: string;
  text: string;
  private observer: MutationObserver;

  @ViewChild('preBlock', { static: true }) code: ElementRef;

  ngAfterViewInit() {
    this.text = this.code.nativeElement.innerText.trim();

    this.observer = new MutationObserver(() => {
      this.text = this.code.nativeElement.innerText.trim();
    });
    const config: MutationObserverInit = {
      characterData: true,
      childList: true,
      subtree: true,
    };
    this.observer.observe(this.code.nativeElement, config);
  }

  ngOnDestroy() {
    this.observer.disconnect();
  }
}
