var bindRE = /^v-bind:|^:/
var onRE = /^v-on:|^@/
var argRE = /:(.*)$/

function Compile(el, vm) {
  this.$vm = vm
  this.$el = el.nodeType == 1 ? el : document.querySelector(el)

  if (this.$el) {
    this.compile(this.$el)
  }
}

Compile.prototype.compile = function(node) {
  this.compileNode(node)
  if (node.childNodes && node.childNodes.length) {
    this.compileNodeList(node.childNodes)
  }
}

Compile.prototype.compileNode = function(node) {
  var type = node.nodeType
  if (type === 1 && node.tagName !== 'SCRIPT') {
    this.compileElementNode(node)
  } else if (type === 3 && node.data.trim()) {
    this.compileTextNode(node)
  }
}

Compile.prototype.compileNodeList = function(childNodes) {
  var self = this

  ;[].slice.call(childNodes).forEach(function (node) {
    self.compileNode(node)

    if (node.childNodes && node.childNodes.length) {
      self.compileNodeList(node.childNodes)
    }
  })
}

Compile.prototype.compileElementNode = function(node) {
  var nodeAttrs = node.attributes,
    self = this

  ;[].slice.call(nodeAttrs).forEach(function (attr) {
    var name, rawName, dirName, arg, value

    name = rawName = attr.name
    value = attr.value

    // event handlers
    if (onRE.test(name)) {
      dirName = 'on'
      arg = name.replace(onRE, '')
    } else

    // attribute bindings
    if (bindRE.test(name)) {
      dirName = name.replace(bindRE, '')
      if (!dirName !== 'style' && dirName !== 'class') {
        arg = dirName
        dirName = 'bind'
      }
    } else

    // normal directives
    if (name.indexOf('v-') === 0) {
      // check arg
      arg = (arg = name.match(argRE)) && arg[1]
      if (arg) {
        name = name.replace(argRE, '')
      }
      // extract directive name
      dirName = name.slice(2)
    }

    if (dirName) {
      var directive = new Directive({
        name: dirName,
        arg: arg,
        attr: rawName,
        expression: value
      }, self.$vm, node)
      self.$vm._directives.push(directive)
      directive._bind()
    }
  })
}

Compile.prototype.compileTextNode = function(node) {
  var text = node.data.trim()
  var reg = /\{\{(.*)\}\}/

  if (reg.test(text)) {
    var directive = new Directive({
      name: 'text',
      expression: text.match(reg)[1]
    }, this.$vm, node)
    this.$vm._directives.push(directive)
    directive._bind()
  }
}
