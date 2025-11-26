import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

import { TokenEndpointComponent } from './token-endpoint.component';

describe('TokenEndpointComponent', () => {
  let component: TokenEndpointComponent;
  let fixture: ComponentFixture<TokenEndpointComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
      imports: [
        TokenEndpointComponent,
        ReactiveFormsModule,
      ],

    });
    TestBed.compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TokenEndpointComponent);
    component = fixture.componentInstance;

    // Provide FormGroup instance for component with correct structure
    component.formGroup = new FormGroup({
      authValues: new FormGroup({
        token: new FormControl(''),
      }),
    }) as any;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
