import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterRenderEffect,
  computed,
  inject,
  input,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';

export interface PillTab {
  /**
   * Also the URL fragment (/research#talks) and the base of the element ids:
   * the pill is #tab-<id> and the page's panel for it must be #panel-<id>.
   */
  id: string;
  /** Pill text, which is also the section's title. */
  label: string;
  /** How many entries the section holds, shown on the pill. */
  count: number;
}

/**
 * Pill-shaped tabs that switch a page between sections (Research, Work,
 * Education). The open tab is kept in the URL fragment, so it can be linked
 * to and survives the back button. The page renders the panels itself:
 *
 *   <app-pill-tabs #pills [tabs]="tabs()" label="Education sections" />
 *   <section role="tabpanel" id="panel-awards" aria-labelledby="tab-awards"
 *     [attr.hidden]="pills.current() === 'awards' ? null : 'until-found'"
 *     (beforematch)="pills.select('awards')">
 *
 * Closed panels use hidden="until-found", so ⌘F still finds their text and
 * the beforematch event opens the tab.
 */
@Component({
  selector: 'app-pill-tabs',
  templateUrl: './pill-tabs.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  host: {
    role: 'tablist',
    class: 'pill-tabs',
    '[attr.aria-label]': 'label()',
  },
})
export class PillTabsComponent {
  tabs = input.required<PillTab[]>();
  /** Names the tab list for screen readers, e.g. "Research sections". */
  label = input.required<string>();

  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly fragment = toSignal(this.route.fragment);

  /** The open tab: the URL fragment if it names one, otherwise the first. */
  readonly current = computed(() => {
    const ids = this.tabs().map((tab) => tab.id);
    const wanted = this.fragment();
    return wanted && ids.includes(wanted) ? wanted : ids[0];
  });

  constructor() {
    // On phones the pills scroll sideways; keep the open one in view (e.g. when
    // a link opens /research#talks). Only the row scrolls, never the page.
    afterRenderEffect(() => {
      const list = this.host.nativeElement;
      const pill = list.querySelector(`#tab-${this.current()}`);
      if (!pill || list.scrollWidth <= list.clientWidth) return;
      const row = list.getBoundingClientRect();
      const box = pill.getBoundingClientRect();
      const pad = parseFloat(getComputedStyle(list).scrollPaddingInlineStart) || 0;
      if (box.left < row.left + pad) list.scrollLeft -= row.left + pad - box.left;
      else if (box.right > row.right - pad) list.scrollLeft += box.right - (row.right - pad);
    });
  }

  select(id: string): void {
    // Replace rather than push, so the back button leaves the page instead of
    // stepping through tabs, yet returning here reopens the same tab.
    this.router.navigate([], {
      relativeTo: this.route,
      fragment: id,
      replaceUrl: true,
      queryParamsHandling: 'preserve',
    });
  }

  /** Arrow keys, Home and End move between tabs (WAI-ARIA tabs pattern). */
  onKey(event: KeyboardEvent, index: number): void {
    const tabs = this.tabs();
    const next =
      event.key === 'ArrowRight'
        ? (index + 1) % tabs.length
        : event.key === 'ArrowLeft'
          ? (index - 1 + tabs.length) % tabs.length
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? tabs.length - 1
              : -1;
    if (next < 0) return;
    event.preventDefault();
    const id = tabs[next].id;
    this.select(id);
    setTimeout(() => this.host.nativeElement.querySelector<HTMLElement>(`#tab-${id}`)?.focus());
  }
}
