import { CommonModule } from '@angular/common';
import { Component, forwardRef, Input, signal , ChangeDetectionStrategy } from '@angular/core';
import { type ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { filter, first } from 'rxjs/operators';

import { BytesToHumanSize } from '../../../../../../../core/src/core/byte-formatters.pipe';
import { getEventFiles } from '../../../../../../../core/src/core/browser-helper';
import { MetadataItemComponent } from '../../../../../../../core/src/shared/components/metadata-item/metadata-item.component';
import type { FileScannerInfo } from './deploy-application-fs-scanner';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    BytesToHumanSize,
    MetadataItemComponent
  ]
})
export class DeployApplicationFsComponent implements ControlValueAccessor {

  private propagateChange!: (fsi: FileScannerInfo) => void;

  @Input() sourceType!: string;

  @Input() hideTitle = false;

  sourceData = signal<FileScannerInfo | undefined>(undefined);

  // Handle result of a file input form field selection
  onFileChange(event: Event) {
    const files = getEventFiles(event);
    const utils = new DeployApplicationFsUtils();
    utils.handleFileInputSelection(files).pipe(
      filter(res => !!res),
      first()
    ).subscribe((res) => {
      this.propagateChange(res);
      this.sourceData.set(res);
    });
  }

  // ControlValueAccessor interface - allows us to act as a control in the form for validation purposes

  writeValue(_obj: FileScannerInfo): void {
    // ControlValueAccessor implementation - no action required
  }
  registerOnChange(fn: (fsi: FileScannerInfo) => void): void {
    this.propagateChange = fn;
  }
  registerOnTouched(_fn: () => void): void {
    // ControlValueAccessor implementation - no action required
  }
  setDisabledState?(_isDisabled: boolean): void {
    // ControlValueAccessor implementation - no action required
  }

}
