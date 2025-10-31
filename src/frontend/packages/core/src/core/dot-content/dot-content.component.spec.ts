import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { DotContentComponent } from './dot-content.component';

describe('DotContentComponent', () => {
  let component: DotContentComponent;
  let fixture: ComponentFixture<DotContentComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        DotContentComponent
      ],
      
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DotContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
