import React from 'react';
import PropTypes from 'prop-types';

import {
	clientPositionFromMouseEvent, clientPositionFromTouch,
	omit, isValidHandler
} from './utility';

const mousePointerID = 'mouse';
const pointerIDFromTouch = touch => touch.identifier;

const makePointerState = (clientPosition) => ({
	clientPosition,
});

// inputObjFromMouseEvent :: TouchEvent -> DragCapture.Input
const inputObjFromMouseEvent = evt => {
	if (evt.persist != null) {
		evt.persist();
	}

	return ({
		type: 'mouse',
		event: evt,
	})
};

// inputObjsFromTouchEvent :: TouchEvent -> [DragCapture.Input]
const inputObjsFromTouchEvent = evt => {
	if (evt.persist != null) {
		evt.persist();
	}

	return Array.from(evt.changedTouches).map(touch => ({
		type: 'touch',
		event: evt,
		touch
	}))
};

class DragCapture extends React.Component {
	// Input ::= { type: 'mouse', event: MouseEvent }
	//         | { type: 'touch', event: TouchEvent, touch: Touch }

	constructor(props) {
		super(props);

		this.state = {
			// pointerStates :: { [PointerID]: PointerState }
			// where PointerState ::= {
			//   clientPosition :: Point,
			// }
			pointerStates: {}
		};

		this.beginTrackingFromMouseDown =
			this.beginTrackingFromMouseDown.bind(this);
		this.updateTrackingFromMouseMove =
			this.updateTrackingFromMouseMove.bind(this);
		this.stopTrackingFromMouseUp =
			this.stopTrackingFromMouseUp.bind(this);

		this.beginTrackingFromTouch =
			this.beginTrackingFromTouch.bind(this);
		this.updateTrackingFromTouch =
			this.updateTrackingFromTouch.bind(this);
		this.stopTrackingFromTouch =
			this.stopTrackingFromTouch.bind(this);

		this.isTrackingMouse = false;
		this.numberOfTouchesTracked = 0;
	}

	beginTrackingFromMouseDown(evt) {
		this.addMouseEventListenersIfNecessary();

		this.beginTracking(
			mousePointerID,
			inputObjFromMouseEvent(evt));
	}

	updateTrackingFromMouseMove(evt) {
		this.updateTrackingPosition(
			mousePointerID,
			inputObjFromMouseEvent(evt));
	}

	stopTrackingFromMouseUp(evt) {
		this.removeMouseEventListenersIfNecessary();

		this.stopTracking(
			mousePointerID,
			inputObjFromMouseEvent(evt));
	}

	addMouseEventListenersIfNecessary() {
		if (this.isTrackingMouse) {
			return;
		}

		document.addEventListener(
			'mousemove',
			this.updateTrackingFromMouseMove);
		document.addEventListener(
			'mouseup', 
			this.stopTrackingFromMouseUp);
		this.isTrackingMouse = true;
	}

	removeMouseEventListenersIfNecessary() {
		if (!this.isTrackingMouse) {
			return;
		}

		document.removeEventListener('mousemove', this.updateTrackingFromMouseMove);
		document.removeEventListener('mouseup', this.stopTrackingFromMouseUp);
		this.isTrackingMouse = false;
	}

	beginTrackingFromTouch(evt) {
		const wasAlreadyTrackingTouches = this.numberOfTouchesTracked > 0;

		this.numberOfTouchesTracked += evt.changedTouches.length;

		inputObjsFromTouchEvent(evt)
			.forEach(input => this.beginTracking(
				pointerIDFromTouch(input.touch),
				input));

		if (!wasAlreadyTrackingTouches && this.numberOfTouchesTracked > 0) {
			this.addTouchEventListeners();
		}

		evt.preventDefault();
	}

	updateTrackingFromTouch(evt) {
		inputObjsFromTouchEvent(evt)
			.forEach(input => this.updateTrackingPosition(
				pointerIDFromTouch(input.touch),
				input));

		evt.preventDefault();
	}

	stopTrackingFromTouch(evt) {
		inputObjsFromTouchEvent(evt)
			.forEach(input => this.stopTracking(
				pointerIDFromTouch(input.touch),
				input));

		this.numberOfTouchesTracked -= evt.changedTouches.length;
		this.removeTouchEventListenersIfNecessary();
		evt.preventDefault();
	}

