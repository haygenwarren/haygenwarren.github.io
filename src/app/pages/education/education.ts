import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { EducationService } from '../../core/services/education.service';
import { PageBannerComponent } from '../../shared/components/page-banner/page-banner';
import { PillTab, PillTabsComponent } from '../../shared/components/pill-tabs/pill-tabs';

@Component({
  selector: 'app-education',
  imports: [PageBannerComponent, PillTabsComponent],
  templateUrl: './education.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './education.scss',
})
export class EducationComponent {
  private readonly data = toSignal(inject(EducationService).getEducation());
  readonly entries = computed(() => this.data()?.entries ?? []);
  readonly awards = computed(() => this.data()?.awards ?? []);

  /** Ids are the URL fragments: /education#background, /education#awards. */
  readonly tabs = computed<PillTab[]>(() =>
    [
      { id: 'background', label: 'Academic background', count: this.entries().length },
      { id: 'awards', label: 'Scholarships & awards', count: this.awards().length },
    ].filter((tab) => tab.count),
  );
}
