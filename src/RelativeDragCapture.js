import React from 'react';
import MeasureBounds from '@davidisaaclee/react-measure-bounds';
import DragCapture from './DragCapture';

import { isValidHandler, relativePointInside } from './utility';

export default class RelativeDragCapture extends React.Component {
	render() {
		const {
			dragDidBegin, dragDidMove, dragDidEnd,
			...restProps
		} = this.props;

		return (
			<MeasureBounds>
				{(getBounds) => (
					<DragCapture
						dragDidBegin={(cursorID, position) => getBounds()
								.then(bounds => isValidHandler(dragDidBegin) && dragDidBegin(
									cursorID,
									relativePointInside(bounds, position)))}
						dragDidMove={(cursorID, position) => getBounds()
								.then(bounds => isValidHandler(dragDidMove) && dragDidMove(
									cursorID,
									relativePointInside(bounds, position)))}
						dragDidEnd={(cursorID, position) => getBounds()
								.then(bounds => isValidHandler(dragDidEnd) && dragDidEnd(
									cursorID,
									relativePointInside(bounds, position)))}
						{...restProps}
					/>
				)}
			</MeasureBounds>
		);
	}
}

