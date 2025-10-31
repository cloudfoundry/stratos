import {Component, OnInit, inject} from '@angular/core';
import { CustomSlideToggleComponent } from '@stratosui/core';

import { HelmReleaseSocketService } from '../helm-release-tab-base/helm-release-socket-service';

@Component({
  selector: 'app-workload-live-reload',
  templateUrl: './workload-live-reload.component.html',
  styleUrls: ['./workload-live-reload.component.scss'],
  standalone: true,
  imports: [
    CustomSlideToggleComponent
  ]
})
export class WorkloadLiveReloadComponent implements OnInit {
  public checked = false;
  private socketService = inject(HelmReleaseSocketService);

  ngOnInit(): void {
    this.checked = this.socketService.isStarted();
  }

  public onChange(event: any) {
    this.socketService.pause(!event.checked);
  }

}
