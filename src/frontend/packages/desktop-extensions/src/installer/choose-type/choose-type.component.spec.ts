import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { ChooseTypeComponent } from './choose-type.component';

describe('ChooseTypeComponent', () => {
  let component: ChooseTypeComponent;
  let fixture: ComponentFixture<ChooseTypeComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ ChooseTypeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChooseTypeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
