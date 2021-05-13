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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Send = void 0;
const axios_1 = require("axios");
class Send {
    static exec(inspection) {
        let impl = (res$, rej$) => __awaiter(this, void 0, void 0, function* () {
            let options = {
                method: inspection.target.method,
                url: inspection.target.endpoint,
            };
            let headers = {};
            inspection.request.headers.forEach((item) => {
                if (item.header && item.header != "")
                    headers[item.header] = item.value;
            });
            options.headers = headers;
            options.transformResponse = [];
            if (['PUT', 'POST', 'DELETE', 'PATCH'].includes(inspection.target.method))
                options.data = inspection.request.content;
            let outcome = { startTime: process.hrtime() };
            axios_1.default(options)
                .then((res) => outcome.res = res)
                .catch((err) => {
                if (err.response)
                    outcome.res = err.response;
                else
                    outcome.err = err;
            })
                .finally(() => {
                outcome.timeDiff = process.hrtime(outcome.startTime);
                if (outcome.res)
                    Send.copyRes(outcome.res, inspection);
                if (outcome.err)
                    inspection.response.error = outcome.err.message;
                inspection.response.time = outcome.timeDiff[0] * 1000 + outcome.timeDiff[1] / 1000000;
                inspection.response.time = Math.round(inspection.response.time * 1000 + 0.5) / 1000;
                res$(inspection);
            });
        });
        return new Promise(impl);
    }
    static copyRes(res, inspection) {
        inspection.response.status = { code: res.status, text: res.statusText };
        inspection.response.content = res.data;
        inspection.response.headers = [];
        Object.keys(res.headers).forEach((header) => inspection.response.headers.push({ header: header, value: res.headers[header] }));
    }
    static getURL(url) {
        let impl = ($res, $rej) => __awaiter(this, void 0, void 0, function* () {
            let options = { method: "GET", url: url };
            let outcome = {};
            axios_1.default(options)
                .then((res) => outcome.res = res)
                .catch((err) => {
                if (err.response)
                    outcome.res = err.response;
                else
                    outcome.err = err;
            })
                .finally(() => {
                let res = {};
                if (outcome.res) {
                    if (outcome.res.status == 200) {
                        res.status = { code: outcome.res.status, text: outcome.res.statusText };
                        res.content = outcome.res.data;
                    }
                    else
                        res.error = { code: outcome.res.status, message: outcome.res.statusText, details: outcome.res.data };
                }
                if (outcome.err) {
                    res.error = { code: -1, message: outcome.err.message };
                }
                $res(res);
            });
        });
        return new Promise(impl);
    }
}
exports.Send = Send;
//# sourceMappingURL=Send.js.map