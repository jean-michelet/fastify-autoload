'use strict'

const { test } = require('tap')
const Fastify = require('fastify')
const path = require('path')

// should not fail if argv and execArgv are falsy
function requireAutoload () {
  const path = require.resolve('../../..')
  delete require.cache[path]

  const originalArgv = process.argv
  const originalExecArgv = process.execArgv

  process.argv = false
  process.execArgv = false

  const autoload = require('../../..')

  process.argv = originalArgv
  process.execArgv = originalExecArgv

  delete require.cache[path]

  return autoload
}

const autoload = requireAutoload()

test('Should throw an error when trying to load invalid hooks', async (t) => {
  const app = Fastify()
  app.register(autoload, {
    dir: path.join(__dirname, 'invalid-autohooks'),
    autoHooks: true
  })

  await t.rejects(app.ready(), new SyntaxError(`Unexpected identifier at ${path.join(__dirname, 'invalid-autohooks/.autohooks.js')}:1`))
})

test('Should throw an error when trying to import hooks plugin using index.ts if typescriptSupport is not enabled', async (t) => {
  const app = Fastify()
  app.register(autoload, {
    dir: path.join(__dirname, 'invalid-index-type'),
    autoHooks: true
  })

  await t.rejects(app.ready(), new Error(`@fastify/autoload cannot import hooks plugin at '${path.join(__dirname, 'invalid-index-type/index.ts')}'. To fix this error compile TypeScript to JavaScript or use 'ts-node' to run your app.`))
})

test('Should not accumulate plugin if doesn\'t comply to matchFilter', async (t) => {
  const app = Fastify()
  app.register(autoload, {
    dir: path.join(__dirname, 'routes')
  })

  await app.ready()

  const res = await app.inject({
    url: '/'
  })

  t.equal(res.statusCode, 200)

  const app2 = Fastify()
  app2.register(autoload, {
    dir: path.join(__dirname, 'routes'),
    matchFilter: /invalid/
  })

  await app2.ready()

  const res2 = await app2.inject({
    url: '/'
  })

  t.equal(res2.statusCode, 404)
})

test('Should be able to filter paths using a string', async (t) => {
  const app = Fastify()
  app.register(autoload, {
    dir: path.join(__dirname, 'routes'),
    matchFilter: 'routes.js'
  })

  await app.ready()

  const res = await app.inject({
    url: '/'
  })

  t.equal(res.statusCode, 200)

  const app2 = Fastify()
  app2.register(autoload, {
    dir: path.join(__dirname, 'routes'),
    matchFilter: 'invalid-path'
  })

  await app2.ready()

  const res2 = await app2.inject({
    url: '/'
  })

  t.equal(res2.statusCode, 404)
})

test('Should be able to filter paths using a function', async (t) => {
  const app = Fastify()
  app.register(autoload, {
    dir: path.join(__dirname, 'routes'),
    matchFilter: (path) => path.includes('routes.js')
  })

  await app.ready()

  const res = await app.inject({
    url: '/'
  })

  t.equal(res.statusCode, 200)

  const app2 = Fastify()
  app2.register(autoload, {
    dir: path.join(__dirname, 'routes'),
    matchFilter: (path) => path.includes('invalid-path')
  })

  await app2.ready()

  const res2 = await app2.inject({
    url: '/'
  })

  t.equal(res2.statusCode, 404)
})

test('Should not accumulate plugin if ignoreFilter is matched', async (t) => {
  const app = Fastify()
  app.register(autoload, {
    dir: path.join(__dirname, 'routes'),
    ignoreFilter: /\/not-exists.js/
  })

  await app.ready()

  const res = await app.inject({
    url: '/'
  })

  t.equal(res.statusCode, 200)

  const app2 = Fastify()
  app2.register(autoload, {
    dir: path.join(__dirname, 'routes'),
    ignoreFilter: /\/routes.js/,
    autoHooks: true
  })

  await app2.ready()

  const res2 = await app2.inject({
    url: '/'
  })

  t.equal(res2.statusCode, 404)
})

test('Should not set skip-override if hook plugin is not a function or async function', async (t) => {
  const app = Fastify()
  app.register(autoload, {
    dir: path.join(__dirname, 'routes'),
    autoHooks: true,
    cascadeHooks: true
  })

  app.decorateRequest('hooked', '')

  await app.ready()

  const res = await app.inject({
    url: '/child'
  })

  t.equal(res.statusCode, 200)
  t.same(JSON.parse(res.payload), { hooked: ['root', 'child'] })

  const res2 = await app.inject({
    url: '/promisified'
  })

  t.equal(res2.statusCode, 200)
  t.same(JSON.parse(res2.payload), { hooked: ['root'] })
})

test('Should not enrich non-SyntaxError', async (t) => {
  const app = Fastify()
  app.register(autoload, {
    dir: path.join(__dirname, 'non-SyntaxError'),
    autoHooks: true
  })

  t.rejects(app.ready(), new ReferenceError('x is not defined'))
})
