import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MDAppModule } from '../../../../core/md.module';
import { SteppersComponent } from './steppers.component';

describe('SteppersComponent', () => {
  let component: SteppersComponent;
  let fixture: ComponentFixture<SteppersComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [SteppersComponent],
      imports: [MDAppModule]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SteppersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
