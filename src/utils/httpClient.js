"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var axios_1 = require("axios");
var axios_retry_1 = require("axios-retry");
var httpClient = axios_1.default.create({
    timeout: 10000,
});
(0, axios_retry_1.default)(httpClient, {
    retries: 3,
    retryDelay: function (retryCount) {
        return retryCount * 1000; // 1s, 2s, 3s
    },
    retryCondition: function (error) {
        var _a;
        return (axios_retry_1.default.isNetworkOrIdempotentRequestError(error) ||
            ((_a = error.response) === null || _a === void 0 ? void 0 : _a.status) === 429);
    },
});
exports.default = httpClient;
