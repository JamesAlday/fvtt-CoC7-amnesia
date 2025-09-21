import { resetSkillsMacro } from "./resetSkillsMacro.js";

export async function createResetSkillsMacro() {
  const macroName = "Amnesia: Reset Skills";

  if (!game.macros.getName(macroName)) {
    const macroCommand = `const resetSkillsMacro = ${resetSkillsMacro.toString()}; resetSkillsMacro();`;

    await Macro.create({
      name: macroName,
      type: "script",
      scope: "global",
      command: macroCommand,
      flags: { "CoC7.Amnesia": { createdByModule: true } },
      img: "icons/svg/d20-black.svg"
    });

    if (game.Amnesia.debug) console.log(`« Amnesia » | Created macro "${macroName}"`);
    ui.notifications.info(`Macro "${macroName}" added to Macro Directory`);
  }
}