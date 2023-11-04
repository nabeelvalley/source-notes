import {
  provideVSCodeDesignSystem,
  Button,
  allComponents,
  TextArea,
} from "@vscode/webview-ui-toolkit";

provideVSCodeDesignSystem().register(allComponents);

const vscode = acquireVsCodeApi();

function main() {
  const note = document.getElementById("note") as TextArea;
  const button = document.getElementById("delete") as HTMLButtonElement;

  const handleChange = (ev: Event) => {
    vscode.postMessage({ type: "change", note: (ev.target as TextArea).value });
  };

  const handleDelete = () => {
    vscode.postMessage({ type: "delete" });
  };

  note.addEventListener("change", handleChange);
  button.addEventListener("click", handleDelete);
}

window.addEventListener("load", main);
