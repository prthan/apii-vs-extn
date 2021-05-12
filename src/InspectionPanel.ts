import EventEmitter = require('events');
import * as vscode from 'vscode';
import { Inspection } from './Inspection';
import {Send} from './Send';

export class InspectionPanel extends EventEmitter
{
  private _webviewPanel :vscode.WebviewPanel;
  private _contextMessageHandlers :any = {};
  private callId :number = 0;
  private callbacks :any = {};
  private _inspection :Inspection;

  constructor(panel :vscode.WebviewPanel, inspection :Inspection)
  {
    super();
    this._webviewPanel=panel;
    this._inspection=inspection;
    this._webviewPanel.webview.onDidReceiveMessage((msg)=>
    {
      console.log("received msg in context", msg);
      if(msg.type=="message")
      {
        let messageHandler=this._contextMessageHandlers[msg.event];
        if(messageHandler) messageHandler.apply(this, [msg]);
      }
      if(msg.type=="call-response")
      {
        let callback=this.callbacks[msg.callid];
        if(callback)
        {
          callback(msg.data);
          delete this.callbacks[msg.callid];
        }
      }
      if(msg.type=="call")
      {
        let callid=msg.callid;
        let messageHandler=this._contextMessageHandlers[msg.event];
        let reply=(res :any)=>this.sendToSubContext({type: "call-response", event: msg.event, data: res, callid: callid});
        if(messageHandler) messageHandler.apply(this, [msg.data, reply]);
      }
    })
    this._contextMessageHandlers["/init"]=this.onWebViewInit;
    this._contextMessageHandlers["/update"]=this.onUpdate;
    this._contextMessageHandlers["/send"]=this.onSend;
  }

  public get webviewPanel() {return this._webviewPanel};
  public sendToSubContext(msg :any)
  {
    console.log("sending msg to subcontext", msg);
    this._webviewPanel.webview.postMessage(msg);
  }

  public publishToSubContext(evt :string, data :any)
  {
    this.sendToSubContext({type: "message", event: evt, data: data});
  }

  public callAtSubContext(evt :string, data :any)
  {
    this.callId++;
    let impl=(res$ :any, rej$ :any)=>
    {
      this.callbacks[this.callId]=res$;
      this.sendToSubContext({type: "call", event: evt, callid: this.callId, data: data});
    }
    return new Promise(impl);
  }

  public onWebViewInit(msg :any)
  {
    console.log("init message from webview");
    this.loadInspection(this._inspection);
  }

  private onUpdate(msg :any)
  {
    this.emit("update", msg.data);
  }

  private async onSend(data :any, reply :any)
  {
    console.log("onsend", data);
    data.inspection = await Send.exec(data.inspection);
    reply(data);
  }

  loadInspection(inspection :any)
  {
    this.publishToSubContext("/load", {inspection: inspection});
  }

  async getInspection() :Promise<any>
  {
    return await this.callAtSubContext("/get", {});
  }
}