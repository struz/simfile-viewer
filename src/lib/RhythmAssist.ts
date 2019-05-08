import NoteHelpers from './NoteTypes';
import GAMESTATE, { gPlaying } from './GameState';

export class RhythmAssist {
    public static rowLastCrossed = -1;

    public static playTicks() {
        const metronome = true;

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

            console.log(`beat=${lastCrossedBeatIndex.value} measure=${lastCrossedMeasureIndex.value}`);

            let metronomeRow = -1;
            let isMeasure = false;

            // If we crossed a measure or a beat, we need to make the metronome sound
            if (lastCrossedMeasureIndex.value !== currentMeasureIndex.value ||
                lastCrossedBeatIndex.value !== currentBeatIndex.value) {
                    metronomeRow = songRow - currentRowsRemainder.value;
                    // I really wish I knew what this next line was supposed to do -Struz
                    isMeasure = currentBeatIndex.value === 0 && currentRowsRemainder.value === 0;
            }

            // TODO: this is wrong, metronome beats coming way too slowly
            // Seems to be only counting measures, not beats.
            if (isMeasure) { console.log('yeehaw'); }

            if (metronomeRow !== -1) {
                const tickBeat = NoteHelpers.noteRowToBeat(metronomeRow);
                const tickSecond = timing.getElapsedTimeFromBeatNoOffset(tickBeat);
                const secondsUntil = tickSecond - position.musicSeconds;
                // TODO: if we implement music rate, /= secondsUntil by the music rate

                // TODO: synchronisation / "play at time"
                if (isMeasure) {
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
