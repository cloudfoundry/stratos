import { Component , ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { ServicesService } from '../services.service';


@Component({
  selector: 'app-service-base',
  templateUrl: './service-base.component.html',
  styleUrls: ['./service-base.component.scss'],
  providers: [ServicesService],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterOutlet
  ]
})
export class ServiceBaseComponent { }
