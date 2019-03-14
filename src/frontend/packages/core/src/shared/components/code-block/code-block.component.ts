import { DOCUMENT } from '@angular/common';
import { Component, ElementRef, Inject, Input, OnInit, ViewChild } from '@angular/core';

import { LoggerService } from '../../../core/logger.service';

@Component({
  selector: 'app-code-block',
  templateUrl: './code-block.component.html',
  styleUrls: ['./code-block.component.scss']
})
export class CodeBlockComponent implements OnInit {
  private document: Document;

  constructor(@Inject(DOCUMENT) document: Document, private logService: LoggerService) {
    this.document = document;
  }

  @Input() hideCopy: boolean;
  @Input() codeBlockStyle: string;
  canCopy = false;
  copySuccessful = false;
  copySuccessWait = false;

  @ViewChild('preBlock') code: ElementRef;


  ngOnInit() {
    try {
      this.canCopy = this.document.queryCommandSupported('copy');
    } finally { }
  }


  copyToClipboard() {
    const textArea = this.document.createElement('textarea');

    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.width = '2em';
    textArea.style.height = '2em';
    textArea.style.padding = '0';
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';
    textArea.style.background = 'transparent';

    textArea.value = this.code.nativeElement.innerText.trim();

    document.body.appendChild(textArea);

    textArea.select();

    try {
      this.copySuccessful = document.execCommand('copy');
      this.copySuccessWait = true;
      setTimeout(() => this.copySuccessWait = false, 2000);
    } catch (err) {
      this.logService.warn('Failed to copy to clipboard');
    }

    this.document.body.removeChild(textArea);
  }

}
