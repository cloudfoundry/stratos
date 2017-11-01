import { Observable, Subject } from 'rxjs/Rx';
import { MDAppModule } from '../../../core/md.module';
import { RouterTestingModule } from '@angular/router/testing';
import { CommonModule } from '@angular/common';
import { CoreModule } from '../../../core/core.module';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LogViewerComponent } from './log-viewer.component';
import { Component, ViewChild } from '@angular/core';

fdescribe('LogViewerComponent', () => {
  let component: TestHostComponent;
  let fixture: ComponentFixture<TestHostComponent>;
  let stream: Subject<String>;
  let contentEl: HTMLDivElement;

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
    contentEl = component.logViewer.content.nativeElement as HTMLDivElement;
    stream = new Subject();
    component.logViewer.logStream = stream;
    fixture.detectChanges();
  });

  it('should be created', () => {
    component.logViewer.logStream = Observable.from('jhgjgh');
    expect(component).toBeTruthy();
  });

  it('should add logline from observable', (done) => {
    const logText = 'Log';
    expect(contentEl.children.length).toEqual(0);
    stream.next('Log');
    fixture.detectChanges();
    setTimeout(() => {
      expect(contentEl.children.length).toEqual(1);
      expect(contentEl.children[0].children[0].innerHTML).toEqual(logText);
      done();
    });
  });

  it('should be in high throughput mode', (done) => {
    expect(contentEl.children.length).toEqual(0);
    let log = true;

    component.logViewer.isHighThroughput$.take(1).subscribe(high => {
      expect(high).toEqual(false);
    });

    while (log) {
      setTimeout(() => {
        stream.next('Log');
      }, 100);
    }

    setTimeout(() => {
      fixture.detectChanges();
      log = false;
      component.logViewer.isHighThroughput$.take(1).subscribe(high => {
        expect(high).toEqual(true);
      });
      done();
    }, 5500);

  });

  it('should only allow max rows', (done) => {
    expect(contentEl.children.length).toEqual(0);

    component.logViewer.isHighThroughput$.take(1).subscribe(high => {
      expect(high).toEqual(false);
    });

    const maxLines = component.logViewer.maxLogLines + 100;
    let i = 0;

    while (i < maxLines) {
      stream.next('Log');
      ++i;
    }

    setTimeout(() => {
      fixture.detectChanges();
      expect(contentEl.children.length).toEqual(component.logViewer.maxLogLines);
      done();
    });

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
