import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, Input, OnDestroy, OnInit, ViewChild, inject, signal, input, output } from '@angular/core';
import { ControlContainer, FormGroupName } from '@angular/forms';
import { Subscription } from 'rxjs';

import { getEventFiles } from '../../../core/browser-helper';
import { safeUnsubscribe } from '../../../core/utils.service';

@Component({
  selector: 'app-file-input',
  templateUrl: './file-input.component.html',
  standalone: true,
  imports: [
    CommonModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class FileInputComponent implements OnInit, OnDestroy {
  private parent = inject(ControlContainer, { optional: true, host: true, skipSelf: true });


  @ViewChild('inputFile', { static: true }) nativeInputFile!: ElementRef;

  readonly accept = input<string>();
  readonly placeholder = input('');
  readonly fileSelect = output<File>();
  readonly fileData = output<string>();

  readonly fileFormControlName = input<string>();

  @Input() buttonLabel = '';

  private files!: File[];

  public name = '';

  private formGroupControl!: FormGroupName;
  // Signal: written after the first render; an OnPush view under zoneless CD only repaints for signal writes.
  readonly disabled = signal(false);
  private sub?: Subscription;

  ngOnInit(): void {
    if (this.parent instanceof FormGroupName) {
      this.formGroupControl = this.parent as FormGroupName;
      this.disabled.set(this.formGroupControl.control.disabled);
      this.sub = this.formGroupControl.control.statusChanges.subscribe(a => {
        this.disabled.set(a === 'DISABLED');
      });
    }
  }

  ngOnDestroy(): void {
    if (this.sub) {
      safeUnsubscribe(this.sub);
    }
  }

  get fileCount(): number { return this.files && this.files.length || 0; }

  onNativeInputFileSelect($event: Event) {
    const fs = getEventFiles($event);
    if (fs && fs.length > 0) {
      this.files = Array.from(fs);
      this.fileSelect.emit(this.files[0]);

      if (this.formGroupControl) {
        this.handleFileData(this.files[0], (value: string | ArrayBuffer | null) => this.updateFileState(value));
      } else {
        this.handleFileData(this.files[0], (value: string | ArrayBuffer | null) => this.fileData.emit(value as string));
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
    this.fileControl()?.setValue('');
    this.fileData.emit('');
  }

  onPathInput($event: Event) {
    const input = $event.target as HTMLInputElement;
    this.name = input.value;
    this.fileControl()?.setValue(input.value);
    this.fileData.emit(input.value);
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

  private updateFileState(value: string | ArrayBuffer | null) {
    this.fileControl()?.setValue(value);
  }

  // The control this input writes: set only inside a FormGroupName and
  // with fileFormControlName bound.
  private fileControl() {
    const name = this.fileFormControlName();
    return this.formGroupControl && name ? this.formGroupControl.control.controls[name] : undefined;
  }
}
