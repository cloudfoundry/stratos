import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { EditableDisplayValueComponent } from './editable-display-value.component';

describe('EditableDisplayValueComponent', () => {
  let component: EditableDisplayValueComponent;
  let fixture: ComponentFixture<EditableDisplayValueComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        EditableDisplayValueComponent
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditableDisplayValueComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
