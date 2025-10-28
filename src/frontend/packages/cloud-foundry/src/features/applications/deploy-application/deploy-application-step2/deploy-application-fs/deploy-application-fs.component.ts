import { CommonModule } from '@angular/common';
import { Component, forwardRef, Input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { BehaviorSubject } from 'rxjs';
import { filter, first } from 'rxjs/operators';

import { ByteFormatPipe } from '../../../../../../../core/src/core/byte-formatters.pipe';
import { getEventFiles } from '../../../../../../../core/src/core/browser-helper';
import { MetadataItemComponent } from '../../../../../../../core/src/shared/components/metadata-item/metadata-item.component';
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
  ],
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    ByteFormatPipe,
    MetadataItemComponent
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
