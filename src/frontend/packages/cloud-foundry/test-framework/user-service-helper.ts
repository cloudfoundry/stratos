import { provideHttpClientTesting } from '@angular/common/http/testing';

import { cfCurrentUserPermissionsService } from '../src/user-permissions/cf-user-permissions-checkers';


// Legacy-named bundle: provides the testing HttpBackend + CF permissions (the CfUserService it once provided was deleted).
// provideHttpClientTesting() puts HttpClientTestingBackend behind both HttpBackend and HttpTestingController,
// so requests are held for the spec to expect and flush. HttpClient itself comes from the workspace platform
// (or the spec's own provideHttpClient(), which must sit before this bundle).
export const CfUserServiceTestProvider = [
  ...provideHttpClientTesting(),
  ...cfCurrentUserPermissionsService
];
