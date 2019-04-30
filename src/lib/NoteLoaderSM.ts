// tslint:disable: no-console

import MsdFile from './MsdFile';
import Steps, { DisplayBPM } from './Steps';
import Song from './Song';
import { Helpers, Difficulty, StepsTypeInfos } from './GameConstantsAndTypes';
import TimingData from './TimingData';
import { ROWS_PER_BEAT, NoteHelpers } from './NoteTypes';
import { TimeSignatureSegment, DelaySegment } from './TimingSegments';

/**
 * The highest allowable speed before Warps come in.
 *
 * This was brought in from StepMania 4's recent betas.
 */
const FAST_BPM_WARP = 9999999;

/** The maximum file size for edits. */
const MAX_EDIT_STEPS_SIZE_BYTES	= 60 * 1024; // 60KB

// Functions used in function table below to set song data efficiently
type SongTimingInfo = Array<{[key: number]: number}>;
type SongParseFn = (info: SongTagInfo) => void;

interface SongTagInfo {
    song: Song;
    params: string[];
    bpmChanges: SongTimingInfo;
    stops: SongTimingInfo;
}

function SMSetTitle(info: SongTagInfo) {
    info.song.mainTitle = info.params[1];
}

function SMSetSubtitle(info: SongTagInfo) {
    info.song.subTitle = info.params[1];
}

function SMSetArtist(info: SongTagInfo) {
    info.song.artist = info.params[1];
}

function SMSetTitleTranslit(info: SongTagInfo) {
    info.song.mainTitleTranslit = info.params[1];
}

function SMSetSubtitleTranslit(info: SongTagInfo) {
    info.song.subTitleTranslit = info.params[1];
}

function SMSetArtistTranslit(info: SongTagInfo) {
    info.song.artistTranslit = info.params[1];
}
function SMSetGenre(info: SongTagInfo) {
    info.song.genre = info.params[1];
}
function SMSetCredit(info: SongTagInfo) {
    info.song.credit = info.params[1];
}
function SMSetBanner(info: SongTagInfo) {
    console.debug('Skipping parsing banner');
}
function SMSetBackground(info: SongTagInfo) {
    console.debug('Skipping parsing background file');
}
function SMSetLyricsPath(info: SongTagInfo) {
    console.debug('Skipping parsing lyrics path');
}
function SMSetCDTitle(info: SongTagInfo) {
    console.debug('Skipping parsing CD title');
}
function SMSetMusic(info: SongTagInfo) {
    console.debug('Skipping parsing music file');
}
function SMSetOffset(info: SongTagInfo) {
    info.song.songTiming.setOffset(Helpers.stringToFloat(info.params[1]));
}
function SMSetBPMs(info: SongTagInfo) {
    info.bpmChanges = [];
    info.bpmChanges = NoteLoaderSM.parseBpms(info.params[1]);
}
function SMSetStops(info: SongTagInfo) {
    info.stops = [];
    info.stops = NoteLoaderSM.parseStops(info.params[1]);
}
function SMSetDelays(info: SongTagInfo) {
    NoteLoaderSM.processDelays(info.song.songTiming, info.params[1]);
}
function SMSetTimeSignatures(info: SongTagInfo) {
    NoteLoaderSM.processTimeSignatures(info.song.songTiming, info.params[1]);
}
function SMSetTickCounts(info: SongTagInfo) {
    NoteLoaderSM.processTickcounts(info.song.songTiming, info.params[1]);
}
function SMSetInstrumentTrack(info: SongTagInfo) {
    // Implement this if it turns out to be important. It probably won't - Struz
    // info.loader->ProcessInstrumentTracks(*info.song, (*info.params)[1]);
}
function SMSetSampleStart(info: SongTagInfo) {
    info.song.musicSampleStartSec = Helpers.HHMMSSToSeconds(info.params[1]);
}
function SMSetSampleLength(info: SongTagInfo) {
    info.song.musicSampleLengthSec = Helpers.HHMMSSToSeconds(info.params[1]);
}
function SMSetDisplayBPM(info: SongTagInfo) {
    // #DISPLAYBPM:[xxx][xxx:xxx]|[*];
    if (info.params[1] == '*') {
        info.song.displayBpmType = DisplayBPM.RANDOM;
    } else {
        info.song.displayBpmType = DisplayBPM.SPECIFIED;
        info.song.specifiedBpmMin = Helpers.stringToFloat(info.params[1]);
        // No max specified
        if (info.params.length < 3 || info.params[2] === '') {
            info.song.specifiedBpmMax = info.song.specifiedBpmMin;
        } else {
            info.song.specifiedBpmMax = Helpers.stringToFloat(info.params[2]);
        }
    }
}
function SMSetSelectable(info: SongTagInfo) {
    // Implement this if it turns out to be important. It probably won't - Struz
}
function SMSetBGChanges(info: SongTagInfo) {
    // Implement this if it turns out to be important. It probably won't  - Struz
    // info.loader->ProcessBGChanges(*info.song, (*info.params)[0], info.path, (*info.params)[1]);
}
function SMSetFGChanges(info: SongTagInfo) {
   // Implement this if it turns out to be important. It probably won't - Struz
}
function SMSetKeysounds(info: SongTagInfo) {
    // Seems pretty useless for an online viewer - Struz
}
function SMSetAttacks(info: SongTagInfo) {
    // I don't even know what attacks are - Struz
    // info.loader->ProcessAttackString(info.song->m_sAttackString, (*info.params));
    // info.loader->ProcessAttacks(info.song->m_Attacks, (*info.params));
}

