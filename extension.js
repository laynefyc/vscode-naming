var vscode = require('vscode');
var fetch = require('node-fetch');
var TRANS_LIST;  //translation results
function activate(ctx) {

    var documentWatcher = new DocumentWatcher();
    ctx.subscriptions.push(documentWatcher);

    var comm_ext = vscode.commands.registerCommand('extension.naming',naming);
    ctx.subscriptions.push(comm_ext);

    var sug_ext = vscode.languages.registerCompletionItemProvider("*",{
        provideCompletionItems(document, position, token)
        {
            if(TRANS_LIST != undefined && 0 in TRANS_LIST)
            {
                return new Promise((resolve, reject) => { 
                    var completionItems= [];
                    for(i=0;i<3;i++)
                    {
                        var completionItem = new vscode.CompletionItem(TRANS_LIST[i]);
                        completionItem.detail = TRANS_LIST[3];
                        completionItem.filterText = TRANS_LIST[3];
                        completionItem.insertText = TRANS_LIST[i]
                        completionItems.push(completionItem);
                    }
                    return resolve(completionItems) ;
                });
            }
            //显示之后清空
            TRANS_LIST = undefined
        }
    },['。']);
    ctx.subscriptions.push(sug_ext);
}
exports.activate = activate;

/**
 * Listens to vscode document open and maintains a map (Document => editor config settings)
 */
var DocumentWatcher = (function () {
    function DocumentWatcher() {
        var _this = this;
        var subscriptions = [];
        //监听用户输入了 ?
        subscriptions.push(vscode.window.onDidChangeTextEditorSelection(function(textEditor){
            return _this._onHookChinise(textEditor);
        }));

        // dispose event subscriptons upon disposal
        this._disposable = vscode.Disposable.from.apply(vscode.Disposable, subscriptions);

    }
    DocumentWatcher.prototype.dispose = function () {
        this._disposable.dispose();
    };
    DocumentWatcher.prototype._onHookChinise = function (document) {
        var docu = document.textEditor.document;
        var sec = document.selections[0].active;
        var cLine = docu.lineAt(sec.line).text;
        if(sec.character > 2)
        {
            //cut the words
            cLine = cLine.slice(0,sec.character);
            if(cLine[cLine.length-1] == '。')
            {
                cLine = cLine.slice(0,-1);
                var result = /[\u4E00-\u9FA5\uF900-\uFA2D]+$/.exec(cLine);
                if(result !==null && 0 in result)
                {
                    fanyi(result[0]); 
                }
            }
        }
    
        //console.log(sec.line+" "+sec.character);
        //console.log(cLine);
        //vscode.window.showInformationMessage("触发函数2");
    }
    return DocumentWatcher;
})();

function fanyi(src_words){
    if (src_words !== '') {
        var uri = "http://fanyi.youdao.com/openapi.do?keyfrom=vscode-naming&key=641396341&type=data&doctype=json&version=1.1&q="+encodeURI(src_words);
        return new Promise(function(resolve, reject){
            fetch(uri)
                .then(function (res) {
                    return res.text();
                }).then(function (body) {
                    var info = JSON.parse(body);
                    if(info.basic !== undefined 
                        && info.basic.explains !== undefined 
                        && 0 in info.basic.explains)
                    {
                        //生成下划线命名和大、小驼峰命名法
                        var src = info.basic.explains[0].toLowerCase();
                        src = src.replace(/[|\~|\`|\!|\@|\#|\$|\%|\^|\&|\*|\(|\)|\-|\_|\+|\=|\||\\|\[|\]|\{|\}|\;|\:|\"|\'|\,|\<|\.|\>|\/|\?]/g,""); 
                        var sug = [];
                        sug[0] = src.replace(/ /g,'_');
                        sug[1] = src.replace(/\ \w/g,function(s){
                            return s.toUpperCase().slice(1);
                        });
                        sug[2] = src.replace(/(^|\s+)\w/g,function(s){
                            return s[0]==' '?s.toUpperCase().slice(1):s.toUpperCase();
                        });
                        sug[3] = src_words;
                        TRANS_LIST = sug;
                    }
                }).catch(function(e) {
                    vscode.window.showWarningMessage('Connect fail!ßßß');
                });
        });

    }
}
/**
 * Generate an .editorconfig file in the root of the workspace based on the current vscode settings.
 */
function naming() {

}
// this method is called when your extension is deactivated
function deactivate() {
}