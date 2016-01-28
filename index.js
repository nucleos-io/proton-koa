'use strict'

let Koa = require('koa')
let _ = require('lodash')

module.exports = class Proton extends Koa {

  constructor(app) {
    super()
    this.app = app
  }

  start() {
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
      let quark = new Quark(this)
      quark.validate()
      quark.configure()
      quark.initialize()
    })
  }

  expose() {
    global.proton = this
  }

}
