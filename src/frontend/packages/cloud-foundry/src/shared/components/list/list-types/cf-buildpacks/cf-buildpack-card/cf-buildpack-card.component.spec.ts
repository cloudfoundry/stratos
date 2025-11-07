import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';

import {
  BooleanIndicatorComponent,
} from '../../../../../../../../core/src/shared/components/boolean-indicator/boolean-indicator.component';
import { EntityMonitorFactory } from '@stratosui/store/monitors/entity-monitor.factory.service';
import { MetadataCardTestComponents } from '../../../../../../../../core/test-framework/core-test.helper';
import {
  generateCfBaseTestModulesNoShared,
} from "@test-framework/cloud-foundry-endpoint-service.helper";
import { CfBuildpackCardComponent } from './cf-buildpack-card.component';
import { EntityServiceFactory } from "@stratosui/store/entity-service-factory.service";
describe('CfBuildpackCardComponent', () => {
  let component: CfBuildpackCardComponent;
  let fixture: ComponentFixture<CfBuildpackCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [
        MetadataCardTestComponents,
    ],
      imports: [
        CfBuildpackCardComponent,
        ...generateCfBaseTestModulesNoShared(),
        BooleanIndicatorComponent,
      ],
      providers: [
        EntityServiceFactory,
        
        EntityMonitorFactory,

        provideZonelessChangeDetection(),
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(CfBuildpackCardComponent);
    component = fixture.componentInstance;
    component.row = {
      entity: {
        name: '',
        position: 1,
        enabled: true,
        locked: true,
        filename: ''
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
