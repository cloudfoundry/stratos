import { CommonModule } from '@angular/common';
import { Component, ViewChild } from '@angular/core';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { from as observableFrom, Subject } from 'rxjs';
import { filter, first } from 'rxjs/operators';

import { CoreModule } from '../../../core/core.module';
import { MDAppModule } from '../../../core/md.module';
import { LogViewerComponent } from './log-viewer.component';

describe('LogViewerComponent', () => {
  @Component({
    selector: `app-host-component`,
    template: `<app-log-viewer></app-log-viewer>`
  })
  class TestHostComponent {
    @ViewChild(LogViewerComponent, { static: true })
    public logViewer: LogViewerComponent;
  }

  let component: TestHostComponent;
  let fixture: ComponentFixture<TestHostComponent>;
  let stream: Subject<string>;
  let contentEl: HTMLDivElement;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        TestHostComponent,
        LogViewerComponent
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
    component.logViewer.logStream = observableFrom('jhgjgh');
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
    }, 50);
  });

  it('should only allow max rows', (done) => {
    expect(contentEl.children.length).toEqual(0);

    component.logViewer.isHighThroughput$.pipe(first()).subscribe(high => {
      expect(high).toEqual(false);
    });

    component.logViewer.maxLogLines = 5;

    const maxLines = component.logViewer.maxLogLines + 1;
    let i = 0;

    while (i < maxLines) {
      ++i;
      setTimeout(() => {
        stream.next('Log');
      }, 300 * i);
    }

    setTimeout(() => {
      fixture.detectChanges();
      expect(contentEl.children.length).toEqual(component.logViewer.maxLogLines);
      done();
    }, (maxLines * 300) + 10);
  });

  it('should be in high throughput mode', (done) => {
    expect(contentEl.children.length).toEqual(0);

    component.logViewer.isHighThroughput$.pipe(first()).subscribe(high => {
      expect(high).toEqual(false);
    });

    let i = 1;
    while (i < 200) {
      ++i;
      setTimeout(() => {
        stream.next('Log');
      }, 50 * i);
    }

    component.logViewer.isHighThroughput$.pipe(filter(high => high)).subscribe(high => {
      expect(high).toEqual(true);
      done();
    });
  });

});
