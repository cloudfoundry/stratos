import { Component, OnInit, OnDestroy} from '@angular/core';
import { ApplicationService } from '../application.service';
import { EntityService } from '../../../core/entity-service';
import { AppState } from '../../../store/app-state';
import { Store } from '@ngrx/store';
import { FormControl, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { selectUpdateInfo } from '../../../store/selectors/api.selectors';

// import { UpdateApplication } from '../../../store/actions/application.actions';
import { Observable, Subscription } from 'rxjs/Rx';
import { Router } from '@angular/router';

@Component({
  selector: 'app-edit-application',
  templateUrl: './edit-application.component.html',
  styleUrls: ['./edit-application.component.scss']
})
export class EditApplicationComponent implements OnInit, OnDestroy {

  editAppForm: FormGroup;

  constructor(
    private applicationService: ApplicationService,
    private entityService: EntityService,
    private store: Store<AppState>,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.editAppForm = this.fb.group({
      name: ['',  Validators.required],
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

  private backRouteLink: string;

  ngOnInit() {
    const { cfGuid, appGuid } = this.applicationService;
    this.backRouteLink =  `/applications/${cfGuid}/${appGuid}`;

    this.sub = this.applicationService.application$.filter(app => app.app.entity).take(1).map(app => app.app.entity).subscribe(app => {
      console.log('GOT VALUES');
      this.app = app;
      this.editAppForm.setValue({
        name:    this.app.name,
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

  updateApp = () =>  {
    console.log('Apply Application Edit');
    console.log(this.editAppForm);

    const updates = {};
    // We will only send the values that were actually edited
    for (const key of Object.keys(this.editAppForm.value)) {
      console.log(key);
      if (!this.editAppForm.controls[key].pristine) {
        updates[key] = this.editAppForm.value[key];
      }
    }
    console.log(updates);

    let obs$: Observable<any>;

    if (Object.keys(updates).length) {
      // We had at least one value to change - send update action
      obs$ = this.applicationService.updateApplication(updates).map(v => ({success: !v.error}));
    } else {
      obs$ = Observable.of({success: true});
    }

    return obs$.take(1).do(res => {
      console.log('Update complete');
      console.log(res);
      if (res.success) {
        // Navigate back to the application page
        this.router.navigate([this.backRouteLink]);
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
