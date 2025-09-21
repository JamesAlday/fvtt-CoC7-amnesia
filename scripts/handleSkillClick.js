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
    const actor = app.actor;
    
    if (!actor || !skillName) return;
    
    const skillItem = actor.items.find((i) => {
        return i.type === "skill" &&
        (i.name === skillName || (i.system?.skillName && i.system.skillName === skillName));
    });
    
    if (!skillItem) return;
    
    const hiddenSkills = await loadHiddenSkills(actor);

    if (!hiddenSkills) return;
    
    const trueValueObj = hiddenSkills.find(hiddenSkill => {
        const mainName = skillItem.system?.skillName ? skillItem.system.skillName : skillItem.name;
        return (
            hiddenSkill.name === mainName ||
            hiddenSkill.subskill === mainName
        );
    });
    
    const trueValue = trueValueObj ? trueValueObj.value : null;
    
    if (trueValue != null && (!skillItem.system.value || skillItem.system.value === skillItem.system.base)) {
        await skillItem.update({ "system.value": trueValue });
        
        const gmIds = game.users.filter(u => u.isGM).map(u => u.id);
        const ownerIds = Object.keys(actor.ownership ?? {}).filter(uid => actor.ownership[uid] >= 2);
        const whisperTo = [...new Set([...gmIds, ...ownerIds])];
        
        ChatMessage.create({
            content: `<b>${actor.name}</b> recalls their <i>${skillItem.name}${skillItem.system.subskill ? " ("+skillItem.system.subskill+")" : ""}</i> skill: now <b>${trueValue}</b>.`,
            speaker: { alias: "Memory Returns" },
            whisper: whisperTo
        });
    }
}