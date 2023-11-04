import * as vscode from "vscode";
import { html, options, webviewContent } from "./webview/webview";
import { Note } from "./data";

const editNoteForm = (note: Partial<Note>) => html`
  <vscode-text-area id="note" rows="5" value="${note.note}"></vscode-text-area>
`;

export type UpdateNote = (id: string, text: string) => Promise<void>;

export class EditNoteViewProvider implements vscode.WebviewViewProvider {
  private view?: vscode.WebviewView;
  private note?: Partial<Note>;

  public static readonly viewType = "viewNotePanel";

  public constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly updateNote: UpdateNote
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

  private render = () => {
    if (!this.view) {
      return;
    }

    const html = webviewContent(
      "note",
      this.view.webview,
      this.context.extensionUri,
      this.note ? editNoteForm(this.note) : ""
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
  };
}