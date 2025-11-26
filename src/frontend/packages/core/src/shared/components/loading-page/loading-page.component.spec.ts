import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach } from 'vitest';
import { BehaviorSubject } from 'rxjs';
import { EntityMonitorFactory, EntitySchema, EntityServiceFactory } from '@stratosui/store';
import { createBasicStoreModule } from '@test-framework/core-test.helper';
import { CoreTestingModule } from '@test-framework/core-test.modules';
import { MDAppModule } from '../../../core/md.module';
import { LoadingPageComponent } from './loading-page.component';

class EntityMonitorFactoryMock {
  isDeletingSubject = new BehaviorSubject(false);
  isFetchingSubject = new BehaviorSubject(false);

  monitor = {
    isDeletingEntity$: this.isDeletingSubject,
    isFetchingEntity$: this.isFetchingSubject,
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
        CoreTestingModule,
        NoopAnimationsModule,
        createBasicStoreModule(),
        LoadingPageComponent,
      ],
      providers: [
        EntityServiceFactory,
        { provide: EntityMonitorFactory, useClass: EntityMonitorFactoryMock },
        provideZonelessChangeDetection(),
      ]
    })
      .compileComponents();
  });

  beforeEach(async () => {
    fixture = TestBed.createComponent(LoadingPageComponent);
    entityFactory = TestBed.inject(EntityMonitorFactory) as unknown as EntityMonitorFactoryMock;
    component = fixture.componentInstance;
    element = fixture.nativeElement;
  });

  describe('when deleting', () => {
    beforeEach(async () => {
      // Reset and then set the mock values BEFORE creating component
      entityFactory.isDeletingSubject.next(false);
      entityFactory.isFetchingSubject.next(false);

      // Now set to the values we want for this test
      entityFactory.isDeletingSubject.next(true);
      entityFactory.isFetchingSubject.next(false);

      // Create component with inputs set via TestBed to ensure they're available during ngOnInit
      fixture = TestBed.createComponent(LoadingPageComponent);
      component = fixture.componentInstance;
      element = fixture.nativeElement;

      // Set up component inputs BEFORE first change detection
      component.entityId = 'id';
      component.entitySchema = new EntitySchema('schema', 'endpoint');

      // Let Angular call ngOnInit via detectChanges - don't call it manually
      // Multiple change detection cycles for async pipes and OnPush
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
    });

    it('should show default message', () => {
      expect(element.textContent).toContain(component.deleteText);
    });

    it('should show progress bar until is done', () => {
      const progressBar = element.querySelector('.loading-page__progress-bar');
      expect(progressBar).toBeTruthy();
    });

    it('should hide progress bar when is done', async () => {
      let progressBar = element.querySelector('.loading-page__progress-bar');
      expect(progressBar).toBeTruthy();

      // Update the observables to emit false
      entityFactory.isDeletingSubject.next(false);
      entityFactory.isFetchingSubject.next(false);

      // Wait for async pipes to process
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      progressBar = element.querySelector('.loading-page__progress-bar');
      expect(progressBar).toBeFalsy();
    });
  });

  describe('when loading', () => {
    let loadingSubject: BehaviorSubject<boolean>;

    beforeEach(async () => {
      // Create a fresh component for this test suite to avoid state contamination
      fixture = TestBed.createComponent(LoadingPageComponent);
      component = fixture.componentInstance;
      element = fixture.nativeElement;

      loadingSubject = new BehaviorSubject<boolean>(true);
      component.isLoading = loadingSubject.asObservable();
      component.ngOnInit();

      // Multiple change detection cycles for async pipes and OnPush
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
    });

    it('should show default message', () => {
      expect(element.textContent).toContain(component.text);
    });

    it('should show progress bar until is done', () => {
      const progressBar = element.querySelector('.loading-page__progress-bar');
      expect(progressBar).toBeTruthy();
    });

    it('should hide progress bar when is done', async () => {
      let progressBar = element.querySelector('.loading-page__progress-bar');
      expect(progressBar).toBeTruthy();

      // Update loading to false
      loadingSubject.next(false);

      // Wait for async pipes to process
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      progressBar = element.querySelector('.loading-page__progress-bar');
      expect(progressBar).toBeFalsy();
    });
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
