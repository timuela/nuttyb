'use client';

import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';

import { useConfiguratorContext } from '@/components/contexts/configurator-context';
import { useCustomTweaksContext } from '@/components/contexts/custom-tweaks-context';
import { useLuaBundleContext } from '@/components/contexts/lua-bundle-context';
import { useLocalStorage } from '@/hooks/use-local-storage';
import type { EnabledCustomTweak } from '@/lib/command-generator/command-generator';
import { DEFAULT_CONFIGURATION } from '@/lib/command-generator/data/configuration';
import {
    ACTIVE_PRESET_ID_STORAGE_KEY,
    LOCAL_PRESETS_STORAGE_KEY,
} from '@/lib/configuration-storage/keys';
import { Preset } from '@/lib/presets/registry';
import { resolvePresetTweaks } from '@/lib/presets/resolver';

interface PresetsContextValue {
    activePresetId: string | null;
    activePresetTweaks: EnabledCustomTweak[];
    builtInPresets: Preset[];
    localPresets: Preset[];
    isModified: boolean;
    selectPreset: (id: string) => void;
    saveCurrentAsPreset: (name: string, icon?: string) => void;
    savePreset: (
        presetData: Omit<Preset, 'id' | 'isBuiltIn'>,
        id?: string
    ) => void;
    deleteLocalPreset: (id: string) => void;
    importPreset: (jsonContent: string) => { success: boolean; error?: string };
    exportPreset: (id: string) => void;
    clearActivePreset: () => void;
}

const PresetsContext = createContext<PresetsContextValue | undefined>(
    undefined
);

export function usePresetsContext() {
    const context = useContext(PresetsContext);
    if (!context) {
        throw new Error(
            'usePresetsContext must be used within a PresetsProvider'
        );
    }
    return context;
}

