# Usage
After cloning the repo open it in VS Code.

## Try without installing / Debugging

Simply press `F5` to pull up a debugging instance of VS Code with the extension installed in its current state. From there, a developer can debug as usual.

Feel free to use `assets/setupExamples/exampleCircuit.json` when debugging

### Makefile
The Makefile includes targets for building, installing and removing the extension.

# Development

## Core Components
*Here are all the main components a developer will need to know about inorder to work on this project.*

### package.json
This file is the manifest for the extension. This is where a developer will define important info about the extension, what will trigger the extension to start, functions provided by the extension, etc.

### extension.ts
This is the main entry point into the extension. In its current state it waits for a valid json file to be saved, then converts this file to a visual representation. For more info on this file type complete the [Cat Coding Tutorial](https://code.visualstudio.com/api/extension-guides/webview#webviews-api-basics) on VS Code's website.

### circuitPanel.ts
This class handles the creation and updating of the webview. It creates a webview and calls upon functions in `draw.ts` to fill in the contents of the webview.

### draw.ts
This file contains the brains of the extension. It's function `drawBoard(QData)` takes the contents of a json file in the form of a QData struct and uses that to create all the components that make up the circuit board svg on the webview. Each of the functions it calls is a seperate layer of the board. All of these layers are stacked on top of each other and returned as a string. This string then becomes the contents of the svg in the webview, completing the image.

### assets
This folder contains all images, scripts and styling sheets relevant to this project. There are also a number of sample json files that can be used to generate circuit boards.