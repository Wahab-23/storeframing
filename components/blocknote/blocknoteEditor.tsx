'use client';

import { forwardRef, useEffect, useRef } from 'react';
import "@blocknote/core/fonts/inter.css";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView, darkDefaultTheme, lightDefaultTheme } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";

export interface BlockNoteEditorRef {
  getContent: () => Promise<string>;
  setContent: (html: string) => void;
}

interface BlockNoteEditorProps {
  initialContent?: string;
  placeholder?: string;
  onChange?: (content: string) => void;
  theme?: 'dark' | 'light';
  minHeight?: string;
}

const blackTheme = {
  ...darkDefaultTheme,
  colors: {
    ...darkDefaultTheme.colors,
    editor: {
      text: "#f0f6fc",
      background: "#0d1117",
    },
    menu: {
      text: "#f0f6fc",
      background: "#161b22",
    },
    tooltip: {
      text: "#f0f6fc",
      background: "#0f1520",
    },
    hovered: {
      text: "#f0f6fc",
      background: "#21262d",
    },
    selected: {
      text: "#ffffff",
      background: "#30363d",
    },
    border: "rgba(255, 255, 255, 0.12)",
    shadow: "rgba(0, 0, 0, 0.6)",
    sideMenu: "#8b949e",
    highlights: darkDefaultTheme.colors.highlights,
  },
  borderRadius: 10,
  fontFamily: "Inter, sans-serif",
};

const BlockNoteEditor = forwardRef<BlockNoteEditorRef, BlockNoteEditorProps>(
  ({ initialContent = '', placeholder = 'Start typing...', onChange, theme = 'dark', minHeight = '180px' }, ref) => {
    const editor = useCreateBlockNote();
    const lastLoadedContent = useRef<string | null>(null);

    const editorInstanceRef = useRef(editor);

    useEffect(() => {
      editorInstanceRef.current = editor;
    }, [editor]);

    // Initialize or update content when initialContent changes (supports both HTML and Markdown)
    useEffect(() => {
      if (initialContent && editor && lastLoadedContent.current !== initialContent) {
        try {
          let blocks;
          if (initialContent.trim().startsWith('<')) {
            blocks = editor.tryParseHTMLToBlocks(initialContent);
          } else {
            blocks = editor.tryParseMarkdownToBlocks(initialContent);
          }

          if (blocks && blocks.length > 0) {
            editor.replaceBlocks(editor.document, blocks);
            lastLoadedContent.current = initialContent;
          }
        } catch (e) {
          console.error('Error parsing initial content in BlockNote:', e);
        }
      }
    }, [initialContent, editor]);

    // Expose methods via ref
    useEffect(() => {
      if (ref && 'current' in ref) {
        ref.current = {
          getContent: async () => {
            if (!editor) return '';
            try {
              const html = await editor.blocksToHTMLLossy(editor.document);
              return html;
            } catch (e) {
              console.error('Error converting to HTML:', e);
              return '';
            }
          },
          setContent: (content: string) => {
            if (editor) {
              try {
                let blocks;
                if (content.trim().startsWith('<')) {
                  blocks = editor.tryParseHTMLToBlocks(content);
                } else {
                  blocks = editor.tryParseMarkdownToBlocks(content);
                }

                if (blocks && blocks.length > 0) {
                  editor.replaceBlocks(editor.document, blocks);
                  lastLoadedContent.current = content;
                }
              } catch (e) {
                console.error('Error setting content:', e);
              }
            }
          },
        };
      }
    }, [editor, ref]);

    const isDark = theme === 'dark';

    return (
      <div
        className={`rounded-xl border transition overflow-hidden ${
          isDark
            ? 'border-white-chalk-100/10 bg-[#0d1117] text-white-chalk-100 focus-within:border-sunflower-100/50 shadow-inner'
            : 'border-input bg-background text-foreground shadow-sm'
        }`}
        style={{ minHeight }}
      >
        <BlockNoteView
          editor={editor}
          theme={isDark ? blackTheme : 'light'}
          className={isDark ? 'blocknote-black bg-[#0d1117] text-white' : 'blocknote-light bg-white'}
          onChange={async () => {
            if (onChange) {
              const html = await editor.blocksToHTMLLossy(editor.document);
              onChange(html);
            }
          }}
        />
        <style jsx global>{`
          .blocknote-black .bn-container {
            background-color: #0d1117 !important;
            color: #f0f6fc !important;
          }
          .blocknote-black .bn-editor {
            background-color: #0d1117 !important;
            color: #f0f6fc !important;
            padding-top: 12px;
            padding-bottom: 12px;
          }
          .blocknote-black [data-node-view-wrapper] {
            color: #f0f6fc !important;
          }
          .blocknote-black .bn-toolbar,
          .blocknote-black .bn-menu,
          .blocknote-black .bn-panel {
            background-color: #161b22 !important;
            border-color: rgba(255, 255, 255, 0.12) !important;
            color: #f0f6fc !important;
          }
          .blocknote-black .bn-toolbar-button:hover,
          .blocknote-black .bn-menu-item:hover {
            background-color: #21262d !important;
          }
        `}</style>
      </div>
    );
  }
);

BlockNoteEditor.displayName = 'BlockNoteEditor';

export default BlockNoteEditor;