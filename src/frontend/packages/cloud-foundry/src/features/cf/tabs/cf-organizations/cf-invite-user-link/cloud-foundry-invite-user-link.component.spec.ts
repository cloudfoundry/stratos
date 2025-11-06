import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import {
  generateCfBaseTestModules,
  generateTestCfEndpointServiceProvider,
} from '../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { CloudFoundryInviteUserLinkComponent } from './cloud-foundry-invite-user-link.component';

describe('CloudFoundryInviteUserLinkComponent', () => {
  let component: CloudFoundryInviteUserLinkComponent;
  let fixture: ComponentFixture<CloudFoundryInviteUserLinkComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [CloudFoundryInviteUserLinkComponent],
      imports: generateCfBaseTestModules(),
      providers: [
        ...generateTestCfEndpointServiceProvider()
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudFoundryInviteUserLinkComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
