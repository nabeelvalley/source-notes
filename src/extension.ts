import * as vscode from "vscode";

import {
  ExtensionData,
  Line,
  Note,
  deleteNote,
  getExtensionData,
  save,
  updateNote,
} from "./data";
import { EditNoteViewProvider, OpenFile } from "./EditNoteViewProvider";
import { AllNotesView } from "./AllNotesView";
import { NoteItem, ViewNotesTreeView } from "./ViewNotesTreeView";

const selectedTextDecorationType = vscode.window.createTextEditorDecorationType(
  {
    backgroundColor: new vscode.ThemeColor(
      "peekViewResult.selectionBackground"
    ),
  }
);
class NoteComment implements vscode.Comment {
  id?: string;
  body: string | vscode.MarkdownString;
  mode: vscode.CommentMode;
  author: vscode.CommentAuthorInformation;
  contextValue?: string | undefined;
  timestamp?: Date | undefined;

  constructor(note: Partial<Note>) {
    this.id = note.id;
    this.body = note.note || "No Content";
    this.author = {
      name: "Source Notes",
    };

    this.mode = vscode.CommentMode.Preview;
    this.timestamp = note.created
      ? new Date(Date.parse(note.created))
      : undefined;
  }
}

const addNote = async (
  context: vscode.ExtensionContext,
  note: string,
  selection: vscode.Selection
) => {
  const editor = vscode.window.activeTextEditor;

  vscode.window.activeTextEditor?.document.uri;

  if (!editor) {
    return;
  }

  const result = await save(editor, note, context, selection);

  editor.setDecorations(selectedTextDecorationType, []);

  return result;
};

const getRangeFromLines = (lines: Line[] = []) => {
  const start = lines?.[0]?.num;
  const end = lines?.[lines?.length - 1]?.num;

  if (!start && end) {
    return;
  }

  const range = new vscode.Range(
    new vscode.Position(start - 1, 0),
    new vscode.Position(end - 1, Infinity)
  );

  return range;
};

const handleDelete = async (
  id: string,
  workspaceFolder: vscode.Uri,
  refreshTree: (data: ExtensionData) => void
) => {
  const result = await deleteNote(id, workspaceFolder);
  refreshTree(result);
  vscode.window.showInformationMessage("Note deleted");
};

const openNoteFile =
  (workspaceFolder: vscode.Uri): OpenFile =>
  async (note) => {
    const { file, lines } = note;

    const hasData = file && lines;

    if (!hasData) {
      vscode.window.showErrorMessage("Note location not known");
      return;
    }

    const fileWorkspaceFolder = vscode.Uri.joinPath(workspaceFolder, file);

    const document = await vscode.workspace.openTextDocument(
      fileWorkspaceFolder
    );
    const editor = await vscode.window.showTextDocument(document);
    const range = getRangeFromLines(lines);

    if (!range) {
      return;
    }

    editor.revealRange(range);

    const selection = new vscode.Selection(
      range.start.line + 1,
      0,
      range.end.line + 1,
      0
    );
    editor.selections = [selection];
  };

const initializeCommentController = async (
  workspaceFolder: vscode.Uri,
  data?: ExtensionData
) => {
  const commentController = vscode.comments.createCommentController(
    "comment-controller",
    "Source Notes"
  );

  // A `CommentingRangeProvider` controls where gutter decorations that allow adding comments are shown
  commentController.commentingRangeProvider = {
    provideCommentingRanges: (
      document: vscode.TextDocument,
      token: vscode.CancellationToken
    ) => {
      const lineCount = document.lineCount;
      return [new vscode.Range(0, 0, lineCount - 1, 0)];
    },
  };

  data?.notes?.forEach((note) => {
    if (!(note.file && note.note)) {
      return;
    }

    const range = getRangeFromLines(note.lines);

    if (!range) {
      return;
    }

    commentController.createCommentThread(
      vscode.Uri.joinPath(workspaceFolder, note.file),
      range,
      [new NoteComment(note)]
    );
  });

  return commentController;
};

