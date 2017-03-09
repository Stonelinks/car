
// import robotConfig from '../robotConfig'

import * as Constants from '../constants'
import realFive from 'johnny-five'
import fiveMock from './_mocks'

const five = process.env.NODE_ENV === 'production' ? realFive : fiveMock

const SERVO_MOVE_DURATION_MS = 500

const config = {
  name: 'car',
  steering: {
    pin: 2,
    range: [20, 160] // degrees
  },
  throttle: {
    pin: 9,
    device: 'FORWARD_REVERSE',
    neutral: 50,
    range: [0, 80]
  }
}

class Car {
  constructor () {
    this.name = config.name

    // steering
    const steeringConfig = config.steering
    this.steeringServo = new five.Servo(steeringConfig)
    console.log('steering initialized', steeringConfig)
    this.steeringAngle = (steeringConfig.range[0] + steeringConfig.range[1]) / 2.0
    this.steer(this.steeringAngle)

    // throttle
    const throttleConfig = config.throttle
    this.throttleESC = new five.ESC(throttleConfig)
    console.log('throttle initialized', throttleConfig)
    this.throttleESC.stop()
    // this.throttleESC.max()
    // this.throttleESC.speed(50)
    this.throttleValue = this.throttleESC.value

    // kill positions
    this.killSteering = this.steeringAngle
    this.killThrottle = this.throttle
  }

  steer (steeringAngle) {
    this.steeringAngle = parseInt(steeringAngle, 10)
    this.steeringServo.to(this.steeringAngle, SERVO_MOVE_DURATION_MS)
  }

  throttle (throttle) {
    this.throttleValue = parseInt(throttle, 10)
    this.throttleESC.speed(this.throttle)
  }

  onWSConnect (ws) {
    ws.on('message', (data) => {
      const msg = JSON.parse(data)

      switch (msg.name) {
        case Constants.STEERING_MSG:
          this.steer(parseFloat(msg.angle))
          break
        case Constants.THROTTLE_MSG:
          this.throttle(parseFloat(msg.throttle))
          break
        case Constants.KILL_MSG:
          this.steer(this.killSteering)
          this.throttle(this.killThrottle)
          break
        default:
          break
      }

      ws.broadcast(data)
      ws.send(data)
    })
  }

  onWSDisconnect () {
    console.log('car ws disconnect')
  }
}

export default function (app, wss) {
  const board = new five.Board({
    repl: false
  })

  board.on('ready', () => {
    const car = new Car()
    wss.on('connection', (ws) => {
      ws.broadcast = function (data) {
        wss.clients.forEach((client) => {
          if (client !== ws) {
            client.send(data)
          }
        })
      }
      car.onWSConnect(ws)

      ws.on('disconnect', () => {
        car.onWSDisconnect(ws)
      })
    })
  })
}
