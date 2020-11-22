import { Transform } from 'stream'
import cluster from 'cluster'

const createHole = () => {
  return new Transform({
    objectMode: true,
    transform(_,__,cb){
      cb()
    }
  })
}

class Delegator extends Transform {
  constructor (fn, nbrForks) {
    super({ objectMode: true })
    this.forks = []

    this.freeForks = []
    this.inputs = []
    this.hasError = false
    this.initiatedWorkes = new Set()

    for (let i = 0; i < nbrForks; i++) {
      this.forks.push(cluster.fork())
    }

    const initFork = (f) => {
      f.on('message', ({ isInit = false, isError, result }) => {
        if (!isInit) {
          if (isError) {
            this.hasError = true
            this.killForks()
            this.destroy(new Error(result))
          } else if(!this.hasError) {
            this.push(result)
            this.freeForks.push(f)
            this.processIfFreeFork()
          }
        }
      })
      this.freeForks.push(f)
      this.processIfFreeFork()
    }

    this.forks.forEach((f) => {
      f.once('message', () => initFork(f))
    })
  }

  processIfFreeFork () {
    if (this.freeForks.length > 0 && this.inputs.length > 0) {
      const fork = this.freeForks.shift()
      const data = this.inputs.shift()
      fork.send(data)
    }

    if (this.inputs.length === 0 && this.flushCb && this.allForksAvailable()) {
      this.killForks()
      this.flushCb()
    }
  }

  allForksAvailable () {
    return this.forks.length === this.freeForks.length
  }

  killForks () {
    this.forks.forEach((f) => f.kill())
  }

  _transform (d, _, cb) {
    this.inputs.push(d)
    this.processIfFreeFork()
    cb()
  }

  _flush (cb) {
    if (this.allForksAvailable()) {
      this.killForks()
      cb()
    } else {
      this.flushCb = cb
      this.processIfFreeFork()
    }
  }
}

function processIncoming (fn) {
  process.on('message', (input) => {
    try {
      const result = fn(input)
      process.send({ isError: false, result })
    } catch (e) {
      process.send({ isError: true, result: e.message })
    }
  })
  process.send({ isInit: true, worker: cluster.worker.id })
}

export default function clusterTransform (fn, nbrForks) {
  if (cluster.isMaster) {
    return new Delegator(fn, nbrForks)
  } else {
    processIncoming(fn)
    return createHole()
  }
}
