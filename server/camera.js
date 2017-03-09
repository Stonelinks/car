import express from 'express'

import { spawn } from 'child_process'
import Splitter from 'stream-split'

const WIDTH = 320 * 2
const HEIGHT = 240 * 2

const NALseparator = new Buffer([0, 0, 0, 1])
const splitter = new Splitter(NALseparator)

export default function (app, wss) {
  app.use(express.static('node_modules/broadwayjs/Player'))

  const source = spawn('avconv', [
    '-f', 'video4linux2',
    '-i', '/dev/video1',
    '-r', 30, // framerate
    '-s', WIDTH + 'x' + HEIGHT,
    '-pix_fmt', 'yuv420p',
    '-c:v', 'libx264',
    '-b:v', '600k',
    '-bufsize', '600k',
    '-vprofile', 'baseline',
    '-tune', 'zerolatency',
    '-f', 'rawvideo',
    '-'
  ])

  source.stdout.resume()

  // source.stderr.pipe(process.stderr)
  source.stdout.pipe(splitter)

  splitter.on('data', function (chunk) {
    try {
      wss.clients.forEach(function (client) {
        if (client.busy) {
          return
        }

        client.busy = true
        client.busy = false

        client.send(Buffer.concat([NALseparator, chunk]), {
          binary: true
        }, function () {
          client.busy = false
        })
      })
    } catch (e) {
      // ignore error
    }
  })
}
