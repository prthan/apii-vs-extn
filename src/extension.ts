import * as vscode from 'vscode';
import {InspectionEditorProvider} from './InspectionEditorProvider';

export function activate(context: vscode.ExtensionContext) 
{
	console.log("registering editor");
	context.subscriptions.push(InspectionEditorProvider.register(context));	
}

export function deactivate() {} 

