import { Component, OnInit, Input, forwardRef, ViewChild } from '@angular/core';
import { DeployApplicatioNFsUtils } from './deploy-application-fs-utils';
import { filter, first, map } from 'rxjs/operators';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { BehaviorSubject, Observable } from 'rxjs';
import { FileScannerInfo } from './deploy-application-fs-scanner';

@Component({
  selector: 'app-deploy-application-fs',
  templateUrl: './deploy-application-fs.component.html',
  styleUrls: ['./deploy-application-fs.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DeployApplicationFsComponent),
      multi: true,
    }
  ]
})
export class DeployApplicationFsComponent implements ControlValueAccessor {

  private propagateChange: Function;
  constructor() { }

  @Input() sourceType: string;

  sourceData$ = new BehaviorSubject<FileScannerInfo>(undefined);

  // Handle result of a file input form field selection
  onFileChange(event) {
    const files = event.srcElement.files;
    const utils = new DeployApplicatioNFsUtils();
    utils.handleFileInputSelection(files).pipe(
      filter(res => !!res),
      first()
    ).subscribe((res) => {
      this.propagateChange(res);
      this.sourceData$.next(res);
    });
  }

  // ControlValueAccessor interface - allows us to act as a control in the form for validation purposes

  writeValue(obj: any): void {
  }
  registerOnChange(fn: any): void {
    this.propagateChange = fn;
  }
  registerOnTouched(fn: any): void {
  }
  setDisabledState?(isDisabled: boolean): void {
  }

}
