'use strict';

/**
 * Dependencies
 */
var EventEmitter = require('ak-eventemitter');
var defaults = require('stluafed');

/**
 * Export `Model`
 *
 * @param {Object} data
 * @return {Model}
 */
var Model = module.exports = function (data) {
  var model = function () {
    if (typeof arguments[0] === 'object') {
      return model._merge.call(model, arguments[0], arguments[1]);
    }

    if (arguments.length === 1) {
      return model._get.call(model, arguments[0]);
    }

    if (arguments.length === 2) {
      return model._set.call(model, arguments[0], arguments[1]);
    }

    return model;
  };

  // NOTE use Object.setPrototypeOf() when available
  model['__proto__'] = Model.prototype;

  // NOTE always copy data Object
  model._attrs = defaults({}, data || {});
  model._isDestroyed = false;
  model.eventEmitter = new EventEmitter();

  return model;
};

var prototype = Model.prototype;

/**
 * Check if is destroyed
 */
Object.defineProperty(prototype, 'isDestroyed', {
  'get': function () {
    return this._isDestroyed;
  },
  'set': function () {
    throw new Error('Read only');
  }
});

/**
 * Get attribute value
 *
 * @param {String} attr
 * @return {Mixed}
 */
prototype._get = function (attr) {
  var value = this._attrs[attr];

  if (typeof value === 'function') {
    return value(this);
  }

  return value;
};

/**
 * Set/Delete attribute
 *
 * @param {String} attr
 * @param {Mixed} value if value === undefined then delete attribute
 * @return {Model}
 */
prototype._set = function (attr, value) {
  var currentValue = this._attrs[attr];

  this.eventEmitter.emit('before.change', attr, undefined, currentValue, this);

  if (arguments.length === 2 && value === undefined) {
    delete this._attrs[attr];

    this.eventEmitter.emit('change.delete', attr, undefined, currentValue, this);

    return this;
  }

  this._attrs[attr] = value;

  this.eventEmitter.emit('change.set', attr, value, currentValue, this);

  return this;
};

/**
 * Set multiple attributes at once
 *
 * @param {Object} attrs
 * @param {Boolean} keepExistentKeys
 * @return {Model}
 */
prototype._merge = function (attrs, keepExistentKeys) {
  var keys = Object.keys(attrs);
  var key;
  var _attrs = this._attrs;

  for (var i = 0, len = keys.length; i < len; i += 1) {
    key = keys[i];

    if (keepExistentKeys && key in _attrs) {
      continue;
    }

    this(key, attrs[key]);
  }

  return this;
};

/**
 * Check if attribute exists
 *
 * @param {String} attr
 * @return {Boolean}
 */
prototype.has = function (attr) {
  return attr in this._attrs;
};

/**
 * Get list of all attributes
 *
 * @return {Array}
 */
prototype.keys = function () {
  return Object.keys(this._attrs);
};

/**
 * Clone model into a new one or into an Object
 *
 * @param {asObject}
 * @return {Model|Object}
 */
prototype.clone = function (asObject) {
  if (asObject) {
    var clone = {};
    var attrs = this._attrs;

    /*jshint forin: false*/
    for (var key in attrs) {
      clone[key] = this._get(key);
    }

    return clone;
  }

  return new Model(this._attrs);
};

/**
 * Remove all attributes and all listeners without emitting
 */
prototype.destroy = function () {
  this._isDestroyed = true;
  this.eventEmitter.emit('destroy', this);
  this.eventEmitter.off();
  this._attrs = {};
};
