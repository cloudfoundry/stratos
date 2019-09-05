import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import {
  PercentagePipe
} from '@stratos/shared';

import { UsageGaugeComponent } from './usage-gauge.component';
import { CoreModule } from '../../../core/core.module';
import { UtilsService } from '../../../core/utils.service';

describe('UsageGaugeComponent', () => {
  let component: UsageGaugeComponent;
  let fixture: ComponentFixture<UsageGaugeComponent>;

  beforeEach(async(() => {
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
