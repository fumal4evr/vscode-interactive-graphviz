"use strict";
/**
 * @author github.com/tintinweb
 * @license MIT
 *
 * */

/** imports */
const vscode = require("vscode");
const {
  InteractiveWebviewGenerator,
} = require("./features/interactiveWebview.js");
const DOT = "dot";

/** global vars */

/** classdecs */

/** funcdecs */

/** event funcs */
function onActivate(context) {
  const graphvizView = new InteractiveWebviewGenerator(context, "content");
  vscode.workspace.onDidChangeTextDocument(
    (event) => {
      if (
        event.document.languageId == DOT ||
        event.document.fileName.trim().toLowerCase().endsWith(".dot")
      ) {
        let panel = graphvizView.getPanel(event.document.uri);
        if (panel) {
          // graphvizView has an updated list of images and resources. Replace reference to images with protected resources before requesting a render
          const dot = graphvizView.processImages(event.document.getText());
          panel.requestRender(dot);
        }
      }
    },
    null,
    context.subscriptions
  );

  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument((doc) => {
      if (
        doc.languageId == DOT ||
        doc.fileName.trim().toLowerCase().endsWith(".dot")
      ) {
        let panel = graphvizView.getPanel(doc.uri);
        if (panel) {
          // similart to update, replace references to images with protected resources
          const dot = graphvizView.processImages(doc.getText());
          panel.requestRender(dot);
        }
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "graphviz-interactive-preview.preview.beside",
      (args) => {
        // take document or string; default active editor if
        args = args || {};
        let options = {
          document: args.document,
          content: args.content,
          callback: args.callback,
          allowMultiplePanels: args.allowMultiplePanels,
          title: args.title,
        };

        if (!options.content && !options.document) {
          options.document = vscode.window.activeTextEditor.document;
        }

        if (!options.content && options.document) {
          options.content = options.document.getText();
        }

        graphvizView
          .revealOrCreatePreview(
            vscode.ViewColumn.Beside,
            options.document,
            options
          )
          .then((webpanel) => {
            //trigger dot render on page load success
            //just in case webpanel takes longer to load, wait for page to ping back and perform action

            // before displaying for the first time, replace images with resource references
            const doc = graphvizView.replaceDotImagesWithResources(
              options.content
            );
            webpanel.waitingForRendering = doc;

            // allow caller to handle messages by providing them with the newly created webpanel
            // e.g. caller can override webpanel.handleMessage = function(message){};
            if (options.callback) {
              options.callback(webpanel);
            }
          });
      }
    )
  );
}

/* exports */
exports.activate = onActivate;
