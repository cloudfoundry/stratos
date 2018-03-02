import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CfBuildpackCardComponent } from './cf-buildpack-card.component';

describe('CfBuildpackCardComponent', () => {
  let component: CfBuildpackCardComponent;
  let fixture: ComponentFixture<CfBuildpackCardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CfBuildpackCardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CfBuildpackCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
