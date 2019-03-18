import { ActivatedRoute } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { HelmReleaseGuid } from '../../store/helm.types';
import { GetHelmReleases } from '../../store/helm.actions';
import { PaginationMonitor } from '../../../../shared/monitors/pagination-monitor';
import { entityFactory } from '../../../../../../store/src/helpers/entity-factory';
import { Observable } from 'rxjs';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../../../store/src/app-state';
import { helmReleasesSchemaKey } from '../../store/helm.entities';
import { getPaginationObservables } from '../../../../../../store/src/reducers/pagination-reducer/pagination-reducer.helper';
import { ConfirmationDialogConfig } from '../../../../shared/components/confirmation-dialog.config';
import { ConfirmationDialogService } from '../../../../shared/components/confirmation-dialog.service';
import { HttpClient } from '@angular/common/http';
import { ClearPaginationOfType } from '../../../../../../store/src/actions/pagination.actions';
import { RouterNav } from '../../../../../../store/src/actions/router.actions';

@Component({
  selector: 'app-helm-release-tab-base',
  templateUrl: './helm-release-tab-base.component.html',
  styleUrls: ['./helm-release-tab-base.component.scss'],
  providers: [
    {
      provide: HelmReleaseGuid,
      useFactory: (activatedRoute: ActivatedRoute) => {
        return {
          guid: activatedRoute.snapshot.params.guid
        };
      },
      deps: [
        ActivatedRoute
      ]
    }
  ]
})
export class HelmReleaseTabBaseComponent implements OnInit {

  // Confirmation dialogs
  deleteReleaseConfirmation = new ConfirmationDialogConfig(
    'Delete Release',
    'Are you sure you want to delete this Release?',
    'Delete'
  );

  isFetching$: Observable<boolean>;

  public breadcrumbs = [
    { value: 'Helm' },
    { value: 'Releases', routerLink: '/monocular/releases' }
  ];

  public title = '';

  tabLinks = [
    { link: 'summary', label: 'Summary' },
  ];
  constructor(
    private helmRelease: HelmReleaseGuid,
    private store: Store<AppState>,
    private confirmDialog: ConfirmationDialogService,
    private httpClient: HttpClient,
  ) {
    const guid = this.helmRelease.guid;
    this.title = guid.split(':')[1];

    const action = new GetHelmReleases();
    const paginationMonitor = new PaginationMonitor(store, action.paginationKey, entityFactory(helmReleasesSchemaKey));
    const svc = getPaginationObservables({store, action, paginationMonitor});
    this.isFetching$ = svc.fetchingEntities$;
  }

  ngOnInit() { }

  public deleteRelease() {
    this.confirmDialog.open(this.deleteReleaseConfirmation, () => {
      // Make the http request to delete the release
      const endpointAndName = this.helmRelease.guid.replace(':', '/');
      this.httpClient.delete(`/pp/v1/helm/releases/${endpointAndName}`).subscribe(d => {
        this.store.dispatch(new ClearPaginationOfType(helmReleasesSchemaKey));
        this.store.dispatch(new RouterNav({ path: ['monocular/releases']}));
      });
    });
  }

}
