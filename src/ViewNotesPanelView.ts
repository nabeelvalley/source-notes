import * as vscode from "vscode";
import { html, options, webviewContent } from "./webview";
import { ExtensionData, Note } from "./data";

const addNoteForm = html`
  <vscode-text-area id="note" rows="5"></vscode-text-area>
  <vscode-button id="submit">Create Note</vscode-button>
`;

export type AddNote = (text: string) => Promise<void>;

class FileItem extends vscode.TreeItem {
  constructor(
    label: string,
    private readonly notes: Note[],
    collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(label, collapsibleState);
  }
}

export class ViewNotesTreeView implements vscode.TreeDataProvider<FileItem> {
  public static readonly viewType = "viewNotesPanel";

  constructor(private readonly context: vscode.ExtensionContext) {}

  resolveTreeItem?(
    item: vscode.TreeItem,
    element: FileItem,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.TreeItem> {
    throw new Error("Method not implemented.");
  }

  getTreeItem(element: FileItem): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element;
  }

  getChildren(element?: FileItem | undefined): vscode.ProviderResult<FileItem[]> {
    return [];
  }
}
