const axios = require('axios').default;
const moment = require('moment');
const pino = require('pino');

const config = require('../config');

const logger = pino();

const paymentUrl = `${config.paymentUrlBase}/api/payment-methods/process`;

module.exports = class Subscription {
    constructor(product, monthsPurchased, datePurchased = moment.utc().toISOString(), status = "pending") {
        this.product = product,
        this.monthsPurchased = monthsPurchased,
        this.datePurchasedInternal = moment(datePurchased)
        this.status = status
    }

    get datePurchased() {
        return this.datePurchasedInternal.toISOString()
    }

    get subscriptionEndDate() {
        return this.datePurchasedInternal.clone().add(this.monthsPurchased, 'months')
    }

    get dateExpires() {
        return this.subscriptionEndDate.toISOString()
    }

    get isActive() {
        if (!this.status || !status != 'active') {
            return false;
        }

        return this.datePurchasedInternal.isBefore(moment.utc());
    }

    get activeMonthsRemaining() {
        if (!this.isActive) {
            return 0;
        }

        const months = moment.duration(this.subscriptionEndDate.diff(moment.utc())).asMonths();
        return months > 0 ? months : 0;
    }

    async process(originalSubscription) {
        const originalMonths = originalSubscription && originalSubscription.isActive ? originalSubscription.monthsPurchased : 0;
        
        const diff = originalMonths - this.monthsPurchased;
        if (diff < 0) {
            await this.processRefund((-1) * diff * config.pricePerMonth);
        } else if (diff > 0) {
            await this.processPayment(diff * config.pricePerMonth);
        }

        this.status = 'active';
    }

    async cancel() {
        if (!this.isActive) {
            logger.info('Subscription is not active. Not cancelling.');
            return;
        }

        const amount = this.activeMonthsRemaining * config.pricePerMonth;
        if (amount > 0) {
            logger.info(`Refunding: ${amount}`);
            await this.processRefund(amount);
        } else {
            logger.info("No refund.");
        }

        this.status = 'canceled';
    }

    // This method will process a payment on the current subscription
    // for the given amount.
    async processPayment(amount) {
        try {
            const res = await axios.post(paymentUrl, { amount, type: 'payment' });
            logger.info(`Got response from payment: ${res.data.status}`);
        } catch (error) {
            logger.error(`Error while processing payment: ${error}`);
        }
    }

    // This method will process a refund on the current subscription
    // for the given amount.
    async processRefund(amount) {
        try {
            const res = await axios.post(paymentUrl, { amount, type: 'refund' });
            logger.info(`Got response from refund: ${res.data.status}`);
        } catch (error) {
            logger.error(`Error while processing refund: ${error}`);
        }
    }
}