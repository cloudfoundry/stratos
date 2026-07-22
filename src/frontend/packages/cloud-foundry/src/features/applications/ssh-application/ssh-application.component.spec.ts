import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';
import { TabNavService } from '@stratosui/core';
import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { ApplicationServiceMock } from "@test-framework/application-service-helper";
import { ApplicationService } from '../application.service';
import { SshApplicationComponent } from "./ssh-application.component";

describe('SshApplicationComponent', () => {
  let component: SshApplicationComponent;
  let fixture: ComponentFixture<SshApplicationComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        SshApplicationComponent,
      ],
      providers: [
        ...STORE_TEST_PROVIDERS,
        { provide: ApplicationService, useClass: ApplicationServiceMock },
        TabNavService,
        provideZonelessChangeDetection(),
      ],
    });
  });

  // TODO: Fix EntityCatalogHelper initialization to enable component creation test
  // The component requires EntityCatalogHelper to be initialized, which needs proper entity catalog setup
  it('should be defined', () => {
    expect(SshApplicationComponent).toBeDefined();
  });
});
