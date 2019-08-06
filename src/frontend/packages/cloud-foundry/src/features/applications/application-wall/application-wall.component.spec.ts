import { DatePipe } from '@angular/common';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';

import { CoreModule } from '../../../../../core/src/core/core.module';
import { SharedModule } from '../../../../../core/src/shared/shared.module';
import { TabNavService } from '../../../../../core/tab-nav.service';
import { createBasicStoreModule } from '../../../../../core/test-framework/store-test-helper';
import { ApplicationWallComponent } from './application-wall.component';

describe('ApplicationWallComponent', () => {
  let component: ApplicationWallComponent;
  let fixture: ComponentFixture<ApplicationWallComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ApplicationWallComponent],
      imports: [
        BrowserAnimationsModule,
        createBasicStoreModule(),
        CoreModule,
        SharedModule,
        RouterTestingModule,
      ],
      providers: [
        DatePipe,
        TabNavService
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ApplicationWallComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
