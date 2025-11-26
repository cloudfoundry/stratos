/*
 * Public API Surface of cloud-foundry test-framework
 */

// Re-export core test framework utilities
export { configureZonelessTestBed } from '@test-framework';

// CF Testing Module
export { CloudFoundryTestingModule } from '../src/cloud-foundry-test.module';
export { generateCFEntities } from '../src/cf-entity-generator';

// CF Types
export { ActiveRouteCfOrgSpace, ActiveRouteCfCell } from '../src/features/cf/cf-page.types';

// CF Services needed for testing
export { ApplicationStateService } from '../src/shared/services/application-state.service';
export { ApplicationEnvVarsHelper } from '../src/features/applications/application/application-tabs-base/tabs/build-tab/application-env-vars.service';

// CF-specific test helpers - export everything from helper files
export * from './application-service-helper';
export * from './cf-test-helper';
export * from './cloud-foundry-endpoint-service.helper';
export * from './cloud-foundry-organization.service.mock';
export * from './cloud-foundry-space.service.mock';
export * from './entity-relations-spec-helper';
export * from './user-service-helper';

// Explicitly export configureZonelessTestBed to ensure it's available
export type { TestModuleMetadata } from '@angular/core/testing';
