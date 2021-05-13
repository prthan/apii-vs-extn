import * as vscode from 'vscode';
import { Fetch } from './Fetch';
import { InspectionEditorProvider } from './InspectionEditorProvider';
import { JSDom } from './xml/jsdom';
import { WSDL } from './xml/wsdl';
import { XSD } from './xml/xsd';

export class Commands
{
  public static newInspectionCommand()
  {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) 
    {
      vscode.window.showErrorMessage("APIi needs a workspace to create an inspection file. Please open a workspace folder.");
      return;
    }
    const uri = vscode.Uri.joinPath(workspaceFolders[0].uri, `inspection-${InspectionEditorProvider.getNextEditorNumber()}.apii`).with({ scheme: 'untitled' });
    vscode.commands.executeCommand('vscode.openWith', uri, InspectionEditorProvider.viewType);
  }

  public static async newInspectionFromWSDLCommand()
  {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) 
    {
      vscode.window.showErrorMessage("APIi needs a workspace to create an inspection file. Please open a workspace folder.");
      return;
    }
    let wsdlURL=await vscode.window.showInputBox({title: "WSDL", placeHolder: "Enter the wsdl url", ignoreFocusOut: true});
    console.log("downloading wsdl artifacts from url: ", wsdlURL);
    if(!wsdlURL) return;
    JSDom.fetch=Fetch.getURL;
    vscode.window.withProgress({
      location: vscode.ProgressLocation.Notification,
      title: "APIi",
      cancellable: false
    }, (progress, token)=>
    {
      let onprogress=(msg :string)=>
      {
        console.log(msg);
        progress.report({message: msg});
      }
      let impl=async (res$ :any, rej$ :any)=>
      {
        let wsdl=new WSDL();
        try
        {
          await wsdl.fetch(wsdlURL, {onprogress: onprogress});  
          res$();
          Commands.generateInspectionsForOperations(wsdl, workspaceFolders[0].uri);
        }
        catch(err)
        {
          console.log("error occured while loading wsdl", err);
          rej$(err);
        }
      }
      return new Promise(impl);
    });
    
  }

  private static async generateInspectionsForOperations(wsdl :WSDL, folder :vscode.Uri)
  {
    let soapPortData=wsdl.getSOAPPort();
    let portTypeOperations=soapPortData.portTypeOperations
    let operationsMap :any={};
    let selectionItems :Array<any>=[];
    Object.keys(portTypeOperations).forEach((portType :string)=>
    {
      selectionItems.push({label: "$(symbol-interface) "+portType, portType: portType});
      let operations=portTypeOperations[portType];
      operations.forEach((operation :any)=>
      {
        let selectionItem={label: "    $(symbol-method) "+operation["@name"], portType: portType, operation: operation["@name"]}
        selectionItems.push(selectionItem);
        operationsMap[portType+"->"+operation["@name"]]=operation;
      });
    })
    
    let selectedItems :any=await vscode.window.showQuickPick(selectionItems, {canPickMany: true, ignoreFocusOut: true});
    if(selectedItems==null) return;

    let operationsToGenerate :any={};
    selectedItems.forEach((item :any)=>
    {
      if(item.operation) operationsToGenerate[item.portType+"->"+item.operation]=item.portType+"->"+item.operation;
      else
      {
        portTypeOperations[item.portType].forEach((operation :any)=>operationsToGenerate[item.portType+"->"+operation["@name"]]=item.portType+"->"+operation["@name"]);
      }
    });

    let oxsd=new XSD();
    oxsd.schemas=wsdl.schemas;
    oxsd.createSchemaMap();
    console.log(oxsd.schemaMap);

    wsdl.ns["soap-env"]="http://schemas.xmlsoap.org/soap/envelope/";

    console.log("Generating inspections for the selected operation");
    let inspections :Array<any>=[];
    Object.keys(operationsToGenerate).forEach((key :any)=>
    {
      let keyParts=key.split("->");
      let operation=operationsMap[key];
      let operationName=operation["@name"];
      let portType=keyParts[0];

      console.log(`generating input data for operation ${portType}->${operationName}`);
      let jsdom=new JSDom();
      let obj=oxsd.createObject(operation.inputElement.name, operation.inputElement.ns);
      jsdom.ns=wsdl.ns;
      jsdom.doc=Commands.emptySOAPEnvelope();
      jsdom.doc.Envelope.Body={...jsdom.doc.Envelope.Body, ...obj};
      jsdom.instructions.push({name: 'xml', body: `version="1.0"`});
      let requestContent=jsdom.generate(2);

      let operationInspection=
      {
        portType: portType,
        operation: operationName,
        wsdlURL: wsdl["@location"],
        name: operationName,
        target: {method: "POST", endpoint: operation.endPoint},
        request: {headers:[{header: "content-type", value: "text/xml"},{header: "soap-action", value: operation.soapAction}], content: requestContent},
        response: {headers:[{header: "", value: ""},{header: "", value: ""},],content: ""}
      }
      inspections.push(operationInspection);
    })

    for(let inspection of inspections)
    {
      let portTypeFolder=vscode.Uri.joinPath(folder, inspection.portType);
      let operationInspectionfile=vscode.Uri.joinPath(portTypeFolder, inspection.operation+".apii");
      await vscode.workspace.fs.createDirectory(portTypeFolder);
      await vscode.workspace.fs.writeFile(operationInspectionfile, Buffer.from(JSON.stringify(inspection)));
    }
    console.log("Inspections generated for the selected operations");
  }

  static emptySOAPEnvelope()
  {
    return {
      Envelope:
      {
        $ns: "http://schemas.xmlsoap.org/soap/envelope/",
        Header: {$ns: "http://schemas.xmlsoap.org/soap/envelope/"},
        Body: {$ns: "http://schemas.xmlsoap.org/soap/envelope/"},
      }
    }
  }  
}
