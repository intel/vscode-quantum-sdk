/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Intel Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as vscode from "vscode"
import { drawBoard, getBackgroundHeight, getBackgroundWidth, initData } from "./draw"
import * as fs from 'fs'
import * as svg2png from 'svg2png'

/**
 * Represents a vscode panel which can handle the creation, storage,
 * manipulation and deletion of the webview panel for displaying
 * the quantum circuit diagrams.
 */
export class CircuitPanel {

  public static instance: CircuitPanel | undefined

  private readonly panel: vscode.WebviewPanel
  private readonly uri: vscode.Uri
  public jsonCircuitData: QCircuitData
  public jsonHistogramData: QHistogramData

  private disposables: vscode.Disposable[] = []

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, content: any) {
    this.panel = panel
    this.uri = extensionUri
    this.jsonCircuitData = content
    this.jsonHistogramData = content

    this.panel.iconPath = {
      light: vscode.Uri.joinPath(this.uri, "assets", "logos", "iqsdk-light.png"),
      dark: vscode.Uri.joinPath(this.uri, "assets", "logos", "iqsdk-dark.png"),
    }

    this.panel.onDidDispose(() => this.dispose(), null, this.disposables)
  }

  /**
   * Reveals panel if there is an instance stored, otherwise creates one
   * and stores it. Then calls setPanelData() to update panel content. 
   */
  public static displayCircuitWebview(extensionUri: vscode.Uri, data: QCircuitData, valid: boolean) {

    if (CircuitPanel.instance) {
      CircuitPanel.instance.jsonCircuitData = data
      valid ? CircuitPanel.instance.setCircuitPanelData() : CircuitPanel.instance.setPanelError()
      CircuitPanel.instance.panel.reveal(vscode.ViewColumn.Two, true)
    } else {
      const panel = vscode.window.createWebviewPanel(
        "iqsdk-circuit",
        "Quantum Circuit",
        {
          viewColumn: vscode.ViewColumn.Two,
          preserveFocus: true
        },
        {
          localResourceRoots: [vscode.Uri.joinPath(extensionUri, "assets")],
          enableScripts: true,
        }
      )

      CircuitPanel.instance = new CircuitPanel(panel, extensionUri, data)
      valid ? CircuitPanel.instance.setCircuitPanelData() : CircuitPanel.instance.setPanelError()
    }
  }

  /**
   * Gathers assets and input json data to create the webview content 
   * for a circuit board and assigns it to the panel's webview.
   */
  private setCircuitPanelData() {
    const webview = this.panel.webview

    // Create links to all assets
    const mainScriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.uri, "assets", "javascripts", "main.js")
    )
    const panzoomScriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.uri, "assets", "javascripts", "panzoom.js")
    )
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.uri, "assets", "styles", "style.css")
    )

    initData(this.jsonCircuitData, false)
    this.panel.webview.html = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
              <meta charset="UTF-8">
              <link href="${styleUri}" rel="stylesheet">
              <script src="${panzoomScriptUri}"></script>
              <script src="${mainScriptUri}"></script>
            </head>
            <body onload="initializePanzoom(${getBackgroundWidth()}, ${getBackgroundHeight()})">
              <div id="attributes" display="none"></div>
              <h1 id="title">${this.jsonCircuitData.title}</h1>
              <svg id='scene' width="95%" height="60%">
                <g id='circuitBoard'>
                  ${drawBoard()}
                </g>
              </svg>  
            </body>
            </html>`
  }

  /**
   * Checks that the json is valid for a quantum circuit board
   */
  public static validateQCircuitData(data: QCircuitData) {

    // Syntax
    if (data.title === undefined) {
      throw new Error('Json File Missing Title <br><br>Example <br>"title": "My Circuit",')
    } else if (data.numQbits === undefined) {
      throw new Error('Json File Missing Qbit Quantity <br><br>Example <br>"numQbits": 2,')
    } else if (data.qbitNames === undefined) {
      throw new Error('Json File Missing Qbit Names <br><br>Example <br>"qbitNames": [<br>"example_0",<br>""<br>],')
    } else if (data.gates === undefined) {
      throw new Error('Json File Missing List of Gates <br><br>Example <br> "gates" : [<br>{<br>"name" : "X",<br>"qubits" : [0]<br>},<br>{<br>"name" : "H",<br>"qubits" : [1]<br>},')
    }

    // Semantic
    if (data.numQbits !== data.qbitNames.length) {
      throw new Error('Size of qbitNames list does not match numQbits')
    }

    data.gates.forEach((gate, index) => {
      // Syntax
      if (gate.name === undefined) {
        throw new Error('gate at index ' + index + ' needs a name <br><br>Example <br>"name" : "H",')
      } else if (gate.qubits === undefined) {
        throw new Error('gate at index ' + index + ' needs a qbit(s) to act upon <br><br>Example <br>"qubits" : [0]')
      }

      // Semantic
      for (let qbit of gate.qubits) {
        if (qbit >= data.numQbits) {
          throw new Error('gate at index ' + index + ' acts on a qbit outside of the range defined by numQbits')
        }
      }
    })
  }

  /**
   * Reveals panel if there is an instance stored, otherwise creates one
   * and stores it. Then calls setHistogramPanelData() to update panel content. 
   */
  public static displayHistogramWebview(extensionUri: vscode.Uri, data: QHistogramData) {
    if (CircuitPanel.instance) {
      CircuitPanel.instance.jsonHistogramData = data
      CircuitPanel.instance.setHistogramPanelData()
      CircuitPanel.instance.panel.reveal(vscode.ViewColumn.Two, true)
    } else {
      const panel = vscode.window.createWebviewPanel(
        "iqsdk-circuit",
        "Quantum Circuit",
        {
          viewColumn: vscode.ViewColumn.Two,
          preserveFocus: true
        },
        {
          localResourceRoots: [vscode.Uri.joinPath(extensionUri, "assets")],
          enableScripts: true,
        }
        )
        
        CircuitPanel.instance = new CircuitPanel(panel, extensionUri, data)
        CircuitPanel.instance.setHistogramPanelData()
    }
  }

  /**
   * Gathers assets and input json data to create the webview content
   * for a histogram and assigns it to the panel's webview.
   */
  private setHistogramPanelData() {
    const webview = this.panel.webview

    const histogramScriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.uri, "assets", "javascripts", "hist.js")
    )
    const histStyleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.uri, "assets", "styles", "histStyle.css")
    )
    
      this.panel.webview.html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <link href="${histStyleUri}" rel="stylesheet">
        <script src="https://d3js.org/d3.v5.min.js"></script>
        <script src="https://d3js.org/d3-scale.v3.min.js"></script>
        <script src="${histogramScriptUri}"></script>
      </head>
      <body>
        <script>
          let data = ${JSON.stringify(this.jsonHistogramData.states)}
          window.onload = function () { runD3(data) }
        </script>
        <h1 id="title">${this.jsonHistogramData.title}</h1>
        <svg id="histogram" viewbox="0 0 1500 1000"></svg>
        <div id="options"></div>
      </body>
      </html>`
  }

  /**
   * Checks that the json is valid for a quantum circuit board
   */
  public static validateQHistogramData(data: QHistogramData) {

    // Syntax
    if (data.title === undefined) {
      throw new Error('Json File Missing Title <br><br>Example <br>"title": "My Histogram",')
    } else if (data.states === undefined) {
      throw new Error('Json File Missing Histogram Data <br><br>Example <br> "data" : [<br>{<br>"state" : "0",<br>"prob" : "0.25"<br>},<br>{<br>"state" : "1",<br>"prob" : "1"<br>},')
    }

    data.states.forEach((state, index) => {
      // Syntax
      if (state.value === undefined) {
        throw new Error('state at index ' + index + ' needs a value <br><br>Example <br>"value" : "101",')
      } else if (state.probability === undefined) {
        throw new Error('state at index ' + index + ' needs a probability <br><br>Example <br>"probability" : 0.725')
      }

      // Semantic
      if (state.probability > 1.0) {
        throw new Error('state at index ' + index + ' has a probability exceeding 1.0')
      }
    })
  }

  /**
   * Prints an error to the webview
   */
  public setPanelError() {
    this.panel.webview.html = `
              <!DOCTYPE html>
              <body>
                <h1 id="title">${this.jsonCircuitData.title}</h1>
              </body>
              </html>`
  }

  /**
   * Handles deconstructing the object and vscode garbage
   */
  public dispose() {
    CircuitPanel.instance = undefined

    this.panel.dispose()

    while (this.disposables.length > 0) {
      const garbage = this.disposables.pop()

      if (garbage) {
        garbage.dispose()
      }
    }
  }

  /**
   * Writes an exported image of the circuit board to the given directory
   * with the file type provided
   */
  public static exportCircuit(directory: string, ext: 'svg' | 'png', isLightTheme: boolean) {

    if (!CircuitPanel.instance) {
      return
    }

    initData(CircuitPanel.instance.jsonCircuitData, true, isLightTheme)
    let svg = `
        <svg viewbox="0 0 ${getBackgroundWidth()} ${getBackgroundHeight()}">
          <g>
            ${drawBoard()}
          </g>
        </svg>  
      `
    let title = this.instance?.jsonCircuitData.title
    let filename = title?.replace(/\s+/g, "_")

    if (svg === undefined) {
      return ""
    }

    switch (ext) {
      case 'svg':
        fs.writeFile(`${directory}/${filename}.${ext}`, svg, (err) => {
          if (err) {
            console.log("Error exporting file")
            throw err
          }
          console.log('The file has been saved!')
        });
        break
      case 'png':
        let pngBuffer = svg2png(Buffer.from(svg), { width: getBackgroundWidth() * 5, height: getBackgroundHeight() * 5 })
        pngBuffer.then((png) => {
          fs.writeFile(`${directory}/${filename}.${ext}`, png, (err) => {
            if (err) {
              console.log("Error exporting file")
              throw err
            }
            console.log('The file has been saved!')
          });
        })
        break
    }
  }
}