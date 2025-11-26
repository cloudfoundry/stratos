import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { provideZonelessChangeDetection } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { UtilsService } from '@stratosui/core';
import { CloudFoundryFirehoseComponent } from './cloud-foundry-firehose.component';
import { CloudFoundryEndpointService } from '../../services/cloud-foundry-endpoint.service';

describe('CloudFoundryFirehoseComponent', () => {
  let component: CloudFoundryFirehoseComponent;
  let fixture: ComponentFixture<CloudFoundryFirehoseComponent>;

  beforeEach(async () => {
    const mockCfEndpointService = {
      cfGuid: 'mock-guid'
    };

    const mockUtilsService = {
      bytesToHumanSize: vi.fn((bytes) => bytes + 'B'),
      formatUptime: vi.fn((seconds) => seconds + 's')
    };

    await TestBed.configureTestingModule({
      imports: [
        CloudFoundryFirehoseComponent,
      ],
      providers: [
        provideZonelessChangeDetection(),
        { provide: CloudFoundryEndpointService, useValue: mockCfEndpointService },
        { provide: UtilsService, useValue: mockUtilsService },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudFoundryFirehoseComponent);
    component = fixture.componentInstance;
    // fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
