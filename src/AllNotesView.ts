import * as vscode from "vscode";
import {
  highlight,
  html,
  md,
  options,
  webviewContent,
} from "./webview/webview";
import { ExtensionData, Note } from "./data";

const htmlNote = (
  note: Partial<Note>,
  showFile: boolean,
  isFirstNote: boolean
) => html`
  ${!isFirstNote && showFile ? `<hr/>` : ""}
  ${showFile ? html` <h2>${note.file || ""}</h2>` : ""}
  <blockquote>
    <b>Line ${note.lines?.[0].num || ""} to ${note.lines?.at(-1)?.num}</b>
  </blockquote>
  <pre>
    <code>
  ${highlight(
    note.lines?.map((line) => line.content).join("\n"),
    note.language
  )}
    </code>
  </pre>
  ${note.note?.split("\n").map((line) => html`<p>${line}</p>`)}
`;

const ticks = "```";
const markdownNote = (note: Partial<Note>, showFile: boolean) => md`${
  showFile ? "## `" + note.file + "`\n\n" : ""
}> **Line ${note.lines?.[0].num || ""} to ${note.lines?.at(-1)?.num}**

${ticks}${note.language || ""}
${note.lines?.map((line) => line.content || "").join("\n")}
${ticks}

${note.note || ""}`;

export class AllNotesView {
  public static readonly viewType = "allNoteView";

  public constructor(
    private readonly context: vscode.ExtensionContext,
    private data: ExtensionData,
    private readonly panel: vscode.WebviewPanel
  ) {
    this.render();
  }

  public render = async () => {
    const notes = this.data.notes || [];

    const content = notes
      .sort((a, b) => ((a?.lines?.[0] || 0) > (b?.lines?.[0] || 0) ? 1 : -1))
      .sort((a, b) => ((a?.file || "") > (b?.file || "") ? 1 : -1))
      .map((note, i) =>
        htmlNote(note, note.file === notes[i - 1]?.file, i === 0)
      );

    const webview = this.panel.webview;

    const htmlContent = webviewContent(
      "notes",
      webview,
      this.context.extensionUri,
      content.join(html`<br />`)
    );

    webview.html = htmlContent;
  };

  public static renderToMarkdown = (data: ExtensionData): string => {
    const notes = data.notes || [];
    const markdownNotes = notes
      .map((note, i) => markdownNote(note, note.file !== notes[i - 1]?.file))
      .join("\n");

    return md`# Notes

${markdownNotes}`;
  };
}
