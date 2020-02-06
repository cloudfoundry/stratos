import { Component, forwardRef, Input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { BehaviorSubject } from 'rxjs';
import { filter, first } from 'rxjs/operators';

import { getEventFiles } from '../../../../../../../core/src/core/browser-helper';
import { FileScannerInfo } from './deploy-application-fs-scanner';
import { DeployApplicationFsUtils } from './deploy-application-fs-utils';

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

  private propagateChange: (fsi: FileScannerInfo) => void;
  constructor() { }

  @Input() sourceType: string;

  @Input() hideTitle = false;

  sourceData$ = new BehaviorSubject<FileScannerInfo>(undefined);

  // Handle result of a file input form field selection
  onFileChange(event) {
    const files = getEventFiles(event);
    const utils = new DeployApplicationFsUtils();
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
