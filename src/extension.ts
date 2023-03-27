/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Intel Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode'
import { CircuitPanel } from './circuitPanel'
import * as fs from 'fs'

// this method is called when your extension is activated
export function activate(context: vscode.ExtensionContext) {

	const setupCommand = 'intel-quantum.setup'
	const setup = () => {
		let assetPath: string = context.extensionUri.fsPath + '/assets/setupExamples'
		let dir: string = vscode.workspace.workspaceFolders![0].uri.fsPath + '/visualization'

		if (!fs.existsSync(dir)) {
			fs.mkdirSync(dir + '/circuits', { recursive: true });

			fs.copyFile(assetPath + '/exampleCircuit.iqsdk.json', dir + '/circuits/exampleCircuit.iqsdk.json', function (err) {
				if (err) {
					console.log(err);
				} else {
					console.log("exampleCircuit.iqsdk.json written successfully\n");
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

			if (document.fileName.endsWith(".iqsdk.json")) {

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

// this method is called when your extension is deactivated
export function deactivate() { }


