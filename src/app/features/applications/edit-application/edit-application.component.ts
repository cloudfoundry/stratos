import { Component, OnInit, OnDestroy} from '@angular/core';
import { ApplicationService } from '../application.service';
import { EntityService } from '../../../core/entity-service';
import { AppState } from '../../../store/app-state';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { FormControl, FormGroup, FormBuilder, Validators } from '@angular/forms';

// import { UpdateApplication } from '../../../store/actions/application.actions';

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
    private fb: FormBuilder
  ) {
    this.editAppForm = this.fb.group({
      name:['',  Validators.required],
      instances: 0,
      disk_quota: 0,
      memory: 0,
      enable_ssh: false,
      production: false
    });
  }

  private app: any = {
    entity: {}
  };

  private sub: Subscription;

  ngOnInit() {
    this.sub = this.applicationService.appSummary$.subscribe(app => {
      console.log('APP');
      console.log(app);
      if(app.metadata) {
        this.app = app.metadata;
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
      }
    });
  }

  updateApp() {
    console.log('Apply Application Edit');
    console.log(this.editAppForm);

    var updates = {};
    // We will only send the values that were actually edited
    for (var key of Object.keys(this.editAppForm.value)) {
      console.log(key);
      if (!this.editAppForm.controls[key].pristine) {
        updates[key] = this.editAppForm.value[key];
      }
    }
    console.log(updates);

    if (Object.keys(updates).length) {
      // We had at least one value to change - send update action
      this.applicationService.updateApplication(updates);
    }
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
