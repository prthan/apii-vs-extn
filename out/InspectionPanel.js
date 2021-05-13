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
exports.InspectionPanel = void 0;
const EventEmitter = require("events");
const Fetch_1 = require("./Fetch");
class InspectionPanel extends EventEmitter {
    constructor(panel, inspection) {
        super();
        this._contextMessageHandlers = {};
        this.callId = 0;
        this.callbacks = {};
        this._webviewPanel = panel;
        this._inspection = inspection;
        this._webviewPanel.webview.onDidReceiveMessage((msg) => {
            console.log("received msg in context", msg);
            if (msg.type == "message") {
                let messageHandler = this._contextMessageHandlers[msg.event];
                if (messageHandler)
                    messageHandler.apply(this, [msg]);
            }
            if (msg.type == "call-response") {
                let callback = this.callbacks[msg.callid];
                if (callback) {
                    callback(msg.data);
                    delete this.callbacks[msg.callid];
                }
            }
            if (msg.type == "call") {
                let callid = msg.callid;
                let messageHandler = this._contextMessageHandlers[msg.event];
                let reply = (res) => this.sendToSubContext({ type: "call-response", event: msg.event, data: res, callid: callid });
                if (messageHandler)
                    messageHandler.apply(this, [msg.data, reply]);
            }
        });
        this._contextMessageHandlers["/init"] = this.onWebViewInit;
        this._contextMessageHandlers["/update"] = this.onUpdate;
        this._contextMessageHandlers["/send"] = this.onSend;
    }
    get webviewPanel() { return this._webviewPanel; }
    ;
    sendToSubContext(msg) {
        console.log("sending msg to subcontext", msg);
        this._webviewPanel.webview.postMessage(msg);
    }
    publishToSubContext(evt, data) {
        this.sendToSubContext({ type: "message", event: evt, data: data });
    }
    callAtSubContext(evt, data) {
        this.callId++;
        let impl = (res$, rej$) => {
            this.callbacks[this.callId] = res$;
            this.sendToSubContext({ type: "call", event: evt, callid: this.callId, data: data });
        };
        return new Promise(impl);
    }
    onWebViewInit(msg) {
        this.loadInspection(this._inspection);
    }
    onUpdate(msg) {
        this.emit("update", msg.data);
    }
    onSend(data, reply) {
        return __awaiter(this, void 0, void 0, function* () {
            data.inspection = yield Fetch_1.Fetch.exec(data.inspection);
            reply(data);
        });
    }
    loadInspection(inspection) {
        this.publishToSubContext("/load", { inspection: inspection });
    }
    getInspection() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.callAtSubContext("/get", {});
        });
    }
}
exports.InspectionPanel = InspectionPanel;
//# sourceMappingURL=InspectionPanel.js.map