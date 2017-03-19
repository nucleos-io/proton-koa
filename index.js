'use strict'

const Koa = require('koa')
const bodyParser = require('koa-bodyparser');


module.exports = class Proton extends Koa {

  constructor(app, quarks) {
    super()
    this.events = []
    this.app = app
    this.quarks = this.instantiateQuarks(quarks)
  }

  instantiateQuarks(quarks) {
    quarks = quarks || require(`${this.app.path}/config/quarks.js`)
    quarks.unshift(require('proton-quark-configurations'))
    return quarks.map(Quark => new Quark(this))
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
    return new Promise(resolve => {
      this.listenForQuarksLifecycleCompletion()
      // Initialize the quarks
      this.initQuarks()
      // When all the quarks are ready for his use the server must be initialized
      this.once('quarks:ready', () => {
        this.runServer()
        resolve(this)
      })
    })
  }

  /**
   * @description This method takes all the quarks used by the app an
   * by each of them execute the default life cycle methods
   * @author Luis Hernandez
   */
  async initQuarks() {
    try {
      const self = this
      this.quarks.map(async function(quark) {
        await Promise.all([
          self.validateQuark(quark), self.configureQuark(quark), self.initializeQuark(quark)
        ])
      })
    } catch(err) {
      console.log(err)
      process.exit(1)
    }
  }

  /**
   * @description This method execute validate method of the quark and emit
   * that this quark has been initialized
   * @param quark
   * @author Luis Hernandez
   */
  async validateQuark(quark) {
    await quark.validate()
    quark.emit(`quark:${quark.name}:valid`)
  }

  async configureQuark(quark) {
    await quark.configure()
    quark.emit(`quark:${quark.name}:config`)
  }

  async initializeQuark(quark) {
    await quark.initialize()
    quark.emit(`quark:${quark.name}:init`)
  }

  runServer() {
    const port = this.app.config.web.port || 8443
    this.expose()
    this.listen(port)
    this.log.info('Ready for listen events on port', port, ' :)')
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
