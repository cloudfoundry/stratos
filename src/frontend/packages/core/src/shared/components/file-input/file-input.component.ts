import {
  Component,
  ElementRef,
  EventEmitter,
  Host,
  Input,
  OnDestroy,
  OnInit,
  Optional,
  Output,
  SkipSelf,
  ViewChild,
} from '@angular/core';
import { ControlContainer, FormGroupName } from '@angular/forms';
import { Subscription } from 'rxjs';

import { getEventFiles } from '../../../core/browser-helper';
import { safeUnsubscribe } from '../../../core/utils.service';

@Component({
  selector: 'app-file-input',
  templateUrl: './file-input.component.html',
  styleUrls: ['./file-input.component.scss']
})
export class FileInputComponent implements OnInit, OnDestroy {

  @ViewChild('inputFile', { static: true }) nativeInputFile: ElementRef;

  @Input() accept: string;
  @Output() onFileSelect: EventEmitter<File> = new EventEmitter();
  @Output() onFileData: EventEmitter<string> = new EventEmitter();

  @Input() fileFormControlName;

  @Input() buttonLabel = '';

  private files: File[];

  public name = '';

  private formGroupControl: FormGroupName;
  public disabled = false;
  private sub: Subscription;

  constructor(
    @Optional() @Host() @SkipSelf() private parent: ControlContainer,
  ) { }

  ngOnInit(): void {
    if (this.parent instanceof FormGroupName) {
      this.formGroupControl = this.parent as FormGroupName;
      this.disabled = this.formGroupControl.control.disabled;
      this.sub = this.formGroupControl.control.statusChanges.subscribe(a => {
        this.disabled = a === 'DISABLED';
      });
    }
  }

  ngOnDestroy(): void {
    safeUnsubscribe(this.sub);
  }

  get fileCount(): number { return this.files && this.files.length || 0; }

  onNativeInputFileSelect($event) {
    const fs = getEventFiles($event);
    if (fs.length > 0) {
      this.files = fs;
      this.onFileSelect.emit(this.files[0]);

      if (!!this.formGroupControl) {
        this.handleFileData(this.files[0], (value) => this.updateFileState(value));
      } else {
        this.handleFileData(this.files[0], (value) => this.onFileData.emit(value));
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

  handleFileData(file, done) {
    const reader = new FileReader();
    reader.onload = () => {
      done(reader.result);
    };
    reader.onerror = () => {
      // Clear the form and thus make it invalid on error
      done(null);
    };
    reader.readAsText(file);
  }

  private updateFileState(value: string | ArrayBuffer) {
    this.formGroupControl.control.controls[this.fileFormControlName].setValue(value);
  }
}
