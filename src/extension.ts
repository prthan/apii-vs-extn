import * as vscode from 'vscode';
import { Commands } from './Commands';
import {InspectionEditorProvider} from './InspectionEditorProvider';

export function activate(context: vscode.ExtensionContext) 
{
	vscode.commands.registerCommand('apii.inspection.new', Commands.newInspectionCommand);    
	vscode.commands.registerCommand('apii.inspection.from-wsdl', Commands.newInspectionFromWSDLCommand);
	context.subscriptions.push(InspectionEditorProvider.register(context));	
}

export function deactivate() {} 