// Function table for setting song data efficiently
const songTagHandlers: Map<string, SongParseFn> = new Map([
    ['TITLE', SMSetTitle],
    ['SUBTITLE', SMSetSubtitle],
    ['ARTIST', SMSetArtist],
    ['TITLETRANSLIT', SMSetTitleTranslit],
    ['SUBTITLETRANSLIT', SMSetSubtitleTranslit],
    ['ARTISTTRANSLIT', SMSetArtistTranslit],
    ['GENRE', SMSetGenre],
    ['CREDIT', SMSetCredit],
    ['BANNER', SMSetBanner],
    ['BACKGROUND', SMSetBackground],
    // Save "#LYRICS" for later, so we can add an internal lyrics tag.
    ['LYRICSPATH', SMSetLyricsPath],
    ['CDTITLE', SMSetCDTitle],
    ['MUSIC', SMSetMusic],
    ['OFFSET', SMSetOffset],
    ['BPMS', SMSetBPMs],
    ['STOPS', SMSetStops],
    ['FREEZES', SMSetStops],
    ['DELAYS', SMSetDelays],
    ['TIMESIGNATURES', SMSetTimeSignatures],
    ['TICKCOUNTS', SMSetTickCounts],
    ['INSTRUMENTTRACK', SMSetInstrumentTrack],
    ['SAMPLESTART', SMSetSampleStart],
    ['SAMPLELENGTH', SMSetSampleLength],
    ['DISPLAYBPM', SMSetDisplayBPM],
    ['SELECTABLE', SMSetSelectable],
    // It's a bit odd to have the tag that exists for backwards compatibility
    // in this list and not the replacement, but the BGCHANGES tag has a
    // number on the end, allowing up to NUM_BackgroundLayer tags, so it
    // can't fit in the map. -Kyz
    ['ANIMATIONS', SMSetBGChanges],
    ['FGCHANGES', SMSetFGChanges],
    ['KEYSOUNDS', SMSetKeysounds],
    // Attacks loaded from file
    ['ATTACKS', SMSetAttacks],
    /* Tags that no longer exist, listed for posterity.  May their names
        * never be forgotten for their service to Stepmania. -Kyz
        * LASTBEATHINT: // unable to identify at this point: ignore
        * MUSICBYTES: // ignore
        * FIRSTBEAT: // cache tags from older SM files: ignore.
        * LASTBEAT: // cache tags from older SM files: ignore.
        * SONGFILENAME: // cache tags from older SM files: ignore.
        * HASMUSIC: // cache tags from older SM files: ignore.
        * HASBANNER: // cache tags from older SM files: ignore.
        * SAMPLEPATH: // SamplePath was used when the song has a separate preview clip. -aj
        * LEADTRACK: // XXX: Does anyone know what LEADTRACK is for? -Wolfman2000
        * MUSICLENGTH: // Loaded from the cache now. -Kyz
        */
]);

