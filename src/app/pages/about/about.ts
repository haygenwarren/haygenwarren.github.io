import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { PageBannerComponent } from '../../shared/components/page-banner/page-banner';
import { ResourceService } from '../../core/services/resource.service';

@Component({
  selector: 'app-about',
  imports: [PageBannerComponent, DatePipe],
  templateUrl: './about.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './about.scss',
})
export class AboutComponent {
  readonly resources = toSignal(inject(ResourceService).getResources(), { initialValue: [] });
}
