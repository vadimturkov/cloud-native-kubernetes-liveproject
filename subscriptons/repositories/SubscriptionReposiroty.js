const Subscription = require("../domain/Subscription");

class SubscriptionRepository {
  constructor(client) {
    this.client = client;
  }

  async addOrReplaceSubscription(subscription) {
    let len = await this.client.hlen(subscriptionKey);

    if (len > 0) {
      // If there is already an existing payment method, we're
      // going to replace that. Remove the old one first just
      // to make sure.
      await this.removeSubscription();
    }

    const data = this.transformToRepositoryFormat(subscription);
    await this.client.hmset(subscriptionKey, data);
  }

  async getSubscription() {
    let len = await this.client.hlen(subscriptionKey);

    if (len <= 0) {
      return null;
    }

    const data = await this.client.hgetall(subscriptionKey);
    return this.transformToDomainFormat(data);
  }

  async removeSubscription() {
    let len = await this.client.hlen(subscriptionKey);

    if (len <= 0) {
      // If there is already an existing payment method, we're
      // going to replace that. Remove the old one first just
      // to make sure.
      return;
    }

    let fields = await this.client.hkeys(subscriptionKey);
    return await this.client.hdel(subscriptionKey, fields);
  }
}

function transformToRepositoryFormat(subscription) {
  return Object.assign({}, subscription);
}

function transformToDomainFormat(data) {
  return new Subscription(
    data.product,
    data.monthsPurchased,
    data.datePurchased,
    data.status
  );
}

module.exports = (client) => new SubscriptionRepository(client);
