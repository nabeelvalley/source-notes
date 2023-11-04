import * as vscode from "vscode";

import { ExtensionData, deleteNote, getExtensionData, save, updateNote } from "./data";
import { NoteItem, ViewNotesTreeView } from "./ViewNotesTreeView";
import { EditNoteViewProvider } from "./EditNoteViewProvider";

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

  if (!workspaceFolder) {
    // must be in a workspace to use the extension
    return;
  }

  const notesView = new ViewNotesTreeView(context, data);
  const noteTreePanel = vscode.window.registerTreeDataProvider(
    ViewNotesTreeView.viewType,
    notesView
  );

  const refreshTree = (result?: ExtensionData) => result && notesView.refresh(result);

  const noteForm = new EditNoteViewProvider(context, (id, text) =>
    updateNote(id, text, workspaceFolder).then(notesView.refresh)
  );

  const viewNotePanel = vscode.window.registerWebviewViewProvider(
    EditNoteViewProvider.viewType,
    noteForm
  );

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
      const isNoteData = data instanceof NoteItem;
      const id = isNoteData && data.note?.id;
      if (!id) {
        vscode.window.showWarningMessage("Failed to delete note - note not found");
        return;
      }

      const result = await deleteNote(id, workspaceFolder);
      refreshTree(result);
      vscode.window.showInformationMessage("Note deleted");
    }
  );

  const viewNoteCommand = vscode.commands.registerCommand("source-notes.viewNote", async (data) => {
    const isNoteData = data instanceof NoteItem;
    const id = isNoteData && data.note?.id;
    if (!id) {
      vscode.window.showWarningMessage("Failed to update note - note not found");
      return;
    }

    noteForm.setNote(data.note);
  });

  context.subscriptions.push(
    createNoteCommand,
    deleteNoteCommand,
    viewNoteCommand,
    viewNotePanel,
    noteTreePanel
  );
}
