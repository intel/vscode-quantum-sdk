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
			fs.mkdirSync(visDir)
		}
		if (!fs.existsSync(visDir + '/circuits')) {
			fs.mkdirSync(visDir + '/circuits', { recursive: true })

			fs.copyFile(assetPath + '/exampleCircuit.json', visDir + '/circuits/exampleCircuit.json', function (err) {
				if (err) {
					console.log(err)
				} else {
					console.log("exampleCircuit.json written successfully\n")
				}
			})
		}
		if (!fs.existsSync(visDir + '/histograms')) {

			fs.mkdirSync(visDir + '/histograms', { recursive: true })

			fs.copyFile(assetPath + '/histogram.json', visDir + '/histograms/histogram.json', function (err) {
				if (err) {
					console.log(err)
				} else {
					console.log("histogram.json written successfully\n")
				}
			})
		}
		if (!fs.existsSync(visDir + '/outputs')) {
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

		prepPodman()
		setup()
		const dir = vscode.workspace.workspaceFolders![0].uri.path
		const name = editor.document.fileName.split('.').slice(0, -1).join('.').split('/').pop()
		const command = `podman run --rm -p 3000:3000 -v ${dir}:/data intellabs/intel_quantum_sdk bash -c "./intel-quantum-compiler -P json /data/${name}.cpp && mv Visualization/**${kernelName}** /data/visualization/circuits/${kernelName}.json"`

		subShell(command).then((stdout) => {
			channel.appendLine(stdout)
			channel.show()

			const filePath = dir + '/visualization/circuits/' + kernelName + '.json'
			const fileContents = fs.readFileSync(filePath, 'utf8')
			execDrawRoutine(fileContents)
		}).catch((output) => {
			channel.appendLine(output)
			channel.show()
		})
	}
	context.subscriptions.push(vscode.commands.registerCommand(compileCPPCommand, compileCPP))

	const executeCPPCommand = "intel-quantum.executeCPP"
	const executeCPP = () => {
		const editor = vscode.window.activeTextEditor
		if (editor === undefined) {
			console.log("No Active Editor")
			return
		}

		prepPodman()
		setup()
		const dir = vscode.workspace.workspaceFolders![0].uri.path
		const name = editor.document.fileName.split('.').slice(0, -1).join('.').split('/').pop()
		const command = `podman run --rm -p 3000:3000 -v ${dir}:/data intellabs/intel_quantum_sdk bash -c "./intel-quantum-compiler /data/${name}.cpp && ./${name} > ${name}.out && mv ${name}.out /data/visualization/outputs/${name}.out"`

		subShell(command).then((stdout) => {
			channel.appendLine(stdout)
			channel.show()

			const filePath = dir + '/visualization/outputs/' + name + '.out'
			const openPath = vscode.Uri.file(filePath)
			vscode.workspace.openTextDocument(openPath).then(doc => {
				vscode.window.showTextDocument(doc, vscode.ViewColumn.Two)
			})

		}).catch((output) => {
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

		// Set all contexts to false
		vscode.commands.executeCommand('setContext', 'customContext.quantumCircuitFile', false)
		vscode.commands.executeCommand('setContext', 'customContext.quantumHistogramFile', false)
		vscode.commands.executeCommand('setContext', 'customContext.quantumCPPScript', false)

		// Set correct context to true
		const editor = vscode.window.activeTextEditor
		if (editor === undefined) { return }

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

	const prepPodman = () => {
		const checkPodmanCommand = 'command -v podman || exit 1'
		const checkImageCommand = 'podman image inspect intellabs/intel_quantum_sdk:latest > /dev/null 2>&1'

		subShell(checkPodmanCommand).then(() => {
			subShell(checkImageCommand).then(() => { }).catch(() => {
				channel.appendLine('Podman Image Required!\n')
				channel.appendLine('Attempting to pull Intel Quantum SDK image')
				channel.show()

				const terminal = vscode.window.createTerminal(`Pull Intel Quantum Image`);
				terminal.sendText('podman pull docker.io/intellabs/intel_quantum_sdk')
				terminal.show()
			})
		}).catch(() => {
			channel.appendLine('Podman is required\n')
			channel.appendLine('To install Podman use the following links\n')
			channel.appendLine('Ubuntu or WSL with Ubuntu - https://podman.io/docs/installation#ubuntu')
			channel.appendLine('MacOS - https://podman.io/docs/installation#macos')
			channel.show()
		})
	}

	// On activate
	const channel = vscode.window.createOutputChannel('Quantum Compile Output')
	updateCustomContext()
	vscode.window.onDidChangeActiveTextEditor(() => { updateCustomContext() })
	vscode.workspace.onDidSaveTextDocument(() => { updateCustomContext() })
}

export function deactivate() { }