import { AfterContentInit, Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, NgModel, Validators } from '@angular/forms';
import { MdSelect } from '@angular/material';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Rx';

import { registeredCnsisEntitySelector } from '../../../../store/actions/cnsis.actions';
import { SetCFDetails } from '../../../../store/actions/create-applications-page.actions';
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

  paginationKey = 'createApplication';

  data$: Observable<any>;
  cfValid$: Observable<boolean>;

  @ViewChild('orgSelect')
  orgSelect: MdSelect;

  @ViewChild('cfSelect')
  cfSelect: MdSelect;

  @ViewChild('spaceSelect')
  spaceSelect: MdSelect;

  cfForm: FormGroup;

  @ViewChild('appName')
  appName: NgModel;

  validate: Observable<boolean>;

  currentOrg: any;

  cfDetails: {
    cloudFoundry: '',
    org: '',
    space: ''
  };

  onNext = () => {
    this.store.dispatch(new SetCFDetails(this.cfDetails));
    return Observable.of({ success: true });
  }

  ngOnInit() {
    this.data$ = this.getCFData();
  }

  ngAfterContentInit() {
    this.cfForm = this.fb.group({
      cf: [[], [Validators.required]],
      org: [[], [Validators.required]],
      space: [[], [Validators.required]]
    });

    this.validate = this.cfForm.statusChanges
      .map(() => {
        return this.cfForm.valid;
      });


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
      this.cfSelect.valueChange.startWith(''),
      this.orgSelect.valueChange.startWith(''),
      this.spaceSelect.valueChange.startWith('')
    )
      .filter(([orgList, cfList]) => {
        return !!cfList;
      })
      .map(([orgList, cfList, selectedCF, selectedOrg, selectedSpace]) => {
        const data = {
          cfList,
          orgList: null,
          spaceList: null
        };
        if (selectedCF) {
          if (orgList.data) {
            data.orgList = orgList.data
              .map(org => org.entity)
              .filter(org => org.cfGuid === selectedCF.guid);
          }
        }
        data.spaceList = selectedOrg ? selectedOrg.spaces.map(space => {
          space.entity.guid = space.metadata.guid;
          return space.entity;
        }) : [];
        if (selectedCF && selectedOrg && selectedSpace) {
          this.cfDetails = {
            cloudFoundry: selectedCF,
            org: selectedOrg,
            space: selectedSpace
          };
        }
        return data;
      });
  }

}
