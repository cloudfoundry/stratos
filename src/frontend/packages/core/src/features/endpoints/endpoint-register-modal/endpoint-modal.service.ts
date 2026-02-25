import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class EndpointModalService {
  private _isModalOpen = signal<boolean>(false);
  public isModalOpen = this._isModalOpen.asReadonly();

  openModal() {
    this._isModalOpen.set(true);
    // Prevent body scroll when modal is open
    document.body.classList.add('modal-open');
  }

  closeModal() {
    this._isModalOpen.set(false);
    // Restore body scroll
    document.body.classList.remove('modal-open');
  }

  get isOpen(): boolean {
    return this._isModalOpen();
  }
}