import {
  provideVSCodeDesignSystem,
  Button,
  allComponents,
  TextArea,
} from "@vscode/webview-ui-toolkit";

provideVSCodeDesignSystem().register(allComponents);

const vscode = acquireVsCodeApi();

function main() {
  const submit = document.getElementById("submit") as Button;
  const note = document.getElementById("note") as TextArea;

  const handleSubmit = () => {
    vscode.postMessage({ type: "submit", note: note.value });
  };

  submit.addEventListener("click", handleSubmit);
}

window.addEventListener("load", main);
