import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { DefaultEndpointHomeComponent } from './default-endpoint-home-component.component';

describe('DefaultEndpointHomeComponentComponent', () => {
  let component: DefaultEndpointHomeComponent;
  let fixture: ComponentFixture<DefaultEndpointHomeComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ DefaultEndpointHomeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DefaultEndpointHomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
