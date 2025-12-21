/**
 * Template interpolation system for Lua files.
 *
 * Supports extended reference syntax: ~lua/file.lua{VAR1=value1,VAR2=value2}
 * Replaces $VARIABLE_NAME$ placeholders in templates with actual values.
 */

export interface ParsedReference {
    filePath: string;
    variables: Record<string, string>;
}

/**
 * Parses an extended Lua file reference into its components.
 *
 * Syntax: ~lua/file.lua{VAR1=val1,VAR2=val2}
 *
 * @param ref The reference string to parse
 * @returns Parsed components or null if not a template reference
 *
 * @example
 * parseReference('~lua/raptor-hp-template.lua{HP_MULTIPLIER=1.5}')
 * // Returns: { filePath: 'lua/raptor-hp-template.lua', variables: { HP_MULTIPLIER: '1.5' } }
 *
 * parseReference('~lua/main-defs.lua')
 * // Returns: { filePath: 'lua/main-defs.lua', variables: {} }
 */
function parseReference(ref: string): ParsedReference | null {
    if (!ref.startsWith('~')) {
        console.warn(`Invalid Lua reference (missing ~ prefix): ${ref}`);
        return null;
    }

    // Match pattern: ~path/to/file.lua{VAR1=val1,VAR2=val2}
    // Group 1: path/to/file.lua
    // Group 2: VAR1=val1,VAR2=val2 (optional)
    const match = ref.match(/^~([^{]+)(?:\{([^}]+)\})?$/);

    if (!match) {
        console.warn(`Malformed Lua reference syntax: ${ref}`);
        return null;
    }

    const filePath = match[1];
    const variablesString = match[2];

    const variables: Record<string, string> = {};

    if (variablesString) {
        // Parse key=value pairs separated by commas
        const pairs = variablesString.split(',');

        for (const pair of pairs) {
            const [key, value] = pair.split('=').map((s) => s.trim());

            if (!key || value === undefined) {
                console.warn(
                    `Invalid variable pair in reference ${ref}: "${pair}"`
                );
                continue;
            }

            variables[key] = value;
        }
    }

    return { filePath, variables };
}

/**
 * Interpolates template placeholders with variable values.
 *
 * Replaces $VARIABLE_NAME$ with corresponding values from variables object.
 *
 * @param template The template string with $PLACEHOLDER$ markers
 * @param variables Object mapping variable names to values
 * @returns Interpolated template string
 *
 * @example
 * interpolateTemplate(
 *   'unitDef.health = unitDef.health * $HP_MULTIPLIER$',
 *   { HP_MULTIPLIER: '1.5' }
 * )
 * // Returns: 'unitDef.health = unitDef.health * 1.5'
 */
function interpolateTemplate(
    template: string,
    variables: Record<string, string>
): string {
    // Track which variables were actually used
    const usedVariables = new Set<string>();

    // Replace all $VARIABLE$ placeholders
    const interpolated = template.replaceAll(
        /\$(\w+)\$/g,
        (match, varName: string) => {
            if (varName in variables) {
                usedVariables.add(varName);
                return variables[varName];
            }

            console.warn(
                `Undefined template variable: ${varName} (placeholder: ${match})`
            );
            return match; // Keep placeholder if variable not found
        }
    );

    // Check for unused variables (potential typos in template)
    const unusedVariables = Object.keys(variables).filter(
        (v) => !usedVariables.has(v)
    );
    if (unusedVariables.length > 0) {
        console.warn(
            `Template variables provided but not used: ${unusedVariables.join(', ')}`
        );
    }

    return interpolated;
}

/**
 * Main API: Processes a Lua file reference with optional variable interpolation.
 *
 * Handles both standard references (~lua/file.lua) and template references
 * (~lua/template.lua{VAR=value}). Loads file from bundle, interpolates variables,
 * and returns ready-to-use Lua code.
 *
 * @param ref The Lua file reference (with optional template variables)
 * @param luaFileMap Map of file paths to Lua source code (from bundle)
 * @returns Interpolated Lua source code
 * @throws Error if reference is malformed or file not found in bundle
 *
 * @example
 * processLuaReference(
 *   '~lua/raptor-hp-template.lua{HP_MULTIPLIER=1.5}',
 *   luaFileMap
 * )
 * // Loads template, replaces $HP_MULTIPLIER$ with 1.5, returns interpolated code
 */
export function processLuaReference(
    ref: string,
    luaFileMap: Map<string, string>
): string {
    // Parse the reference
    const parsed = parseReference(ref);
    if (!parsed) {
        throw new Error(`Failed to parse Lua reference: ${ref}`);
    }

    const { filePath, variables } = parsed;

    // Load template/file from bundle
    const template = luaFileMap.get(filePath);
    if (!template) {
        throw new Error(
            `Lua file not found in bundle: ${filePath} (from reference: ${ref})`
        );
    }

    // If no variables, return template as-is
    if (Object.keys(variables).length === 0) {
        return template;
    }

    // Interpolate variables
    const interpolated = interpolateTemplate(template, variables);

    return interpolated;
}
