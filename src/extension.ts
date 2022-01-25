// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	
	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "open-external" is now active!');

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	context.subscriptions.push(vscode.commands.registerCommand('open-external.openExternal', () => {

		const recents = context.globalState.get<vscode.QuickPickItem[]>('recent-urls') ?? [];
		const qp = vscode.window.createQuickPick();
		qp.matchOnDescription = true;
		qp.items = [
			...recents,
			{
				label: 'Use custom value...'
			},
			{
				label: 'Trigger uri handler...'
			}
		];
		qp.onDidChangeValue((e: string) => {
			if (e.length) {
				qp.items[qp.items.length - 1].description = e;
				qp.items = qp.items;
			}
		});
		qp.onDidAccept(async () => {
			qp.hide();

			// Get the value
			let chosenItem: vscode.QuickPickItem;
			if (qp.selectedItems[0].description) {
				chosenItem = {
					label: qp.selectedItems[0].description,
				};
			} else if (qp.selectedItems[0].label === 'Use custom value...') {
				// need to prompt
				const url = await vscode.window.showInputBox({
					placeHolder: 'Enter URL to open'
				});

				if (!url) {
					console.error('No URL entered');
					return;
				}

				chosenItem = {
					label: url,
				};

			} else if (qp.selectedItems[0].label === 'Trigger uri handler...') {
				chosenItem = {
					label: vscode.env.uriScheme + '://' + context.extension.id + '/open-external',
				};
			} else {
				chosenItem = qp.selectedItems[0];
			}

			// do the thing
			if (!(await vscode.env.openExternal(await vscode.env.asExternalUri(vscode.Uri.parse(chosenItem.label))))) {
				return;
			}

			// fix up our recents
			recents.splice(recents.indexOf(chosenItem), 1);
			recents.unshift(chosenItem);
			if (recents.length > 10) {
				recents.splice(10, recents.length - 10);
			}
			await context.globalState.update('recent-urls', recents);

		});
		qp.show();
	}));

	context.subscriptions.push(vscode.commands.registerCommand('open-external.clearRecents', async () => {
		await context.globalState.update('recent-urls', undefined);
	}));

	context.subscriptions.push(vscode.window.registerUriHandler({
		async handleUri(uri: vscode.Uri) {
			vscode.window.showInformationMessage(`Received URI: ${uri.toString()}`);
		}
	}));
}

// this method is called when your extension is deactivated
export function deactivate() {}
