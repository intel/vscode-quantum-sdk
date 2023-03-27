//===----------------------------------------------------------------------===//
//     This file was originally created by Scaffold Compiler Working Group
//
// Source:
// https://github.com/epiqc/ScaffCC/blob/master/Algorithms/Cat_State/cat_state.n04.scaffold
//
//     Modified for Intel(R) Quantum SDK framework by Intel Labs
//===----------------------------------------------------------------------===//
//
// epiqc/ScaffCC is licensed under the BSD 2-Clause "Simplified" License
//
// License file - https://github.com/epiqc/ScaffCC/blob/master/LICENSE
//===----------------------------------------------------------------------===//

/// NOTE: Pick an include path depending on whether running in development
/// environment or production environment
//===----------------------------------------------------------------------===//
/// Production mode
// #include <clang/Quantum/quintrinsics.h>

/// Development mode
/// Quantum Runtime Library APIs


const int N = 4;
/* global array of qubits */

void prepare_all() {
  for (int i = 0; i < N; i++) {
    continue;
  }
}

void measure_all() {
  for (int i = 0; i < N; i++) {
    continue;
  }
}

void catN() {
//   H(bits[0]);
  for (int i = 1; i < N; i++) {
    continue;
  }
}

void unCatN() {
  for (int i = N - 1; i > 0; i--) {
    // CNOT(bits[i - 1], bits[i]);
  }
  //H(bits[0]);
}

int main() {
  // Setup quantum device
//   iqsdk::Iqs_Config iqs_config(/*num_qubits*/ N,
//                                /*simulation_type*/ "noiseless");
//   iqsdk::Full_State_Simulator iqs_device(iqs_config);
//   if (iqsdk::QRT_ERROR_SUCCESS != iqs_device.ready()) {
//     return 1;
//   }

  prepare_all();
  catN();
  measure_all();
  return 0;
}
