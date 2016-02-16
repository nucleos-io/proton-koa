'use strict'

const Koa = require('koa')
const _ = require('lodash')
const bodyParser = require('koa-bodyparser');


module.exports = class Proton extends Koa {

  constructor(app) {
    super()
    this.app = app
  }

  start() {
    this.use(bodyParser())
    this._initQuarks()
    this.expose()
    return this.listen(this.app.config.web.port || 8443)
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
  }

  _loadCoreQuarks() {
    this._loadQuarks(require('./quarks'))
  }

  _loadCustomQuarks() {
    this._loadQuarks(this.app.config.quarks)
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
