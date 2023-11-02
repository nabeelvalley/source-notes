import { commands, ExtensionContext, WebviewOptions, window, Range, ThemeColor, TextEdit, TextEditor } from "vscode";

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
  <script type="module" src="${webviewUri}?${nonce}"></script>
  </head>
  <body>
    <main>
      <div class="header">
        <div>Add Note</div>
        <div>
          <vscode-button id="close" appearance="icon" aria-label="Confirm">
            <span class="codicon codicon-close"></span>
          </vscode-button>
        </div>
      </div>

      <vscode-text-area id="note" rows=5></vscode-text-area>
      <vscode-button id="submit">Create Note</vscode-button>
    </main>
  </body>
</html>
`
const webviewContent = (webview: Webview, extensionUri: Uri) => {
  const webviewUri = getUri(webview, extensionUri, ["out", "webview.js"]);
  const styleUri = getUri(webview, extensionUri, ["src", "webview", "style.css"]);
  const codiconsUri = getUri(webview, extensionUri, ['node_modules', '@vscode/codicons', 'dist', 'codicon.css']);


  const nonce = getNonce();

  return view(nonce, webviewUri, styleUri, codiconsUri);
}


const selectedTextDecorationType = window.createTextEditorDecorationType({
  backgroundColor: new ThemeColor("peekViewResult.selectionBackground"),
});

const save = (editor: TextEditor, note: string) => {
  console.log(editor, note)
}

export function activate(context: ExtensionContext) {
  const webviewOptions: WebviewOptions = {
    enableForms: true,
    enableScripts: true,
    localResourceRoots: [
      Uri.joinPath(context.extensionUri, "out"), 
      Uri.joinPath(context.extensionUri, "src/webview"), 
      Uri.joinPath(context.extensionUri, 'node_modules', '@vscode')],
    enableCommandUris: true
  }


  const command = commands.registerCommand("source-notes.showHelloWorld", () => {
    const editor = window.activeTextEditor;

    if (!editor) {
      return;
    }

    const { start, end } = editor.selection

    const decoration = { range: new Range(start, end) };
    editor.setDecorations(selectedTextDecorationType, [decoration]);

    const inset = window.createWebviewTextEditorInset(editor, end.line, 10, webviewOptions)
    inset.webview.html = webviewContent(inset.webview, context.extensionUri)

    inset.webview.onDidReceiveMessage(message => {
      console.log(message)

      if (message.type === 'submit') {
        save(editor, message.note)
      }

      inset.dispose()
      editor.setDecorations(selectedTextDecorationType, [])
    })

  });



  // Add command to the extension context
  context.subscriptions.push(command);
}
