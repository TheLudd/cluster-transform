function fib (n) {
  if (n > 45) {
    throw new Error('Too big')
  }
  if (n <= 2) {
    return 1
  } else {
    return fib(n - 1) + fib(n - 2)
  }
}

module.exports = fib
