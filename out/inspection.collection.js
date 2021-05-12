"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InspectionCollection = void 0;
class InspectionCollection {
    constructor() {
        this._collection = new Set();
    }
    *get(uri) {
        const key = uri.toString();
        for (const entry of this._collection) {
            if (entry.resource === key)
                yield entry.panel;
        }
    }
    add(uri, panel) {
        const entry = { resource: uri.toString(), panel: panel };
        this._collection.add(entry);
        panel.webviewPanel.onDidDispose(() => this._collection.delete(entry));
    }
}
exports.InspectionCollection = InspectionCollection;
//# sourceMappingURL=inspection.collection.js.map