import * as vscode from "vscode";

import { webviewContent } from "./webview";
import { save } from "./data";

const selectedTextDecorationType = vscode.window.createTextEditorDecorationType({
  backgroundColor: new vscode.ThemeColor("peekViewResult.selectionBackground"),
});

export function activate(context: vscode.ExtensionContext) {
  const webviewOptions: vscode.WebviewOptions = {
    enableForms: true,
    enableScripts: true,
    localResourceRoots: [
      vscode.Uri.joinPath(context.extensionUri, "out"),
      vscode.Uri.joinPath(context.extensionUri, "src/webview"),
      vscode.Uri.joinPath(context.extensionUri, "node_modules", "@vscode"),
    ],
    enableCommandUris: true,
  };

  const panel = vscode.window.createWebviewPanel(
    "addNotePanel",
    "Add Note",
    {
      viewColumn: vscode.ViewColumn.One,
      preserveFocus: true,
    },
    webviewOptions
  );

  const command = vscode.commands.registerCommand("source-notes.createNote", () => {
    const editor = vscode.window.activeTextEditor;

    if (!editor) {
      return;
    }

    const { start, end } = editor.selection;

    const decoration = { range: new vscode.Range(start, end) };
    editor.setDecorations(selectedTextDecorationType, [decoration]);

    panel.webview.html = webviewContent(panel.webview, context.extensionUri);

    panel.webview.onDidReceiveMessage((message) => {
      console.log(message);

      if (message.type === "submit") {
        save(editor, message.note, context);
      }

      editor.setDecorations(selectedTextDecorationType, []);
    });
  });

  // Add command to the extension context
  context.subscriptions.push(command);
}
