const { EventEmitter } = require('events');

// Event bus sederhana untuk broadcast update per address
class EventBus {
  constructor() {
    this.emitter = new EventEmitter();
    // Tingkatkan max listeners untuk banyak subscriber
    this.emitter.setMaxListeners(100);
  }

  subscribe(address, handler) {
    const key = `update:${address.toLowerCase()}`;
    this.emitter.on(key, handler);
    return () => this.emitter.off(key, handler);
  }

  publish(address, payload) {
    const key = `update:${address.toLowerCase()}`;
    this.emitter.emit(key, payload);
  }
}

module.exports = new EventBus();