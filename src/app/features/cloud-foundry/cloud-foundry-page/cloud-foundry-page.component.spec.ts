import { RouterTestingModule } from '@angular/router/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { StoreModule } from '@ngrx/store';
import { appReducers } from '../../../store/reducers.module';
import { CoreModule } from '../../../core/core.module';
import { SharedModule } from '../../../shared/shared.module';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CloudFoundryPageComponent } from './cloud-foundry-page.component';
import { CommonModule } from '@angular/common';

describe('CloudFoundryPageComponent', () => {
  let component: CloudFoundryPageComponent;
  let fixture: ComponentFixture<CloudFoundryPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        CommonModule,
        CoreModule,
        SharedModule,
        RouterTestingModule,
        BrowserAnimationsModule,
        StoreModule.forRoot(
          appReducers
        )
      ],
      declarations: [CloudFoundryPageComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudFoundryPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
