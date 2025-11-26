import { CommonModule, AsyncPipe } from '@angular/common';
import { Component, ViewEncapsulation, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  CardComponent,
  CustomizationService,
  type CustomizationsMetadata,
  CustomFormFieldComponent,
  InputDirective,
  LoginPageComponent,
  ProgressBarComponent,
  StratosLoginComponent
} from '@stratosui/core';
import { StratosTitleComponent } from '@stratosui/shared';

@StratosLoginComponent()
@Component({
  selector: 'app-acme-login',
  templateUrl: './acme-login.component.html',
  styleUrls: ['./acme-login.component.scss'],
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardComponent,
    StratosTitleComponent,
    CustomFormFieldComponent,
    InputDirective,
    ProgressBarComponent
  ]
})
export class AcmeLoginComponent extends LoginPageComponent {

  private cs = inject(CustomizationService);
  config: CustomizationsMetadata = this.cs.get();
}
