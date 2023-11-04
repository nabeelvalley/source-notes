import * as vscode from "vscode";
import { ExtensionData, Note } from "./data";

export type AddNote = (text: string) => Promise<void>;

interface TreeNote extends Partial<Note> {
  children?: Partial<TreeNote>[];
}

class FolderItem extends vscode.TreeItem {
  constructor(label: string, public readonly children: FileItem[] = []) {
    super(label, vscode.TreeItemCollapsibleState.Expanded);
    this.iconPath = vscode.ThemeIcon.Folder;
  }
}

class FileItem extends vscode.TreeItem {
  constructor(label: string, public readonly children: NoteItem[] = []) {
    super(label, vscode.TreeItemCollapsibleState.Expanded);

    this.tooltip = label;
    this.iconPath = vscode.ThemeIcon.File;
  }
}

const unique = <T>(data: T[]) => Array.from(new Set(data));

const exists = <T>(data?: T): data is T => !!data;

export class NoteItem extends vscode.TreeItem {
  constructor(private readonly note?: Partial<Note>) {
    super(note?.note || "", vscode.TreeItemCollapsibleState.None);

    this.contextValue = "note";

    const markdown = new vscode.MarkdownString()
      .appendCodeblock(note?.lines?.map((line) => line.content).join("\n") || "", note?.language)
      .appendMarkdown(`${note?.note}`);

    const lines = note?.lines || [];

    const start = lines[0]?.num;
    const end = lines[lines.length - 1]?.num;

    this.tooltip = markdown;
    this.description = start === end ? `Line ${start}` : `Lines: ${start} to ${end}`;
  }
}

type Node = FileItem | FolderItem;

export class ViewNotesTreeView implements vscode.TreeDataProvider<vscode.TreeItem> {
  public static readonly viewType = "viewNotesPanel";

  private tree: Node[] = [];

  constructor(private readonly context: vscode.ExtensionContext, private data: ExtensionData) {
    this.tree = this.createNoteTree(data.notes);
  }

  getTreeItem(element: Node): vscode.TreeItem | Thenable<vscode.TreeItem> {
    return element;
  }

  getChildren(element?: Node): vscode.ProviderResult<vscode.TreeItem[]> {
    if (!element) {
      return this.tree;
    }

    if (element instanceof FolderItem) {
      return element.children;
    }

    if (element instanceof FileItem) {
      return element.children;
    }

    // if (!element) {
    //   return this.getNodes(this.tree);
    // }

    // if (element instanceof FileItem) {
    //   return this.getNodes(element.notes);
    // }

    // if (element instanceof NoteItem) {
    //   return [];
    // }

    // return [];
  }

  treeChange = new vscode.EventEmitter<undefined>();

  onDidChangeTreeData = this.treeChange.event;

  createNoteTree = (notes: TreeNote[] = [], level = 0): Node[] => {
    // 1. go through all nodes and use the split at the input level
    // 2. always have a node at the level of the split
    // 3. if an exact value exists, use that data, otherwise default empty
    // 4. iterate through everyhing that starts with the entire current node to get the output children set

    const uniqueFolders = unique(notes.map((note) => note.file?.split("/")[level])).filter(exists);

    const atLevel = (file: string, node?: TreeNote) => node?.file?.split("/")?.[level] === file;
    const atLeaf = (file: string, node?: TreeNote) =>
      atLevel(file, node) && node?.file?.split("/").length === level + 1;

    const afterLeaf = (file: string, node?: TreeNote) =>
      atLevel(file, node) && (node?.file?.split("/")?.length || 0) > level + 1;

    return uniqueFolders
      .map<Node[]>((file) => {
        const after = notes.filter((n) => afterLeaf(file, n));
        const leafs = notes.filter((n) => atLeaf(file, n));

        const afterNode = after.length
          ? new FolderItem(file, this.createNoteTree(after, level + 1))
          : undefined;

        const leafNodes = leafs.map((l) => new NoteItem(l));
        const fileNote = new FileItem(file, leafNodes);

        return [afterNode, fileNote].filter(exists).filter((item) => !!item.children.length);
      })
      .flat();
  };

  refresh = (data: ExtensionData) => {
    this.data = data;
    this.tree = this.createNoteTree(data.notes);
    this.treeChange.fire(undefined);
  };
}
