import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { PageNotFoundComponentComponent } from './page-not-found-component.component';
import { CoreModule } from '../core.module';
import { SharedModule } from '../../shared/shared.module';

describe('PageNotFoundComponentComponent', () => {
  let component: PageNotFoundComponentComponent;
  let fixture: ComponentFixture<PageNotFoundComponentComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({

      providers: [provideZonelessChangeDetection()],

      imports: [
        PageNotFoundComponentComponent,
      ]

    });
    TestBed.compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PageNotFoundComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
