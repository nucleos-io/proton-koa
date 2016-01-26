'use strict'

let Koa = require('koa')
let _ = require('lodash')

module.exports = class Proton extends Koa {

  constructor(app) {
    super()
    this.app = app
  }

  start() {
    this._initHooks()
    return this.listen(this.app.config.web.port || 8443)
  }

  get enviroment() {
    return process.env.NODE_ENV || this.app.config.web.environment || 'development'
  }

  get log() {
    return this.app.config.log
  }

  _initHooks() {
    this._loadCoreHooks()
    this._loadConfigHooks()
  }

  _loadCoreHooks() {
    this._loadHooks(require('./hooks'))
  }

  _loadConfigHooks() {
    this._loadHooks(this.app.config.hooks)
  }

  _loadHooks(hooks) {
    hooks.map(Hook => {
      let hook = new Hook(this)
      hook.validate()
      hook.configure()
      hook.initialize()
    })
  }

}
