import React, { useCallback, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Mark } from "@tiptap/core";
import { useVariableStore } from "@/lib/variableStore";
import { useSourceStore } from "@/lib/store";
import { Plugin } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import { BulletList, OrderedList, ListItem } from "@tiptap/extension-list";
import { ListButton } from "@/components/tiptap-ui/list-button";
import Document from "@tiptap/extension-document";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import { useAgentStore } from "@/lib/agentStore";
// --- Highlight Variables Extension ---
const HighlightVariables = Mark.create({
  name: "highlightVariables",

  addProseMirrorPlugins() {
    return [
      new Plugin({
        props: {
          decorations: (state) => {
            const decorations: any[] = [];

            // Get current variables and sources from stores
            const variables = useVariableStore.getState().variables;
            const fileNicknames = useSourceStore.getState().fileNicknames;
            const currentAgent = useAgentStore.getState().currentAgent;

            // console.log("currentAgent", currentAgent);

            // Regex for {{variables}}
            const regexVariable = /\{\{(.*?)\}\}/g;
            // Regex for @sources
            const regexSource = /@([a-zA-Z_]+(?:\.[a-zA-Z]+)?)/g;

            state.doc.descendants((node, pos) => {
              if (!node.isText) return;

              const text = node.text;

              let match;
              // Handle {{variables}}
              while ((match = regexVariable.exec(text ?? "")) !== null) {
                const from = pos + match.index;
                const to = from + match[0].length;

                // Check if variable exists - handle both regular variables and table.column references
                const varName = match[1].trim();

                // Check if it's a table.column reference (contains dot)
                if (varName.includes(".")) {
                  const [tableName, columnName] = varName.split(".");

                  // Find the table variable
                  const tableVar = Object.values(variables).find(
                    (v) => v.name === tableName
                  );

                  // Check if table exists and has the specified column
                  const varExists = !!(
                    tableVar &&
                    tableVar.type === "table" &&
                    Array.isArray(tableVar.columns) &&
                    tableVar.columns.includes(columnName)
                  );

                  decorations.push(
                    Decoration.inline(from, to, {
                      style: varExists
                        ? "background-color: #1E40AF; color: #DBEAFE; border-radius: 4px; padding: 1px 4px; border: 1px solid #3B82F6; font-weight: bold;"
                        : "background-color: #7F1D1D; color: #FECACA; border-radius: 4px; padding: 1px 4px; border: 1px solid #DC2626; font-weight: bold;",
                    })
                  );
                } else {
                  // Handle regular variables
                  const varExists = Object.values(variables).some(
                    (v) => v.name === varName
                  );

                  decorations.push(
                    Decoration.inline(from, to, {
                      style: varExists
                        ? "background-color: #1E40AF; color: #DBEAFE; border-radius: 4px; padding: 1px 4px; border: 1px solid #3B82F6; font-weight: bold;"
                        : "background-color: #7F1D1D; color: #FECACA; border-radius: 4px; padding: 1px 4px; border: 1px solid #DC2626; font-weight: bold;",
                    })
                  );
                }
              }

              // Handle @sources
              while ((match = regexSource.exec(text ?? "")) !== null) {
                const from = pos + match.index;
                const to = from + match[0].length;

                // Check if source exists
                const sourceName = match[1].trim();
                const sourceExists = fileNicknames[sourceName];

                decorations.push(
                  Decoration.inline(from, to, {
                    style: sourceExists
                      ? "background-color: #059669; color: #D1FAE5; border-radius: 4px; padding: 1px 4px; border: 1px solid #10B981; font-weight: bold;"
                      : "background-color: #7F1D1D; color: #FECACA; border-radius: 4px; padding: 1px 4px; border: 1px solid #DC2626; font-weight: bold;",
                  })
                );
              }
            });

            return DecorationSet.create(state.doc, decorations);
          },
        },
      }),
    ];
  },
});

interface CustomEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  showListButtons?: boolean;
}

