import { Component, OnInit, Output, EventEmitter, ViewChild, ElementRef, Input } from '@angular/core';

@Component({
  selector: 'app-file-input',
  templateUrl: './file-input.component.html',
  styleUrls: ['./file-input.component.scss']
})
export class FileInputComponent implements OnInit {

  @Input() accept: string;
  @Output() onFileSelect: EventEmitter<File[]> = new EventEmitter();

  @ViewChild('inputFile') nativeInputFile: ElementRef;

  constructor() { }

  ngOnInit() {
    console.log('file input');
  }

  private _files: File[];

  get fileCount(): number { return this._files && this._files.length || 0; }

  onNativeInputFileSelect($event) {
      this._files = $event.srcElement.files;
      this.onFileSelect.emit(this._files);
      console.log(this._files);
  }

  selectFile($event) {
      this.nativeInputFile.nativeElement.click();
      $event.preventDefault();
      return false;
  }
}
