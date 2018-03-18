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

class DragCapture extends React.Component {
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
			makePointerState(clientPositionFromMouseEvent(evt)));
	}

	updateTrackingFromMouseMove(evt) {
		this.updateTrackingPosition(
			mousePointerID,
			clientPositionFromMouseEvent(evt))
	}

	stopTrackingFromMouseUp(evt) {
		this.removeMouseEventListenersIfNecessary();

		this.stopTracking(
			mousePointerID,
			clientPositionFromMouseEvent(evt))
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

		for (let i = 0; i < evt.changedTouches.length; i++) {
			const touch = evt.changedTouches.item(i);
			this.numberOfTouchesTracked++;
			this.beginTracking(
				pointerIDFromTouch(touch),
				makePointerState(clientPositionFromTouch(touch)));
		}

		if (!wasAlreadyTrackingTouches && this.numberOfTouchesTracked > 0) {
			this.addTouchEventListeners();
		}

		evt.preventDefault();
	}

	updateTrackingFromTouch(evt) {
		for (let i = 0; i < evt.changedTouches.length; i++) {
			const touch = evt.changedTouches.item(i);
			this.updateTrackingPosition(
				pointerIDFromTouch(touch),
				clientPositionFromTouch(touch));
		}

		evt.preventDefault();
	}

	stopTrackingFromTouch(evt) {
		for (let i = 0; i < evt.changedTouches.length; i++) {
			const touch = evt.changedTouches.item(i);

			if (this.state.pointerStates[pointerIDFromTouch(touch)] != null) {
				this.numberOfTouchesTracked--;
			}

			this.stopTracking(
				pointerIDFromTouch(touch),
				clientPositionFromTouch(touch));
		}

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

	// Assumes that event handlers listed in `pointerState`
	// are not yet registered.
	beginTracking(pointerID, pointerState) {
		if (isValidHandler(this.props.dragDidBegin)) {
			this.props.dragDidBegin(pointerID, pointerState.clientPosition);
		}

		this.setState(prevState => ({
			pointerStates: {
				...prevState.pointerStates,
				[pointerID]: pointerState
			}
		}));
	}

	updateTrackingPosition(pointerID, clientPosition) {
		const pointerState =
			this.state.pointerStates[pointerID];

		if (pointerState == null) {
			return;
		}

		if (isValidHandler(this.props.dragDidMove)) {
			this.props.dragDidMove(pointerID, clientPosition);
		}

		this.setState(prevState => ({
			...prevState,
			pointerStates: {
				...prevState.pointerStates,
				[pointerID]: {
					...prevState.pointerStates[pointerID],
					clientPosition
				}
			},
		}));
	}

	stopTracking(pointerID, clientPosition) {
		const pointerState =
			this.state.pointerStates[pointerID];

		if (pointerState == null) {
			return;
		}

		if (isValidHandler(this.props.dragDidEnd)) {
			this.props.dragDidEnd(pointerID, clientPosition);
		}

		this.setState(prevState => ({
			...prevState,
			pointerStates: omit(prevState.pointerStates, pointerID)
		}));
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

DragCapture.propTypes = {
	dragDidBegin: PropTypes.func,
	dragDidMove: PropTypes.func,
	dragDidEnd: PropTypes.func,
};

export default DragCapture;

