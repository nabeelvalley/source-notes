import { commands, ExtensionContext, WebviewOptions, window, Range, ThemeColor } from "vscode";

import { Disposable, Webview, WebviewPanel, Uri, ViewColumn } from "vscode";
import { getUri } from "./utilities/getUri";
import { getNonce } from "./utilities/getNonce";

const html = String.raw

const view = (nonce: string, webviewUri: Uri, styleUri: Uri, codiconsUri: Uri) => html`
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
`
const webviewContent= (webview: Webview, extensionUri: Uri) => {
  const webviewUri = getUri(webview, extensionUri, ["out", "webview.js"]);
  const styleUri = getUri(webview, extensionUri, ["out", "style.css"]);
  const codiconsUri = getUri(webview, extensionUri, ['node_modules', '@vscode/codicons', 'dist', 'codicon.css']);

  
  const nonce = getNonce();

  return view(nonce, webviewUri, styleUri, codiconsUri);
}

  
const selectedTextDecorationType = window.createTextEditorDecorationType({
  backgroundColor: new ThemeColor("peekViewResult.selectionBackground"),
});

export function activate(context: ExtensionContext) {
  const webviewOptions: WebviewOptions = {
    enableForms: true,
    enableScripts: true,
    localResourceRoots: [Uri.joinPath(context.extensionUri, "out"), Uri.joinPath(context.extensionUri, 'node_modules', '@vscode')],
    enableCommandUris: true
  }


  const command = commands.registerCommand("source-notes.showHelloWorld", () => {
    const editor = window.activeTextEditor;

    if (!editor) {
      return;
    }

    const {start, end}  = editor.selection

    const decoration = { range: new Range(start, end) };
    editor.setDecorations(selectedTextDecorationType, [decoration]);

    // const topInset = window.createWebviewTextEditorInset(editor, start.line - 1, 1, webviewOptions);
    // topInset.webview.html = topInsetHtml(topInset.webview, context.extensionUri)

    const bottomInset = window.createWebviewTextEditorInset(editor, end.line, 10, webviewOptions)
    bottomInset.webview.html = webviewContent(bottomInset.webview, context.extensionUri)
  });



  // Add command to the extension context
  context.subscriptions.push(command);
}
