'use client';

import React, { useMemo, useRef, useState } from 'react';

import {
    ActionIcon,
    Button,
    Card,
    Divider,
    Flex,
    Grid,
    Group,
    Modal,
    ScrollArea,
    Select,
    Stack,
    Text,
    Textarea,
    TextInput,
    Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import {
    IconBolt,
    IconDownload,
    IconFileExport,
    IconFileImport,
    IconFlame,
    IconMoodSmile,
    IconPencil,
    IconPlus,
    IconRotateDot,
    IconSparkles,
    IconTrash,
    IconUser,
} from '@tabler/icons-react';

import { useConfiguratorContext } from '@/components/contexts/configurator-context';
import { usePresetsContext } from '@/components/contexts/presets-context';
import {
    Configuration,
    DEFAULT_CONFIGURATION,
} from '@/lib/command-generator/data/configuration';
import type { Preset } from '@/lib/presets/registry';

// Helper to get matching Tabler icon component
function getPresetIcon(iconName: string, size = 28) {
    const props = { size, stroke: 1.5 };
    switch (iconName) {
        case 'IconRotateDot':
            return <IconRotateDot {...props} />;
        case 'IconMoodSmile':
            return <IconMoodSmile {...props} />;
        case 'IconFlame':
            return <IconFlame {...props} />;
        case 'IconBolt':
            return <IconBolt {...props} />;
        case 'IconSparkles':
            return <IconSparkles {...props} />;
        case 'IconDownload':
            return <IconDownload {...props} />;
        default:
            return <IconUser {...props} />;
    }
}

// Set of icons available when saving a local preset
const ICON_OPTIONS = [
    { name: 'IconSparkles', label: 'Sparkles' },
    { name: 'IconFlame', label: 'Flame' },
    { name: 'IconBolt', label: 'Energy/Bolt' },
    { name: 'IconMoodSmile', label: 'Smile' },
    { name: 'IconUser', label: 'User' },
];

const CONFIG_METADATA: Record<
    keyof Configuration,
    { label: string; tooltip: string }
> = {
    presetDifficulty: {
        label: 'Difficulty',
        tooltip: 'Preset base difficulty (Easy, Medium, Hard)',
    },
    lobbyName: {
        label: 'Lobby Name Tag',
        tooltip: 'Added to auto-generated lobby name',
    },
    gameMap: {
        label: 'Map',
        tooltip: 'Selected game map',
    },
    start: {
        label: 'Start',
        tooltip:
            'Starting conditions. "No rush" provides a 12-minute grace period.',
    },
    queenCount: {
        label: 'Raptor Queen Count',
        tooltip: 'Number of raptor queens (1 - 100)',
    },
    incomeMult: {
        label: 'Resource Income Multiplier',
        tooltip: 'Affects both energy and metal production (0.1 - 10)',
    },
    buildPowerMult: {
        label: 'Build Power Multiplier',
        tooltip: 'Affects build power (0.1 - 10)',
    },
    buildDistMult: {
        label: 'Build Distance Multiplier',
        tooltip:
            'Defines how far you can build compared to vanilla BAR (0.5 - 10)',
    },
    challenges: {
        label: 'Challenges',
        tooltip: 'Special waves and bosses challenges',
    },
    isEcoT4: {
        label: 'T4 Economy',
        tooltip: 'Legendary fusion reactors and energy converters',
    },
    isRFLRPCRebalance: {
        label: 'RFLRPC Rebalance',
        tooltip: 'Rebalance for Ragnarok, Calamity and Starfall',
    },
    isRFLRPCT4: {
        label: 'Epic RFLRPC',
        tooltip: 'Epic Ragnarok, Calamity and Starfall',
    },
    isMegaNuke: {
        label: 'Mega Nuke',
        tooltip: 'Enable Mega Nuke capability',
    },
};

const PresetTooltipContent: React.FC<{ preset: Preset }> = ({ preset }) => {
    // Diff against default configuration
    const overrides = useMemo(() => {
        const diffs: Array<{ label: string; value: string; tooltip: string }> =
            [];
        const defaultKeys = Object.keys(DEFAULT_CONFIGURATION) as Array<
            keyof typeof DEFAULT_CONFIGURATION
        >;
        for (const key of defaultKeys) {
            if (preset.configuration[key] !== DEFAULT_CONFIGURATION[key]) {
                const meta = CONFIG_METADATA[key];
                if (meta) {
                    let valDisplay = String(preset.configuration[key]);
                    if (typeof preset.configuration[key] === 'boolean') {
                        valDisplay = preset.configuration[key]
                            ? 'Enabled'
                            : 'Disabled';
                    }
                    diffs.push({
                        label: meta.label,
                        value: valDisplay,
                        tooltip: meta.tooltip,
                    });
                }
            }
        }
        return diffs;
    }, [preset.configuration]);

    return (
        <Stack gap={6}>
            <div>
                <Text size='sm' fw={700} c='yellow.4'>
                    {preset.name}
                </Text>
                {preset.description && (
                    <Text size='xs' c='dimmed' mt={2}>
                        {preset.description}
                    </Text>
                )}
            </div>
            {overrides.length > 0 && (
                <>
                    <Divider size='xs' color='dark.4' />
                    <Stack gap={4}>
                        <Text
                            size='10px'
                            fw={600}
                            c='dimmed'
                            style={{
                                letterSpacing: '0.5px',
                                textTransform: 'uppercase',
                            }}
                        >
                            Settings:
                        </Text>
                        {overrides.map((o) => (
                            <div key={o.label}>
                                <Group
                                    justify='space-between'
                                    gap='xs'
                                    wrap='nowrap'
                                >
                                    <Text
                                        size='xs'
                                        fw={600}
                                        style={{ whiteSpace: 'nowrap' }}
                                    >
                                        {o.label}
                                    </Text>
                                    <Text size='xs' fw={700} c='yellow.4'>
                                        {o.value}
                                    </Text>
                                </Group>
                                <Text
                                    size='10px'
                                    c='dimmed'
                                    style={{ lineHeight: 1.2 }}
                                >
                                    {o.tooltip}
                                </Text>
                            </div>
                        ))}
                    </Stack>
                </>
            )}
            {preset.presetTweaks && preset.presetTweaks.length > 0 && (
                <>
                    <Divider size='xs' color='dark.4' />
                    <Stack gap={2}>
                        <Text
                            size='10px'
                            fw={600}
                            c='dimmed'
                            style={{
                                letterSpacing: '0.5px',
                                textTransform: 'uppercase',
                            }}
                        >
                            Custom Tweaks:
                        </Text>
                        {preset.presetTweaks.map((t, idx) => (
                            <Text key={idx} size='xs' truncate>
                                • {t.description || t.path.split('/').pop()}
                            </Text>
                        ))}
                    </Stack>
                </>
            )}
        </Stack>
    );
};

export const PresetShowcase: React.FC = () => {
    const {
        activePresetId,
        builtInPresets,
        localPresets,
        isModified,
        selectPreset,
        deleteLocalPreset,
        exportPreset,
        savePreset,
    } = usePresetsContext();

    const { configuration } = useConfiguratorContext();

    const [isNewModalOpen, { open: openNewModal, close: closeNewModal }] =
        useDisclosure(false);
    const [editingPresetId, setEditingPresetId] = useState<string | null>(null);
    const [presetName, setPresetName] = useState('');
    const [presetDescription, setPresetDescription] = useState('');
    const [selectedIcon, setSelectedIcon] = useState('IconSparkles');
    const [presetConfiguration, setPresetConfiguration] =
        useState<Configuration | null>(null);
    const [presetTweaks, setPresetTweaks] = useState<
        Array<{
            id: string;
            description: string;
            type: 'tweakdefs' | 'tweakunits';
            path: string;
            replaces: string;
        }>
    >([]);
    const [importError, setImportError] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Combine built-in presets and local user presets
    const allPresets = useMemo<Preset[]>(
        () => [
            ...builtInPresets.map((p) => ({ ...p, isBuiltIn: true })),
            ...localPresets.map((p) => ({ ...p, isBuiltIn: false })),
        ],
        [builtInPresets, localPresets]
    );

    const configDiff = useMemo(() => {
        const configToCompare = presetConfiguration || configuration;
        if (!configToCompare) return [];
        const diffs: Array<{ label: string; value: string }> = [];
        const defaultKeys = Object.keys(DEFAULT_CONFIGURATION) as Array<
            keyof typeof DEFAULT_CONFIGURATION
        >;
        for (const key of defaultKeys) {
            if (configToCompare[key] !== DEFAULT_CONFIGURATION[key]) {
                let label = key.replaceAll(/([A-Z])/g, ' $1');
                label = label.charAt(0).toUpperCase() + label.slice(1);
                diffs.push({ label, value: String(configToCompare[key]) });
            }
        }
        return diffs;
    }, [presetConfiguration, configuration]);

    const handleOpenModal = () => {
        setEditingPresetId(null);
        setPresetName('');
        setPresetDescription('');
        setSelectedIcon('IconSparkles');
        setPresetConfiguration({ ...configuration });
        setPresetTweaks([]);
        setImportError(null);
        openNewModal();
    };

    const handleEditClick = (preset: Preset) => {
        setEditingPresetId(preset.id);
        setPresetName(preset.name);
        setPresetDescription(preset.description || '');
        setSelectedIcon(preset.icon || 'IconSparkles');
        // If this is the active preset, load the current configuration to include any edits
        const isActive = activePresetId === preset.id;
        setPresetConfiguration(
            isActive ? { ...configuration } : { ...preset.configuration }
        );
        setImportError(null);

        const tweaks = preset.presetTweaks || [];
        setPresetTweaks(
            tweaks.map((t, index: number) => {
                let replacesStr = '';
                if (t.replaces) {
                    replacesStr = Array.isArray(t.replaces)
                        ? t.replaces.join(', ')
                        : t.replaces;
                }
                return {
                    id: `tweak-${Date.now()}-${index}-${Math.random()}`,
                    description: t.description || '',
                    type: t.type === 'tweakunits' ? 'tweakunits' : 'tweakdefs',
                    path: t.path || '',
                    replaces: replacesStr,
                };
            })
        );

        openNewModal();
    };

    const handleSave = () => {
        if (!presetName.trim()) return;

        const formattedPresetTweaks = presetTweaks
            .filter((t) => t.path.trim())
            .map((t) => {
                const replacesStr = t.replaces.trim();
                let replaces: string | string[] | undefined;
                if (replacesStr) {
                    replaces = replacesStr.includes(',')
                        ? replacesStr
                              .split(',')
                              .map((s) => s.trim())
                              .filter(Boolean)
                        : replacesStr;
                }
                return {
                    description: t.description.trim(),
                    type: t.type,
                    path: t.path.trim(),
                    ...(replaces ? { replaces } : {}),
                };
            });

        savePreset(
            {
                name: presetName.trim(),
                description: presetDescription.trim() || 'Custom user preset.',
                icon: selectedIcon,
                configuration: presetConfiguration || { ...configuration },
                presetTweaks: formattedPresetTweaks,
            },
            editingPresetId || undefined
        );

        closeNewModal();
    };

    const handleImportClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        file.text()
            .then((content) => {
                try {
                    const parsed = JSON.parse(content) as Partial<Preset>;
                    if (!parsed.name || typeof parsed.name !== 'string') {
                        setImportError(
                            'Invalid preset: Missing or invalid preset name.'
                        );
                        return;
                    }

                    setPresetName(parsed.name || '');
                    setPresetDescription(parsed.description || '');
                    setSelectedIcon(parsed.icon || 'IconSparkles');

                    if (
                        parsed.configuration &&
                        typeof parsed.configuration === 'object'
                    ) {
                        setPresetConfiguration({
                            ...configuration,
                            ...parsed.configuration,
                        });
                    }

                    const tweaks = parsed.presetTweaks || [];
                    if (Array.isArray(tweaks)) {
                        setPresetTweaks(
                            tweaks.map((t, index: number) => {
                                let replacesStr = '';
                                if (t.replaces) {
                                    if (Array.isArray(t.replaces)) {
                                        replacesStr = t.replaces
                                            .map(String)
                                            .join(', ');
                                    } else if (typeof t.replaces === 'string') {
                                        replacesStr = t.replaces;
                                    }
                                }
                                return {
                                    id: `tweak-${Date.now()}-${index}-${Math.random()}`,
                                    description: t.description || '',
                                    type:
                                        t.type === 'tweakunits'
                                            ? 'tweakunits'
                                            : 'tweakdefs',
                                    path: t.path || '',
                                    replaces: replacesStr,
                                };
                            })
                        );
                    }
                    setImportError(null);
                } catch {
                    setImportError('Failed to parse JSON file.');
                }
            })
            .catch(() => {
                setImportError('Failed to read file content.');
            });

        event.target.value = '';
    };

    const handleAddTweak = () => {
        setPresetTweaks((prev) => [
            ...prev,
            {
                id: `tweak-${Date.now()}-${Math.random()}`,
                description: '',
                type: 'tweakdefs',
                path: '',
                replaces: '',
            },
        ]);
    };

    const handleRemoveTweak = (id: string) => {
        setPresetTweaks((prev) => prev.filter((t) => t.id !== id));
    };

    const handleTweakChange = (
        id: string,
        field: 'description' | 'type' | 'path' | 'replaces',
        value: string
    ) => {
        setPresetTweaks((prev) =>
            prev.map((t) => {
                if (t.id !== id) return t;
                if (field === 'type') {
                    return {
                        ...t,
                        type: value as 'tweakdefs' | 'tweakunits',
                    };
                }
                return { ...t, [field]: value };
            })
        );
    };

    return (
        <Stack gap='sm' style={{ position: 'relative' }}>
            <Flex justify='space-between' align='center' wrap='wrap' gap='sm'>
                <Stack gap={0}>
                    <Text
                        size='sm'
                        fw={600}
                        c='dimmed'
                        style={{
                            letterSpacing: '0.5px',
                            textTransform: 'uppercase',
                        }}
                    >
                        Preset Showcase
                    </Text>
                    <Text size='xs' c='dimmed'>
                        Select a configuration preset, upload presets, or save
                        your current settings.
                    </Text>
                </Stack>

                <Group gap='xs'>
                    <Button
                        size='xs'
                        variant='light'
                        color='green'
                        leftSection={<IconPlus size={16} />}
                        onClick={handleOpenModal}
                    >
                        New Preset
                    </Button>
                    <input
                        type='file'
                        ref={fileInputRef}
                        style={{ display: 'none' }}
                        accept='.json'
                        onChange={handleFileChange}
                    />
                </Group>
            </Flex>

            {importError && (
                <Text size='xs' c='red'>
                    Import Error: {importError}
                </Text>
            )}

            <ScrollArea scrollbars='x' type='hover' pb='xs'>
                <Flex gap='md' wrap='nowrap' py='xs'>
                    {allPresets.map((preset) => {
                        const isActive = activePresetId === preset.id;
                        const showModified = isActive && isModified;

                        return (
                            <Card
                                key={preset.id}
                                shadow='md'
                                radius='md'
                                p='xs'
                                w={160}
                                h={125}
                                style={{
                                    flexShrink: 0,
                                    cursor: 'pointer',
                                    border: isActive
                                        ? '2px solid var(--mantine-color-yellow-5)'
                                        : '1px solid var(--mantine-color-dark-4)',
                                    backgroundColor: isActive
                                        ? 'var(--mantine-color-dark-6)'
                                        : 'var(--mantine-color-dark-8)',
                                    transition:
                                        'transform 0.2s ease, border-color 0.2s ease',
                                    display: 'flex',
                                    flexDirection: 'column',
                                }}
                                onClick={() => selectPreset(preset.id)}
                                className='preset-card'
                            >
                                {/* Top action bar row */}
                                <Group
                                    gap={2}
                                    justify='flex-end'
                                    h={22}
                                    style={{ width: '100%' }}
                                    onClick={(e) => e.stopPropagation()} // Prevent card selection on action click
                                >
                                    {!preset.isBuiltIn && (
                                        <>
                                            <Tooltip label='Edit Preset'>
                                                <ActionIcon
                                                    size='sm'
                                                    variant='subtle'
                                                    color='yellow'
                                                    onClick={() =>
                                                        handleEditClick(preset)
                                                    }
                                                >
                                                    <IconPencil size={12} />
                                                </ActionIcon>
                                            </Tooltip>
                                            <Tooltip label='Export Preset JSON'>
                                                <ActionIcon
                                                    size='sm'
                                                    variant='subtle'
                                                    color='blue'
                                                    onClick={() =>
                                                        exportPreset(preset.id)
                                                    }
                                                >
                                                    <IconFileExport size={12} />
                                                </ActionIcon>
                                            </Tooltip>
                                            <Tooltip label='Delete Preset'>
                                                <ActionIcon
                                                    size='sm'
                                                    variant='subtle'
                                                    color='red'
                                                    onClick={() =>
                                                        deleteLocalPreset(
                                                            preset.id
                                                        )
                                                    }
                                                >
                                                    <IconTrash size={12} />
                                                </ActionIcon>
                                            </Tooltip>
                                        </>
                                    )}
                                    {preset.isBuiltIn && (
                                        <Tooltip label='Export Preset JSON'>
                                            <ActionIcon
                                                size='sm'
                                                variant='subtle'
                                                color='blue'
                                                onClick={() =>
                                                    exportPreset(preset.id)
                                                }
                                            >
                                                <IconFileExport size={12} />
                                            </ActionIcon>
                                        </Tooltip>
                                    )}
                                </Group>

                                <Tooltip
                                    label={
                                        <PresetTooltipContent preset={preset} />
                                    }
                                    multiline
                                    w={280}
                                    withArrow
                                    transitionProps={{
                                        transition: 'pop',
                                        duration: 150,
                                    }}
                                    bg='var(--mantine-color-dark-8)'
                                    c='var(--mantine-color-dark-0)'
                                    bd='1px solid var(--mantine-primary-color-filled)'
                                    radius='md'
                                    p='xs'
                                    position='bottom'
                                    openDelay={300}
                                >
                                    <Flex
                                        direction='column'
                                        align='center'
                                        justify='center'
                                        style={{ flex: 1, marginTop: -2 }}
                                        gap='xs'
                                    >
                                        <div
                                            style={{
                                                color: isActive
                                                    ? 'var(--mantine-color-yellow-4)'
                                                    : 'var(--mantine-color-dark-2)',
                                            }}
                                        >
                                            {getPresetIcon(preset.icon, 24)}
                                        </div>
                                        <Text
                                            size='xs'
                                            fw={isActive ? 700 : 500}
                                            ta='center'
                                            c={isActive ? 'yellow.4' : 'white'}
                                            style={{
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis',
                                                width: '100%',
                                            }}
                                        >
                                            {preset.name}
                                            {showModified && ' *'}
                                        </Text>

                                        {preset.description && (
                                            <Text
                                                size='10px'
                                                c='dimmed'
                                                ta='center'
                                                style={{
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    width: '100%',
                                                }}
                                            >
                                                {preset.description}
                                            </Text>
                                        )}
                                    </Flex>
                                </Tooltip>
                            </Card>
                        );
                    })}
                </Flex>
            </ScrollArea>

            {/* Create New Preset Dialog */}
            <Modal
                opened={isNewModalOpen}
                onClose={closeNewModal}
                title={editingPresetId ? 'Edit Preset' : 'Create New Preset'}
                size='lg'
                centered
            >
                <Stack gap='md'>
                    {/* Top JSON Import Option */}
                    <Button
                        size='sm'
                        variant='outline'
                        color='blue'
                        leftSection={<IconFileImport size={16} />}
                        onClick={handleImportClick}
                        fullWidth
                    >
                        Import Preset from JSON File
                    </Button>

                    {importError && (
                        <Text size='xs' c='red' fw={500}>
                            Import Error: {importError}
                        </Text>
                    )}

                    <Divider
                        label='Preset Configuration Details'
                        labelPosition='center'
                    />

                    <TextInput
                        label='Preset Name'
                        placeholder="e.g. Pyrem's Preset"
                        value={presetName}
                        onChange={(e) => setPresetName(e.currentTarget.value)}
                        required
                        data-autofocus
                    />

                    <Textarea
                        label='Description'
                        placeholder='Provide a brief description of the preset...'
                        value={presetDescription}
                        onChange={(e) =>
                            setPresetDescription(e.currentTarget.value)
                        }
                        rows={2}
                    />

                    <Stack gap='xs'>
                        <Text size='sm' fw={500}>
                            Select Icon
                        </Text>
                        <Group gap='sm'>
                            {ICON_OPTIONS.map((opt) => (
                                <Tooltip label={opt.label} key={opt.name}>
                                    <ActionIcon
                                        size='xl'
                                        variant={
                                            selectedIcon === opt.name
                                                ? 'filled'
                                                : 'outline'
                                        }
                                        color={
                                            selectedIcon === opt.name
                                                ? 'yellow'
                                                : 'gray'
                                        }
                                        onClick={() =>
                                            setSelectedIcon(opt.name)
                                        }
                                    >
                                        {getPresetIcon(opt.name, 22)}
                                    </ActionIcon>
                                </Tooltip>
                            ))}
                        </Group>
                    </Stack>

                    {configDiff.length > 0 && (
                        <Stack gap='xs'>
                            <Text size='xs' fw={600} c='dimmed'>
                                ACTIVE CONFIGURATION OVERRIDES:
                            </Text>
                            <Flex gap='xs' wrap='wrap'>
                                {configDiff.map((diff) => (
                                    <Card
                                        key={diff.label}
                                        py='4px'
                                        px='8px'
                                        radius='sm'
                                        bg='dark.6'
                                        style={{
                                            border: '1px solid var(--mantine-color-dark-4)',
                                            fontSize: '11px',
                                        }}
                                    >
                                        <Text
                                            size='xs'
                                            span
                                            fw={600}
                                            c='yellow.4'
                                        >
                                            {diff.label}:{' '}
                                        </Text>
                                        <Text size='xs' span c='white'>
                                            {diff.value}
                                        </Text>
                                    </Card>
                                ))}
                            </Flex>
                        </Stack>
                    )}

                    <Divider
                        label='Preset Tweaks (Optional)'
                        labelPosition='center'
                    />

                    <Text size='xs' c='dimmed' style={{ marginTop: -5 }}>
                        Add custom Lua scripts to load from a path or URL when
                        this preset is active.
                    </Text>

                    {presetTweaks.length > 0 && (
                        <ScrollArea.Autosize
                            mah={300}
                            type='hover'
                            offsetScrollbars
                        >
                            <Stack gap='xs'>
                                {presetTweaks.map((tweak) => (
                                    <Card
                                        key={tweak.id}
                                        p='xs'
                                        radius='sm'
                                        bg='dark.7'
                                        style={{
                                            border: '1px solid var(--mantine-color-dark-5)',
                                        }}
                                    >
                                        <Grid gutter='xs' align='flex-end'>
                                            <Grid.Col
                                                span={{ base: 12, sm: 6 }}
                                            >
                                                <TextInput
                                                    label='Tweak Description'
                                                    placeholder='e.g. Cross Faction T2'
                                                    value={tweak.description}
                                                    onChange={(e) =>
                                                        handleTweakChange(
                                                            tweak.id,
                                                            'description',
                                                            e.currentTarget
                                                                .value
                                                        )
                                                    }
                                                    size='xs'
                                                />
                                            </Grid.Col>
                                            <Grid.Col
                                                span={{ base: 10, sm: 5 }}
                                            >
                                                <Select
                                                    label='Tweak Type'
                                                    data={[
                                                        {
                                                            value: 'tweakdefs',
                                                            label: 'Tweakdefs (Logic)',
                                                        },
                                                        {
                                                            value: 'tweakunits',
                                                            label: 'Tweakunits (Properties)',
                                                        },
                                                    ]}
                                                    value={tweak.type}
                                                    onChange={(val) =>
                                                        handleTweakChange(
                                                            tweak.id,
                                                            'type',
                                                            val || 'tweakdefs'
                                                        )
                                                    }
                                                    size='xs'
                                                />
                                            </Grid.Col>
                                            <Grid.Col
                                                span={{ base: 2, sm: 1 }}
                                                style={{
                                                    display: 'flex',
                                                    justifyContent: 'center',
                                                    paddingBottom: '4px',
                                                }}
                                            >
                                                <ActionIcon
                                                    color='red'
                                                    variant='subtle'
                                                    onClick={() =>
                                                        handleRemoveTweak(
                                                            tweak.id
                                                        )
                                                    }
                                                    size='md'
                                                >
                                                    <IconTrash size={16} />
                                                </ActionIcon>
                                            </Grid.Col>
                                            <Grid.Col
                                                span={{ base: 12, sm: 7 }}
                                            >
                                                <TextInput
                                                    label='Path or Web URL'
                                                    placeholder='e.g. https://.../tweak.lua'
                                                    value={tweak.path}
                                                    onChange={(e) =>
                                                        handleTweakChange(
                                                            tweak.id,
                                                            'path',
                                                            e.currentTarget
                                                                .value
                                                        )
                                                    }
                                                    size='xs'
                                                    required
                                                />
                                            </Grid.Col>
                                            <Grid.Col
                                                span={{ base: 12, sm: 5 }}
                                            >
                                                <TextInput
                                                    label='Replaces (Optional)'
                                                    placeholder='e.g. lua/eco-t3.lua'
                                                    value={tweak.replaces}
                                                    onChange={(e) =>
                                                        handleTweakChange(
                                                            tweak.id,
                                                            'replaces',
                                                            e.currentTarget
                                                                .value
                                                        )
                                                    }
                                                    size='xs'
                                                />
                                            </Grid.Col>
                                        </Grid>
                                    </Card>
                                ))}
                            </Stack>
                        </ScrollArea.Autosize>
                    )}

                    <Button
                        size='xs'
                        variant='light'
                        color='gray'
                        leftSection={<IconPlus size={14} />}
                        onClick={handleAddTweak}
                        fullWidth
                    >
                        Add Custom Tweak Row
                    </Button>

                    <Group justify='flex-end' mt='md'>
                        <Button
                            variant='subtle'
                            color='gray'
                            onClick={closeNewModal}
                        >
                            Cancel
                        </Button>
                        <Button
                            color='yellow'
                            onClick={handleSave}
                            disabled={!presetName.trim()}
                        >
                            {editingPresetId ? 'Save Changes' : 'Create Preset'}
                        </Button>
                    </Group>
                </Stack>
            </Modal>
        </Stack>
    );
};

// Add standard scale-up animation on hover
if (typeof document !== 'undefined') {
    const style = document.createElement('style');
    style.innerHTML = `
        .preset-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4) !important;
        }
    `;
    document.head.append(style);
}
