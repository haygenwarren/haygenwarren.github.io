import { Component, ElementRef, signal, viewChild } from '@angular/core';

@Component({
  selector: 'app-resume-request',
  templateUrl: './resume-request.html',
  styleUrl: './resume-request.scss',
})
export class ResumeRequestComponent {
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
    const subject = encodeURIComponent('Résumé / CV request');
    const body = encodeURIComponent(`Hi Haygen,\n\n${message.trim()}\n\nReply to: ${email.trim()}`);
    window.location.href = `mailto:haygenwarren@gmail.com?subject=${subject}&body=${body}`;
    this.draftOpened.set(true);
  }
}
