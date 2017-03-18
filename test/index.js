const Proton = require('../index.js')


describe('Framework tests', () => {

  let app = ''

  it('instance the framework', () => {
    app = new Proton(undefined, [require('./quarks.js')])
  })

  it('start the framework', () => {
    app.start()
  })

})
