# react-drag-capture
A convenience React component for succinctly managing positions of multiple mouse
and touch pointers, even as they move outside of the component.

A pointer is tracked once a `touchstart` or `mousedown` event occurs within the
`DragCapture` element, and continues to be tracked until the corresponding
`mouseup` or `touchend` event occurs. **Notably, a pointer continues to be
tracked even when dragged outside of the `DragCapture` element.**

![Demonstration](https://media.giphy.com/media/xFoIfk4ObNry0QaqUp/giphy.gif)


```jsx
import { DragCapture, RelativeDragCapture } from '@davidisaaclee/react-drag-capture';

// `position`s from `DragCapture` will be client position of pointer
<DragCapture
  dragDidBegin={(pointerID, { clientPosition }) => console.log(`${pointerID}: Began drag at (${clientPosition.x}, ${clientPosition.y})`)}
  dragDidMove={(pointerID, { clientPosition }) => console.log(`${pointerID}: Moved drag at (${clientPosition.x}, ${clientPosition.y})`)}
  dragDidEnd={(pointerID) => console.log(`${pointerID}: Ended drag`)}
/>

// `position`s from `RelativeDragCapture` will be between (0, 0) and (1, 1), relative to the `RelativeDragCapture` element.
// Top-left of the element is (0, 0), bottom-right is (1, 1).
<RelativeDragCapture
  dragDidBegin={(pointerID, { relativePosition }) => console.log(`${pointerID}: Began drag at (${relativePosition.x}, ${relativePosition.y})`)}
  dragDidMove={(pointerID, { relativePosition }) => console.log(`${pointerID}: Moved drag at (${relativePosition.x}, ${relativePosition.y})`)}
  dragDidEnd={(pointerID) => console.log(`${pointerID}: Ended drag`)}
/>
```

## Features
- Unified API for touch and mouse events
- Multitouch support
- Optional `RelativeDragCapture` component for providing a pointer position
relative to the `RelativeDragCapture`'s bounds
- Automatically disables default touch actions for tracked touches
- Provide custom behavior for how pointers should be tracked and reported over
time
- Provide custom logic for which pointers should be tracked

## Installation
```bash
yarn add https://github.com/davidisaaclee/react-drag-capture
```

### Development
```bash
# Clone repository.
git clone https://github.com/davidisaaclee/react-drag-capture
cd react-drag-capture

# Build for ES modules and CommonJS.
yarn build

# Run Storybook on port 9001.
yarn run storybook
```

## Relation to the Pointer Events API
A lot of this component's functionality is more powerfully implemented in the
[Pointer Events API](https://developer.mozilla.org/en-US/docs/Web/API/Pointer_events),
specifically when combined with
[`setPointerCapture()`](https://developer.mozilla.org/en-US/docs/Web/API/Element/setPointerCapture).

Unfortunately, as of March 2018, Safari does not fully support this API. There
are a handful of polyfills - most visibly, [PEP](https://github.com/jquery/PEP)
from jQuery.
These might be the way to go; but I personally found that using a polyfill made
debugging performance a little confusing. (I'm probably wrong about this!)

**It's important to note that the `pointerId` of a pointer event and the pointer
ID provided by the `DragCapture` props are not guaranteed to be the same.**

## See also
- https://ethanselzer.github.io/react-cursor-position/#/

