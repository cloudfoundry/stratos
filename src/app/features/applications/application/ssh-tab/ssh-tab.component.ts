import { Component, OnInit, OnDestroy } from '@angular/core';
import { ApplicationService } from '../../application.service';

import websocketConnect from 'rxjs-websockets';
import { Observable } from 'rxjs/Rx';
import { QueueingSubject } from 'queueing-subject';

import { SshViewerComponent } from '../../../../shared/components/ssh-viewer/ssh-viewer.component';
import { LoggerService } from '../../../../core/logger.service';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-ssh-tab',
  templateUrl: './ssh-tab.component.html',
  styleUrls: ['./ssh-tab.component.scss']
})
export class SshTabComponent implements OnInit, OnDestroy {

  public messages: Observable<string>;

  public sshInput: QueueingSubject<string>;

  public sshRoute: string;

  constructor(private applicationService: ApplicationService, private logService: LoggerService, private activatedRoute: ActivatedRoute) {
  }

  ngOnInit() {
    const routeInfo = this.activatedRoute.snapshot.params;
    this.sshRoute = (
      `/applications/ssh/${this.applicationService.cfGuid}/${this.applicationService.appGuid}/0`
    );

  }

  ngOnDestroy() {
    console.log('Boom!');

  }

}
