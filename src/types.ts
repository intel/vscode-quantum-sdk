/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Intel Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

export interface QGate {
    name: string,
    qubits: number[],
    attributes?: string[],
    position?: number
}

export interface QData {
    title: string,
    gateColorMethod: string
    numQbits: number,
    qbitNames: string[],
    gates: QGate[]
}

export interface GateData {
    name: string,
    subscript: string,
    colors: string[]
}

export enum ColorMethod {
    default,
    clifford,
    axis,
    simple
}