import * as vscode from "vscode";
import { getUri } from "../utilities/getUri";
import { getNonce } from "../utilities/getNonce";
import hljs from "highlight.js";

const themes: Record<vscode.ColorThemeKind, string> = {
  [vscode.ColorThemeKind.Dark]: "github-dark.min.css",
  [vscode.ColorThemeKind.HighContrast]: "a11y-dark.min.css",
  [vscode.ColorThemeKind.Light]: "github.min.css",
  [vscode.ColorThemeKind.HighContrastLight]: "a11y-light.min.css",
};

const theme = themes[vscode.window.activeColorTheme.kind];

export const highlight = (code: string = "", language = "text") => {
  const result = hljs.highlight(code, {
    language,
  });

  return result.value;
};

export const html = String.raw;
export const md = String.raw;

const render = (
  nonce: string,
  webviewUri: vscode.Uri,
  styleUri: vscode.Uri,
  codiconsUri: vscode.Uri,
  hljsUri: vscode.Uri,
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
      <link rel="stylesheet" href="${hljsUri}?${nonce}" />
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
  const styleUri = getUri(webview, extensionUri, [
    "src",
    "webview",
    "style.css",
  ]);
  const codiconsUri = getUri(webview, extensionUri, [
    "node_modules",
    "@vscode/codicons",
    "dist",
    "codicon.css",
  ]);

  const hljsUri = getUri(webview, extensionUri, [
    "node_modules",
    "highlight.js",
    "styles",
    theme,
  ]);

  const nonce = getNonce();

  return render(nonce, webviewUri, styleUri, codiconsUri, hljsUri, html);
};

export const options = (
  context: vscode.ExtensionContext
): vscode.WebviewOptions => ({
  enableForms: true,
  enableScripts: true,

  localResourceRoots: [
    vscode.Uri.joinPath(context.extensionUri, "out"),
    vscode.Uri.joinPath(context.extensionUri, "src/webview"),
    vscode.Uri.joinPath(context.extensionUri, "node_modules", "@vscode"),
    vscode.Uri.joinPath(context.extensionUri, "node_modules", "highlight.js"),
  ],

  enableCommandUris: true,
});