	addTouchEventListeners() {
		document.addEventListener('touchmove', this.updateTrackingFromTouch);
		document.addEventListener('touchend', this.stopTrackingFromTouch);
	}

	removeTouchEventListenersIfNecessary() {
		if (this.numberOfTouchesTracked > 0) {
			return;
		}

		document.removeEventListener('touchmove', this.updateTrackingFromTouch);
		document.removeEventListener('touchend', this.stopTrackingFromTouch);
	}

	updatePointerState(pointerID, input, phase) {
		const previousPointerState =
			this.state.pointerStates[pointerID];
		const newPointerState =
			this.props.reduceCursorState(
				previousPointerState,
				input);

		if (previousPointerState == null && newPointerState != null) {
			if (!this.props.shouldTrackDrag(newPointerState)) {
				return;
			}

			if (isValidHandler(this.props.dragDidBegin)) {
				this.props.dragDidBegin(pointerID, newPointerState);
			}
		} else if (previousPointerState != null && newPointerState != null) {
			if (isValidHandler(this.props.dragDidMove)) {
				this.props.dragDidMove(pointerID, newPointerState);
			}
		} else if (previousPointerState != null && newPointerState == null) {
			if (isValidHandler(this.props.dragDidEnd)) {
				this.props.dragDidEnd(pointerID, newPointerState);
			}
		}

		if (newPointerState == null) {
			this.setState(prevState => ({
				...prevState,
				pointerStates: omit(prevState.pointerStates, pointerID)
			}));
		} else {
			this.setState(prevState => ({
				pointerStates: {
					...prevState.pointerStates,
					[pointerID]: newPointerState
				}
			}));
		}

	}

	// Assumes that event handlers listed in `pointerState`
	// are not yet registered.
	// beginTracking :: (string, Input) -> ()
	beginTracking(pointerID, input) {
		return this.updatePointerState(pointerID, input, 'begin');
	}

	updateTrackingPosition(pointerID, input) {
		return this.updatePointerState(pointerID, input, 'move');
	}

	stopTracking(pointerID, input) {
		return this.updatePointerState(pointerID, input, 'end');
	}

	componentWillUnmount() {
		this.removeTouchEventListenersIfNecessary();
		this.removeMouseEventListenersIfNecessary();
	}

	render() {
		const {
			className, style, children
		} = this.props;

		return (
			<span
				className={className}
				style={{ display: 'inline-block', ...style }}
				onMouseDown={this.beginTrackingFromMouseDown}
				onTouchStart={this.beginTrackingFromTouch}
			>
				{children}
			</span>
		)
	}
};

// Point ::= { x: number, y: number }

DragCapture.propTypes = {
	// dragDidBegin :: (string, CursorState) -> ()
	dragDidBegin: PropTypes.func,
	// dragDidMove :: (string, CursorState) -> ()
	dragDidMove: PropTypes.func,
	// dragDidEnd :: (string, CursorState) -> ()
	dragDidEnd: PropTypes.func,

	// shouldTrackDrag :: CursorState -> boolean
	shouldTrackDrag: PropTypes.func,

	// reduceCursorState :: (?CursorState, DragCapture.Input) -> CursorState
	reduceCursorState: PropTypes.func,
};

DragCapture.defaultProps = {
	shouldTrackDrag: _ => true,

	reduceCursorState: (cursorState, input) => {
		if (input.type === 'mouse') {
			switch (input.event.type) {
				case 'mousemove':
					if (cursorState == null) {
						return null;
					}
					// continue

				case 'mousedown':
					return makePointerState(
						clientPositionFromMouseEvent(input.event));
					break;

				case 'mouseup':
					return null;
					break;
			}
		} else if (input.type === 'touch') {
			switch (input.event.type) {
				case 'touchmove':
					if (cursorState == null) {
						return null;
					}
					// continue

				case 'touchstart':
					return makePointerState(
						clientPositionFromTouch(input.touch));
					break;

				case 'touchend':
					return null;
			}
		}
	},
};

export default DragCapture;

