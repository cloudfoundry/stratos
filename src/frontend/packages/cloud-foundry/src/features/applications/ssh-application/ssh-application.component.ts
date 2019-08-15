import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { NEVER, Observable, Subject, Subscription } from 'rxjs';
import websocketConnect from 'rxjs-websockets';
import { catchError, first, map } from 'rxjs/operators';

import { CFAppState } from '../../../../../cloud-foundry/src/cf-app-state';
import { IApp } from '../../../../../core/src/core/cf-api.types';
import { IHeaderBreadcrumb } from '../../../../../core/src/shared/components/page-header/page-header.types';
import { SshViewerComponent } from '../../../../../core/src/shared/components/ssh-viewer/ssh-viewer.component';
import { ApplicationService } from '../application.service';


@Component({
  selector: 'app-ssh-application',
  templateUrl: './ssh-application.component.html',
  styleUrls: ['./ssh-application.component.scss'],
})
export class SshApplicationComponent implements OnInit {

  public messages: Observable<string>;

  public connectionStatus: Observable<number>;

  public sshInput: Subject<string>;

  public errorMessage: string;

  public sshRoute: string;

  public connected: boolean;

  public appInstanceLink: string;

  private connection: Subscription;

  public instanceId: string;

  public breadcrumbs$: Observable<IHeaderBreadcrumb[]>;

  @ViewChild('sshViewer') sshViewer: SshViewerComponent;

  private getBreadcrumbs(
    application: IApp,
  ) {
    return [
      {
        breadcrumbs: [
          { value: 'Applications', routerLink: '/applications' },
          { value: application.name, routerLink: `/applications/${application.cfGuid}/${application.guid}/instances` }
        ]
      },
    ];
  }

  constructor(
    private activatedRoute: ActivatedRoute,
    private store: Store<CFAppState>,
    private applicationService: ApplicationService,
  ) { }

  ngOnInit() {

    const { cfGuid, appGuid } = this.applicationService;
    const routeParams = this.activatedRoute.snapshot.params;
    this.instanceId = routeParams.index;

    this.appInstanceLink = (
      `/applications/${cfGuid}/${appGuid}/instances`
    );

    if (!cfGuid || !appGuid || !this.instanceId) {
      this.messages = NEVER;
      this.connectionStatus = NEVER;
    } else {
      const host = window.location.host;
      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const streamUrl = (
        `${protocol}://${host}/pp/v1/${cfGuid}/apps/${appGuid}/ssh/${this.instanceId}`
      );
      this.sshInput = new Subject<string>();
      const connection = websocketConnect(
        streamUrl,
        this.sshInput
      );

      this.messages = connection.messages.pipe(
        catchError(e => {
          if (e.type === 'error') {
            this.errorMessage = 'Error connecting to web socket';
          }
          return [];
        }));

      this.connectionStatus = connection.connectionStatus;

      this.breadcrumbs$ = this.applicationService.waitForAppEntity$.pipe(
        map(app => this.getBreadcrumbs(app.entity.entity)),
        first()
      );
    }
  }
}
