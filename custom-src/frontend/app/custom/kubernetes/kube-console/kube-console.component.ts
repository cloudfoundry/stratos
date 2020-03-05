import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NEVER, Observable, Subject, Subscription } from 'rxjs';
import websocketConnect, { normalClosureMessage } from 'rxjs-websockets';
import { catchError, tap, switchMap } from 'rxjs/operators';

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

  public connectionStatus = new Subject<number>();

  public sshInput: Subject<string>;

  public errorMessage: string;

  public sshRoute: string;

  public connected: boolean;

  public kubeSummaryLink: string;

  private connection: Subscription;

  public instanceId: string;

  public breadcrumbs$: Observable<IHeaderBreadcrumb[]>;

  @ViewChild('sshViewer', { static: false }) sshViewer: SshViewerComponent;

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
  ) { }

  ngOnInit() {
    this.connectionStatus.next(0);
    const guid = this.kubeEndpointService.baseKube.guid;
    this.kubeSummaryLink = (
      `/kubernetes/${guid}/summary`
    );

    if (!guid) {
      this.messages = NEVER;
      this.connectionStatus.next(0);
      this.errorMessage = 'No Endpoint ID available';
    } else {
      const host = window.location.host;
      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const streamUrl = (
        `${protocol}://${host}/pp/v1/kubeconsole/${guid}`
      );
      this.sshInput = new Subject<string>();
      const connection = websocketConnect(
        streamUrl
      );

      this.messages = connection.pipe(
        tap(() => this.connectionStatus.next(1)),
        switchMap(getResponse => getResponse(this.sshInput)),
        catchError((e: Error) => {
          if (e.message !== normalClosureMessage) {
            this.errorMessage = 'Error connecting to web socket';
          }
          return [];
        }));

      // this.breadcrumbs$ = this.applicationService.waitForAppEntity$.pipe(
      //   map(app => this.getBreadcrumbs(app.entity.entity)),
      //   first()
      // );
    }
  }
}