export function PresetsProvider({ children }: { children: React.ReactNode }) {
    const { configuration, setProperty } = useConfiguratorContext();
    const { getEnabledTweaks } = useCustomTweaksContext();
    const { luaFiles } = useLuaBundleContext();

    const [activePresetId, setActivePresetId] = useLocalStorage<string | null>(
        ACTIVE_PRESET_ID_STORAGE_KEY,
        'default'
    );
    const [localPresets, setLocalPresets] = useLocalStorage<Preset[]>(
        LOCAL_PRESETS_STORAGE_KEY,
        []
    );

    // Combine hardcoded base presets and dynamically loaded presets from the bundle
    const builtInPresets = useMemo<Preset[]>(() => {
        const dynamicPresets: Preset[] = [];
        for (const file of luaFiles) {
            // Check if file is a config.json inside a preset folder
            // e.g. lua/presets/example/config.json
            const match = file.path.match(
                /^lua\/presets\/([^/]+)\/config\.json$/
            );
            if (match) {
                try {
                    const parsed = JSON.parse(file.data) as Partial<Preset>;
                    if (parsed.name && parsed.configuration) {
                        dynamicPresets.push({
                            id: parsed.id || match[1], // fallback to folder name as id
                            name: parsed.name,
                            description: parsed.description || '',
                            icon: parsed.icon || 'IconSparkles',
                            configuration: {
                                ...DEFAULT_CONFIGURATION,
                                ...parsed.configuration,
                            },
                            presetTweaks: parsed.presetTweaks || [],
                            presetTweakCodes: parsed.presetTweakCodes || [],
                            isBuiltIn: true,
                        });
                    }
                } catch (error) {
                    // eslint-disable-next-line no-console
                    console.error(
                        `Failed to parse preset config from ${file.path}:`,
                        error
                    );
                }
            }
        }
        // Sort dynamic presets so 'default' is always first, then casual, hardcore, etc.
        const order = ['default', 'casual', 'hardcore'];
        dynamicPresets.sort((a, b) => {
            const indexA = order.indexOf(a.id);
            const indexB = order.indexOf(b.id);
            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
            return a.name.localeCompare(b.name);
        });
        return dynamicPresets;
    }, [luaFiles]);

    // Get the active preset details
    const activePreset = useMemo<Preset | null>(() => {
        if (!activePresetId) return null;
        return (
            builtInPresets.find((p) => p.id === activePresetId) ||
            localPresets.find((p) => p.id === activePresetId) ||
            null
        );
    }, [activePresetId, builtInPresets, localPresets]);

    const [remoteFiles, setRemoteFiles] = useState<Record<string, string>>({});
    const fetchedUrlsRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        if (!activePreset) return;

        const tweaks = activePreset.presetTweaks || [];
        const remoteUrls = tweaks
            .map((t) => t.path)
            .filter(
                (path) =>
                    path.startsWith('http://') || path.startsWith('https://')
            );

        for (const url of remoteUrls) {
            if (fetchedUrlsRef.current.has(url)) continue;
            fetchedUrlsRef.current.add(url);

            void fetch(url)
                .then((res) => {
                    if (!res.ok)
                        throw new Error(`HTTP error! status: ${res.status}`);
                    return res.text();
                })
                .then((text) => {
                    setRemoteFiles((prev) => ({ ...prev, [url]: text }));
                })
                .catch((error) => {
                    fetchedUrlsRef.current.delete(url);
                    // eslint-disable-next-line no-console
                    console.error(
                        `Failed to fetch remote preset tweak from ${url}:`,
                        error
                    );
                });
        }
    }, [activePreset]);

    // Check if configuration differs from active preset configuration
    const isModified = useMemo(() => {
        if (!activePreset) return false;
        // Compare only configuration keys
        const presetConfig = activePreset.configuration;
        for (const key of Object.keys(presetConfig) as Array<
            keyof typeof presetConfig
        >) {
            if (configuration[key] !== presetConfig[key]) {
                return true;
            }
        }
        return false;
    }, [activePreset, configuration]);

    // Automatically save configuration changes to custom presets
    useEffect(() => {
        if (
            !activePresetId ||
            activePresetId === 'default' ||
            builtInPresets.some((p) => p.id === activePresetId)
        ) {
            return;
        }

        setLocalPresets((prev) => {
            const currentLocal = prev.find((p) => p.id === activePresetId);
            if (!currentLocal) return prev;

            let changed = false;
            const configKeys = Object.keys(configuration) as Array<
                keyof typeof configuration
            >;
            for (const key of configKeys) {
                if (currentLocal.configuration[key] !== configuration[key]) {
                    changed = true;
                    break;
                }
            }

            if (!changed) return prev;

            return prev.map((p) =>
                p.id === activePresetId
                    ? {
                          ...p,
                          configuration: { ...configuration },
                      }
                    : p
            );
        });
    }, [configuration, activePresetId, setLocalPresets, builtInPresets]);

    // Resolve active preset tweaks from file paths and inline codes
    const activePresetTweaks = useMemo<EnabledCustomTweak[]>(() => {
        if (!activePreset) return [];
        return resolvePresetTweaks(activePreset, luaFiles, remoteFiles);
    }, [activePreset, luaFiles, remoteFiles]);

    const selectPreset = useCallback(
        (id: string) => {
            const preset =
                builtInPresets.find((p) => p.id === id) ||
                localPresets.find((p) => p.id === id);

            if (!preset) return;

            // Set all configuration values in a type-safe manner
            const configKeys = Object.keys(preset.configuration) as Array<
                keyof typeof preset.configuration
            >;
            for (const key of configKeys) {
                const value = preset.configuration[key];
                setProperty(key, value);
            }

            setActivePresetId(id);
        },
        [builtInPresets, localPresets, setProperty, setActivePresetId]
    );

    const savePreset = useCallback(
        (presetData: Omit<Preset, 'id' | 'isBuiltIn'>, id?: string) => {
            if (id) {
                setLocalPresets((prev) =>
                    prev.map((p) =>
                        p.id === id
                            ? {
                                  ...p,
                                  name: presetData.name.trim(),
                                  description: presetData.description || '',
                                  icon: presetData.icon || 'IconSparkles',
                                  configuration: {
                                      ...presetData.configuration,
                                  },
                                  presetTweaks: presetData.presetTweaks || [],
                                  presetTweakCodes:
                                      presetData.presetTweakCodes || [],
                              }
                            : p
                    )
                );

                // Apply configuration settings to current context
                const configKeys = Object.keys(
                    presetData.configuration
                ) as Array<keyof typeof presetData.configuration>;
                for (const key of configKeys) {
                    const value = presetData.configuration[key];
                    setProperty(key, value);
                }
            } else {
                const newPreset: Preset = {
                    id: `local-${Date.now()}`,
                    name: presetData.name.trim(),
                    description: presetData.description || '',
                    icon: presetData.icon || 'IconSparkles',
                    configuration: { ...presetData.configuration },
                    presetTweaks: presetData.presetTweaks || [],
                    presetTweakCodes: presetData.presetTweakCodes || [],
                };

                setLocalPresets((prev) => [...prev, newPreset]);
                setActivePresetId(newPreset.id);

                // Apply configuration settings to current context
                const configKeys = Object.keys(
                    newPreset.configuration
                ) as Array<keyof typeof newPreset.configuration>;
                for (const key of configKeys) {
                    const value = newPreset.configuration[key];
                    setProperty(key, value);
                }
            }
        },
        [setProperty, setLocalPresets, setActivePresetId]
    );

    const saveCurrentAsPreset = useCallback(
        (name: string, icon = 'IconUser') => {
            const enabledUserTweaks = getEnabledTweaks().filter(
                (t) => t.id > 0
            );
            const presetTweakCodes = enabledUserTweaks.map((t) => ({
                description: t.description,
                type: t.type,
                code: t.code,
            }));

            savePreset({
                name,
                description: 'Custom user-saved preset.',
                icon,
                configuration: { ...configuration },
                presetTweakCodes,
            });
        },
        [configuration, getEnabledTweaks, savePreset]
    );

    const deleteLocalPreset = useCallback(
        (id: string) => {
            setLocalPresets((prev) => prev.filter((p) => p.id !== id));
            if (activePresetId === id) {
                setActivePresetId('default');
            }
        },
        [activePresetId, setLocalPresets, setActivePresetId]
    );

    const importPreset = useCallback(
        (jsonContent: string) => {
            try {
                const parsed = JSON.parse(jsonContent) as Partial<Preset>;
                if (!parsed.name || typeof parsed.name !== 'string') {
                    return {
                        success: false,
                        error: 'Missing or invalid preset name.',
                    };
                }
                if (
                    !parsed.configuration ||
                    typeof parsed.configuration !== 'object'
                ) {
                    return {
                        success: false,
                        error: 'Missing or invalid configuration.',
                    };
                }

                // Clean/Merge with default configuration to ensure all fields are valid
                const cleanConfig = {
                    ...parsed.configuration,
                };

                const newPreset: Preset = {
                    id: `local-${Date.now()}`,
                    name: parsed.name.trim(),
                    description:
                        parsed.description || 'Imported custom preset.',
                    icon: parsed.icon || 'IconDownload',
                    configuration: cleanConfig,
                    presetTweaks: parsed.presetTweaks || [],
                    presetTweakCodes: parsed.presetTweakCodes || [],
                };

                setLocalPresets((prev) => [...prev, newPreset]);
                setActivePresetId(newPreset.id);

                // Apply configuration settings
                const configKeys = Object.keys(cleanConfig) as Array<
                    keyof typeof cleanConfig
                >;
                for (const key of configKeys) {
                    const value = cleanConfig[key];
                    setProperty(key, value);
                }

                return { success: true };
            } catch (error) {
                return {
                    success: false,
                    error:
                        error instanceof Error
                            ? error.message
                            : 'Invalid JSON format.',
                };
            }
        },
        [setLocalPresets, setProperty, setActivePresetId]
    );

    const exportPreset = useCallback(
        (id: string) => {
            const preset =
                builtInPresets.find((p) => p.id === id) ||
                localPresets.find((p) => p.id === id);

            if (!preset) return;

            // Prepare export data including both presetTweaks and presetTweakCodes
            const exportData = {
                version: 1,
                name: preset.name,
                description: preset.description,
                icon: preset.icon,
                configuration: preset.configuration,
                presetTweaks: preset.presetTweaks || [],
                presetTweakCodes: preset.presetTweakCodes || [],
            };

            const dataStr =
                'data:text/json;charset=utf-8,' +
                encodeURIComponent(JSON.stringify(exportData, null, 2));
            const downloadAnchor = document.createElement('a');
            downloadAnchor.setAttribute('href', dataStr);
            downloadAnchor.setAttribute(
                'download',
                `${preset.name.toLowerCase().replaceAll(/[^a-z0-9]/g, '_')}_preset.json`
            );
            document.body.append(downloadAnchor);
            downloadAnchor.click();
            downloadAnchor.remove();
        },
        [builtInPresets, localPresets]
    );

    const clearActivePreset = useCallback(() => {
        setActivePresetId(null);
    }, [setActivePresetId]);

    const value = useMemo(
        () => ({
            activePresetId,
            activePresetTweaks,
            builtInPresets,
            localPresets,
            isModified,
            selectPreset,
            saveCurrentAsPreset,
            deleteLocalPreset,
            importPreset,
            exportPreset,
            clearActivePreset,
            savePreset,
        }),
        [
            activePresetId,
            activePresetTweaks,
            builtInPresets,
            localPresets,
            isModified,
            selectPreset,
            saveCurrentAsPreset,
            deleteLocalPreset,
            importPreset,
            exportPreset,
            clearActivePreset,
            savePreset,
        ]
    );

    return (
        <PresetsContext.Provider value={value}>
            {children}
        </PresetsContext.Provider>
    );
}
