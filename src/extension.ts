import * as vscode from "vscode";

import { options, webviewContent } from "./webview";
import { save } from "./data";
import { PanelView } from "@vscode/webview-ui-toolkit";
import { AddNote, AddNotePanelViewProvider } from "./AddNotePanelView";
import { ViewNotesTreeView } from "./ViewNotesPanelView";

const selectedTextDecorationType = vscode.window.createTextEditorDecorationType({
  backgroundColor: new vscode.ThemeColor("peekViewResult.selectionBackground"),
});

const addNote =
  (context: vscode.ExtensionContext): AddNote =>
  async (note: string) => {
    const editor = vscode.window.activeTextEditor;

    if (!editor) {
      return;
    }

    await save(editor, note, context);

    editor.setDecorations(selectedTextDecorationType, []);
  };

export function activate(context: vscode.ExtensionContext) {
  const noteForm = new AddNotePanelViewProvider(context, addNote(context));
  const notesView = new ViewNotesTreeView(context);

  vscode.window.registerWebviewViewProvider(AddNotePanelViewProvider.viewType, noteForm);
  vscode.window.registerTreeDataProvider(ViewNotesTreeView.viewType, notesView);

  const command = vscode.commands.registerCommand("source-notes.createNote", async () => {
    const editor = vscode.window.activeTextEditor;

    if (!editor) {
      return;
    }

    const { start, end } = editor.selection;

    const decoration = { range: new vscode.Range(start, end) };

    const result = await vscode.window.showInputBox({
      title: "Add Note",
      placeHolder: "Enter note text",
    });

    editor.setDecorations(selectedTextDecorationType, [decoration]);
    if (!result) {
      return;
    }

    await addNote(context)(result);
  });

  // Add command to the extension context
  context.subscriptions.push(command);
}
