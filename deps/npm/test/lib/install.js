const { test } = require('tap')

const install = require('../../lib/install.js')
const requireInject = require('require-inject')

test('should install using Arborist', (t) => {
  const SCRIPTS = []
  let ARB_ARGS = null
  let REIFY_CALLED = false
  let ARB_OBJ = null

  const install = requireInject('../../lib/install.js', {
    '../../lib/npm.js': {
      globalDir: 'path/to/node_modules/',
      prefix: 'foo',
      flatOptions: {
        global: false,
      },
      config: {
        get: () => true,
      },
    },
    '@npmcli/run-script': ({ event }) => {
      SCRIPTS.push(event)
    },
    npmlog: {
      warn: () => {},
    },
    '@npmcli/arborist': function (args) {
      ARB_ARGS = args
      ARB_OBJ = this
      this.reify = () => {
        REIFY_CALLED = true
      }
    },
    '../../lib/utils/reify-finish.js': arb => {
      if (arb !== ARB_OBJ)
        throw new Error('got wrong object passed to reify-finish')
    },
  })

  t.test('with args', t => {
    install(['fizzbuzz'], er => {
      if (er)
        throw er
      t.match(ARB_ARGS, { global: false, path: 'foo' })
      t.equal(REIFY_CALLED, true, 'called reify')
      t.strictSame(SCRIPTS, [], 'no scripts when adding dep')
      t.end()
    })
  })

  t.test('just a local npm install', t => {
    install([], er => {
      if (er)
        throw er
      t.match(ARB_ARGS, { global: false, path: 'foo' })
      t.equal(REIFY_CALLED, true, 'called reify')
      t.strictSame(SCRIPTS, [
        'preinstall',
        'install',
        'postinstall',
        'prepublish',
        'preprepare',
        'prepare',
        'postprepare',
      ], 'exec scripts when doing local build')
      t.end()
    })
  })

  t.end()
})

test('should ignore scripts with --ignore-scripts', (t) => {
  const SCRIPTS = []
  let REIFY_CALLED = false
  const install = requireInject('../../lib/install.js', {
    '../../lib/utils/reify-finish.js': async () => {},
    '../../lib/npm.js': {
      globalDir: 'path/to/node_modules/',
      prefix: 'foo',
      flatOptions: {
        global: false,
        ignoreScripts: true,
      },
      config: {
        get: () => false,
      },
    },
    '@npmcli/run-script': ({ event }) => {
      SCRIPTS.push(event)
    },
    '@npmcli/arborist': function () {
      this.reify = () => {
        REIFY_CALLED = true
      }
    },
  })
  install([], er => {
    if (er)
      throw er
    t.equal(REIFY_CALLED, true, 'called reify')
    t.strictSame(SCRIPTS, [], 'no scripts when adding dep')
    t.end()
  })
})

test('should install globally using Arborist', (t) => {
  const install = requireInject('../../lib/install.js', {
    '../../lib/utils/reify-finish.js': async () => {},
    '../../lib/npm.js': {
      globalDir: 'path/to/node_modules/',
      prefix: 'foo',
      flatOptions: {
        global: true,
      },
      config: {
        get: () => false,
      },
    },
    '@npmcli/arborist': function () {
      this.reify = () => {}
    },
  })
  install([], er => {
    if (er)
      throw er
    t.end()
  })
})

test('completion to folder', async t => {
  const install = requireInject('../../lib/install.js', {
    '../../lib/utils/reify-finish.js': async () => {},
    util: {
      promisify: (fn) => fn,
    },
    fs: {
      readdir: (path) => {
        if (path === '/')
          return ['arborist']
        else
          return ['package.json']
      },
    },
  })
  const res = await install.completion({ partialWord: '/ar' })
  const expect = process.platform === 'win32' ? '\\arborist' : '/arborist'
  t.strictSame(res, [expect], 'package dir match')
  t.end()
})

test('completion to folder - invalid dir', async t => {
  const install = requireInject('../../lib/install.js', {
    '../../lib/utils/reify-finish.js': async () => {},
    util: {
      promisify: (fn) => fn,
    },
    fs: {
      readdir: () => {
        throw new Error('EONT')
      },
    },
  })
  const res = await install.completion({ partialWord: 'path/to/folder' })
  t.strictSame(res, [], 'invalid dir: no matching')
  t.end()
})

test('completion to folder - no matches', async t => {
  const install = requireInject('../../lib/install.js', {
    '../../lib/utils/reify-finish.js': async () => {},
    util: {
      promisify: (fn) => fn,
    },
    fs: {
      readdir: (path) => {
        return ['foobar']
      },
    },
  })
  const res = await install.completion({ partialWord: '/pa' })
  t.strictSame(res, [], 'no name match')
  t.end()
})

test('completion to folder - match is not a package', async t => {
  const install = requireInject('../../lib/install.js', {
    '../../lib/utils/reify-finish.js': async () => {},
    util: {
      promisify: (fn) => fn,
    },
    fs: {
      readdir: (path) => {
        if (path === '/')
          return ['arborist']
        else
          throw new Error('EONT')
      },
    },
  })
  const res = await install.completion({ partialWord: '/ar' })
  t.strictSame(res, [], 'no name match')
  t.end()
})

test('completion to url', async t => {
  const res = await install.completion({ partialWord: 'http://path/to/url' })
  t.strictSame(res, [])
  t.end()
})

test('completion', async t => {
  const res = await install.completion({ partialWord: 'toto' })
  t.notOk(res)
  t.end()
})
