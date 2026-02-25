/* eslint-disable import/order */
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { lowlight } from "lowlight";
import { StyledEditor } from "./styles";
import Toolbar from "./toolbar";
import "@/utils/highlight";

interface Props {
  value?: string;
  onChange?: (content: string) => void;
  sample?: boolean;
}

export default function Editor({
  value = "",
  onChange,
  sample = false,
}: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: {
          depth: 100,
        },
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
    ],
    content: value,
    onUpdate({ editor }) {
      onChange?.(editor.getHTML());
    },
  });

  if (!editor) return null;

  return (
    <StyledEditor>
      <Toolbar editor={editor} isSimple={sample} />
      <EditorContent editor={editor} />
    </StyledEditor>
  );
}
