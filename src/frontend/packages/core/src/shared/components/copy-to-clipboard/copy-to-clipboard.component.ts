import { DOCUMENT } from '@angular/common';
import { Component, Inject, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-copy-to-clipboard',
  templateUrl: './copy-to-clipboard.component.html',
  styleUrls: ['./copy-to-clipboard.component.scss']
})
export class CopyToClipboardComponent implements OnInit {
  copySuccessful = false;
  copySuccessWait = false;
  canCopy = false;
  private document: Document;

  @Input() tooltip: string;
  @Input() showSuccessText = true;
  @Input() text = '';

  // Show smaller icon
  @Input() compact = false;

  constructor(
    @Inject(DOCUMENT) document: Document,
  ) {
    this.document = document;
  }

  ngOnInit() {
    try {
      this.canCopy = this.document.queryCommandSupported('copy');
    } finally { }
  }

  copyToClipboard(event: MouseEvent = null) {
    if (event) {
      event.stopPropagation();
    }

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

    textArea.value = this.text || '';

    document.body.appendChild(textArea);

    textArea.select();

    try {
      this.copySuccessful = document.execCommand('copy');
      this.copySuccessWait = true;
      setTimeout(() => this.copySuccessWait = false, 2000);
    } catch (err) {
      console.warn('Failed to copy to clipboard');
    }

    this.document.body.removeChild(textArea);
  }

}
