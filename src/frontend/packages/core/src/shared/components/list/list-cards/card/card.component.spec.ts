import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { MDAppModule } from '@stratosui/core';
import { EntityInfo } from '@stratosui/store';
import { createBasicStoreModule } from '@test-framework/core-test.helper';
import { CoreTestingModule } from '@test-framework/core-test.modules';
import { CardComponent } from './card.component';

describe('CardComponent', () => {
  let component: CardComponent<EntityInfo>;
  let fixture: ComponentFixture<CardComponent<EntityInfo>>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        MDAppModule,
        CoreTestingModule,
        NoopAnimationsModule,
        createBasicStoreModule(),
        CardComponent,
      ],
      providers: [
        provideZonelessChangeDetection(),
      ]
    });
      TestBed.compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent<CardComponent<EntityInfo>>(CardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
