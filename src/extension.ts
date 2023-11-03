import { commands, ExtensionContext, WebviewOptions, window, Range, ThemeColor, TextEdit, TextEditor, workspace, FileType, Selection } from "vscode";

import { Disposable, Webview, WebviewPanel, Uri, ViewColumn } from "vscode";
import { getUri } from "./utilities/getUri";
import { getNonce } from "./utilities/getNonce";

interface Note {
  file: string;
  lines: Line[]
  note: string;
  language: string;
  created: string;
}

interface Line {
  num: number,
  content: string
}

interface ExtensionData {
  notes?: Partial<Note>[]
}

const getExtensionData = async (documentUri: Uri) => {
  const documentDir = workspace.getWorkspaceFolder(documentUri)

  if (!documentDir) {
    throw new Error("Workspace not found")
  }

  const directory = Uri.joinPath(documentDir.uri, '.vscode')

  try {
    await workspace.fs.createDirectory(directory)
  } catch (err) {
    console.error(err)
  }

  const filePath = Uri.file(Uri.joinPath(directory, 'source-notes.json').path)

  let fileExists: boolean
  try {
    await workspace.fs.stat(filePath)
    fileExists = true
  } catch (err) {

    fileExists = false
  }

  const fileContents = await (fileExists && (await workspace.fs.readFile(filePath)).toString())
  const fileData = JSON.parse(fileContents || '{}') as ExtensionData

  return [fileData, filePath] as const
}

const setExtensionData = async (updateData: ExtensionData, filePath: Uri) => {
  const updateContents = JSON.stringify(updateData, null, 2)
  try {
    await workspace.fs.writeFile(filePath, Buffer.from(updateContents, 'utf-8'))
  } catch (err) {
    console.error(err)
    throw new Error("Error saving source-notes.json")
  }
}


const addNote = async (note: Note, context: ExtensionContext, documentUri: Uri) => {
  const [fileData, filePath] = await getExtensionData(documentUri)

  const existingNotes = fileData.notes || []
  const notes = [...existingNotes, note]

  const updatedData: ExtensionData = {
    ...fileData,
    notes
  }

  await setExtensionData(updatedData, filePath)
}

const html = String.raw

const view = (nonce: string, webviewUri: Uri, styleUri: Uri, codiconsUri: Uri) => html`
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hello World!</title>
    
    <link rel="stylesheet" href="${styleUri}?${nonce}">
    <link rel="stylesheet" href="${codiconsUri}?${nonce}">
  <script type="module" src="${webviewUri}?${nonce}"></script>
  </head>
  <body>
    <main>
      <div class="header">
        <div>Add Note</div>
        <div>
          <vscode-button id="close" appearance="icon" aria-label="Confirm">
            <span class="codicon codicon-close"></span>
          </vscode-button>
        </div>
      </div>

      <vscode-text-area id="note" rows=5></vscode-text-area>
      <vscode-button id="submit">Create Note</vscode-button>
    </main>
  </body>
</html>
`
const webviewContent = (webview: Webview, extensionUri: Uri) => {
  const webviewUri = getUri(webview, extensionUri, ["out", "webview.js"]);
  const styleUri = getUri(webview, extensionUri, ["src", "webview", "style.css"]);
  const codiconsUri = getUri(webview, extensionUri, ['node_modules', '@vscode/codicons', 'dist', 'codicon.css']);


  const nonce = getNonce();

  return view(nonce, webviewUri, styleUri, codiconsUri);
}


const selectedTextDecorationType = window.createTextEditorDecorationType({
  backgroundColor: new ThemeColor("peekViewResult.selectionBackground"),
});

function getSelectionLines(editor: TextEditor) {
  const { start, end } = editor.selection;


  const range = new Array(end.line - start.line + 1).fill(undefined).map((_, index) => start.line + index);
  const lines = range.map<Line>(line => ({
    num: line + 1,
    content: editor.document.lineAt(line).text
  }));
  return lines;
}

const save = (editor: TextEditor, note: string, context: ExtensionContext) => {
  console.log(editor, note)
  const documentUri = editor.document.uri


  const lines = getSelectionLines(editor);

  const fullNote: Note = {
    note,
    created: new Date().toISOString(),
    file: editor.document.fileName,
    language: editor.document.languageId,
    lines,
  }

  addNote(fullNote, context, documentUri)
  window.showInformationMessage("Note saved successfully")
}



export function activate(context: ExtensionContext) {
  const webviewOptions: WebviewOptions = {
    enableForms: true,
    enableScripts: true,
    localResourceRoots: [
      Uri.joinPath(context.extensionUri, "out"),
      Uri.joinPath(context.extensionUri, "src/webview"),
      Uri.joinPath(context.extensionUri, 'node_modules', '@vscode')],
    enableCommandUris: true
  }


  const command = commands.registerCommand("source-notes.showHelloWorld", () => {
    const editor = window.activeTextEditor;

    if (!editor) {
      return;
    }

    const { start, end } = editor.selection

    const decoration = { range: new Range(start, end) };
    editor.setDecorations(selectedTextDecorationType, [decoration]);

    const inset = window.createWebviewTextEditorInset(editor, end.line, 10, webviewOptions)
    inset.webview.html = webviewContent(inset.webview, context.extensionUri)

    inset.webview.onDidReceiveMessage(message => {
      console.log(message)

      if (message.type === 'submit') {
        save(editor, message.note, context)
      }

      inset.dispose()
      editor.setDecorations(selectedTextDecorationType, [])
    })

  });



  // Add command to the extension context
  context.subscriptions.push(command);
}
