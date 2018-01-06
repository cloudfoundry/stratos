import { Component, OnInit, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';

import { ApplicationStateService } from '../application/build-tab/application-state/application-state.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { Subscription, Subject } from 'rxjs/Rx';
import websocketConnect from 'rxjs-websockets';
import { QueueingSubject } from 'queueing-subject';
import { LoggerService } from '../../../core/logger.service';
import { SshViewerComponent } from '../../../shared/components/ssh-viewer/ssh-viewer.component';

import { ShowSnackBar } from '../../../store/actions/snackBar.actions';
import { AppState } from '../../../store/app-state';

@Component({
  selector: 'app-ssh-application',
  templateUrl: './ssh-application.component.html',
  styleUrls: ['./ssh-application.component.scss']
})
export class SshApplicationComponent implements OnInit, OnDestroy {

  public messages: Observable<string>;

  public connectionStatus: Observable<number>;

  public sshInput: QueueingSubject<string>;

  public sshRoute: string;

  public connected: boolean;

  public appInstanceLink: string;

  private connection: Subscription;

  public isConnecting: boolean;

  @ViewChild('sshViewer') sshViewer: SshViewerComponent;

  constructor(private activatedRoute: ActivatedRoute, private logService: LoggerService, private store: Store<AppState>) { }

  ngOnInit() {
    console.log(this.activatedRoute.snapshot.params);
    const routeParams = this.activatedRoute.snapshot.params;

    this.appInstanceLink = (
      `/applications/${routeParams.cfId}/${routeParams.id}/ssh`
    );

    if (!routeParams.cfId || !routeParams.id) {
      this.messages = Observable.never();
    } else {
      console.log('******************* SSH ***************');
      console.log(routeParams);
      const host = window.location.host;
      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      console.log(protocol);
      console.log(window.location.protocol);
      const streamUrl = (
        `${protocol}://${host}/pp/v1/${routeParams.cfId}/apps/${routeParams.id}/ssh/${routeParams.instanceId}`
      );
      console.log(streamUrl);
      this.sshInput = new QueueingSubject<string>();
      const connection = websocketConnect(
        streamUrl,
        this.sshInput
      );

      this.messages = connection.messages
      .catch(e => {
        this.logService.error('Error while connecting to socket: ' + JSON.stringify(e));
        return [];
      });

      this.connectionStatus = connection.connectionStatus.share();

      this.isConnecting = true;

      this.connection = this.connectionStatus.subscribe((count: number) => {
        if (!this.isConnecting && count === 0) {
          // Disconnected
          console.log('DISCONNECTED');
          this.store.dispatch(new ShowSnackBar(`SSH Disconnected`));
        }

      });
    }
  }

  updateConnecting(e) {
    console.log('HELLO - ATTEMPTING CONNECTION');
    console.log(e);
    this.isConnecting = e;
  }


  ngOnDestroy() {
    this.connection.unsubscribe();
  }
}
