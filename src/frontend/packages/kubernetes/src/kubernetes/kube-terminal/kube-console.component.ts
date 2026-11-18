import { Component, OnInit, Signal, computed, inject, signal, ChangeDetectionStrategy, viewChild } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CustomTooltipDirective } from '@stratosui/core';
import { EMPTY, NEVER, Observable, Subject } from 'rxjs';
import websocketConnect, { normalClosureMessage } from 'rxjs-websockets';
import { catchError, switchMap, tap } from 'rxjs/operators';

import { PageHeaderComponent } from '../../../../core/src/shared/components/page-header/page-header.component';
import { IHeaderBreadcrumb } from '../../../../core/src/shared/components/page-header/page-header.types';
import { SshViewerComponent } from '../../../../core/src/shared/components/ssh-viewer/ssh-viewer.component';
import { BaseKubeGuid } from '../kubernetes-page.types';
import { KubernetesEndpointService } from '../services/kubernetes-endpoint.service';
import { KubernetesService } from '../services/kubernetes.service';


@Component({
  selector: 'app-kube-console',
  templateUrl: './kube-console.component.html',

  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CustomTooltipDirective,
    PageHeaderComponent,
    RouterLink,
    SshViewerComponent,
  ],
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

  // strict: the websocket payload is string | ArrayBuffer | Blob (rxjs-websockets
  // WebSocketPayload, not exported); ssh-viewer consumes it as Observable<any>.
  public messages!: Observable<string | ArrayBuffer | Blob>; // strict: assigned in both ngOnInit branches

  public connectionStatus = new Subject<number>();

  public sshInput!: Subject<string>; // strict: assigned in ngOnInit when an endpoint guid is available

  // Set when the terminal fails to launch, after the first render
  public readonly errorMessage = signal<string | undefined>(undefined);

  public connected = false;

  public kubeSummaryLink!: string; // strict: always assigned in ngOnInit

  public breadcrumbs: Signal<IHeaderBreadcrumb[]> = signal([]);

  readonly sshViewer = viewChild.required<SshViewerComponent>('sshViewer'); // strict: @ViewChild populated after view init
  public kubeEndpointService = inject(KubernetesEndpointService);

  ngOnInit() {
    this.connectionStatus.next(0);
    const guid = this.kubeEndpointService.baseKube.guid;
    this.kubeSummaryLink = `/kubernetes/${guid}/summary`;

    if (!guid) {
      this.messages = NEVER;
      this.connectionStatus.next(0);
      this.errorMessage.set('No Endpoint ID available');
    } else {
      const host = window.location.host;
      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const streamUrl = (
        `${protocol}://${host}/pp/v1/kubeterminal/${guid}`
      );
      this.sshInput = new Subject<string>();
      const connection = websocketConnect(streamUrl);

      this.messages = connection.pipe(
        // Each connect attempt starts without the previous attempt's error
        tap({ subscribe: () => this.errorMessage.set(undefined) }),
        tap(() => this.connectionStatus.next(1)),
        switchMap(getResponse => getResponse(this.sshInput)),
        catchError((e: Error): Observable<never> => {
          if (e.message !== normalClosureMessage && !this.sshViewer().isConnected()) {
            this.errorMessage.set('Error launching Kubernetes Terminal');
          }
          return EMPTY;
        }));

      // Breadcrumbs
      this.breadcrumbs = computed((): IHeaderBreadcrumb[] => {
        const endpoint = this.kubeEndpointService.endpoint();
        if (!endpoint) {
          return [];
        }
        return [{
          breadcrumbs: [
            { value: endpoint.name, routerLink: `/kubernetes/${endpoint.guid}` },
          ]
        }];
      });
    }
  }
}
