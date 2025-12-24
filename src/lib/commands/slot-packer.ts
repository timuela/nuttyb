import { encode } from '../base64';
import type { EnabledCustomTweak, SlotUsage } from './custom-tweaks';
import { calculateUsedSlots, findFirstAvailableSlot } from './custom-tweaks';
import {
    MAX_COMMAND_LENGTH,
    MAX_SLOTS_PER_TYPE,
    TARGET_SLOT_SIZE,
} from '../data/configuration-mapping';

/**
 * Result of packing Lua sources into slots with metadata.
 */
export interface SlotPackingResult {
    commands: string[];
    slotUsage: {
        used: number;
        total: number;
    };
}

/**
 * A Lua source with its path and priority for packing.
 */
interface LuaSourceWithMetadata {
    path: string;
    content: string;
    priority: number;
}

/**
 * Result of allocating custom tweak slots.
 */
export interface CustomTweakAllocationResult {
    commands: string[];
    droppedCustomTweaks: EnabledCustomTweak[];
}

/**
 * Allocates slots for custom tweaks and generates !bset commands.
 *
 * Custom tweaks are pre-encoded Base64URL strings, so we just need to
 * find available slots and generate the appropriate commands.
 *
 * @param existingCommands Array of existing !bset commands to analyze for used slots
 * @param customTweaks Optional array of enabled custom tweaks
 * @returns Commands and tweaks that couldn't be allocated
 */
export function allocateCustomTweakSlots(
    existingCommands: string[],
    customTweaks?: EnabledCustomTweak[]
): CustomTweakAllocationResult {
    if (!customTweaks || customTweaks.length === 0) {
        return { commands: [], droppedCustomTweaks: [] };
    }

    // Calculate which slots are already used by standard tweaks
    const slotUsage: SlotUsage = calculateUsedSlots(existingCommands);

    const customCommands: string[] = [];
    const droppedCustomTweaks: EnabledCustomTweak[] = [];

    for (const tweak of customTweaks) {
        const slot = findFirstAvailableSlot(slotUsage, tweak.type);

        if (slot === null) {
            // Collect the tweak instead of console.warn
            droppedCustomTweaks.push(tweak);
            continue;
        }

        // Mark slot as used for subsequent iterations
        slotUsage[tweak.type].add(slot);

        // Generate the !bset command
        // Custom tweaks are already Base64URL encoded
        const slotName = `${tweak.type}${slot}`;
        const command = `!bset ${slotName} ${tweak.code}`;
        customCommands.push(command);
    }

    return { commands: customCommands, droppedCustomTweaks };
}

/**
 * Wraps Lua source in an IIFE (Immediately Invoked Function Expression).
 * Each file runs in its own scope to prevent variable collisions.
 *
 * @param content Lua source code
 * @param path Source file path for debugging comments
 * @returns IIFE-wrapped Lua code
 */
function wrapInIIFE(content: string, path: string): string {
    return `(function()
-- Source: ${path}
${content}
end)()`;
}

/**
 * Groups Lua sources by priority level.
 * Single Responsibility: Only handles grouping logic.
 *
 * @param sources Array of Lua sources with metadata
 * @returns Map of priority -> sources at that priority
 */
function groupByPriority(
    sources: readonly LuaSourceWithMetadata[]
): Map<number, LuaSourceWithMetadata[]> {
    const groups = new Map<number, LuaSourceWithMetadata[]>();

    for (const source of sources) {
        const existing = groups.get(source.priority) ?? [];
        existing.push(source);
        groups.set(source.priority, existing);
    }

    return groups;
}

/**
 * Packs sources within a single priority group using greedy bin-packing.
 * Single Responsibility: Only handles packing logic for one priority level.
 *
 * Strategy: Pack multiple files together up to TARGET_SLOT_SIZE.
 * Priority determines packing order, not whether files can be packed together.
 *
 * @param sources Sources at the same priority level
 * @returns Array of combined IIFE-wrapped slots
 */
