import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { MDAppModule } from '../../../../core/md.module';
import { ApplicationStateIconComponent } from './application-state-icon.component';
import { ApplicationStateIconPipe } from './application-state-icon.pipe';

describe('ApplicationStateIconComponent', () => {
  let component: ApplicationStateIconComponent;
  let fixture: ComponentFixture<ApplicationStateIconComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        ApplicationStateIconComponent, ApplicationStateIconPipe
      ],
      imports: [
        MDAppModule
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ApplicationStateIconComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
