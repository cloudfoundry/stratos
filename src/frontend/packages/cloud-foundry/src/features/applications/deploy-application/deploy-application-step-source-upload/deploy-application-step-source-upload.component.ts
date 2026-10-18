import { CommonModule } from '@angular/common';
import { Component, EnvironmentInjector, OnDestroy, ChangeDetectionStrategy, inject } from '@angular/core';
import { Observable, of as observableOf } from 'rxjs';
import { map } from 'rxjs/operators';

import { BytesToHumanSize, StepOnNextFunction, UploadProgressIndicatorComponent } from '@stratosui/core';
import { CfOrgSpaceDataService } from '../../../../shared/data-services/cf-org-space-service.service';
import { DeployApplicationDeployer } from '../deploy-application-deployer';
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
    // No transfer status (a new upload not yet under way) is not valid
    this.valid$ = this.deployer.fileTransferStatus$.asObservable().pipe(
      map(status => !!status && status.filesSent === status.totalFiles),
    );
  }

  // If the user goes back then cancel any file upload in progress
  onLeave = (isNext: boolean) => {
    if (!isNext) {
      this.deployer.close();
    }
  }

  onEnter = (data: FileScannerInfo) => {
    // Previous step is expected to pass us the file info for the files to be uploaded.
    // Coming back from a later step passes none; the files are the same.
    if (data) {
      this.deployer.fsFileInfo = data;
    }

    // Each entry uploads afresh. End what the deployer had first: a deploy
    // that ended leaves it open on a socket the server has closed.
    this.deployer.close();
    // Begin the file upload
    this.deployer.open();
  }

  // Make the deployer available to the next step
  onNext: StepOnNextFunction = () => {
    return observableOf({ success: true, data: this.deployer });
  }

  // A deploy the deploy step started belongs to it, which reports its end;
  // an upload the deploy step never started is cancelled
  ngOnDestroy() {
    if (this.deployer && !this.deployer.inFlight) {
      this.deployer.close();
    }
  }

}
