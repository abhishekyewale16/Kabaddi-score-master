
type CommentaryMap = {
  [key: string]: string[];
};

const commentaryTemplates: CommentaryMap = {
  raid_score: [
    "{{raiderName}} scores {{points}} point(s) for {{raidingTeam}} with a brilliant raid!",
    "An excellent raid by {{raiderName}}! That's {{points}} point(s) to {{raidingTeam}}.",
    "{{raiderName}} gets past the defense! {{points}} point(s) for {{raidingTeam}}.",
    "A successful raid from {{raiderName}} of {{raidingTeam}}, earning {{points}} point(s).",
    "Points on the board for {{raidingTeam}} thanks to {{raiderName}}'s {{points}}-point raid."
  ],
  tackle_score: [
    "What a tackle by {{defenderName}} from {{defendingTeam}}! {{raiderName}} is out!",
    "A rock-solid tackle from {{defenderName}} stops the raid! Point to {{defendingTeam}}.",
    "Superb defending by {{defenderName}}! {{raiderName}} couldn't escape that one.",
    "{{defendingTeam}}'s defense holds strong! {{defenderName}} with the tackle on {{raiderName}}.",
    "The raider is stopped in their tracks! A fantastic tackle by {{defenderName}}."
  ],
  super_tackle_score: [
    "SUPER TACKLE! {{defenderName}} leads the charge for {{defendingTeam}} to earn 2 crucial points!",
    "Incredible defense! A super tackle from {{defendingTeam}} led by {{defenderName}}!",
    "That's a super tackle! 2 points for {{defendingTeam}} as {{raiderName}} is brought down."
  ],
  empty_raid: [
    "An empty raid from {{raiderName}}. No points for either side.",
    "{{raiderName}} plays it safe and returns without a point. Empty raid.",
    "The defense of {{defendingTeam}} stands firm, forcing an empty raid from {{raiderName}}.",
    "No risks taken by {{raiderName}} on that raid. It's an empty one."
  ],
  do_or_die_fail: [
    "Pressure gets to {{raiderName}}! They fail the Do-or-Die raid! A point to {{defendingTeam}}.",
    "{{raidingTeam}} loses their raider! {{raiderName}} is out on the Do-or-Die raid.",
    "The defense of {{defendingTeam}} comes out on top in the Do-or-Die raid!"
  ],
  line_out: [
    "{{raiderName}} has stepped out of bounds! That's a point to {{defendingTeam}}.",
    "A costly mistake by {{raiderName}}! They're out, and {{defendingTeam}} gets a point."
  ],
  technical_point: [
    "A technical point has been awarded to {{raidingTeam}}.",
    "The officials have awarded a technical point to {{raidingTeam}}."
  ],
  green_card: [
    "A Green Card is shown to {{raiderName}} of {{raidingTeam}}. That's a formal warning.",
    "The referee issues a Green Card to {{raiderName}}. They need to be careful now."
  ],
  yellow_card: [
    "Yellow Card for {{raiderName}}! That's a 2-minute suspension and a point to {{defendingTeam}}.",
    "Things are heating up! A Yellow Card for {{raiderName}} puts {{raidingTeam}} at a disadvantage."
  ],
  red_card: [
    "It's a Red Card! {{raiderName}} from {{raidingTeam}} is out for the rest of the match!",
    "A major blow for {{raidingTeam}} as {{raiderName}} receives a Red Card."
  ],
  lona: [
    "LONA! ALL OUT! {{raidingTeam}} gets 2 extra points for wiping out the entire team!",
    "That's an All Out! {{raidingTeam}} inflicts a Lona and bags bonus points!"
  ],
  super_raid: [
    "SUPER RAID! {{raiderName}} has scored 3 or more points in a single raid! Incredible!",
    "What an amazing effort! It's a Super Raid by {{raiderName}}!"
  ],
  bonus: [
    "A bonus point snatched by {{raiderName}}! Clever work from the raider.",
    "{{raiderName}} crosses the bonus line. That's a point for {{raidingTeam}}."
  ],
};

function getRandomComment(eventType: string): string | null {
  const templates = commentaryTemplates[eventType];
  if (!templates || templates.length === 0) {
    return null;
  }
  const randomIndex = Math.floor(Math.random() * templates.length);
  return templates[randomIndex];
}

export function getCommentary(data: { [key: string]: any }): string | null {
  let eventType = data.eventType;

  // Handle special cases first
  if (data.isLona) {
    eventType = 'lona';
  } else if (data.isSuperRaid) {
    eventType = 'super_raid';
  } else if (data.isBonus && eventType === 'raid_score') {
     // This is raid + bonus, let's just use the raid_score message for simplicity
     // but you could create a specific 'raid_bonus' category if desired
  } else if (data.isBonus) {
      eventType = 'bonus';
  }

  let comment = getRandomComment(eventType);
  if (!comment) {
    return `An event of type '${eventType}' occurred.`;
  }

  // Replace placeholders
  for (const key in data) {
    const placeholder = new RegExp(`{{${key}}}`, 'g');
    comment = comment.replace(placeholder, data[key]);
  }

  return comment;
}
