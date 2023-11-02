"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/extension.ts
var extension_exports = {};
__export(extension_exports, {
  activate: () => activate
});
module.exports = __toCommonJS(extension_exports);
var import_vscode2 = require("vscode");
var import_vscode3 = require("vscode");

// src/utilities/getUri.ts
var import_vscode = require("vscode");
function getUri(webview, extensionUri, pathList) {
  return webview.asWebviewUri(import_vscode.Uri.joinPath(extensionUri, ...pathList));
}

// src/utilities/getNonce.ts
function getNonce() {
  let text = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

// src/extension.ts
var html = String.raw;
var view = (nonce, webviewUri, styleUri, codiconsUri) => html`
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hello World!</title>
    
    <link rel="stylesheet" href="${styleUri}?${nonce}">
    <link rel="stylesheet" href="${codiconsUri}?${nonce}">
    <style>
    html, body {
      margin: 0;
      padding-left: 0;
      height: 100%;
    }

    body {
      display: flex;
      flex-direction: column;
    }

    main {
      display: grid;
      grid-auto-flow: row;
      gap: 0.5rem;
    }
    
    .header {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      border: solid 0px var(--vscode-focusBorder);
      border-width: 1px 0px;
    }
</style>
  <script type="module" src="${webviewUri}?${nonce}"></script>
  </head>
  <body>
    <main>
      <div class="header">
        <div>Add Note</div>
        <div>
          <vscode-button appearance="icon" aria-label="Confirm">
            <span class="codicon codicon-close"></span>
          </vscode-button>
        </div>
      </div>

      <vscode-text-area rows=5></vscode-text-area>
      <vscode-button id="submit">Create Note</vscode-button>
    </main>
  </body>
</html>
`;
var webviewContent = (webview, extensionUri) => {
  const webviewUri = getUri(webview, extensionUri, ["out", "webview.js"]);
  const styleUri = getUri(webview, extensionUri, ["out", "style.css"]);
  const codiconsUri = getUri(webview, extensionUri, ["node_modules", "@vscode/codicons", "dist", "codicon.css"]);
  const nonce = getNonce();
  return view(nonce, webviewUri, styleUri, codiconsUri);
};
var selectedTextDecorationType = import_vscode2.window.createTextEditorDecorationType({
  backgroundColor: new import_vscode2.ThemeColor("peekViewResult.selectionBackground")
});
function activate(context) {
  const webviewOptions = {
    enableForms: true,
    enableScripts: true,
    localResourceRoots: [import_vscode3.Uri.joinPath(context.extensionUri, "out"), import_vscode3.Uri.joinPath(context.extensionUri, "node_modules", "@vscode")],
    enableCommandUris: true
  };
  const command = import_vscode2.commands.registerCommand("source-notes.showHelloWorld", () => {
    const editor = import_vscode2.window.activeTextEditor;
    if (!editor) {
      return;
    }
    const { start, end } = editor.selection;
    const decoration = { range: new import_vscode2.Range(start, end) };
    editor.setDecorations(selectedTextDecorationType, [decoration]);
    const bottomInset = import_vscode2.window.createWebviewTextEditorInset(editor, end.line, 10, webviewOptions);
    bottomInset.webview.html = webviewContent(bottomInset.webview, context.extensionUri);
  });
  context.subscriptions.push(command);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  activate
});
//# sourceMappingURL=extension.js.map
