import * as vscode from "vscode";

import { options, webviewContent } from "./webview";
import { save } from "./data";
import { PanelView } from "@vscode/webview-ui-toolkit";
import { AddNote, PanelViewProvider } from "./PanelViewProvider";

const selectedTextDecorationType = vscode.window.createTextEditorDecorationType({
  backgroundColor: new vscode.ThemeColor("peekViewResult.selectionBackground"),
});

const addNote =
  (context: vscode.ExtensionContext): AddNote =>
  async (note) => {
    const editor = vscode.window.activeTextEditor;

    if (!editor) {
      return;
    }

    await save(editor, note, context);

    editor.setDecorations(selectedTextDecorationType, []);
  };

export function activate(context: vscode.ExtensionContext) {
  const panelViewProvider = new PanelViewProvider(context, addNote(context));

  vscode.window.registerWebviewViewProvider(PanelViewProvider.viewType, panelViewProvider);

  const command = vscode.commands.registerCommand("source-notes.createNote", () => {
    const editor = vscode.window.activeTextEditor;

    if (!editor) {
      return;
    }

    const { start, end } = editor.selection;

    const decoration = { range: new vscode.Range(start, end) };
    editor.setDecorations(selectedTextDecorationType, [decoration]);
    panelViewProvider.focus();
  });

  // Add command to the extension context
  context.subscriptions.push(command);
}
