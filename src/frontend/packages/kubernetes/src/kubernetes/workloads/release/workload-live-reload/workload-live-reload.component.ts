import { Component, OnInit } from '@angular/core';

import { HelmReleaseSocketService } from '../helm-release-tab-base/helm-release-socket-service';

@Component({
  selector: 'app-workload-live-reload',
  templateUrl: './workload-live-reload.component.html',
  styleUrls: ['./workload-live-reload.component.scss']
})
export class WorkloadLiveReloadComponent implements OnInit {
  public checked = false;

  constructor(
    private socketService: HelmReleaseSocketService
  ) { }

  ngOnInit(): void {
    this.checked = this.socketService.isStarted();
  }

  public onChange(event) {
    this.socketService.pause(!event.checked)
  }

}
