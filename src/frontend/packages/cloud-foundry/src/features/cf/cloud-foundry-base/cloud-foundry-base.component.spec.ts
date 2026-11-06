import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { RouterTestingModule } from '@angular/router/testing';

import { CloudFoundryEndpointService } from '../services/cloud-foundry-endpoint.service';
import { CloudFoundryBaseComponent } from './cloud-foundry-base.component';

describe('CloudFoundryBaseComponent', () => {
  let component: CloudFoundryBaseComponent;
  let fixture: ComponentFixture<CloudFoundryBaseComponent>;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CloudFoundryBaseComponent,
        RouterTestingModule,
      ],
      providers: [
        CloudFoundryEndpointService,
        provideZonelessChangeDetection(),
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudFoundryBaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
