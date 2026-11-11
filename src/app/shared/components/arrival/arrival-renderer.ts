import { Arrival, ArrivalKind } from '../../../core/services/arrival.service';
import { Painter, Scene, span } from './pixel-painter';
import { CameraScene } from './scenes/camera';
import { MergerScene } from './scenes/merger';
import { RocketScene } from './scenes/rocket';
import { TelescopeScene } from './scenes/telescope';

const SCENES: Record<ArrivalKind, new (painter: Painter) => Scene> = {
  telescope: TelescopeScene,
  camera: CameraScene,
  rocket: RocketScene,
  merger: MergerScene,
};

/** Draws one frame of an arrival onto a coarse pixel canvas. Scenes are built
 * lazily and rebuilt on resize, since they lay themselves out for the viewport. */
export class ArrivalRenderer {
  private painter: Painter;
  private scenes = new Map<ArrivalKind, Scene>();

  constructor(canvas: HTMLCanvasElement) {
    this.painter = new Painter(canvas);
  }

  resize(): void {
    this.painter.resize();
    this.scenes.clear();
  }

  draw(arrival: Arrival, progress: number): void {
    let scene = this.scenes.get(arrival.kind);
    if (!scene) {
      scene = new SCENES[arrival.kind](this.painter);
      this.scenes.set(arrival.kind, scene);
    }
    const seconds = (progress * arrival.duration) / 1000;
    scene.draw(progress, seconds);
    this.painter.darken(1 - span(seconds, 0, 0.45));
    this.painter.finish();
  }
}
