import NoteHelpers from './NoteTypes';
import GAMESTATE, { gPlaying } from './GameState';
import { FOREACH_NONEMPTY_ROW_ALL_TRACKS } from './NoteData';

export class RhythmAssist {
    public static rowLastCrossed = -1;

    public static playTicks() {
        const metronome = true;
        const clap = true;

        // TODO: make this player position rather than overall song position
        // if things don't work properly
        const position = GAMESTATE.position;
        const positionSeconds = position.musicSeconds;

        // This next line is for playing sounds early so they come out on time.
        // Worry about that later. -Struz
        // positionSeconds += SOUNDMAN->GetPlayLatency() + (float)CommonMetrics::TICK_EARLY_SECONDS + 0.250f;
        const timing = gPlaying;
        if (timing === null) { return; }
        // const timing = GAMESTATE.curSteps[0].timingData;  // TODO: use player number if ever applicable
        const songBeat = timing.getBeatFromElapsedTimeNoOffset(positionSeconds);
        const songRow = Math.max(0, NoteHelpers.beatToNoteRowNotRounded(songBeat));
        if (songRow < RhythmAssist.rowLastCrossed) {
            this.rowLastCrossed = songRow;
        }

        // IMPORTANT: also do clap!!
        // IsJudgeableOnRow
        if (clap) {
            let clapRow = -1;
            // FOREACH_NONEMPTY_ROW_ALL_TRACKS_RANGE
            // IMPORTANT:
        }

        if (metronome && this.rowLastCrossed !== -1) {
            const lastCrossedMeasureIndex = {value: 0};
            const lastCrossedBeatIndex = {value: 0};
            const lastCrossedRowsRemainder = {value: 0};
            timing.noteRowToMeasureAndBeat(RhythmAssist.rowLastCrossed, lastCrossedMeasureIndex,
                lastCrossedBeatIndex, lastCrossedRowsRemainder);

            const currentMeasureIndex = {value: 0};
            const currentBeatIndex = {value: 0};
            const currentRowsRemainder = {value: 0};
            timing.noteRowToMeasureAndBeat(songRow, currentMeasureIndex,
                currentBeatIndex, currentRowsRemainder);

            let metronomeRow = -1;
            let changedMeasure = false;

            // If we crossed a measure or a beat, we need to make the metronome sound
            if (lastCrossedMeasureIndex.value !== currentMeasureIndex.value ||
                lastCrossedBeatIndex.value !== currentBeatIndex.value) {
                    metronomeRow = songRow - currentRowsRemainder.value;
                    changedMeasure = currentMeasureIndex.value - lastCrossedMeasureIndex.value > 0;
            }

            if (metronomeRow !== -1) {
                const tickBeat = NoteHelpers.noteRowToBeat(metronomeRow);
                const tickSecond = timing.getElapsedTimeFromBeatNoOffset(tickBeat);
                const secondsUntil = tickSecond - position.musicSeconds;
                // TODO: if we implement music rate, /= secondsUntil by the music rate

                // TODO: synchronisation / "play at time"
                if (changedMeasure) {
                    console.log('metronome measure');
                } else {
                    console.log('metronome beat');
                }
            }
        }
        RhythmAssist.rowLastCrossed = songRow;
    }
}
export default RhythmAssist;
