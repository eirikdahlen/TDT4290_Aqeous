const exec = require('child_process').exec;

function execute(command, callback) {
  exec(command, (error, stdout) => {
    callback(stdout);
  });
}

function launchSimulator(command) {
  execute(command, () => {});
}

module.exports = { launchSimulator };
