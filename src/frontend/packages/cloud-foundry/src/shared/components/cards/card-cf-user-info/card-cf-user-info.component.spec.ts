import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of } from 'rxjs';
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

  // Mock CloudFoundryEndpointService
  const mockCfEndpointService = {
    endpoint$: of({
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
