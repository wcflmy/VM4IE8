var nextTick = (function () {
  var callbacks = []
  var pending = false
  var timerFunc
  function nextTickHandler() {
    pending = false
    var copies = callbacks.slice(0)
    callbacks = []
    for (var i = 0; i < copies.length; i++) {
      copies[i]()
    }
  }
  if (typeof MutationObserver !== 'undefined') {
    var counter = 1
    var observer = new MutationObserver(nextTickHandler)
    var textNode = document.createTextNode(counter)
    observer.observe(textNode, {
      characterData: true
    })
    timerFunc = function () {
      counter = (counter + 1) % 2
      textNode.data = counter
    }
  } else {
    timerFunc = setTimeout
  }
  return function (cb, ctx) {
    var func = ctx
      ? function () { cb.call(ctx) }
      : cb
    callbacks.push(func)
    if (pending) return
    pending = true
    timerFunc(nextTickHandler, 0)
  }
})()

var batcher = (function() {
  var queue = []
  var waiting = false

  function resetBatcherState() {
    queue = []
    waiting = false
  }

  function flushBatcherQueue() {
    runBatcherQueue()
    resetBatcherState()
  }

  function runBatcherQueue() {
    for(var i=0; i<queue.length; i++) {
      var watcher = queue[i]
      watcher.run()
    }
  }

  return {
    push: function(watcher) {
      queue.push(watcher)
      if(!waiting) {
        waiting = true
        nextTick(flushBatcherQueue)
      }
    }
  }
})()





