import { Component, OnInit, Input, Inject, ElementRef, ViewChild } from '@angular/core';
import { DOCUMENT } from '@angular/platform-browser';

@Component({
  selector: 'app-code-block',
  templateUrl: './code-block.component.html',
  styleUrls: ['./code-block.component.scss']
})
export class CodeBlockComponent implements OnInit {
  private _document: Document;

  constructor( @Inject(DOCUMENT) document: Document) {
    this._document = document;
  }

  @Input() hideCopy: boolean;
  _canCopy = false;
  _copySuccessfull = false;
  _copySuccessWait = false;

  @ViewChild('preBlock') code: ElementRef;


  ngOnInit() {
    try {
      this._canCopy = this._document.queryCommandSupported('copy');
    } finally { }
  }


  copyToClipboard() {
    const textArea = this._document.createElement('textarea');

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
      this._copySuccessfull = document.execCommand('copy');
      this._copySuccessWait = true;
      setTimeout(() => this._copySuccessWait = false, 2000);
    } catch (err) {
      // TODO: Log/update once logging framework decided
      console.log('Failed to copy to clipboard');
    }

    this._document.body.removeChild(textArea);
  }

}
