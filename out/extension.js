"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const InspectionEditorProvider_1 = require("./InspectionEditorProvider");
function activate(context) {
    console.log("registering editor");
    context.subscriptions.push(InspectionEditorProvider_1.InspectionEditorProvider.register(context));
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map