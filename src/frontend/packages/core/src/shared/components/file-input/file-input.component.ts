import { Component, ElementRef, EventEmitter, Input, Output, ViewChild, OnInit, Optional, Host, SkipSelf } from '@angular/core';
import { ControlContainer, FormGroupName } from '@angular/forms';

@Component({
  selector: 'app-file-input',
  templateUrl: './file-input.component.html',
  styleUrls: ['./file-input.component.scss']
})
export class FileInputComponent implements OnInit {
  @ViewChild('inputFile') nativeInputFile: ElementRef;

  @Input() accept: string;
  @Output() onFileSelect: EventEmitter<File> = new EventEmitter();
  @Input() fileFormControlName;

  private _files: File[];

  public name = '';

  private formGroupControl: FormGroupName;

  constructor(
    @Optional() @Host() @SkipSelf() private parent: ControlContainer,
  ) {}

  ngOnInit(): void {
   if (this.parent instanceof FormGroupName) {
     this.formGroupControl = this.parent as FormGroupName;
   }
  }

  get fileCount(): number { return this._files && this._files.length || 0; }

  onNativeInputFileSelect($event) {
    const _files = $event.srcElement.files;
    if (_files.length > 0) {
      this._files = _files;
      this.onFileSelect.emit(this._files[0]);

      if (!!this.formGroupControl) {
        this.handleFormControl(this._files[0]);
      }
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

  handleFormControl(file) {
    const reader = new FileReader();
    reader.onload = () => {
      this.updateFileState(reader.result);
    };
    reader.onerror = () => {
      // Clear the form and thus make it invalid on error
      this.updateFileState(null);
    };
    reader.readAsText(file);
  }
  private updateFileState(value: string | ArrayBuffer) {
    this.formGroupControl.control.controls[this.fileFormControlName].setValue(value);
  }
}
