import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { UsageGaugeComponent } from './usage-gauge.component';
import { PercentagePipe } from '../../pipes/percentage.pipe';
import { CoreModule } from '../../../core/core.module';
import { UtilsService } from '../../../core/utils.service';

describe('UsageGaugeComponent', () => {
  let component: UsageGaugeComponent;
  let fixture: ComponentFixture<UsageGaugeComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        UsageGaugeComponent,
        PercentagePipe,
      ],
      imports: [
        CoreModule,
      ],
      providers: [
        UtilsService,
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UsageGaugeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
