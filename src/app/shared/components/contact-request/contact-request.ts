import { Component, ElementRef, input, signal, viewChild } from '@angular/core';

let nextId = 0;

/**
 * A native dialog that collects an email address and a short note, then opens
 * a prefilled email draft to Haygen. Nothing is sent or stored by the site.
 * Used for résumé requests (Home) and commission enquiries (Photography).
 */
@Component({
  selector: 'app-contact-request',
  templateUrl: './contact-request.html',
  styleUrl: './contact-request.scss',
})
export class ContactRequestComponent {
  eyebrow = input("Let's connect");
  heading = input.required<string>();
  description = input.required<string>();
  /** Subject line of the email draft. */
  subject = input.required<string>();
  placeholder = input('Hi Haygen, …');
  /** Accessible name of the close button, e.g. "Close résumé request". */
  closeLabel = input('Close');

  readonly id = `contact-${nextId++}`;
  private dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  draftOpened = signal(false);

  open(): void {
    this.draftOpened.set(false);
    this.dialog().nativeElement.showModal();
  }
  close(): void {
    this.dialog().nativeElement.close();
  }

  onBackdrop(event: MouseEvent): void {
    if (event.target === this.dialog().nativeElement) {
      const bounds = this.dialog().nativeElement.getBoundingClientRect();
      if (
        event.clientX < bounds.left ||
        event.clientX > bounds.right ||
        event.clientY < bounds.top ||
        event.clientY > bounds.bottom
      )
        this.close();
    }
  }

  request(event: Event, email: string, message: string): void {
    event.preventDefault();
    const subject = encodeURIComponent(this.subject());
    const body = encodeURIComponent(`Hi Haygen,\n\n${message.trim()}\n\nReply to: ${email.trim()}`);
    window.location.href = `mailto:haygenwarren@gmail.com?subject=${subject}&body=${body}`;
    this.draftOpened.set(true);
  }
}
