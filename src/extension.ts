/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Intel Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode'
import { CircuitPanel } from './circuitPanel'
import * as fs from 'fs'

// this method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {

	updateCustomContext(vscode.window.activeTextEditor)
	vscode.window.onDidChangeActiveTextEditor(editor => { updateCustomContext(editor) })

	const setupCommand = 'intel-quantum.setup'
	const setup = () => {
		let assetPath: string = context.extensionUri.fsPath + '/assets/setupExamples'
		let dir: string = vscode.workspace.workspaceFolders![0].uri.fsPath + '/visualization'

		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir + '/circuits', { recursive: true });

			fs.copyFile(assetPath + '/exampleCircuit.json', dir + '/circuits/exampleCircuit.json', function (err) {
				if (err) {
					console.log(err);
				} else {
					console.log("exampleCircuit.json written successfully\n");
				}
			})

			fs.copyFile(assetPath + '/histogram.json', dir + '/histogram.json', function (err) {
				if (err) {
					console.log(err);
				} else {
					console.log("histogram.json written successfully\n");
				}
			})

			fs.copyFile(assetPath + '/README.md', dir + '/README.md', function (err) {
				if (err) {
					console.log(err);
				} else {
					console.log("README.md written successfully\n");
				}
			})
		}
	}
	context.subscriptions.push(vscode.commands.registerCommand(setupCommand, setup))

	const drawCircuitCommand = "intel-quantum.drawCircuit"
	const drawCircuit = () => {
		const editor = vscode.window.activeTextEditor

		if (editor !== undefined) {
			const document = editor.document
			const fileContent: string = document.getText()

			if (document.languageId === 'json') {

				try {
					let data: QData = JSON.parse(fileContent) as QData
					CircuitPanel.validateQData(data)
					CircuitPanel.displayWebview(context.extensionUri, data, true)
					vscode.ViewColumn.One
				} catch (e) {
					let dataError: QData = { title: (e as Error).message } as QData
					CircuitPanel.displayWebview(context.extensionUri, dataError, false)
					vscode.ViewColumn.One
				}
			}
		} else {
			console.log("No Active Editor")
		}
	}
	context.subscriptions.push(vscode.commands.registerCommand(drawCircuitCommand, drawCircuit))
}

function updateCustomContext(editor: vscode.TextEditor | undefined) {
	console.log(1)
	if (editor && editor.document.languageId === "json") {
		let editorText = editor.document.getText()
		console.log(editorText)
		console.log(editorText.includes('IntelQuantumID'))
		if (editorText.includes('IntelQuantumID')) {
			vscode.commands.executeCommand('setContext', 'customContext.quantumFile', true)
			console.log(3)
			return
		}
	}
	
	vscode.commands.executeCommand('setContext', 'customContext.quantumFile', false)
}

// this method is called when your extension is deactivated
export function deactivate() { }


