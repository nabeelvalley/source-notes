import * as vscode from "vscode";
import { html, options, webviewContent } from "./webview";

const addNoteForm = html`
  <vscode-text-area id="note" rows="5"></vscode-text-area>
  <vscode-button id="submit">Create Note</vscode-button>
`;

export type AddNote = (text: string) => Promise<void>;

export class AddNotePanelViewProvider implements vscode.WebviewViewProvider {
  private view?: vscode.WebviewView;

  public static readonly viewType = "addNotePanel";

  public constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly addNote: AddNote
  ) {}

  public focus = () => {
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

  private render = () => {
    if (!this.view) {
      return;
    }

    const html = webviewContent(this.view.webview, this.context.extensionUri, addNoteForm);

    this.view.webview.html = html;
    this.view.webview.onDidReceiveMessage(this.onMessage);
  };

  private onMessage = (message: any) => {
    console.log(message);

    if (message.type === "submit") {
      this.addNote(message.note);
      this.render();
    }
  };
}
