import { AfterContentInit, Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, NgModel, Validators } from '@angular/forms';
import { MdSelect } from '@angular/material';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Rx';

import { registeredCnsisEntitySelector } from '../../../../store/actions/cnsis.actions';
import { GetAllOrganizations, OrganizationSchema } from '../../../../store/actions/organization.actions';
import { AppState } from '../../../../store/app-state';
import { getCurrentPage } from '../../../../store/reducers/pagination.reducer';

@Component({
  selector: 'app-create-application-step1',
  templateUrl: './create-application-step1.component.html',
  styleUrls: ['./create-application-step1.component.scss'],
})
export class CreateApplicationStep1Component implements OnInit, AfterContentInit {

  constructor(private store: Store<AppState>, private fb: FormBuilder) {
  }

  @ViewChild(TemplateRef)
  content: TemplateRef<any>;

  paginationKey = 'createApplication';

  data$: Observable<any>;
  cfValid$: Observable<boolean>;

  @ViewChild('orgSelect')
  orgSelect: MdSelect;

  @ViewChild('cfSelect')
  cfSelect: MdSelect;

  cfForm: FormGroup;

  @ViewChild('appName')
  appName: NgModel;

  title: string;
  validate: Observable<boolean>;

  ngOnInit() {

  }

  ngAfterContentInit() {
    this.cfForm = this.fb.group({
      cf: [[], [Validators.required]],
      org: [[], [Validators.required]],
      space: [[], [Validators.required]]
    });

    this.validate = this.cfForm.valueChanges.mergeMap(() => {
      return Observable.of(this.cfForm.valid);
    }).startWith(this.cfForm.valid);
    this.data$ = this.getCFData();
  }

  getCFData(): Observable<{
    cfList: any,
    orgList: any,
    spaceList: any
  }> {
    return Observable.combineLatest(
      getCurrentPage({
        entityType: OrganizationSchema.key,
        paginationKey: this.paginationKey,
        store: this.store,
        action: new GetAllOrganizations(this.paginationKey),
        schema: [OrganizationSchema]
      }),
      this.store.select(registeredCnsisEntitySelector),
      this.cfSelect.valueChange.startWith(null),
      this.orgSelect.valueChange.startWith(null)
    )
      .filter(([orgList, cfList, selectedCF, selectedOrg]) => {
        return !!cfList;
      })
      .mergeMap(([orgList, cfList, selectedCF, selectedOrg]) => {
        const data = {
          cfList,
          orgList: null,
          spaceList: null
        };
        if (orgList.data && selectedCF) {
          data.orgList = orgList.data
            .map(org => org.entity)
            .filter(org => org.cfGuid === selectedCF.guid);
        }
        data.spaceList = selectedOrg ? selectedOrg.spaces.map(space => space.entity) : [];
        return Observable.of(data);
      });
  }

}
