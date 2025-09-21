import { getBaseSkillValue } from "./getBaseSkillValue.js";
import { handleSkillClick } from "./handleSkillClick.js";
import { createResetSkillsMacro } from "./createResetSkillsMacro.js";
import { registerSettings } from "./settings.js";

// === Amnesia Skill Reveal Script for CoC7e ===

// === Register Settings ===
Hooks.once("init", () => {
    console.log("« Amnesia » | Initializing module");
    registerSettings();
});

// === Create Reset Skills Macro ===
// On module ready, create a macro for GMs to reset character skills to base values
Hooks.once("ready", async () => {
    try {
        console.log("« Amnesia » | Ready");
        
        if (!game.user.isGM) return;
        
        game.Amnesia = {
            systemLanguage: game.i18n.localize("CoC7.Amnesia.Language"),
            getBaseSkillValue: getBaseSkillValue,
            debug: game.settings.get("amnesia", "debug"),
            hiddenSkillCache: {},
        };
        
        await createResetSkillsMacro();
    } catch (err) {
        console.error("« Amnesia » | Error in ready hook:", err);
    }
});

// === Hook skill rolls ===
// Listen for clicks on skill names in the actor sheet to reveal true skill values
Hooks.on("renderActorSheet", (app, html, data) => {
    html.find('div.item-name.skill-name.rollable')
    .off("click.amnesia")
    .on("click.amnesia", handleSkillClick.bind(null, app));
});
