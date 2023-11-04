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
  console.log({ note });

  const handleChange = (ev: Event) => {
    vscode.postMessage({ type: "change", note: (ev.target as TextArea).value });
  };

  note.addEventListener("change", handleChange);
}

window.addEventListener("load", main);
