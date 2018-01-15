import { EntityInfo } from '../../../../store/types/api.types';
import { selectDeletionInfo } from '../../../../store/selectors/api.selectors';
import { getPaginationObservables } from './../../../../store/reducers/pagination-reducer/pagination-reducer.helper';
import { AfterContentInit, Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { NgForm, NgModel } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Rx';

import { SetCFDetails } from '../../../../store/actions/create-applications-page.actions';
import { AppState } from '../../../../store/app-state';
import { CfOrgSpaceDataService } from '../../../../shared/data-services/cf-org-space-service.service';


@Component({
  selector: 'app-create-application-step1',
  templateUrl: './create-application-step1.component.html',
  styleUrls: ['./create-application-step1.component.scss'],
  providers: [CfOrgSpaceDataService]
})
export class CreateApplicationStep1Component implements OnInit, AfterContentInit {

  constructor(private store: Store<AppState>, public cfOrgSpaceService: CfOrgSpaceDataService) { }

  cfValid$: Observable<boolean>;

  @ViewChild('cfForm')
  cfForm: NgForm;

  validate: Observable<boolean>;

  onNext = () => {
    this.store.dispatch(new SetCFDetails({
      cloudFoundry: this.cfOrgSpaceService.cf.select.getValue(),
      org: this.cfOrgSpaceService.org.select.getValue(),
      space: this.cfOrgSpaceService.space.select.getValue()
    }));
    return Observable.of({ success: true });
  }

  ngOnInit() {
    const appWallPaginationState = this.cfOrgSpaceService.appWallPaginationState();
    appWallPaginationState.filter(pag => !!pag).first().do(pag => {
      this.cfOrgSpaceService.cf.select.next(pag.clientPagination.filter.items.cf);
      this.cfOrgSpaceService.org.select.next(pag.clientPagination.filter.items.org);
      this.cfOrgSpaceService.space.select.next(pag.clientPagination.filter.items.space);
    }).subscribe();
  }

  ngAfterContentInit() {
    this.validate = this.cfForm.statusChanges
      .map(() => {
        return this.cfForm.valid;
      });
  }
}
