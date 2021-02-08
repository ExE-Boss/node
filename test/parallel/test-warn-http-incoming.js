'use strict';

const common = require('../common');

// _http_incoming is deprecated.

common.expectWarning(
  'DeprecationWarning',
  'The _-prefixed built-in modules are deprecated.',
  'DEP0XXX',
);

require('_http_incoming');
