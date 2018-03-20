import React from 'react';
import MeasureBounds from '@davidisaaclee/react-measure-bounds';
import DragCapture from './DragCapture';

import { 
	isValidHandler, relativePointInside,
	clientPositionFromMouseEvent, clientPositionFromTouch
} from './utility';

// relativeCursorPositionReducer :: (() -> Promise<DOMRect>) -> (?Promise<Point>, DragCapture.Input) -> Promise.Point

const relativeCursorPositionReducer = getBounds => (prevCursorState, input) => {
	return Promise.all([getBounds(), prevCursorState])
		.then(([elementBounds, prevCursorState]) => {
			if (input.type === 'mouse') {
				switch (input.event.type) {
					case 'mousedown':
					case 'mousemove':
						const clientPosition = clientPositionFromMouseEvent(input.event);
						return {
							relativePosition: relativePointInside(elementBounds, clientPosition),
							clientPosition,
						};
						break;

					case 'mouseup':
						return null;
						break;
				}
			} else if (input.type === 'touch') {
				switch (input.event.type) {
					case 'touchstart':
					case 'touchmove':
						const clientPosition = clientPositionFromTouch(input.touch);
						return {
							relativePosition: relativePointInside(elementBounds, clientPosition),
							clientPosition,
						};
						break;

					case 'touchend':
						return null;
				}
			}
		});
}

export default class RelativeDragCapture extends React.Component {
	render() {
		const {
			// dragDidBegin, dragDidMove, dragDidEnd,
			...restProps
		} = this.props;

		return (
			<MeasureBounds>
				{(getBounds) => (
					<DragCapture
						reduceCursorState={relativeCursorPositionReducer(getBounds)}
						{...restProps}
					/>
				)}
			</MeasureBounds>
		);
	}
}

