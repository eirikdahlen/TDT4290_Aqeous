import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Switch from './Switch';
import Title from './Title';
import './css/NetfollowingLock.css';
import ModeEnum from '../constants/modeEnum';

const { remote } = window.require('electron');

export default function NetfollowingLock({ title, globalMode, step }) {
  const [velocityInput, setVelocityInput] = useState(0.0);
  const [distanceInput, setDistanceInput] = useState(0.0);
  const [velocityValue, setVelocityValue] = useState(0.0);
  const [distanceValue, setDistanceValue] = useState(0.0);
  const [nfActive, nfActiveChange] = useState(
    globalMode === ModeEnum.NETFOLLOWING ? true : false,
  );

  function fixValue(value, type) {
    if (type === 'velocity') {
      value = Math.min(value, 10);
      value = Math.max(value, -10);
      setVelocityValue(value);
    } else {
      value = Math.min(value, 10);
      value = Math.max(value, 0);
      setDistanceValue(value);
    }
    return value;
  }

  // Function that is run when the update-button is clicked
  const updateValue = (value, type) => {
    // Could remove this "if" to set value before activating the switch
    if (globalMode === ModeEnum.NETFOLLOWING) {
      if (type === 'velocity') {
        remote.getGlobal('netfollowing')['velocity'] = fixValue(value, type);
      } else if (type === 'distance') {
        remote.getGlobal('netfollowing')['distance'] = fixValue(value, type);
      } else {
        console.log('Type not recognized');
      }
    }
  };

  // Function that is run when toggle is clicked
  const toggle = () => {
    if (remote.getGlobal('mode')['globalMode'] === ModeEnum.NETFOLLOWING) {
      remote.getGlobal('mode')['globalMode'] = ModeEnum.MANUAL;
      nfActiveChange(false);
    } else if (
      remote.getGlobal('mode')['globalMode'] === ModeEnum.MANUAL ||
      remote.getGlobal('mode')['globalMode'] === ModeEnum.DYNAMICPOSITIONING
    ) {
      remote.getGlobal('mode')['globalMode'] = ModeEnum.NETFOLLOWING;
      nfActiveChange(true);
    } else {
      console.log('Error in changing mode');
    }
  };

  return (
    <div className="NetfollowingLock">
      <Title>{title}</Title>
      <div className="inputFlexNF">
        <h3>Velocity</h3>
        <div className="firstRow">
          <input
            type="number"
            placeholder="Velocity"
            step={step}
            min={-10}
            max={10}
            onChange={e => setVelocityInput(Number(e.target.value))}
          />
          <button
            className="updateButton"
            onClick={() => updateValue(velocityInput, 'velocity')}
          >
            &#x21bb;
          </button>
        </div>
        <h3>Distance</h3>
        <div className="secondRow">
          <input
            type="number"
            placeholder="Distance"
            step={step}
            min={0}
            max={10}
            onChange={e => setDistanceInput(Number(e.target.value))}
          />
          <button
            className="updateButton"
            onClick={() => updateValue(distanceInput, 'distance')}
          >
            &#x21bb;
          </button>
        </div>
      </div>
      <div className="checkSwitch">
        <Switch
          isOn={nfActive}
          handleToggle={() => {
            toggle();
          }}
          id={`${title}Switch`}
          currentValue={`v: ${velocityValue.toFixed(
            1,
          )}m/s   d: ${distanceValue.toFixed(1)}m`}
        />
      </div>
    </div>
  );
}

NetfollowingLock.propTypes = {
  title: PropTypes.string,
  step: PropTypes.number,
  globalMode: PropTypes.number,
};