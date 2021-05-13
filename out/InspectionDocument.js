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
exports.InspectionDocument = void 0;
const vscode = require("vscode");
class InspectionDocument {
    constructor(uri, initialContent) {
        this._onDidDisposeEventEmitter = new vscode.EventEmitter();
        this.onDidDispose = this._onDidDisposeEventEmitter.event;
        this._onDidChangeDocumentEventEmitter = new vscode.EventEmitter();
        this.onDidChangeContent = this._onDidChangeDocumentEventEmitter.event;
        this._uri = uri;
        this._documentData = initialContent;
        this._inspection = JSON.parse(initialContent.toString() || "{}");
    }
    static create(uri, backupId) {
        return __awaiter(this, void 0, void 0, function* () {
            const dataFile = typeof backupId === 'string' ? vscode.Uri.parse(backupId) : uri;
            const fileData = yield InspectionDocument.readFile(dataFile);
            return new InspectionDocument(uri, fileData);
        });
    }
    static readFile(uri) {
        return __awaiter(this, void 0, void 0, function* () {
            if (uri.scheme === 'untitled') {
                return Buffer.from(JSON.stringify(InspectionDocument.emptyInspection));
            }
            return vscode.workspace.fs.readFile(uri);
        });
    }
    get uri() { return this._uri; }
    get documentData() { return this._documentData; }
    get inspection() { return this._inspection; }
    dispose() {
        this._onDidDisposeEventEmitter.fire();
    }
    update(inspection) {
        this._inspection = inspection;
    }
    save(cancellation) {
        return __awaiter(this, void 0, void 0, function* () {
            this._documentData = Buffer.from(JSON.stringify(this._inspection));
            yield vscode.workspace.fs.writeFile(this._uri, this._documentData);
        });
    }
    saveAs(targetResource, cancellation) {
        return __awaiter(this, void 0, void 0, function* () {
            if (cancellation.isCancellationRequested)
                return;
            yield vscode.workspace.fs.writeFile(targetResource, Buffer.from(JSON.stringify(this._inspection)));
        });
    }
    revert(cancellation) {
        return __awaiter(this, void 0, void 0, function* () {
            const diskContent = yield InspectionDocument.readFile(this.uri);
            this._documentData = diskContent;
            this._inspection = JSON.parse(this._documentData.toString() || "{}");
            this._onDidChangeDocumentEventEmitter.fire(this);
        });
    }
    backup(destination, cancellation) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.saveAs(destination, cancellation);
            const rval = {
                id: destination.toString(),
                delete: () => __awaiter(this, void 0, void 0, function* () {
                    try {
                        yield vscode.workspace.fs.delete(destination);
                    }
                    catch (_a) {
                        // noop
                    }
                })
            };
            return rval;
        });
    }
}
exports.InspectionDocument = InspectionDocument;
InspectionDocument.emptyInspection = {
    name: 'Inspection',
    target: { method: "GET", endpoint: "http://localhost:8080/api" },
    request: {
        headers: [{ header: "content-type", value: "application/json" }, { header: "", value: "" }, { header: "", value: "" }],
        content: ""
    },
    response: {
        headers: [{ header: "", value: "" }, { header: "", value: "" }, { header: "", value: "" }],
        content: ""
    }
};
//# sourceMappingURL=InspectionDocument.js.map