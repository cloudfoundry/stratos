import { Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';

@Component({
  selector: 'app-file-input',
  templateUrl: './file-input.component.html',
  styleUrls: ['./file-input.component.scss']
})
export class FileInputComponent {

  @ViewChild('inputFile') nativeInputFile: ElementRef;

  @Input() accept: string;
  @Output() onFileSelect: EventEmitter<File> = new EventEmitter();

  private _files: File[];

  public name = '';

  get fileCount(): number { return this._files && this._files.length || 0; }

  onNativeInputFileSelect($event) {
    const _files = $event.srcElement.files;
    if (_files.length > 0) {
      this._files = _files;
      this.onFileSelect.emit(this._files[0]);
      if (this._files.length > 0) {
        this.name = this._files[0].name;
      }
    }
  }

  selectFile($event) {
    this.nativeInputFile.nativeElement.click();
    $event.preventDefault();
    return false;
  }
}
