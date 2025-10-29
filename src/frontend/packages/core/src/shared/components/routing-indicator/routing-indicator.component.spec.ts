import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { RoutingIndicatorComponent } from './routing-indicator.component';
import { CoreModule } from '../../../core/core.module';
import { ProgressBarComponent } from '../progress-bar/progress-bar.component';
import { RouterTestingModule } from '@angular/router/testing';

describe('RoutingIndicatorComponent', () => {
  let component: RoutingIndicatorComponent;
  let fixture: ComponentFixture<RoutingIndicatorComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        RoutingIndicatorComponent,
        RouterTestingModule,
        CoreModule,
        ProgressBarComponent
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RoutingIndicatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
