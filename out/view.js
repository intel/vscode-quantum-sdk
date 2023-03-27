"use strict";
// This file contains functions that will be used to translate
// a model of a quantum ciruit board into a webview that
// the user can interact with
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCircuitBoard = exports.getWelcomePage = void 0;
const data = require('../assets/circuit.json');
const fs = require('fs');
function getWelcomePage(assets) {
    return `<!DOCTYPE html>
	<html lang="en">
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<link rel="stylesheet" href="${assets}">
		<title>Get Code</title>
	</head>
	<body>
        <h1>Welcome to the Intel Quantum Circuit Generator!</h1>
        <h2>Simply save the file you would wish to view the circuit board of
        to recieve the graphical representation here.</h2>
	</body>
	</html>`;
}
exports.getWelcomePage = getWelcomePage;
function getCircuitBoard(assets, code, count) {
    return `<!DOCTYPE html>
	<html lang="en">
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1.0">
		<link rel="stylesheet" href="${assets + '/style.css'}">
		<title>Quantum Circuit Board</title>
	</head>
	<body>
		<canvas id="circuit">OOF</canvas>
	</body>
	</html>`;
}
exports.getCircuitBoard = getCircuitBoard;
function createLine() {
    return `<div>
		<button>H</button> 
		<button>H</button>
		<button>H</button>
		<button>H</button>
		<button>H</button>
		<svg width="500" height="500"><line x1="50" y1="50" x2="350" y2="350" stroke="black"/></svg>
		<button>H</button>
	</div>`;
}
// function drawBoard(qbits: number) : void {
// 	var c = document.getElementById("myCanvas");
// 	var ctx = c.getContext("2d");
// 	ctx.font = "30px Arial";
// 	ctx.fillText("Hello World",10,50);
// }
//# sourceMappingURL=view.js.map