'use strict'

const Koa = require('koa')
let path = require('path')


module.exports = class Proton extends Koa {

  constructor(app, quarks) {
    super()
    this.events = []
    this.app = app
    this.app.config = require('require-all')(this.paths.config)
    this.quarks = this.instantiateQuarks(quarks)
  }

  instantiateQuarks(quarks) {
    quarks = quarks || require(`${this.app.path}/config/quarks.js`)
    return quarks.map(Quark => new Quark(this))
  }

  get enviroment() {
    return process.env.NODE_ENV || this.app.config.web.environment || 'development'
  }

  get log() {
    return this.app.config.log
  }

  get paths() {
    return {
      config: path.join(this.app.path, '/config'),
      api: path.join(this.app.path, '/api'),
      root: this.app.path
    }
  }

  expose() {
    global.proton = this
  }

  start() {
    return new Promise(resolve => {
      this.expose()
      this.listenForQuarksLifecycleCompletion()
      // Initialize the quarks
      this.initQuarks()
      // When all the quarks are ready for his use the server must be initialized
      this.once('quarks:ready', () => {
        const server = this.runServer()
        resolve(server)
      })
    })
  }

  /**
   * @description This method takes all the quarks used by the app an
   * by each of them execute the default life cycle methods
   * @author Luis Hernandez
   */
  initQuarks() {
    try {
      this.quarks.map(quark => {
        quark.validate()
          .then(() => {
            quark.emit(`quark:${quark.name}:valid`)
            return quark.configure()
          })
          .then(() => {
            quark.emit(`quark:${quark.name}:config`)
            return quark.initialize()
          })
          .then(() => quark.emit(`quark:${quark.name}:init`))
          .catch(console.log)
      })
    } catch(err) {
      console.log(err)
      process.exit(1)
    }
  }

  runServer() {
    const port = this.app.config.web.port || 8443
    this.log.info('Ready for listen events on port', port, ' :)')
    return this.listen(port)
  }

  listenForQuarksLifecycleCompletion() {
    const events = this.getQuarksLifeCycleCompletionEvents()
    this.after(events.configured, () => this.emit('quarks:configured'))
    this.after(events.validated, () => this.emit('quarks:validated'))
    this.after(events.initialized, () => this.emit('quarks:ready'))
  }

  getQuarksLifeCycleCompletionEvents() {
    return this.quarks.reduce((events, q) => {
      events.configured.push(`quark:${q.name}:config`)
      events.validated.push(`quark:${q.name}:valid`)
      events.initialized.push(`quark:${q.name}:init`)
      return events
    }, { configured: [], validated: [], initialized: [] })
  }

  async after(events, cb) {
    try {
      const promises = []
      events = !Array.isArray(events) ? [events] : events
      events.map(event => {
        if (this.events[event]) {
          promises.push(Promise.resolve(event))
        } else {
          promises.push(new Promise(r => this.on(event, () => r(event))))
        }
      })
      await Promise.all(promises)
      cb()
    } catch (err) {
      console.log(err)
    }

  }

}
