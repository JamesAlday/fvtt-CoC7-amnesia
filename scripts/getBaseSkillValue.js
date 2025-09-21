import { baseSkills } from "./baseSkills.js";

export async function getBaseSkillValue(actor, skillItem) {
	const systemLanguage = game.Amnesia.systemLanguage;
	const skillName = skillItem.name;
	const systemSkillName = skillItem.system?.skillName; // For subskills like Photography

	if (!actor || !skillName) return 0;

	switch(skillName) {
		case "Art/Craft":
			if (systemSkillName && systemSkillName !== "Art/Craft") {
				// e.g. Art/Craft (Photography)
				return baseSkills[`Art/Craft (${systemSkillName})`] ?? 5;
			}
			return baseSkills["Art/Craft"] ?? 5;
		case "Cthulhu Mythos":
			// Cthulhu Mythos always starts at 0
			return 0;
		case "Dodge":
			const dexterity = actor.system?.characteristics?.dex?.value || 0;
			return Math.floor(dexterity / 2);
		case "Drive":
			if (systemSkillName && systemSkillName !== "Drive") {
				// e.g. Drive (Auto)
				return baseSkills[`Drive ${systemSkillName}`] ?? 20;
			}
			return baseSkills["Drive Auto"] ?? 20;
		case "Fighting":
			if (systemSkillName && systemSkillName !== "Fighting") {
				// e.g. Fighting (Axe)
				return baseSkills[`Fighting (${systemSkillName})`] ?? 0;
			}
			return baseSkills["Fighting"] ?? 0;
		case "Firearms":
			if (systemSkillName && systemSkillName !== "Firearms") {
				// e.g. Firearms (Handgun)
				return baseSkills[`Firearms (${systemSkillName})`] ?? 0;
			}
			return baseSkills["Firearms"] ?? 0;
		case "Language":
			if (systemSkillName && systemSkillName !== "Language") {
				// e.g. Language (French)
				return 1; // All non-native languages start at 1%
			}
			return 0;
		case `Language (${systemLanguage})` || 'Language (Own)' || systemLanguage:
			const edu = actor.system?.characteristics?.edu?.value || 0;
			return edu; // Native language starts at EDU%
		case "Science":
			if (systemSkillName && systemSkillName !== "Science") {
				// e.g. Science (Biology)
				return baseSkills[`Science (${systemSkillName})`] ?? 1;
			}
			return baseSkills["Science"] ?? 1;
		default:
			break;
	}

	// 1. Check compendium skills for base value
	try {
		const pack = game.packs.get("CoC7.skills");
		if (pack) {
			const index = await pack.getIndex({ fields: ["name", "system.base"] });
			const entry = index.find(e => e.name === skillName || e.name === systemSkillName);
			if (entry) {
				const skillDoc = await pack.getDocument(entry._id);
				const rulebookBase = skillDoc.system?.base;
				if (rulebookBase !== undefined) {
					if (game.Amnesia.debug) console.log(`« Amnesia » | Found base skill for ${skillName} in compendium: ${rulebookBase}`);
					return rulebookBase;
				}
			}
		}
	} catch (err) {
		if (game.Amnesia.debug) console.error("« Amnesia » | Error accessing skills compendium:", err);
	}

	// 2. check static baseSkills object
	if (baseSkills[skillName] !== undefined) {
		return baseSkills[skillName];
	}

	// 3. Default to 0 if not found
	if (game.Amnesia.debug) console.warn(`« Amnesia » | Base skill not found for ${skillName}, defaulting to 0`);
	return 0;
}