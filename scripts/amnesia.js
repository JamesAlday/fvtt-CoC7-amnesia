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
// Listen for clicks on skill names in the actor sheet to reveal true skill values.
// This must work across both sheet architectures:
//   - ApplicationV2 (CoC7 8.x): fires "renderActorSheetV2", 2nd arg is a native HTMLElement.
//   - ApplicationV1 (CoC7 7.x): fires "renderActorSheet", 2nd arg is a jQuery object.
const bindSkillReveal = (app, element) => {
    // Normalize: native element passes through; a jQuery object is unwrapped via [0].
    const root = element instanceof HTMLElement ? element : element?.[0];
    if (!root) return;

    root.querySelectorAll("div.item-name.skill-name.rollable").forEach((el) => {
        // Guard against binding twice if the sheet re-renders parts in place.
        if (el.dataset.amnesiaBound) return;
        el.dataset.amnesiaBound = "1";
        el.addEventListener("click", (event) => handleSkillClick(app, event));
    });
};

Hooks.on("renderActorSheetV2", bindSkillReveal); // CoC7 8.x (ApplicationV2)
Hooks.on("renderActorSheet", bindSkillReveal);   // CoC7 7.x (ApplicationV1)
