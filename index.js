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
    // Initialize the quarks
    this.initializeQuarks()
    // When all the quarks are ready for his use the server must be initialized
    this.once('quarks:ready', () => this.runServer())
  }

  /**
   * @description This method takes all the quarks used by the app an
   * by each of them execute the default life cycle methods
   * @author Luis Hernandez
   */
  async initQuarks() {
    this.quarks.map(async function(Quark) {
      const quark = new Quark(this)
      await Promise.all([
        validateQuark(quark), configureQuark(quark), initializeQuark(quark)
      ])
    })
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
    this.after(events.initialised, () => this.emit('quark:all:initialized'))
  }

  getQuarksLifeCycleCompletionEvents() {
    return this.quarks.reduce((events, q) => {
      events.configured.push(`quark:${q.name}:config`)
      events.validated.push(`quark:${q.name}:valid`)
      events.initialized.push(`quark:${q.name}:init`)
      return events
    }, { configured: [], validated: [], initialized: [] })
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
