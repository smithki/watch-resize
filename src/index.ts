// --- Imports -------------------------------------------------------------- //

import { animationFrameScheduler, fromEvent, Observable } from 'rxjs';
import { throttleTime } from 'rxjs/operators';

// --- Business logic ------------------------------------------------------- //

export function watchResize<T extends HTMLElement>(
  element: T,
): Promise<Observable<Event>> {
  return new Promise((resolve, reject) => {
    if (!element) reject('Element must be defined');

    if (getComputedStyle(element).position === 'static') {
      element.style.position = 'relative';
    }

    const obj = document.createElement('object');
    obj.setAttribute(
      'style',
      'display: block; position: absolute; top: 0; left: 0; height: 100%; width: 100%; overflow: hidden; pointer-events: none; z-index: -1;',
    );
    obj.type = 'text/html';
    obj.data = 'about:blank';
    obj.onload = () => {
      if (obj.contentDocument && obj.contentDocument.defaultView) {
        const viewContext = obj.contentDocument.defaultView;
        resolve(
          fromEvent(viewContext, 'resize').pipe(
            throttleTime(0, animationFrameScheduler),
          ),
        );
      } else {
        reject('Could not build `HTMLObjectElement` to watch element resize.');
      }
    };

    element.appendChild(obj);
  });
}
