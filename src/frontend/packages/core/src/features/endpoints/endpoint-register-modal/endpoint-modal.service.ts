import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EndpointModalService {
  private isModalOpenSubject = new BehaviorSubject<boolean>(false);
  public isModalOpen$ = this.isModalOpenSubject.asObservable();

  openModal() {
    this.isModalOpenSubject.next(true);
    // Prevent body scroll when modal is open
    document.body.classList.add('modal-open');
  }

  closeModal() {
    this.isModalOpenSubject.next(false);
    // Restore body scroll
    document.body.classList.remove('modal-open');
  }

  get isOpen(): boolean {
    return this.isModalOpenSubject.value;
  }
}