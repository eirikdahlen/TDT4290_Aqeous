import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Switch from './Switch';
import Title from './Title';
import './css/Mode.css';
import ModeEnum from '../constants/modeEnum';
import { normalize, degreesToRadians } from './../utils/utils';
import ModeInput from './ModeInput';

const { remote } = window.require('electron');

// DP mode component for setting DP-values and toggling DP on and off
export default function DynamicPositioningMode({ title, modeData, step }) {
  const attributes = ['north', 'east', 'down', 'yaw'];

  // Attributes to ensure valid state - not too big DP distance set
  const [isStateValid, setStateValid] = useState(true);
  const [errorInfo, setErrorInfo] = useState({
    attribute: '',
    value: 0.0,
    euclideanDistance: 0.0,
  });
  const maxEuclideanDistance = 2;

  // Active if the current mode of the ROV is DP, available if the dpavailable flag is true
  let active = modeData.currentMode === ModeEnum.DYNAMICPOSITIONING;
  let available = modeData.dpAvailable;

  // Converts value of type withing proper range and format
  function fixValue(value, type) {
    if (type === 'north') {
      // Normalize value somehow here
    } else if (type === 'east') {
      // Normalize value somehow here
    } else if (type === 'down') {
      value = normalize(value, 0, 200);
    } else if (type === 'yaw') {
      value = degreesToRadians(value);
    }
    return value;
  }

  // Function that is run when the update-button is clicked - updates the global dp-variable with value
  const updateValue = (value, type) => {
    if (attributes.indexOf(type) < 0) {
      return;
    }
    const newValue = fixValue(value, type);
    const euclideanAttributes = attributes.slice(0, -1);
    const euclideanDistance = Math.sqrt(
      euclideanAttributes.reduce((acc, cur) => {
        if (cur === type) {
          return acc + Math.pow(newValue, 2);
        } else {
          return (
            acc + Math.pow(remote.getGlobal('dynamicpositioning')[type], 2)
          );
        }
      }, 0),
    ).toFixed(2);
    if (euclideanDistance > maxEuclideanDistance) {
      setErrorInfo({ attribute: type, value: newValue, euclideanDistance });
      setStateValid(false);
    } else {
      setStateValid(true);
      remote.getGlobal('dynamicpositioning')[type] = newValue;
    }
  };
  // Function that is run when toggle is clicked - sets to DP if dp is not current mode, sets to manual if dp is current
  const toggle = () => {
    if (!available) {
      return;
    }
    if (modeData.currentMode === ModeEnum.DYNAMICPOSITIONING) {
      remote.getGlobal('mode')['currentMode'] = ModeEnum.MANUAL;
    } else if (
      modeData.currentMode === ModeEnum.MANUAL ||
      modeData.currentMode === ModeEnum.NETFOLLOWING
    ) {
      remote.getGlobal('mode')['currentMode'] = ModeEnum.DYNAMICPOSITIONING;
    } else {
      console.log('Error - unable to change mode');
    }
  };

  const setCurrentPosition = () => {
    const fromROV = remote.getGlobal('fromROV');
    attributes.forEach(attribute => {
      const currentPosition = Number(fromROV[attribute]);
      const field = document.getElementById(attribute);
      field.value = currentPosition.toFixed(2);
      remote.getGlobal('dynamicpositioning')[attribute] = currentPosition;
    });
    setStateValid(true);
  };

  return (
    <div className={'Mode ' + (active ? 'activeMode' : '')}>
      <Title available={available}>{title.toUpperCase()}</Title>
      <div className="modeInputFlex">
        <div className="modeInputRow">
          <ModeInput
            inputId="north"
            header="North"
            step={step}
            clickFunction={updateValue}
          ></ModeInput>
          <ModeInput
            inputId="east"
            header="East"
            step={step}
            clickFunction={updateValue}
          ></ModeInput>
        </div>
        <div className="modeInputRow">
          <ModeInput
            inputId="down"
            header="Down"
            step={step}
            min={0}
            max={200}
            clickFunction={updateValue}
          ></ModeInput>
          <ModeInput
            inputId="yaw"
            header="Yaw"
            step={step}
            min={0}
            max={360}
            clickFunction={updateValue}
          ></ModeInput>
        </div>
        <button onClick={() => setCurrentPosition()} className="DPCurrentBtn">
          <span>Use current position</span>
        </button>
        <p className={'DPWarning ' + (isStateValid ? '' : 'DPWarningShow')}>
          Could not set {errorInfo.attribute} to {errorInfo.value}. <br />
          <br />
          The resulting euclidean distance ({errorInfo.euclideanDistance}) would
          be greater than {maxEuclideanDistance}.
        </p>
      </div>
      <div className="checkSwitch">
        <Switch
          isOn={active}
          handleToggle={() => {
            toggle();
          }}
          id={`${title}Switch`}
        />
      </div>
    </div>
  );
}

DynamicPositioningMode.propTypes = {
  title: PropTypes.string,
  step: PropTypes.number,
  modeData: PropTypes.object,
};