export async function activate(context: vscode.ExtensionContext) {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0].uri;
  const [data] = workspaceFolder
    ? await getExtensionData(workspaceFolder)
    : [{}];

  if (!workspaceFolder) {
    // must be in a workspace to use the extension
    return;
  }

  const notesView = new ViewNotesTreeView(context, data);
  const noteTreePanel = vscode.window.registerTreeDataProvider(
    ViewNotesTreeView.viewType,
    notesView
  );

  const refreshTree = async (result?: ExtensionData) => {
    if (!result) {
      return;
    }

    notesView.refresh(result);

    commentController.dispose();
    commentController = await initializeCommentController(
      workspaceFolder,
      data
    );
  };

  const noteForm = new EditNoteViewProvider(
    context,
    (id, text) => updateNote(id, text, workspaceFolder).then(notesView.refresh),
    openNoteFile(workspaceFolder),
    (id) => handleDelete(id, workspaceFolder, refreshTree)
  );

  const viewNotePanel = vscode.window.registerWebviewViewProvider(
    EditNoteViewProvider.viewType,
    noteForm
  );

  let commentController = await initializeCommentController(
    workspaceFolder,
    data
  );

  const getActiveEditor = async (comment?: vscode.CommentReply) => {
    const commentUri = comment?.thread.uri;

    const activeEditor = vscode.window.activeTextEditor;
    if (!commentUri) {
      return [activeEditor, vscode.window.activeTextEditor?.selection] as const;
    }

    const textDocument = await vscode.workspace.openTextDocument(commentUri);
    const editor = await vscode.window.showTextDocument(textDocument);

    return [
      editor,
      new vscode.Selection(
        comment.thread.range.start,
        comment.thread.range.end
      ),
    ] as const;
  };

  const createNoteCommand = vscode.commands.registerCommand(
    "source-notes.createNote",
    async (comment?: vscode.CommentReply) => {
      const [editor, selection] = await getActiveEditor(comment);

      if (!(editor && selection)) {
        return;
      }

      const { start, end } = selection;

      const decoration = { range: new vscode.Range(start, end) };

      comment?.thread.uri;

      const note = await (comment?.text ||
        vscode.window.showInputBox({
          title: "Add Note",
          placeHolder: "Enter note text",
        }));

      if (!note) {
        return;
      }

      editor.setDecorations(selectedTextDecorationType, [decoration]);

      const result = await addNote(context, note, selection);
      refreshTree(result);
      const lastNote = result?.notes?.[result.notes?.length - 1];
      if (lastNote) {
        noteForm.setNote(lastNote);
        if (comment?.thread) {
          comment.thread.collapsibleState =
            vscode.CommentThreadCollapsibleState.Collapsed;

          comment.thread.comments = [
            ...comment.thread.comments,
            new NoteComment(lastNote),
          ];
        }
      }
    }
  );

  const deleteNoteCommand = vscode.commands.registerCommand(
    "source-notes.deleteNote",
    async (data: NoteItem | NoteComment) => {
      const isNoteInstance = data instanceof NoteItem;
      const id = isNoteInstance ? data.note?.id : data.id;
      if (!id) {
        vscode.window.showWarningMessage(
          "Failed to delete note - note not found"
        );
        return;
      }

      handleDelete(id, workspaceFolder, refreshTree);
    }
  );

  const viewAllNotesCommand = vscode.commands.registerCommand(
    "source-notes.exportMarkdown",
    async () => {
      const [data] = await getExtensionData(workspaceFolder);

      const markdown = AllNotesView.renderToMarkdown(data);

      const filePath = vscode.Uri.joinPath(
        workspaceFolder,
        "source-notes-all-notes-export.md"
      );

      await vscode.workspace.fs.writeFile(
        filePath,
        Buffer.from(markdown, "utf-8")
      );
      const document = await vscode.workspace.openTextDocument(filePath);
      await vscode.window.showTextDocument(document);

      vscode.window.showInformationMessage("Exported markdown content");
    }
  );

  const openFileCommand = vscode.commands.registerCommand(
    "source-notes.openFile",
    async (data) => {
      const isNoteData = data instanceof NoteItem;
      const note = isNoteData && data.note;
      if (!note) {
        vscode.window.showWarningMessage(
          "Failed to delete note - note not found"
        );
        return;
      }

      openNoteFile(workspaceFolder)(note);
    }
  );

  const viewNoteCommand = vscode.commands.registerCommand(
    "source-notes.viewNote",
    async (data) => {
      const isNoteData = data instanceof NoteItem;
      const id = isNoteData && data.note?.id;
      if (!id) {
        vscode.window.showWarningMessage(
          "Failed to update note - note not found"
        );
        return;
      }

      noteForm.setNote(data.note);
    }
  );

  const saveNoteCommand = vscode.commands.registerCommand(
    "source-notes.saveNote",
    (comment?: any) => {
      if (!comment) {
        return;
      }

      comment.parent.comments = comment.parent.comments.map(
        (cmt: {
          id: any;
          savedBody: any;
          body: any;
          mode: vscode.CommentMode;
        }) => {
          if (cmt.id === comment.id) {
            cmt.savedBody = cmt.body;
            cmt.mode = vscode.CommentMode.Preview;
          }

          return cmt;
        }
      );
    }
  );

  context.subscriptions.push(
    createNoteCommand,
    deleteNoteCommand,
    viewNoteCommand,
    viewNotePanel,
    noteTreePanel,
    openFileCommand,
    viewAllNotesCommand,
    saveNoteCommand
  );
}
