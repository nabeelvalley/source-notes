import * as vscode from "vscode";
import { getNonce } from "./utilities/getNonce";

export interface Note {
  id: string;
  file: string;
  lines: Line[];
  note: string;
  language: string;
  created: string;
}

export interface Line {
  num: number;
  content: string;
}

export interface ExtensionData {
  notes?: Partial<Note>[];
}

export const getExtensionData = async (workspaceUri: vscode.Uri) => {
  const documentDir = vscode.workspace.getWorkspaceFolder(workspaceUri);

  if (!documentDir) {
    throw new Error("Workspace not found");
  }

  const directory = vscode.Uri.joinPath(documentDir.uri, ".vscode");

  try {
    await vscode.workspace.fs.createDirectory(directory);
  } catch (err) {
    console.error(err);
  }

  const filePath = vscode.Uri.file(vscode.Uri.joinPath(directory, "source-notes.json").path);

  let fileExists: boolean;
  try {
    await vscode.workspace.fs.stat(filePath);
    fileExists = true;
  } catch (err) {
    fileExists = false;
  }

  const fileContents = await (fileExists &&
    (await vscode.workspace.fs.readFile(filePath)).toString());
  const fileData = JSON.parse(fileContents || "{}") as ExtensionData;

  return [fileData, filePath] as const;
};

const setExtensionData = async (updateData: ExtensionData, filePath: vscode.Uri) => {
  const updateContents = JSON.stringify(updateData, null, 2);
  try {
    await vscode.workspace.fs.writeFile(filePath, Buffer.from(updateContents, "utf-8"));
  } catch (err) {
    console.error(err);
    throw new Error("Error saving source-notes.json");
  }
};

const addNote = async (note: Note, context: vscode.ExtensionContext, documentUri: vscode.Uri) => {
  const [fileData, filePath] = await getExtensionData(documentUri);

  const existingNotes = fileData.notes || [];
  const notes = [...existingNotes, note];

  const updatedData: ExtensionData = {
    ...fileData,
    notes,
  };

  await setExtensionData(updatedData, filePath);
  return updatedData;
};

function getSelectionLines(editor: vscode.TextEditor) {
  const { start, end } = editor.selection;

  const range = new Array(end.line - start.line + 1)
    .fill(undefined)
    .map((_, index) => start.line + index);
  const lines = range.map<Line>((line) => ({
    num: line + 1,
    content: editor.document.lineAt(line).text,
  }));
  return lines;
}

export const save = async (
  editor: vscode.TextEditor,
  note: string,
  context: vscode.ExtensionContext
) => {
  console.log(editor, note);
  const documentUri = editor.document.uri;

  const lines = getSelectionLines(editor);

  const file = vscode.workspace.asRelativePath(editor.document.uri.path);

  const fullNote: Note = {
    id: getNonce(),
    note,
    file,
    lines,
    created: new Date().toISOString(),
    language: editor.document.languageId,
  };

  const result = await addNote(fullNote, context, documentUri);
  vscode.window.showInformationMessage("Note saved successfully");

  return result;
};

export const deleteNote = async (noteId: string, workspaceUri: vscode.Uri) => {
  const [data, file] = await getExtensionData(workspaceUri);
  const notes = (data.notes || []).filter((note) => note.id !== noteId);

  const updatedData: ExtensionData = {
    ...data,
    notes,
  };

  await setExtensionData(updatedData, file);

  return updatedData;
};

export const updateNote = async (noteId: string, text: string, workspaceUri: vscode.Uri) => {
  const [data, file] = await getExtensionData(workspaceUri);
  const notes = (data.notes || []).map<Partial<Note>>((note) =>
    note.id === noteId
      ? {
          ...note,
          note: text,
        }
      : note
  );

  const updatedData: ExtensionData = {
    ...data,
    notes,
  };

  await setExtensionData(updatedData, file);

  return updatedData;
};
