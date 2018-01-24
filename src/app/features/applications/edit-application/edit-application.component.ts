import { Component, OnInit, OnDestroy } from '@angular/core';
import { ApplicationService } from '../application.service';
import { EntityService } from '../../../core/entity-service';
import { AppState } from '../../../store/app-state';
import { Store } from '@ngrx/store';
import { FormControl, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { selectUpdateInfo } from '../../../store/selectors/api.selectors';
import { selectNewAppState } from '../../../store/effects/create-app-effects';

// import { UpdateApplication } from '../../../store/actions/application.actions';
import { Observable, Subscription } from 'rxjs/Rx';
import { Router } from '@angular/router';
// import { AppNameUniqueDirective } from '../app-name-unique.directive/app-name-unique.directive';
import { RouterNav } from '../../../store/actions/router.actions';
import { AppMetadataTypes } from '../../../store/actions/app-metadata.actions';

@Component({
  selector: 'app-edit-application',
  templateUrl: './edit-application.component.html',
  styleUrls: ['./edit-application.component.scss']
})
export class EditApplicationComponent implements OnInit, OnDestroy {

  editAppForm: FormGroup;

  checkingNameState$: Observable<string>;

  constructor(
    private applicationService: ApplicationService,
    private entityService: EntityService,
    private store: Store<AppState>,
    private fb: FormBuilder,
  ) {
    this.editAppForm = this.fb.group({
      name: ['', [
        Validators.required,
        // new AppNameUniqueDirective(this.store),
      ]],
      instances: [0, [
        Validators.required,
        Validators.minLength(0)
      ]],
      disk_quota: [0, [
        Validators.required,
        Validators.minLength(0)
      ]],
      memory: [0, [
        Validators.required,
        Validators.minLength(0)
      ]],
      enable_ssh: false,
      production: false
    });
  }

  private app: any = {
    entity: {}
  };

  private sub: Subscription;

  private error = false;

  ngOnInit() {
    this.sub = this.applicationService.application$.filter(app => app.app.entity).take(1).map(app => app.app.entity).subscribe(app => {
      this.app = app;
      this.editAppForm.setValue({
        name: this.app.name,
        instances: this.app.instances,
        memory: this.app.memory,
        disk_quota: this.app.disk_quota,
        production: this.app.production,
        enable_ssh: this.app.enable_ssh
      });
      // Don't want the values to change while the user is editing
      this.clearSub();
    });
  }

  updateApp = () => {
    const { cfGuid, appGuid } = this.applicationService;
    const updates = {};
    // We will only send the values that were actually edited
    for (const key of Object.keys(this.editAppForm.value)) {
      if (!this.editAppForm.controls[key].pristine) {
        updates[key] = this.editAppForm.value[key];
      }
    }

    let obs$: Observable<any>;
    if (Object.keys(updates).length) {
      // We had at least one value to change - send update action
      obs$ = this.applicationService.updateApplication(updates, [AppMetadataTypes.SUMMARY]).map(v => ({ success: !v.error }));
    } else {
      obs$ = Observable.of({ success: true });
    }

    return obs$.take(1).do(res => {
      if (res.success) {
        // Navigate back to the application page
        this.store.dispatch(new RouterNav({ path: ['applications', cfGuid, appGuid] }));
      } else {
        this.error = !res.success;
      }
    });
  }

  clearSub() {
    if (this.sub) {
      this.sub.unsubscribe();
      this.sub = undefined;
    }
  }

  ngOnDestroy() {
    this.clearSub();
  }
}
