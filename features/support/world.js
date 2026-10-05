const { setWorldConstructor, World, setDefaultTimeout } = require('@cucumber/cucumber');
const config = require('../../config/env');

class TestWorld extends World {
  constructor(options) {
    super(options);
    this.config = config;
  }
}

setWorldConstructor(TestWorld);
setDefaultTimeout(config.stepTimeout);
