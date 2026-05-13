import { supabase } from "./supabase";

export async function seedDatabase() {
  try {
    // 1. Create 2 Clubs
    const { data: clubs, error: clubErr } = await supabase.from("clubs").insert([
      { name: "Al Ahly SC", country: "Egypt", city: "Cairo", founded_year: 1907, logo_url: "https://upload.wikimedia.org/wikipedia/ar/thumb/2/23/Al_Ahly_SC_logo.svg/1200px-Al_Ahly_SC_logo.svg.png" },
      { name: "Zamalek SC", country: "Egypt", city: "Giza", founded_year: 1911, logo_url: "https://upload.wikimedia.org/wikipedia/ar/thumb/5/52/Zamalek_SC_logo.svg/1200px-Zamalek_SC_logo.svg.png" }
    ]).select();
    if (clubErr) throw clubErr;

    const ahly = clubs.find(c => c.name.includes("Ahly"));
    const zamalek = clubs.find(c => c.name.includes("Zamalek"));

    // 2. Create Teams
    const { data: teams, error: teamErr } = await supabase.from("teams").insert([
      { name: "Ahly First Team", club_id: ahly.id, age_category: "Senior", gender: "male" },
      { name: "Zamalek First Team", club_id: zamalek.id, age_category: "Senior", gender: "male" }
    ]).select();
    if (teamErr) throw teamErr;

    const ahlyTeam = teams.find(t => t.club_id === ahly.id);
    const zamaTeam = teams.find(t => t.club_id === zamalek.id);

    // 3. Create Players for Ahly
    const ahlyPlayers = [
      { full_name: "Ahmed Salah", jersey_number: 4, position: "opposite", club_id: ahly.id, team_id: ahlyTeam.id },
      { full_name: "Abdallah Abdelsalam", jersey_number: 2, position: "setter", club_id: ahly.id, team_id: ahlyTeam.id },
      { full_name: "Abdelhalim Ebo", jersey_number: 10, position: "middle_blocker", club_id: ahly.id, team_id: ahlyTeam.id },
      { full_name: "Ahmed Kotb", jersey_number: 11, position: "outside_hitter", club_id: ahly.id, team_id: ahlyTeam.id },
      { full_name: "Mohamed Moawad", jersey_number: 14, position: "libero", club_id: ahly.id, team_id: ahlyTeam.id },
      { full_name: "Ahmed Said", jersey_number: 15, position: "outside_hitter", club_id: ahly.id, team_id: ahlyTeam.id },
    ];
    // Create Players for Zamalek
    const zamalekPlayers = [
      { full_name: "Reda Heikal", jersey_number: 12, position: "opposite", club_id: zamalek.id, team_id: zamaTeam.id },
      { full_name: "Ashraf Abouelhasan", jersey_number: 1, position: "setter", club_id: zamalek.id, team_id: zamaTeam.id },
      { full_name: "Rashad Shebl", jersey_number: 8, position: "middle_blocker", club_id: zamalek.id, team_id: zamaTeam.id },
      { full_name: "Mohamed Abdelmoneim", jersey_number: 9, position: "outside_hitter", club_id: zamalek.id, team_id: zamaTeam.id },
      { full_name: "Ahmed Fathy", jersey_number: 13, position: "libero", club_id: zamalek.id, team_id: zamaTeam.id },
      { full_name: "Mohamed Aly", jersey_number: 7, position: "outside_hitter", club_id: zamalek.id, team_id: zamaTeam.id },
    ];

    const { error: pErr1 } = await supabase.from("players").insert(ahlyPlayers);
    const { error: pErr2 } = await supabase.from("players").insert(zamalekPlayers);
    if (pErr1) throw pErr1;
    if (pErr2) throw pErr2;

    // 4. Create a Match
    const { error: mErr } = await supabase.from("matches").insert([
      { 
        home_team_id: ahlyTeam.id, 
        set_scores: { away_team_id: zamaTeam.id },
        competition: "Egyptian League Final",
        venue: "Cairo Stadium",
        match_date: new Date().toISOString(),
        status: "scheduled"
      }
    ]);
    if (mErr) throw mErr;

    alert("✅ Data seeded successfully! Please refresh the page.");
  } catch (e) {
    console.error("Seed Error:", e);
    alert("❌ Error seeding data: " + e.message);
  }
}
