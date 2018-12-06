
import { of as observableOf, Observable } from 'rxjs';
import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { FileScannerInfo } from '../deploy-application-step2/deploy-application-fs/deploy-application-fs-scanner';
import { DeployApplicationDeployer, FileTransferStatus } from '../deploy-application-deployer';
import { AppState } from '../../../../store/app-state';
import { Store } from '@ngrx/store';
import { CfOrgSpaceDataService } from '../../../../shared/data-services/cf-org-space-service.service';
import { HttpClient } from '@angular/common/http';
import { map, filter } from 'rxjs/operators';
import { StepOnNextFunction } from '../../../../shared/components/stepper/step/step.component';

@Component({
  selector: 'app-deploy-application-step-source-upload',
  templateUrl: './deploy-application-step-source-upload.component.html',
  styleUrls: ['./deploy-application-step-source-upload.component.scss']
})
export class DeployApplicationStepSourceUploadComponent implements OnDestroy {

  public deployer: DeployApplicationDeployer;

  public valid$: Observable<boolean>;

  constructor(store: Store<AppState>,
    public cfOrgSpaceService: CfOrgSpaceDataService,
  ) {
    this.deployer = new DeployApplicationDeployer(store, cfOrgSpaceService);
    this.valid$ = this.deployer.fileTransferStatus$.pipe(
      filter(status => !!status),
      map((status: FileTransferStatus) => status.filesSent === status.totalFiles),
    );
  }

  // If the user goes back then cancel any file upload in progress
  onLeave = (isNext) => {
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
