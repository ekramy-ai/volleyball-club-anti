import { supabase } from "./supabase";

const CLUBS_DATA = [
  { name: "Al Ahly SC", city: "Cairo", founded_year: 1907, logo_url: "https://upload.wikimedia.org/wikipedia/ar/thumb/2/23/Al_Ahly_SC_logo.svg/1200px-Al_Ahly_SC_logo.svg.png" },
  { name: "Zamalek SC", city: "Giza", founded_year: 1911, logo_url: "https://upload.wikimedia.org/wikipedia/ar/thumb/5/52/Zamalek_SC_logo.svg/1200px-Zamalek_SC_logo.svg.png" },
  { name: "Sporting Club", city: "Alexandria", founded_year: 1890, logo_url: "https://upload.wikimedia.org/wikipedia/ar/b/bb/Alex_Sporting_Club_Logo.png" },
  { name: "Smouha SC", city: "Alexandria", founded_year: 1949, logo_url: "https://upload.wikimedia.org/wikipedia/ar/1/1a/Smouha_SC_logo.png" },
  { name: "Al Ittihad", city: "Alexandria", founded_year: 1914, logo_url: "https://upload.wikimedia.org/wikipedia/ar/2/2b/Ittihad_Alexandria.png" }
];

const generatePlayers = (clubId, teamId, clubName) => {
  const players = [];
  // FIVB Roster Rules: Up to 14 players in active roster (typically 4 OH, 3-4 MB, 2 S, 2 OPP, 2 L)
  // Plus 6 reserve players (making 20 total)
  
  const positions = [
    // 14 Active
    "setter", "setter",
    "opposite", "opposite",
    "outside_hitter", "outside_hitter", "outside_hitter", "outside_hitter",
    "middle_blocker", "middle_blocker", "middle_blocker", "middle_blocker",
    "libero", "libero",
    // 6 Reserve
    "outside_hitter", "setter", "middle_blocker", "opposite", "defensive_specialist", "libero"
  ];

  for (let i = 0; i < 20; i++) {
    players.push({
      full_name: `${clubName.split(" ")[0]} Player ${i+1}`,
      jersey_number: i + 1,
      position: positions[i],
      club_id: clubId,
      team_id: teamId,
      height_cm: 185 + Math.floor(Math.random() * 25), // 185 - 210
      weight_kg: 80 + Math.floor(Math.random() * 20),
      nationality: "Egyptian",
      experience_level: i < 14 ? "professional" : "advanced",
      notes: JSON.stringify({ is_active_roster: i < 14 })
    });
  }
  return players;
};

export async function seedDatabase() {
  try {
    // 1. Create 5 Clubs
    const clubsPayload = CLUBS_DATA.map(c => ({ ...c, country: "Egypt" }));
    const { data: clubs, error: clubErr } = await supabase.from("clubs").insert(clubsPayload).select();
    if (clubErr) throw clubErr;

    // 2. Create Teams
    const teamsPayload = clubs.map(c => ({
      name: `${c.name} First Men`,
      club_id: c.id,
      age_category: "Senior",
      gender: "male"
    }));
    const { data: teams, error: teamErr } = await supabase.from("teams").insert(teamsPayload).select();
    if (teamErr) throw teamErr;

    // 3. Create Players for each team
    let allPlayers = [];
    for (const team of teams) {
      const clubName = clubs.find(c => c.id === team.club_id).name;
      allPlayers = allPlayers.concat(generatePlayers(team.club_id, team.id, clubName));
    }

    // Insert players in chunks to avoid large payload errors
    const chunkSize = 25;
    for (let i = 0; i < allPlayers.length; i += chunkSize) {
      const chunk = allPlayers.slice(i, i + chunkSize);
      const { error: pErr } = await supabase.from("players").insert(chunk);
      if (pErr) throw pErr;
    }

    // 4. Create a Match
    const ahlyTeam = teams.find(t => t.name.includes("Ahly"));
    const zamaTeam = teams.find(t => t.name.includes("Zamalek"));
    
    if (ahlyTeam && zamaTeam) {
      const { error: mErr } = await supabase.from("matches").insert([
        { 
          home_team_id: ahlyTeam.id, 
          set_scores: { away_team_id: zamaTeam.id },
          competition: "Egyptian Super League Final",
          venue: "Cairo Stadium Indoor Halls Complex",
          match_date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
          status: "scheduled"
        }
      ]);
      if (mErr) throw mErr;
    }

    alert("✅ Data seeded successfully! Added 5 Clubs, 5 Teams, 100 Players, and 1 Match. Please refresh the page.");
  } catch (e) {
    console.error("Seed Error:", e);
    alert("❌ Error seeding data: " + e.message);
  }
}
