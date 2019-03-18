import {
  Component,
  ElementRef,
  EventEmitter,
  Host,
  Input,
  OnInit,
  Optional,
  Output,
  SkipSelf,
  ViewChild,
} from '@angular/core';
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

  private files: File[];

  public name = '';

  private formGroupControl: FormGroupName;

  constructor(
    @Optional() @Host() @SkipSelf() private parent: ControlContainer,
  ) { }

  ngOnInit(): void {
    if (this.parent instanceof FormGroupName) {
      this.formGroupControl = this.parent as FormGroupName;
    }
  }

  get fileCount(): number { return this.files && this.files.length || 0; }

  onNativeInputFileSelect($event) {
    const fs = $event.srcElement.files;
    if (fs.length > 0) {
      this.files = fs;
      this.onFileSelect.emit(this.files[0]);

      if (!!this.formGroupControl) {
        this.handleFormControl(this.files[0]);
      }
      if (this.files.length > 0) {
        this.name = this.files[0].name;
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
