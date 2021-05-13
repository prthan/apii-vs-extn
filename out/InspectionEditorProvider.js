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
exports.InspectionEditorProvider = void 0;
const vscode = require("vscode");
const InspectionDocument_1 = require("./InspectionDocument");
const InspectionPanelCollection_1 = require("./InspectionPanelCollection");
const InspectionPanel_1 = require("./InspectionPanel");
class InspectionEditorProvider {
    constructor(_context) {
        this._context = _context;
        this.inspectionColl = new InspectionPanelCollection_1.InspectionPanelCollection();
        this.documentChangeEventEmitter = new vscode.EventEmitter();
        this.onDidChangeCustomDocument = this.documentChangeEventEmitter.event;
        this.changeEventEmitter = new vscode.EventEmitter();
        this.onDidChange = this.changeEventEmitter.event;
    }
    static getNextEditorNumber() {
        return this.editorId++;
    }
    static register(context) {
        let provider = new InspectionEditorProvider(context);
        let options = {
            webviewOptions: { retainContextWhenHidden: true },
            supportsMultipleEditorsPerDocument: false,
        };
        console.log("registered editor");
        return vscode.window.registerCustomEditorProvider(InspectionEditorProvider.viewType, provider, options);
    }
    saveCustomDocumentAs(document, destination, cancellation) {
        return __awaiter(this, void 0, void 0, function* () {
            let panel = [...this.inspectionColl.get(document.uri)][0];
            let inspection = yield panel.getInspection();
            document.update(inspection);
            return document.saveAs(destination, cancellation);
        });
    }
    saveCustomDocument(document, cancellation) {
        return __awaiter(this, void 0, void 0, function* () {
            let panel = [...this.inspectionColl.get(document.uri)][0];
            let inspection = yield panel.getInspection();
            document.update(inspection);
            return document.save(cancellation);
        });
    }
    revertCustomDocument(document, cancellation) {
        return document.revert(cancellation);
    }
    backupCustomDocument(document, context, cancellation) {
        return document.backup(context.destination, cancellation);
    }
    resolveCustomEditor(document, webviewPanel, _token) {
        return __awaiter(this, void 0, void 0, function* () {
            let basePath = webviewPanel.webview.asWebviewUri(vscode.Uri.joinPath(this._context.extensionUri, 'html'));
            webviewPanel.webview.options = { enableScripts: true };
            webviewPanel.webview.html = this.getHtmlForWebview(basePath);
            let inspectionPanel = new InspectionPanel_1.InspectionPanel(webviewPanel, document.inspection);
            this.inspectionColl.add(document.uri, inspectionPanel);
            inspectionPanel.on("update", (data) => {
                document.update(data.inspection);
                if (document.uri.scheme != "untitled")
                    this.documentChangeEventEmitter.fire({ document: document });
            });
            //document.onDidChangeContent(()=>this.documentChangeEventEmitter.fire({document: document}));
        });
    }
    openCustomDocument(uri, openContext, _token) {
        return __awaiter(this, void 0, void 0, function* () {
            const document = yield InspectionDocument_1.InspectionDocument.create(uri, openContext.backupId);
            return document;
        });
    }
    getHtmlForWebview(basePath) {
        //<base href="${baseUri}/" />
        return `<!DOCTYPE html><html><head><base href="${basePath}/" /><title>API Inspector</title><link rel="icon" type="image/png" href="./res/images/logo/icon.png"><link rel="stylesheet" type="text/css" href="app.css"><link rel="stylesheet" type="text/css" href="module.css"><meta charset="utf-8"><meta name="viewport" content="width=device-width,height=device-height,initial-scale=1,maximum-scale=1,user-scalable=no"><meta http-equiv="X-UA-Compatible" content="IE=Edge"><link rel="manifest" href="manifest.json"></head><body><script src="app.js"></script><script src="module.js"></script><template id="zn-env">{"ctx":"./","api":"./api","res":"./res","images":"./res/images"}</template><template id="zn-defn">{"routes":{"/i":{"view":"inspector","default":true}},"views":{"inspector":{"class":"apii.view.Inspector","template":"inspector/view.html"}},"name":"apii","class":"apii.Module","title":"API Inspector","template":"module/layout.html","data":{"lovs":{"httpMethods":[{"value":"GET","label":"GET"},{"value":"PUT","label":"PUT"},{"value":"POST","label":"POST"},{"value":"DELETE","label":"DELETE"},{"value":"PATCH","label":"PATCH"},{"value":"OPTIONS","label":"OPTIONS"}],"authHeaderType":[{"value":"basic","label":"Basic"},{"value":"bearer","label":"Bearer"}]}}}</template><template template="inspector/view.html"><div class="inspection-tab fl fl-column" zn-template="inspector/inspection-tab.html"></div><a href="#download" class="download">Download</a> <input type="file" class="upload"><div zn-dialog name="edit-set-dialog" dialogtitle="Set" actions="view.dialogActions.OKCANCEL" onaction="view.onEditSetDialogAction($event)" class="name-descr-dialog"><div class="edit-form fl fl-column"><form autocomplete="off"><div zn-textfield class="fl-g0" name="set-name" label="Name" value="view.editset.name" error="view.editset.error.name"></div><div zn-textarea class="fl-g1" name="set-descr" label="Description" value="view.editset.descr"></div></form></div></div><div zn-dialog name="edit-ws-dialog" dialogtitle="Edit Workspace" actions="view.dialogActions.OKCANCEL" onaction="view.onEditWSDialogAction($event)" class="name-descr-dialog"><div class="edit-form fl fl-column"><form autocomplete="off"><div zn-textfield class="fl-g0" name="ws-name" label="Name" value="view.editws.name" error="view.editws.error.name"></div><div zn-textarea class="fl-g1" name="ws-descr" label="Description" value="view.editws.descr"></div></form></div></div><div zn-dialog name="edit-inspection-dialog" dialogtitle="Inspection" actions="view.dialogActions.OKCANCEL" onaction="view.onEditInspectionDialogAction($event)" class="name-descr-dialog"><div class="edit-form fl fl-column"><form autocomplete="off"><div zn-textfield class="fl-g0" name="inspection-name" label="Name" value="view.editinspection.name" error="view.editinspection.error.name"></div><div zn-textarea class="fl-g1" name="inspection-descr" label="Description" value="view.editinspection.descr"></div><div zn-dropdownfield class="fl-g0" name="set" label="Set" value="view.editinspection.setOid" items="view.sets" ng-if="view.sets.length>0 && view.editinspection.type!='new'" error="view.editinspection.error.setOid"></div></form></div></div><div zn-dialog name="config-dialog" dialogtitle="Configuration" actions="view.dialogActions.OKCANCEL" onaction="view.onConfigDialogAction($event)" class="config-dialog"><div class="edit-form fl fl-column"><form autocomplete="off"><div zn-textfield class="fl-g0" name="proxy-location" label="APIi Proxy Location" value="view.editconfig.proxy"></div></form></div></div><div zn-dialog name="ws-list-dialog" dialogtitle="Select Workspace" actions="view.dialogActions.CANCEL" class="ws-list-dialog"><div zn-list class="ws-list" name="ws-list" items="view.wslist" multiselect="false" trackscroll="false" onselect="view.onSelectWS($event)"></div></div><div zn-dialog name="wsdl-load-dialog" dialogtitle="WSDL" actions="view.dialogActions['WSDL-LOAD']" onaction="view.onWSDLLoadDialogAction($event)" class="wsdl-load-dialog"><div class="wsdl-form fl fl-column"><form autocomplete="off"><div class="fl"><div zn-textfield class="fl-g1" name="wsdl-url" label="URL" value="view.loadwsdl.url"></div><div class="load-wsdl-btn-wrapper fl-g0"><div zn-button class="load-wsdl-url-action" text="Load WSDL" action="'load-wsdl'" onaction="view.loadWSDL($event)"></div></div></div></form><div zn-dropdownfield class="fl-g0" name="port-types" label="Port Types" value="view.wsdlData.selectedPortType" items="view.wsdlData.portTypes" ng-if="view.wsdlData.portTypes.length>0" onchange="view.onWSDLPortTypeChange($event)"></div><div class="operations fl-g0" ng-if="view.wsdlData.portTypes.length>0"><div class="fl"><div class="label fl-g1">Operations</div><div class="select-all-operations check-box fl-g0" data-state="on"><i class="state-off far fa-square"></i><i class="state-on fas fa-check-square"></i></div></div><div class="operations-list lean-scroll"><div class="operation fl fl-ac" ng-repeat="operation in view.wsdlData.portTypeOperations[view.wsdlData.selectedPortType]"><div class="oper-name fl-g1">{{operation["@name"]}}</div><div class="check-box" data-state="on" data-oper-name="{{operation['@name']}}"><i class="state-off far fa-square"></i><i class="state-on fas fa-check-square"></i></div></div></div></div><div zn-textfield class="fl-g0" name="set-name" label="Set Name" value="view.loadwsdl.setName" error="view.editws.error.name" ng-if="view.wsdlData.portTypes.length>0"></div><div zn-textarea class="fl-g1" name="set-descr" label="Description" value="view.loadwsdl.setDescr" ng-if="view.wsdlData.portTypes.length>0"></div><div class="status-message" ng-if="view.loadwsdl.msg!=''">{{view.loadwsdl.msg}}</div></div></div><div zn-popup name="tab-menu" class="popup-menu-items tab-menu"><a class="popup-menu-item" ng-click="view.onTabMenuAction('edit')"><i class="fas fa-pencil-alt"></i><span class="popup-menu-item-text">Edit</span></a> <a class="popup-menu-item" ng-click="view.onTabMenuAction('delete')"><i class="fas fa-trash"></i><span class="popup-menu-item-text">Delete</span></a> <a class="popup-menu-item" ng-click="view.onTabMenuAction('duplicate')"><i class="fas fa-clone"></i><span class="popup-menu-item-text">Duplicate</span></a></div><div zn-popup name="ws-menu" class="popup-menu-items ws-menu"><a class="popup-menu-item" ng-click="view.onWSMenuAction('edit')"><i class="fas fa-pencil-alt"></i><span class="popup-menu-item-text">Edit Workspace</span></a> <a class="popup-menu-item" ng-click="view.onWSMenuAction('delete')"><i class="fas fa-trash"></i><span class="popup-menu-item-text">Delete Workspace</span></a> <a class="popup-menu-item" ng-click="view.onWSMenuAction('add-set')"><i class="fas fa-folder-plus"></i><span class="popup-menu-item-text">Add Set</span></a> <a class="popup-menu-item" ng-click="view.onWSMenuAction('add-wsdl')"><i class="fas fa-folder-plus"></i><span class="popup-menu-item-text">Add WSDL</span></a></div><div zn-popup name="app-menu" class="popup-menu-items app-menu" source=".app-action" showat="bottom"><a class="popup-menu-item" ng-click="view.onAppMenuAction('new-ws', $event)"><i class="fas fa-plus-circle"></i><span class="popup-menu-item-text">New Workspace</span></a> <a class="popup-menu-item" ng-click="view.onAppMenuAction('switch-ws', $event)"><i class="fas fa-random"></i><span class="popup-menu-item-text">Switch Workspace</span></a> <a class="popup-menu-item" ng-click="view.onAppMenuAction('import-ws', $event)"><i class="fas fa-arrow-circle-down"></i><span class="popup-menu-item-text">Import Workspace</span></a> <a class="popup-menu-item" ng-click="view.onAppMenuAction('export-ws', $event)"><i class="fas fa-arrow-circle-up"></i><span class="popup-menu-item-text">Export Workspace</span></a><div class="popup-menu-item-divider">&nbsp;</div><a class="popup-menu-item" ng-click="view.onAppMenuAction('show-config', $event)"><i class="fas fa-cogs"></i><span class="popup-menu-item-text">Configuration</span></a> <a class="popup-menu-item" ng-click="view.onAppMenuAction('agent-download', $event)"><i class="fas fa-cloud-download-alt"></i><span class="popup-menu-item-text">Agent Download</span></a></div></template><template template="module/layout.html"><div zn-route class="ws-layout"></div></template><template template="inspector/inspection-tab.html"><div class="service fl-g0 fl fl-ac"><div zn-dropdownfield class="http-method fl-g0" name="http-method" value="view.inspection.target.method" items="module.data.lovs.httpMethods" placeholder="HTTP Method"></div><div zn-textfield class="url fl-g1" name="firstname" value="view.inspection.target.endpoint" placeholder="URL"></div><div zn-button class="send-action fl-g0" text="Send" icon="fas fa-paper-plane" action="'send'" onaction="view.send($event)"></div></div><div class="service-io fl-g1 fl"><div class="service-req fl-g1 fl fl-column"><div class="panel-tab fl-g0"><div class="label">Request</div></div><div class="panel-body fl-g1 fl fl-column"><div class="panel-section fl-g0 fl fl-ac"><div class="panel-section-label fl-g1">Headers</div><div class="panel-section-actions fl-g0 fl fl-ac"><a class="panel-section-action fl-g0" title="Add Header" ng-click="view.addRequestHeader($event)"><i class="fas fa-plus-circle"></i></a></div></div><div class="http-headers fl-g0"><div class="http-header fl fl-ac" ng-repeat="item in view.inspection.request.headers" data-index="{{$index}}"><div class="header-name fl-g0" zn-editable onedit="view.updateRequestHeader($index, 'header', $event)" tabindex="0">{{item.header}}</div><div class="header-value fl-g1" zn-editable onedit="view.updateRequestHeader($index, 'value', $event)" tabindex="0">{{item.value}}</div><a title="Delete Header" class="header-action fl-g0" ng-click="view.deleteRequestHeader($index, $event)"><i class="far fa-trash-alt"></i></a></div></div><div class="panel-section content-section fl-g0 fl fl-ac"><div class="panel-section-label fl-g1">Content</div></div><div class="service-req-editor fl-g1 editor"></div></div></div><div class="panel-splitter fl-g0"><div class="panel-splitter-start"></div><div class="panel-splitter-filler"></div><div class="panel-splitter-handle" zn-draggable tracker="true" ondragstart="view.panelSplit($event)" ondragmove="view.panelSplit($event)" ondragend="view.panelSplit($event)"></div></div><div class="service-res fl-g1 fl fl-column {{view.inspection.response.isError ? 'error': ''}}"><div class="panel-tab fl-g0 fl"><div class="label fl-g0">Response</div><div class="response-time fl-g1" ng-if="view.inspection.response.time">{{view.inspection.response.time}} ms</div></div><div class="panel-body fl-g1 fl fl-column"><div class="panel-section fl-g0 fl fl-ac"><div class="panel-section-label fl-g1">Headers</div></div><div class="http-headers fl-g0"><div class="http-header fl fl-ac" ng-repeat="item in view.inspection.response.headers"><div class="header-name fl-g0">{{item.header}}</div><div class="header-value fl-g1">{{item.value}}</div></div></div><div class="panel-section content-section fl-g0 fl fl-ac"><div class="panel-section-label fl-g1">Content</div></div><div class="service-res-editor editor fl-g1"></div></div></div></div></template><div class="zn-module"></div></body></html>`;
    }
}
exports.InspectionEditorProvider = InspectionEditorProvider;
InspectionEditorProvider.editorId = 1;
InspectionEditorProvider.viewType = 'apii.inspection';
//# sourceMappingURL=InspectionEditorProvider.js.map