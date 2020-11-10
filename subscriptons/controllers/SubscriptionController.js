const v = require("./Validation");
const domain = require("../domain/Subscription");

class SubscriptionsController {
  constructor(subscriptionRepository, logger) {
    this.subscriptionRepository = subscriptionRepository;
    this.logger = logger;
  }

  async handleGetSubscription(req, res) {
    const subscription = await this.subscriptionRepository.getSubscription();

    if (!subscription) {
      res.status(404);
      res.end();
    }

    const result = this.transformToApiFormat(subscription);
    res.send(result);
  }

  async handleAddSubscription(req, res) {
    const subscription = this.transformToDomainFormat(req.body);

    if (subscription.error) {
      res.status(400);
      res.send(subscription.errors);
      return;
    }

    const original = await this.subscriptionRepository.getSubscription();
    await subscription.subscription.process(original);
    await this.subscriptionRepository.addOrReplaceSubscription(
      subscription.subscription
    );
    const result = this.transformToApiFormat(subscription.subscription);
    res.send(result);
  }

  async handleCancelSubscription(req, res) {
    const subscription = await this.subscriptionRepository.getSubscription();

    if (!subscription) {
      res.status(404);
      res.end();
    }

    await subscription.cancel();
    await this.subscriptionRepository.addOrReplaceSubscription(subscription);
    const result = this.transformToApiFormat(subscription);
    res.send(result);
  }

  // This method will take a request body as specified in the OpenAPI
  // Spec and transform it into a Domain representation.
  transformToDomainFormat(body) {
    const { product, monthsPurchased } = body;

    const subscriptionErrors = v.validateSubscription(product, monthsPurchased);

    let foundError = false;

    if (subscriptionErrors.length > 0) {
      this.logger.error(`Card validation errors: ${subscriptionErrors}`);
      foundError = true;
    }

    if (foundError) {
      return {
        error: true,
        errors: {
          subscription: subscriptionErrors,
        },
      };
    }

    const subscription = new domain.Subscription(product, monthsPurchased);

    return {
      error: false,
      subscription: subscription,
    };
  }

  // This method will take a domain representation and transform it
  // into format as specified by the OpenAPI Spec.
  transformToApiFormat(subscription) {
    return {
      product: subscription.product,
      monthsPurchased: subscription.monthsPurchased,
      status: subscription.status,
      datePurchased: subscription.datePurchased,
      dateExpires: subscription.dateExpires,
    };
  }
}

module.exports = (repositories, logger) => {
  var controller = new SubscriptionsController(
    repositories.subscriptionsRepository,
    logger
  );
  var express = require("express");
  var router = express.Router();

  router.get("/", function (req, res) {
    controller.handleGetSubscription(req, res);
  });

  router.post("/", function (req, res) {
    controller.handleAddSubscription(req, res);
  });

  router.delete("/", function (req, res) {
    controller.handleCancelSubscription(req, res);
  });

  return router;
};
