import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { PanelComponent } from '../../panel/panel.component';
import { ChartDetailsVersionsComponent } from './chart-details-versions.component';

/* tslint:disable:no-unused-variable */
describe('ChartDetailsVersionsComponent', () => {
  let component: ChartDetailsVersionsComponent;
  let fixture: ComponentFixture<ChartDetailsVersionsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ChartDetailsVersionsComponent, PanelComponent],
      imports: [RouterTestingModule]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChartDetailsVersionsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
