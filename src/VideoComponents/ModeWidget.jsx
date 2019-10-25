import React, { Component } from 'react';
import PropTypes from 'prop-types';
import NetFollowingWidget from './NetFollowingWidget';
import './css/ModeWidget.css';
import redX from './images/redX.png';
import greenCheckmark from './images/greenCheckmark.png';
import ModeEnum from '../constants/modeEnum';
import { clamp, mapRange } from './js/tools.js';
import DynPosWidget from './DynPosWidget';

const { remote } = window.require('electron');

// Defining this the shorthand way did not work for some reason?
// Adding elements one by one instead
const modeToLabel = {};
modeToLabel[ModeEnum.MANUAL] = 'MANUAL';
modeToLabel[ModeEnum.DYNAMICPOSITIONING] = 'DYN. POS.';
modeToLabel[ModeEnum.NETFOLLOWING] = 'NET FOLLOWING';

class ModeWidget extends Component {
  constructor(props) {
    super(props);

    this.state = {
      fontSizeMode: 14,
      fontSizeNFAvail: 14,
      sizeImgNFAvail: 25,
      divWidth: 250,
    };

    // Initial variable values
    this.modeLabel = 'INVALID';
    this.imgsrc = null;
    this.opacityStyle = null;
    this.widget = null;

    if (this.props.nfAvailable) {
      // Net following available
      this.nfLabel = 'NET FOLLOWING AVAILABLE';
      this.imgsrc = greenCheckmark;
      this.opacityStyle = 'NFAvailable';
    } else {
      // Net following unavailable
      this.nfLabel = 'NET FOLLOWING UNAVAILABLE';
      this.imgsrc = redX;
      this.opacityStyle = 'NFUnavailable';
    }

    this.componentDidMount();
  }

  componentDidMount() {
    // Add an event listener to be able to scale the widget along with the window
    window.addEventListener('resize', this.updateDimensions);

    this.componentDidUpdate();
    this.updateDimensions();
  }

  componentDidUpdate() {
    const { currentMode } = this.props;
    // Get the correct label for the current mode
    this.modeLabel = modeToLabel[currentMode];

    if (currentMode === ModeEnum.DYNAMICPOSITIONING) {
      this.widget = <DynPosWidget />;
    } else if (currentMode === ModeEnum.NETFOLLOWING) {
      // Show the net following widget
      const dataNF = remote.getGlobal('netfollowing');
      this.widget = (
        <NetFollowingWidget
          distance={dataNF.distance}
          velocity={dataNF.velocity}
        />
      );
    } else {
      // Show the NF availability widget
      this.widget = (
        <div
          className={'NFAvailability ' + this.opacityStyle}
          style={{
            fontSize: this.state.fontSizeNFAvail + 'px',
          }}
        >
          <img
            id="ImgNFAvailable"
            src={this.imgsrc}
            alt=""
            style={{ width: this.state.sizeImgNFAvail + 'px' }}
          ></img>
          <div>{this.nfLabel}</div>
        </div>
      );
    }
  }

  componentWillUnmount() {
    // Unregister event listener
    window.removeEventListener('resize', this.updateDimensions);
  }

  updateDimensions = () => {
    const width = window.innerWidth;

    // Scale text of the mode label
    this.setState({
      fontSizeMode: clamp(mapRange(width, 1000, 1500, 12, 20), 12, 20),
    });
    this.setState({
      fontSizeNFAvail: clamp(mapRange(width, 1000, 1500, 12, 14), 12, 14),
    });
    this.setState({
      sizeImgNFAvail: clamp(mapRange(width, 1000, 1500, 15, 25), 15, 25),
    });
    this.setState({
      divWidth: clamp(mapRange(width, 1000, 1500, 200, 250), 200, 250),
    });
  };

  static get propTypes() {
    return {
      currentMode: PropTypes.number,
      nfAvailable: PropTypes.bool,
    };
  }

  render() {
    return (
      <div
        className="ModeWidget"
        style={{
          fontSize: this.state.fontSizeMode + 'px',
          width: this.state.divWidth,
        }}
        onLoad={this.updateDimensions}
      >
        <p>{this.modeLabel}</p>
        {this.widget}
      </div>
    );
  }
}

export default ModeWidget;
export { ModeEnum };
