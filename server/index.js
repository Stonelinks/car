import http from 'http'
import express from 'express'
import {Server as WebSocketServer} from 'ws'

const httpServer = http.createServer()
const app = express()

import camera from './camera'
import car from './car'

app.use(express.static('public'))

app.set('port', (process.env.REACT_APP_WEB_SERVER_PORT || 4003))

// only serve static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static('client/build'))
}

let wssOptions = {}

// turn off CORS if running websocket on different port
if (process.env.REACT_APP_WSS_PORT) {
  console.log(`websocket listening on ${process.env.REACT_APP_WSS_PORT}`)
  wssOptions.port = process.env.REACT_APP_WSS_PORT
  console.log('turn off CORS')
  app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
    next()
  })
} else {
  console.log(`websocket listening on ${app.get('port')}`)
  wssOptions.server = httpServer
}

const wss = new WebSocketServer(wssOptions)

camera(app, wss)
car(app, wss)

// start the server
httpServer.on('request', app)
httpServer.listen(app.get('port'), () => {
  console.log(`Find the server at: http://localhost:${app.get('port')}/`)
})
