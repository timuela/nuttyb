import { useMemo, useState } from 'react';

import type { SlotContent } from '@/hooks/use-slot-content';
import type { LuaFile } from '@/types/types';

interface UseEditorSelectionProps {
    luaFolderFiles: LuaFile[];
    slotContents: SlotContent[];
}

export function useEditorSelection({
    luaFolderFiles,
    slotContents,
}: UseEditorSelectionProps) {
    // Compute initial selections
    const initialFile = useMemo(
        () => (luaFolderFiles.length > 0 ? luaFolderFiles[0].path : null),
        [luaFolderFiles]
    );

    const initialSlot = useMemo(
        () => (slotContents.length > 0 ? slotContents[0].slotName : null),
        [slotContents]
    );

    const [selectedFile, setSelectedFile] = useState<string | null>(
        initialFile
    );
    const [selectedSlot, setSelectedSlot] = useState<string | null>(
        initialSlot
    );

    return {
        selectedFile,
        selectedSlot,
        setSelectedFile,
        setSelectedSlot,
    };
}
