import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, CUSTOM_ELEMENTS_SCHEMA, signal } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  MetadataItemComponent,
  CardWrapperComponent,
  CardHeaderComponent,
  CardTitleComponent,
  CardContentComponent
} from '@stratosui/core';
import { CardCfUserInfoComponent } from './card-cf-user-info.component';
import { CloudFoundryEndpointService } from '../../../../features/cf/services/cloud-foundry-endpoint.service';

describe('CardCfUserInfoComponent', () => {
  let component: CardCfUserInfoComponent;
  let fixture: ComponentFixture<CardCfUserInfoComponent>;

  // Mock CloudFoundryEndpointService — template reads sync via endpoint() signal.
  const mockCfEndpointService = {
    endpoint: signal({
      entity: {
        user: {
          name: 'test-user',
          admin: false
        }
      }
    })
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CardCfUserInfoComponent,
        MetadataItemComponent,
        CardWrapperComponent,
        CardHeaderComponent,
        CardTitleComponent,
        CardContentComponent
      ],
      providers: [
        provideZonelessChangeDetection(),
        { provide: CloudFoundryEndpointService, useValue: mockCfEndpointService }
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CardCfUserInfoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
