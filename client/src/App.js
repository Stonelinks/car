import React from 'react'

import Broadway from 'broadwayjs'

const {
  protocol,
  hostname,
  host
 } = window.location

const {
  REACT_APP_BROADWAY_PLAYER_WORKER,
  REACT_APP_WSS_PORT
} = process.env

const {
  XMLHttpRequest,
  Blob,
  BlobBuilder,
  URL,
  WebSocket
 } = window


const CAM_WIDTH = 320 * 2
const CAM_HEIGHT = 240 * 2
const WIDTH = 1.5 * CAM_WIDTH
const HEIGHT = 1.5 * CAM_HEIGHT
const WSS_ADDRESS = `${(protocol === 'https:' ? 'wss' : 'ws')}://${(REACT_APP_WSS_PORT ? hostname + ':' + REACT_APP_WSS_PORT : host)}`

navigator.serviceWorker.getRegistrations().then(function (registrations) {
  for (let registration of registrations) {
    registration.unregister()
  }
})

class WebCam extends React.Component {
  get style () {
    return {
      maxHeight: `${HEIGHT}px`,
      maxWidth: `${WIDTH}px`,
      height: 'auto',
      width: '100%'
    }
  }

  componentDidMount () {
    const decoderURL = (REACT_APP_BROADWAY_PLAYER_WORKER ? `${protocol}//${hostname}${REACT_APP_BROADWAY_PLAYER_WORKER}` : '/Decoder.js')
    var response

    var get = new XMLHttpRequest()
    get.open('GET', decoderURL, false)
    get.onreadystatechange = function () {
      if (get.readyState === 4 && get.status === 200) {
        response = `var global = {};\n${get.responseText}`
      }
    }
    get.send()

    var blob
    try {
      blob = new Blob([response], { type: 'application/javascript' })
    } catch (e) {
      window.BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder
      blob = new BlobBuilder()
      blob.append(response)
      blob = blob.getBlob()
    }

    var p = new Broadway.Player({
      useWorker: true,
      workerFile: URL.createObjectURL(blob),
      reuseMemory: true,
      size: {
        height: CAM_HEIGHT,
        width: CAM_WIDTH
      }
    })

    this.container.appendChild(p.canvas)
    for (var k in this.style) {
      if (k !== 'margin') {
        p.canvas.style[k] = this.style[k]
      }
    }

    this.props.onBinaryData((frameData) => {
      const frame = new Uint8Array(frameData)
      p.decode(frame)
    })
  }

  render () {
    return (
      <div
        ref={(c) => { this.container = c }}
        style={this.style} />
    )
  }
}

/* class JointSlider extends Component {
  constructor (props) {
    super(props)

    const joint = this.props.joint

    this.state = {
      angle: (joint.range[0] + joint.range[1]) / 2.0
    }

    this.onSliderChange = this.onSliderChange.bind(this)

    this.props.onStringData((stringData) => {
      const msg = JSON.parse(stringData)
      if (msg.name === joint.name) {
        this.setState({
          angle: msg.angle
        })
      }
    })
  }

  onSliderChange (value) {
    this.props.ws.send(JSON.stringify({
      name: this.props.joint.name,
      angle: value
    }))

    this.setState({
      angle: value
    })
  }

  render () {
    const joint = this.props.joint
    return (
      <div
        style={{marginTop: '30px'}}>
        <Rcslider
          min={joint.range[0]}
          max={joint.range[1]}
          value={this.state.angle}
          onChange={this.onSliderChange} />
      </div>
    )
  }
} */

class App extends React.Component {
  constructor (props) {
    super(props)

    console.log(`websocket address: ${WSS_ADDRESS}`)
    this.ws = new WebSocket(WSS_ADDRESS)
    this.ws.binaryType = 'arraybuffer'

    this.binaryListeners = []
    this.stringListeners = []
    this.ws.onmessage = (e) => {
      let arr = null
      if (e.data instanceof ArrayBuffer) {
        arr = this.binaryListeners
      } else {
        arr = this.stringListeners
      }
      arr.forEach((listener) => {
        listener(e.data)
      })
    }

    this.onStringData = this.onStringData.bind(this)
    this.onBinaryData = this.onBinaryData.bind(this)
  }

  onStringData (cb) {
    this.stringListeners.push(cb)
  }

  onBinaryData (cb) {
    this.binaryListeners.push(cb)
  }

  /* get sliders () {
    return robotConfig.devices.joints.map((joint) => {
      return <JointSlider
        key={joint.name}
        joint={joint}
        ws={this.ws}
        onStringData={this.onStringData} />
    })
  } */

  render () {
    return (
      <div style={{textAlign: 'center'}}>
        <div
          style={{
            backgroundColor: '#222',
            padding: '10px',
            color: 'white'
          }}>
          <h2>Luke's Car</h2>
        </div>
        <div
          style={{
            maxWidth: `${WIDTH}px`,
            width: '100%',
            margin: '0 auto'
          }}>
          <WebCam onBinaryData={this.onBinaryData} />
        </div>
      </div>
    )
  }
}

export default App
