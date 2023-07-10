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
    gateColorMethod: string
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

// Defines the different ways the gates can be grouped and colored
export enum ColorMethod {
    default,
    clifford,
    axis,
    simple
}