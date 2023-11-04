import * as vscode from "vscode";
import { highlight, html, options, webviewContent } from "./webview/webview";
import { Note } from "./data";

const editNoteForm = (note: Partial<Note>) => html`
  <b>${note.file || ""} - Line ${note.lines?.[0].num || ""}</b>
  <pre>
    <code>
      ${highlight(
    note.lines?.map((line) => line.content).join("\n"),
    note.language
  )}
    </code>
  </pre>
  <vscode-text-area id="note" rows="5" value="${note.note}"></vscode-text-area>
  <vscode-button appearance="primary" id="delete">
    Delete
    <span slot="start" class="codicon codicon-trash"></span>
  </vscode-button>
`;

const placeholder = html`<p>Select a note to view</p>`;

export type UpdateNote = (id: string, text: string) => void;
export type OpenFile = (note: Partial<Note>) => void;
export type DeleteNote = (id: string) => void;

export class EditNoteViewProvider implements vscode.WebviewViewProvider {
  private view?: vscode.WebviewView;
  private note?: Partial<Note>;

  public static readonly viewType = "viewNotePanel";

  public constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly updateNote: UpdateNote,
    private readonly openFile: OpenFile,
    private readonly deleteNote: DeleteNote
  ) {}

  private focus = () => {
    if (!this.view) {
      return;
    }

    this.view.show(false);
  };

  public resolveWebviewView = (
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext<unknown>,
    token: vscode.CancellationToken
  ) => {
    if (this.view) {
      // This method may be called after the view has already been initialized
      return;
    }

    this.view = webviewView;
    webviewView.webview.options = options(this.context);

    this.render();
  };

  public setNote = (note?: Partial<Note>) => {
    this.note = note;
    this.render();
    this.focus();
  };

  private render = async () => {
    if (!this.view) {
      return;
    }

    const html = webviewContent(
      "note",
      this.view.webview,
      this.context.extensionUri,
      this.note ? editNoteForm(this.note) : placeholder
    );

    this.view.webview.html = html;

    this.view.webview.onDidReceiveMessage(this.onMessage);
  };

  private onMessage = (message: any) => {
    const noteId = this.note?.id;
    if (!noteId) {
      return;
    }

    if (message.type === "change") {
      this.updateNote(noteId, message.note);
    }

    if (message.type === "delete") {
      this.deleteNote(noteId);
      this.note = undefined;
      this.render();
    }
  };
}
