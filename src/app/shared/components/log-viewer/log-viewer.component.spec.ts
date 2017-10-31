import { Observable, Subject } from 'rxjs/Rx';
import { MDAppModule } from '../../../core/md.module';
import { RouterTestingModule } from '@angular/router/testing';
import { CommonModule } from '@angular/common';
import { CoreModule } from '../../../core/core.module';
import { it } from '@angular/cli/lib/ast-tools/spec-utils';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LogViewerComponent } from './log-viewer.component';
import { Component, ViewChild } from '@angular/core';

fdescribe('LogViewerComponent', () => {
  let component: TestHostComponent;
  let fixture: ComponentFixture<TestHostComponent>;
  let stream: Subject<String>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [LogViewerComponent,
        TestHostComponent
      ],
      imports: [
        MDAppModule,
        RouterTestingModule,
        CommonModule,
        CoreModule
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TestHostComponent);
    component = fixture.componentInstance;
    stream = new Subject();
    component.logViewer.logStream = stream;
    fixture.detectChanges();
  });

  it('should be created', () => {
    component.logViewer.logStream = Observable.from('jhgjgh');
    expect(component).toBeTruthy();
  });

  it('should add logline from observable', (done) => {
    expect(component.logViewer.content.nativeElement.children.length).toEqual(0);
    stream.next('Log');
    fixture.detectChanges();
    expect(component.logViewer.content.nativeElement.children.length).toEqual(1);
  });
  @Component({
    selector: `app-host-component`,
    template: `<app-log-viewer></app-log-viewer>`
  })
  class TestHostComponent {
    @ViewChild(LogViewerComponent)
    public logViewer: LogViewerComponent;
  }
});
