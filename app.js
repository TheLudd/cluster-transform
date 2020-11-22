const { Readable } = require('stream')
const processList = require('./process-list')
const ClusterStream = require('./cluster-stream')
const { object: intoStream } = require('into-stream')
const fib = require('./fib')

const list = [
  1,
  2,
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  11,
  12,
  13,
  14,
  15,
  16,
  17,
  18,
  19,
  20,
  21,
  22,
  23,
  24,
  25,
  26,
  27,
  28,
  29,
  30,
  31,
  32,
  33,
  34,
  35,
  36,
  37,
  38,
  39,
  40,
  41,
  42,
  43,
  44,
  45,
  46,
]

const hmm = false

let i = 0
const limit = 10
class MS extends Readable {
  constructor (props) {
    super({ objectMode: true })
    this.begun = false
  }

  _read() {
    if (!this.begun) {
      this.begun = true
      const ref = setInterval(() => {
        this.push(++i)
        if (i >= limit) {
          clearInterval(ref)
          this.push(null)
        }
      }, 200)
    }
  }

}

const stream = hmm ? new MS() : intoStream(list)

stream.pipe(new ClusterStream((n) => {
  const v = fib(n)
  return { n, v }
}, 7))
  .on('data', console.log)
