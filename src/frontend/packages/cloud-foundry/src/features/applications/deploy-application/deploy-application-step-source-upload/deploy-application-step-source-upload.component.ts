import { CommonModule } from '@angular/common';
import { Component, EnvironmentInjector, OnDestroy, ChangeDetectionStrategy, inject } from '@angular/core';
import { Observable, of as observableOf } from 'rxjs';
import { filter, map } from 'rxjs/operators';

import { BytesToHumanSize, StepOnNextFunction, UploadProgressIndicatorComponent } from '@stratosui/core';
import { CfOrgSpaceDataService } from '../../../../shared/data-services/cf-org-space-service.service';
import { DeployApplicationDeployer, FileTransferStatus } from '../deploy-application-deployer';
import { FileScannerInfo } from '../deploy-application-step2/deploy-application-fs/deploy-application-fs-scanner';


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
  cfOrgSpaceService = inject(CfOrgSpaceDataService);
  // The deployer outlives this step; a view injector would tie its state
  // effects to the view and end them when the view is destroyed
  private injector = inject(EnvironmentInjector);


  public deployer: DeployApplicationDeployer;

  public valid$: Observable<boolean>;

  constructor() {
    const cfOrgSpaceService = this.cfOrgSpaceService;
    const injector = this.injector;

    this.deployer = new DeployApplicationDeployer(cfOrgSpaceService, injector);
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

  // A running push belongs to the deploy step, which reports its end
  ngOnDestroy() {
    if (this.deployer && !this.deployer.deploying) {
      this.deployer.close();
    }
  }

}