// Reads a song from a .sm file
export class NoteLoaderSM {
    public static parseBpms(line: string, rowsPerBeat: number = -1): SongTimingInfo {
        const songBpmInfo = [];

        const bpmChangeExpressions = line.split(',');
        for (const expression of bpmChangeExpressions) {
            const arrayBpmChangeValues = expression.split('=');
            if (arrayBpmChangeValues.length !== 2) {
                console.error(`.sm data has invalid #BPMs value "${expression}" (must have exactly one "="), ignored`);
                continue;
            }

            const beat = this.rowToBeat(arrayBpmChangeValues[0], rowsPerBeat);
            const newBpm = Helpers.stringToFloat(arrayBpmChangeValues[1]);
            if (newBpm === 0) {
                console.error(`.sm file has a 0 BPM; ignored`);
                continue;
            }
            songBpmInfo.push([beat, newBpm]);
        }
        return songBpmInfo;
    }

    /**
     * Parse Stops data from a string.
     * @param line the string in question.
     * @param rowsPerBeat the number of rows per beat for this purpose.
     */
    public static parseStops(line: string, rowsPerBeat: number = -1): SongTimingInfo {
        const songStopInfo = [];

        const arrayFreezeExpressions = line.split(',');
        for (const expression of arrayFreezeExpressions) {
            const arrayFreezeValues = expression.split('=');
            if (arrayFreezeValues.length !== 2) {
                console.error(`.sm data has invalid #STOPS value "${expression}" (must have exactly one "="), ignored`);
                continue;
            }

            const freezeBeat = this.rowToBeat(arrayFreezeValues[0], rowsPerBeat);
            const freezeSeconds = Helpers.stringToFloat(arrayFreezeValues[1]);
            if (freezeSeconds === 0) {
                console.error(`.sm file has a zero-length stop; ignored`);
                continue;
            }
            songStopInfo.push([freezeBeat, freezeSeconds]);
        }
        return songStopInfo;
    }

    /**
     * Process the Delay Segments from the string.
     * @param out the TimingData being modified.
     * @param line the string in question.
     * @param rowsPerBeat the number of rows per beat for this purpose.
     */
    public static processDelays(out: TimingData, line: string, rowsPerBeat: number = -1): void {
        const arrayDelayExpressions = line.split(',');
        for (const expression of arrayDelayExpressions) {
            const arrayDelayValues = expression.split('=');
            if (arrayDelayValues.length !== 2) {
// tslint:disable-next-line: max-line-length
                console.error(`.sm data has invalid #DELAYS value "${expression}" (must have exactly one "="), ignored`);
                continue;
            }

            const freezeBeat = this.rowToBeat(arrayDelayValues[0], rowsPerBeat);
            const freezeSeconds = Helpers.stringToFloat(arrayDelayValues[1]);
            if (freezeSeconds <= 0) {
                console.error(`.sm file has an invalid dealy at beat ${freezeBeat}, length ${freezeSeconds}}; ignored`);
                continue;
            }
            out.addSegment(new DelaySegment(NoteHelpers.beatToNoteRow(freezeBeat), freezeSeconds));
        }
    }

