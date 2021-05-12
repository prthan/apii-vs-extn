"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InspectionPanel = void 0;
class InspectionPanel {
    constructor(panel) {
        this._contextMessageHandlers = {};
        this.callId = 0;
        this.callbacks = {};
        this._webviewPanel = panel;
        this._webviewPanel.webview.onDidReceiveMessage((msg) => {
            if (msg.data.type == "message") {
                let messageHandler = this._contextMessageHandlers[msg.data.event];
                if (messageHandler)
                    messageHandler.apply(this, [msg.data]);
            }
            if (msg.data.type == "call-response") {
                let callback = this.callbacks[msg.data.callid];
                if (callback) {
                    callback(msg.data);
                    delete this.callbacks[msg.data.callid];
                }
            }
            if (msg.data.type == "call") {
                let callid = msg.data.callid;
                let messageHandler = this._contextMessageHandlers[msg.data.event];
                msg.data.reply = (res) => this.sendToSubContext({ type: "call-response", event: msg.data.event, data: res, callid: callid });
                if (messageHandler)
                    messageHandler.apply(this, [msg.data]);
            }
        });
        this._contextMessageHandlers["/init"] = this.onWebViewInit;
    }
    get webviewPanel() { return this._webviewPanel; }
    ;
    sendToSubContext(msg) {
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
        console.log("init message from webview");
    }
}
exports.InspectionPanel = InspectionPanel;
//# sourceMappingURL=inspection.panel.js.map