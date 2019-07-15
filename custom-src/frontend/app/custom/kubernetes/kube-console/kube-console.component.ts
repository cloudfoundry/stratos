import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { NEVER, Observable, Subject, Subscription } from 'rxjs';
import websocketConnect from 'rxjs-websockets';
import { catchError, first, map } from 'rxjs/operators';

import { AppState } from '../../../../../store/src/app-state';
import { IApp } from '../../../core/cf-api.types';
import { IHeaderBreadcrumb } from '../../../shared/components/page-header/page-header.types';
import { SshViewerComponent } from '../../../shared/components/ssh-viewer/ssh-viewer.component';
import { KubernetesEndpointService } from '../services/kubernetes-endpoint.service';
import { BaseKubeGuid } from '../kubernetes-page.types';
import { KubernetesService } from '../services/kubernetes.service';


@Component({
  selector: 'app-kube-console',
  templateUrl: './kube-console.component.html',
  styleUrls: ['./kube-console.component.scss'],
  providers: [
    {
      provide: BaseKubeGuid,
      useFactory: (activatedRoute: ActivatedRoute) => {
        return {
          guid: activatedRoute.snapshot.params.endpointId
        };
      },
      deps: [
        ActivatedRoute
      ]
    },
    KubernetesService,
    KubernetesEndpointService,
  ]
})
export class KubeConsoleComponent implements OnInit {

  public messages: Observable<string>;

  public connectionStatus: Observable<number>;

  public sshInput: Subject<string>;

  public errorMessage: string;

  public sshRoute: string;

  public connected: boolean;

  public kubeSummaryLink: string;

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
          { value: application.name, routerLink: `/kubernetes/${application.cfGuid}/${application.guid}/instances` }
        ]
      },
    ];
  }

  constructor(
    public kubeEndpointService: KubernetesEndpointService,
    // private activatedRoute: ActivatedRoute,
    // private store: Store<AppState>,
  ) { }

  ngOnInit() {

    const guid = this.kubeEndpointService.baseKube.guid;

    console.log('HERE');
    console.log(guid);
    // const routeParams = this.activatedRoute.snapshot.params;
    // this.instanceId = routeParams.index;

    this.kubeSummaryLink = (
      `/kubernetes/${guid}/summary`
    );

    if (!guid) {
      this.messages = NEVER;
      this.connectionStatus = NEVER;
    } else {
      const host = window.location.host;
      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const streamUrl = (
        `${protocol}://${host}/pp/v1/kubeconsole/${guid}`
      );
      this.sshInput = new Subject<string>();
      const connection = websocketConnect(
        streamUrl,
        this.sshInput
      );

      console.log(streamUrl);

      this.messages = connection.messages.pipe(
        catchError(e => {
          if (e.type === 'error') {
            this.errorMessage = 'Error connecting to web socket';
          }
          return [];
        }));

      this.connectionStatus = connection.connectionStatus;

      // this.breadcrumbs$ = this.applicationService.waitForAppEntity$.pipe(
      //   map(app => this.getBreadcrumbs(app.entity.entity)),
      //   first()
      // );
    }
  }
}
