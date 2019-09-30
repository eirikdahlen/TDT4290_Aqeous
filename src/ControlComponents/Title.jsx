import React from 'react';
import PropTypes from 'prop-types';
import './css/Title.css';

export default function Title(props) {
  return <div className="Title">{props.children}</div>;
}

Title.propTypes = {
  children: PropTypes.string,
};