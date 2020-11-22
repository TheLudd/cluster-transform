const { Transform } = require('stream')
const cluster = require('cluster')

class Processor extends Transform {
  constructor (fn) {
    super({ objectMode: true })
    process.on('message', (input) => {
      try {
        const result = fn(input)
        process.send({ isError: false, result })
      } catch (e) {
        process.send({ isError: true, result: e.message })
      }
    })
  }

  _transform (d, _, cb) {
    cb()
  }
}

class Delegator extends Transform {
  constructor (fn, nbrForks) {
    super({ objectMode: true })
    this.forks = []

    for (let i = 0; i < nbrForks; i++) {
      this.forks.push(cluster.fork())
    }

    this.freeForks = [ ...this.forks ]
    this.inputs = []
    this.hasError = false

    this.forks.forEach((f) => {
      f.on('message', ({ isError, result }) => {
        if (isError) {
          this.hasError = true
          this.killForks()
          this.destroy(new Error(result))
        } else if(!this.hasError) {
          this.push(result)
          this.freeForks.push(f)
          this.processIfFreeFork()
        }
      })
    })
  }

  processIfFreeFork () {
    if (this.freeForks.length > 0 && this.inputs.length > 0) {
      const fork = this.freeForks.pop()
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
      cb()
    } else {
      this.flushCb = cb
    }
  }
}

module.exports = cluster.isMaster ? Delegator : Processor
