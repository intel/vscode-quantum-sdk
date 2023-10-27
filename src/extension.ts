/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Intel Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode'
import { CircuitPanel } from './circuitPanel'
import * as fs from 'fs'
import * as path from 'path'
import { CompilerEngine, CompilerOption, QCircuitData, QHistogramData, SDKAction } from './types'
import * as subp from 'child_process'
import MyCodeLensProvider from './codeLensProvider'

export function activate(context: vscode.ExtensionContext) {

	// Commands
	const setupCommand = 'intel-quantum.setup'
	const prepFileStructure = () => {
		let assetPath: string = context.extensionUri.fsPath + '/assets/setupExamples'
		let visDir = path.posix.dirname(vscode.window.activeTextEditor!.document.fileName) + '/.iqsdk';

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
		if (!fs.existsSync(visDir + '/compile.json')) {
			fs.copyFile(assetPath + '/compile.json', visDir + '/compile.json', function (err) {
				if (err) {
					console.log(err)
				} else {
					console.log("compile.json written successfully\n")
				}
			})
		}
	}
	context.subscriptions.push(vscode.commands.registerCommand(setupCommand, prepFileStructure))

	const drawCircuitFromJsonCommand = "intel-quantum.drawCircuitFromJson"
	const drawCircuitFromJson = () => {
		const editor = vscode.window.activeTextEditor
		if (!editor) {
			console.log("No Active Editor")
			return
		}

		execDrawRoutine(editor.document.getText())
	}
	context.subscriptions.push(vscode.commands.registerCommand(drawCircuitFromJsonCommand, drawCircuitFromJson))

	const drawHistogramCommand = "intel-quantum.drawHistogram"
	const drawHistogram = () => {
		const editor = vscode.window.activeTextEditor
		if (!editor) {
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

	const drawCircuitFromCPPCommand = "intel-quantum.drawCircuitFromCPP"
	const drawCircuitFromCPP = (kernelName: string) => {

		prepFileStructure()
		const [dir, name, command] = getShellInfo(SDKAction.drawCircuit, kernelName)

		if (command === '') { return }

		subShell(command).then((stdout) => {
			channel.appendLine(stdout)
			channel.show()

			const filePath = dir + '/.iqsdk/circuits/' + kernelName + '.json'
			const fileContents = fs.readFileSync(filePath, 'utf8')
			execDrawRoutine(fileContents)
		}).catch((output) => {
			channel.appendLine(output)
			channel.show()
		})
	}
	context.subscriptions.push(vscode.commands.registerCommand(drawCircuitFromCPPCommand, drawCircuitFromCPP))

	const executeCPPCommand = "intel-quantum.executeCPP"
	const executeCPP = () => {

		prepFileStructure()
		const [dir, name, command] = getShellInfo(SDKAction.executeCPP)

		if (command === '') { return }

		subShell(command).then((stdout) => {
			channel.appendLine(stdout)
			channel.show()

			const filePath = dir + '/.iqsdk/outputs/' + name + '.out'
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
			//need to match both prod and dev includes, the following regex is overly accepting...
			//#include <clang/Quantum/quintrinsics.h>
			//#include "../../clang/include/clang/Quantum/quintrinsics.h"
			const regex = new RegExp(/[ \t]*#[ \t]*include[ \t\S]*clang\/Quantum\/quintrinsics.h[ \t>"]*/)
			if (regex.test(editorText)) {
				vscode.commands.executeCommand('setContext', 'customContext.quantumCPPScript', true)
				return
			}
		}
	}

	const prepContainerEngine = (engine: CompilerEngine) => {
		const checkEngineCommand = `command -v ${CompilerEngine[engine]} || exit 1`
		const checkImageCommand = `${CompilerEngine[engine]} image inspect intellabs/intel_quantum_sdk:latest > /dev/null 2>&1`

		subShell(checkEngineCommand).then(() => {
			subShell(checkImageCommand).then(() => { }).catch(() => {
				channel.appendLine(`${CompilerEngine[engine]} Image Required!\n`)
				channel.appendLine('Attempting to pull Intel Quantum SDK image')
				channel.show()

				const terminal = vscode.window.createTerminal(`Pull Intel Quantum Image`);
				terminal.sendText(`${CompilerEngine[engine]} pull docker.io/intellabs/intel_quantum_sdk`)
				terminal.show()
			})
		}).catch(() => {
			channel.appendLine(`The container engine specified in your compile.json file (${CompilerEngine[engine]}) is required\n`)
			channel.show()
		})
	}

	const getShellInfo = (action: SDKAction, kernelName?: string): [string, string, string] => {
		const editor = vscode.window.activeTextEditor
		if (editor === undefined) {
			console.log("No Active Editor")
			return ['', '', '']
		}

		const dir = path.posix.dirname(vscode.window.activeTextEditor!.document.fileName);
		const name = editor.document.fileName.split('.').slice(0, -1).join('.').split('/').pop()

		// Parse compile.json
		const jsonData = fs.readFileSync(`${dir}/.iqsdk/compile.json`, 'utf-8')
		const parsedData = JSON.parse(jsonData)
		const optionsList = parsedData["options"]

		const optionNames = {
			[SDKAction.drawCircuit]: 'active-circuit-option',
			[SDKAction.executeCPP]: 'active-execute-option',
		}
		const activeOptionName = parsedData[optionNames[action]]

		if (!activeOptionName) {
			console.log('active option is not defined')
			return ['', '', ''] 
		} else if (!optionsList || optionsList.length === 0) {
			console.log('options list is not defined')
			return ['', '', '']
		} else if (!activeOptionName) {
			console.log('active option does not match any defined options')
			return ['', '', '']
		}

		const activeOption : CompilerOption = optionsList.find((option: any) => option.name === activeOptionName)

		// Create Command
		const rm = activeOption.remove ? '--rm' : ''
		const args = activeOption.args.join(' ')
		let secondHalfOfCommand = ''
		if (action == SDKAction.drawCircuit) {
			secondHalfOfCommand = `-P json /data/${name}.cpp && mv Visualization/**${kernelName}** /data/.iqsdk/circuits/${kernelName}.json`
		} else if (action == SDKAction.executeCPP) {
			secondHalfOfCommand = `/data/${name}.cpp && ./${name} > ${name}.out && mv ${name}.out /data/.iqsdk/outputs/${name}.out`
		}

		if (activeOption.engine == CompilerEngine.local) {
			var command = ''
		} else {
			prepContainerEngine(activeOption.engine)
			var command = `${activeOption.engine} run ${rm} ${args} -v ${dir}:/data intellabs/intel_quantum_sdk bash -c "./intel-quantum-compiler ${secondHalfOfCommand}"`
		}

		return [dir, name!, command]
	}

	// On activate
	const channel = vscode.window.createOutputChannel('Quantum Compile Output')
	updateCustomContext()
	vscode.window.onDidChangeActiveTextEditor(() => { updateCustomContext() })
	vscode.workspace.onDidSaveTextDocument(() => { updateCustomContext() })
}

export function deactivate() { }