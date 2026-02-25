import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { describe, it, expect, beforeEach } from 'vitest';

import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { ActiveRouteCfOrgSpace, BaseCfOrgSpaceRouteMock } from '@test-framework/cf';

import { CloudFoundryEndpointService } from '../../../../../../features/cf/services/cloud-foundry-endpoint.service';
import { CfSecurityGroupsCardComponent } from './cf-security-groups-card.component';

describe.skip('CfSecurityGroupsCardComponent', () => {
  let component: CfSecurityGroupsCardComponent;
  let fixture: ComponentFixture<CfSecurityGroupsCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CfSecurityGroupsCardComponent,
      ],
      providers: [
        ...STORE_TEST_PROVIDERS,
        provideRouter([]),
        provideHttpClient(),
        {
          provide: ActiveRouteCfOrgSpace,
          useValue: new BaseCfOrgSpaceRouteMock()
        },
        {
          provide: CloudFoundryEndpointService,
          useValue: {
            cfGuid: 'test-guid'
          }
        },
        provideZonelessChangeDetection(),
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(CfSecurityGroupsCardComponent);
    component = fixture.componentInstance;
    component.row = {
      entity: {
        name: '',
        rules: [],
        running_default: false,
        staging_default: false,
        spaces_url: '',
        spaces: [],
        staging_spaces_url: ''
      },
      metadata: {
        created_at: '',
        updated_at: '',
        guid: '',
        url: ''
      }
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
