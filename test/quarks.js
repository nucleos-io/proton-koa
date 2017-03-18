const Quark = require('proton-quark')

module.exports = class TestQuark extends Quark {

  initialize() {
    return new Promise(resolve => {
      resolve()
    })
  }

}
