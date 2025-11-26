import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { CoreModule, SharedModule, TailwindJsonSchemaFormModule } from '@stratosui/core';
import { ApplicationStateService } from './services/application-state.service';
import { ApplicationEnvVarsHelper } from '../features/applications/application/application-tabs-base/tabs/build-tab/application-env-vars.service';
import { CloudFoundryUserProvidedServicesService } from './services/cloud-foundry-user-provided-services.service';
import { CfUserService } from './data-services/cf-user.service';
import { ActiveRouteCfOrgSpace } from '../features/cf/cf-page.types';

/**
 * CloudFoundrySharedModule - Provider-Only Module
 *
 * This module has been refactored from a component aggregator to a provider-only module
 * as part of the Angular 20 migration circular dependency resolution.
 *
 * Phase 1.1 Changes:
 * - Removed all 89 component/directive imports
 * - Kept essential module dependencies only
 * - Provides CF-specific services for shared use
 *
 * Consuming modules must now import components directly where needed.
 */
@NgModule({
    imports: [
        CommonModule,
        CoreModule,
        SharedModule,
        TailwindJsonSchemaFormModule,
    ],
    providers: [
        ApplicationStateService,
        ApplicationEnvVarsHelper,
        CloudFoundryUserProvidedServicesService,
        CfUserService,
        ActiveRouteCfOrgSpace,
    ]
})
export class CloudFoundrySharedModule { }

