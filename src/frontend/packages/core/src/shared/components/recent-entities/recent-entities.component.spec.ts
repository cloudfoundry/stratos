import { MDAppModule } from './../../../core/md.module';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RecentEntitiesComponent } from './recent-entities.component';
import { RouterTestingModule } from '@angular/router/testing';
import { CommonModule } from '@angular/common';
import { CoreModule } from '../../../core/core.module';
import { createBasicStoreModule } from '../../../test-framework/store-test-helper';

describe('RecentEntitiesComponent', () => {
  let component: RecentEntitiesComponent;
  let fixture: ComponentFixture<RecentEntitiesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [RouterTestingModule, CoreModule, CommonModule, createBasicStoreModule()]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RecentEntitiesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
