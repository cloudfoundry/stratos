
import { ChangeDetectionStrategy, Component, ComponentRef, EventEmitter, Input, OnDestroy, OnInit, Output, ViewChild, ViewContainerRef, inject } from '@angular/core';
import { ReactiveFormsModule, Validators, FormBuilder, FormControl, FormGroup, AbstractControl } from '@angular/forms';
import { CustomFormFieldComponent } from '../../../shared/components/custom-form-field/custom-form-field.component';
import { CustomCheckboxComponent } from '../../../shared/components/custom-checkbox/custom-checkbox.component';
import { CustomSelectComponent, CustomOptionComponent } from '../../../shared/components/custom-select/custom-select.component';
import { entityCatalog, EndpointAuthTypeConfig, IAuthForm, IEndpointAuthComponent } from '@stratosui/store';
import { Subscription } from 'rxjs';

import { BaseEndpointAuth } from '../../../core/endpoint-auth';
import { safeUnsubscribe } from '../../../core/utils.service';
import { ConnectEndpointConfig, ConnectEndpointData, ConnectEndpointService } from '../connect.service';

/**
 * Base interface for the endpoint form structure.
 * The authValues field will be typed dynamically based on the selected auth type.
 */
interface EndpointForm {
  authType: FormControl<string>;
  systemShared: FormControl<boolean>;
  [key: string]: AbstractControl<any>;
}

