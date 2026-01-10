import { useCallback, useState } from 'react';

import { useDebouncedCallback } from '@mantine/hooks';

import type { EditedFile } from '@/hooks/use-editor-storage';
import type { SlotContent } from '@/hooks/use-slot-content';
import type { LuaFile } from '@/types/types';

interface UseEditorContentProps {
    luaFolderFiles: LuaFile[];
    slotContents: SlotContent[];
    editedFiles: Map<string, EditedFile>;
    editedSlots: Map<string, EditedFile>;
    setEditedFiles: (
        updater: (prev: Map<string, EditedFile>) => Map<string, EditedFile>
    ) => void;
    setEditedSlots: (
        updater: (prev: Map<string, EditedFile>) => Map<string, EditedFile>
    ) => void;
}

export function useEditorContent({
    luaFolderFiles,
    slotContents,
    editedFiles,
    editedSlots,
    setEditedFiles,
    setEditedSlots,
}: UseEditorContentProps) {
    // Track pending edits for immediate UI updates
    const [pendingEdits, setPendingEdits] = useState<Map<string, string>>(
        new Map()
    );

    // Content getters
    const getCurrentContent = useCallback(
        (path: string): string => {
            // Check pending edits first for immediate UI updates
            const pending = pendingEdits.get(`file:${path}`);
            if (pending !== undefined) return pending;

            const edited = editedFiles.get(path);
            if (edited) return edited.currentData;
            const original = luaFolderFiles.find((f) => f.path === path);
            return original?.data ?? '';
        },
        [pendingEdits, editedFiles, luaFolderFiles]
    );

    const getSlotContent = useCallback(
        (slotName: string): string => {
            // Check pending edits first for immediate UI updates
            const pending = pendingEdits.get(`slot:${slotName}`);
            if (pending !== undefined) return pending;

            const edited = editedSlots.get(slotName);
            if (edited) return edited.currentData;
            const slot = slotContents.find((s) => s.slotName === slotName);
            return slot?.content ?? '';
        },
        [pendingEdits, editedSlots, slotContents]
    );

    // Modification checks
    const isFileModified = useCallback(
        (path: string): boolean => {
            const edited = editedFiles.get(path);
            if (!edited) return false;
            return edited.currentData !== edited.originalData;
        },
        [editedFiles]
    );

    const isSlotModified = useCallback(
        (slotName: string): boolean => {
            const edited = editedSlots.get(slotName);
            if (!edited) return false;
            return edited.currentData !== edited.originalData;
        },
        [editedSlots]
    );

    // Debounced storage write handlers
    const debouncedFileWrite = useDebouncedCallback(
        (path: string, originalData: string, currentData: string) => {
            setEditedFiles((prev) => {
                const next = new Map(prev);
                next.set(path, {
                    path,
                    originalData,
                    currentData,
                });
                return next;
            });
            setPendingEdits((prev) => {
                const next = new Map(prev);
                next.delete(`file:${path}`);
                return next;
            });
        },
        500
    );

    const debouncedSlotWrite = useDebouncedCallback(
        (slotName: string, originalData: string, currentData: string) => {
            setEditedSlots((prev) => {
                const next = new Map(prev);
                next.set(slotName, {
                    path: slotName,
                    originalData,
                    currentData,
                });
                return next;
            });
            setPendingEdits((prev) => {
                const next = new Map(prev);
                next.delete(`slot:${slotName}`);
                return next;
            });
        },
        500
    );

    // Editor change handler
    const handleFileChange = useCallback(
        (path: string, value: string) => {
            const original = luaFolderFiles.find((f) => f.path === path);
            if (!original) return;

            // Store in pending state for immediate UI updates
            setPendingEdits((prev) => {
                const next = new Map(prev);
                next.set(`file:${path}`, value);
                return next;
            });

            // Debounce the storage write
            debouncedFileWrite(path, original.data, value);
        },
        [luaFolderFiles, debouncedFileWrite]
    );

    const handleSlotChange = useCallback(
        (slotName: string, value: string) => {
            const original = slotContents.find((s) => s.slotName === slotName);
            if (!original) return;

            // Store in pending state for immediate UI updates
            setPendingEdits((prev) => {
                const next = new Map(prev);
                next.set(`slot:${slotName}`, value);
                return next;
            });

            // Debounce the storage write
            debouncedSlotWrite(slotName, original.content, value);
        },
        [slotContents, debouncedSlotWrite]
    );

    // Reset handlers
    const resetFile = useCallback(
        (path: string) => {
            setEditedFiles((prev) => {
                const next = new Map(prev);
                next.delete(path);
                return next;
            });
        },
        [setEditedFiles]
    );

    const resetSlot = useCallback(
        (slotName: string) => {
            setEditedSlots((prev) => {
                const next = new Map(prev);
                next.delete(slotName);
                return next;
            });
        },
        [setEditedSlots]
    );

    return {
        getCurrentContent,
        getSlotContent,
        isFileModified,
        isSlotModified,
        handleFileChange,
        handleSlotChange,
        resetFile,
        resetSlot,
    };
}