    /**
     * @brief Process the Time Signature Segments from the string.
     * @param out the TimingData being modified.
     * @param line the string in question.
     * @param rowsPerBeat the number of rows per beat for this purpose.
     */
    public static processTimeSignatures(out: TimingData, line: string, rowsPerBeat: number = -1): void {
        const vs1 = line.split(',');
        for (const s1 of vs1) {
            const vs2 = s1.split('=');
            if (vs2.length < 3) {
                console.error(`.sm data has invalid time signature change with ${vs2.length} values, ignored`);
                continue;
            }

            const beat = this.rowToBeat(vs2[0], rowsPerBeat);
            const numerator = Helpers.stringToInt(vs2[1]);
            const denominator = Helpers.stringToInt(vs2[2]);

            if (beat < 0) {
                console.error(`.sm data has invalid time signature change with beat ${beat}, ignored`);
                continue;
            }
            if (numerator < 1) {
// tslint:disable-next-line: max-line-length
                console.error(`.sm data has invalid time signature change with beat ${beat}, numerator ${numerator}, ignored`);
                continue;
            }
            if (denominator < 1) {
// tslint:disable-next-line: max-line-length
                console.error(`.sm data has invalid time signature change with beat ${beat}, denominator ${denominator}, ignored`);
                continue;
            }

            out.addSegment(new TimeSignatureSegment(NoteHelpers.beatToNoteRow(beat), numerator, denominator));
        }
    }

    /**
     * Process the Tickcount Segments from the string.
     * @param out the TimingData being modified.
     * @param line the string in question.
     * @param rowsPerBeat the number of rows per beat for this purpose.
     */
    public static processTickcounts(out: TimingData, line: string, rowsPerBeat: number = -1): void {
        const arrayTickcountExpressions = line.split(',');
        for (const expression of arrayTickcountExpressions) {
            const arrayTickcountValues = expression.split('=');
            if (arrayTickcountValues.length !== 2) {
// tslint:disable-next-line: max-line-length
                console.error(`.sm data has invalid #TICKCOUNTS value "${expression}" (must have exactly one "="), ignored`);
                continue;
            }

            const tickcountBeat = this.rowToBeat(arrayTickcountValues[0], rowsPerBeat);
            // TODO: emulate try/catch stuff
            // This parseInt is intended, as the source code used it and not the helper function here
            const ticks = parseInt(arrayTickcountValues[1], 10);
            if (isNaN(ticks)) {
                continue;
            }
            const clampedTicks = Helpers.clamp(ticks, 0, ROWS_PER_BEAT);
            // TODO: actually add the segment - I'm getting fucking sick of these - Struz
            // out.addSegment(new TickcountSegment(NoteHelpers.beatToNoteRow(tickcountBeat), ticks));
        }
    }

