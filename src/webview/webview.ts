import * as vscode from "vscode";
import { getUri } from "../utilities/getUri";
import { getNonce } from "../utilities/getNonce";

export const html = String.raw;

const render = (
  nonce: string,
  webviewUri: vscode.Uri,
  styleUri: vscode.Uri,
  codiconsUri: vscode.Uri,
  content: string
) => html`
  <!DOCTYPE html>
  <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Hello World!</title>

      <link rel="stylesheet" href="${styleUri}?${nonce}" />
      <link rel="stylesheet" href="${codiconsUri}?${nonce}" />
    </head>
    <body>
      <main>${content}</main>
      <script type="module" src="${webviewUri}?${nonce}"></script>
    </body>
  </html>
`;

type View = "note" | "notes";

export const webviewContent = (
  view: View,
  webview: vscode.Webview,
  extensionUri: vscode.Uri,
  html: string
) => {
  const webviewUri = getUri(webview, extensionUri, ["out", view, "main.js"]);
  const styleUri = getUri(webview, extensionUri, ["src", "webview", view, "style.css"]);
  const codiconsUri = getUri(webview, extensionUri, [
    "node_modules",
    "@vscode/codicons",
    "dist",
    "codicon.css",
  ]);

  const nonce = getNonce();

  return render(nonce, webviewUri, styleUri, codiconsUri, html);
};

export const options = (context: vscode.ExtensionContext): vscode.WebviewOptions => ({
  enableForms: true,
  enableScripts: true,

  localResourceRoots: [
    vscode.Uri.joinPath(context.extensionUri, "out"),
    vscode.Uri.joinPath(context.extensionUri, "src/webview"),
    vscode.Uri.joinPath(context.extensionUri, "node_modules", "@vscode"),
  ],

  enableCommandUris: true,
});
