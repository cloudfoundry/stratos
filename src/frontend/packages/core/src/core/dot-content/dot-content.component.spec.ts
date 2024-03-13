import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { DotContentComponent } from './dot-content.component';

describe('DotContentComponent', () => {
  let component: DotContentComponent;
  let fixture: ComponentFixture<DotContentComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [DotContentComponent]
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
