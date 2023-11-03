import * as vscode from "vscode";
import { html, options, webviewContent } from "./webview";
import { ExtensionData, Note } from "./data";

const addNoteForm = html`
  <vscode-text-area id="note" rows="5"></vscode-text-area>
  <vscode-button id="submit">Create Note</vscode-button>
`;

export type AddNote = (text: string) => Promise<void>;

class FileItem extends vscode.TreeItem {
  static type = "file" as const;

  constructor(
    label: string,
    public readonly notes: Partial<Note>[] = [],
    collapsibleState: vscode.TreeItemCollapsibleState = vscode.TreeItemCollapsibleState.Collapsed
  ) {
    super(label, collapsibleState);

    this.tooltip = label;
  }
}

class NoteItem extends vscode.TreeItem {
  static type = "note" as const;

  constructor(note: Partial<Note>) {
    super(note.note || "", vscode.TreeItemCollapsibleState.None);

    const markdown = new vscode.MarkdownString()
      .appendCodeblock(note.lines?.map((line) => line.content).join("\n") || "", note.language)
      .appendMarkdown(`${note.note}`);

    const lines = note.lines || [];

    const start = lines[0].num;
    const end = lines[lines.length - 1].num;

    this.tooltip = markdown;
    this.description = start === end ? `Line ${start}` : `Lines: ${start} to ${end}`;
  }
}

type Node = FileItem | NoteItem;

export class ViewNotesTreeView implements vscode.TreeDataProvider<Node> {
  public static readonly viewType = "viewNotesPanel";

  constructor(private readonly context: vscode.ExtensionContext, private data: ExtensionData) {}

  getTreeItem(element: Node): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element;
  }

  getChildren(element?: Node): vscode.ProviderResult<Node[]> {
    const notes = this.data.notes;

    if (!notes) {
      return [];
    }

    if (!element) {
      return Array.from(new Set<string>(notes.map((note) => note.file || "unknown")).values())
        .map(
          (file) =>
            new FileItem(
              file,
              notes.filter((note) => note.file === file)
            )
        )
        .sort();
    }

    if (element instanceof FileItem) {
      return element.notes.map((note) => new NoteItem(note));
    }

    return [];
  }

  treeChange = new vscode.EventEmitter<undefined>();

  onDidChangeTreeData = this.treeChange.event;

  refresh = (data: ExtensionData) => {
    this.data = data;
    this.treeChange.fire(undefined);
  };
}
