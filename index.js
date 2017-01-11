'use strict'

const Koa = require('koa')
const bodyParser = require('koa-bodyparser');


module.exports = class Proton extends Koa {

  constructor(app, quarks = []) {
    super()
    this.events = []
    this.quarks = (app) ? require(`${app}/config/quarks.js`) : quarks
    this.app = app
  }

  get enviroment() {
    return process.env.NODE_ENV || this.app.config.web.environment || 'development'
  }

  get log() {
    return this.app.config.log
  }

  expose() {
    global.proton = this
  }

  start() {
    this.listenForQuarksLifecycleCompletion()
    this.initializeQuarks()
    this.once('quark:all:initialize', () => {
      const port = this.app.config.web.port || 8443
      this.expose()
      this.listen(port)
      this.log.info('Ready for listen events on port', port, ' :)')
    })
  }

  initializeQuarks() {
    this.quarks.map(Quark => {
      const quark = new Quark(this)
      quark.validate().then(() => {
        quark.emit(`quark:${quark.name}:validate`)
      })
      this.after('quark:all:validate', () => {
        quark.configure().then(() => {
          quark.emit(`quark:${quark.name}:configure`)
        })
      })
      this.after('quark:all:configure', () => {
        quark.initialize().then(() => {
          quark.emit(`quark:${quark.name}:initialize`)
        })
      })
    })
  }

  listenForQuarksLifecycleCompletion() {
    const events = this.getQuarksLifeCycleCompletionEvents()
    this.after(events.configured, () => this.emit('quark:all:configure'))
    this.after(events.validated, () => this.emit('quark:all:validate'))
    this.after(events.initialised, () => this.emit('quark:all:initialize'))
  }

  getQuarksLifeCycleCompletionEvents() {
    return this.quarks.reduce((events, q) => {
      events.configured.push(`quark:${q.name}:configure`)
      events.validated.push(`quark:${q.name}:validate`)
      events.initialised.push(`quark:${q.name}:initialize`)
      return events
    }, { configured: [], validated: [], initialised: [] })
  }

  after(events, cb) {
    const promises = []
    events = !Array.isArray(events) ? [events] : events
    events.map(event => {
      if (this.events[event]) {
        promises.push(Promise.resolve())
      } else {
        promises.push(new Promise(resolve => this.once(event, () => resolve())))
      }
    })
    Promise.all(promises).then(() => cb())
  }

}
