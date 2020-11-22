// import chai from 'chai'
// import multipipe from 'multipipe';
// import cluster from 'cluster'
// import { Readable, Transform } from 'stream'
// import reduce from 'through2-reduce'
// import createClusterTransform from '../lib/cluster-transform.js'

// const { assert } = chai
// const { deepEqual } = assert
// function arrayToStream (array) {
//   return new Readable({
//     objectMode: true,
//     read () {
//       array.forEach((item) => this.push(item))
//       this.push(null)
//     }
//   })
// }

// function firstDataPromise (stream) {
//   return new Promise((resolve, reject) => {
//     stream.on('data', resolve)
//     stream.on('error', reject)
//   })
// }

// const buildResultStream = reduce.obj((acc, item) => [ ...acc, item ], [])

// const dbl = (x) => x * 2
// const transform = createClusterTransform(dbl, 2)
// const input = [ 11, 22, 33 ]
// const stream = multipipe(arrayToStream(input), transform, buildResultStream)
// if (cluster.isMaster) {
//   firstDataPromise(stream)
//     .then((result) => deepEqual(result, [ 22, 44, 66 ]))
// } else {
//   firstDataPromise(stream)
//     .then((result) => deepEqual(result, []))
// }
