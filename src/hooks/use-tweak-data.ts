'use client';

import { useMemo } from 'react';

import type { DroppedTweak } from '@/components/contexts/tweak-data-context';
import { buildLobbySections } from '@/lib/commands/command-builder';
import type { EnabledCustomTweak } from '@/lib/commands/custom-tweaks';
import type { Configuration } from '@/lib/configuration';
import type { LuaFile } from '@/types/types';

export interface UseTweakDataReturn {
    sections: string[];
    slotUsage?: {
        tweakdefs: { used: number; total: number };
        tweakunits: { used: number; total: number };
    };
    error?: string;
    droppedTweaks: DroppedTweak[];
}

export function useTweakData(
    configuration: Configuration,
    luaFiles: LuaFile[],
    enabledCustomTweaks?: EnabledCustomTweak[]
): UseTweakDataReturn {
    const result = useMemo<UseTweakDataReturn>(() => {
        if (luaFiles.length === 0) {
            return { sections: [], droppedTweaks: [] };
        }

        try {
            const { sections, slotUsage, droppedCustomTweaks } =
                buildLobbySections(
                    configuration,
                    luaFiles,
                    enabledCustomTweaks
                );

            // Transform business type to display type
            const droppedTweaks: DroppedTweak[] = droppedCustomTweaks.map(
                (tweak) => ({
                    description: tweak.description,
                    type: tweak.type,
                })
            );

            return { sections, slotUsage, droppedTweaks };
        } catch (error) {
            console.error('[useTweakData] Failed to build commands:', error);
            return {
                sections: [],
                droppedTweaks: [],
                error:
                    error instanceof Error
                        ? error.message
                        : 'Failed to generate commands',
            };
        }
    }, [configuration, luaFiles, enabledCustomTweaks]);

    return result;
}
