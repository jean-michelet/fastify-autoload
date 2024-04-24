'use strict'

module.exports = function (f: void, opts: void, next: void) {
  f.get('/something', (request, reply) => {
    reply.send({ something: 'else' })
  })

  next()
}
