"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const BuildClient_1 = __importDefault(require("../src/BuildClient"));
const getStoreOrders = () => {
    return BuildClient_1.default
        .inStoreKeyWithStoreKeyValue({ storeKey: "pizza-palace-1" })
        .orders()
        .get({
        queryArgs: {
            where: 'orderState = "Confirmed"'
        }
    })
        .execute()
        .then(response => {
        return response.body.results.map(order => ({
            id: order.id,
            lineItems: order.lineItems.map(lineItem => ({
                productName: lineItem.name.en,
                ingredients: lineItem.custom && lineItem.custom.fields ? lineItem.custom.fields.Ingredients : []
            }))
        }));
    });
};
exports.default = getStoreOrders;
