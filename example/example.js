var FSM = require('../index');
var CLI = require('../lib/cli');

var States = new FSM();

States.on([
  'see',
  'list',
  'buy',
  'sell',
  'help'
]);

States.on('see', [
  {
    contractId: 'integer'
  },
  'buy',
  {
    contractId: 'string',
    messengerId: 'integer'
  },
  'sell'
], function(q) {
  console.log(q);
  // load data
  // return data
});

States.on('buy', {
  shares: 'integer',
  price: 'integer'
}, function(q) {
  console.log('buy', q.shares, q.price);
})

States.on('sell', {
  shares: 'integer',
  price: 'integer'
}, function(q) {
  debugger;
  console.log('sell', q.shares, q.price);
})

States.on('help', function(q) {
  console.log('Commands: ' + 'see, list, sell, buy.');
});

// auto parameter inference
States.on('list', function(q) {

  // display the market shares
  console.log('we\'ve arrived at the list');
});

States.done();

new CLI(States);
