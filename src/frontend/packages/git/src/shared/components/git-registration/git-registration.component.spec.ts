import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, importProvidersFrom } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { provideRouter } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { getGitHubAPIURL, GITHUB_API_URL, GitSCMService, gitEntityCatalog } from '@stratosui/git';
import { createBasicStoreModule } from '../../../../../store/testing/src/store-test-helper';
import { EntityCatalogHelper, EntityCatalogHelpers, EntityCatalogTestModule, TEST_CATALOGUE_ENTITIES } from '@stratosui/store';
import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { generateStratosEntities } from '../../../../../store/src/stratos-entity-generator';
import { EndpointsSignalConfigService } from '../../../../../core/src/features/endpoints/endpoints-page/endpoints-signal-config.service';
import { GitRegistrationComponent } from './git-registration.component';

function makeStubEndpointsSignalConfig() {
  return {
    // Only the methods git-registration touches need stubs; the rest of the
    // service's signal/computed surface is not read by this component.
    register: vi.fn().mockResolvedValue({ busy: false, error: false, message: 'new-endpoint-guid' }),
    unregister: vi.fn().mockResolvedValue({ busy: false, error: false, message: '' }),
  };
}

describe('GitRegistrationComponent', () => {
  let component: GitRegistrationComponent;
  let fixture: ComponentFixture<GitRegistrationComponent>;
  let stubSignalConfig: ReturnType<typeof makeStubEndpointsSignalConfig>;

  beforeEach(() => {
    stubSignalConfig = makeStubEndpointsSignalConfig();
    TestBed.configureTestingModule({
      imports: [
        GitRegistrationComponent,
      ],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        ...STORE_TEST_PROVIDERS,
        importProvidersFrom(
          createBasicStoreModule(),
          EntityCatalogTestModule
        ),
        {
          provide: TEST_CATALOGUE_ENTITIES,
          useValue: [
            ...generateStratosEntities(),
            ...gitEntityCatalog.allGitEntities()
          ]
        },
        EntityCatalogHelper,
        { provide: GITHUB_API_URL, useFactory: getGitHubAPIURL },
        GitSCMService,
        { provide: EndpointsSignalConfigService, useValue: stubSignalConfig },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              params: {
                subtype: 'github'
              },
              queryParams: {}
            }
          }
        }
      ]
    })
    .compileComponents();

    // Initialize EntityCatalogHelper for Angular 20 compatibility
    const helper = TestBed.inject(EntityCatalogHelper);
    EntityCatalogHelpers.SetEntityCatalogHelper(helper);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(GitRegistrationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
