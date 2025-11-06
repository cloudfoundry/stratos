import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { BrowserAnimationsModule, NoopAnimationsModule } from '@angular/platform-browser/animations';
import { createBasicStoreModule } from "../test-framework/core-test.helper";
import { of } from 'rxjs';

import { EntitySchema } from '../../../../../store/src/helpers/entity-schema';
import { EntityMonitorFactory } from '../../../../../store/src/monitors/entity-monitor.factory.service';
import { CoreTestingModule } from '../../../../test-framework/core-test.modules';
import { MDAppModule } from '../../../core/md.module';
import { SharedModule } from '../../shared.module';
import { LoadingPageComponent } from './loading-page.component';

class EntityMonitorFactoryMock {
  monitor = {
    isDeletingEntity$: of(false),
    isFetchingEntity$: of(false),
  };

  create() {
    return this.monitor;
  }
}

describe('LoadingPageComponent', () => {
  let component: LoadingPageComponent;
  let fixture: ComponentFixture<LoadingPageComponent>;
  let element: HTMLElement;
  let entityFactory: EntityMonitorFactoryMock;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        MDAppModule,
        SharedModule,
        CoreTestingModule,
        BrowserAnimationsModule,
        NoopAnimationsModule,
        createBasicStoreModule(),
        LoadingPageComponent
      ],
      providers: [
        { provide: EntityMonitorFactory, useClass: EntityMonitorFactoryMock }
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(LoadingPageComponent);
    entityFactory = TestBed.inject(EntityMonitorFactory) as any as EntityMonitorFactoryMock;
    component = fixture.componentInstance;
    fixture.detectChanges();
    element = fixture.nativeElement;
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('should show custom message', () => {
    component.isLoading = of(true);
    component.text = 'Custom message';
    component.ngOnInit();
    fixture.detectChanges();

    expect(element.textContent).toContain('Custom message');
  });

  describe('when deleting', () => {
    beforeEach(() => {
      component.isLoading = null;
      component.entityId = 'id';
      component.entitySchema = new EntitySchema('schema', 'endpoint');
      entityFactory.monitor.isDeletingEntity$ = of(true);
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should show default message', () => {
      expect(element.textContent).toContain(component.deleteText);
    });

    it('should show progress bar until is done', () => {
      const progressBar = element.querySelector('mat-progress-bar');
      expect(progressBar).toBeTruthy();
    });

    it('should hide progress bar when is done', async () => {
      vi.useFakeTimers();
      let progressBar = element.querySelector('mat-progress-bar');
      expect(progressBar).toBeTruthy();

      component.isDeleting = of(false);
      fixture.detectChanges();

      await vi.advanceTimersByTimeAsync(250);

      progressBar = element.querySelector('mat-progress-bar');
      expect(progressBar).toBeFalsy();
      vi.useRealTimers();
    });
  });

  describe('when loading', () => {
    beforeEach(() => {
      component.isLoading = of(true);
      component.ngOnInit();
      fixture.detectChanges();
    });

    it('should show default message', () => {
      expect(element.textContent).toContain(component.text);
    });

    it('should show progress bar until is done', () => {
      const progressBar = element.querySelector('mat-progress-bar');
      expect(progressBar).toBeTruthy();
    });

    it('should hide progress bar when is done', async () => {
      vi.useFakeTimers();
      let progressBar = element.querySelector('mat-progress-bar');
      expect(progressBar).toBeTruthy();

      component.isLoading = of(false);
      fixture.detectChanges();

      await vi.advanceTimersByTimeAsync(250);

      progressBar = element.querySelector('mat-progress-bar');
      expect(progressBar).toBeFalsy();
      vi.useRealTimers();
    });
  });
});
