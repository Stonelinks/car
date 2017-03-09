import _ from 'underscore'

export default {

  Servo: function (config) {
    this.id = _.uniqueId('servo-')
    this.value = 0

    this.to = (v) => {
      console.log(`${this.id} move ${v}`)
      this.value = v
    }

    return this
  },

  ESC: function (config) {
    this.id = _.uniqueId('ESC-')
    this.value = 0

    this.stop = () => {
      console.log(`${this.id} stop`)
      this.value = 0
    }

    this.speed = (v) => {
      console.log(`${this.id} speed ${v}`)
      this.value = v
    }

    return this
  },

  Board: function () {
    this.on = (_, cb) => {
      cb()
    }
    return this
  }
}
