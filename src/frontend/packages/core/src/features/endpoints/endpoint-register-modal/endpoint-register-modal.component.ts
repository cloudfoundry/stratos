import { CommonModule, AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component,
  type ComponentFactory,
  ComponentFactoryResolver,
  type ComponentRef,
  EventEmitter,
  Injector,
  type OnDestroy,
  type OnInit,
  Output,
  type Type,
  ViewChild,
  ViewContainerRef,
 } from '@angular/core';
import { ActivatedRoute, type ActivatedRouteSnapshot, type Params } from '@angular/router';
import { Store } from '@ngrx/store';
import { of, type Observable } from 'rxjs';
import {
  type GeneralEntityAppState,
  entityCatalog,
  selectSessionData,
  type StratosCatalogEndpointEntity,
} from '@stratosui/store';
import { map } from 'rxjs/operators';

import type { ITileConfig } from '../../../shared/components/tile/tile-selector.types';
import { BaseEndpointTileManager, type ICreateEndpointTilesData } from '../create-endpoint/create-endpoint-base-step/base-endpoint-tile-manager';
import { TileSelectorComponent } from '../../../shared/components/tile-selector/tile-selector.component';

@Component({
  selector: 'app-endpoint-register-modal',
  templateUrl: './endpoint-register-modal.component.html',
  styleUrls: ['./endpoint-register-modal.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    TileSelectorComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EndpointRegisterModalComponent extends BaseEndpointTileManager implements OnInit, OnDestroy {
  @Output() closeModalEvent = new EventEmitter<void>();
  @Output() endpointRegistered = new EventEmitter<unknown>();

  @ViewChild('endpointFormContainer', { read: ViewContainerRef, static: false }) 
  endpointFormContainer: ViewContainerRef;

  selectedEndpointInfo: ITileConfig<ICreateEndpointTilesData> | null = null;
  componentRef: ComponentRef<unknown>;

  constructor(
    protected store: Store<GeneralEntityAppState>,
    private resolver: ComponentFactoryResolver,
    private injector: Injector,
  ) {
    const types = store.select(selectSessionData()).pipe(
      // Get a list of all known endpoint types
      map(sessionData => entityCatalog.getAllEndpointTypes(sessionData.config.enableTechPreview || false))
    ) as Observable<StratosCatalogEndpointEntity[]>;
    super(types, store);
    
    // Add escape key listener
    document.addEventListener('keydown', this.handleEscapeKey.bind(this));
  }

  ngOnInit() {
    // BaseEndpointTileManager will handle setting up the tile selector config
  }

  ngOnDestroy() {
    document.removeEventListener('keydown', this.handleEscapeKey.bind(this));
    
    if (this.componentRef) {
      this.componentRef.destroy();
    }
  }

  private handleEscapeKey(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      this.closeModal();
    }
  }

  onTileSelected(tile: ITileConfig<ICreateEndpointTilesData>) {
    if (tile) {
      console.log('Tile selected:', tile);
      this.selectedEndpointInfo = tile;
      
      // Load the endpoint registration component in the modal instead of navigating
      setTimeout(() => {
        this.loadEndpointRegistrationComponent(tile);
      }, 100);
    }
  }

  private loadEndpointRegistrationComponent(tile: ITileConfig<ICreateEndpointTilesData>) {
    if (!this.endpointFormContainer) {
      console.error('endpointFormContainer not available');
      return;
    }

    // Clear previous component
    this.endpointFormContainer.clear();
    if (this.componentRef) {
      this.componentRef.destroy();
    }

    const epType = tile.data.parentType || tile.data.type;
    const epSubType = tile.data.parentType ? tile.data.type : '';
    
    console.log('Loading endpoint registration for:', { epType, epSubType });

    // Get the endpoint definition
    const endpoint = entityCatalog.getEndpoint(epType, epSubType);
    console.log('Found endpoint definition:', endpoint);

    if (endpoint?.definition.registrationComponent) {
      try {
        // Create mock route parameters like the original create-endpoint component
        const mockParams: Params = {
          type: epType,
          subtype: epSubType
        };

        const mockQueryParams = {}; // Add any needed query params here

        const mockActivatedRoute = {
          snapshot: {
            params: mockParams,
            paramMap: {
              get: (key: string) => mockParams[key]
            },
            queryParams: mockQueryParams
          } as ActivatedRouteSnapshot,
          params: of(mockParams),
          paramMap: of({
            get: (key: string) => mockParams[key]
          }),
          queryParams: of(mockQueryParams)
        } as unknown as ActivatedRoute;

        // Create a custom injector that provides the mock ActivatedRoute
        const componentInjector = Injector.create({
          providers: [
            { provide: ActivatedRoute, useValue: mockActivatedRoute }
          ],
          parent: this.injector
        });

        const factory: ComponentFactory<unknown> = this.resolver.resolveComponentFactory(
          endpoint.definition.registrationComponent as Type<unknown>
        );
        
        // Create the component with the custom injector
        this.componentRef = this.endpointFormContainer.createComponent(factory, 0, componentInjector);

        console.log('Registration component created successfully:', this.componentRef);

        // Hook into the component's registration success
        this.hookIntoComponentSuccess();

      } catch (error) {
        console.error('Error creating endpoint registration component:', error);
        
        // Fallback: try to load the create-endpoint component
        this.loadCreateEndpointComponent(epType, epSubType);
      }
    } else {
      // Fallback: load the create-endpoint component for endpoints without custom registration
      console.log('No custom registration component, loading create-endpoint component');
      this.loadCreateEndpointComponent(epType, epSubType);
    }
  }

  private loadCreateEndpointComponent(epType: string, epSubType: string) {
    try {
      // Import and load the create-endpoint component
      import('../create-endpoint/create-endpoint.component').then(module => {
        const factory = this.resolver.resolveComponentFactory(module.CreateEndpointComponent);
        
        // Create mock route parameters
        const mockParams: Params = {
          type: epType,
          subtype: epSubType
        };

        const mockQueryParams = {}; // Add any needed query params here

        const mockActivatedRoute = {
          snapshot: {
            params: mockParams,
            paramMap: {
              get: (key: string) => mockParams[key]
            },
            queryParams: mockQueryParams
          } as ActivatedRouteSnapshot,
          params: of(mockParams),
          paramMap: of({
            get: (key: string) => mockParams[key]
          }),
          queryParams: of(mockQueryParams)
        } as unknown as ActivatedRoute;

        const componentInjector = Injector.create({
          providers: [
            { provide: ActivatedRoute, useValue: mockActivatedRoute }
          ],
          parent: this.injector
        });

        this.componentRef = this.endpointFormContainer.createComponent(factory, 0, componentInjector);
        console.log('Create-endpoint component loaded:', this.componentRef);
        
        this.hookIntoComponentSuccess();
      });
    } catch (error) {
      console.error('Error loading create-endpoint component:', error);
    }
  }

  private hookIntoComponentSuccess() {
    // Try to hook into various success patterns
    if (this.componentRef?.instance) {
      const instance = this.componentRef.instance as Record<string, unknown>;

      // Check for onNext method (stepper pattern)
      if (typeof instance['onNext'] === 'function') {
        const originalOnNext = (instance['onNext'] as () => unknown).bind(instance);
        instance['onNext'] = () => {
          const result = originalOnNext();
          this.handleRegistrationResult(result);
          return result;
        };
      }

      // Check for success events
      const success = instance['success'];
      if (success && typeof (success as { subscribe?: unknown })['subscribe'] === 'function') {
        (success as { subscribe: (callback: () => void) => void }).subscribe(() => {
          this.onEndpointRegistered();
        });
      }

      // Check for registration complete events
      const registrationComplete = instance['registrationComplete'];
      if (registrationComplete && typeof (registrationComplete as { subscribe?: unknown })['subscribe'] === 'function') {
        (registrationComplete as { subscribe: (callback: () => void) => void }).subscribe(() => {
          this.onEndpointRegistered();
        });
      }
    }
  }

  private handleRegistrationResult(result: unknown) {
    if (result && typeof (result as { subscribe?: unknown })['subscribe'] === 'function') {
      // Handle observable result
      (result as { subscribe: (callback: (response: unknown) => void) => void }).subscribe((response: unknown) => {
        console.log('Registration response:', response);
        if (response && (response as { success?: boolean })['success']) {
          this.onEndpointRegistered();
        }
      });
    } else if (result && typeof (result as { then?: unknown })['then'] === 'function') {
      // Handle promise result
      (result as { then: (callback: (success: boolean) => void) => void }).then((success: boolean) => {
        console.log('Registration result:', success);
        if (success) {
          this.onEndpointRegistered();
        }
      });
    }
  }

  goBackToSelection() {
    this.selectedEndpointInfo = null;
    
    // Clear the form component
    if (this.endpointFormContainer) {
      this.endpointFormContainer.clear();
    }
    if (this.componentRef) {
      this.componentRef.destroy();
      this.componentRef = null;
    }
  }

  closeModal() {
    this.closeModalEvent.emit();
  }

  private onEndpointRegistered() {
    console.log('Modal: onEndpointRegistered called - emitting event');
    this.endpointRegistered.emit();
    // Small delay to show success before closing
    setTimeout(() => {
      this.closeModal();
    }, 1000);
  }
}