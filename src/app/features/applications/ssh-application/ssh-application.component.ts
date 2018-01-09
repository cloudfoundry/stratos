import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { Observable } from 'rxjs/Observable';
import { Store } from '@ngrx/store';
import { Subscription, Subject } from 'rxjs/Rx';
import websocketConnect from 'rxjs-websockets';

import { ApplicationService } from '../application.service';
import { ApplicationStateService } from '../application/build-tab/application-state/application-state.service';
import { QueueingSubject } from 'queueing-subject';
import { LoggerService } from '../../../core/logger.service';
import { SshViewerComponent } from '../../../shared/components/ssh-viewer/ssh-viewer.component';
import { ShowSnackBar } from '../../../store/actions/snackBar.actions';
import { AppState } from '../../../store/app-state';
import { EntityService } from '../../../core/entity-service';
import { GetApplication, ApplicationSchema } from '../../../store/actions/application.actions';

const entityServiceFactory = (
  store: Store<AppState>,
  activatedRoute: ActivatedRoute
) => {
  const { id, cfId } = activatedRoute.snapshot.params;
  return new EntityService(
    store,
    ApplicationSchema.key,
    ApplicationSchema,
    id,
    new GetApplication(id, cfId)
  );
};

@Component({
  selector: 'app-ssh-application',
  templateUrl: './ssh-application.component.html',
  styleUrls: ['./ssh-application.component.scss'],
  providers: [
    {
      provide: EntityService,
      useFactory: entityServiceFactory,
      deps: [Store, ActivatedRoute]
    }
  ]
})
export class SshApplicationComponent implements OnInit {

  public messages: Observable<string>;

  public connectionStatus: Observable<number>;

  public sshInput: QueueingSubject<string>;

  public errorMessage: string;

  public sshRoute: string;

  public connected: boolean;

  public appInstanceLink: string;

  private connection: Subscription;

  public instanceId: string;

  @ViewChild('sshViewer') sshViewer: SshViewerComponent;

  constructor(
    private activatedRoute: ActivatedRoute,
    private logService: LoggerService,
    private store: Store<AppState>,
    private entityService: EntityService
  ) {}

  ngOnInit() {
    const routeParams = this.activatedRoute.snapshot.params;

    this.instanceId = routeParams.instanceId;

    this.appInstanceLink = (
      `/applications/${routeParams.cfId}/${routeParams.id}/ssh`
    );

    if (!routeParams.cfId || !routeParams.id) {
      this.messages = Observable.never();
    } else {
      const host = window.location.host;
      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const streamUrl = (
        `${protocol}://${host}/pp/v1/${routeParams.cfId}/apps/${routeParams.id}/ssh/${routeParams.instanceId}`
      );
      this.sshInput = new QueueingSubject<string>();
      const connection = websocketConnect(
        streamUrl,
        this.sshInput
      );

      this.messages = connection.messages
      .catch(e => {
        if (e.type === 'error') {
          this.errorMessage = 'Error connecting to web socket';
        }
        return [];
      });

      this.connectionStatus = connection.connectionStatus;
    }
  }
}
