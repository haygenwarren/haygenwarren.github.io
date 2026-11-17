import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { ExperienceService } from '../../core/services/experience.service';
import { ConferencePresentation, ExperienceEntry } from '../../core/models/experience.model';
import { PageBannerComponent } from '../../shared/components/page-banner/page-banner';
import { PillTab, PillTabsComponent } from '../../shared/components/pill-tabs/pill-tabs';

interface TabDefinition extends Omit<PillTab, 'count'> {
  category?: ExperienceEntry['category'];
  talks?: boolean;
}

interface Tab extends TabDefinition, PillTab {
  entries: ExperienceEntry[];
  presentations: ConferencePresentation[];
}

const RESEARCH_TABS: TabDefinition[] = [
  { id: 'research', label: 'Research experience', category: 'research' },
  { id: 'teaching', label: 'Teaching & mentorship', category: 'teaching' },
  { id: 'talks', label: 'Conference presentations', talks: true },
];

const WORK_TABS: TabDefinition[] = [
  { id: 'experience', label: 'Professional experience', category: 'work' },
  { id: 'projects', label: 'Projects & development', category: 'project' },
];

@Component({
  selector: 'app-experience',
  imports: [PageBannerComponent, PillTabsComponent],
  templateUrl: './experience.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './experience.scss',
})
export class ExperienceComponent {
  readonly isResearch = inject(ActivatedRoute).snapshot.data['section'] === 'research';
  readonly page = this.isResearch ? 'research' : 'work';
  readonly title = this.isResearch ? 'Research' : 'Work & projects';
  readonly data = toSignal(inject(ExperienceService).getExperience());

  readonly tabs = computed<Tab[]>(() => {
    const data = this.data();
    if (!data) return [];
    return (this.isResearch ? RESEARCH_TABS : WORK_TABS)
      .map((tab) => {
        const entries = tab.category ? data.entries.filter((e) => e.category === tab.category) : [];
        const presentations = tab.talks ? (data.presentations ?? []) : [];
        return { ...tab, entries, presentations, count: entries.length + presentations.length };
      })
      .filter((tab) => tab.count);
  });

  dates(entry: ExperienceEntry): string {
    return entry.endDate === entry.startDate
      ? entry.startDate
      : `${entry.startDate} – ${entry.endDate ?? 'Present'}`;
  }
}
