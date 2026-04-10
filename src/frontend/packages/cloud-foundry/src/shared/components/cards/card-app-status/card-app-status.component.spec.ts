import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import {
  CoreModule,
  ApplicationStateIconComponent,
  ApplicationStateIconPipe,
  ApplicationStateComponent,
  CardStatusComponent,
} from '@stratosui/core';
import { ApplicationServiceMock } from "@test-framework/application-service-helper";
import { ApplicationService } from '@stratosui/cloud-foundry';
import { CardAppStatusComponent } from "./card-app-status.component";
describe('CardAppStatusComponent', () => {
  let component: CardAppStatusComponent;
  let fixture: ComponentFixture<CardAppStatusComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        CardAppStatusComponent,
        CardStatusComponent,
        ApplicationStateComponent,
        ApplicationStateIconComponent,
        ApplicationStateIconPipe,
        CoreModule,
      ],
      providers: [
        provideZonelessChangeDetection(),
      ]
    })
    .overrideProvider(ApplicationService, { useValue: new ApplicationServiceMock() })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CardAppStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
