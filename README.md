### State Machine

Create an imperative programming environment with just a few commands.

Example
```
var FSM = require('../index');
var States = new FSM();

States.on(['sayHi', 'doSomething', 'help']);

States.on('doSomething', {
  a: 'integer',
  b: 'integer'
}, function(q, input) {
  console.log(input.a + input.b);
});

States.on('sayHi', [{
  name: 'string?'
}, {
  name: 'string',
  age: 'integer'
}
],
function(q, input) {
  if (input.age) {
    console.log(`${input.name} is ${input.age} years old `);
  } else {
    console.log(`Hi ${input.name || 'Fred'}`);
  }
});

States.on('help', function() {
  console.log('Commands: ' + 'sayHi, doSomething.');
});

States.done();
```

Output:
```
States.input('help'); // Commands: sayHi, doSomething.
States.input('doSomething 3 100'); // 103
States.input('sayHi Obama'); // Hi Obama
States.input('sayHi Tom 58'); // Tom is 58 years old

States.input('doSomething thomas'); // Error:

[Error: Illegal parameters specified for command 'doSomething'.
  Possible commands include:    doSomething [ a : integer ][ b : integer ]
]

States.input('sayHi 4000'); // Error:

[Error: Illegal parameters specified for command 'sayHi'.
  Possible commands include:    sayHi [ name : string? ]
]
```
See example/example.js and example/simple.js for more.

### Tutorial

Define your states:

```
States.on([
  'list',
  'buy',
  'sell',
  'help'
]);

// Call States.done() after you declare all your states using States.on()
States.done();

// To execute, call
States.input(/*desired input*/);
```

Here's a very straight forward state with no inputs.
```
States.on('help', function() {
  console.log('Commands: ' + 'see, list, sell, create, buy.');
});
```

Define inputs and outputs.

```
States.on(
  'see', // The state to describe
  [
    {
      contractId: 'integer' // This object represents one potential input that
                            // your machine recieves.
    },
    'buy',                  // 'buy' is a state accessible only from 'see' state
    'sell'                  // so is 'sell'.
  ],
  function(q, input) {
    // q is used to keep track of transitional variables.
    // input is auto populated with the types you defined above.

    q.contractId = input.contractId; // contractId will be type integer
    // sendPurchase(input.contractId);
});
```

Auto-execute another state just as easily:
```
States.on('sell', [
  {
    id: 'string'
  },
  'confirm'
], function(q, input) {
  q.goto('confirm', input.id);
});
```

Optional parameters
```
States.on('list', [{
  which: 'string?',
  who: 'string?'
}],
function(q, input) {

});
```
