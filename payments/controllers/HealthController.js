class HealthController {
    handleLivenessProbe(_, res) {
        res.sendStatus(200);
    }

    handleReadinessProbe(_, res) {
        res.sendStatus(200);
    }
}

module.exports = () => {
    const router = require("express").Router();
    const controller = new HealthController();

    router.get("/alive", (req, res) => {
        controller.handleLivenessProbe(req, res);
    });

    router.get("/ready", (req, res) => {
        controller.handleReadinessProbe(req, res);
    });

    return router;
};