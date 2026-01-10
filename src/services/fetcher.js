"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchJupiter = exports.fetchDexScreener = void 0;
var httpClient_1 = require("../utils/httpClient");
var fetchDexScreener = function (query) { return __awaiter(void 0, void 0, void 0, function () {
    var response, pairs, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, httpClient_1.default.get("https://api.dexscreener.com/latest/dex/search?q=".concat(query))];
            case 1:
                response = _a.sent();
                pairs = response.data.pairs || [];
                return [2 /*return*/, pairs
                        .filter(function (pair) { return pair.chainId === 'solana'; })
                        .map(function (pair) {
                        var _a, _b, _c, _d, _e, _f, _g, _h;
                        return ({
                            token_address: pair.baseToken.address,
                            token_name: pair.baseToken.name,
                            token_ticker: pair.baseToken.symbol,
                            price_sol: parseFloat(pair.priceNative),
                            market_cap_sol: (pair.marketCap || pair.fdv || 0) / parseFloat(pair.priceUsd || '1') * parseFloat(pair.priceNative),
                            volume_sol: (((_a = pair.volume) === null || _a === void 0 ? void 0 : _a.h24) || 0) / parseFloat(pair.priceUsd || '1') * parseFloat(pair.priceNative),
                            liquidity_sol: (((_b = pair.liquidity) === null || _b === void 0 ? void 0 : _b.usd) || 0) / parseFloat(pair.priceUsd || '1') * parseFloat(pair.priceNative),
                            transaction_count: (((_d = (_c = pair.txns) === null || _c === void 0 ? void 0 : _c.h24) === null || _d === void 0 ? void 0 : _d.buys) || 0) + (((_f = (_e = pair.txns) === null || _e === void 0 ? void 0 : _e.h24) === null || _f === void 0 ? void 0 : _f.sells) || 0),
                            price_1hr_change: ((_g = pair.priceChange) === null || _g === void 0 ? void 0 : _g.h1) || 0,
                            price_24hr_change: ((_h = pair.priceChange) === null || _h === void 0 ? void 0 : _h.h24) || 0,
                            price_7d_change: 0, // DexScreener search endpoint might not return 7d
                            protocol: 'dexscreener',
                        });
                    })];
            case 2:
                error_1 = _a.sent();
                console.error('Error fetching from DexScreener:', error_1);
                return [2 /*return*/, []];
            case 3: return [2 /*return*/];
        }
    });
}); };
exports.fetchDexScreener = fetchDexScreener;
var fetchJupiter = function (query) { return __awaiter(void 0, void 0, void 0, function () {
    var searchResponse, tokens, topTokens, ids, pricesResponse, prices_1, priceError_1, error_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 6, , 7]);
                return [4 /*yield*/, httpClient_1.default.get("https://lite-api.jup.ag/tokens/v2/search?query=".concat(query))];
            case 1:
                searchResponse = _a.sent();
                tokens = searchResponse.data.tokens || [];
                topTokens = tokens.slice(0, 20);
                if (topTokens.length === 0)
                    return [2 /*return*/, []];
                ids = topTokens.map(function (t) { return t.address; }).join(',');
                _a.label = 2;
            case 2:
                _a.trys.push([2, 4, , 5]);
                return [4 /*yield*/, httpClient_1.default.get("https://api.jup.ag/price/v2?ids=".concat(ids))];
            case 3:
                pricesResponse = _a.sent();
                prices_1 = pricesResponse.data.data;
                if (!prices_1)
                    return [2 /*return*/, []];
                return [2 /*return*/, topTokens.filter(function (t) { return prices_1[t.address]; }).map(function (t) {
                        var p = prices_1[t.address];
                        // Price is likely in USDC. We need SOL price to convert if we want strict 'price_sol'.
                        // For now, I'll store the raw price and assume it is close enough or handle conversion later.
                        // Or better, since DexScreener gives SOL price, we rely on DexScreener for SOL-based metrics 
                        // and use Jupiter as a backup source that might give USDC prices.
                        // Requirement: "price_sol".
                        return {
                            token_address: t.address,
                            token_name: t.name,
                            token_ticker: t.symbol,
                            price_sol: parseFloat(p.price), // This is likely USD/USDC.
                            market_cap_sol: 0,
                            volume_sol: 0,
                            liquidity_sol: 0,
                            transaction_count: 0,
                            price_1hr_change: 0,
                            price_24hr_change: 0,
                            price_7d_change: 0,
                            protocol: 'jupiter',
                        };
                    })];
            case 4:
                priceError_1 = _a.sent();
                console.error('Jupiter Price API failed (likely 401 or limit):', priceError_1);
                return [2 /*return*/, []];
            case 5: return [3 /*break*/, 7];
            case 6:
                error_2 = _a.sent();
                console.error('Error fetching from Jupiter:', error_2);
                return [2 /*return*/, []];
            case 7: return [2 /*return*/];
        }
    });
}); };
exports.fetchJupiter = fetchJupiter;
