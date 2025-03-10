import path from 'node:path'
import { fileURLToPath } from 'node:url'

import autoload from '../../../index.js'

const { dirname } = path
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default async function (fastify, opts) {
  fastify.register(autoload, {
    dir: path.join(__dirname, 'routes'),
    autoHooks: false // disabling specifically for testing clarity, default state is disabled
  })
}
