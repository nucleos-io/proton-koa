const Controller = require('proton-controller')

module.exports = class SuperHeroController extends Controller {

  * find() {
    try {
      const superheros = yield SuperHero.find()
      this.response.body = superheros
    } catch(err) {
      proton.log.error('A error ocurred finding the superheros')
      this.response.status = 400
    }
  }

}
