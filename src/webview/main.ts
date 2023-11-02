import { provideVSCodeDesignSystem, Button, allComponents, vsCodeButton, TextArea } from "@vscode/webview-ui-toolkit";

provideVSCodeDesignSystem().register(allComponents);

const vscode = acquireVsCodeApi();

function handleHowdyClick() {
  vscode.postMessage({
    command: "hello",
    text: "Hey there partner! 🤠",
  });
}

function main() {
  const submit  = document.getElementById("submit") as Button;
  const note = document.getElementById("note") as TextArea;
  submit.addEventListener('click', () => vscode.postMessage({type: 'submit', note: note.value}))
  
  const close = document.getElementById("close") as Button;
  close.addEventListener('click', () => vscode.postMessage({type: 'close'}))

}

window.addEventListener("load", main);
