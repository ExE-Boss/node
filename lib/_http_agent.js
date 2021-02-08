'use strict';

const { getOptionValue } = require('internal/options');
const pendingDeprecation = getOptionValue('--pending-deprecation');

module.exports = require('internal/http/agent');

if (pendingDeprecation && !process.noDeprecation) {
  process.emitWarning('The _-prefixed built-in modules are deprecated.',
                      'DeprecationWarning', 'DEP0XXX');
}
