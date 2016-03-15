const colors = require('colors')
  , readline = require('readline')
  , process = require('process');

module.exports = function(States) {
  var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
    historySize: 1000
  });

  console.log(colors.yellow('Type help for more options'));

  rl.setPrompt('>> ');
  rl.prompt();

  rl.on('line', function (cmd) {
    try {
      States.input(cmd);
    } catch(e) {
      console.log((e + '').red);
    }
    rl.prompt();
  });
};