function packPriorityGroup(
    sources: readonly LuaSourceWithMetadata[]
): string[] {
    const slots: string[] = [];
    let currentSlot: string[] = [];
    let currentSize = 0;

    for (const source of sources) {
        const wrapped = wrapInIIFE(source.content, source.path);
        const wrappedSize = Buffer.byteLength(wrapped, 'utf8');

        // Estimate Base64 overhead: ~1.37x for actual encoding + padding
        const estimatedEncoded = wrappedSize * 1.4;

        // If adding this source exceeds target, finalize current slot
        if (
            currentSlot.length > 0 &&
            currentSize + estimatedEncoded > TARGET_SLOT_SIZE
        ) {
            slots.push(currentSlot.join('\n\n'));
            currentSlot = [wrapped];
            currentSize = estimatedEncoded;
        } else {
            currentSlot.push(wrapped);
            currentSize += estimatedEncoded;
        }
    }

    // Finalize last slot
    if (currentSlot.length > 0) {
        slots.push(currentSlot.join('\n\n'));
    }

    return slots;
}

/**
 * Packs multiple Lua sources into optimized slots using IIFE wrapping.
 * Single Responsibility: Orchestrates the packing process.
 *
 * This is the main entry point for multi-file IIFE packing. It:
 * 1. Groups sources by priority
 * 2. Packs each priority group
 * 3. Generates !bset commands with validation
 * 4. Returns commands with slot usage metadata
 *
 * @param sources Array of Lua sources with paths and priorities
 * @param slotType Either 'tweakdefs' or 'tweakunits'
 * @returns Commands and slot usage metadata
 * @throws Error if slot limit exceeded or command too large
 */
export function packLuaSourcesIntoSlots(
    sources: readonly LuaSourceWithMetadata[],
    slotType: 'tweakdefs' | 'tweakunits'
): SlotPackingResult {
    if (sources.length === 0) {
        return {
            commands: [],
            slotUsage: {
                used: 0,
                total: MAX_SLOTS_PER_TYPE,
            },
        };
    }

    // Group by priority
    const priorityGroups = groupByPriority(sources);

    // Process each priority group in order (0 -> 99)
    const allSlotContents: string[] = [];
    const priorities = [...priorityGroups.keys()].toSorted((a, b) => a - b);

    for (const priority of priorities) {
        const groupSources = priorityGroups.get(priority)!;
        const packedSlots = packPriorityGroup(groupSources);
        allSlotContents.push(...packedSlots);
    }

    // Check slot limit
    if (allSlotContents.length > MAX_SLOTS_PER_TYPE) {
        throw new Error(
            `Too many ${slotType} slots needed (${allSlotContents.length}). ` +
                `Maximum is ${MAX_SLOTS_PER_TYPE} slots. Please disable some settings to reduce slot usage.`
        );
    }

    // Generate !bset commands
    const commands: string[] = [];

    for (const [slotIndex, slotContent] of allSlotContents.entries()) {
        const encoded = encode(slotContent);
        const slotName = slotIndex === 0 ? slotType : `${slotType}${slotIndex}`;
        const command = `!bset ${slotName} ${encoded}`;

        // Validate command length
        if (command.length > MAX_COMMAND_LENGTH) {
            console.error(
                `CRITICAL: ${slotType} slot ${slotIndex} exceeds MAX_COMMAND_LENGTH!\n` +
                    `Command is ${command.length} chars, limit is ${MAX_COMMAND_LENGTH}.`
            );
            throw new Error(
                `${slotType} slot ${slotIndex} exceeds ${MAX_COMMAND_LENGTH} char limit (${command.length} chars). ` +
                    'Please disable some settings to reduce slot usage.'
            );
        }

        commands.push(command);
    }

    return {
        commands,
        slotUsage: {
            used: commands.length,
            total: MAX_SLOTS_PER_TYPE,
        },
    };
}
