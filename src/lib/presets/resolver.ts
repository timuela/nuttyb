import type { EnabledCustomTweak } from '@/lib/command-generator/command-generator';
import { encode } from '@/lib/encoders/base64';

import type { Preset } from './registry';

interface FileLike {
    path: string;
    data: string;
}

/**
 * Resolves active preset tweaks from file paths, remote URLs, and inline codes.
 *
 * @param preset The preset to resolve tweaks for
 * @param luaFiles The list of bundled Lua files
 * @param remoteFiles Cached remote file contents (key is URL, value is file content)
 * @returns Array of resolved EnabledCustomTweak objects
 */
export function resolvePresetTweaks(
    preset: Preset,
    luaFiles: FileLike[],
    remoteFiles: Record<string, string> = {}
): EnabledCustomTweak[] {
    // 1. Resolve built-in or local presets with file paths
    const tweaksToResolve = preset.presetTweaks || [];
    const resolvedFromPaths = tweaksToResolve
        .map((tweak, index): EnabledCustomTweak | null => {
            const isRemote =
                tweak.path.startsWith('http://') ||
                tweak.path.startsWith('https://');

            if (isRemote) {
                const remoteContent = remoteFiles[tweak.path];
                if (!remoteContent) return null; // Still loading from network
                return {
                    id: -(index + 1), // Negative IDs for transient preset tweaks
                    description: tweak.description,
                    type: tweak.type,
                    code: encode(remoteContent),
                    priority: index,
                    enabled: true,
                    replaces: tweak.replaces,
                };
            }

            const file = luaFiles.find((f) => f.path === tweak.path);
            if (!file) return null;
            return {
                id: -(index + 1), // Negative IDs for transient preset tweaks
                description: tweak.description,
                type: tweak.type,
                code: encode(file.data),
                priority: index,
                enabled: true,
                replaces: tweak.replaces,
            };
        })
        .filter((t): t is EnabledCustomTweak => t !== null);

    // 2. Resolve local/imported presets with base64 codes
    const presetTweakCodes = preset.presetTweakCodes || [];
    const resolvedFromCodes: EnabledCustomTweak[] = presetTweakCodes.map(
        (tweak, index): EnabledCustomTweak => ({
            id: -(resolvedFromPaths.length + index + 1),
            description: tweak.description,
            type: tweak.type,
            code: tweak.code,
            priority: resolvedFromPaths.length + index,
            enabled: true,
            replaces: tweak.replaces,
        })
    );

    return [...resolvedFromPaths, ...resolvedFromCodes];
}
