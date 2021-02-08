'use strict';

const common = require('../common');

// _http_common is deprecated.

common.expectWarning(
  'DeprecationWarning',
  'The _-prefixed built-in modules are deprecated.',
  'DEP0XXX',
);

require('_http_common');
