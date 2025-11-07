import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';

import { EntityMonitorFactory } from '@stratosui/store/monitors/entity-monitor.factory.service';
import { MetadataCardTestComponents } from '../../../../../../../../core/test-framework/core-test.helper';
import {
  generateCfBaseTestModulesNoShared,
} from "@test-framework/cloud-foundry-endpoint-service.helper";
import { CfStacksCardComponent } from './cf-stacks-card.component';
import { EntityServiceFactory } from "@stratosui/store/entity-service-factory.service";
describe('CfStacksCardComponent', () => {
  let component: CfStacksCardComponent;
  let fixture: ComponentFixture<CfStacksCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CfStacksCardComponent,
        ...MetadataCardTestComponents,
        ...generateCfBaseTestModulesNoShared(),
      ],
      providers: [
        EntityServiceFactory,
        
        EntityMonitorFactory,

        provideZonelessChangeDetection(),
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CfStacksCardComponent);
    component = fixture.componentInstance;
    component.row = {
      entity: {
        name: '',
        description: ''
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
