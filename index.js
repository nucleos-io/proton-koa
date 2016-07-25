'use strict'

const Koa = require('koa')
const bodyParser = require('koa-bodyparser');


module.exports = class Proton extends Koa {

  constructor(app) {
    super()
    this.app = app
  }

  start() {
    this.expose()
    this._initQuarks()
    this.middleware.unshift(bodyParser())
    const port = this.app.config.web.port || 8443
    this.log.info('Ready for listen events on port', port, ' :)')
    return this.listen(port)
  }

  get enviroment() {
    return process.env.NODE_ENV || this.app.config.web.environment || 'development'
  }

  get log() {
    return this.app.config.log
  }

  _initQuarks() {
    this._loadCoreQuarks()
    this._loadCustomQuarks()
    this._loadBootstrapQuark()
  }

  _loadCoreQuarks() {
    this._loadQuarks(require('./quarks'))
  }

  _loadCustomQuarks() {
    this._loadQuarks(this.app.config.quarks)
  }

  _loadBootstrapQuark() {
    this._loadQuarks([require('proton-quark-bootstrap')])
  }

  _loadQuarks(quarks) {
    quarks.map(Quark => {
      const quark = new Quark(this)
      quark.validate()
      quark.configure()
      quark.initialize()
    })
  }

  expose() {
    global.proton = this
  }

}