    /**
     * @brief Process BPM and stop segments from the data.
     * @param out the TimingData being modified.
     * @param vBPMs the vector of BPM changes.
     * @param vStops the vector of stops.
     */
    public static processBpmsAndStops(out: TimingData, bpms: SongTimingInfo, stops: SongTimingInfo): void {
        // Precondition: no BPM change or stop has 0 for its value (change.second).
        //     (The ParseBPMs and ParseStops functions make sure of this.)
        // Postcondition: all BPM changes, stops, and warps are added to the out
        //     parameter, already sorted by beat.
        // REMOVEME: Iterator declarations
        // Current BPM (positive or negative)
        let bpm = 0;
        // Beat at which the previous timing change occurred
        let prevbeat = 0;
        // Start/end of current warp (-1 if not currently warping)
        let warpstart = -1;
        let warpend = -1;
        // BPM prior to current warp, to detect if it has changed
        let prewarpbpm = 0;
        // How far off we have gotten due to negative changes
        let timeofs = 0;

        // Sort BPM changes and stops by beat. Order matters.
        // TODO: Make sorted lists a precondition rather than sorting them here.
        // The caller may know that the lists are sorted already (e.g. if
        // loaded from cache).
        // It's a list of pairs so we sort by the first value (beat).
        const compareFirst = (a: { [key: number]: number }, b: { [key: number]: number }): number => a[0] - b[0];
        bpms.sort(compareFirst);
        stops.sort(compareFirst);

        // NOTE: the following code was done with iterators in C++. This is my ugly interpretation.
        // TODO: once the tests are working change this to be more JavaScript-ey

        // Convert stops that come before beat 0.  All these really do is affect
        // where the arrows are with respect to the music, i.e. the song offset.
        // Positive stops subtract from the offset, and negative add to it.
        let stopIndex = 0;
        const stopMax = stops.length;
        for (const stopPair of stops) {
            if (stopPair[0] >= 0) {
                break;
            }
            out.adjustOffset(-stopPair[1]);
            stopIndex++;
        }

        // Get rid of BPM changes that come before beat 0.  Positive BPMs before
        // the chart don't really do anything, so we just ignore them.  Negative
        // BPMs cause unpredictable behavior, so ignore them as well and issue a
        // warning.
        let bpmIndex = 0;
        const bpmMax = bpms.length;
        for (const bpmPair of bpms) {
            if (bpmPair[0] >= 0) {
                break;
            }
            bpm = bpmPair[1];
            if (bpm < 0 && bpmPair[1] < 0) {
                console.debug('.sm data has a negative BPM prior to beat 0. These cause problems; ignoring.');
            }
            bpmIndex++; // Keep track of where we got to in negative bpms
        }

        // It's beat 0.  Do you know where your BPMs are?
        if (bpm === 0) {
            // Nope.  Can we just use the next BPM value?
            if (bpmIndex === bpmMax) {
                // Nope.
                bpm = 60;
                console.debug('.sm data has no valid BPMs. Defaulting to 60.');
            } else {
                // Yep. Get the next BPM.
                bpmIndex++;
                bpm = bpms[bpmIndex][1];
                console.debug('.sm data does not establish a BPM before beat 0. ' +
                              'Using the value from the next BPM change');
            }
        }
        // We always want to have an initial BPM.  If we start out warping, this
        // BPM will be added later.  If we start with a regular BPM, add it now.
        if (bpm > 0 && bpm <= FAST_BPM_WARP) {
            // IMPORTANT: Make BPMSegment a thing!!
            // out.addSegment(new BPMSegment(NoteHelpers.beatToNoteRow(0), bpm));
        }

        // Iterate over all BPMs and stops in tandem
        while (bpmIndex < bpmMax || stopIndex < stopMax) {
            // Get the next change in order, with BPMs taking precedence
            // when they fall on the same beat.
            const changeIsBpm = (stopIndex === stopMax) || 
                (bpmIndex !== bpmMax && bpms[bpmIndex][0] <= stops[stopIndex][0]);
            const change = changeIsBpm ? bpms[bpmIndex] : stops[stopIndex];

            // Calculate the effects of time at the current BPM.  "Infinite"
            // BPMs (SM4 warps) imply that zero time passes, so skip this
            // step in that case.
            if (bpm <= FAST_BPM_WARP) {
                timeofs += (change[0] - prevbeat) * 60 / bpm;

                // If we were in a warp and it finished during this
                // timeframe, create the warp segment.
                if (warpstart >= 0 && bpm > 0 && timeofs > 0) {
                    // timeofs represents how far past the end we are
                    warpend = change[0] - (timeofs * bpm / 60);
                    // IMPORTANT: make WarpSegment a thing
                    // out.addSegment(new WarpSegment(NoteHelpers.beatToNoteRow(warpstart),
                    //     warpend - warpstart));

                    // If the BPM changed during the warp, put that
                    // change at the beginning of the warp.
                    if (bpm !== prewarpbpm) {
                        // IMPORTANT: make BPMSegment a thing
                        //out.addSegment(new BPMSegment(NoteHelpers.beatToNoteRow(warpstart), bpm));
                    }
                    // No longer warping
                    warpstart = -1;
                }
            }

            // Save the current beat for the next round of calculations
            prevbeat = change[0];

            // Now handle the timing changes themselves
            if (changeIsBpm) {
                // Does this BPM change start a new warp?
                if (warpstart < 0 && (change[1] < 0 || change[1] > FAST_BPM_WARP)) {
                    // Yes.
                    warpstart = change[0];
                    prewarpbpm = bpm;
                    timeofs = 0;
                } else if (warpstart < 0) {
                    // No, and we aren't currently warping either.
                    // Just a normal BPM change.
                    // IMPORTANT: BPMSegment
                    // out.addSegment(new BPMSegment(NoteHelpers.beatToNoteRow(change[0]), change[1]));
                }
                bpm = change[1];
                bpmIndex++;
            } else {
                // Does this stop start a new warp?
                if (warpstart < 0 && change[1] < 0) {
                    // Yes.
                    warpstart = change[0];
                    prewarpbpm = bpm;
                    timeofs = change[1];
                } else if (warpstart < 0) {
                    // No, and we aren't currently warping either.
                    // Just a normal stop.
                    // IMPORTANT: make StopSegment a thing
                    // out.addSegment(new StopSegment(NoteHelpers.beatToNoteRow(change[0]), change[1]));
                } else {
                    // We're warping already. Stops affect the time
                    // offset directly.
                    timeofs += change[1];

                    // If a stop overcompensates for the time
                    // deficit, the warp ends and we stop for the
                    // amount it goes over.
                    if (change[1] > 0 && timeofs > 0) {
                        warpend = change[0];
                        // IMPORTANT: yada yada segments
                        // out.addSegment(new WarpSegment(NoteHelpers.beatToNoteRow(warpstart), warpend - warpstart));
                        // out.addSegment(new StopSegment(NoteHelpers.beatToNoteRow(change[0]), timeofs));

                        // Now, are we still warping because of
                        // the BPM value?
                        if (bpm < 0 || bpm > FAST_BPM_WARP) {
                            // Yep.
                            warpstart = change[0];
                            // prewarpbpm remains the same
                            timeofs = 0;
                        } else {
                            // Nope, warp is done.  Add any
                            // BPM change that happened in
                            // the meantime.
                            if (bpm !== prewarpbpm) {
                                // IMPORTANT: yada yada segments
                                // out.addSegment(new WarpSegment(NoteHelpers.beatToNoteRow(warpstart), bpm));
                            }
                            warpstart = -1;
                        }
                    }
                }
                stopIndex++;
            }
        }

        // If we are still warping, we now have to consider the time remaining
        // after the last timing change.
        if (warpstart >= 0) {
            // Will this warp ever end?
            if (bpm < 0 || bpm > FAST_BPM_WARP) {
                // No, so it ends the entire chart immediately.
                // XXX There must be a less hacky and more accurate way
                // to do this.
                warpend = 99999999;
            } else {
                // Yes. Figure out when it will end.
                warpend = prevbeat - (timeofs * bpm / 60);
            }
            // IMPORTANT: yada WarpSegment
            // out.addSegment(new WarpSegment(NoteHelpers.beatToNoteRow(warpstart),
            //     warpend - warpstart));

            // As usual, record any BPM change that happened during the warp
            if (bpm !== prewarpbpm) {
                // IMPORTANT: yada BPMSegment
                //out.addSegment(new BPMSegment(NoteHelpers.beatToNoteRow(warpstart), bpm));
            }
        }
    }

