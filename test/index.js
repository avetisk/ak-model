/*global describe, it*/

'use strict';

var Model = process.env.AK_MODEL_TEST_COVERAGE ? require('../lib-cov/model') : require('../');
var assert = require('assert');

describe('Model', function () {
  describe('#Model()', function () {
    it('should initialize without data', function () {
      var model = new Model();

      assert(Object.keys(model._attrs).length === 0);
    });
    it('should initialize with data', function () {
      var model = new Model({
        'x': 1,
        'y': 2,
        'z': 3
      });

      assert(Object.keys(model._attrs).length === 3);
      assert(model._attrs['x'] === 1);
      assert(model._attrs['y'] === 2);
      assert(model._attrs['z'] === 3);
    });
    it('should return itself when called', function () {
      var model = new Model();

      assert(model() === model);
    });
    it('should have #isDestroyed to false and read-only', function () {
      var model = new Model();

      assert(model.isDestroyed === false);
      assert.throws(function () {
        model.isDestroyed = true;
      });
    });
  });
  describe('#(attr)', function () {
    it('should return value', function () {
      var model = new Model({
        'x': 1,
        'y': 2,
        'z': 3
      });

      assert(model('x') === 1);
      assert(model('y') === 2);
      assert(model('z') === 3);
      assert(model('o') === undefined);
    });
    it('should return result of function if attribute is function', function () {
      var model = new Model({
        'x': 1,
        'y': 2,
        'z': function (model) {
          return model('x') + 2;
        }
      });

      assert(model('x') === 1);
      assert(model('y') === 2);
      assert(model('z') === 3);
    });
  });
  describe('#(attr, key)', function () {
    it('should set value', function (done) {
      var model = new Model({
        'x': 1,
        'y': 2
      });
      var counter = 0;
      var fn = function () {
        return model('x') + 3;
      };

      model.eventEmitter.on('change.set', function (ns, attr, value, previous) {
        if (counter === 0) {
          assert(attr === 'x');
          assert(value === 10);
          assert(previous === 1);

          counter += 1;
        } else if (counter === 1) {
          assert(attr === 'z');
          assert(value === 30);
          assert(previous === undefined);

          counter += 1;
        } else if (counter === 2) {
          assert(attr === 'o');
          assert(value === fn);
          assert(previous === undefined);

          counter += 1;
        } else {
          throw new Error('should not emit other changes.');
        }
      });

      assert(model('x', 10) === model);
      assert(model('z', 30) === model);
      assert(model('o', fn) === model);
      assert(model('x') === 10);
      assert(model('y') === 2);
      assert(model('z') === 30);
      assert(model('o') === 13);

      if (counter === 3) {
        done();
      }
    });
    it('should set values from given Object', function (done) {
      var model = new Model({
        'x': 1,
        'y': 2
      });
      var counter = 0;
      var fn = function () {
        return model('x') + 3;
      };
      var data = {
        'x': 10,
        'z': 30,
        'o': fn
      };

      model.eventEmitter.on('change.set', function (ns, attr, value, previous) {
        if (counter === 0) {
          assert(attr === 'x');
          assert(value === 10);

          counter += 1;
        } else if (counter === 1) {
          assert(attr === 'z');
          assert(value === 30);

          counter += 1;
        } else if (counter === 2) {
          assert(attr === 'o');
          assert(value === fn);
          assert(previous === undefined);

          counter += 1;
        } else {
          throw new Error('should not emit other changes.');
        }
      });

      assert(model(data) === model);
      assert(model('x') === 10);
      assert(model('y') === 2);
      assert(model('z') === 30);
      assert(model('o') === 13);

      if (counter === 3) {
        done();
      }
    });
    it('should set values from given Object from absent keys', function (done) {
      var model = new Model({
        'x': 1,
        'y': 2
      });
      var counter = 0;
      var fn = function (model) {
        return model('x') + 3;
      };
      var data = {
        'x': 10,
        'z': 30,
        'o': fn
      };

      model.eventEmitter.on('change.set', function (ns, attr, value, previous) {
        if (counter === 0) {
          assert(attr === 'z');
          assert(value === 30);

          counter += 1;
        } else if (counter === 1) {
          assert(attr === 'o');
          assert(value === fn);
          assert(previous === undefined);

          counter += 1;
        } else {
          throw new Error('should not emit other changes.');
        }
      });

      assert(model(data, true) === model);
      assert(model('x') === 1);
      assert(model('y') === 2);
      assert(model('z') === 30);
      assert(model('o') === 4);

      if (counter === 2) {
        done();
      }
    });
    it('should delete attribute if undefined is given as value', function (done) {
      var model = new Model({
        'x': 1,
        'y': 2,
        'z': 3
      });
      var counter = 0;
      var data = {
        'x': 10,
        'y': undefined,
        'o': 4
      };

      model.eventEmitter.on('change.*', function (ns, attr, value, previous) {
        if (counter === 0) {
          assert(attr === 'x');
          assert(value === 10);
          assert(previous === 1);
          assert(ns === 'change.set');

          counter += 1;
        } else if (counter === 1) {
          assert(attr === 'y');
          assert(value === undefined);
          assert(previous === 2);
          assert(ns === 'change.delete');

          counter += 1;
        } else if (counter === 2) {
          assert(attr === 'o');
          assert(value === 4);
          assert(previous === undefined);

          counter += 1;
        } else if (counter === 3) {
          assert(attr === 'o');
          assert(value === undefined);
          assert(previous === 4);
          assert(ns === 'change.delete');

          counter += 1;
        } else {
          throw new Error('should not emit other changes.');
        }
      });

      assert(model(data) === model);
      assert(model('x') === 10);
      assert(model('y') === undefined);
      assert(model.has('y') === false);
      assert(model('z') === 3);
      assert(model('o') === 4);

      assert(model('o', undefined) === model);
      assert(model.has('o') === false);
      assert(model('o') === undefined);

      if (counter === 4) {
        done();
      }
    });
  });
  describe('#has()', function () {
    it('should check if attritube exists', function () {
      var model = new Model({
        'x': 1,
        'y': 2,
        'z': function (model) {
          return model('x') + 3;
        },
        'this is so': undefined
      });

      assert(model.has('x') === true);
      assert(model.has('y') === true);
      assert(model.has('z') === true);
      assert(model.has('this is so') === true);
      assert(model.has('o') === false);
    });
  });
  describe('#keys()', function () {
    it('should return attributes as an Array', function () {
      var model = new Model({
        'x': 1,
        'y': 2,
        'z': function (model) {
          return model('x') + 3;
        }
      });

      var keys = model.keys();

      assert(keys.length === 3);
      assert(keys[0] === 'x');
      assert(keys[1] === 'y');
      assert(keys[2] === 'z');
    });
  });
  describe('#clone()', function () {
    it('should clone into another Model', function () {
      var model = new Model({
        'x': 1,
        'y': 2,
        'z': function (model) {
          return model('x') + 3;
        }
      });

      var clone = model.clone();

      assert(clone instanceof Model);
      assert(model._attrs !== clone._attrs);
      assert(model('x') === clone('x'));
      assert(model('y') === clone('y'));
      assert(model('z') === clone('z'));
      assert(model._attrs['z'] === clone._attrs['z']);

      clone('x', 11);
      clone('o', {'x': 1});

      assert(model('x') !== clone('x'));
      assert(model('z') !== clone('z'));
      assert(model('o') !== clone('o'));
    });
    it('should clone into a new Object', function () {
      var model = new Model({
        'x': 1,
        'y': 2,
        'z': function (model) {
          return model('x') + 3;
        }
      });

      var clone = model.clone(true);

      assert(! (clone instanceof Model));
      assert(model._attrs !== clone);
      assert(model('x') === clone['x']);
      assert(model('y') === clone['y']);
      assert(model('z') === clone['z']);
      assert(model._attrs['z'] !== clone['z']);
    });
  });
  describe('#destroy()', function () {
    it('should set #isDestroyed to true', function () {
      var model = new Model();

      assert(model.isDestroyed === false);
      assert(model.destroy() === undefined);
      assert(model.isDestroyed === true);
    });
    it('should remove all listeners and thus remove all attributes without emitting', function (done) {
      var model = new Model({
        'x': 1,
        'y': 2,
        'z': function () {
          return 108;
        }
      });
      var counter = 0;

      model.eventEmitter.on('change.*', function () {
        counter += 1;
      });

      model.destroy();

      assert(model('x') === undefined);
      assert(model('y') === undefined);
      assert(model('z') === undefined);

      model('x', 2);
      model('x', undefined);

      if (counter === 0) {
        done();
      }
    });
  });
});