@Component({
  selector: 'app-connect-endpoint',
  templateUrl: './connect-endpoint.component.html',
  styleUrls: ['./connect-endpoint.component.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CustomFormFieldComponent,
    CustomSelectComponent,
    CustomOptionComponent,
    CustomCheckboxComponent
],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConnectEndpointComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);

  private pDisabled = false;
  private pConnectService!: ConnectEndpointService;
  @Input() set connectService(service: ConnectEndpointService) {
    if (!service || this.pConnectService) {
      return;
    }
    this.pConnectService = service;
    this.init(service.config);
  }
  get connectService(): ConnectEndpointService {
    return this.pConnectService;
  }

  @Input() set disabled(disabled: boolean) {
    if (this.endpointForm) {
      if (disabled) { this.endpointForm.disable(); } else { this.endpointForm.enable(); }
    }
    this.pDisabled = disabled;
  }

  /**
   * Make the form submit as if it had a button - aka on pressing return
   */
  @Input() formSubmit = false;

  @Output() valid = new EventEmitter<boolean>();
  @Output() authType = new EventEmitter<EndpointAuthTypeConfig>();

  // Component reference for the dynamically created auth form
  @ViewChild('authForm', { read: ViewContainerRef, static: true })
  public container!: ViewContainerRef;

  public endpointForm!: FormGroup<EndpointForm>;

  private bodyContent = '';

  public authTypesForEndpoint: EndpointAuthTypeConfig[] = [];
  public canShareEndpointToken = false;
  private cachedAuthTypeFormFields: string[] = [];

  // The auth type that was initially auto-selected
  private autoSelected!: EndpointAuthTypeConfig;
  private authFormComponentRef!: ComponentRef<IAuthForm>;

  private subs: Subscription[] = [];

  private init(config: ConnectEndpointConfig) {
    const endpoint = entityCatalog.getEndpoint(config.type, config.subType);
    // Populate the valid auth types for the endpoint that we want to connect to

    // Remove SSO if not allowed on this endpoint
    if (config.ssoAllowed) {
      this.authTypesForEndpoint = endpoint.definition.authTypes;
    } else {
      this.authTypesForEndpoint = endpoint.definition.authTypes.filter(authType => authType.value !== BaseEndpointAuth.SSO.value);
    }

    // Not all endpoint types might allow token sharing - typically types like metrics do
    this.canShareEndpointToken = endpoint.definition.tokenSharing;

    // Create the endpoint form
    this.autoSelected = (this.authTypesForEndpoint.length > 0) ? this.authTypesForEndpoint[0] : { form: null } as EndpointAuthTypeConfig;

    // Auto-select SSO if it is available
    const ssoIndex = this.authTypesForEndpoint.findIndex(authType => authType.value === 'sso' && config.ssoAllowed);
    if (ssoIndex >= 0) {
      this.autoSelected = this.authTypesForEndpoint[ssoIndex];
    }

    this.cachedAuthTypeFormFields = Object.keys(this.autoSelected.form || {});
    this.endpointForm = this.fb.group<EndpointForm>({
      authType: new FormControl(this.autoSelected.value || '', { nonNullable: true, validators: Validators.required }),
      systemShared: new FormControl(false, { nonNullable: true })
    });
    // Add authValues as a separate group to handle dynamic auth type switching
    this.endpointForm.addControl('authValues', this.fb.group(this.autoSelected.form || {}));
    this.authChanged();

    // Template container reference is not available at construction
    this.createComponent(this.autoSelected);

    this.subs.push(this.endpointForm.valueChanges.pipe().subscribe(res => {
      const authType = this.authTypesForEndpoint.find(ep => ep.value === res.authType);
      if (authType.component === this.authFormComponentRef.componentType) {
        this.setData();
      }
      // Always emit actual form validity, regardless of component state
      this.valid.next(this.endpointForm.valid);
    }));

    // Set initial valid status
    this.endpointForm.updateValueAndValidity();
    this.valid.next(this.endpointForm.valid);
  }

  ngOnInit() {
    if (!this.endpointForm) {
      // Ensure there's something for the html to bind to
      this.endpointForm = this.fb.group<EndpointForm>({
        authType: new FormControl('', { nonNullable: true }),
        systemShared: new FormControl(false, { nonNullable: true })
      });
    }
  }

  authChanged() {
    const authType = this.authTypesForEndpoint.find(ep => ep.value === this.endpointForm.value.authType);
    const authTypeFormFields = Object.keys(authType.form);
    if (!this.sameAuthTypeFormFields(this.cachedAuthTypeFormFields, authTypeFormFields)) {
      // Don't remove and re-add the same control, this helps with form validation
      this.cachedAuthTypeFormFields = authTypeFormFields;
      (this.endpointForm as any).removeControl('authValues');
      (this.endpointForm as any).addControl('authValues', this.fb.group(authType.form || {}));

      // Update the auth form component
      this.createComponent(authType);
    }
    this.bodyContent = '';
    this.authType.next(authType);
  }

  // Dynamically create the component for the selected auth type
  createComponent(authType: EndpointAuthTypeConfig) {
    if (!authType.component || !this.container) {
      return;
    }

    if (this.authFormComponentRef) {
      this.authFormComponentRef.destroy();
    }

    this.authFormComponentRef = this.container.createComponent<IAuthForm>(authType.component);
    this.authFormComponentRef.instance.formGroup = this.endpointForm;
    this.authFormComponentRef.instance.config = authType.config;
    if (this.pDisabled) { this.endpointForm.disable(); } else { this.endpointForm.enable(); }
  }

  private sameAuthTypeFormFields(a: string[], b: string[]): boolean {
    return a.length === b.length && a.filter(item => b.indexOf(item) < 0).length === 0;
  }

  private getData(): ConnectEndpointData {
    const { authType, authValues, systemShared } = this.endpointForm.value;
    let authVal = authValues;

    // Allow the auth form to supply body content if it needs to
    const endpointFormInstance = this.authFormComponentRef.instance as IEndpointAuthComponent;
    if (endpointFormInstance.getBody && endpointFormInstance.getValues) {
      this.bodyContent = endpointFormInstance.getBody();
      authVal = endpointFormInstance.getValues(authValues);
    }

    return {
      authType: authType ?? '',
      authVal,
      systemShared: systemShared ?? false,
      bodyContent: this.bodyContent,
    };
  }

  setData() {
    if (this.connectService) {
      // Push data into service such that it's ready to go on submit. This removes a lot of plumbing of data outside of component to parent
      // and then back in to service
      this.connectService.setData(this.getData());
    }
  }

  ngOnDestroy() {
    safeUnsubscribe(...this.subs);
    if (this.authFormComponentRef) {
      this.authFormComponentRef.destroy();
    }
  }
}