    /**
     * Convert a row value to the proper beat value.
     * This is primarily used for assistance with converting SMA files.
     * @param line The line that contains the value.
     * @param rowsPerBeat the number of rows per beat according to the original file.
     * @return the converted beat value.
     */
    public static rowToBeat(line: string, rowsPerBeat: number) {
        // Trim r and R characters from the sides of the string
// tslint:disable-next-line: max-line-length
        // Modifies .trim() polyfill at https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/trim
        const backup = line.replace(/^[rR]+|[rR]+$/g, '');
        // If r or R were present, there's multiple rows per beat
        if (backup !== line) {
            return Helpers.stringToFloat(line) / rowsPerBeat;
        }
        return Helpers.stringToFloat(line);
    }

    public static loadFromSimfile(msdFile: MsdFile): Song {
        const song = new Song();

        const reusedSongInfo: SongTagInfo = {
            song,
            params: [],
            bpmChanges: [],
            stops: [],
        };

        for (let i = 0; i < msdFile.getNumValues(); i++) {
            const numParams = msdFile.getNumParams(i);
            const params = msdFile.getValue(i);
            const valueName = params[0].toUpperCase();
            reusedSongInfo.params = params; // Ensure we're passing params in
            // IMPORTANT: based on tag name, do something different to parse it
            // In StepMania they use a map of functions?
            // IMPORTANT: we have the functions now - USE THEM
            // TODO: what is the difference betwen NotesLoaderSM::LoadFromSimfile and ::LoadNotesFromSimfile?
            // - LoadFromSimfile produces a Song

            const handler = songTagHandlers.get(valueName);
            if (handler !== undefined) {
                handler(reusedSongInfo);
                // We ignore #BGCHANGES.* because we don't care about backgrounds
            } else if (valueName === 'NOTES' || valueName === 'NOTES2') {
                if (numParams < 7) {
                    throw new Error(`.sm file has ${numParams} fields in a #NOTES tag, but should have at least 7.`);
                }

                const steps = this.loadFromTokens(
                    params[1],
                    params[2],
                    params[3],
                    params[4],
                    params[6],
                );
                song.addSteps(steps);
            }
        }
        if (!song.hasSteps()) {
            throw new Error('did not find step data for song');
        }
        // IMPORTANT: processbpm
        // IMPORTANT: write my own cascade of tidyUpData() functions and call them here
        // Cut out any things that aren't necessary.
        // Line 633 in Song.cpp is the motherload.
        // Read this file carefully! It has gems like not allowing multiple steps of the same StepsType and Difficulty.

        return song;
    }

