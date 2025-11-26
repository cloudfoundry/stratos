import { CommonModule, AsyncPipe } from '@angular/common';
import { Component, inject, Injector, type OnDestroy , ChangeDetectionStrategy } from '@angular/core';
import { Store } from '@ngrx/store';
import { type Observable, of as observableOf } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import type { GeneralEntityAppState } from '@stratosui/store';

import type { CFAppState } from '../../../../../../cloud-foundry/src/cf-app-state';
import { BytesToHumanSize, type StepOnNextFunction, UploadProgressIndicatorComponent } from '@stratosui/core';
import { CfOrgSpaceDataService } from '../../../../shared/data-services/cf-org-space-service.service';
import { DeployApplicationDeployer, type FileTransferStatus } from '../deploy-application-deployer';
import type { FileScannerInfo } from '../deploy-application-step2/deploy-application-fs/deploy-application-fs-scanner';


@Component({
  selector: 'app-deploy-application-step-source-upload',
  templateUrl: './deploy-application-step-source-upload.component.html',
  styleUrls: ['./deploy-application-step-source-upload.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    UploadProgressIndicatorComponent,
    BytesToHumanSize
  ]
})
export class DeployApplicationStepSourceUploadComponent implements OnDestroy {

  public deployer: DeployApplicationDeployer;

  public valid$: Observable<boolean>;

  private readonly store = inject(Store<GeneralEntityAppState>);
  public readonly cfOrgSpaceService = inject(CfOrgSpaceDataService);
  private readonly injector = inject(Injector);

  constructor() {
    this.deployer = new DeployApplicationDeployer(this.store, this.cfOrgSpaceService, this.injector);
    this.valid$ = this.deployer.fileTransferStatus$.asObservable().pipe(
      filter(status => !!status),
      map((status: FileTransferStatus) => status.filesSent === status.totalFiles),
    );
  }

  // If the user goes back then cancel any file upload in progress
  onLeave = (isNext: boolean) => {
    if (!isNext) {
      this.deployer.close();
    }
  }

  onEnter = (data: FileScannerInfo) => {
    // Previous step is expected to pass us the file info for the files to be uploaded
    this.deployer.fsFileInfo = data;

    // Begin the file upload
    this.deployer.open();
  }

  // Make the deployer available to the next step
  onNext: StepOnNextFunction = () => {
    return observableOf({ success: true, data: this.deployer });
  }

  ngOnDestroy() {
    if (this.deployer) {
      this.deployer.close();
    }
  }

}
