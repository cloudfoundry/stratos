import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { TabNavService } from '../../../../../core/src/tab-nav.service';
import { generateTestApplicationServiceProvider } from '../../../../test-framework/application-service-helper';
import { generateCfBaseTestModules } from '../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { ApplicationsModule } from '../applications.module';
import { ApplicationDeleteComponent } from './application-delete.component';

describe('ApplicationDeleteComponent', () => {
  let component: ApplicationDeleteComponent<any>;
  let fixture: ComponentFixture<ApplicationDeleteComponent<any>>;
  const appId = '1';
  const cfId = '2';

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ...generateCfBaseTestModules(),
        ApplicationsModule
      ],
      providers: [
        generateTestApplicationServiceProvider(cfId, appId),
        TabNavService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ApplicationDeleteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