    public static loadNoteDataFromSimfile(msdFile: MsdFile): Steps {
        for (let i = 0; i < msdFile.getNumValues(); i++) {
            const numParams = msdFile.getNumParams(i);
            const params = msdFile.getValue(i);
            const valueName = params[0].toUpperCase();

            // The only tag we care about is the #NOTES tag.
            if (valueName === 'NOTES' || valueName === 'NOTES2') {
                if (numParams < 7) {
                    throw new Error(`.sm file has ${numParams} fields in a #NOTES tag, but should have at least 7.`);
                }

                const stepsType: string = params[1].trim();
                const description: string = params[2].trim();
                let difficulty: string = params[3].trim();

                // Hack - if this is a .edit file, fudge the difficulty
                // TODO: we have no way to know this given the data pasted in, 
                // but StepMania does it by the .edit extension

                // Old version difficulty changes
                if (difficulty === 'smaniac') {
                    difficulty = 'Challenge';
                }
                if (difficulty === 'hard') {
                    if (description === 'smaniac' || description === 'challenge') {
                        difficulty = 'Challenge';
                    }
                }

                // TODO: something with setting the step type
                const noteData: string = params[6].trim();
                const steps = new Steps(noteData);

                // this.steps.SetSMNoteData(noteData) // Handles compressed data initialisation - note data is lazily loaded from this
                // this.steps.TidyUpData() // Handles invalid difficulties and other stuff
                return steps;
            }
        }
        throw new Error('could not find note data');
    }

    public static loadFromTokens(
        stepsType: string,
        description: string,
        difficulty: string,
        meter: string,
        noteData: string,
    ): Steps {
        const steps = new Steps(noteData);

        // Backwards compatibility hacks
        switch (stepsType) {
            case 'ez2-single-hard':
                stepsType = 'ez2-single';
                break;
            case 'para':
                stepsType = 'para-single';
                break;
        }

        // TODO: string to steps type
        steps.stepsType = Helpers.StringToStepsType(stepsType);
        steps.stepsTypeName = stepsType;
        steps.description = description;
        steps.credit = description; // This is often used for both
        steps.chartName = description; // One more for good measure
        steps.difficulty = Helpers.oldStyleStringToDifficulty(difficulty);

        // Handle hacks that originated back when StepMania didn't have
        // Difficulty_Challenge. (At least v1.64, possibly v3.0 final...)
        if (steps.difficulty === Difficulty.Hard) {
            if (description === 'smaniac' || description === 'challenge') {
                steps.difficulty = Difficulty.Challenge;
            }
        }
        if (steps.difficulty === Difficulty.Invalid) {
            steps.difficulty = Difficulty.Edit;
        }
        if (meter.length === 0) {
            meter = '1';
        }
        steps.meter = Helpers.stringToInt(meter);

        return steps;
    }
}
export default NoteLoaderSM;
