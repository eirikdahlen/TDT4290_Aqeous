const net = require('net');
const { encodeData, decodeData } = require('./coding');
const { sendMessage } = require('./../utils/IPC');
const { encode, decode, messages } = require('./IMC');

const messageProtocols = {
  IMC: 'IMC',
  old: 'OLD',
};
let messageProtocol = messageProtocols.IMC;

// How many times the TCP has tried to connect and how many times it can try before quitting.
let connectionAttempts = 0;
const limitAttempts = 3;

// Creates a client that receives and sends data to port 5000
function getConnectedClient() {
  //console.log('Attempting to create TCP client and connect to server..');
  const client = new net.Socket();
  messageProtocol = global.settings.messageProtocol;

  client.connect({
    port: global.settings.port,
    host: global.settings.host,
  });

  client.on('connect', function() {
    console.log(`Client: connection established with server!`);

    if (messageProtocol === messageProtocols.old) {
      sendData(client, {
        surge: 0.0,
        sway: 0.0,
        heave: 0.0,
        roll: 0.0,
        pitch: 0.0,
        yaw: 0.0,
        autodepth: false,
        autoheading: false,
      });
    }
  });

  // Handles receiving data
  client.on('data', function(buf) {
    if (messageProtocol === messageProtocols.old) {
      let data = decodeData(buf);
      // console.log(`\n[${Date.now()}] Recieved data from server:`);
      // console.log(data);
      global.fromROV = data;
      sendMessage('data-received');
      sendData(client, global.toROV);
      sendMessage('data-sent');
    } else if (messageProtocol === messageProtocols.IMC) {
      decodeImcData(buf);
      sendIMCData(client);
    }
  });

  // Tries to connect again if server is not opened yet
  client.on('error', function(err) {
    const { code } = err;
    if (code === 'ECONNREFUSED') {
      if (connectionAttempts < limitAttempts) {
        connectionAttempts += 1;
        console.log('Connection attempt failed. Trying again in 500ms..');
        setTimeout(getConnectedClient, 500);
      } else {
        console.log(
          `Giving up after ${connectionAttempts + 1} connection attempts. `,
        );
        connectionAttempts = 0;
      }
      client.destroy();
    }
  });
  return client;
}

function sendData(client, data) {
  /**
   * data should be a object with these fields:
   * {'surge': number,
   *  'sway': number,
   *  'heave': number,
   *  'roll': number,
   *  'pitch': number,
   *  'yaw': number,
   *  'autodepth': bool,
   *  'autoheading': bool,
   * }
   */
  let buf = encodeData(data);
  //console.log(`\n[${Date.now()}] Sending byte array with data:`);
  //console.log(data);
  client.write(buf);
}

function decodeImcData(buf) {
  const recievedData = decode(buf);

  // Update mode
  /*
  global.mode = {
    currentMode: 0,
    nfAvailable: false,
    dpAvailable: false,
  };
*/
  const entityState = recievedData[messages.entityState];
  global.mode.nfAvailable = entityState.flags.NF;
  global.mode.dpAvailable = entityState.flags.DP;
  // TODO: Handle when ROV tells state is MANUAL

  const estimatedState = recievedData[messages.estimatedState];
  global.fromROV = {
    north: estimatedState.x,
    east: estimatedState.y,
    down: estimatedState.z,
    roll: estimatedState.phi,
    pitch: estimatedState.theta,
    yaw: estimatedState.psi,
  };
  sendMessage('data-received');
}

function sendIMCData(client) {
  /*
  global.toROV = {
    surge: 0.0,
    sway: 0.0,
    heave: 0.0,
    roll: 0.0,
    pitch: 0.0,
    yaw: 0.0,
    autodepth: false,
    autoheading: false,
  };
  */
  let buf;
  if (global.mode.currentMode === 0) {
    // MANUAL MODE
    const desiredControl = {
      x: global.toROV.surge,
      y: global.toROV.sway,
      z: global.toROV.autodepth ? 0 : global.toROV.heave,
      k: 0.0,
      m: global.toROV.pitch,
      n: global.toROV.autoheading ? 0 : global.toROV.yaw,
      flags: {
        x: false,
        y: false,
        z: global.toROV.autodepth,
        k: true,
        m: false,
        n: global.toROV.autoheading,
      },
    };
    buf = encode.desiredControl(desiredControl);
    global.toROVIMC = {};
    global.toROVIMC.desiredControl = desiredControl;
    let desiredZ;
    let desiredHeading;

    if (global.toROV.autodepth) {
      desiredZ = {
        value: global.toROV.heave,
        z_units: 0,
      };

      /*eslint-disable */
      const lowLevelControlManeuverDesiredZBuf = encode.lowLevelControlManeuver.desiredZ(
        /*eslint-enable */
        desiredZ,
        10,
      );
      buf = Buffer.concat(
        [buf, lowLevelControlManeuverDesiredZBuf],
        buf.length + lowLevelControlManeuverDesiredZBuf.length,
      );
    }

    if (global.toROV.autoheading) {
      desiredHeading = { value: global.toROV.yaw };
      /*eslint-disable */
      const lowLevelControlManeuverDesiredHeadingBuf = encode.lowLevelControlManeuver.desiredHeading(
        /*eslint-enable */

        desiredHeading,
        10,
      );
      buf = Buffer.concat(
        [buf, lowLevelControlManeuverDesiredHeadingBuf],
        buf.length + lowLevelControlManeuverDesiredHeadingBuf.length,
      );
    }
    if (desiredZ || desiredHeading) {
      global.toROVIMC.lowLevelControlManeuver = {};
    }
    if (desiredZ) {
      global.toROVIMC.lowLevelControlManeuver.desiredZ = desiredZ;
    }
    if (desiredHeading) {
      global.toROVIMC.lowLevelControlManeuver.desiredZ = desiredHeading;
    }
  }
  if (global.mode.currentMode === 1) {
    // DYNAMIC POSITIONING

    // TODO: Get proper value from global state
    buf = encode.goTo({
      timeout: 10,
      lat: 1.1,
      lon: 2.2,
      z: global.toROV.heave,
      z_units: 0,
      speed: 0.1,
      speed_units: 0,
      roll: 0,
      pitch: global.toROV.pitch,
      yaw: global.toROV.yaw,
    });
  }

  if (global.mode.currentMode === 2) {
    // NET FOLLOWING

    /*
    global.netfollowing = {
      distance: 0,
      velocity: 0,
      degree: 0,
      depth: 0,
    };
*/
    buf = encode.netFollow({
      timeout: 10,
      d: global.netfollowing.distance,
      v: global.netfollowing.velocity,
      z: global.netfollowing.depth,
      z_units: 0,
    });
  }

  client.write(buf);
  sendMessage('data-sent');
}

module.exports = { getConnectedClient, sendData };
