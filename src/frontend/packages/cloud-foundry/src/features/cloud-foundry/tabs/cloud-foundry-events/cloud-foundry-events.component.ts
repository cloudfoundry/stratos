import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';

import { safeUnsubscribe } from '../../../../../../core/src/core/utils.service';
import { ListConfig } from '../../../../../../core/src/shared/components/list/list.component.types';
import { APIResource } from '../../../../../../store/src/types/api.types';
import { CfEventsConfigService } from '../../../../shared/components/list/list-types/cf-events/cf-events-config.service';

@Component({
  selector: 'app-cloud-foundry-events',
  templateUrl: './cloud-foundry-events.component.html',
  styleUrls: ['./cloud-foundry-events.component.scss'],
  providers: [{
    provide: ListConfig,
    useClass: CfEventsConfigService,
  }]
})
export class CloudFoundryEventsComponent implements OnInit, OnDestroy {

  // TODO: RC Privilideges
  // TODO: RC Disable when list is busy
  // TODO: RC Apply existing values
  // TODO: Add tooltip to actee icon, other icon too?
  // TODO: RC use same table in app world

  filtersFormGroup: FormGroup;
  acteeValues: string[] = [
    'app',
    'route',
    'service',
    'service_binding',
    'service_broker',
    'service_dashboard_client',
    'service_instance',
    'service_key',
    'service_plan',
    'service_plan_visibility',
    'space',
    'user',
    'user_provided_service_instance'
  ];
  typeValues: string[] = [
    'app.crash',
    'audit.app.copy-bits',
    'audit.app.create',
    'audit.app.delete-request',
    'audit.app.droplet.mapped',
    'audit.app.map-route',
    'audit.app.package.create',
    'audit.app.package.delete',
    'audit.app.package.download',
    'audit.app.package.upload',
    'audit.app.restage',
    'audit.app.ssh-authorized',
    'audit.app.ssh-unauthorized',
    'audit.app.start',
    'audit.app.stop',
    'audit.app.unmap-route',
    'audit.app.update',
    'audit.app.upload-bits',
    'audit.organization.create',
    'audit.organization.delete-request',
    'audit.organization.update',
    'audit.route.create',
    'audit.route.delete-request',
    'audit.route.update',
    'audit.service.create',
    'audit.service.delete',
    'audit.service.update',
    'audit.service_binding.create',
    'audit.service_binding.delete',
    'audit.service_broker.create',
    'audit.service_broker.delete',
    'audit.service_broker.update',
    'audit.service_dashboard_client.create',
    'audit.service_dashboard_client.delete',
    'audit.service_instance.bind_route',
    'audit.service_instance.create',
    'audit.service_instance.delete',
    'audit.service_instance.unbind_route',
    'audit.service_instance.update',
    'audit.service_key.create',
    'audit.service_key.delete',
    'audit.service_plan.create',
    'audit.service_plan.delete',
    'audit.service_plan.update',
    'audit.service_plan_visibility.create',
    'audit.service_plan_visibility.delete',
    'audit.service_plan_visibility.update',
    'audit.space.create',
    'audit.space.delete-request',
    'audit.space.update',
    'audit.user_provided_service_instance.create',
    'audit.user_provided_service_instance.delete',
    'audit.user_provided_service_instance.update',
    'audit.user.space_auditor_add',
    'audit.user.space_auditor_remove',
    'audit.user.space_manager_add',
    'audit.user.space_manager_remove',
    'audit.user.space_developer_add',
    'audit.user.space_developer_remove',
    'audit.user.organization_auditor_add',
    'audit.user.organization_auditor_remove',
    'audit.user.organization_billing_manager_add',
    'audit.user.organization_billing_manager_remove',
    'audit.user.organization_manager_add',
    'audit.user.organization_manager_remove',
    'audit.user.organization_user_add',
    'audit.user.organization_user_remove',
    'blob.remove_orphan',
    'audit.app.build.create',
    'audit.app.droplet.create',
    'audit.app.droplet.delete',
    'audit.app.droplet.download',
    'audit.app.process.crash',
    'audit.app.process.create',
    'audit.app.process.delete',
    'audit.app.process.scale',
    'audit.app.process.terminate_instance',
    'audit.app.process.update',
    'audit.app.task.cancel',
    'audit.app.task.create',
    'audit.service_instance.share',
    'audit.service_instance.unshare'
  ];
  private subs: Subscription[] = [];

  constructor(
    listConfig: ListConfig<APIResource>
  ) {
    this.filtersFormGroup = new FormGroup({
      actee: new FormControl(null, []),
      type: new FormControl(null, []),
      // host: new FormControl({ disabled: true }, [Validators.required, Validators.maxLength(63)]),
    });

    this.subs.push(
      this.filtersFormGroup.valueChanges.subscribe(values => {
        console.log(values);
        (listConfig as CfEventsConfigService).setFilters(values);
      })
    );

  }

  ngOnInit() {
  }

  ngOnDestroy() {
    safeUnsubscribe(...this.subs);
  }
}
