/**
 * register the provider object
 */
'use strict';
import * as vscode from 'vscode';
import fetch from 'node-fetch';
export let sp_key:string = "/";  //translation results

export default class SugCompletionItemProvider implements vscode.CompletionItemProvider {
	public provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Thenable<vscode.CompletionItem[]> {
		const activeLineText = document.lineAt(position).text
		let src_words = getInputString(activeLineText);
		if (src_words !== '' && src_words !== undefined) {

			// const edit = new vscode.TextEdit(document.getWordRangeAtPosition(position), "123123123123123");
			
            // edit.replace(document.uri,document.getWordRangeAtPosition(position), "123123123123123");
			// vscode.workspace.applyEdit(edit);
			return translation(src_words);
		}
	}
};

/**
 * get translation results
 * @param src_words 
 */
function translation(src_words:string):Thenable<vscode.CompletionItem[]>{
	let uri = "http://fanyi.youdao.com/openapi.do?keyfrom=vscode-naming&key=641396341&type=data&doctype=json&version=1.1&q=" + encodeURI(src_words);
	return new Promise((resolve, reject) => {
		fetch(uri)
			.then(function (res) {
				return res.text();
			}).then(function (body) {
				var info = JSON.parse(body);
				if (info.basic !== undefined
					&& info.basic.explains !== undefined
					&& 0 in info.basic.explains) {
					//生成下划线命名和大、小驼峰命名法
					var src = info.basic.explains[0].toLowerCase();
					src = src.replace(/[|\~|\`|\!|\@|\#|\$|\%|\^|\&|\*|\(|\)|\-|\_|\+|\=|\||\\|\[|\]|\{|\}|\;|\:|\"|\'|\,|\<|\.|\>|\/|\?]/g, "");
					var sug = [];
					sug[0] = src.replace(/ /g, '_');
					sug[1] = src.replace(/\ \w/g, function (s) {
						return s.toUpperCase().slice(1);
					});
					sug[2] = src.replace(/(^|\s+)\w/g, function (s) {
						return s[0] == ' ' ? s.toUpperCase().slice(1) : s.toUpperCase();
					});
					sug[3] = src_words;
					let completionItemList = [];
					let i: number;
					for (i = 0; i < 3; i++) {
						var completionItem = new vscode.CompletionItem(sug[i]);
						completionItem.detail = sug[3];
						completionItem.filterText = sug[3];
						completionItem.insertText = sug[i]
						completionItemList.push(completionItem);
					}
					resolve(completionItemList)
				}
			});
	});
}
function getInputString(cLine) {
	if (cLine[cLine.length - 1] === sp_key && cLine[cLine.length - 2] !== sp_key) {
		cLine = cLine.slice(0, -1);
		var result = /[\u4E00-\u9FA5\uF900-\uFA2D]+$/.exec(cLine);
		if (result !== null && 0 in result) {
			return result[0];
		}
	}
}