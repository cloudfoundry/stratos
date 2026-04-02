import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild, ChangeDetectionStrategy, inject } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Store } from '@ngrx/store';
import { NEVER, Observable, Subject } from 'rxjs';
import websocketConnect, { normalClosureMessage } from 'rxjs-websockets';
import { take, catchError, map, switchMap, tap } from 'rxjs/operators';
import { CustomTooltipDirective, PageHeaderComponent, IHeaderBreadcrumb } from '@stratosui/core';
import { SshViewerComponent } from '../../../../../core/src/shared/components/ssh-viewer/ssh-viewer.component';
import { CFAppState } from '@stratosui/cloud-foundry';
import { IApp } from '../../../cf-api.types';
import { ApplicationService } from '../application.service';


@Component({
  selector: 'app-ssh-application',
  templateUrl: './ssh-application.component.html',
  styleUrls: ['./ssh-application.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    CustomTooltipDirective,
    PageHeaderComponent,
    SshViewerComponent
  ]
})
export class SshApplicationComponent implements OnInit {
  private activatedRoute = inject(ActivatedRoute);
  private store = inject<Store<CFAppState>>(Store);
  private applicationService = inject(ApplicationService);


  public messages!: Observable<string>;

  public connectionStatus = new Subject<number>();

  public sshInput!: Subject<string>;

  public errorMessage!: string;

  public sshRoute!: string;

  public connected!: boolean;

  public appInstanceLink!: string;

  public instanceId!: string;

  public breadcrumbs$!: Observable<IHeaderBreadcrumb[]>;

  @ViewChild('sshViewer', { static: true }) sshViewer: SshViewerComponent;

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

  ngOnInit() {
    this.connectionStatus.next(0);
    const { cfGuid, appGuid } = this.applicationService;
    const routeParams = this.activatedRoute.snapshot.params;
    this.instanceId = routeParams.index;

    this.appInstanceLink = (
      `/applications/${cfGuid}/${appGuid}/instances`
    );

    if (!cfGuid || !appGuid || !this.instanceId) {
      this.messages = NEVER;
    } else {
      const host = window.location.host;
      const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
      const streamUrl = (
        `${protocol}://${host}/pp/v1/${cfGuid}/apps/${appGuid}/ssh/${this.instanceId}`
      );
      this.sshInput = new Subject<string>();
      const connection = websocketConnect(
        streamUrl
      );

      this.messages = connection.pipe(
        tap(() => this.connectionStatus.next(1)),
        switchMap((getResponse: any): any[] => getResponse(this.sshInput)),
        catchError((e: Error): any[] => {
          if (e.message !== normalClosureMessage) {
            this.errorMessage = 'Error connecting to web socket';
          }
          return [];
        }));

      this.breadcrumbs$ = this.applicationService.waitForAppEntity$.pipe(
        map(app => this.getBreadcrumbs(app.entity.entity)),
        take(1)
      );
    }
  }
}
