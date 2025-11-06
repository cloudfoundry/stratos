import { DatePipe } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { generateCfBaseTestModules } from '../../../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { CloudFoundrySpaceServiceMock } from '../../../../../../../../test-framework/cloud-foundry-space.service.mock';
import { CloudFoundrySpaceService } from '../../../../../services/cloud-foundry-space.service';
import { CloudFoundrySpaceRoutesComponent } from './cloud-foundry-space-routes.component';

describe('CloudFoundrySpaceRoutesComponent', () => {
  let component: CloudFoundrySpaceRoutesComponent;
  let fixture: ComponentFixture<CloudFoundrySpaceRoutesComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CloudFoundrySpaceRoutesComponent],
      imports: generateCfBaseTestModules(),
      providers: [
        DatePipe,
        { provide: CloudFoundrySpaceService, useClass: CloudFoundrySpaceServiceMock }
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudFoundrySpaceRoutesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
