import React from 'react';
import styled, { css } from 'styled-components';
import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { withState } from '@dump247/storybook-state';
import { DragCapture, RelativeDragCapture } from '../src';
import {
	clientPositionFromMouseEvent, clientPositionFromTouch
} from '../src/utility';
import MeasureBounds from '@davidisaaclee/react-measure-bounds';

const AbsoluteCursor = styled.span.attrs({
	style: ({ position }) => ({
		left: `${position.x}px`,
		top: `${position.y}px`,
	}),
})`
	width: 10px;
	height: 10px;

	background-color: black;

	position: absolute;
	transform: translate(-50%, -50%);
`;

const Cursor = styled.span.attrs({
	style: ({ position }) => ({
		left: `${position.x * 100}%`,
		top: `${position.y * 100}%`,
	}),
})`
	width: 10px;
	height: 10px;

	background-color: black;

	position: absolute;
	transform: translate(-50%, -50%);
`;

function velocityCursorStateReducer(prevCursorState, input) {
	if (input.type === 'mouse') {
		switch (input.event.type) {
			case 'mousedown':
			case 'mousemove':
				const clientPosition = clientPositionFromMouseEvent(input.event);
				const delta = prevCursorState == null
					? { x: 0, y: 0 }
					: {
						x: clientPosition.x - prevCursorState.clientPosition.x,
						y: clientPosition.y - prevCursorState.clientPosition.y,
					};
				return {
					delta,
					clientPosition
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
				const delta = prevCursorState == null
					? { x: 0, y: 0 }
					: {
						x: clientPosition.x - prevCursorState.clientPosition.x,
						y: clientPosition.y - prevCursorState.clientPosition.y,
					};
				return {
					delta,
					clientPosition
				};
				break;

			case 'touchend':
				return null;
		}
	}
}

storiesOf('DragCapture', module)
  .add('basic', withState({}, (store) => (
		<DragCapture
			dragDidBegin={(cursorID, { clientPosition }) => store.set({ [cursorID]: clientPosition })}
			dragDidMove={(cursorID, { clientPosition }) => store.set({ [cursorID]: clientPosition })}
			dragDidEnd={(cursorID) => store.set({ [cursorID]: undefined })}
		>
			<div style={{
				width: 300,
				height: 300,
				backgroundColor: '#eee',
			}}>
			{
				Object.keys(store.state)
				.map(cursorID => ({ cursorID, position: store.state[cursorID] }))
				.filter(({ position }) => position != null)
				.map(({ cursorID, position }) => (
					<AbsoluteCursor key={cursorID} position={position} />
				))
			}
		</div>
	</DragCapture>
  )))
  .add('relative position', withState({}, (store) => (
		<RelativeDragCapture
			dragDidBegin={(cursorID, cursorState) => {
				cursorState
					.then(({ relativePosition }) => {
						store.set({ [cursorID]: relativePosition })
					})
			}}
			dragDidMove={(cursorID, cursorState) => cursorState
					.then(({ relativePosition }) => {
						if (store.state[cursorID] != null) {
							store.set({ [cursorID]: relativePosition });
						}
					})}
			dragDidEnd={(cursorID, cursorState) => {
				cursorState.then(_ => {
					store.set({ [cursorID]: undefined });
				});
			}}
		>
			<div style={{
				position: 'relative',
				width: 300,
				height: 300,
				backgroundColor: '#eee',
			}}>
			{
				Object.keys(store.state)
				.map(cursorID => ({ cursorID, position: store.state[cursorID] }))
				.filter(({ position }) => position != null)
				.map(({ cursorID, position }) => (
					<Cursor key={cursorID} position={position} />
				))
			}
		</div>
		</RelativeDragCapture>
  )))
  .add('custom reducer', withState({}, (store) => (
		<DragCapture
			dragDidBegin={(cursorID, { clientPosition }) => store.set({ [cursorID]: clientPosition })}
			dragDidMove={(cursorID, { clientPosition }) => store.set({ [cursorID]: clientPosition })}
			dragDidEnd={(cursorID) => store.set({ [cursorID]: undefined })}
			reduceCursorState={velocityCursorStateReducer}
		>
			<div style={{
				width: 300,
				height: 300,
				backgroundColor: '#eee',
			}}>
			{
				Object.keys(store.state)
				.map(cursorID => ({ cursorID, position: store.state[cursorID] }))
				.filter(({ position }) => position != null)
				.map(({ cursorID, position }) => (
					<AbsoluteCursor key={cursorID} position={position} />
				))
			}
		</div>
	</DragCapture>
  )))
  .add('custom should track logic', withState({}, (store) => (
		<DragCapture
			shouldTrackDrag={(pointerID, { clientPosition }) => {
				// Only track when cursor begins in top-half of bounds.
				return clientPosition.y < 150
			}}
			dragDidBegin={(cursorID, { clientPosition }) => store.set({ [cursorID]: clientPosition })}
			dragDidMove={(cursorID, { clientPosition }) => store.set({ [cursorID]: clientPosition })}
			dragDidEnd={(cursorID) => store.set({ [cursorID]: undefined })}
		>
			<div style={{
				width: 300,
				height: 300,
				backgroundColor: '#eee',
			}}>
			{
				Object.keys(store.state)
				.map(cursorID => ({ cursorID, position: store.state[cursorID] }))
				.filter(({ position }) => position != null)
				.map(({ cursorID, position }) => (
					<AbsoluteCursor key={cursorID} position={position} />
				))
			}
		</div>
	</DragCapture>
  )))


