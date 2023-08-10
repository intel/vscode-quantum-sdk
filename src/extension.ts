/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Intel Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode'
import { CircuitPanel } from './circuitPanel'
import * as fs from 'fs'
import { QCircuitData, QHistogramData } from './types'
<<<<<<< HEAD
import * as subp from 'child_process'
=======
>>>>>>> main

export function activate(context: vscode.ExtensionContext) {

	let dir = vscode.workspace.workspaceFolders![0].uri.path

    	//promise based system shell commnd, hoist if deemed useful elsewhere
    	const subShell = (cmd: string ) => new Promise<string>((resolve, reject) => {
    	    subp.exec(cmd, (err, out) => {
    	        if (err) return reject(err);
    	        return resolve(out);
    	    });
    	});

	updateCustomContext(vscode.window.activeTextEditor)
	vscode.window.onDidChangeActiveTextEditor(editor => { updateCustomContext(editor) })

	const setupCommand = 'intel-quantum.setup'
	const setup = () => {
		let assetPath: string = context.extensionUri.fsPath + '/assets/setupExamples'
		let visDir: string = vscode.workspace.workspaceFolders![0].uri.fsPath + '/visualization'

		if (!fs.existsSync(visDir)) {
			fs.mkdirSync(visDir + '/circuits', { recursive: true });

			fs.copyFile(assetPath + '/exampleCircuit.json', visDir + '/circuits/exampleCircuit.json', function (err) {
				if (err) {
					console.log(err);
				} else {
					console.log("exampleCircuit.json written successfully\n");
				}
			})

			fs.copyFile(assetPath + '/histogram.json', visDir + '/histogram.json', function (err) {
				if (err) {
					console.log(err);
				} else {
					console.log("histogram.json written successfully\n");
				}
			})

			fs.copyFile(assetPath + '/README.md', visDir + '/README.md', function (err) {
				if (err) {
					console.log(err);
				} else {
					console.log("README.md written successfully\n");
				}
			})
		}
	}
	context.subscriptions.push(vscode.commands.registerCommand(setupCommand, setup))

	const execDrawRoutine = ( circuitData: string ) => {
        	try {
        	    let data: QData = JSON.parse(circuitData) as QData
        	    CircuitPanel.validateQData(data)
        	    CircuitPanel.displayWebview(context.extensionUri, data, true)
        	    //vscode.ViewColumn.One
        	} catch (e) {
        	    let dataError: QData = { title: (e as Error).message } as QData
        	    CircuitPanel.displayWebview(context.extensionUri, dataError, false)
        	    //vscode.ViewColumn.One
        	}
    	}

	const drawCircuitCommand = "intel-quantum.drawCircuit"
	const drawCircuit = () => {
		const editor = vscode.window.activeTextEditor
		let fileContent: string = ''

		if (editor !== undefined) {
			if (editor.document.languageId === 'json') {
<<<<<<< HEAD
                		execDrawRoutine( editor.document.getText() )
			} else if (editor.document.languageId === 'cpp') {
                		const name = editor.document.fileName.split('.').slice(0, -1).join('.').split('/').pop()
                		subShell( "cd /home/workspace && make -f /home/iqsdk_user/Makefile NAME="+name ).then( () => {
                			const cursorPosition = editor.selection.active;
                			const lineText = editor.document.lineAt(cursorPosition.line).text;
                			let KernelName = "MainCircuit";

                			subShell("cat /home/workspace/Visualization/*MainCircuit*.json").then((out)=> {
                        	    		//console.log(out)
                				execDrawRoutine(out)
                			})
                		})
=======
				fileContent = editor.document.getText()
			}
			// else if (editor.document.languageId === 'cpp') {

			// }

			try {
				let data: QCircuitData = JSON.parse(fileContent) as QCircuitData
				CircuitPanel.validateQCircuitData(data)
				CircuitPanel.displayCircuitWebview(context.extensionUri, data, true)
			} catch (e) {
				let dataError: QCircuitData = { title: (e as Error).message } as QCircuitData
				CircuitPanel.displayCircuitWebview(context.extensionUri, dataError, false)
>>>>>>> main
			}
		} else {
			console.log("No Active Editor")
		}
	}
	context.subscriptions.push(vscode.commands.registerCommand(drawCircuitCommand, drawCircuit))

	const drawHistogramCommand = "intel-quantum.drawHistogram"
	const drawHistogram = () => {
		const editor = vscode.window.activeTextEditor
		let fileContent: string = ''

		if (editor !== undefined) {
			if (editor.document.languageId === 'json') {
				fileContent = editor.document.getText()
			}
			// else if (editor.document.languageId === 'cpp') {

			// }

			try {
				let data: QHistogramData = JSON.parse(fileContent) as QHistogramData
				CircuitPanel.validateQHistogramData(data)
				CircuitPanel.displayHistogramWebview(context.extensionUri, data)
			} catch (e) {
				let dataError: QCircuitData = { title: (e as Error).message } as QCircuitData
				CircuitPanel.displayCircuitWebview(context.extensionUri, dataError, false)
			}
		} else {
			console.log("No Active Editor")
		}
	}
	context.subscriptions.push(vscode.commands.registerCommand(drawHistogramCommand, drawHistogram))

	const exportPngCommand = "intel-quantum.exportPng"
	const exportPng = () => { CircuitPanel.exportCircuit() }
	context.subscriptions.push(vscode.commands.registerCommand(exportPngCommand, exportPng))
}

function updateCustomContext(editor: vscode.TextEditor | undefined) {
	// Set all contexts to false
	vscode.commands.executeCommand('setContext', 'customContext.quantumCircuitFile', false)
	vscode.commands.executeCommand('setContext', 'customContext.quantumHistogramFile', false)
<<<<<<< HEAD
	vscode.commands.executeCommand('setContext', 'customContext.quantumFile', false)
=======
>>>>>>> main

	// Set correct context to true
	if (editor && editor.document.languageId === "json") {
		let editorText = editor.document.getText()
		if (!editorText.includes('IntelQuantumID')) {
			return
		}

		if (editorText.includes('Circuit')) {
			vscode.commands.executeCommand('setContext', 'customContext.quantumCircuitFile', true)
			return
		}

		if (editorText.includes('Histogram')) {
			vscode.commands.executeCommand('setContext', 'customContext.quantumHistogramFile', true)
<<<<<<< HEAD
			return
		}
	} else if (editor && editor.document.languageId === "cpp") {
		let editorText = editor.document.getText()
        //const regex = new RegExp('^[^\S\r\n]*#[^\S\r\n]*include[^\S\r\n]*<[^\S\r\n]*quantum.hpp[^\S\r\n]*>[^\S\r\n]*$');
        const regex = new RegExp('#include[^\S\r\n]*<[^\S\r\n]*quantum.hpp[^\S\r\n]*>', 'g');
		if( regex.test(editorText) ){ 
		//if (editorText.includes('#include <quantum.hpp>')) { 
			vscode.commands.executeCommand('setContext', 'customContext.quantumFile', true)
			return
		}
}

export function deactivate() { }
=======
			return
		}
	}
	// else if (editor && editor.document.languageId === "cpp") {
		// 	let editorText = editor.document.getText()
		// 	if (editorText.includes('#include <quantum.hpp>')) { 
		// 		vscode.commands.executeCommand('setContext', 'customContext.quantumFile', true)
		// 		return
		// 	}
}

export function deactivate() { }
>>>>>>> main
