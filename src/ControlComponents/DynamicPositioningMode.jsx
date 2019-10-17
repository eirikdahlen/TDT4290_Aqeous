import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Switch from './Switch';
import Title from './Title';
import './css/Mode.css';
import ModeEnum from '../constants/modeEnum';
import { normalize, degreesToRadians } from './../utils/utils';
import ModeInput from './ModeInput';

const { remote } = window.require('electron');

export default function DynamicPositioningMode({ title, globalMode, step }) {
  const attributes = ['latitude', 'longitude', 'heading', 'depth'];
  const [latitude, setLatitude] = useState(0.0);
  const [longitude, setLongitude] = useState(0.0);
  const [heading, setHeading] = useState(0.0);
  const [depth, setDepth] = useState(0.0);
  const [dpActive, dpActiveChange] = useState(
    globalMode === ModeEnum.DYNAMICPOSITIONING ? true : false,
  );

  function fixValue(value, type) {
    if (type === 'latitude') {
      setLatitude(value);
    } else if (type === 'longitude') {
      setLongitude(value);
    } else if (type === 'heading') {
      value = degreesToRadians(value);
      setHeading(value);
    } else if (type === 'depth') {
      value = normalize(value, 0, 200);
      setDepth(value);
    }
    return value;
  }

  // Function that is run when the update-button is clicked
  const updateValue = (value, type) => {
    // dont update value if invalid type or not in dynamic position
    if (
      globalMode !== ModeEnum.DYNAMICPOSITIONING ||
      attributes.indexOf(type) < 0
    ) {
      return;
    }
    remote.getGlobal('dynamicpositioning')[type] = fixValue(value, type);
  };

  // Function that is run when toggle is clicked
  const toggle = () => {
    if (
      remote.getGlobal('mode')['globalMode'] === ModeEnum.DYNAMICPOSITIONING
    ) {
      remote.getGlobal('mode')['globalMode'] = ModeEnum.MANUAL;
      dpActiveChange(false);
    } else if (
      remote.getGlobal('mode')['globalMode'] === ModeEnum.MANUAL ||
      remote.getGlobal('mode')['globalMode'] === ModeEnum.NETFOLLOWING
    ) {
      remote.getGlobal('mode')['globalMode'] = ModeEnum.DYNAMICPOSITIONING;
      dpActiveChange(true);
    } else {
      console.log('Error in changing mode');
    }
  };

  return (
    <div className="Mode">
      <Title>{title}</Title>
      <div className="modeInputFlex">
        <ModeInput
          header="Latitude"
          step={step}
          onClick={updateValue}
        ></ModeInput>
        <ModeInput
          header="Longitude"
          step={step}
          onClick={updateValue}
        ></ModeInput>
        <ModeInput
          header="Heading"
          step={step}
          min={0}
          max={360}
          onClick={updateValue}
        ></ModeInput>
        <ModeInput
          header="Depth"
          step={step}
          min={0}
          max={200}
          onClick={updateValue}
        ></ModeInput>
      </div>
      <div className="checkSwitch">
        <Switch
          isOn={dpActive}
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
  globalMode: PropTypes.number,
};
