// The API page lists endpoints from a small generated outline. The full
// contract (schemas, descriptions, responses) is a separate chunk loaded when a
// reader opens an endpoint or copies the documentation, or once the page is idle.
import outline from "../data/api-contract-outline.json";

export const API_CONTRACT_OUTLINE = outline;

let contract = null;
let pending = null;

export function loadedApiContract() {
  return contract;
}

export function loadApiContract() {
  if (contract) return Promise.resolve(contract);
  if (!pending) {
    pending = import("../data/api-contract.json").then(
      (module) => {
        contract = module.default;
        return contract;
      },
      (error) => {
        pending = null;
        throw error;
      }
    );
  }
  return pending;
}

export function requireApiContract() {
  if (!contract) throw new Error("The API contract has not been loaded yet");
  return contract;
}
