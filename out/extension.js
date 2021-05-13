"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const Commands_1 = require("./Commands");
const InspectionEditorProvider_1 = require("./InspectionEditorProvider");
function activate(context) {
    vscode.commands.registerCommand('apii.inspection.new', Commands_1.Commands.newInspectionCommand);
    vscode.commands.registerCommand('apii.inspection.from-wsdl', Commands_1.Commands.newInspectionFromWSDLCommand);
    context.subscriptions.push(InspectionEditorProvider_1.InspectionEditorProvider.register(context));
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map