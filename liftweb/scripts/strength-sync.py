#!/usr/bin/env python3
"""
TimTam Strength Sync
Reads last 2 sessions per exercise, applies linear progression rules,
writes recommendations back to Supabase.
Run manually or after a workout is logged.
"""
import os
import sys
from datetime import datetime
from supabase import create_client, Client

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")

# Progression rules: exercise name -> increment in lbs
INCREMENTS = {
    "Clean": 2.5,
    "OHP": 2.5,
    "Bench": 5.0,
    "Squat": 5.0,
    "Romanian Deadlift": 5.0,
    "Pendlay Row": 5.0,
    "Pull-up": 2.5,  # Added weight
    "Face Pull": 2.5,  # When trivial
}


def get_last_sessions_for_exercise(supabase: Client, user_id: str, exercise_id: str, limit: int = 3):
    """Get the last N sessions that include this exercise, with their sets."""
    result = supabase.table("strength_sets")\
        .select("*, strength_sessions!inner(user_id, date)")\
        .eq("strength_sessions.user_id", user_id)\
        .eq("exercise_id", exercise_id)\
        .order("strength_sessions.date", desc=True)\
        .limit(limit * 10)\
        .execute()
    return result.data


def analyze_progression(exercise_name: str, recent_sets: list, current_rec_weight: float) -> dict:
    """
    Apply linear progression rules.
    Returns: {"weight": float, "reasoning": str}
    """
    if not recent_sets:
        return {
            "weight": current_rec_weight or 45.0,
            "reasoning": "No history -- starting weight, adjust as needed"
        }

    # Group by session date
    sessions = {}
    for s in recent_sets:
        date = s["strength_sessions"]["date"]
        if date not in sessions:
            sessions[date] = []
        sessions[date].append(s)

    sorted_dates = sorted(sessions.keys(), reverse=True)
    last_two = sorted_dates[:2]

    increment = INCREMENTS.get(exercise_name, 2.5)

    if len(last_two) >= 2:
        # Check if all reps completed in both sessions
        all_clean = all(
            s["completed"] for d in last_two for s in sessions[d]
        )
        if all_clean:
            new_weight = current_rec_weight + increment
            return {
                "weight": new_weight,
                "reasoning": f"All reps completed cleanly 2 sessions in a row -> progressing to {new_weight} lbs (+{increment})"
            }
        else:
            return {
                "weight": current_rec_weight,
                "reasoning": "Missed reps in recent session -> holding weight"
            }
    else:
        # Only 1 session -- check if it was clean
        last_sets = sessions[sorted_dates[0]]
        all_clean = all(s["completed"] for s in last_sets)
        if all_clean:
            return {
                "weight": current_rec_weight,
                "reasoning": "First session at this weight, completed cleanly -> hold and confirm next session"
            }
        else:
            return {
                "weight": current_rec_weight,
                "reasoning": "Missed reps -> holding weight"
            }


def run_sync(user_id: str = None):
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        print("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY env vars")
        return

    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    # Get all users if none specified
    if not user_id:
        users = supabase.table("strength_sessions")\
            .select("user_id")\
            .execute()
        user_ids = list(set(r["user_id"] for r in users.data))
    else:
        user_ids = [user_id]

    exercises = supabase.table("strength_exercises").select("*").execute().data

    results = []
    for uid in user_ids:
        for exercise in exercises:
            eid = exercise["id"]
            ename = exercise["name"]

            # Get current recommendation
            current = supabase.table("strength_recommendations")\
                .select("recommended_weight_lbs")\
                .eq("user_id", uid)\
                .eq("exercise_id", eid)\
                .maybe_single()\
                .execute()
            current_weight = current.data["recommended_weight_lbs"] if current.data else 0

            # Get recent sets
            recent_sets = get_last_sessions_for_exercise(supabase, uid, eid)

            # Apply progression
            prog = analyze_progression(ename, recent_sets, current_weight)

            # Upsert recommendation
            supabase.table("strength_recommendations").upsert({
                "user_id": uid,
                "exercise_id": eid,
                "recommended_weight_lbs": prog["weight"],
                "recommended_sets": exercise["default_sets"],
                "recommended_reps": exercise["default_reps"],
                "reasoning": prog["reasoning"],
                "generated_at": datetime.utcnow().isoformat()
            }, on_conflict="user_id,exercise_id").execute()

            results.append(f"  {ename}: {prog['weight']} lbs -- {prog['reasoning']}")
            print(f"  {ename}: {prog['weight']} lbs -- {prog['reasoning']}")

    print("\nSync complete.")
    return results


if __name__ == "__main__":
    uid = sys.argv[1] if len(sys.argv) > 1 else None
    run_sync(uid)
