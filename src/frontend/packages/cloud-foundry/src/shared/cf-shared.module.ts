import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';

import { CoreModule } from '@stratosui/core';
import { TailwindJsonSchemaFormModule } from '../../../core/src/shared/components/tailwind-json-schema-form/tailwind-json-schema-form.module';
import { SharedModule } from '@stratosui/core';
import { ApplicationStateService } from './services/application-state.service';
import { ApplicationEnvVarsHelper } from '../features/applications/application/application-tabs-base/tabs/build-tab/application-env-vars.service';
import { CloudFoundryUserProvidedServicesService } from './services/cloud-foundry-user-provided-services.service';
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
        ActiveRouteCfOrgSpace,
    ]
})
export class CloudFoundrySharedModule { }

