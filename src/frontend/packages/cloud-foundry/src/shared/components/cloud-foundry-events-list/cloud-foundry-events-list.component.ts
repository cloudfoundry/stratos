
import { Component, Input, OnDestroy, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { ReactiveFormsModule, FormControl, FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

import {
  arraysEqual,
  valueOrCommonFalsy,
  CustomFormFieldComponent,
  AppInputDirective,
  CustomSelectComponent,
  CustomOptionComponent,
  ListComponent,
  ListConfig,
  safeUnsubscribe
} from '@stratosui/core';
import { APIResource } from '@stratosui/store';
import { CfEventsConfigService } from '../list/list-types/cf-events/cf-events-config.service';

/**
 * Typed form interface for CF Events list filters
 */
interface EventsFilterForm {
  actee: FormControl<string | null>;
  type: FormControl<string[] | null>;
}

@Component({
  selector: 'app-cloud-foundry-events-list',
  templateUrl: './cloud-foundry-events-list.component.html',
  styleUrls: ['./cloud-foundry-events-list.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'flex flex-col flex-1 min-h-0' },
  imports: [
    ReactiveFormsModule,
    CustomFormFieldComponent,
    CustomSelectComponent,
    CustomOptionComponent,
    AppInputDirective,
    ListComponent
]
})
export class CloudFoundryEventsListComponent implements OnInit, OnDestroy {

  /**
   * Values in the `event` filter mist contain this value, for instance `audit.app`
   */
  @Input() typeMustContain!: string;

  filtersFormGroup: FormGroup<EventsFilterForm>;
  // Full list from CF API v3 docs — sorted alphabetically
  // Source: https://docs.cloudfoundry.org/running/managing-cf/audit-events.html
  typeValues: string[] = [
    'app.crash',
    'audit.app.apply_manifest',
    'audit.app.build.create',
    'audit.app.copy-bits',
    'audit.app.create',
    'audit.app.delete-request',
    'audit.app.deployment.cancel',
    'audit.app.deployment.create',
    'audit.app.droplet.create',
    'audit.app.droplet.delete',
    'audit.app.droplet.download',
    'audit.app.droplet.mapped',
    'audit.app.droplet.upload',
    'audit.app.environment.show',
    'audit.app.environment_variables.show',
    'audit.app.map-route',
    'audit.app.package.create',
    'audit.app.package.delete',
    'audit.app.package.download',
    'audit.app.package.upload',
    'audit.app.process.crash',
    'audit.app.process.create',
    'audit.app.process.delete',
    'audit.app.process.not-ready',
    'audit.app.process.ready',
    'audit.app.process.rescheduling',
    'audit.app.process.scale',
    'audit.app.process.terminate_instance',
    'audit.app.process.update',
    'audit.app.restart',
    'audit.app.restage',
    'audit.app.revision.create',
    'audit.app.revision.environment_variables.show',
    'audit.app.ssh-authorized',
    'audit.app.ssh-unauthorized',
    'audit.app.start',
    'audit.app.stop',
    'audit.app.task.cancel',
    'audit.app.task.create',
    'audit.app.unmap-route',
    'audit.app.update',
    'audit.app.upload-bits',
    'audit.organization.create',
    'audit.organization.delete-request',
    'audit.organization.update',
    'audit.route.create',
    'audit.route.delete-request',
    'audit.route.share',
    'audit.route.transfer-owner',
    'audit.route.unshare',
    'audit.route.update',
    'audit.service.create',
    'audit.service.delete',
    'audit.service.update',
    'audit.service_binding.create',
    'audit.service_binding.delete',
    'audit.service_binding.show',
    'audit.service_binding.start_create',
    'audit.service_binding.start_delete',
    'audit.service_binding.update',
    'audit.service_broker.create',
    'audit.service_broker.delete',
    'audit.service_broker.update',
    'audit.service_dashboard_client.create',
    'audit.service_dashboard_client.delete',
    'audit.service_instance.bind_route',
    'audit.service_instance.create',
    'audit.service_instance.delete',
    'audit.service_instance.purge',
    'audit.service_instance.share',
    'audit.service_instance.show',
    'audit.service_instance.start_create',
    'audit.service_instance.start_delete',
    'audit.service_instance.start_update',
    'audit.service_instance.unbind_route',
    'audit.service_instance.unshare',
    'audit.service_instance.update',
    'audit.service_key.create',
    'audit.service_key.delete',
    'audit.service_key.show',
    'audit.service_key.start_create',
    'audit.service_key.start_delete',
    'audit.service_key.update',
    'audit.service_plan.create',
    'audit.service_plan.delete',
    'audit.service_plan.update',
    'audit.service_plan_visibility.create',
    'audit.service_plan_visibility.delete',
    'audit.service_plan_visibility.update',
    'audit.service_route_binding.create',
    'audit.service_route_binding.delete',
    'audit.service_route_binding.start_create',
    'audit.service_route_binding.start_delete',
    'audit.service_route_binding.update',
    'audit.space.create',
    'audit.space.delete-request',
    'audit.space.update',
    'audit.user.organization_auditor_add',
    'audit.user.organization_auditor_remove',
    'audit.user.organization_billing_manager_add',
    'audit.user.organization_billing_manager_remove',
    'audit.user.organization_manager_add',
    'audit.user.organization_manager_remove',
    'audit.user.organization_user_add',
    'audit.user.organization_user_remove',
    'audit.user.space_auditor_add',
    'audit.user.space_auditor_remove',
    'audit.user.space_developer_add',
    'audit.user.space_developer_remove',
    'audit.user.space_manager_add',
    'audit.user.space_manager_remove',
    'audit.user.space_supporter_add',
    'audit.user.space_supporter_remove',
    'audit.user_provided_service_instance.create',
    'audit.user_provided_service_instance.delete',
    'audit.user_provided_service_instance.show',
    'audit.user_provided_service_instance.update',
    'blob.remove_orphan',
  ];
  showActee = false;
  private subs: Subscription[] = [];
  private config: CfEventsConfigService;
  private initialSet = false;
  public hasActeeFilter = false;

  constructor() {
    const listConfig = inject<ListConfig<APIResource>>(ListConfig);

    this.filtersFormGroup = new FormGroup<EventsFilterForm>({
      actee: new FormControl<string | null>(null),
      type: new FormControl<string[] | null>(null),
    });
    this.config = (listConfig as any as CfEventsConfigService);

    // Store → form sync with deep comparison to prevent feedback loops.
    // After init, only sync when the store clears filters (reset button).
    this.subs.push(
      this.config.getEventFilters().pipe(
        distinctUntilChanged((a, b) =>
          arraysEqual(a.type, b.type) &&
          valueOrCommonFalsy(a.actee) === valueOrCommonFalsy(b.actee)
        )
      ).subscribe(params => {
        if (!this.initialSet) {
          this.updateType(params.type);
          this.updateActee(params.actee);
          this.initialSet = true;
        } else {
          const storeCleared = (!params.type || params.type.length === 0) && !params.actee;
          if (storeCleared) {
            this.updateType(params.type);
            this.updateActee(params.actee);
          }
        }
      })
    );

    this.subs.push(
      this.filtersFormGroup.valueChanges.pipe(
        debounceTime(250)
      ).subscribe(values => {
        this.config.setEventFilters(values as { actee: string; type: string[] });
        this.hasActeeFilter = !!values.actee;
      })
    );

    // If we have an actee there's no need to show the actee guid selector
    this.showActee = !this.config.acteeGuid;
  }

  ngOnInit() {
    if (this.typeMustContain) {
      this.typeValues = this.typeValues.filter(type => type.indexOf(this.typeMustContain) >= 0);
    }
  }

  ngOnDestroy() {
    safeUnsubscribe(...this.subs);
  }

  public clearActeeFilter() {
    this.filtersFormGroup.patchValue({ actee: '' });
  }

  private updateType(type: string[]) {
    this.filtersFormGroup.get('type')?.setValue(type, { emitEvent: false });
  }

  private updateActee(actee: string) {
    this.filtersFormGroup.get('actee')?.setValue(actee, { emitEvent: false });
    this.hasActeeFilter = !!actee;
  }

}
