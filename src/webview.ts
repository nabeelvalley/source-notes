import * as vscode from "vscode";
import { getUri } from "./utilities/getUri";
import { getNonce } from "./utilities/getNonce";

const html = String.raw;

const view = (
  nonce: string,
  webviewUri: vscode.Uri,
  styleUri: vscode.Uri,
  codiconsUri: vscode.Uri
) => html`
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Hello World!</title>

      <link rel="stylesheet" href="${styleUri}?${nonce}" />
      <link rel="stylesheet" href="${codiconsUri}?${nonce}" />
      <script type="module" src="${webviewUri}?${nonce}"></script>
    </head>
    <body>
      <main>
        <vscode-text-area id="note" rows="5"></vscode-text-area>
        <vscode-button id="submit">Create Note</vscode-button>
      </main>
    </body>
  </html>
`;

export const webviewContent = (webview: vscode.Webview, extensionUri: vscode.Uri) => {
  const webviewUri = getUri(webview, extensionUri, ["out", "webview.js"]);
  const styleUri = getUri(webview, extensionUri, ["src", "webview", "style.css"]);
  const codiconsUri = getUri(webview, extensionUri, [
    "node_modules",
    "@vscode/codicons",
    "dist",
    "codicon.css",
  ]);

  const nonce = getNonce();

  return view(nonce, webviewUri, styleUri, codiconsUri);
};
