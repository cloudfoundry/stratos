import { CdkTableModule } from '@angular/cdk/table';
import { Component } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of as observableOf } from 'rxjs';

import { CoreModule } from '../../../../../core/core.module';
import { TableRowExpandedService } from './table-row-expanded-service';
import { TableRowComponent } from './table-row.component';


describe('TableRowComponent', () => {

  @Component({
    selector: `app-host-component`,
    template: `
    <app-table-row [rowState]="rowState1"></app-table-row>
    <app-table-row [rowState]="rowState2"></app-table-row>
    `
  })
  class TestHostComponent {
    rowState1 = observableOf({
      error: true,
      blocked: true,
      message: 'Error message'
    });
    rowState2 = observableOf({
      error: false,
      blocked: false
    });
  }

  let component: TestHostComponent;
  let fixture: ComponentFixture<TestHostComponent>;

  const getElements = className => ([
    fixture.elementRef.nativeElement.getElementsByClassName(className)[0],
    fixture.elementRef.nativeElement.getElementsByClassName(className)[1]
  ]);
  const elementShown = (element: Element) => element && window.getComputedStyle(element).display !== 'none';


  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [TableRowComponent, TestHostComponent],
      imports: [
        CoreModule,
        CdkTableModule,
        NoopAnimationsModule,
      ],
      providers: [
        TableRowExpandedService
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TestHostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show error', async(() => {
    fixture.detectChanges();
    const [error1, error2] = getElements('table-row__error');
    const errorShown = elementShown(error1);
    const errorNotShown = !elementShown(error2);

    fixture.whenStable().then(() => {
      fixture.detectChanges();
      expect(errorNotShown).toBeTruthy();
      expect(errorShown).toBeTruthy();
    });
  }));
});
