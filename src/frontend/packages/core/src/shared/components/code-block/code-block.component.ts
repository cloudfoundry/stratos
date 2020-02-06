import { Component, ElementRef, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';

@Component({
  selector: 'app-code-block',
  templateUrl: './code-block.component.html',
  styleUrls: ['./code-block.component.scss']
})
export class CodeBlockComponent implements OnInit, OnDestroy {

  @Input() hideCopy: boolean;
  @Input() codeBlockStyle: string;
  text = '';
  private observer: MutationObserver;

  @ViewChild('preBlock', { static: true }) code: ElementRef;

  ngOnInit(): void {
    this.observer = new MutationObserver(() => {
      this.text = this.code.nativeElement.innerText.trim();
    });
    const config: MutationObserverInit = {
      // attributeFilter: string[];
      attributeOldValue: true,
      attributes: true,
      characterData: true,
      characterDataOldValue: true,
      childList: true,
      subtree: true,
    };
    this.observer.observe(this.code.nativeElement, config);
  }

  ngOnDestroy() {
    this.observer.disconnect();
  }
}
