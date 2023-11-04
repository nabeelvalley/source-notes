import * as vscode from "vscode";

import { ExtensionData, deleteNote, getExtensionData, save } from "./data";
import { AddNotePanelViewProvider } from "./AddNotePanelView";
import { NoteItem, ViewNotesTreeView } from "./ViewNotesTreeView";

const selectedTextDecorationType = vscode.window.createTextEditorDecorationType({
  backgroundColor: new vscode.ThemeColor("peekViewResult.selectionBackground"),
});

const addNote = async (context: vscode.ExtensionContext, note: string) => {
  const editor = vscode.window.activeTextEditor;

  if (!editor) {
    return;
  }

  const result = await save(editor, note, context);

  editor.setDecorations(selectedTextDecorationType, []);

  return result;
};

export async function activate(context: vscode.ExtensionContext) {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0].uri;
  const [data] = workspaceFolder ? await getExtensionData(workspaceFolder) : [{}];

  const notesView = new ViewNotesTreeView(context, data);
  const notesTree = vscode.window.createTreeView(ViewNotesTreeView.viewType, {
    treeDataProvider: notesView,
    showCollapseAll: true,
  });

  const refreshTree = (result?: ExtensionData) => result && notesView.refresh(result);

  const noteForm = new AddNotePanelViewProvider(context, (text) =>
    addNote(context, text).then(refreshTree)
  );

  vscode.window.registerWebviewViewProvider(AddNotePanelViewProvider.viewType, noteForm);

  const createNoteCommand = vscode.commands.registerCommand("source-notes.createNote", async () => {
    const editor = vscode.window.activeTextEditor;

    if (!editor) {
      return;
    }

    const { start, end } = editor.selection;

    const decoration = { range: new vscode.Range(start, end) };

    const note = await vscode.window.showInputBox({
      title: "Add Note",
      placeHolder: "Enter note text",
    });

    editor.setDecorations(selectedTextDecorationType, [decoration]);
    if (!note) {
      return;
    }

    const result = await addNote(context, note);
    refreshTree(result);
  });

  const deleteNoteCommand = vscode.commands.registerCommand(
    "source-notes.deleteNote",
    async (data) => {
      if (!(data instanceof NoteItem)) {
        return;
      }

      const id = data.id;
      if (!id) {
        return;
      }

      if (!workspaceFolder) {
        return;
      }

      const result = await deleteNote(id, workspaceFolder, context);
      refreshTree(result);
    }
  );

  // Add command to the extension context
  context.subscriptions.push(createNoteCommand);
}
