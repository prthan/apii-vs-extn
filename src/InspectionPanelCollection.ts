import * as vscode from 'vscode';
import {InspectionPanel} from "./InspectionPanel"

export class InspectionPanelCollection 
{
	private readonly _collection :any= new Set<{readonly resource: string; readonly panel: InspectionPanel}>();

	public *get(uri: vscode.Uri): Iterable<InspectionPanel> 
	{
		const key = uri.toString();
		for (const entry of this._collection) 
		{
			if (entry.resource === key) yield entry.panel;
		}
	}

	public add(uri: vscode.Uri, panel: InspectionPanel) 
	{
		const entry = { resource: uri.toString(), panel: panel };
		this._collection.add(entry);
		panel.webviewPanel.onDidDispose(() => this._collection.delete(entry));
	}
}