'use strict'

const Logger = require('logplease')
const logger = Logger.create("orbit-db.ipfs-pubsub")
Logger.setLogLevel('ERROR')

class IPFSPubsub {
  constructor(ipfs) {
    this._ipfs = ipfs
    this._subscriptions = {}

    if (this._ipfs.pubsub === null)
      logger.error("The provided version of ipfs doesn't have pubsub support. Messages will not be exchanged.")
  }

  subscribe(hash, onMessageCallback) {
    if(!this._subscriptions[hash]) {
      this._subscriptions[hash] = { onMessage: onMessageCallback }

      if (this._ipfs.pubsub)
        this._ipfs.pubsub.subscribe(hash, { discover: true }, this._handleMessage.bind(this))
    }
  }

  unsubscribe(hash) {
    if(this._subscriptions[hash]) {
      this._ipfs.pubsub.unsubscribe(hash, this._handleMessage)
      delete this._subscriptions[hash]
      logger.debug(`Unsubscribed from '${hash}'`)
    }
  }

  publish(hash, message) {
    if(this._subscriptions[hash] && this._ipfs.pubsub)
      this._ipfs.pubsub.publish(hash, new Buffer(message))
  }

  disconnect() {
    Object.keys(this._subscriptions)
      .forEach((e) => this.unsubscribe(e))
  }

  _handleMessage(message) {
    const hash = message.topicCIDs[0]
    const data = message.data.toString()
    const subscription = this._subscriptions[hash]

    if(subscription && subscription.onMessage && data)
      subscription.onMessage(hash, data)
  }
}

module.exports = IPFSPubsub
