import React, { Component } from 'react';
import { addButton, removeButton } from '../utils/buttonUtils';

const mapping = {
  W: 'LeftStickY', //forward+
  S: 'LeftStickY', //backward-
  D: 'LeftStickX', //right+
  A: 'LeftStickX', //left-
  ARROWUP: 'LeftTrigger', //bias up
  ARROWDOWN: 'RightTrigger', //bias down
  ARROWLEFT: 'RightStickX', //yaw-
  ARROWRIGHT: 'RightStickX', //yaw
  V: 'B', //autoheading
  C: 'A', //autodepth
  TAB: 'Y', //reset bias
  CAPSLOCK: 'X', //reset axis bias
  SHIFT: 'Back', //netfollowing
  ' ': 'Start', //dp
  L: 'DPadRight', //sway bias+
  J: 'DPadLeft', //sway bias-
  I: 'DPadUp', //surge bias+
  K: 'DPadDown', //surge bias-
  Q: 'LB', //heave bias (down) +
  E: 'RB', //negative heave bias (up) -
  M: 'LS', //set to manual mode and reset bias
};

// Buttons we want to send negative values for
const negatives = ['S', 'A', 'ARROWLEFT'];

class KeyboardWrapper extends Component {
  constructor(props) {
    super(props);
    this.state = { activeButtons: [] };
  }

  keyChangeHandler = (e, down) => {
    const key = e.key.toUpperCase();
    const button = mapping[key];
    if (!button) return;
    const value = negatives.indexOf(key) >= 0 ? -1 : 1;
    const newState = down
      ? addButton(this.state.activeButtons, button, value)
      : removeButton(this.state.activeButtons, button);
    this.setState({ activeButtons: newState });
    window.ipcRenderer.send('button-click', this.state.activeButtons);
  };

  componentDidMount() {
    document.addEventListener('keydown', e => {
      this.keyChangeHandler(e, true);
    });
    document.addEventListener('keyup', e => {
      this.keyChangeHandler(e, false);
    });
  }

  componentDidUnmount() {
    document.removeEventListener('keyup', this.keyChangeHandler);
    document.removeEventListener('keydown', this.keyChangeHandler);
  }

  render() {
    return <span></span>;
  }
}

export default KeyboardWrapper;
