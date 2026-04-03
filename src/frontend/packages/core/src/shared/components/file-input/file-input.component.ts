import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild, inject } from '@angular/core';
import { ControlContainer, FormGroupName } from '@angular/forms';
import { Subscription } from 'rxjs';

import { getEventFiles } from '../../../core/browser-helper';
import { safeUnsubscribe } from '../../../core/utils.service';

@Component({
  selector: 'app-file-input',
  templateUrl: './file-input.component.html',
  styleUrls: ['./file-input.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FileInputComponent implements OnInit, OnDestroy {
  private parent = inject(ControlContainer, { optional: true, host: true, skipSelf: true });


  @ViewChild('inputFile', { static: true }) nativeInputFile!: ElementRef;

  @Input() accept!: string;
  @Input() placeholder = '';
  @Output() onFileSelect: EventEmitter<File> = new EventEmitter();
  @Output() onFileData: EventEmitter<string> = new EventEmitter();

  @Input() fileFormControlName!: string;

  @Input() buttonLabel = '';

  private files!: File[];

  public name = '';

  private formGroupControl!: FormGroupName;
  public disabled = false;
  private sub: Subscription;

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

  onNativeInputFileSelect($event: Event) {
    const fs = getEventFiles($event);
    if (fs && fs.length > 0) {
      this.files = Array.from(fs);
      this.onFileSelect.emit(this.files[0]);

      if (this.formGroupControl) {
        this.handleFileData(this.files[0], (value: string | ArrayBuffer | null) => this.updateFileState(value));
      } else {
        this.handleFileData(this.files[0], (value: string | ArrayBuffer | null) => this.onFileData.emit(value as string));
      }
      if (this.files.length > 0) {
        this.name = this.files[0].name;
      }
    }
  }

  selectFile($event: Event) {
    this.nativeInputFile.nativeElement.click();
    $event.preventDefault();
    return false;
  }

  clearFile($event: Event) {
    $event.preventDefault();
    this.files = [];
    this.name = '';
    this.nativeInputFile.nativeElement.value = '';
    if (this.formGroupControl) {
      this.formGroupControl.control.controls[this.fileFormControlName].setValue('');
    }
    this.onFileData.emit('');
  }

  onPathInput($event: Event) {
    const input = $event.target as HTMLInputElement;
    this.name = input.value;
    if (this.formGroupControl) {
      this.formGroupControl.control.controls[this.fileFormControlName].setValue(input.value);
    }
    this.onFileData.emit(input.value);
  }

  handleFileData(file: File, done: (value: string | ArrayBuffer | null) => void) {
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
