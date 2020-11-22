const { Transform } = require('stream')
const cluster = require('cluster')
const { times } = require('ramda')
const fib = require('./fib')

const nbrForks = 7

let listIndex = 0

function init (forks, list) {
  forks.forEach((f) => {
    f.on('message', (d) => {
      if (listIndex < list.length) {
        f.send(list[listIndex++])
      } else {
        f.kill()
      }
    })
    f.send(list[listIndex++])
  })
}

module.exports = function  (list) {
  if (cluster.isMaster) {
    const forks = times(() => cluster.fork(), nbrForks)
    init(forks, list)
  } else {
    process.on('message', (d) => {
      const result = fib(d)
      process.send({ input: d, result })
    })
  }
}

