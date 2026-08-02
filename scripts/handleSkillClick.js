async function loadHiddenSkills(actor) {
    const jsonPath = game.settings.get("amnesia", "characterJsonPath");

    if (!jsonPath) {
        ui.notifications.error("« Amnesia » | JSON path is not set in module settings. Please configure it before using this feature.");
        return null; // Return null to indicate an error
    }

    const filePath = `${jsonPath}/${actor.name}.json`;

    if (game.Amnesia.debug) console.log(`« Amnesia » | Loading hidden skills from: ${filePath}`, jsonPath);

    if (game.Amnesia.hiddenSkillCache[actor.id]) {
        if (game.Amnesia.debug) console.log(`« Amnesia » | Using cached hidden skills for ${actor.name}`);
        return game.Amnesia.hiddenSkillCache[actor.id];
    }

    try {
        const response = await fetch(filePath);
        if (!response.ok) throw new Error(`[Amnesia] File not found: ${filePath}`);

        const json = await response.json();
        game.Amnesia.hiddenSkillCache[actor.id] = json["Investigator"]["Skills"]["Skill"] ?? {};

        if (game.Amnesia.debug) console.log(`« Amnesia » | Loaded hidden skills for ${actor.name}`);
        return game.Amnesia.hiddenSkillCache[actor.id];
    } catch (err) {
        console.error(`« Amnesia » | Failed to load hidden skills for ${actor.name}:`, err);
        return []; 
    }
}

export async function handleSkillClick(app, event) {
    event.preventDefault();
    
    const el = event.currentTarget;
    const skillName = el.textContent.trim();
    // CoC7 8.x (ApplicationV2) overrides sheet.actor to return an internal async
    // wrapper (#asyncActor); sheet.document is always the real Actor document.
    const actor = app.document ?? app.actor;

    if (!actor || !skillName) return;

    // Prefer the exact item via the row's UUID (CoC7 8.x renders data-item-uuid on
    // the <li>); fall back to name matching for older sheet templates.
    let skillItem = null;
    const uuid = el.closest("[data-item-uuid]")?.dataset.itemUuid;
    if (uuid) skillItem = await fromUuid(uuid);
    if (!skillItem) {
        skillItem = actor.items.find((i) =>
            i.type === "skill" &&
            (i.name === skillName || (i.system?.skillName && i.system.skillName === skillName))
        );
    }

    if (game.Amnesia.debug) console.log(`« Amnesia » | Skill click: "${skillName}" → item:`, skillItem, "actor:", actor?.name);

    if (!skillItem) return;
    
    const hiddenSkills = await loadHiddenSkills(actor);

    if (!hiddenSkills) return;
    
    const mainName = skillItem.system?.skillName ? skillItem.system.skillName : skillItem.name;
    const trueValueObj = hiddenSkills.find(hiddenSkill =>
        hiddenSkill.name === mainName || hiddenSkill.subskill === mainName
    );

    // Dhole's House stores values as strings ("75"); coerce to a number.
    const trueValue = trueValueObj != null ? Number(trueValueObj.value) : null;

    // CoC7 8.x has no stored value/base on a skill — value = sum(system.adjustments).
    // `rawValue` is the current total (value getter minus any transient roll override).
    const current = Number(skillItem.system?.rawValue ?? skillItem.system?.value ?? 0);
    const willReveal = trueValue != null && !Number.isNaN(trueValue) && current < trueValue;

    if (game.Amnesia.debug) {
        console.log("« Amnesia » | Reveal check", {
            mainName,
            itemName: skillItem.name,
            matchedJson: trueValueObj ?? null,
            trueValue,
            current,
            rawValue: skillItem.system?.rawValue,
            adjustments: foundry.utils.deepClone(skillItem.system?.adjustments),
            willReveal,
        });
    }

    if (willReveal) {
        // Push the gap into the "experience" adjustment so the total equals trueValue,
        // mirroring the system's (deprecated) updateValue() without the warning.
        const currentExp = parseInt(skillItem.system?.adjustments?.experience ?? 0) || 0;
        const newExp = Math.max(0, currentExp + (trueValue - current));
        await skillItem.update({ "system.adjustments.experience": newExp });

        const gmIds = game.users.filter(u => u.isGM).map(u => u.id);
        const ownerIds = Object.keys(actor.ownership ?? {}).filter(uid => actor.ownership[uid] >= 2);
        const whisperTo = [...new Set([...gmIds, ...ownerIds])];
        
        ChatMessage.create({
            content: `<b>${actor.name}</b> recalls their <i>${skillItem.name}</i> skill: now <b>${trueValue}</b>.`,
            speaker: { alias: "Memory Returns" },
            whisper: whisperTo
        });
    }
}