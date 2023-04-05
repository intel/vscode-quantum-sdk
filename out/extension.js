"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Intel Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const circuitPanel_1 = require("./circuitPanel");
const fs = require("fs");
// this method is called when your extension is activated
function activate(context) {
    updateCustomContext(vscode.window.activeTextEditor);
    vscode.window.onDidChangeActiveTextEditor(editor => { updateCustomContext(editor); });
    const setupCommand = 'intel-quantum.setup';
    const setup = () => {
        let assetPath = context.extensionUri.fsPath + '/assets/setupExamples';
        let dir = vscode.workspace.workspaceFolders[0].uri.fsPath + '/visualization';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir + '/circuits', { recursive: true });
            fs.copyFile(assetPath + '/exampleCircuit.json', dir + '/circuits/exampleCircuit.json', function (err) {
                if (err) {
                    console.log(err);
                }
                else {
                    console.log("exampleCircuit.json written successfully\n");
                }
            });
            fs.copyFile(assetPath + '/histogram.json', dir + '/histogram.json', function (err) {
                if (err) {
                    console.log(err);
                }
                else {
                    console.log("histogram.json written successfully\n");
                }
            });
            fs.copyFile(assetPath + '/README.md', dir + '/README.md', function (err) {
                if (err) {
                    console.log(err);
                }
                else {
                    console.log("README.md written successfully\n");
                }
            });
        }
    };
    context.subscriptions.push(vscode.commands.registerCommand(setupCommand, setup));
    const drawCircuitCommand = "intel-quantum.drawCircuit";
    const drawCircuit = () => {
        const editor = vscode.window.activeTextEditor;
        if (editor !== undefined) {
            const document = editor.document;
            const fileContent = document.getText();
            if (document.languageId === 'json') {
                try {
                    let data = JSON.parse(fileContent);
                    circuitPanel_1.CircuitPanel.validateQData(data);
                    circuitPanel_1.CircuitPanel.displayWebview(context.extensionUri, data, true);
                    vscode.ViewColumn.One;
                }
                catch (e) {
                    let dataError = { title: e.message };
                    circuitPanel_1.CircuitPanel.displayWebview(context.extensionUri, dataError, false);
                    vscode.ViewColumn.One;
                }
            }
        }
        else {
            console.log("No Active Editor");
        }
    };
    context.subscriptions.push(vscode.commands.registerCommand(drawCircuitCommand, drawCircuit));
}
exports.activate = activate;
function updateCustomContext(editor) {
    console.log(1);
    if (editor && editor.document.languageId === "json") {
        let editorText = editor.document.getText();
        console.log(editorText);
        console.log(editorText.includes('IntelQuantumID'));
        if (editorText.includes('IntelQuantumID')) {
            vscode.commands.executeCommand('setContext', 'customContext.quantumFile', true);
            console.log(3);
            return;
        }
    }
    vscode.commands.executeCommand('setContext', 'customContext.quantumFile', false);
}
// this method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map