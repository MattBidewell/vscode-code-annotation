import * as vscode from 'vscode';
import * as fs from "fs";

import { getAnnotationsFile, getNextId, addNote } from './note-db';
import { generateMarkdownReport } from './reporting';
import { NotesTree, TreeActions } from './notes-tree';

export function activate(context: vscode.ExtensionContext) {
	console.log('Extension "code-annotation" is now active!');

	const tree = new NotesTree();
	const treeActions = new TreeActions(tree);

	vscode.window.registerTreeDataProvider('codeAnnotationView', tree);
	vscode.commands.registerCommand('code-annotation.removeNote', treeActions.removeNote.bind(treeActions));
	vscode.commands.registerCommand('code-annotation.checkNote', treeActions.checkNote.bind(treeActions));
	vscode.commands.registerCommand('code-annotation.uncheckNote', treeActions.uncheckNote.bind(treeActions));
	vscode.commands.registerCommand('code-annotation.openNote', treeActions.openNote.bind(treeActions));
	vscode.commands.registerCommand('code-annotation.editNote', treeActions.editNote.bind(treeActions));
	vscode.commands.registerCommand('code-annotation.openNoteFromId', (id: string) => {
		treeActions.openNoteFromId(id);
	});

	vscode.commands.registerCommand('code-annotation.summary', () => {
		generateMarkdownReport();
	});

	vscode.commands.registerCommand('code-annotation.clearAllNotes', async () => {
		const message = 'Are you sure you want to clear all notes? This cannot be reverted.';
		const enableAction = 'I\'m sure';
		const cancelAction = 'Cancel';
		const userResponse = await vscode.window.showInformationMessage(message, enableAction, cancelAction);
		const clearAllNotes = userResponse === enableAction ? true : false;

		if (clearAllNotes) {
			const annotationFile = getAnnotationsFile();
			fs.unlinkSync(annotationFile);
			vscode.commands.executeCommand('code-annotation.refreshEntry');
			vscode.window.showInformationMessage('All notes cleared!');
		}
	});

	let disposable = vscode.commands.registerCommand('code-annotation.addNote', async () => {
		const editor = vscode.window.activeTextEditor;
		if (editor) {
			const fsPath = editor.document.uri.fsPath;
			const selection = editor.selection;
			const text = editor.document.getText(selection);
			const annotationText = await vscode.window.showInputBox({ placeHolder: 'Give the annotation some text...' });
			if (annotationText) {
				const nextId = getNextId();
				addNote({
					fileName: fsPath,
					fileLine: selection.start.line,
					positionStart: { line: selection.start.line, character: selection.start.character },
					positionEnd: { line: selection.end.line, character: selection.end.character },
					text: annotationText,
					codeSnippet: text,
					status: "pending",
					id: nextId
				});
				vscode.window.showInformationMessage('Annotation saved!');
			}
		}
	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() { }
