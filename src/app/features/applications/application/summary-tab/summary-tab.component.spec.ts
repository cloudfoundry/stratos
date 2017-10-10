import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { CoreModule } from '../../../../core/core.module';
import { SharedModule } from '../../../../shared/shared.module';
import { AppStoreModule } from '../../../../store/store.module';
import { ApplicationService } from '../../application.service';
import { SummaryTabComponent } from './summary-tab.component';
import { ViewBuildpackComponent } from './view-buildpack/view-buildpack.component';

describe('SummaryTabComponent', () => {
  let component: SummaryTabComponent;
  let fixture: ComponentFixture<SummaryTabComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        SummaryTabComponent,
        ViewBuildpackComponent
      ],
      imports: [
        CoreModule,
        SharedModule,
        RouterTestingModule
      ],
      providers: [
        ApplicationService,
        AppStoreModule
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SummaryTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
