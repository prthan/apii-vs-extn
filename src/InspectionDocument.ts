import * as vscode from 'vscode';
import { Inspection } from './Inspection';

export class InspectionDocument implements vscode.CustomDocument 
{
	public static readonly emptyInspection :any=
	{
		name: 'Inspection',
		target: {method: "GET", endpoint: "http://localhost:8080/api"},
		request:
		{
			headers:[{header: "content-type", value: "application/json"},{header: "", value: ""},{header: "", value: ""}],
			content: ""
		},
		response:
		{
			headers:[{header: "", value: ""},{header: "", value: ""},{header: "", value: ""}],
			content: ""
		}
	}

	static async create(uri: vscode.Uri, backupId: string | undefined): Promise<InspectionDocument | PromiseLike<InspectionDocument>> 
	{
		const dataFile = typeof backupId === 'string' ? vscode.Uri.parse(backupId) : uri;
		const fileData = await InspectionDocument.readFile(dataFile);
		return new InspectionDocument(uri, fileData);
	}

	private static async readFile(uri: vscode.Uri): Promise<Uint8Array> 
	{
		if (uri.scheme === 'untitled') 
		{
			return Buffer.from(JSON.stringify(InspectionDocument.emptyInspection));
		}
		return vscode.workspace.fs.readFile(uri);
	}

	private readonly _uri: vscode.Uri;
	private _documentData: Uint8Array;
	private _inspection :Inspection;

	private constructor(uri: vscode.Uri, initialContent: Uint8Array) 
	{
		this._uri = uri;
		this._documentData = initialContent;
		this._inspection=JSON.parse(initialContent.toString() || "{}");
	}

	public get uri() {return this._uri;}
	public get documentData(): Uint8Array {return this._documentData;}
  public get inspection(): Inspection {return this._inspection}

	private readonly _onDidDisposeEventEmitter = new vscode.EventEmitter<void>();
	public readonly onDidDispose = this._onDidDisposeEventEmitter.event;

	private readonly _onDidChangeDocumentEventEmitter = new vscode.EventEmitter<InspectionDocument>();
	public readonly onDidChangeContent = this._onDidChangeDocumentEventEmitter.event;
	
	dispose(): void 
	{
		this._onDidDisposeEventEmitter.fire();
	}

	update(inspection :Inspection) 
	{
		this._inspection=inspection;
	}

  async save(cancellation: vscode.CancellationToken): Promise<void> 
	{
		console.log("save....");
		this._documentData=Buffer.from(JSON.stringify(this._inspection));
		await vscode.workspace.fs.writeFile(this._uri, this._documentData);
	}

	async saveAs(targetResource: vscode.Uri, cancellation: vscode.CancellationToken): Promise<void> 
	{
		console.log("save as....", this._inspection);
		if (cancellation.isCancellationRequested) return;
		await vscode.workspace.fs.writeFile(targetResource, Buffer.from(JSON.stringify(this._inspection)));
	}

	async revert(cancellation: vscode.CancellationToken): Promise<void> 
	{
		const diskContent = await InspectionDocument.readFile(this.uri);
		this._documentData = diskContent;
		this._inspection=JSON.parse(this._documentData.toString() || "{}");
		this._onDidChangeDocumentEventEmitter.fire(this);
	}

	async backup(destination: vscode.Uri, cancellation: vscode.CancellationToken): Promise<vscode.CustomDocumentBackup> 
	{
		await this.saveAs(destination, cancellation);
		const rval :vscode.CustomDocumentBackup=
		{
			id: destination.toString(),
			delete: async () => 
			{
				try 
				{
					await vscode.workspace.fs.delete(destination);
				} 
				catch 
				{
					// noop
				}
			}
		}
		return rval;
	}
}
