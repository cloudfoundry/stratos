import { Component, ChangeDetectionStrategy } from '@angular/core';

import { PageHeaderComponent } from '../../../../../../core/src/shared/components/page-header/page-header.component';
import { SteppersComponent } from '../../../../../../core/src/shared/components/stepper/steppers/steppers.component';
import { StepComponent } from '../../../../../../core/src/shared/components/stepper/step/step.component';
import { AddRoutesComponent } from '../add-routes/add-routes.component';
import { AppRouteActionsService } from '../../../../shared/services/app-route-actions.service';
import {
  CfMapRoutesSignalConfigService,
} from '../../../../shared/components/list/list-types/app-route/cf-map-routes-signal-config.service';

/**
 * AddRouteStepperComponent — Slice 3.5 wires the signal-native page-route
 * for /applications/{cnsi}/{app}/add-route.
 *
 * Providers are tab/page-scoped:
 *   - AppRouteActionsService — separate instance from the Routes-tab one
 *     (the stepper page is a sibling page-route, not a child of the tab).
 *     Cross-page mutation continuity is handled by AppDetailDataService
 *     which lives at the application detail tabs base.
 *   - CfMapRoutesSignalConfigService — owns the picker's filter/sort/
 *     selection state for the lifetime of this page-route.
 *
 * The legacy `{ provide: ListConfig, useClass: CfAppMapRoutesListConfigService }`
 * provider has been retired with `MapRoutesComponent`; AddRoutesComponent
 * now embeds `<app-signal-list>` directly with the config built from
 * CfMapRoutesSignalConfigService.
 */
@Component({
  selector: 'app-add-route-stepper',
  templateUrl: './add-route-stepper.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    SteppersComponent,
    StepComponent,
    AddRoutesComponent,
  ],
  providers: [
    AppRouteActionsService,
    CfMapRoutesSignalConfigService,
  ],
})
export class AddRouteStepperComponent { }
