/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Intel Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

// Represents a single quantum gate
export interface QGate {
    name: string,
    qubits: number[],
    attributes?: string[],
    position?: number
}

// Holds all of the data necessary to create
// a quantum circuit board
export interface QCircuitData {
    title: string,
    gateColorMethod: ColorMethod
    numQbits: number,
    qbitNames: string[],
    gates: QGate[]
}

// Represents a single collapsed quantum state ie. 110
export interface QState {
    value: string,
    probability: number
}

// Holds all of the data necessary to create
// a histogram of quantum states
export interface QHistogramData {
    title: string,
    states: QState[]
}

// Holds information about gates to translate from compiler representation
// to visual representation in this extension
export interface GateData {
    name: string,
    subscript: string,
    colors: string[]
}

// Holds the compiler options that the user sets in the .iqsdk/compile.json file
export interface CompilerOption {
    name: string,
    remove: boolean,
    engine: CompilerEngine
    localSDKPath?: string, 
    color: ColorMethod
    args: string[]
}

// Defines the different methods for using the sdk
export enum CompilerEngine {
    podman = 'podman',
    docker = 'docker',
    local = 'local'
}

// Defines the different ways the gates can be grouped and colored
export type ColorMethod = 'default' | 'clifford' | 'axis' | 'simple'
export const ColorMap = new Map<ColorMethod, number>([
    ['default', 0],
    ['clifford', 1],
    ['axis', 2],
    ['simple', 3]
]);

// Defines the different actions that require accessing the sdk
export enum SDKAction {
    drawCircuit,
    executeCPP
}