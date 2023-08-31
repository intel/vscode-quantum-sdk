/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Intel Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode'
import { CircuitPanel } from './circuitPanel'
import * as fs from 'fs'
import { QCircuitData, QHistogramData } from './types'
import * as subp from 'child_process'
import MyCodeLensProvider from './codeLensProvider'

export function activate(context: vscode.ExtensionContext) {

	// Commands
	const setupCommand = 'intel-quantum.setup'
	const setup = () => {
		let assetPath: string = context.extensionUri.fsPath + '/assets/setupExamples'
		let visDir: string = vscode.workspace.workspaceFolders![0].uri.fsPath + '/visualization'

		if (!fs.existsSync(visDir)) {
			fs.mkdirSync(visDir + '/circuits', { recursive: true })

			fs.copyFile(assetPath + '/exampleCircuit.json', visDir + '/circuits/exampleCircuit.json', function (err) {
				if (err) {
					console.log(err)
				} else {
					console.log("exampleCircuit.json written successfully\n")
				}
			})

			fs.mkdirSync(visDir + '/histograms', { recursive: true })

			fs.copyFile(assetPath + '/histogram.json', visDir + '/histograms/histogram.json', function (err) {
				if (err) {
					console.log(err)
				} else {
					console.log("histogram.json written successfully\n")
				}
			})

			fs.mkdirSync(visDir + '/outputs', { recursive: true })
		}
	}
	context.subscriptions.push(vscode.commands.registerCommand(setupCommand, setup))

	const drawCircuitCommand = "intel-quantum.drawCircuit"
	const drawCircuit = () => {
		const editor = vscode.window.activeTextEditor
		if (editor === undefined) {
			console.log("No Active Editor")
			return
		}

		if (editor.document.languageId === 'json') {
			execDrawRoutine(editor.document.getText())
		}
	}
	context.subscriptions.push(vscode.commands.registerCommand(drawCircuitCommand, drawCircuit))

	const drawHistogramCommand = "intel-quantum.drawHistogram"
	const drawHistogram = () => {
		const editor = vscode.window.activeTextEditor
		if (editor === undefined) {
			console.log("No Active Editor")
			return
		}

		try {
			let data: QHistogramData = JSON.parse(editor.document.getText()) as QHistogramData
			CircuitPanel.validateQHistogramData(data)
			CircuitPanel.displayHistogramWebview(context.extensionUri, data)
		} catch (e) {
			let dataError: QCircuitData = { title: (e as Error).message } as QCircuitData
			CircuitPanel.displayCircuitWebview(context.extensionUri, dataError, false)
		}
	}
	context.subscriptions.push(vscode.commands.registerCommand(drawHistogramCommand, drawHistogram))

	let codeLensProviderDisposable = vscode.languages.registerCodeLensProvider(
		{
			language: "cpp",
			scheme: "file"
		},
		new MyCodeLensProvider()
	)
	context.subscriptions.push(codeLensProviderDisposable)

	const compileCPPCommand = "intel-quantum.compileCPP"
	const compileCPP = (kernelName: string) => {
		const editor = vscode.window.activeTextEditor
		if (editor === undefined) {
			console.log("No Active Editor")
			return
		}

		prepDocker()
		setup()
		const dir = vscode.workspace.workspaceFolders![0].uri.path
		const name = editor.document.fileName.split('.').slice(0, -1).join('.').split('/').pop()
		const command = `docker run --rm -p 3000:3000 -v ${dir}:/data intellabs/intel_quantum_sdk bash -c "./intel-quantum-compiler -P json /data/${name}.cpp && mv Visualization/**${kernelName}** /data/visualization/circuits/${kernelName}.json"`

		subShell(command).then((stdout) => {

			const channel = vscode.window.createOutputChannel('MyExtension')
			channel.appendLine(stdout)
			channel.show()

			const filePath = dir + '/visualization/circuits/' + kernelName + '.json'
			const fileContents = fs.readFileSync(filePath, 'utf8')
			execDrawRoutine(fileContents)

		}).catch((output) => {
			const channel = vscode.window.createOutputChannel('MyExtension')
			channel.appendLine(output)
			channel.show()
		})
	}
	context.subscriptions.push(vscode.commands.registerCommand(compileCPPCommand, compileCPP))

	const executeCPPCommand = "intel-quantum.executeCPP"
	const executeCPP = (kernelName: string) => {
		const editor = vscode.window.activeTextEditor
		if (editor === undefined) {
			console.log("No Active Editor")
			return
		}

		prepDocker()
		setup()
		const dir = vscode.workspace.workspaceFolders![0].uri.path
		const name = editor.document.fileName.split('.').slice(0, -1).join('.').split('/').pop()
		const command = `docker run --rm -p 3000:3000 -v ${dir}:/data intellabs/intel_quantum_sdk bash -c "./intel-quantum-compiler /data/${name}.cpp && ./${name} > ${name}.out && mv ${name}.out /data/visualization/outputs/${name}.out"`

		subShell(command).then((stdout) => {

			const channel = vscode.window.createOutputChannel('MyExtension')
			channel.appendLine(stdout)
			channel.show()

			const filePath = dir + '/visualization/outputs/' + name + '.out'
			const openPath = vscode.Uri.file(filePath)
			vscode.workspace.openTextDocument(openPath).then(doc => {
				vscode.window.showTextDocument(doc, vscode.ViewColumn.Two)
			})

		}).catch((output) => {
			const channel = vscode.window.createOutputChannel('MyExtension')
			channel.appendLine(output)
			channel.show()
		})
	}
	context.subscriptions.push(vscode.commands.registerCommand(executeCPPCommand, executeCPP))

	const exportPngCommand = "intel-quantum.exportPng"
	const exportPng = () => { CircuitPanel.exportCircuit() }
	context.subscriptions.push(vscode.commands.registerCommand(exportPngCommand, exportPng))

	// Helper functions
	const subShell = (cmd: string) => new Promise<string>((resolve, reject) => {
		subp.exec(cmd, (err, out) => {
			if (err) { return reject(err) }
			return resolve(out)
		})
	})

	const execDrawRoutine = (circuitData: string) => {
		try {
			let data: QCircuitData = JSON.parse(circuitData) as QCircuitData
			CircuitPanel.validateQCircuitData(data)
			CircuitPanel.displayCircuitWebview(context.extensionUri, data, true)
		} catch (e) {
			let dataError: QCircuitData = { title: (e as Error).message } as QCircuitData
			CircuitPanel.displayCircuitWebview(context.extensionUri, dataError, false)
		}
	}

	const updateCustomContext = () => {

		const editor = vscode.window.activeTextEditor
		if (editor === undefined) {
			console.log("No Active Editor")
			return
		}

		// Set all contexts to false
		vscode.commands.executeCommand('setContext', 'customContext.quantumCircuitFile', false)
		vscode.commands.executeCommand('setContext', 'customContext.quantumHistogramFile', false)
		vscode.commands.executeCommand('setContext', 'customContext.quantumCPPScript', false)

		// Set correct context to true
		let editorText = editor.document.getText()
		if (editor.document.languageId === "json") {
			if (!editorText.includes('IntelQuantumID')) {
				return
			} else if (editorText.includes('Circuit')) {
				vscode.commands.executeCommand('setContext', 'customContext.quantumCircuitFile', true)
				return
			} else if (editorText.includes('Histogram')) {
				vscode.commands.executeCommand('setContext', 'customContext.quantumHistogramFile', true)
				return
			}
		} else if (editor.document.languageId === "cpp") {
			const regex = new RegExp(/[^\S\r\n]*#[^\S\r\n]*include[^\S\r\n]*<[^\S\r\n]*quantum.hpp[^\S\r\n]*>[^\S\r\n]*/)
			if (regex.test(editorText)) {
				vscode.commands.executeCommand('setContext', 'customContext.quantumCPPScript', true)
				return
			}
		}
	}

	const prepDocker = () => {
		const checkImageCommand = 'docker image inspect intellabs/intel_quantum_sdk:latest > /dev/null 2>&1'
		subShell(checkImageCommand).then(() => {}).catch(() => {
			const channel = vscode.window.createOutputChannel('MyExtension')
			channel.appendLine('Docker Image Required!\n')
			channel.appendLine('If you have not installed Docker go here https://www.docker.com/get-started/ \n')
			channel.appendLine('Once Docker is installed run the following command')
			channel.appendLine('docker pull intellabs/intel_quantum_sdk')
			channel.show()
		})
	}

	// On activate
	updateCustomContext()
	vscode.window.onDidChangeActiveTextEditor(() => { updateCustomContext() })
}

export function deactivate() { }