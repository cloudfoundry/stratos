import { Component, DoCheck, ElementRef, Input, ViewChild } from '@angular/core';

@Component({
  selector: 'app-code-block',
  templateUrl: './code-block.component.html',
  styleUrls: ['./code-block.component.scss']
})
export class CodeBlockComponent implements DoCheck {

  @Input() hideCopy: boolean;
  @Input() codeBlockStyle: string;
  text: string;

  @ViewChild('preBlock', { static: true }) code: ElementRef;

  ngDoCheck() {
    // TODO: RC improve
    this.text = this.code.nativeElement.innerText.trim();
  }
}
