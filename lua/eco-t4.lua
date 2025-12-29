-- T4 Eco (Cold Fusion & Metal Converters)
-- Original author: `jackie188` on BAR (resurrected from base64)
-- bar-nuttyb-collective.github.io/configurator

do
    local unitDefs = UnitDefs or {}
    local tableMerge = table.merge

    local factions = { 'arm', 'cor', 'leg' }
    local factionNames = {
        arm = 'Armada ',
        cor = 'Cortex ',
        leg = 'Legion ',
    }

    local taxedSuffix = '_taxed'
    local taxedMultiplier = 1.2
    local fusionEnergyMultiplier = 1.3

    local function cloneUnit(sourceUnit, targetUnit, overrides)
        if unitDefs[sourceUnit] and not unitDefs[targetUnit] then
            unitDefs[targetUnit] = tableMerge(unitDefs[sourceUnit], overrides)
        end
    end

    -- Create T3/T4 cold metal converters and fusion reactors for each faction
    for _, faction in ipairs(factions) do
        local isLegion = (faction == 'leg')

        -- Metal Maker base unit name differs for Legion
        local metalMakerBase = isLegion and 'legadveconvt3'
            or (faction .. 'mmkrt3')
        local metalMakerTaxed = metalMakerBase .. taxedSuffix
        local metalMakerDef = unitDefs[metalMakerBase]

        -- T3 Cold Energy Converter (taxed version)
        if metalMakerDef then
            cloneUnit(metalMakerBase, metalMakerTaxed, {
                metalcost = math.ceil(
                    metalMakerDef.metalcost * taxedMultiplier
                ),
                energycost = math.ceil(
                    metalMakerDef.energycost * taxedMultiplier
                ),
                buildtime = math.ceil(
                    metalMakerDef.buildtime * taxedMultiplier
                ),
                health = math.ceil(metalMakerDef.health * taxedMultiplier * 3),
                customparams = {
                    energyconv_capacity = math.ceil(
                        metalMakerDef.customparams.energyconv_capacity
                            * taxedMultiplier
                    ),
                    energyconv_efficiency = 0.021,
                    buildinggrounddecaldecayspeed = metalMakerDef.customparams.buildinggrounddecaldecayspeed,
                    buildinggrounddecalsizex = metalMakerDef.customparams.buildinggrounddecalsizex,
                    buildinggrounddecalsizey = metalMakerDef.customparams.buildinggrounddecalsizey,
                    buildinggrounddecaltype = metalMakerDef.customparams.buildinggrounddecaltype,
                    model_author = metalMakerDef.customparams.model_author,
                    normaltex = metalMakerDef.customparams.normaltex,
                    removestop = metalMakerDef.customparams.removestop,
                    removewait = metalMakerDef.customparams.removewait,
                    subfolder = metalMakerDef.customparams.subfolder,
                    techlevel = metalMakerDef.customparams.techlevel,
                    unitgroup = metalMakerDef.customparams.unitgroup,
                    usebuildinggrounddecal = metalMakerDef.customparams.usebuildinggrounddecal,
                    i18n_en_humanname = 'T3 Cold Energy Converter ',
                    i18n_en_tooltip = 'Converts 7200 energy into 151 metal per sec. Non-Explosive!',
                },
                name = factionNames[faction] .. 'T3 cold Energy Converter',
                buildpic = metalMakerDef.buildpic,
                objectname = metalMakerDef.objectname,
                footprintx = 6,
                footprintz = 6,
                yardmap = metalMakerDef.yardmap,
                script = metalMakerDef.script,
                activatewhenbuilt = metalMakerDef.activatewhenbuilt,
                explodeas = 'largeBuildingexplosiongeneric',
                selfdestructas = 'largeBuildingExplosionGenericSelfd',
                sightdistance = metalMakerDef.sightdistance,
                seismicsignature = metalMakerDef.seismicsignature,
                idleautoheal = metalMakerDef.idleautoheal,
                idletime = metalMakerDef.idletime,
                maxslope = metalMakerDef.maxslope,
                maxwaterdepth = metalMakerDef.maxwaterdepth,
                maxacc = metalMakerDef.maxacc,
                maxdec = metalMakerDef.maxdec,
                corpse = metalMakerDef.corpse,
                canrepeat = metalMakerDef.canrepeat,
            })
        end

        -- T4 Cold Energy Converter (200% version)
        local metalMakerT4 = metalMakerBase .. '_200'
        if metalMakerDef then
            local t4Multiplier = 2.0
            cloneUnit(metalMakerBase, metalMakerT4, {
                metalcost = math.ceil(metalMakerDef.metalcost * t4Multiplier),
                energycost = math.ceil(metalMakerDef.energycost * t4Multiplier),
                buildtime = math.ceil(metalMakerDef.buildtime * t4Multiplier),
                health = math.ceil(metalMakerDef.health * t4Multiplier * 6),
                customparams = {
                    energyconv_capacity = math.ceil(
                        metalMakerDef.customparams.energyconv_capacity * 2
                    ),
                    energyconv_efficiency = 0.022,
                    buildinggrounddecaldecayspeed = metalMakerDef.customparams.buildinggrounddecaldecayspeed,
                    buildinggrounddecalsizex = metalMakerDef.customparams.buildinggrounddecalsizex,
                    buildinggrounddecalsizey = metalMakerDef.customparams.buildinggrounddecalsizey,
                    buildinggrounddecaltype = metalMakerDef.customparams.buildinggrounddecaltype,
                    model_author = metalMakerDef.customparams.model_author,
                    normaltex = metalMakerDef.customparams.normaltex,
                    removestop = metalMakerDef.customparams.removestop,
                    removewait = metalMakerDef.customparams.removewait,
                    subfolder = metalMakerDef.customparams.subfolder,
                    techlevel = metalMakerDef.customparams.techlevel,
                    unitgroup = metalMakerDef.customparams.unitgroup,
                    usebuildinggrounddecal = metalMakerDef.customparams.usebuildinggrounddecal,
                    i18n_en_humanname = 'T4 cold Energy Converter',
                    i18n_en_tooltip = 'Converts 12000 energy into 264 metal per sec. Non-Explosive!',
                },
                name = factionNames[faction] .. 'T4 Cold Energy Converter',
                buildpic = metalMakerDef.buildpic,
                objectname = metalMakerDef.objectname,
                footprintx = 6,
                footprintz = 6,
                yardmap = metalMakerDef.yardmap,
                script = metalMakerDef.script,
                activatewhenbuilt = metalMakerDef.activatewhenbuilt,
                explodeas = 'largeBuildingexplosiongeneric',
                selfdestructas = 'largeBuildingExplosionGenericSelfd',
                sightdistance = metalMakerDef.sightdistance,
                seismicsignature = metalMakerDef.seismicsignature,
                idleautoheal = metalMakerDef.idleautoheal,
                idletime = metalMakerDef.idletime,
                maxslope = metalMakerDef.maxslope,
                maxwaterdepth = metalMakerDef.maxwaterdepth,
                maxacc = metalMakerDef.maxacc,
                maxdec = metalMakerDef.maxdec,
                corpse = metalMakerDef.corpse,
                canrepeat = metalMakerDef.canrepeat,
            })
        end

        -- Fusion Reactor base unit
        local fusionBase = faction .. 'afust3'
        local fusionTaxed = fusionBase .. taxedSuffix
        local fusionDef = unitDefs[fusionBase]

        -- T3 Cold Fusion Reactor (taxed version)
        if fusionDef then
            cloneUnit(fusionBase, fusionTaxed, {
                buildtime = math.ceil(
                    fusionDef.buildtime * taxedMultiplier * 1.8
                ),
                metalcost = 108000,
                energycost = math.ceil(fusionDef.energycost * taxedMultiplier),
                energymake = math.ceil(
                    fusionDef.energymake * fusionEnergyMultiplier
                ),
                energystorage = math.ceil(
                    fusionDef.energystorage * fusionEnergyMultiplier
                ),
                health = math.ceil(fusionDef.health * taxedMultiplier * 3),
                buildpic = fusionDef.buildpic,
                collisionvolumeoffsets = fusionDef.collisionvolumeoffsets,
                collisionvolumescales = fusionDef.collisionvolumescales,
                collisionvolumetype = fusionDef.collisionvolumetype,
                damagemodifier = 0.95,
                buildangle = fusionDef.buildangle,
                objectname = fusionDef.objectname,
                footprintx = 12,
                footprintz = 12,
                yardmap = fusionDef.yardmap,
                script = fusionDef.script,
                activatewhenbuilt = fusionDef.activatewhenbuilt,
                explodeas = 'largeBuildingexplosiongeneric',
                selfdestructas = 'largeBuildingExplosionGenericSelfd',
                sightdistance = fusionDef.sightdistance,
                seismicsignature = fusionDef.seismicsignature,
                idleautoheal = math.ceil(fusionDef.idleautoheal * 6),
                idletime = fusionDef.idletime,
                maxslope = fusionDef.maxslope,
                maxwaterdepth = fusionDef.maxwaterdepth,
                maxacc = fusionDef.maxacc,
                maxdec = fusionDef.maxdec,
                corpse = fusionDef.corpse,
                canrepeat = fusionDef.canrepeat,
                customparams = {
                    buildinggrounddecaldecayspeed = 30,
                    buildinggrounddecalsizex = 18,
                    buildinggrounddecalsizey = 18,
                    buildinggrounddecaltype = fusionDef.customparams.buildinggrounddecaltype,
                    model_author = fusionDef.customparams.model_author,
                    normaltex = fusionDef.customparams.normaltex,
                    subfolder = fusionDef.customparams.subfolder,
                    removestop = true,
                    removewait = true,
                    techlevel = 3,
                    unitgroup = 'energy',
                    usebuildinggrounddecal = true,
                    i18n_en_humanname = factionNames[faction]
                        .. 'T3 Cold Fusion Reactor',
                    i18n_en_tooltip = 'Produce 39000 Energy. Non-Explosive!',
                },
                sfxtypes = {
                    pieceexplosiongenerators = {
                        [1] = 'deathceg2',
                        [2] = 'deathceg3',
                        [3] = 'deathceg4',
                    },
                },
                sounds = {
                    canceldestruct = 'cancel2',
                    underattack = 'warning1',
                    count = {
                        'count6',
                        'count5',
                        'count4',
                        'count3',
                        'count2',
                        'count1',
                    },
                    select = {
                        'fusion2',
                    },
                },
            })
        end

        -- T4 Cold Fusion Reactor (200% version)
        local fusionT4 = fusionBase .. '_200'
        if fusionDef then
            cloneUnit(fusionBase, fusionT4, {
                buildtime = math.ceil(fusionDef.buildtime * 1.8),
                name = factionNames[faction] .. 'T4 cold Fusion Reactor',
                metalcost = math.ceil(fusionDef.metalcost * 2.0),
                energycost = math.ceil(fusionDef.energycost * 2.0),
                energymake = math.ceil(fusionDef.energymake * 2.4),
                energystorage = math.ceil(fusionDef.energystorage * 6.0),
                health = math.ceil(fusionDef.health * 2.0 * 3),
                buildpic = fusionDef.buildpic,
                collisionvolumeoffsets = fusionDef.collisionvolumeoffsets,
                collisionvolumescales = fusionDef.collisionvolumescales,
                collisionvolumetype = fusionDef.collisionvolumetype,
                damagemodifier = 0.95,
                buildangle = fusionDef.buildangle,
                objectname = fusionDef.objectname,
                footprintx = 12,
                footprintz = 12,
                yardmap = fusionDef.yardmap,
                script = fusionDef.script,
                activatewhenbuilt = fusionDef.activatewhenbuilt,
                explodeas = 'largeBuildingexplosiongeneric',
                selfdestructas = 'largeBuildingExplosionGenericSelfd',
                sightdistance = fusionDef.sightdistance,
                seismicsignature = fusionDef.seismicsignature,
                idleautoheal = math.ceil(fusionDef.idleautoheal * 6),
                idletime = fusionDef.idletime,
                maxslope = fusionDef.maxslope,
                maxwaterdepth = fusionDef.maxwaterdepth,
                maxacc = fusionDef.maxacc,
                maxdec = fusionDef.maxdec,
                corpse = fusionDef.corpse,
                canrepeat = fusionDef.canrepeat,
                customparams = {
                    buildinggrounddecaldecayspeed = 30,
                    buildinggrounddecalsizex = 18,
                    buildinggrounddecalsizey = 18,
                    buildinggrounddecaltype = fusionDef.customparams.buildinggrounddecaltype,
                    model_author = fusionDef.customparams.model_author,
                    normaltex = fusionDef.customparams.normaltex,
                    subfolder = fusionDef.customparams.subfolder,
                    removestop = true,
                    removewait = true,
                    techlevel = 3,
                    unitgroup = 'energy',
                    usebuildinggrounddecal = true,
                    i18n_en_humanname = factionNames[faction]
                        .. 'T4 Cold Fusion Reactor',
                    i18n_en_tooltip = 'Produce 72000 Energy! For the truly power-hungry. Non-Explosive!',
                },
                sfxtypes = {
                    pieceexplosiongenerators = {
                        [1] = 'deathceg2',
                        [2] = 'deathceg3',
                        [3] = 'deathceg4',
                    },
                },
                sounds = {
                    canceldestruct = 'cancel2',
                    underattack = 'warning1',
                    count = {
                        'count6',
                        'count5',
                        'count4',
                        'count3',
                        'count2',
                        'count1',
                    },
                    select = {
                        'fusion2',
                    },
                },
            })
        end

        -- Add new units to T3 aide builders
        local t3AideGround = faction .. 't3aide'
        local t3AideAir = faction .. 't3airaide'
        local aideGroundDef = unitDefs[t3AideGround]
        local aideAirDef = unitDefs[t3AideAir]

        if aideGroundDef and aideAirDef then
            local newBuildOptions = {}

            if unitDefs[metalMakerTaxed] then
                newBuildOptions[#newBuildOptions + 1] = metalMakerTaxed
            end
            if unitDefs[metalMakerT4] then
                newBuildOptions[#newBuildOptions + 1] = metalMakerT4
            end
            if unitDefs[fusionTaxed] then
                newBuildOptions[#newBuildOptions + 1] = fusionTaxed
            end
            if unitDefs[fusionT4] then
                newBuildOptions[#newBuildOptions + 1] = fusionT4
            end

            for _, optionName in ipairs(newBuildOptions) do
                aideGroundDef.buildoptions[#aideGroundDef.buildoptions + 1] =
                    optionName
                aideAirDef.buildoptions[#aideAirDef.buildoptions + 1] =
                    optionName
            end
        end
    end

    -- Add new units to T3 constructor build options
    local t3Builders = {
        'armack',
        'armaca',
        'armacv',
        'corack',
        'coraca',
        'coracv',
        'legack',
        'legaca',
        'legacv',
    }

    for _, builderName in pairs(t3Builders) do
        local faction = builderName:sub(1, 3)
        local buildOptions = unitDefs[builderName].buildoptions

        if not buildOptions then
            buildOptions = {}
            unitDefs[builderName].buildoptions = buildOptions
        end

        local isLegion = (faction == 'leg')
        local metalMakerBase = isLegion and 'legadveconvt3'
            or (faction .. 'mmkrt3')

        local newUnits = {
            metalMakerBase .. taxedSuffix,
            metalMakerBase .. '_200',
            faction .. 'afust3' .. taxedSuffix,
            faction .. 'afust3_200',
        }

        for _, unitName in ipairs(newUnits) do
            if unitDefs[unitName] then
                buildOptions[#buildOptions + 1] = unitName
            end
        end
    end
end
