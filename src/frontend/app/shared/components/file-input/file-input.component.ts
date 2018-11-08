import { Component, OnInit, Output, EventEmitter, ViewChild, ElementRef, Input } from '@angular/core';

@Component({
  selector: 'app-file-input',
  templateUrl: './file-input.component.html',
  styleUrls: ['./file-input.component.scss']
})
export class FileInputComponent implements OnInit {

  @ViewChild('inputFile') nativeInputFile: ElementRef;

  @Input() accept: string;
  @Output() onFileSelect: EventEmitter<File[]> = new EventEmitter();

  private _files: File[];

  get fileCount(): number { return this._files && this._files.length || 0; }

  constructor() { }

  ngOnInit() {
  }

  onNativeInputFileSelect($event) {
    this._files = $event.srcElement.files;
    this.onFileSelect.emit(this._files);
  }

  selectFile($event) {
    this.nativeInputFile.nativeElement.click();
    $event.preventDefault();
    return false;
  }
}
