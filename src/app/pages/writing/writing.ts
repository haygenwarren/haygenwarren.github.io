import { Component, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { WritingService } from '../../core/services/writing.service';

const PAGE_SIZE = 12;

@Component({
  selector: 'app-writing',
  imports: [DatePipe],
  templateUrl: './writing.html',
  styleUrl: './writing.scss',
})
export class WritingComponent {
  readonly authorPage = 'https://www.nasaspaceflight.com/author/haygen/';
  articles = toSignal(inject(WritingService).getArticles());
  private limit = signal(PAGE_SIZE);
  shown = computed(() => this.articles()?.slice(0, this.limit()) ?? []);
  remaining = computed(() => Math.max(0, (this.articles()?.length ?? 0) - this.limit()));
  nextBatch = computed(() => Math.min(PAGE_SIZE, this.remaining()));

  showMore(): void {
    this.limit.update((n) => n + PAGE_SIZE);
  }
}
