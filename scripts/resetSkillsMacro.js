// Amnesia Reset Skills Macro - creates a macro to reset character skills to base values
export const resetSkillsMacro = async () => {
    if (!game.user.isGM) return ui.notifications.warn("Only GM can reset skills");
    
    const characterActors = game.actors.filter(a => a.type === "character");
    if (!characterActors.length) return ui.notifications.info("No characters found");
  
    const options = characterActors.map(a =>
      `<option value="${a.id}">${a.name}</option>`
    ).join("");

    const dialogCallback = async (html) => {
      const selectedIds = Array.from(html.find("#actorSelect")[0].selectedOptions).map(o => o.value);
      for (const actorId of selectedIds) {
        const actor = game.actors.get(actorId);
        if (!actor) continue;

        for (const skill of actor.items.filter(i => i.type === "skill")) {
          const baseValue = await game.Amnesia.getBaseSkillValue(actor, skill);
          if (baseValue === null) {
            console.warn(`« Amnesia » | Could not determine base value for skill ${skill.name} on actor ${actor.name}`);
            continue;
          }
        
          // Ensure experience object exists before updating the skill
          const experience = skill.system.experience || { value: 0, spent: 0 };
          await skill.update({
            "system.base": baseValue,
            "system.value": baseValue,
            "system.experience": experience,
            "system.flags.developement": false // Reset flagged for development
          });
        }
        console.log(`« Amnesia » | Reset skills for ${actor.name}`);
      }
      ui.notifications.info(`Skills reset for ${selectedIds.length} character(s).`);
    }
  
    new Dialog({
      title: "Reset Character Skills",
      content: `
        <p>Select character(s) to reset skills to base values:</p>
        <select id="actorSelect" multiple size="${Math.min(characterActors.length, 10)}" style="width:100%">
          ${options}
        </select>
      `,
      buttons: {
        reset: {
          label: "Reset",
          callback: dialogCallback,
        },
        cancel: { label: "Cancel" }
      },
      default: "reset"
    }).render(true);
  };
