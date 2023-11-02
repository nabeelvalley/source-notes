import { provideVSCodeDesignSystem, Button, allComponents, vsCodeButton } from "@vscode/webview-ui-toolkit";

provideVSCodeDesignSystem().register(allComponents);

const vscode = acquireVsCodeApi();

function main() {
  const howdyButton = document.getElementById("howdy") as Button;
  howdyButton?.addEventListener("click", handleHowdyClick);
}

function handleHowdyClick() {
  vscode.postMessage({
    command: "hello",
    text: "Hey there partner! 🤠",
  });
}

window.addEventListener("load", main);
console.log("webview script loaded")