export default function CustomEditor({
  value,
  onChange,
  placeholder = "Enter your text...",
  className = "",
  disabled = false,
  showListButtons = true,
}: CustomEditorProps) {
  const editor = useEditor({
    extensions: [
      // Add required basic extensions
      Document,
      Paragraph,
      Text,
      // Configure list extensions with Tailwind classes
      BulletList.configure({
        HTMLAttributes: {
          class: "list-disc ml-4",
        },
      }),
      OrderedList.configure({
        HTMLAttributes: {
          class: "list-decimal ml-4",
        },
      }),
      ListItem.configure({
        HTMLAttributes: {
          class: "mb-1",
        },
      }),
      // Add our custom extension
      HighlightVariables,
    ],
    content: value,
    editable: !disabled,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      if (editor) {
        const text = editor.getText();
        onChange(text);
      }
    },
  });

  // Add debugging and state checking
  const toggleBulletList = () => {
    if (editor) {
      console.log("Current editor state:", editor.state);
      console.log("Available commands:", Object.keys(editor.commands));

      // Check if we're already in a list
      const isInList =
        editor.isActive("bulletList") || editor.isActive("orderedList");
      console.log("Currently in list:", isInList);

      // Try to toggle bullet list
      const success = editor.chain().focus().toggleBulletList().run();
      console.log("Bullet list toggle success:", success);

      // Check state after toggle
      console.log(
        "Is bullet list active after toggle:",
        editor.isActive("bulletList")
      );
    }
  };

  const toggleOrderedList = () => {
    if (editor) {
      console.log("Current editor state:", editor.state);

      // Check if we're already in a list
      const isInList =
        editor.isActive("bulletList") || editor.isActive("orderedList");
      console.log("Currently in list:", isInList);

      // Try to toggle ordered list
      const success = editor.chain().focus().toggleOrderedList().run();
      console.log("Ordered list toggle success:", success);

      // Check state after toggle
      console.log(
        "Is ordered list active after toggle:",
        editor.isActive("orderedList")
      );
    }
  };

  // Update editor content when value prop changes
  useEffect(() => {
    if (editor && editor.getText() !== value) {
      editor.commands.setContent(value);
    }
  }, [editor, value]);

  return (
    <div className={`space-y-2 ${className}`}>
      {/* List Buttons with TipTap ListButton components */}
      {showListButtons && editor && (
        <div className="bg-white border border-gray-300 rounded-lg p-2 mb-2">
          <div className="flex gap-2">
            <ListButton
              editor={editor}
              type="bulletList"
              hideWhenUnavailable={false}
              //   showShortcut={true}
              onToggled={() => console.log("Bullet list toggled!")}
            />
            <ListButton
              editor={editor}
              type="orderedList"
              hideWhenUnavailable={false}
              //   showShortcut={true}
              onToggled={() => console.log("Ordered list toggled!")}
            />
          </div>
        </div>
      )}

      <div className="relative">
        <EditorContent
          editor={editor}
          className="w-full h-32 bg-gray-700 border border-gray-600 rounded p-3 text-gray-200 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-colors cursor-text overflow-y-auto"
          style={{
            fontFamily: "inherit",
            fontSize: "inherit",
            lineHeight: "inherit",
          }}
          onClick={() => editor?.chain().focus().run()}
        />
        {placeholder && !value && (
          <div className="absolute top-3 left-3 text-gray-400 pointer-events-none">
            {placeholder}
          </div>
        )}
      </div>

      {/* Add custom CSS for the list buttons */}
      <style jsx>{`
        .ProseMirror {
          background: transparent !important;
          outline: none !important;
          border: none !important;
          box-shadow: none !important;
        }
        .ProseMirror p {
          margin: 0 !important;
          padding: 0 !important;
        }
        .ProseMirror ul {
          list-style-type: disc !important;
          padding-left: 1.5em !important;
          margin: 0 !important;
        }
        .ProseMirror ol {
          list-style-type: decimal !important;
          padding-left: 1.5em !important;
          margin: 0 !important;
        }
        .ProseMirror li {
          margin: 0 !important;
          padding: 0 !important;
        }

        /* Custom styling for TipTap list buttons */
        .tiptap-button {
          background-color: white !important;
          color: black !important;
          border: 1px solid white !important;
          border-radius: 6px !important;
          padding: 6px 12px !important;
          font-size: 14px !important;
          font-weight: 500 !important;
          cursor: pointer !important;
          transition: all 0.2s ease !important;
        }

        .tiptap-button:hover {
          background-color: #f3f4f6 !important;
        }

        .tiptap-button[data-state="on"] {
          background-color: #3b82f6 !important;
          color: white !important;
          border-color: #3b82f6 !important;
        }
      `}</style>
    </div>
  );
}
