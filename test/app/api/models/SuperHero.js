const Model = require('proton-mongoose-model')


module.exports = class SuperHero extends Model {

  schema() {
    return {
      name: String,
      realName: String,
      weight: Number,
      powers: String
    }
  }

}
